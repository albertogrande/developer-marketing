// End-to-end tests for the capture service: a real HTTP server, a real store
// on a temp directory, and mail written to an outbox instead of sent.
//
// The config module reads the environment once at import time, so every env var
// is set before the dynamic imports below.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DATA_DIR = mkdtempSync(join(tmpdir(), 'nl-server-'));
const SECRET = 's'.repeat(48);
const SITE = 'https://example.test/developer-marketing';

process.env.NEWSLETTER_SECRET = SECRET;
process.env.DATA_DIR = DATA_DIR;
process.env.SITE_URL = SITE;
process.env.ALLOWED_ORIGINS = 'https://example.test';
process.env.PUBLIC_BASE_URL = 'https://list.example.test';
process.env.ADMIN_TOKEN = 'admin-token-for-tests';
process.env.MAIL_DRY_RUN = '1';
process.env.RATE_PER_IP = '500';
process.env.MIN_FILL_MS = '1200';
process.env.WEBHOOK_SECRET = 'whsec_' + Buffer.from('test webhook signing secret').toString('base64');

const { createServer, createLimiter } = await import('../server.mjs');
const { sign } = await import('../lib/tokens.mjs');
const { createHmac } = await import('node:crypto');

const { server, store } = await createServer();
const port = await new Promise((resolve) =>
  server.listen(0, '127.0.0.1', () => resolve(server.address().port))
);
const base = `http://127.0.0.1:${port}`;

test.after(() => {
  // closeAllConnections too: fetch keeps sockets pooled, and a live socket
  // would hold the test process open after the last assertion.
  server.closeAllConnections?.();
  server.close();
});

const post = (path, body, headers = {}) =>
  fetch(base + path, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
    body: JSON.stringify(body),
  });

const outbox = () => {
  try {
    return readdirSync(join(DATA_DIR, 'outbox'));
  } catch {
    return [];
  }
};

test('health reports the counts and which pipe is in use', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.dryRun, true);
  assert.equal(body.transport, 'dry-run', 'so a misconfigured relay is visible from a monitor');
});

test('subscribing stores a pending record and writes one confirmation', async () => {
  const before = outbox().length;
  const res = await post('/subscribe', { email: 'Reader@Example.com', source: '/weekly' });
  assert.equal(res.status, 202);
  assert.deepEqual(await res.json(), { ok: true, status: 'pending' });

  const record = (await store.get('reader@example.com'));
  assert.equal(record.status, 'pending');
  assert.equal(record.source, '/weekly');
  assert.ok(record.ipHash && !record.ipHash.includes('127.0.0.1'), 'the raw IP is never stored');

  const files = outbox();
  assert.equal(files.length, before + 1);
  const eml = readFileSync(join(DATA_DIR, 'outbox', files.at(-1)), 'utf8');
  assert.match(eml, /Subject: Confirm your subscription/);
  assert.match(eml, /https:\/\/list\.example\.test\/confirm\?t=/);
  assert.ok(!/<img/i.test(eml), 'no tracking pixel');
});

test('the honeypot looks exactly like success and stores nothing', async () => {
  const before = outbox().length;
  const res = await post('/subscribe', { email: 'bot@example.com', website: 'https://spam.example' });
  assert.equal(res.status, 202);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal((await store.get('bot@example.com')), undefined);
  assert.equal(outbox().length, before, 'no mail is sent for a honeypot hit');
});

test('a submit faster than a human can type is dropped', async () => {
  const res = await post('/subscribe', { email: 'fast@example.com', rendered_at: Date.now() });
  assert.equal(res.status, 202);
  assert.equal((await store.get('fast@example.com')), undefined);
});

test('a plausible fill time is accepted', async () => {
  const res = await post('/subscribe', { email: 'human@example.com', rendered_at: Date.now() - 5000 });
  assert.equal(res.status, 202);
  assert.equal((await store.get('human@example.com')).status, 'pending');
});

test('an invalid address is rejected', async () => {
  const res = await post('/subscribe', { email: 'not-an-address' });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error, /does not look like an email/);
});

test('a form post without JavaScript redirects instead of answering JSON', async () => {
  const res = await fetch(`${base}/subscribe`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
    body: new URLSearchParams({ email: 'nojs@example.com', source: '/' }).toString(),
  });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), `${SITE}/newsletter/check-your-inbox`);
  assert.equal((await store.get('nojs@example.com')).status, 'pending');
});

