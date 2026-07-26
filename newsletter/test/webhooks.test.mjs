// Webhook verification and event handling. This endpoint suppresses addresses,
// so most of what matters here is what it *refuses*.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { verifySvix, classifyEvent, applyEvent, TIMESTAMP_TOLERANCE_S } from '../lib/webhooks.mjs';
import { openStore } from '../lib/store.mjs';

const SECRET = 'whsec_' + Buffer.from('a signing secret of some length').toString('base64');
const NOW = 1_800_000_000_000; // fixed clock, in ms

/** Sign a payload the way Svix does, so the verifier is tested against real input. */
function sign(body, { secret = SECRET, id = 'msg_2abc', timestamp = Math.floor(NOW / 1000) } = {}) {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64');
  return {
    'svix-id': id,
    'svix-timestamp': String(timestamp),
    'svix-signature': `v1,${signature}`,
  };
}

const bounceEvent = (overrides = {}) =>
  JSON.stringify({
    type: 'email.bounced',
    data: {
      to: ['gone@example.com'],
      bounce: { type: 'Permanent', subType: 'General', message: 'The mailbox does not exist' },
      ...overrides,
    },
  });

test('a correctly signed webhook verifies', () => {
  const body = bounceEvent();
  assert.deepEqual(verifySvix({ secret: SECRET, body, headers: sign(body), now: NOW }), { ok: true });
});

test('a tampered body does not verify', () => {
  const body = bounceEvent();
  const headers = sign(body);
  const forged = bounceEvent({ to: ['someone-else@example.com'] });
  assert.equal(verifySvix({ secret: SECRET, body: forged, headers, now: NOW }).reason, 'signature mismatch');
});

test('another secret does not verify', () => {
  const body = bounceEvent();
  const headers = sign(body, { secret: 'whsec_' + Buffer.from('a different secret entirely').toString('base64') });
  assert.equal(verifySvix({ secret: SECRET, body, headers, now: NOW }).reason, 'signature mismatch');
});

test('a captured request cannot be replayed later', () => {
  const body = bounceEvent();
  const headers = sign(body);
  assert.equal(verifySvix({ secret: SECRET, body, headers, now: NOW }).ok, true);
  const later = NOW + (TIMESTAMP_TOLERANCE_S + 60) * 1000;
  assert.equal(verifySvix({ secret: SECRET, body, headers, now: later }).reason, 'stale timestamp');
});

test('missing headers, a bad timestamp and no secret are all refused', () => {
  const body = bounceEvent();
  assert.equal(verifySvix({ secret: SECRET, body, headers: {}, now: NOW }).reason, 'missing svix headers');
  assert.equal(
    verifySvix({ secret: SECRET, body, headers: { ...sign(body), 'svix-timestamp': 'soon' }, now: NOW }).reason,
    'bad timestamp'
  );
  assert.match(verifySvix({ secret: '', body, headers: sign(body), now: NOW }).reason, /no signing secret/);
});

test('a rotated secret can be verified while both are live', () => {
  // Svix sends every valid signature space-separated during a rotation.
  const body = bounceEvent();
  const old = sign(body, { secret: 'whsec_' + Buffer.from('the previous secret value').toString('base64') });
  const current = sign(body);
  const headers = { ...current, 'svix-signature': `${old['svix-signature']} ${current['svix-signature']}` };
  assert.equal(verifySvix({ secret: SECRET, body, headers, now: NOW }).ok, true);
});

test('events are classified by what we should do about them', () => {
  const permanent = classifyEvent(JSON.parse(bounceEvent()));
  assert.equal(permanent.action, 'bounce');
  assert.equal(permanent.permanent, true);
  assert.deepEqual(permanent.to, ['gone@example.com']);
  assert.match(permanent.reason, /Permanent/);

  const transient = classifyEvent(JSON.parse(bounceEvent({ bounce: { type: 'Transient', subType: 'MailboxFull' } })));
  assert.equal(transient.action, 'bounce');
  assert.equal(transient.permanent, false, 'a full mailbox is not a dead one');

  const undetermined = classifyEvent(JSON.parse(bounceEvent({ bounce: {} })));
  assert.equal(undetermined.permanent, false, 'an unclassified bounce is treated as transient');

  const complaint = classifyEvent({ type: 'email.complained', data: { to: ['annoyed@example.com'] } });
  assert.equal(complaint.action, 'complaint');
});

test('the events we deliberately do not act on are ignored', () => {
  // Opens and clicks are ignored even when a relay offers them: /newsletter says
  // we cannot tell whether an issue was read, and that has to stay true.
  for (const type of ['email.delivered', 'email.sent', 'email.delivery_delayed', 'email.opened', 'email.clicked']) {
    assert.equal(classifyEvent({ type, data: { to: ['a@example.com'] } }).action, 'ignore', type);
  }
  assert.equal(classifyEvent({ type: 'email.bounced', data: {} }).action, 'ignore', 'no recipient');
  assert.equal(classifyEvent({}).action, 'ignore');
});

test('applying a bounce suppresses the reader', async () => {
  const store = await openStore(await mkdtemp(join(tmpdir(), 'nl-wh-')));
  const { record } = await store.subscribe('gone@example.com');
  await store.confirm(record.id);

  const result = await applyEvent(store, JSON.parse(bounceEvent()));
  assert.equal(result.applied, true);
  assert.deepEqual(result.records, [{ email: 'gone@example.com', status: 'bounced' }]);
  assert.equal((await store.confirmed()).length, 0);
});

test('applying a complaint suppresses the reader', async () => {
  const store = await openStore(await mkdtemp(join(tmpdir(), 'nl-wh-')));
  const { record } = await store.subscribe('annoyed@example.com');
  await store.confirm(record.id);

  const result = await applyEvent(store, {
    type: 'email.complained',
    data: { to: ['annoyed@example.com'] },
  });
  assert.equal(result.action, 'complaint');
  assert.equal((await store.get('annoyed@example.com')).status, 'complained');
});

test('an event about a stranger changes nothing and is not an error', async () => {
  const store = await openStore(await mkdtemp(join(tmpdir(), 'nl-wh-')));
  const result = await applyEvent(store, JSON.parse(bounceEvent()));
  assert.equal(result.applied, false, 'nothing to apply');
  assert.equal((await store.stats()).total, 0);
});

test('a transient bounce leaves a reader deliverable', async () => {
  const store = await openStore(await mkdtemp(join(tmpdir(), 'nl-wh-')));
  const { record } = await store.subscribe('full@example.com');
  await store.confirm(record.id);

  const event = JSON.parse(bounceEvent({ to: ['full@example.com'], bounce: { type: 'Transient' } }));
  await applyEvent(store, event);
  assert.equal((await store.confirmed()).length, 1, 'still on the list after one soft bounce');
  assert.equal((await store.get('full@example.com')).softBounces, 1);
});
