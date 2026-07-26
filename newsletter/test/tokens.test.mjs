import test from 'node:test';
import assert from 'node:assert/strict';
import { sign, verify, newId, hashIp } from '../lib/tokens.mjs';

const SECRET = 'x'.repeat(48);

test('a signed token round-trips', () => {
  const token = sign(SECRET, 'confirm', 'sub-123');
  assert.deepEqual(verify(SECRET, 'confirm', token), { ok: true, subject: 'sub-123' });
});

test('a confirm token is not an unsubscribe token', () => {
  const token = sign(SECRET, 'confirm', 'sub-123');
  assert.equal(verify(SECRET, 'unsubscribe', token).reason, 'purpose');
});

test('another secret cannot verify', () => {
  const token = sign(SECRET, 'confirm', 'sub-123');
  assert.equal(verify('y'.repeat(48), 'confirm', token).reason, 'signature');
});

test('the subject cannot be swapped', () => {
  const token = sign(SECRET, 'unsubscribe', 'victim');
  const [v, purpose, , exp, sig] = token.split('.');
  const forged = [v, purpose, Buffer.from('someone-else').toString('base64url'), exp, sig].join('.');
  assert.equal(verify(SECRET, 'unsubscribe', forged).reason, 'signature');
});

test('the expiry cannot be extended', () => {
  const now = 1_000_000;
  const token = sign(SECRET, 'confirm', 'sub', 1000, now);
  const parts = token.split('.');
  parts[3] = String(now + 10_000_000);
  assert.equal(verify(SECRET, 'confirm', parts.join('.'), now).reason, 'signature');
});

test('expiry is enforced', () => {
  const now = 1_000_000;
  const token = sign(SECRET, 'confirm', 'sub', 1000, now);
  assert.equal(verify(SECRET, 'confirm', token, now + 500).ok, true);
  assert.equal(verify(SECRET, 'confirm', token, now + 1001).reason, 'expired');
});

test('unsubscribe links never expire — an old issue must still work', () => {
  const token = sign(SECRET, 'unsubscribe', 'sub', 0, 0);
  const tenYears = 10 * 365 * 86400_000;
  assert.equal(verify(SECRET, 'unsubscribe', token, tenYears).ok, true);
});

test('malformed input is rejected, not thrown', () => {
  for (const bad of ['', 'nope', 'a.b.c.d', 'v1.confirm.x.0', 'v2.confirm.x.0.sig', 'x'.repeat(600)]) {
    const result = verify(SECRET, 'confirm', bad);
    assert.equal(result.ok, false, `expected rejection for ${JSON.stringify(bad.slice(0, 20))}`);
  }
});

test('ids are unique and url-safe', () => {
  const ids = new Set(Array.from({ length: 500 }, newId));
  assert.equal(ids.size, 500);
  for (const id of ids) assert.match(id, /^[A-Za-z0-9_-]+$/);
});

test('ip hashes are stable, salted and truncated', () => {
  const a = hashIp(SECRET, '198.51.100.7');
  assert.equal(a, hashIp(SECRET, '198.51.100.7'));
  assert.notEqual(a, hashIp('other-secret-'.padEnd(48, 'z'), '198.51.100.7'));
  assert.equal(a.length, 16);
  assert.ok(!a.includes('198'));
});
