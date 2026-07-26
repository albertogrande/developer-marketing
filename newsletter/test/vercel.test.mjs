// The serverless front door, driven the way Vercel drives it: a Web Request in,
// a Web Response out, through the actual api/*.js files.
//
// No platform involved — these import the function modules directly and call
// their exported fetch(). If the shim ever stops speaking enough of Node's http
// API for the routes, this fails here rather than in production.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DATA_DIR = mkdtempSync(join(tmpdir(), 'nl-vercel-'));
const SECRET = 'v'.repeat(48);
const SITE = 'https://example.test';

process.env.NEWSLETTER_SECRET = SECRET;
process.env.DATA_DIR = DATA_DIR;
process.env.NEWSLETTER_STORE = 'ndjson';
process.env.SITE_URL = SITE;
process.env.ALLOWED_ORIGINS = SITE;
process.env.PUBLIC_BASE_URL = 'https://example.test/api';
process.env.ADMIN_TOKEN = 'vercel-admin-token';
process.env.MAIL_DRY_RUN = '1';
process.env.MIN_FILL_MS = '1200';

const subscribe = (await import('../../api/subscribe.js')).default;
const confirm = (await import('../../api/confirm.js')).default;
const unsubscribe = (await import('../../api/unsubscribe.js')).default;
const health = (await import('../../api/health.js')).default;
const admin = (await import('../../api/admin/subscribers.js')).default;
const { sign } = await import('../lib/tokens.mjs');

const outbox = () => {
  try {
    return readdirSync(join(DATA_DIR, 'outbox'));
  } catch {
    return [];
  }
};

test('health answers through the function', async () => {
  const res = await health.fetch(new Request('https://example.test/api/health'));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.transport, 'dry-run');
});

test('a JSON signup works end to end', async () => {
  const res = await subscribe.fetch(
    new Request('https://example.test/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', origin: SITE },
      body: JSON.stringify({ email: 'serverless@example.com', source: '/resources' }),
    })
  );

  assert.equal(res.status, 202);
  assert.deepEqual(await res.json(), { ok: true, status: 'pending' });
  assert.equal(res.headers.get('access-control-allow-origin'), SITE, 'CORS headers survive the shim');

  // The body really reached the handler, and a confirmation really went out.
  const files = outbox();
  assert.equal(files.length, 1);
  const eml = readFileSync(join(DATA_DIR, 'outbox', files[0]), 'utf8');
  assert.match(eml, /To: serverless@example\.com/);
});

test('a form post redirects, with the Location header intact', async () => {
  const res = await subscribe.fetch(
    new Request('https://example.test/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'text/html' },
      body: new URLSearchParams({ email: 'nojs-serverless@example.com' }).toString(),
    })
  );

  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), `${SITE}/newsletter/check-your-inbox`);
});

test('the query string survives, so signed links work', async () => {
  // Pull the id straight from the list the previous test wrote.
  const line = readFileSync(join(DATA_DIR, 'subscribers.ndjson'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l))
    .find((r) => r.email === 'serverless@example.com');

  const token = sign(SECRET, 'confirm', line.id, 86400_000);
  const res = await confirm.fetch(
    new Request(`https://example.test/api/confirm?t=${encodeURIComponent(token)}`)
  );

  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), `${SITE}/newsletter/confirmed`);
});

test('one-click unsubscribe works through the function', async () => {
  const list = await admin.fetch(
    new Request('https://example.test/api/admin/subscribers', {
      headers: { authorization: 'Bearer vercel-admin-token' },
    })
  );
  const { subscribers } = await list.json();
  const target = subscribers.find((s) => s.email === 'serverless@example.com');
  assert.ok(target, 'confirmed and deliverable');

  const token = sign(SECRET, 'unsubscribe', target.id, 0);
  const res = await unsubscribe.fetch(
    new Request(`https://example.test/api/unsubscribe?t=${encodeURIComponent(token)}`, { method: 'POST' })
  );

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('an origin outside the allow-list is still refused', async () => {
  const res = await subscribe.fetch(
    new Request('https://example.test/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json', origin: 'https://evil.example' },
      body: JSON.stringify({ email: 'x@example.com' }),
    })
  );
  assert.equal(res.status, 403);
});

test('a preflight is answered without a body', async () => {
  const res = await subscribe.fetch(
    new Request('https://example.test/api/subscribe', { method: 'OPTIONS', headers: { origin: SITE } })
  );
  // 204 must carry no body, and fetch() enforces that — a shim that returned one
  // would throw here rather than in production.
  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
});

test('the wrong method on a route is refused, not misrouted', async () => {
  const res = await subscribe.fetch(new Request('https://example.test/api/subscribe'));
  assert.equal(res.status, 405);
});

test('the client IP comes from the proxy header, hashed', async () => {
  await subscribe.fetch(
    new Request('https://example.test/api/subscribe', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-forwarded-for': '203.0.113.9, 70.41.3.18',
      },
      body: JSON.stringify({ email: 'proxied@example.com' }),
    })
  );

  const record = readFileSync(join(DATA_DIR, 'subscribers.ndjson'), 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l))
    .findLast((r) => r.email === 'proxied@example.com');

  assert.ok(record.ipHash, 'rate limiting still has something to count');
  assert.ok(!record.ipHash.includes('203.0.113'), 'the address itself is never stored');
});
