// The thread inversion's edge cases, pinned against fixtures.
//
// The map-building itself is dull; what is not dull is which date an issue
// contributes, what happens to a member filed onto two threads, and what
// happens to a slug naming no thread. Each of those has a wrong answer that
// looks right until it ships.

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildThreadGraph, threadByStanding, THREAD_STATUS_RANK } from '../src/lib/thread-graph.mjs';

const thread = (id, data = {}) => ({
  id,
  data: { status: 'open', updated: new Date('2026-08-01'), sections: [], ...data },
});

const signal = (id, date, threads, extra = {}) => ({
  id,
  data: { title: id, company: 'Acme', summary: 's', date: new Date(date), threads, ...extra },
});

const issue = (id, date, published, threads) => ({
  id,
  data: {
    title: id,
    summary: 's',
    date: new Date(date),
    published: new Date(published),
    threads,
  },
});

test('members come back newest first', () => {
  const { membersByThread } = buildThreadGraph({
    threads: [thread('t')],
    signals: [
      signal('a', '2026-08-01', ['t']),
      signal('c', '2026-08-10', ['t']),
      signal('b', '2026-08-05', ['t']),
    ],
  });
  assert.deepEqual(
    membersByThread.get('t').map((m) => m.id),
    ['c', 'b', 'a']
  );
});

test('an issue contributes `published`, not the Monday it covers', () => {
  // The trap: `date` is a week behind by construction, so keying off it would
  // file the issue before a signal it actually postdates.
  const { membersByThread } = buildThreadGraph({
    threads: [thread('t')],
    signals: [signal('s', '2026-08-05', ['t'])],
    issues: [issue('2026-W31', '2026-08-03', '2026-08-10', ['t'])],
  });
  const members = membersByThread.get('t');
  assert.deepEqual(members.map((m) => m.id), ['2026-W31', 's']);
  assert.equal(members[0].date.toISOString().slice(0, 10), '2026-08-10');
});

test('a member filed onto two threads appears in both timelines', () => {
  const { membersByThread, threadsByMember } = buildThreadGraph({
    threads: [thread('t1'), thread('t2')],
    signals: [signal('s', '2026-08-05', ['t1', 't2'])],
  });
  assert.equal(membersByThread.get('t1').length, 1);
  assert.equal(membersByThread.get('t2').length, 1);
  assert.deepEqual(
    threadsByMember.get('signals:s').map((t) => t.id),
    ['t1', 't2']
  );
});

test('an unknown thread slug is dropped, not thrown — the gate is what fails', () => {
  let graph;
  assert.doesNotThrow(() => {
    graph = buildThreadGraph({
      threads: [thread('t')],
      signals: [signal('s', '2026-08-05', ['typo-slug'])],
    });
  });
  assert.equal(graph.membersByThread.has('typo-slug'), false);
  assert.equal(graph.threadsByMember.has('signals:s'), false);
});

test('threadsByMember keys are namespaced, so a signal and an issue cannot collide', () => {
  const { threadsByMember } = buildThreadGraph({
    threads: [thread('t')],
    signals: [signal('same-id', '2026-08-05', ['t'])],
    issues: [issue('same-id', '2026-08-03', '2026-08-10', ['t'])],
  });
  assert.deepEqual([...threadsByMember.keys()].sort(), ['issues:same-id', 'signals:same-id']);
});

test('threadsBySection inverts sections, including one section carrying two threads', () => {
  const { threadsBySection } = buildThreadGraph({
    threads: [
      thread('t1', { sections: ['01-positioning', '04-dx'] }),
      thread('t2', { sections: ['01-positioning'] }),
    ],
  });
  assert.deepEqual(threadsBySection.get('01-positioning').map((t) => t.id), ['t1', 't2']);
  assert.deepEqual(threadsBySection.get('04-dx').map((t) => t.id), ['t1']);
});

test('a signal carries its company into the timeline; an issue does not', () => {
  const { membersByThread } = buildThreadGraph({
    threads: [thread('t')],
    signals: [signal('s', '2026-08-05', ['t'])],
    issues: [issue('w', '2026-08-03', '2026-08-10', ['t'])],
  });
  const [issueMember, signalMember] = membersByThread.get('t');
  assert.equal(signalMember.company, 'Acme');
  assert.equal(issueMember.company, undefined);
  assert.equal(signalMember.href, '/signals#s');
  assert.equal(issueMember.href, '/issues/w');
});

test('threads sort live-first, then most recently worked', () => {
  const threads = [
    thread('resolved-recent', { status: 'resolved', updated: new Date('2026-08-15') }),
    thread('open-old', { status: 'open', updated: new Date('2026-07-01') }),
    thread('open-recent', { status: 'open', updated: new Date('2026-08-10') }),
    thread('dormant', { status: 'dormant', updated: new Date('2026-08-14') }),
  ];
  assert.deepEqual(
    [...threads].sort(threadByStanding).map((t) => t.id),
    ['open-recent', 'open-old', 'dormant', 'resolved-recent']
  );
});

test('every status has a rank — an unranked one would sort as NaN and scramble the page', () => {
  for (const status of ['open', 'dormant', 'resolved']) {
    assert.equal(typeof THREAD_STATUS_RANK[status], 'number');
  }
});
