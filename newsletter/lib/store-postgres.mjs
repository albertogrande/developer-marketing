// The list, in Postgres. Same contract as store.mjs (test-support/store-contract.mjs),
// for hosts without a durable filesystem — a Vercel or Lambda function, where
// the NDJSON log cannot survive the invocation that wrote it.
//
// Works against anything that speaks Postgres: Neon and Supabase both have a
// free tier that fits a subscriber list several times over (Neon's is 0.5 GB and
// 100 compute-hours a month, checked 2026-07-26 — this table is kilobytes), and
// so does a Postgres on your own machine.
//
// `pg` is imported dynamically and declared optional, so the NDJSON path, the
// site build and every other test still run with nothing installed.
//
//   DATABASE_URL=postgres://user:pass@host/db npm run newsletter:serve
//
// The table is created on first connect. One table, one index, no migration
// tool: if this ever needs a second table it has outgrown being a mailing list.

import { newId } from './tokens.mjs';
import { SOFT_BOUNCE_LIMIT } from './store.mjs';

const DDL = `
create table if not exists subscribers (
  email           text primary key,
  id              text not null unique,
  status          text not null default 'pending'
                    check (status in ('pending','confirmed','unsubscribed','bounced','complained')),
  created         timestamptz not null default now(),
  updated         timestamptz not null default now(),
  source          text not null default '',
  ip_hash         text not null default '',
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  bounced_at      timestamptz,
  complained_at   timestamptz,
  bounce_reason   text,
  soft_bounces    integer not null default 0
);
create index if not exists subscribers_status_idx on subscribers (status);
`;

const iso = (value) => (value instanceof Date ? value.toISOString() : value ?? undefined);

/** Column names are snake_case; the record the rest of the code passes around is not. */
export function rowToRecord(row) {
  if (!row) return undefined;
  const record = {
    email: row.email,
    id: row.id,
    status: row.status,
    created: iso(row.created),
    updated: iso(row.updated),
    source: row.source ?? '',
    ipHash: row.ip_hash ?? '',
  };
  // Only present when they happened, so a record looks the same as the NDJSON
  // store's and the contract's field check passes for both.
  if (row.confirmed_at) record.confirmedAt = iso(row.confirmed_at);
  if (row.unsubscribed_at) record.unsubscribedAt = iso(row.unsubscribed_at);
  if (row.bounced_at) record.bouncedAt = iso(row.bounced_at);
  if (row.complained_at) record.complainedAt = iso(row.complained_at);
  if (row.bounce_reason) record.bounceReason = row.bounce_reason;
  if (row.soft_bounces) record.softBounces = row.soft_bounces;
  return record;
}

const normalize = (email) => String(email || '').trim().toLowerCase();

/** Neon and Supabase require TLS; a loopback Postgres in a test does not have it. */
export function sslFor(connectionString) {
  if (process.env.PGSSLMODE === 'disable') return false;
  let host = '';
  try {
    host = new URL(connectionString).hostname;
  } catch {
    /* a libpq key=value string: fall through to requiring TLS */
  }
  if (/^(localhost|127\.0\.0\.1|::1|\[::1\])$/.test(host)) return false;
  if (/sslmode=disable/.test(connectionString)) return false;
  return { rejectUnauthorized: true };
}

/**
 * Vercel's Neon integration injects DATABASE_URL (pooled) and
 * DATABASE_URL_UNPOOLED (direct), plus the legacy POSTGRES_URL names. Prefer the
 * pooled one: a serverless function opening direct connections will exhaust the
 * database's connection slots on the first burst of traffic.
 */
export const connectionStringFromEnv = (env = process.env) =>
  env.DATABASE_URL || env.POSTGRES_URL || env.POSTGRES_PRISMA_URL || env.DATABASE_URL_UNPOOLED || '';

/** Schema names cannot be parameterised, so they are validated instead. */
const assertIdentifier = (name) => {
  if (!/^[a-z_][a-z0-9_]{0,62}$/i.test(name)) {
    throw new Error(`store-postgres: "${name}" is not a valid schema name`);
  }
  return name;
};

/**
 * @param {string} connectionString
 * @param {object} [opts]
 * @param {object} [opts.pool]      inject a client instead of creating one
 * @param {boolean} [opts.migrate]  false to skip the create-table-if-not-exists
 * @param {string} [opts.schema]    put the table somewhere other than `public`
 */