test('an origin outside the allow-list is refused', async () => {
  const res = await post('/subscribe', { email: 'x@example.com' }, { origin: 'https://evil.example' });
  assert.equal(res.status, 403);
  assert.equal(res.headers.get('access-control-allow-origin'), null);
});

test('the site origin is allowed and echoed back', async () => {
  const res = await post('/subscribe', { email: 'allowed@example.com' }, { origin: 'https://example.test' });
  assert.equal(res.status, 202);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://example.test');
  assert.equal(res.headers.get('vary'), 'Origin');
});

test('confirming moves the record and lands on the confirmed page', async () => {
  const record = (await store.get('reader@example.com'));
  const token = sign(SECRET, 'confirm', record.id, 86400_000);
  const res = await fetch(`${base}/confirm?t=${encodeURIComponent(token)}`, { redirect: 'manual' });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), `${SITE}/newsletter/confirmed`);
  assert.equal((await store.get('reader@example.com')).status, 'confirmed');
});

test('a tampered or wrong-purpose token is refused', async () => {
  const record = (await store.get('human@example.com'));
  const unsubToken = sign(SECRET, 'unsubscribe', record.id, 0);
  const res = await fetch(`${base}/confirm?t=${encodeURIComponent(unsubToken)}`, { redirect: 'manual' });
  assert.equal(res.status, 303);
  assert.match(res.headers.get('location'), /\/newsletter\?e=purpose$/);
  assert.equal((await store.get('human@example.com')).status, 'pending', 'still not confirmed');
});

test('re-subscribing a confirmed address sends nothing and leaks nothing', async () => {
  const before = outbox().length;
  const res = await post('/subscribe', { email: 'reader@example.com' });
  assert.equal(res.status, 202);
  assert.deepEqual(await res.json(), { ok: true, status: 'pending' }, 'same response as a new address');
  assert.equal(outbox().length, before);
  assert.equal((await store.get('reader@example.com')).status, 'confirmed', 'delivery is not suspended');
});

test('the sender can read the confirmed list with the admin token', async () => {
  const anon = await fetch(`${base}/admin/subscribers`);
  assert.equal(anon.status, 404, 'no token: the endpoint does not admit to existing');

  const res = await fetch(`${base}/admin/subscribers`, {
    headers: { authorization: 'Bearer admin-token-for-tests' },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.subscribers.every((s) => s.email && s.id));
  assert.ok(body.subscribers.every((s) => !('ipHash' in s)), 'IP hashes never leave the box');
  assert.ok(body.subscribers.some((s) => s.email === 'reader@example.com'));
});

test('one-click unsubscribe answers 200 and removes the reader', async () => {
  const record = (await store.get('reader@example.com'));
  const token = sign(SECRET, 'unsubscribe', record.id, 0);
  const res = await fetch(`${base}/unsubscribe?t=${encodeURIComponent(token)}`, { method: 'POST' });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal((await store.get('reader@example.com')).status, 'unsubscribed');

  const list = await (
    await fetch(`${base}/admin/subscribers`, { headers: { authorization: 'Bearer admin-token-for-tests' } })
  ).json();
  assert.ok(!list.subscribers.some((s) => s.email === 'reader@example.com'));
});

test('clicking an unsubscribe link lands on the unsubscribed page', async () => {
  const { record } = await store.subscribe('leaving@example.com');
  await store.confirm(record.id);
  const token = sign(SECRET, 'unsubscribe', record.id, 0);
  const res = await fetch(`${base}/unsubscribe?t=${encodeURIComponent(token)}`, { redirect: 'manual' });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), `${SITE}/newsletter/unsubscribed`);
});

test('a signed bounce webhook suppresses the reader', async () => {
  const { record } = await store.subscribe('bouncer@example.com');
  await store.confirm(record.id);

  const body = JSON.stringify({
    type: 'email.bounced',
    data: { to: ['bouncer@example.com'], bounce: { type: 'Permanent', message: 'no such user' } },
  });
  const id = 'msg_test';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const key = Buffer.from(process.env.WEBHOOK_SECRET.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');

  const res = await fetch(`${base}/webhooks/resend`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': `v1,${signature}`,
    },
    body,
  });

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, applied: true, action: 'bounce' });
  assert.equal((await store.get('bouncer@example.com')).status, 'bounced');
});

