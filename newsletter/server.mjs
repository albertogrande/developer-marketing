#!/usr/bin/env node
// The capture service. No framework, no dependencies.
//
//   POST /subscribe            take an address, send one confirmation
//   GET  /confirm?t=…          double opt-in lands here
//   GET|POST /unsubscribe?t=…  signed link, and RFC 8058 One-Click
//   POST /webhooks/resend      bounces and complaints, signature-verified
//   GET  /health               counts and which transport, for a monitor
//   GET  /admin/subscribers    the list, for the sender (bearer token)
//   POST /admin/suppress       the sender reporting a permanent rejection
//
// A static site cannot accept a POST, so this is the one piece that needs a host
// — a box, a container, or a serverless function with a database behind it. It is
// the whole reason the newsletter does not need Mailchimp.
//
//   NEWSLETTER_SECRET=$(openssl rand -hex 32) node newsletter/server.mjs
//
// See newsletter/README.md for deployment, TLS and systemd.

import http from 'node:http';
import { config, assertServerConfig, isDryRun } from './lib/config.mjs';
import { isValidEmail } from './lib/store.mjs';
import { openConfiguredStore, describeStore } from './lib/store-open.mjs';
import { sign, verify, hashIp } from './lib/tokens.mjs';
import { createTransport } from './lib/transport.mjs';
import { verifySvix, applyEvent } from './lib/webhooks.mjs';
import { confirmEmail } from './lib/templates.mjs';

const MAX_BODY = 8 * 1024;
const log = (...args) => console.log(new Date().toISOString(), ...args);

// ---------------------------------------------------------------------------
// rate limiting: fixed window per IP plus a service-wide ceiling
// ---------------------------------------------------------------------------
export function createLimiter({ perIp, windowMs, global }) {
  const hits = new Map();
  let windowStart = Date.now();
  let globalCount = 0;

  return function take(key) {
    const now = Date.now();
    if (now - windowStart > windowMs) {
      windowStart = now;
      globalCount = 0;
      hits.clear();
    }
    if (++globalCount > global) return { ok: false, reason: 'global' };
    const n = (hits.get(key) ?? 0) + 1;
    hits.set(key, n);
    return n > perIp ? { ok: false, reason: 'ip' } : { ok: true };
  };
}

