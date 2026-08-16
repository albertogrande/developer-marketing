// The store contract, as executable tests.
//
// The list is the one asset that cannot be rebuilt, and the one thing that has
// to change if the service moves to a host without a durable filesystem. So the
// behaviour a store must have lives here, separately from how any one of them
// implements it: point this at a backend — the NDJSON log, Postgres, Redis — and
// if it passes, the service and the sender work against it unchanged.
//
//   import { runStoreContract } from '../test-support/store-contract.mjs';
//   runStoreContract('postgres', async () => openPostgresStore(process.env.DATABASE_URL));
//
// The factory must return a store scoped to a *fresh, empty* list each call.
// Every read is awaited: an interface only a local in-memory store can satisfy
// is not an interface.

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
    assert.equal((await store.confirmed()).length, 0, 'pending addresses never receive an issue');
  });

  it('lookup works by address and by id', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');

    assert.equal((await store.get('a@example.com')).id, record.id);
    assert.equal((await store.get('A@EXAMPLE.COM')).id, record.id, 'lookup is case-insensitive');
    assert.equal((await store.getById(record.id)).email, 'a@example.com');
    assert.equal(await store.get('nobody@example.com'), undefined);
    assert.equal(await store.getById('nope'), undefined);
  });

  it('confirming makes an address deliverable', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);

    assert.equal((await store.get('a@example.com')).status, 'confirmed');
    assert.deepEqual(
      (await store.confirmed()).map((r) => r.email),
      ['a@example.com']
    );
    assert.ok((await store.get('a@example.com')).confirmedAt, 'the moment of consent is recorded');
  });

  it('unsubscribing takes effect immediately', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);
    await store.unsubscribe(record.id);

    assert.equal((await store.get('a@example.com')).status, 'unsubscribed');
    assert.equal((await store.confirmed()).length, 0, 'a departed reader is never sent another issue');
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
    assert.equal((await store.stats()).unsubscribed, 1);
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
    assert.equal((await store.get('a@example.com')).status, 'confirmed', 'delivery is not interrupted');
    assert.equal((await store.confirmed()).length, 1);
  });

  it('someone who left can come back', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);
    await store.unsubscribe(record.id);

    const { record: again } = await store.subscribe('a@example.com');
    assert.equal(again.status, 'pending', 'and has to confirm again');
    assert.equal((await store.confirmed()).length, 0);
    await store.confirm(again.id);
    assert.equal((await store.confirmed()).length, 1);
  });

  it('a permanent bounce suppresses the address', async () => {
    const store = await factory();
    const { record } = await store.subscribe('gone@example.com');
    await store.confirm(record.id);

    const bounced = await store.markBounced('gone@example.com', {
      permanent: true,
      reason: '550 5.1.1 no such user',
    });
    assert.equal(bounced.status, 'bounced');
    assert.equal(bounced.bounceReason, '550 5.1.1 no such user');
    assert.ok(bounced.bouncedAt);
    assert.equal((await store.confirmed()).length, 0, 'a dead mailbox is never mailed again');
  });

  it('a bounce report is keyed by address, since that is all it carries', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);

    // Relays report the address in whatever case the sender used.
    const hit = await store.markBounced('A@Example.com', { permanent: true });
    assert.equal(hit.email, 'a@example.com');
    assert.equal(await store.markBounced('stranger@example.com', { permanent: true }), null);
  });

  it('one soft bounce does not suppress, a run of them does', async () => {
    const store = await factory();
    const { record } = await store.subscribe('full@example.com');
    await store.confirm(record.id);

    // A mailbox is full for a week and then it is not.
    for (let i = 0; i < 4; i++) {
      const soft = await store.markBounced('full@example.com', { permanent: false, reason: '452 over quota' });
      assert.equal(soft.status, 'confirmed', `still deliverable after ${i + 1} soft bounces`);
    }
    assert.equal((await store.confirmed()).length, 1);

    const fifth = await store.markBounced('full@example.com', { permanent: false });
    assert.equal(fifth.status, 'bounced', 'five in a row is indistinguishable from gone');
    assert.equal((await store.confirmed()).length, 0);
  });

  it('a complaint is a harder no than an unsubscribe', async () => {
    const store = await factory();
    const { record } = await store.subscribe('annoyed@example.com');
    await store.confirm(record.id);

    const complained = await store.markComplained('annoyed@example.com', { reason: 'feedback loop' });
    assert.equal(complained.status, 'complained');
    assert.ok(complained.complainedAt);
    assert.equal((await store.confirmed()).length, 0);
    assert.equal(await store.markComplained('stranger@example.com'), null);
  });

  it('bounced and complained are idempotent', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com');
    await store.confirm(record.id);

    const first = await store.markBounced('a@example.com', { permanent: true, reason: 'x' });
    const again = await store.markBounced('a@example.com', { permanent: true, reason: 'y' });
    assert.equal(again.bouncedAt, first.bouncedAt, 'a repeated report does not move the timestamp');

    const c1 = await store.markComplained('a@example.com');
    const c2 = await store.markComplained('a@example.com');
    assert.equal(c2.complainedAt, c1.complainedAt);
  });

  it('a suppressed address can come back, but only through the mailbox', async () => {
    const store = await factory();
    const { record } = await store.subscribe('recreated@example.com');
    await store.confirm(record.id);
    await store.markBounced('recreated@example.com', { permanent: true });

    // Re-subscribing goes back to pending, never straight to confirmed: clicking
    // the link is itself proof the mailbox is alive again.
    const { record: again } = await store.subscribe('recreated@example.com');
    assert.equal(again.status, 'pending');
    assert.equal((await store.confirmed()).length, 0);
    await store.confirm(again.id);
    assert.equal((await store.confirmed()).length, 1);
  });

  it('pending records expire, as the privacy note promises', async () => {
    const store = await factory();
    await store.subscribe('fresh@example.com');
    await store.subscribe('stale@example.com');
    const kept = await store.subscribe('confirmed@example.com');
    await store.confirm(kept.record.id);

    assert.equal(await store.prunePending(7), 0, 'nothing is old enough yet');

    // Backdating a record is store-specific, so the contract only requires that
    // a zero-day window treats every pending record as expired.
    assert.equal(await store.prunePending(0), 2, 'both pending records go');
    assert.equal(await store.get('fresh@example.com'), undefined);
    assert.equal(await store.get('stale@example.com'), undefined);
    assert.ok(await store.get('confirmed@example.com'), 'a confirmed reader is never pruned');
  });

  it('the same address is never stored twice', async () => {
    const store = await factory();
    await store.subscribe('a@example.com');
    await store.subscribe('A@Example.com');
    await store.subscribe('a@example.com', { source: '/again' });

    assert.equal((await store.all()).length, 1);
    assert.equal((await store.stats()).total, 1);
  });

  it('stats add up', async () => {
    const store = await factory();
    const a = (await store.subscribe('a@example.com')).record;
    const b = (await store.subscribe('b@example.com')).record;
    const c = (await store.subscribe('c@example.com')).record;
    await store.subscribe('d@example.com');
    await store.confirm(a.id);
    await store.confirm(b.id);
    await store.confirm(c.id);
    await store.unsubscribe(b.id);
    await store.markBounced('c@example.com', { permanent: true });

    assert.deepEqual(await store.stats(), {
      total: 4,
      pending: 1,
      confirmed: 1,
      unsubscribed: 1,
      bounced: 1,
      complained: 0,
    });
  });

  it('concurrent writes do not lose rows', async () => {
    const store = await factory();
    await Promise.all(
      Array.from({ length: 25 }, (_, i) => store.subscribe(`user${i}@example.com`, { source: '/' }))
    );
    if (store.flush) await store.flush();

    assert.equal((await store.stats()).total, 25);
    assert.equal(new Set((await store.all()).map((r) => r.id)).size, 25, 'ids are unique');
  });

  it('what is stored is only what was promised', async () => {
    const store = await factory();
    const { record } = await store.subscribe('a@example.com', { source: '/weekly', ipHash: 'abc123' });

    // /newsletter tells readers exactly what is kept. A backend that quietly
    // adds a field fails here, and the disclosure gets updated or the field goes.
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
      'bouncedAt',
      'complainedAt',
      'bounceReason',
      'softBounces',
    ]);
    for (const key of Object.keys(record)) {
      assert.ok(allowed.has(key), `unexpected field "${key}"`);
    }
    assert.equal(record.ipHash, 'abc123', 'stored as given: hashing happens before the store sees it');
  });
}
