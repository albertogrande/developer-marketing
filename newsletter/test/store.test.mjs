import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, isValidEmail } from '../lib/store.mjs';

const tmp = () => mkdtemp(join(tmpdir(), 'nl-store-'));

test('email validation', () => {
  for (const good of ['a@b.co', 'first.last+tag@sub.example.com', 'DEV@Example.DEV']) {
    assert.equal(isValidEmail(good), true, good);
  }
  for (const bad of [
    '',
    'nope',
    'a@b',
    'a@@b.co',
    'a b@c.co',
    'a@b..co',
    '<script>@x.co',
    'a@b.co, c@d.co',
    'x'.repeat(250) + '@example.com',
  ]) {
    assert.equal(isValidEmail(bad), false, bad);
  }
});

test('subscribe → confirm → unsubscribe', async () => {
  const dir = await tmp();
  const store = await openStore(dir);

  const { record, created } = await store.subscribe('Reader@Example.com', { source: '/weekly' });
  assert.equal(created, true);
  assert.equal(record.email, 'reader@example.com', 'addresses are normalized');
  assert.equal(record.status, 'pending');
  assert.deepEqual(store.stats(), { total: 1, pending: 1, confirmed: 0, unsubscribed: 0 });
  assert.equal(store.confirmed().length, 0, 'pending addresses never receive an issue');

  await store.confirm(record.id);
  assert.equal(store.confirmed().length, 1);

  await store.unsubscribe(record.id);
  assert.equal(store.confirmed().length, 0);
  assert.equal(store.get('reader@example.com').status, 'unsubscribed');
});

test('confirm and unsubscribe are idempotent', async () => {
  const store = await openStore(await tmp());
  const { record } = await store.subscribe('a@example.com');
  const first = await store.confirm(record.id);
  const second = await store.confirm(record.id);
  assert.equal(first.confirmedAt, second.confirmedAt, 'a link clicked twice does not move the timestamp');
  await store.unsubscribe(record.id);
  await store.unsubscribe(record.id);
  assert.equal(store.stats().unsubscribed, 1);
});

test('re-subscribing cannot silently suspend a confirmed reader', async () => {
  const store = await openStore(await tmp());
  const { record } = await store.subscribe('a@example.com');
  await store.confirm(record.id);
  const again = await store.subscribe('a@example.com');
  assert.equal(again.alreadyConfirmed, true);
  assert.equal(store.get('a@example.com').status, 'confirmed');
  assert.equal(store.confirmed().length, 1);
});

test('unknown ids are a no-op, not a crash', async () => {
  const store = await openStore(await tmp());
  assert.equal(await store.confirm('nope'), null);
  assert.equal(await store.unsubscribe('nope'), null);
});

test('state survives a restart, last line wins', async () => {
  const dir = await tmp();
  const first = await openStore(dir);
  const { record } = await first.subscribe('a@example.com', { source: '/' });
  await first.confirm(record.id);
  await first.subscribe('b@example.com');
  await first.flush();

  const second = await openStore(dir);
  assert.deepEqual(second.stats(), { total: 2, pending: 1, confirmed: 1, unsubscribed: 0 });
  assert.equal(second.getById(record.id).status, 'confirmed');
});

test('a torn final line does not stop the service', async () => {
  const dir = await tmp();
  const store = await openStore(dir);
  await store.subscribe('a@example.com');
  await store.flush();
  await writeFile(store.path, (await readFile(store.path, 'utf8')) + '{"email":"b@exa', 'utf8');

  const reopened = await openStore(dir);
  assert.equal(reopened.stats().total, 1);
});

test('compaction leaves one line per address', async () => {
  const dir = await tmp();
  const store = await openStore(dir);
  const { record } = await store.subscribe('a@example.com');
  await store.confirm(record.id);
  await store.unsubscribe(record.id);
  await store.flush();

  const before = (await readFile(store.path, 'utf8')).trim().split('\n');
  assert.equal(before.length, 3);

  await store.compact();
  const after = (await readFile(store.path, 'utf8')).trim().split('\n');
  assert.equal(after.length, 1);
  assert.equal(JSON.parse(after[0]).status, 'unsubscribed');
});

test('concurrent writes do not interleave or lose rows', async () => {
  const dir = await tmp();
  const store = await openStore(dir);
  await Promise.all(
    Array.from({ length: 40 }, (_, i) => store.subscribe(`user${i}@example.com`, { source: '/' }))
  );
  await store.flush();

  const lines = (await readFile(store.path, 'utf8')).trim().split('\n');
  assert.equal(lines.length, 40);
  for (const line of lines) JSON.parse(line); // every line is complete JSON
  assert.equal(store.stats().total, 40);
});
