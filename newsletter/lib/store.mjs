// The list, kept in an append-only NDJSON log and replayed into a Map on start.
//
// A subscriber list is small (tens of thousands of rows at the very most) and
// must never lose a write, so this is a log, not a database: every state change
// appends one JSON line and the last line for an address wins. That makes the
// file greppable, diffable, trivially backed up with cp, and recoverable by hand
// if something ever goes wrong at 3am.
//
// Concurrency: all writes go through a single promise chain, so appends cannot
// interleave. A single process owns the file.
//
// This assumes a durable filesystem and one writer, which rules out serverless —
// see store-postgres.mjs for the implementation that does not. Both satisfy the
// same contract (test-support/store-contract.mjs), and every method is async even where
// this one could answer from memory, because an interface that only a local
// in-memory store can satisfy is not an interface.

import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { newId } from './tokens.mjs';

/**
 * @typedef {'pending'|'confirmed'|'unsubscribed'|'bounced'|'complained'} Status
 *
 * pending      — asked to subscribe, has not clicked the confirmation link
 * confirmed    — the only status that receives an issue
 * unsubscribed — asked to leave
 * bounced      — the mailbox rejected us permanently, or too many times
 * complained   — marked an issue as spam, which is a harder no than unsubscribe
 */

/** Statuses that must never be mailed again. */
export const SUPPRESSED = new Set(['unsubscribed', 'bounced', 'complained']);

/** Soft bounces tolerated before an address is suppressed anyway. */
export const SOFT_BOUNCE_LIMIT = 5;

const normalize = (email) => String(email || '').trim().toLowerCase();