test('an unsigned webhook cannot cancel a reader', async () => {
  const { record } = await store.subscribe('safe@example.com');
  await store.confirm(record.id);

  const res = await fetch(`${base}/webhooks/resend`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'email.bounced', data: { to: ['safe@example.com'], bounce: { type: 'Permanent' } } }),
  });

  assert.equal(res.status, 401);
  assert.equal((await store.get('safe@example.com')).status, 'confirmed', 'untouched');
});

test('the sender can report a permanent rejection it saw for itself', async () => {
  const { record } = await store.subscribe('rejected@example.com');
  await store.confirm(record.id);

  const anon = await fetch(`${base}/admin/suppress`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'rejected@example.com' }),
  });
  assert.equal(anon.status, 404, 'no token, no suppression');
  assert.equal((await store.get('rejected@example.com')).status, 'confirmed');

  const res = await fetch(`${base}/admin/suppress`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer admin-token-for-tests' },
    body: JSON.stringify({ email: 'rejected@example.com', reason: '550 5.1.1 unknown' }),
  });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, status: 'bounced' });
  assert.equal((await store.get('rejected@example.com')).bounceReason, '550 5.1.1 unknown');
});

test('prune drops stale pending records and keeps everyone else', async () => {
  // Two pending records aged past any TTL, one confirmed reader, one fresh
  // pending — only the stale pending pair may go.
  const old = new Date(Date.now() - 30 * 86_400_000);
  await store.subscribe('stale-a@example.com', { now: old });
  await store.subscribe('stale-b@example.com', { now: old });
  const { record: keeper } = await store.subscribe('keeper@example.com', { now: old });
  await store.confirm(keeper.id);
  await store.subscribe('fresh@example.com');

  const anon = await fetch(`${base}/admin/prune`, { method: 'POST' });
  assert.equal(anon.status, 404, 'no token, no prune — and no hint the route exists');

  const res = await fetch(`${base}/admin/prune`, {
    method: 'POST',
    headers: { authorization: 'Bearer admin-token-for-tests' },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.pruned >= 2, `at least the two stale records go (got ${body.pruned})`);
  assert.equal(await store.get('stale-a@example.com'), undefined);
  assert.equal(await store.get('stale-b@example.com'), undefined);
  assert.equal((await store.get('keeper@example.com')).status, 'confirmed');
  assert.equal((await store.get('fresh@example.com')).status, 'pending');
});

test('unknown routes and wrong methods are refused', async () => {
  assert.equal((await fetch(`${base}/nope`)).status, 404);
  assert.equal((await fetch(`${base}/subscribe`)).status, 405);
});

test('an oversized body cannot exhaust memory', async () => {
  const res = await fetch(`${base}/subscribe`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email: 'huge@example.com', source: 'x'.repeat(64 * 1024) }),
  }).catch((err) => ({ status: 0, err }));
  // Either refused outright or the connection is cut: both fine. What matters
  // is that the read stopped early and nothing was stored.
  assert.notEqual(res.status, 202);
  assert.equal((await store.get('huge@example.com')), undefined);
});

test('the rate limiter caps per IP', () => {
  const take = createLimiter({ perIp: 2, windowMs: 60_000, global: 1000 });
  assert.equal(take('a').ok, true);
  assert.equal(take('a').ok, true);
  assert.equal(take('a').reason, 'ip', 'third attempt from the same IP');
  assert.equal(take('b').ok, true, 'a different IP is unaffected');
});

test('the rate limiter caps the whole service', () => {
  const take = createLimiter({ perIp: 100, windowMs: 60_000, global: 2 });
  assert.equal(take('a').ok, true);
  assert.equal(take('b').ok, true);
  assert.equal(take('c').reason, 'global', 'the ceiling applies across every caller');
});

test('the rate-limit window reopens', async () => {
  const take = createLimiter({ perIp: 1, windowMs: 20, global: 1000 });
  assert.equal(take('a').ok, true);
  assert.equal(take('a').reason, 'ip');
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(take('a').ok, true, 'a new window starts clean');
});