export async function openPostgresStore(connectionString = connectionStringFromEnv(), opts = {}) {
  if (!connectionString) throw new Error('store-postgres: DATABASE_URL is not set');

  const schema = assertIdentifier(opts.schema || process.env.PGSCHEMA || 'public');

  let pool = opts.pool;
  if (!pool) {
    let pg;
    try {
      ({ default: pg } = await import('pg'));
    } catch {
      throw new Error(
        "store-postgres: the 'pg' package is not installed — run `npm install pg` (it is an optional dependency)"
      );
    }
    pool = new pg.Pool({
      connectionString,
      ssl: sslFor(connectionString),
      // Set on the pool, so every connection it hands out lands in the right
      // schema — including ones created later, after a cold start.
      ...(schema === 'public' ? {} : { options: `-c search_path=${schema}` }),
      // Serverless invocations are short and many; a small ceiling per instance
      // keeps a cold-start storm from exhausting the database's connection slots.
      max: Number(process.env.PGPOOL_MAX || 3),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  const query = async (text, params = []) => (await pool.query(text, params)).rows;

  if (opts.migrate !== false) {
    if (schema !== 'public') await query(`create schema if not exists ${schema}`);
    await query(DDL);
  }

  return {
    // No `path`: there is no file. Callers that log it must tolerate undefined.
    kind: 'postgres',
    schema,

    async get(email) {
      const [row] = await query('select * from subscribers where email = $1', [normalize(email)]);
      return rowToRecord(row);
    },

    async getById(id) {
      const [row] = await query('select * from subscribers where id = $1', [id]);
      return rowToRecord(row);
    },

    /**
     * One statement, so two simultaneous signups for the same address cannot
     * both insert. The CTE reads the status as it was before the upsert — the
     * caller needs to know whether to send another confirmation.
     */
    async subscribe(email, { source = '', ipHash = '' } = {}) {
      const key = normalize(email);
      const rows = await query(
        `with prior as (
           select status from subscribers where email = $1
         ), upserted as (
           insert into subscribers (email, id, status, source, ip_hash)
           values ($1, $2, 'pending', $3, $4)
           on conflict (email) do update set
             -- A confirmed reader is never knocked back to pending: that would
             -- let a stranger suspend someone else's delivery with a form post.
             status  = case when subscribers.status = 'confirmed' then 'confirmed' else 'pending' end,
             source  = case when subscribers.status = 'confirmed' then subscribers.source else excluded.source end,
             ip_hash = case when subscribers.status = 'confirmed' then subscribers.ip_hash else excluded.ip_hash end,
             updated = now()
           returning *
         )
         select upserted.*, (select status from prior) as prior_status from upserted`,
        [key, newId(), source, ipHash]
      );
      const row = rows[0];
      const priorStatus = row.prior_status ?? null;
      return {
        record: rowToRecord(row),
        created: priorStatus === null,
        alreadyConfirmed: priorStatus === 'confirmed',
      };
    },

    async confirm(id) {
      const [row] = await query(
        `update subscribers
            set status = 'confirmed',
                -- Idempotent: a link clicked twice must not move the timestamp.
                confirmed_at = coalesce(confirmed_at, now()),
                updated = case when status = 'confirmed' then updated else now() end
          where id = $1
          returning *`,
        [id]
      );
      return rowToRecord(row) ?? null;
    },

    async unsubscribe(id) {
      const [row] = await query(
        `update subscribers
            set status = 'unsubscribed',
                unsubscribed_at = coalesce(unsubscribed_at, now()),
                updated = case when status = 'unsubscribed' then updated else now() end
          where id = $1
          returning *`,
        [id]
      );
      return rowToRecord(row) ?? null;
    },

    async markBounced(email, { permanent = true, reason = '' } = {}) {
      const key = normalize(email);
      if (permanent) {
        const [row] = await query(
          `update subscribers
              set status = 'bounced',
                  bounced_at = coalesce(bounced_at, now()),
                  bounce_reason = coalesce(nullif($2, ''), bounce_reason),
                  updated = case when status = 'bounced' then updated else now() end
            where email = $1
            returning *`,
          [key, reason]
        );
        return rowToRecord(row) ?? null;
      }
      // Transient: count it, and suppress once the count says the mailbox is gone.
      const [row] = await query(
        `update subscribers
            set soft_bounces = soft_bounces + 1,
                status = case when soft_bounces + 1 >= $3 then 'bounced' else status end,
                bounced_at = case when soft_bounces + 1 >= $3 then coalesce(bounced_at, now()) else bounced_at end,
                bounce_reason = case
                  when soft_bounces + 1 >= $3 then coalesce(nullif($2, ''), 'repeated soft bounces')
                  else bounce_reason end,
                updated = now()
          where email = $1
          returning *`,
        [key, reason, SOFT_BOUNCE_LIMIT]
      );
      return rowToRecord(row) ?? null;
    },

    async markComplained(email, { reason = '' } = {}) {
      const [row] = await query(
        `update subscribers
            set status = 'complained',
                complained_at = coalesce(complained_at, now()),
                bounce_reason = coalesce(nullif($2, ''), bounce_reason),
                updated = case when status = 'complained' then updated else now() end
          where email = $1
          returning *`,
        [normalize(email), reason]
      );
      return rowToRecord(row) ?? null;
    },

    async confirmed() {
      return (
        await query("select * from subscribers where status = 'confirmed' order by confirmed_at, email")
      ).map(rowToRecord);
    },

    async all() {
      return (await query('select * from subscribers order by created, email')).map(rowToRecord);
    },

    async stats() {
      const rows = await query('select status, count(*)::int as n from subscribers group by status');
      const out = { total: 0, pending: 0, confirmed: 0, unsubscribed: 0, bounced: 0, complained: 0 };
      for (const { status, n } of rows) {
        out[status] = n;
        out.total += n;
      }
      return out;
    },

    /**
     * Delete unconfirmed records older than the confirmation window. The public
     * page says an unconfirmed address is dropped rather than kept warm; this is
     * what makes that literally true.
     */
    async prunePending(ttlDays) {
      // `<=`, so prunePending(0) means every pending record — see store.mjs.
      const rows = await query(
        `delete from subscribers
           where status = 'pending' and created <= now() - ($1 || ' days')::interval
           returning email`,
        [String(ttlDays)]
      );
      return rows.length;
    },

    async flush() {},

    async close() {
      if (pool.end) await pool.end();
    },
  };
}