// ---------------------------------------------------------------------------
// request helpers
// ---------------------------------------------------------------------------
function clientIp(req) {
  if (config.trustProxy) {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error('body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parseBody(raw, contentType = '') {
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

const wantsJson = (req) =>
  String(req.headers.accept || '').includes('application/json') ||
  String(req.headers['content-type'] || '').includes('application/json');

function cors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true; // curl, a mail client following a link, a health check
  const allowed = config.allowedOrigins.includes(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  return allowed;
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function redirect(res, url) {
  // 303: the browser must follow with GET even after a form POST.
  res.writeHead(303, { location: url, 'cache-control': 'no-store' });
  res.end();
}

// ---------------------------------------------------------------------------
// mail — one transactional message, the confirmation. The transport decides
// whether that goes over SMTP, over Resend's API, or into the outbox.
// ---------------------------------------------------------------------------
async function deliver(transport, { to, subject, text, html, headers }) {
  return transport.send({
    to,
    subject,
    text,
    html,
    headers: {
      'List-Id': `<${config.listId}>`,
      'Auto-Submitted': 'auto-generated',
      ...headers,
    },
  });
}

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------
async function handleSubscribe(req, res, store, limit, transport) {
  const asJson = wantsJson(req);
  let raw;
  try {
    raw = await readBody(req);
  } catch {
    // An 8KB form is not a subscriber; no stack trace needed.
    log('subscribe: body too large');
    return asJson
      ? json(res, 413, { ok: false, error: 'That request was too large.' })
      : redirect(res, config.siteUrl + '/newsletter');
  }
  const body = parseBody(raw, String(req.headers['content-type'] || ''));
  const done = (status, payload, redirectPath) =>
    asJson ? json(res, status, payload) : redirect(res, config.siteUrl + redirectPath);

  // Honeypot. A field no person sees, filled in only by something automated.
  if (body.website) {
    log('subscribe: honeypot');
    return done(202, { ok: true }, '/newsletter/check-your-inbox'); // look identical to success
  }

  // Speed trap. The form stamps its render time; a submit under a second is not
  // someone typing an address.
  const renderedAt = Number(body.rendered_at || 0);
  if (renderedAt > 0 && Date.now() - renderedAt < config.minFillMs) {
    log('subscribe: too fast');
    return done(202, { ok: true }, '/newsletter/check-your-inbox');
  }

  const ip = clientIp(req);
  const gate = limit(hashIp(config.secret, ip));
  if (!gate.ok) {
    log(`subscribe: rate limited (${gate.reason})`);
    return asJson
      ? json(res, 429, { ok: false, error: 'Too many attempts. Try again in a few minutes.' })
      : redirect(res, config.siteUrl + '/newsletter');
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    return asJson
      ? json(res, 400, { ok: false, error: 'That does not look like an email address.' })
      : redirect(res, config.siteUrl + '/newsletter');
  }

  const source = String(body.source || '').slice(0, 120);
  const { record, alreadyConfirmed } = await store.subscribe(email, {
    source,
    ipHash: hashIp(config.secret, ip),
  });

  // Someone already on the list gets nothing new — and the response is byte for
  // byte the same, so the endpoint cannot be used to test whether an address is
  // subscribed.
  if (!alreadyConfirmed) {
    const token = sign(config.secret, 'confirm', record.id, config.confirmTtlDays * 86400_000);
    const confirmUrl = `${publicBase()}/confirm?t=${encodeURIComponent(token)}`;
    const mail = confirmEmail({ siteUrl: config.siteUrl, confirmUrl });
    try {
      await deliver(transport, { to: email, ...mail, headers: { 'X-Auto-Response-Suppress': 'All' } });
    } catch (err) {
      log(`subscribe: send failed for ${email}: ${err.message}`);
      return asJson
        ? json(res, 502, { ok: false, error: 'Could not send the confirmation email. Try again shortly.' })
        : redirect(res, config.siteUrl + '/newsletter');
    }
  } else {
    log(`subscribe: already confirmed (no mail sent)`);
  }

  return done(202, { ok: true, status: 'pending' }, '/newsletter/check-your-inbox');
}

async function handleConfirm(req, res, url, store) {
  const result = verify(config.secret, 'confirm', url.searchParams.get('t') || '');
  if (!result.ok) {
    log(`confirm: rejected (${result.reason})`);
    return redirect(res, `${config.siteUrl}/newsletter?e=${result.reason}`);
  }
  const record = await store.confirm(result.subject);
  if (!record) return redirect(res, `${config.siteUrl}/newsletter?e=unknown`);
  log(`confirm: ${record.id}`);
  return redirect(res, `${config.siteUrl}/newsletter/confirmed`);
}

async function handleUnsubscribe(req, res, url, store) {
  // RFC 8058 one-click: the mail client POSTs, expects a 2xx, follows nothing.
  const oneClick = req.method === 'POST';
  if (oneClick) await readBody(req).catch(() => '');

  const result = verify(config.secret, 'unsubscribe', url.searchParams.get('t') || '');
  if (!result.ok) {
    log(`unsubscribe: rejected (${result.reason})`);
    if (oneClick) return json(res, 400, { ok: false });
    return redirect(res, `${config.siteUrl}/newsletter?e=${result.reason}`);
  }

  const record = await store.unsubscribe(result.subject);
  log(`unsubscribe: ${result.subject}${record ? '' : ' (unknown id)'}`);
  if (oneClick) return json(res, 200, { ok: true });
  return redirect(res, `${config.siteUrl}/newsletter/unsubscribed`);
}

async function handleAdmin(req, res, store) {
  const auth = String(req.headers.authorization || '');
  if (!config.adminToken || auth !== `Bearer ${config.adminToken}`) {
    return json(res, 404, { ok: false }); // 404, not 403: do not confirm it exists
  }
  const [stats, confirmed] = await Promise.all([store.stats(), store.confirmed()]);
  return json(res, 200, {
    updated: new Date().toISOString(),
    stats,
    // Only what the sender needs: an address and the id its unsubscribe token
    // is minted from. No IP hashes, no sources.
    subscribers: confirmed.map((r) => ({ email: r.email, id: r.id, confirmedAt: r.confirmedAt })),
  });
}

/**
 * Relay webhooks: a bounce or a complaint arriving after the send is over.
 *
 * Verified before it is believed — this endpoint suppresses addresses, so an
 * unauthenticated one would let a stranger cancel our readers one at a time. A
 * bad signature gets 401 and nothing is touched.
 */
async function handleWebhook(req, res, store) {
  let body;
  try {
    body = await readBody(req);
  } catch {
    return json(res, 413, { ok: false });
  }

  const check = verifySvix({ secret: config.webhookSecret, body, headers: req.headers });
  if (!check.ok) {
    log(`webhook: rejected (${check.reason})`);
    return json(res, 401, { ok: false, error: 'signature verification failed' });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return json(res, 400, { ok: false, error: 'body is not JSON' });
  }

  const result = await applyEvent(store, event);
  log(
    result.applied
      ? `webhook: ${result.action} → ${result.records.map((r) => `${r.email} is ${r.status}`).join(', ')}`
      : `webhook: ignored (${result.reason})`
  );
  // 200 either way once the signature is good: an event about someone who is not
  // on the list is not a failure, and a relay that gets a 4xx will retry forever.
  return json(res, 200, { ok: true, applied: result.applied, action: result.action ?? 'ignore' });
}

/**
 * The synchronous half of bounce handling. Over SMTP a dead mailbox is a 550 at
 * RCPT TO — known immediately, with no webhook involved — so the sender reports
 * it here when it is running somewhere else and has no direct access to the list.
 */
async function handleSuppress(req, res, store) {
  const auth = String(req.headers.authorization || '');
  if (!config.adminToken || auth !== `Bearer ${config.adminToken}`) {
    return json(res, 404, { ok: false });
  }

  let payload;
  try {
    payload = parseBody(await readBody(req), String(req.headers['content-type'] || ''));
  } catch {
    return json(res, 413, { ok: false });
  }

  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) return json(res, 400, { ok: false, error: 'email is required' });

  const permanent = payload.permanent === undefined ? true : /^(1|true|yes)$/i.test(String(payload.permanent));
  const record =
    payload.kind === 'complaint'
      ? await store.markComplained(email, { reason: String(payload.reason || '') })
      : await store.markBounced(email, { permanent, reason: String(payload.reason || '') });

  log(`suppress: ${email} → ${record ? record.status : 'not on the list'}`);
  return json(res, 200, { ok: true, status: record?.status ?? null });
}

// The externally reachable base for links we mint. Behind a reverse proxy the
// service listens on 127.0.0.1 but is published somewhere else entirely.
const publicBase = () => (process.env.PUBLIC_BASE_URL || `http://${config.host}:${config.port}`).replace(/\/+$/, '');

// ---------------------------------------------------------------------------
// routing
// ---------------------------------------------------------------------------

/**
 * The routes, as one Node-style handler. Extracted from createServer so the
 * same code serves both deployments: a long-lived HTTP server on a box, and a
 * serverless function on Vercel (see lib/vercel.mjs). One implementation, one
 * set of tests, two front doors.
 */
export function createRouter({ store, limit, transport: mail }) {
  return async function route(req, res) {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const allowed = cors(req, res);

    try {
      if (req.method === 'OPTIONS') {
        res.writeHead(allowed ? 204 : 403);
        return res.end();
      }

      if (path === '/health' && req.method === 'GET') {
        return json(res, 200, { ok: true, ...(await store.stats()), transport: mail.name, dryRun: isDryRun() });
      }

      if (path === '/subscribe') {
        if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
        if (req.headers.origin && !allowed) return json(res, 403, { ok: false, error: 'origin not allowed' });
        return await handleSubscribe(req, res, store, limit, mail);
      }

      if (path === '/confirm' && req.method === 'GET') return await handleConfirm(req, res, url, store);

      if (path === '/unsubscribe' && (req.method === 'GET' || req.method === 'POST'))
        return await handleUnsubscribe(req, res, url, store);

      if (path === '/admin/subscribers' && req.method === 'GET') return await handleAdmin(req, res, store);

      // Both halves of bounce handling: asynchronous (relay webhooks) and
      // synchronous (a 5xx the sender saw for itself).
      if (path === '/webhooks/resend' && req.method === 'POST') return await handleWebhook(req, res, store);
      if (path === '/admin/suppress' && req.method === 'POST') return await handleSuppress(req, res, store);

      return json(res, 404, { ok: false, error: 'not found' });
    } catch (err) {
      log(`error ${req.method} ${path}: ${err.stack || err.message}`);
      if (!res.headersSent) json(res, 500, { ok: false, error: 'internal error' });
      else res.end();
    }
  };
}

/** Everything the routes need, built once. Shared by both front doors. */
export async function createContext({ transport } = {}) {
  assertServerConfig();
  const store = await openConfiguredStore(config);
  const limit = createLimiter(config.rate);
  const mail = transport ?? createTransport(config, log);
  return { store, limit, transport: mail };
}

// ---------------------------------------------------------------------------
// server
// ---------------------------------------------------------------------------
export async function createServer({ transport } = {}) {
  const context = await createContext({ transport });
  const server = http.createServer(createRouter(context));
  return { server, store: context.store, transport: context.transport };
}

// Run directly (`node newsletter/server.mjs`), not when imported by a test.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { server, store, transport } = await createServer();
  server.listen(config.port, config.host, () => {
    log(`newsletter service on http://${config.host}:${config.port}`);
    log(`  links minted as ${publicBase()}/confirm?t=…`);
    log(`  store ${describeStore(store)}`);
    log(`  origins ${config.allowedOrigins.join(', ') || '(none)'}`);
    log(`  transport ${transport.name}`);
    if (isDryRun()) log('  DRY RUN — messages are written to data/outbox, not sent');
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
      log(`${signal} — draining`);
      server.close();
      await store.flush();
      await transport.close();
      process.exit(0);
    });
  }
}
