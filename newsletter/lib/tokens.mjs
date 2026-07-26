// Signed, self-describing tokens for confirm and unsubscribe links.
//
// The list never appears in a URL: a token carries the subscriber's opaque id,
// the purpose it is valid for, and an expiry, all under one HMAC. That means a
// confirm link cannot be replayed as an unsubscribe link, a link cannot be
// edited to target someone else's id, and an old link stops working on its own.
//
//   v1.<purpose>.<subject>.<exp>.<sig>
//
// `exp` is a millisecond timestamp, or 0 for "never expires" — unsubscribe
// links must still work in an issue someone reads two years from now.

import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const VERSION = 'v1';
const b64url = (buf) => Buffer.from(buf).toString('base64url');

function signature(secret, payload) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * @param {string} secret
 * @param {'confirm'|'unsubscribe'} purpose
 * @param {string} subject   opaque subscriber id
 * @param {number} ttlMs     0 = never expires
 * @param {number} now       injectable clock, for tests
 */
export function sign(secret, purpose, subject, ttlMs = 0, now = Date.now()) {
  if (!secret) throw new Error('tokens.sign: missing secret');
  if (/[.]/.test(purpose)) throw new Error('tokens.sign: purpose cannot contain a dot');
  const exp = ttlMs > 0 ? now + ttlMs : 0;
  const payload = `${VERSION}.${purpose}.${b64url(subject)}.${exp}`;
  return `${payload}.${signature(secret, payload)}`;
}

/**
 * Verify a token for one specific purpose.
 * @returns {{ok: true, subject: string} | {ok: false, reason: string}}
 */
export function verify(secret, purpose, token, now = Date.now()) {
  if (!secret) throw new Error('tokens.verify: missing secret');
  if (typeof token !== 'string' || token.length > 512) return { ok: false, reason: 'malformed' };

  const parts = token.split('.');
  if (parts.length !== 5) return { ok: false, reason: 'malformed' };
  const [version, gotPurpose, subjectB64, expRaw, sig] = parts;
  if (version !== VERSION) return { ok: false, reason: 'version' };

  // Compare the MAC before trusting any field, including the purpose.
  const payload = `${version}.${gotPurpose}.${subjectB64}.${expRaw}`;
  const expected = signature(secret, payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: 'signature' };

  if (gotPurpose !== purpose) return { ok: false, reason: 'purpose' };

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < 0) return { ok: false, reason: 'malformed' };
  if (exp !== 0 && now > exp) return { ok: false, reason: 'expired' };

  const subject = Buffer.from(subjectB64, 'base64url').toString('utf8');
  if (!subject) return { ok: false, reason: 'malformed' };
  return { ok: true, subject };
}

/** Opaque subscriber id. Never derived from the address. */
export const newId = () => randomBytes(12).toString('base64url');

/**
 * Salted, one-way IP fingerprint for rate limiting. Keyed with the service
 * secret so the stored value is useless to anyone who reads the file, and
 * truncated because 96 bits is plenty to count with.
 */
export const hashIp = (secret, ip) =>
  createHmac('sha256', secret).update(`ip:${ip || ''}`).digest('base64url').slice(0, 16);
