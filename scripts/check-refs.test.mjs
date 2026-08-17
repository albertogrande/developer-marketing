// Wiring tests for the referential-integrity gate.
//
// scripts/lib/refs.mjs already covers the resolution RULES. What had no
// coverage is how check-refs enumerates ids, tags and routes from a real tree
// and feeds them to the resolver — and that is the dangerous half: a bug there
// makes the gate pass vacuously, on every collection at once, while this suite
// stays green. It runs inside `npm run build`, so it gates every deploy and
// every unattended 3am writer commit.
//
// So these tests assert what the gate CATCHES, not merely that it permits the
// real tree. Each builds a minimal site under a temp root, breaks exactly one
// thing, and requires a matching problem back.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRefs } from './check-refs.mjs';

/**
 * A minimal but valid site tree. Callers mutate one thing to make it invalid.
 * @param {Record<string,string>} files  extra/overriding files, path → content
 */
function fixture(files = {}) {
  const root = mkdtempSync(join(tmpdir(), 'check-refs-'));
  const write = (rel, body) => {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), body);
  };

  // Static routes are derived from src/pages/, so the fixture needs some.
  write('src/pages/index.astro', '');
  write('src/pages/guide/index.astro', '');

  write(
    'src/content/guide/01-positioning.md',
    ['---', 'title: Positioning', 'tags: [positioning]', '---', '', 'Body.', ''].join('\n')
  );
  write(
    'src/content/claims/a-claim.md',
    ['---', 'title: A claim', 'section: 01-positioning', '---', '', 'Body.', ''].join('\n')
  );
  write('src/content/threads/a-thread.md', THREAD);

  for (const [rel, body] of Object.entries(files)) write(rel, body);
  return { root, write, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

// A valid thread, spread out so a test can override one line at a time.
const THREAD = [
  '---',
  'title: A thread',
  'question: Does the thing hold?',
  'summary: Where it stands.',
  'momentum: rising',
  'started: 2026-07-01',
  'updated: 2026-08-01',
  'sections: [01-positioning]',
  '---',
  '',
  'Body.',
  '',
].join('\n');

// A signal filed onto `threadSlug`. Carries the source check-refs demands so
// the only thing under test is the membership edge.
const signalOnThread = (threadSlug) =>
  [
    '---',
    'title: Acme ships',
    'company: Acme',
    'summary: Acme shipped a thing.',
    'date: 2026-08-16',
    'source:',
    '  label: Acme',
    '  url: https://example.com/acme',
    `threads: [${threadSlug}]`,
    '---',
    '',
    'Body.',
    '',
  ].join('\n');

const run = (root) => checkRefs({ root });

test('a sound fixture tree reports no problems', () => {
  const f = fixture();
  try {
    const { problems, counts } = run(f.root);
    assert.deepEqual(problems, [], `expected clean, got: ${problems.join('; ')}`);
    // Guard against the vacuous pass: a gate that enumerated nothing would
    // also report zero problems.
    assert.equal(counts.guide, 1);
    assert.equal(counts.claims, 1);
    assert.equal(counts.threads, 1);
    assert.ok(counts.staticRoutes >= 2, `expected routes from src/pages, got ${counts.staticRoutes}`);
  } finally {
    f.cleanup();
  }
});

test('catches a claim pointing at a guide section that does not exist', () => {
  const f = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: A claim', 'section: 99-does-not-exist', '---', '', 'Body.', '',
    ].join('\n'),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /99-does-not-exist.*not a guide section/);
  } finally {
    f.cleanup();
  }
});

test('catches a related href that resolves to nothing', () => {
  const f = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: A claim', 'section: 01-positioning',
      'related:', '  - label: Nope', '    href: /guide/no-such-section',
      '---', '', 'Body.', '',
    ].join('\n'),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /related href .* resolves to nothing/);
  } finally {
    f.cleanup();
  }
});

test('catches a relative body link, which 404s on the built site', () => {
  const f = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: A claim', 'section: 01-positioning', '---', '',
      'See [the guide](./01-positioning.md).', '',
    ].join('\n'),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /relative body link .* breaks on the built site/);
  } finally {
    f.cleanup();
  }
});

