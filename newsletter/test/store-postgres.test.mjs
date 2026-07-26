// The Postgres store, held to the same contract as the NDJSON one.
//
// Skipped unless TEST_DATABASE_URL points at a Postgres you do not mind having
// truncated — so CI stays green without a database, and running it locally is
// one env var:
//
//   TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/postgres \
//     node --test newsletter/test/store-postgres.test.mjs
//
// Each contract case gets its own schema-level clean slate, since the contract
// requires a fresh, empty list per factory call.

import test from 'node:test';
import assert from 'node:assert/strict';
import { runStoreContract } from './store-contract.mjs';
import {
  openPostgresStore,
  rowToRecord,
  sslFor,
  connectionStringFromEnv,
} from '../lib/store-postgres.mjs';

const url = process.env.TEST_DATABASE_URL;

// --- pure helpers: always run, no database needed --------------------------

test('the pooled connection string wins over the direct one', () => {
  // Vercel's Neon integration injects both. A serverless function opening direct
  // connections exhausts the database's slots on the first burst.
  assert.equal(
    connectionStringFromEnv({ DATABASE_URL: 'postgres://pooled', DATABASE_URL_UNPOOLED: 'postgres://direct' }),
    'postgres://pooled'
  );
  assert.equal(connectionStringFromEnv({ POSTGRES_URL: 'postgres://legacy' }), 'postgres://legacy');
  assert.equal(connectionStringFromEnv({}), '');
});

test('TLS is required except against loopback', () => {
  assert.deepEqual(sslFor('postgres://u:p@ep-cool-name.eu-central-1.aws.neon.tech/db'), {
    rejectUnauthorized: true,
  });
  assert.equal(sslFor('postgres://postgres@127.0.0.1:5432/postgres'), false);
  assert.equal(sslFor('postgres://postgres@localhost/postgres'), false);
  assert.equal(sslFor('postgres://u:p@somewhere.example.com/db?sslmode=disable'), false);
});

test('a row becomes a record the rest of the code recognises', () => {
  const record = rowToRecord({
    email: 'a@example.com',
    id: 'abc',
    status: 'confirmed',
    created: new Date('2026-07-01T10:00:00Z'),
    updated: new Date('2026-07-02T10:00:00Z'),
    source: '/weekly',
    ip_hash: 'hash',
    confirmed_at: new Date('2026-07-02T10:00:00Z'),
    unsubscribed_at: null,
    bounced_at: null,
    complained_at: null,
    bounce_reason: null,
    soft_bounces: 0,
  });

  assert.equal(record.created, '2026-07-01T10:00:00.000Z', 'timestamps come out as ISO strings');
  assert.equal(record.ipHash, 'hash', 'snake_case columns, camelCase record');
  assert.equal(record.confirmedAt, '2026-07-02T10:00:00.000Z');
  // Absent facts stay absent, so a record looks identical to the NDJSON store's
  // and the contract's field check passes for both.
  assert.equal('unsubscribedAt' in record, false);
  assert.equal('bouncedAt' in record, false);
  assert.equal('softBounces' in record, false);
  assert.equal(rowToRecord(undefined), undefined);
});

test('a missing connection string is refused, not guessed at', async () => {
  await assert.rejects(() => openPostgresStore('', { migrate: false }), /DATABASE_URL is not set/);
});

test('a schema name is validated, since it cannot be parameterised', async () => {
  // An empty string is not invalid, it just means "use the default" — so it is
  // not in this list.
  for (const bad of ['public; drop table subscribers', 'a-b', '1abc', 'x'.repeat(64), 'has space']) {
    await assert.rejects(
      () => openPostgresStore('postgres://localhost/db', { schema: bad, migrate: false }),
      /not a valid schema name/,
      `should reject ${JSON.stringify(bad)}`
    );
  }
});

// --- the contract: needs a real database ----------------------------------

if (!url) {
  test('postgres contract', { skip: 'set TEST_DATABASE_URL to run it' }, () => {});
} else {
  let seq = 0;
  runStoreContract('postgres', async () => {
    // A schema per case: the contract needs an empty list, and sharing one table
    // across cases would make them order-dependent.
    const schema = `nl_test_${process.pid}_${seq++}`;
    return openPostgresStore(url, { schema });
  });
}
