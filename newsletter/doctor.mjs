#!/usr/bin/env node
// Preflight. Answers "can we send this ourselves?" by measuring, on this box,
// instead of arguing about it.
//
//   npm run newsletter:doctor
//
// Checks, in order of how likely each one is to be the thing that stops you:
//   1. config      — is anything obviously unset or too short to be a secret
//   2. authentication — SPF, DKIM, DMARC and MX on the sending domain
//   3. egress      — can this machine even reach a recipient's MX on port 25
//   4. identity    — public IP and its reverse DNS, which Gmail and Microsoft
//                    check before they read anything else
//   5. transport   — the configured relay actually accepts our credentials
//   6. volume      — what the list size means for free-tier caps and cost
//
// Sends nothing. Safe to run against production.

import { promises as dns } from 'node:dns';
import net from 'node:net';
import { config } from './lib/config.mjs';
import { openConfiguredStore, describeStore } from './lib/store-open.mjs';
import { SmtpClient } from './lib/smtp.mjs';

const PASS = 'ok  ';
const WARN = 'warn';
const FAIL = 'FAIL';
const INFO = '·   ';

const results = [];
function report(level, label, detail = '') {
  results.push({ level, label, detail });
  const line = `  ${level}  ${label}${detail ? ` — ${detail}` : ''}`;
  if (level === FAIL) console.error(line);
  else console.log(line);
}
const section = (title) => console.log(`\n${title}`);

// ---------------------------------------------------------------------------
// pure helpers — the parsing bits, exported so they can be tested
// ---------------------------------------------------------------------------

/** The one TXT record that is an SPF policy, or null. */
export function findSpf(records = []) {
  const flat = records.map((r) => (Array.isArray(r) ? r.join('') : String(r)));
  return flat.find((r) => /^v=spf1\b/i.test(r.trim())) ?? null;
}

/** What a DMARC record actually asks receivers to do. */
export function describeDmarc(record) {
  if (!record) return { present: false, policy: null, note: 'no _dmarc record' };
  const policy = (record.match(/\bp\s*=\s*(none|quarantine|reject)\b/i) || [])[1]?.toLowerCase() ?? null;
  const rua = /\brua\s*=/.test(record);
  if (!policy) return { present: true, policy: null, note: 'record present but no p= policy' };
  const note =
    policy === 'none'
      ? 'p=none only monitors; move to quarantine or reject once SPF and DKIM are aligned'
      : `p=${policy}`;
  return { present: true, policy, note: rua ? `${note}, with reporting` : `${note}, no rua= reporting address` };
}

/** Does the reverse DNS of an IP point back at a name that resolves to it? */
export function ptrMatches(ptr, forwardIps = [], ip = '') {
  if (!ptr) return false;
  return forwardIps.includes(ip);
}

