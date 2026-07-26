// The store contract, as executable tests.
//
// The list is the one asset that cannot be rebuilt, and the one thing that has
// to change if the service ever moves to a host without a durable filesystem
// (see newsletter/README.md). So the behaviour a store must have lives here,
// separately from how the NDJSON one implements it: point this at any backend —
// Postgres, Redis, SQLite — and if it passes, the service and the sender work
// against it unchanged.
//
//   import { runStoreContract } from './store-contract.mjs';
//   runStoreContract('postgres', async () => openPostgresStore(process.env.DATABASE_URL));
//
// The factory must return a store scoped to a *fresh, empty* list each call.

import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * @param {string} name              label for the test titles
 * @param {() => Promise<object>} factory  returns an empty store
 */
export function runStoreContract(name, factory) {
  const it = (title, fn) => test(`[${name}] ${title}`, fn);

  it('a new address starts pending and undeliverable', async () => {
    const store = await factory();
    const { record, created } = await store.subscribe('Reader@Example.com', { source: '/weekly' });

    assert.equal(created, true);
    assert.equal(record.email, 'reader@example.com', 'addresses are normalized to lower case');
    assert.equal(record.status, 'pending');
    assert.ok(record.id, 'every record gets an opaque id to sign tokens against');
    assert.notEqual(record.id, record.email, 'the id is not derived from the address');
    assert.equal(store.confirmed().length, 0, 'pending addresses never receive an issue');
  });

  it('lookup works by address and by id', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    assert.equal(store.get('a@example.com').id, record.id);
    assert.equal(store.get('A@EXAMPLE.COM').id, record.id, 'lookup is case-insensitive');
    assert.equal(store.getById(record.id).email, 'a@example.com');
    assert.equal(store.get('nobody@example.com'), undefined);
    assert.equal(store.getById('nope'), undefined);
  });

  it('confirming makes an address deliverable', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);

    assert.equal(store.get('a@example.com').status, 'confirmed');
    assert.deepEqual(
      store.confirmed().map((r) => r.email),
      ['a@example.com']
    );
    assert.ok(store.get('a@example.com').confirmedAt, 'the moment of consent is recorded');
  });

  it('unsubscribing takes effect immediately', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);
    await store.unsubscribe(record.id);

    assert.equal(store.get('a@example.com').status, 'unsubscribed');
    assert.equal(store.confirmed().length, 0, 'a departed reader is never sent another issue');
  });

  it('confirm and unsubscribe are idempotent', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');

    const first = await store.confirm(record.id);
    const second = await store.confirm(record.id);
    assert.equal(first.confirmedAt, second.confirmedAt, 'a link clicked twice does not move the timestamp');

    await store.unsubscribe(record.id);
    const again = await store.unsubscribe(record.id);
    assert.equal(again.status, 'unsubscribed');
    assert.equal(store.stats().unsubscribed, 1);
  });

  it('unknown ids are a no-op, not a crash', async () => {
    const store = await factory();
    assert.equal(await store.confirm('nope'), null);
    assert.equal(await store.unsubscribe('nope'), null);
  });

  it('re-subscribing cannot silently suspend a confirmed reader', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);

    const again = await store.subscribe('a@example.com');
    assert.equal(again.alreadyConfirmed, true, 'the caller must know not to send another confirmation');
    assert.equal(store.get('a@example.com').status, 'confirmed', 'delivery is not interrupted');
    assert.equal(store.confirmed().length, 1);
  });

  it('someone who left can come back', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);
    await store.unsubscribe(record.id);

    const { record: again } = await store.subscribe('a@example.com');
    assert.equal(again.status, 'pending', 'and has to confirm again');
    assert.equal(store.confirmed().length, 0);
    await store.confirm(again.id);
    assert.equal(store.confirmed().length, 1);
  });

  it('the same address is never stored twice', async () => {
    const store = await factory();
    await store.subscribe('a@example.com');
    await store.subscribe('A@Example.com');
    await store.subscribe('a@example.com', { source: '/again' });
    assert.equal(store.all().length, 1);
    assert.equal(store.stats().total, 1);
  });

  it('stats add up', async () => {
    const store = await factory();
    const a = (await store.subscribe('a@example.com')).record;
    const b = (await store.subscribe('b@example.com')).record;
    await store.subscribe('c@example.com');
    await store.confirm(a.id);
    await store.confirm(b.id);
    await store.unsubscribe(b.id);

    assert.deepEqual(store.stats(), { total: 3, pending: 1, confirmed: 1, unsubscribed: 1 });
  });

  it('concurrent writes do not lose rows', async () => {
    const store = await factory();
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => store.subscribe(`user${i}@example.com`, { source: '/' }))
    );
    if (store.flush) await store.flush();
    assert.equal(store.stats().total, 25);
    assert.equal(new Set(store.all().map((r) => r.id)).size, 25, 'ids are unique');
  });

  it('what is stored is only what was promised', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com', { source: '/weekly', ipHash: 'abc123' });
    const allowed = new Set([
      'email',
      'id',
      'status',
      'created',
      'updated',
      'source',
      'ipHash',
      'confirmedAt',
      'unsubscribedAt',
    ]);
    for (const key of Object.keys(record)) {
      assert.ok(allowed.has(key), `unexpected field "${key}" — /newsletter tells readers exactly what is kept`);
    }
    assert.equal(record.ipHash, 'abc123', 'stored as given: hashing happens before the store sees it');
  });
}
