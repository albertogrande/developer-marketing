// The list. An append-only NDJSON log, replayed into a Map on start.
//
// A subscriber list is small (tens of thousands of rows at the very most) and
// must never lose a write, so this is a log, not a database: every state change
// appends one JSON line and the last line for an address wins. That makes the
// file greppable, diffable, trivially backed up with cp, and recoverable by
// hand if something ever goes wrong at 3am.
//
// Concurrency: all writes go through a single promise chain, so appends cannot
// interleave. A single process owns the file.

import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { newId } from './tokens.mjs';

/** @typedef {'pending'|'confirmed'|'unsubscribed'} Status */

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

    get(email) {
      return byEmail.get(normalize(email));
    },
    getById(id) {
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

    /** Everyone who should receive an issue. */
    confirmed() {
      return [...byEmail.values()].filter((r) => r.status === 'confirmed');
    },

    all() {
      return [...byEmail.values()];
    },

    stats() {
      const out = { total: byEmail.size, pending: 0, confirmed: 0, unsubscribed: 0 };
      for (const r of byEmail.values()) out[r.status] = (out[r.status] ?? 0) + 1;
      return out;
    },

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
