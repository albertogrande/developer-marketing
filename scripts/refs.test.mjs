// The reference-resolution rules and sourcing floors behind check-refs.mjs,
// run against small fixture id sets. The gate script itself wires in the real
// repo; these pin the rules so a refactor can't silently loosen them.

import test from 'node:test';
import assert from 'node:assert/strict';
import { makeResolver, sourcingProblems } from './lib/refs.mjs';
import { independentHostCount } from './lib/sources.mjs';

const resolves = makeResolver({
  ids: {
    guide: new Set(['02-docs-as-front-door']),
    weekly: new Set(['2026-W28']),
    articles: new Set(['2026-07-20-story']),
    'deep-dives': new Set(['2026-07-06-dive']),
    briefs: new Set(['2026-07-28-acme']),
    radar: new Set(['old-entry']),
    practices: new Set(['quickstart-under-five']),
    examples: new Set(['acme-changelog']),
    skills: new Set(['review-skill']),
    resources: new Set(['devrel-book']),
  },
  tags: new Set(['dx', 'metrics']),
  staticRoutes: new Set(['/', '/about', '/guide', '/practices', '/articles']),
});

test('static routes resolve, with and without trailing slash', () => {
  assert.ok(resolves('/about'));
  assert.ok(resolves('/about/'));
  assert.ok(resolves('/'));
  assert.ok(!resolves('/nonexistent'));
});

test('entry pages resolve against their collection ids', () => {
  assert.ok(resolves('/guide/02-docs-as-front-door'));
  assert.ok(resolves('/weekly/2026-W28'));
  assert.ok(resolves('/articles/2026-07-20-story'));
  assert.ok(resolves('/deep-dives/2026-07-06-dive'));
  assert.ok(resolves('/radar/old-entry'));
  assert.ok(!resolves('/guide/typo-section'));
  assert.ok(!resolves('/weekly/2026-w28'), 'ids are case-exact');
});

test('gallery anchors resolve against gallery ids', () => {
  assert.ok(resolves('/practices#quickstart-under-five'));
  assert.ok(resolves('/examples#acme-changelog'));
  assert.ok(resolves('/skills#review-skill'));
  assert.ok(resolves('/resources#devrel-book'));
  assert.ok(resolves('/briefs#2026-07-28-acme'));
  assert.ok(!resolves('/practices#nope'));
});

test('markdown siblings resolve per collection', () => {
  assert.ok(resolves('/guide/02-docs-as-front-door.md'));
  assert.ok(resolves('/practices/quickstart-under-five.md'));
  assert.ok(!resolves('/guide/missing.md'));
});

test('tag routes resolve against the tag vocabulary', () => {
  assert.ok(resolves('/tags/dx'));
  assert.ok(!resolves('/tags/unused'));
});

const src = (host, n) => ({ label: String(n), url: `https://${host}/p${n}` });

test('sourcing floor: articles need two sources', () => {
  assert.equal(
    sourcingProblems('articles', { sources: [src('a.com', 1)] }, 'f.md', independentHostCount).length,
    1
  );
  assert.deepEqual(
    sourcingProblems('articles', { sources: [src('a.com', 1), src('b.com', 2)] }, 'f.md', independentHostCount),
    []
  );
});

test('sourcing floor: deep dives need three sources', () => {
  assert.equal(
    sourcingProblems('deep-dives', { sources: [src('a.com', 1), src('b.com', 2)] }, 'f.md', independentHostCount).length,
    1
  );
  assert.deepEqual(
    sourcingProblems('deep-dives', { sources: [src('a.com', 1), src('b.com', 2), src('a.com', 3)] }, 'f.md', independentHostCount),
    []
  );
});

test('sourcing floor: one publisher across all sources is not independent', () => {
  const problems = sourcingProblems(
    'articles',
    { sources: [src('blog.vendor.com', 1), src('docs.vendor.com', 2)] },
    'f.md',
    independentHostCount
  );
  assert.equal(problems.length, 1);
  assert.match(problems[0], /one publisher/);
});

test('sourcing floor: zero sources reported as a count problem', () => {
  const problems = sourcingProblems('articles', {}, 'f.md', independentHostCount);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /0 source/);
});

test('sourcing floor: other collections are exempt', () => {
  assert.deepEqual(sourcingProblems('weekly', {}, 'f.md', independentHostCount), []);
  assert.deepEqual(sourcingProblems('briefs', {}, 'f.md', independentHostCount), []);
});