// Deliberately permissive but bounded: one @, something either side, a dot in
// the domain, no spaces, no control characters, RFC-5321-ish length limits.
const EMAIL_RE = /^[^\s@,;<>"'\\]{1,64}@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;

export function isValidEmail(email) {
  const e = normalize(email);
  if (e.length < 6 || e.length > 254) return false;
  if (e.includes('..')) return false;
  return EMAIL_RE.test(e);
}

export async function openStore(dataDir, { file = 'subscribers.ndjson' } = {}) {
  const path = join(dataDir, file);
  await mkdir(dirname(path), { recursive: true });

  /** @type {Map<string, any>} */
  const byEmail = new Map();
  /** @type {Map<string, any>} */
  const byId = new Map();

  if (existsSync(path)) {
    const raw = await readFile(path, 'utf8');
    let lineNo = 0;
    for (const line of raw.split('\n')) {
      lineNo++;
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const rec = JSON.parse(trimmed);
        if (!rec?.email) continue;
        byEmail.set(rec.email, rec);
        byId.set(rec.id, rec);
      } catch {
        // A torn last line (power loss mid-append) must not stop the service.
        console.warn(`store: skipping unparsable line ${lineNo} of ${path}`);
      }
    }
  }

  let queue = Promise.resolve();
  const serialize = (fn) => {
    const next = queue.then(fn, fn);
    // Keep the chain alive after a rejection, but let the caller see it.
    queue = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  };

  const put = (rec) =>
    serialize(async () => {
      await appendFile(path, JSON.stringify(rec) + '\n', 'utf8');
      byEmail.set(rec.email, rec);
      byId.set(rec.id, rec);
      return rec;
    });

  return {
    path,

    async get(email) {
      return byEmail.get(normalize(email));
    },
    async getById(id) {
      return byId.get(id);
    },

    /**
     * Record an intent to subscribe. Returns the record to send a confirmation
     * for. Re-subscribing an already-confirmed address does not reset it to
     * pending: that would let a stranger silently suspend someone's delivery.
     */
    async subscribe(email, { source = '', ipHash = '', now = new Date() } = {}) {
      const key = normalize(email);
      const at = now.toISOString();
      const existing = byEmail.get(key);

      if (existing?.status === 'confirmed') {
        return { record: existing, created: false, alreadyConfirmed: true };
      }

      const record = existing
        ? { ...existing, status: 'pending', source: source || existing.source, ipHash, updated: at }
        : {
            email: key,
            id: newId(),
            status: /** @type {Status} */ ('pending'),
            created: at,
            updated: at,
            source,
            ipHash,
          };
      await put(record);
      return { record, created: !existing, alreadyConfirmed: false };
    },

    async confirm(id, { now = new Date() } = {}) {
      const rec = byId.get(id);
      if (!rec) return null;
      if (rec.status === 'confirmed') return rec; // idempotent: links get clicked twice
      const at = now.toISOString();
      return put({ ...rec, status: 'confirmed', confirmedAt: at, updated: at });
    },

    async unsubscribe(id, { now = new Date() } = {}) {
      const rec = byId.get(id);
      if (!rec) return null;
      if (rec.status === 'unsubscribed') return rec;
      const at = now.toISOString();
      return put({ ...rec, status: 'unsubscribed', unsubscribedAt: at, updated: at });
    },

    /**
     * A permanent delivery failure, from a relay webhook or a DSN. Keyed by
     * address because that is all a bounce report carries.
     *
     * A transient failure does not suppress on its own — mailboxes are full for
     * a week and then they are not — but SOFT_BOUNCE_LIMIT of them in a row is
     * indistinguishable from gone.
     */
    async markBounced(email, { permanent = true, reason = '', now = new Date() } = {}) {
      const rec = byEmail.get(normalize(email));
      if (!rec) return null;
      const at = now.toISOString();

      if (!permanent) {
        const softBounces = (rec.softBounces ?? 0) + 1;
        const next = { ...rec, softBounces, updated: at };
        if (softBounces >= SOFT_BOUNCE_LIMIT) {
          return put({ ...next, status: 'bounced', bouncedAt: at, bounceReason: reason || 'repeated soft bounces' });
        }
        return put(next);
      }

      if (rec.status === 'bounced') return rec;
      return put({ ...rec, status: 'bounced', bouncedAt: at, bounceReason: reason, updated: at });
    },

    /** A spam complaint. Never mail this address again. */
    async markComplained(email, { reason = '', now = new Date() } = {}) {
      const rec = byEmail.get(normalize(email));
      if (!rec) return null;
      if (rec.status === 'complained') return rec;
      const at = now.toISOString();
      return put({ ...rec, status: 'complained', complainedAt: at, bounceReason: reason || rec.bounceReason, updated: at });
    },

    /** Everyone who should receive an issue. */
    async confirmed() {
      return [...byEmail.values()].filter((r) => r.status === 'confirmed');
    },

    async all() {
      return [...byEmail.values()];
    },

    async stats() {
      const out = { total: byEmail.size, pending: 0, confirmed: 0, unsubscribed: 0, bounced: 0, complained: 0 };
      for (const r of byEmail.values()) out[r.status] = (out[r.status] ?? 0) + 1;
      return out;
    },

    /**
     * Drop unconfirmed records older than the confirmation window. The public
     * page says an unconfirmed address is deleted rather than kept warm; this is
     * what makes that literally true. Rewrites the log, since a delete cannot be
     * expressed as an append.
     */
    async prunePending(ttlDays, { now = new Date() } = {}) {
      const cutoff = now.getTime() - ttlDays * 86400_000;
      // Inclusive: a record created in the same millisecond as the cutoff is at
      // the boundary, not inside it. With a strict `<`, prunePending(0) left
      // whichever record happened to share a millisecond with the call.
      const doomed = [...byEmail.values()].filter(
        (r) => r.status === 'pending' && new Date(r.created).getTime() <= cutoff
      );
      if (!doomed.length) return 0;
      for (const rec of doomed) {
        byEmail.delete(rec.email);
        byId.delete(rec.id);
      }
      await this.compact();
      return doomed.length;
    },

    /** Nothing to close; here so callers can treat both stores alike. */
    async close() {},

    /**
     * Rewrite the log with one line per address. Optional: the log is correct
     * either way, this just stops it growing forever. Writes to a temp file and
     * renames, so a crash mid-compaction cannot leave a half-written list.
     */
    async compact() {
      return serialize(async () => {
        const tmp = `${path}.compact-${process.pid}`;
        const body = [...byEmail.values()].map((r) => JSON.stringify(r)).join('\n');
        await writeFile(tmp, body + (body ? '\n' : ''), 'utf8');
        await rename(tmp, path);
        return byEmail.size;
      });
    },

    /** Wait for in-flight appends — call before exiting. */
    async flush() {
      await serialize(async () => {});
    },
  };
}
