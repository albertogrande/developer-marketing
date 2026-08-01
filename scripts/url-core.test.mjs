// The single URL rule behind withBase/absUrl/canonicalFor and, through them,
// every canonical, sitemap entry, feed id, and internal link. A regression
// here re-forms every URL on the site — worth pinning precisely.

import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePath } from '../src/lib/url-core.mjs';

test('page routes gain a trailing slash', () => {
  assert.equal(normalizePath('/guide'), '/guide/');
  assert.equal(normalizePath('/guide/02-docs-as-front-door'), '/guide/02-docs-as-front-door/');
  assert.equal(normalizePath('/weekly/2026-W28'), '/weekly/2026-W28/');
});

test('already-slashed routes are untouched', () => {
  assert.equal(normalizePath('/guide/'), '/guide/');
  assert.equal(normalizePath('/'), '/');
});

test('file-ish routes never gain a slash', () => {
  assert.equal(normalizePath('/llms.txt'), '/llms.txt');
  assert.equal(normalizePath('/guide/02-docs.md'), '/guide/02-docs.md');
  assert.equal(normalizePath('/feed.xml'), '/feed.xml');
  assert.equal(normalizePath('/api.json'), '/api.json');
});

test('hash and query survive, slash lands before them', () => {
  assert.equal(normalizePath('/practices#quickstart'), '/practices/#quickstart');
  assert.equal(normalizePath('/articles?page=2'), '/articles/?page=2');
  assert.equal(normalizePath('/feed.xml?x=1'), '/feed.xml?x=1');
});

test('empty path is home', () => {
  assert.equal(normalizePath(''), '/');
  assert.equal(normalizePath('#top'), '/#top');
});