test('catches a dangling body link but allows a resolving one', () => {
  const good = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: A claim', 'section: 01-positioning', '---', '',
      'See [the guide](/guide/01-positioning) and [tags](/tags/positioning).', '',
    ].join('\n'),
  });
  try {
    assert.deepEqual(run(good.root).problems, []);
  } finally {
    good.cleanup();
  }

  const bad = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: A claim', 'section: 01-positioning', '---', '',
      'See [nothing](/guide/nope).', '',
    ].join('\n'),
  });
  try {
    const { problems } = run(bad.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /body link .* resolves to nothing/);
  } finally {
    bad.cleanup();
  }
});

test('catches a signal missing the primary source that makes it checkable', () => {
  const f = fixture({
    'src/content/signals/2026-08-16-acme.md': [
      '---', 'title: Acme ships', 'company: Acme', 'summary: Acme shipped a thing.',
      'date: 2026-08-16', '---', '', 'Body.', '',
    ].join('\n'),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /missing source\.url — an unverifiable item is a rumour/);
  } finally {
    f.cleanup();
  }
});

test('catches unparseable frontmatter rather than skipping the file', () => {
  const f = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: [unclosed', 'section: 01-positioning', '---', '', 'Body.', '',
    ].join('\n'),
  });
  try {
    const { problems } = run(f.root);
    assert.ok(problems.length >= 1, 'a malformed file must not pass silently');
    assert.match(problems[0], /unparseable frontmatter/);
  } finally {
    f.cleanup();
  }
});

test('catches a signal filed onto a thread that does not exist', () => {
  const f = fixture({ 'src/content/signals/2026-08-16-acme.md': signalOnThread('no-such-thread') });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /threads "no-such-thread" is not a thread/);
  } finally {
    f.cleanup();
  }
});

test('allows a signal filed onto a thread that does exist', () => {
  const f = fixture({ 'src/content/signals/2026-08-16-acme.md': signalOnThread('a-thread') });
  try {
    assert.deepEqual(run(f.root).problems, []);
  } finally {
    f.cleanup();
  }
});

test('catches a thread with no question — that would just be a tag', () => {
  const f = fixture({
    'src/content/threads/a-thread.md': THREAD.replace('question: Does the thing hold?\n', ''),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /missing question/);
  } finally {
    f.cleanup();
  }
});

test('catches a thread with no updated stamp — the page would be undated', () => {
  const f = fixture({
    'src/content/threads/a-thread.md': THREAD.replace('updated: 2026-08-01\n', ''),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /missing updated/);
  } finally {
    f.cleanup();
  }
});

test('catches a thread pointing at a guide section that does not exist', () => {
  const f = fixture({
    'src/content/threads/a-thread.md': THREAD.replace(
      'sections: [01-positioning]',
      'sections: [99-nope]'
    ),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /sections "99-nope" is not a guide section/);
  } finally {
    f.cleanup();
  }
});

test('catches an open loop that states nothing which could settle it', () => {
  const f = fixture({
    'src/content/threads/a-thread.md': THREAD.replace(
      'sections: [01-positioning]',
      ['sections: [01-positioning]', 'openLoops:', '  - by: end of August'].join('\n')
    ),
  });
  try {
    const { problems } = run(f.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /openLoops entry has no question/);
  } finally {
    f.cleanup();
  }
});

// The regression test for PAGE_COLLECTIONS in lib/refs.mjs. Without 'threads'
// there, the GOOD case below fails while /threads/<id>.md keeps resolving off
// the generic ids branch — an asymmetry that reads as a content bug.
test('resolves a /threads/<id> link but not a bogus one', () => {
  const good = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: A claim', 'section: 01-positioning', '---', '',
      'See [the thread](/threads/a-thread) and [its markdown](/threads/a-thread.md).', '',
    ].join('\n'),
  });
  try {
    assert.deepEqual(run(good.root).problems, []);
  } finally {
    good.cleanup();
  }

  const bad = fixture({
    'src/content/claims/a-claim.md': [
      '---', 'title: A claim', 'section: 01-positioning', '---', '',
      'See [nothing](/threads/nope).', '',
    ].join('\n'),
  });
  try {
    const { problems } = run(bad.root);
    assert.equal(problems.length, 1, `got: ${problems.join('; ')}`);
    assert.match(problems[0], /body link .* resolves to nothing/);
  } finally {
    bad.cleanup();
  }
});

test('the real repo tree passes its own gate', () => {
  const { problems, counts } = checkRefs();
  assert.deepEqual(problems, [], `repo has broken refs: ${problems.join('; ')}`);
  assert.ok(counts.guide > 0 && counts.claims > 0 && counts.staticRoutes > 0);
  assert.ok(counts.threads > 0, 'the repo should carry at least one thread');
});