/** Free-tier arithmetic. Weekly send, so ~4.3 issues a month. */
export function volumeAdvice(confirmed) {
  const monthly = Math.ceil(confirmed * 4.3);
  return {
    confirmed,
    monthly,
    // The daily cap is what bites first: a weekly send goes out in one day.
    exceedsResendFreeDaily: confirmed > 100,
    exceedsResendFreeMonthly: monthly > 3000,
    // SES is $0.10 per 1,000 recipients (checked 2026-07-26).
    sesMonthlyUsd: Math.round((monthly / 1000) * 0.1 * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// checks
// ---------------------------------------------------------------------------

async function checkConfig() {
  section('config');
  if (!config.secret) report(FAIL, 'NEWSLETTER_SECRET', 'unset — confirm and unsubscribe links cannot be signed');
  else if (config.secret.length < 32) report(FAIL, 'NEWSLETTER_SECRET', `${config.secret.length} chars, need 32+`);
  else report(PASS, 'NEWSLETTER_SECRET', `${config.secret.length} chars`);

  report(config.fromEmail.includes('@localhost') ? WARN : PASS, 'FROM_EMAIL', config.fromEmail);
  report(PASS, 'SITE_URL', config.siteUrl);
  report(
    process.env.PUBLIC_BASE_URL ? PASS : WARN,
    'PUBLIC_BASE_URL',
    process.env.PUBLIC_BASE_URL || 'unset — the sender needs it to mint unsubscribe links'
  );
  report(PASS, 'MAIL_TRANSPORT', config.transport);
  report(
    config.store === 'postgres' && !config.databaseUrl ? FAIL : PASS,
    'NEWSLETTER_STORE',
    config.store === 'postgres'
      ? config.databaseUrl
        ? 'postgres (DATABASE_URL set)'
        : 'postgres, but DATABASE_URL is unset'
      : `ndjson at ${config.dataDir} — needs a durable disk, so not serverless`
  );
  report(
    config.adminToken ? PASS : INFO,
    'ADMIN_TOKEN',
    config.adminToken ? 'set' : 'unset — /admin/* is disabled (fine unless the sender runs elsewhere)'
  );
  report(
    config.webhookSecret ? PASS : WARN,
    'WEBHOOK_SECRET',
    config.webhookSecret
      ? 'set — bounces and complaints will be honoured'
      : 'unset — every webhook is rejected, so dead addresses stay on the list'
  );
}

async function checkAuthentication(domain, selector) {
  section(`authentication for ${domain}`);
  try {
    const txt = await dns.resolveTxt(domain);
    const spf = findSpf(txt);
    if (!spf) report(FAIL, 'SPF', 'no v=spf1 record — most receivers will not trust this domain');
    else report(PASS, 'SPF', spf.length > 90 ? spf.slice(0, 90) + '…' : spf);
  } catch (err) {
    report(FAIL, 'SPF', `cannot resolve TXT for ${domain} (${err.code || err.message})`);
  }

  try {
    const txt = await dns.resolveTxt(`_dmarc.${domain}`);
    const record = txt.map((r) => r.join('')).find((r) => /^v=DMARC1\b/i.test(r.trim()));
    const dmarc = describeDmarc(record);
    report(dmarc.policy ? PASS : WARN, 'DMARC', dmarc.note);
  } catch {
    report(WARN, 'DMARC', 'no _dmarc record — add one, even p=none, before the first real send');
  }

  if (selector) {
    try {
      await dns.resolveTxt(`${selector}._domainkey.${domain}`);
      report(PASS, 'DKIM', `${selector}._domainkey.${domain} present`);
    } catch {
      report(FAIL, 'DKIM', `${selector}._domainkey.${domain} does not resolve`);
    }
  } else {
    report(INFO, 'DKIM', 'pass --dkim-selector <name> to check (Resend uses "resend")');
  }

  try {
    const mx = await dns.resolveMx(domain);
    report(PASS, 'MX', `${mx.length} record(s) — replies and bounces have somewhere to land`);
  } catch {
    report(WARN, 'MX', 'no MX — replies to the newsletter will bounce');
  }
}

/** Can this machine talk to a real recipient MX on port 25? */
async function checkEgress25() {
  section('port 25 egress (only needed to run our own MTA)');
  const target = { host: 'gmail-smtp-in.l.google.com', port: 25 };
  const open = await tcpProbe(target.host, target.port, 6000);
  if (open.ok) {
    report(PASS, 'outbound 25', `reached ${target.host} — a self-hosted MTA could deliver from here`);
  } else {
    report(
      WARN,
      'outbound 25',
      `${open.detail} — normal: most clouds block it (GCP permanently; DigitalOcean and Hetzner on request). Use a relay on 587.`
    );
  }

  const local = await tcpProbe('127.0.0.1', 25, 1500);
  report(
    local.ok ? PASS : INFO,
    'local MTA on 127.0.0.1:25',
    local.ok ? 'listening — SMTP_HOST=127.0.0.1 SMTP_PORT=25 would use it' : 'nothing listening'
  );
}

async function checkIdentity() {
  section('sending identity');
  const ip = await publicIp();
  if (!ip) {
    report(WARN, 'public IP', 'could not determine it (DNS to resolver1.opendns.com failed)');
    return;
  }
  report(INFO, 'public IP', ip);
  try {
    const names = await dns.reverse(ip);
    const name = names[0];
    let forward = [];
    try {
      forward = await dns.resolve4(name);
    } catch {
      /* a PTR pointing at a name with no A record is itself the finding */
    }
    if (ptrMatches(name, forward, ip)) report(PASS, 'reverse DNS', `${ip} → ${name} → ${ip}`);
    else report(WARN, 'reverse DNS', `${ip} → ${name}, which does not resolve back to it`);
  } catch {
    report(
      WARN,
      'reverse DNS',
      `${ip} has no PTR — Gmail and Microsoft reject direct mail from unnamed IPs. Irrelevant when using a relay.`
    );
  }
}

async function checkTransport() {
  section(`transport: ${config.transport}`);
  if (config.transport === 'dry-run') {
    report(INFO, 'dry run', 'no relay configured; messages are written to data/outbox');
    return;
  }

  if (config.transport === 'smtp') {
    const client = new SmtpClient({
      ...config.smtp,
      name: hostname(config.siteUrl),
      timeoutMs: Math.min(config.smtp.timeoutMs, 10_000),
    });
    try {
      await client.connect();
      const caps = [...client.capabilities].filter((c) => !c.startsWith('AUTH=')).slice(0, 6);
      report(PASS, 'SMTP handshake', `${config.smtp.host}:${config.smtp.port} · ${caps.join(' ') || 'no capabilities advertised'}`);
      if (config.smtp.user) report(PASS, 'SMTP credentials', 'accepted');
      else report(WARN, 'SMTP credentials', 'no SMTP_USER — fine only for a local relay that trusts this host');
      if (!config.smtp.secure && !client.capabilities.has('STARTTLS'))
        report(FAIL, 'TLS', 'the relay offers no STARTTLS');
    } catch (err) {
      report(FAIL, 'SMTP', err.message);
    } finally {
      await client.quit().catch(() => {});
    }
    return;
  }

  if (config.transport === 'resend') {
    try {
      const res = await fetch(`${config.resend.baseUrl.replace(/\/+$/, '')}/domains`, {
        headers: { authorization: `Bearer ${config.resend.apiKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        report(FAIL, 'Resend API key', `GET /domains returned ${res.status}`);
        return;
      }
      report(PASS, 'Resend API key', 'accepted');
      const body = await res.json().catch(() => ({}));
      const domains = body?.data ?? [];
      if (!domains.length) {
        report(FAIL, 'Resend domain', 'no domains added — Resend will not send as an unverified domain');
        return;
      }
      const from = config.fromEmail.split('@')[1];
      const match = domains.find((d) => d.name === from);
      if (!match) report(FAIL, 'Resend domain', `${from} is not among ${domains.map((d) => d.name).join(', ')}`);
      else
        report(
          match.status === 'verified' ? PASS : FAIL,
          'Resend domain',
          `${match.name} is ${match.status}`
        );
    } catch (err) {
      report(FAIL, 'Resend API', err.message);
    }
  }
}

async function checkVolume() {
  section('volume and cost');
  let confirmed = 0;
  try {
    const store = await openConfiguredStore(config);
    const stats = await store.stats();
    confirmed = stats.confirmed;
    report(
      INFO,
      'list',
      `${confirmed} confirmed, ${stats.pending} pending, ${stats.bounced + stats.complained} suppressed`
    );
  } catch (err) {
    report(INFO, 'list', `could not read ${config.dataDir} (${err.code || err.message})`);
  }

  const v = volumeAdvice(confirmed);
  report(INFO, 'weekly send', `${confirmed} messages per issue, ~${v.monthly} a month`);
  if (v.exceedsResendFreeDaily)
    report(
      WARN,
      'Resend free tier',
      `${confirmed} in one day exceeds the 100/day cap — Pro is $20/mo, or SES is ~$${v.sesMonthlyUsd.toFixed(2)}/mo at this volume`
    );
  else
    report(PASS, 'Resend free tier', `${confirmed}/day and ~${v.monthly}/mo fit inside 100/day and 3,000/mo`);
}

// ---------------------------------------------------------------------------
// plumbing
// ---------------------------------------------------------------------------

function tcpProbe(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok, detail) => {
      socket.destroy();
      resolve({ ok, detail });
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true, 'connected'));
    socket.once('timeout', () => done(false, 'timed out (blocked or filtered)'));
    socket.once('error', (err) => done(false, err.code || err.message));
  });
}

/** Ask OpenDNS what our egress address looks like from outside. No HTTP needed. */
async function publicIp() {
  try {
    const resolver = new dns.Resolver();
    resolver.setServers(['208.67.222.222']); // resolver1.opendns.com
    const [ip] = await resolver.resolve4('myip.opendns.com');
    return ip;
  } catch {
    return null;
  }
}

const hostname = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
};

async function main() {
  const args = process.argv.slice(2);
  const selector = args.includes('--dkim-selector') ? args[args.indexOf('--dkim-selector') + 1] : '';
  const domain = config.fromEmail.split('@')[1] || 'localhost';

  console.log('newsletter preflight — nothing is sent');

  await checkConfig();
  if (domain === 'localhost') {
    section('authentication');
    report(FAIL, 'sending domain', 'FROM_EMAIL has no real domain; set one you control');
  } else {
    await checkAuthentication(domain, selector);
  }
  await checkEgress25();
  await checkIdentity();
  await checkTransport();
  await checkVolume();

  const failed = results.filter((r) => r.level === FAIL).length;
  const warned = results.filter((r) => r.level === WARN).length;
  console.log(`\n${failed ? 'not ready' : warned ? 'ready, with warnings' : 'ready'}: ${failed} failed, ${warned} warnings`);
  if (failed) {
    console.log('Fix the failures before a real send. See newsletter/README.md.');
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
