#!/usr/bin/env node
// List export. The NDJSON store IS its own export (copy the file), but the
// Postgres deployment had no way to get the list back out — which makes
// "own your list" a promise the serverless path couldn't keep. This prints
// every record as NDJSON on stdout, one JSON object per line, the same shape
// the file store persists — so an export can be re-imported by literally
// writing it to data/subscribers.ndjson.
//
//   set -a; . newsletter/.env; set +a
//   node newsletter/export.mjs > list-backup.ndjson
//   node newsletter/export.mjs --confirmed   # deliverable addresses only

import { config, assertServerConfig } from './lib/config.mjs';
import { openConfiguredStore, describeStore } from './lib/store-open.mjs';

assertServerConfig();
const store = await openConfiguredStore(config);
const confirmedOnly = process.argv.includes('--confirmed');

const records = confirmedOnly ? await store.confirmed() : await store.all();
for (const r of records) process.stdout.write(JSON.stringify(r) + '\n');
console.error(
  `export: ${records.length} ${confirmedOnly ? 'confirmed ' : ''}record(s) from ${describeStore(store)}`
);
await store.close();
