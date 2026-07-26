// Relay webhooks: the only way to learn about a bounce or a complaint that
// arrives minutes after a send, when the SMTP conversation is long over.
//
// Anyone can POST to a public URL, and this one suppresses addresses, so an
// unverified webhook is a way for a stranger to unsubscribe our readers one by
// one. Every request is authenticated before it is believed.
//
// Resend signs with Svix: the headers are svix-id, svix-timestamp and
// svix-signature, and the signed payload is "<id>.<timestamp>.<raw body>" under
// HMAC-SHA256 with the secret's base64 part (the bit after "whsec_"). The
// signature header holds space-separated "v1,<base64>" entries, because a secret
// can be rotated with both old and new valid for a while.

import { createHmac, timingSafeEqual } from 'node:crypto';

/** Reject anything older than this, so a captured request cannot be replayed. */
export const TIMESTAMP_TOLERANCE_S = 300;

/**
 * @param {object} args
 * @param {string} args.secret     the whsec_… signing secret
 * @param {string} args.body       the raw request body, byte for byte
 * @param {Record<string,string>} args.headers
 * @param {number} [args.now]      injectable clock, in ms
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
export function verifySvix({ secret, body, headers = {}, now = Date.now() }) {
  if (!secret) return { ok: false, reason: 'no signing secret configured' };

  const header = (name) => headers[name] ?? headers[name.toLowerCase()] ?? '';
  const id = String(header('svix-id'));
  const timestamp = String(header('svix-timestamp'));
  const signatures = String(header('svix-signature'));
  if (!id || !timestamp || !signatures) return { ok: false, reason: 'missing svix headers' };

  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return { ok: false, reason: 'bad timestamp' };
  if (Math.abs(now / 1000 - sentAt) > TIMESTAMP_TOLERANCE_S) return { ok: false, reason: 'stale timestamp' };

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  const expectedBuf = Buffer.from(expected);

  // Any listed signature may match: a rotated secret has two valid for a while.
  for (const entry of signatures.split(' ')) {
    const [version, value] = entry.split(',');
    if (version !== 'v1' || !value) continue;
    const got = Buffer.from(value);
    if (got.length === expectedBuf.length && timingSafeEqual(got, expectedBuf)) return { ok: true };
  }
  return { ok: false, reason: 'signature mismatch' };
}

/**
 * Normalise a relay's event into the one decision that matters: does this
 * address stay on the list?
 *
 * Resend's shapes (https://resend.com/docs/dashboard/webhooks/event-types):
 *   email.bounced    → data.bounce.type "Permanent" | "Transient" | "Undetermined"
 *   email.complained → a spam report, which is a harder no than unsubscribing
 * Anything else — delivered, sent, delayed, opened, clicked — is ignored. We do
 * not record opens or clicks even when a relay offers to tell us.
 */
export function classifyEvent(event) {
  const type = String(event?.type || '');
  const to = []
    .concat(event?.data?.to ?? [])
    .map((address) => String(address || '').trim().toLowerCase())
    .filter(Boolean);

  if (!to.length) return { action: 'ignore', reason: `${type || 'event'} without a recipient` };

  if (type === 'email.bounced') {
    const bounce = event.data.bounce ?? {};
    const kind = String(bounce.type || 'Undetermined');
    return {
      action: 'bounce',
      to,
      // Only "Permanent" suppresses on the first report. Transient failures get
      // counted, and a run of them suppresses on its own.
      permanent: /^permanent$/i.test(kind),
      reason: [kind, bounce.subType, bounce.message].filter(Boolean).join(' · ').slice(0, 300),
    };
  }

  if (type === 'email.complained') {
    return { action: 'complaint', to, reason: 'spam complaint reported by the mailbox provider' };
  }

  return { action: 'ignore', reason: `${type} carries nothing we act on` };
}

/**
 * Apply one event to the list. Returns what happened, for the log.
 * An address we do not hold is not an error: relays retry, and a reader may have
 * already been pruned.
 */
export async function applyEvent(store, event) {
  const verdict = classifyEvent(event);
  if (verdict.action === 'ignore') return { applied: false, ...verdict };

  const applied = [];
  for (const address of verdict.to) {
    const record =
      verdict.action === 'bounce'
        ? await store.markBounced(address, { permanent: verdict.permanent, reason: verdict.reason })
        : await store.markComplained(address, { reason: verdict.reason });
    if (record) applied.push({ email: record.email, status: record.status });
  }
  return { applied: applied.length > 0, action: verdict.action, records: applied, reason: verdict.reason };
}
