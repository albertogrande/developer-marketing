// One place that decides which store the service and the sender open, so they
// cannot disagree about where the list lives.
//
//   NEWSLETTER_STORE=ndjson    an append-only file (the default)
//   NEWSLETTER_STORE=postgres  a database — required on serverless hosts
//
// Unset, it is inferred: a DATABASE_URL in the environment means Postgres. That
// is what Vercel's Neon integration injects, so a deployment there picks the
// right store with no extra configuration.
//
// store-postgres.mjs is imported lazily, so the `pg` package stays optional for
// everyone who does not use it.

import { openStore } from './store.mjs';

export async function openConfiguredStore(config) {
  if (config.store === 'postgres') {
    const { openPostgresStore } = await import('./store-postgres.mjs');
    return openPostgresStore(config.databaseUrl || undefined);
  }
  return openStore(config.dataDir);
}

/** Where the list lives, for a log line. */
export const describeStore = (store) => store.path ?? `${store.kind ?? 'unknown'}:${store.schema ?? ''}`;
