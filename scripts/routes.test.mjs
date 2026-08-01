// The route/frontmatter/date knowledge in lib/routes.mjs is depended on by
// both gates, the sitemap lastmod hook, and the IndexNow ping — four consumers
// and, until now, zero tests. Pure helpers are tested against literals and
// temp-dir fixtures; the repo-coupled functions get smoke tests against the
// real tree so a broken checkout still fails loudly.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  frontmatterOf,
  entryLastmod,
  pageRoutes,
  routesForContentFile,
  routeLastmod,
  siteConfig,
} from './lib/routes.mjs';

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'routes-test-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('frontmatterOf: parses YAML block and returns the body', () => {
  withTempDir((dir) => {
    const f = join(dir, 'a.md');
    writeFileSync(f, '---\ntitle: Hello\ntags: [a, b]\n---\nBody text.\n');
    const { fm, body, err } = frontmatterOf(f);
    assert.equal(err, undefined);
    assert.equal(fm.title, 'Hello');
    assert.deepEqual(fm.tags, ['a', 'b']);
    assert.equal(body.trim(), 'Body text.');
  });
});

test('frontmatterOf: broken YAML reports err instead of throwing', () => {
  withTempDir((dir) => {
    const f = join(dir, 'bad.md');
    writeFileSync(f, '---\ntitle: [unclosed\n---\nBody.\n');
    const { fm, err } = frontmatterOf(f);
    assert.equal(fm, null);
    assert.ok(err);
  });
});

test('frontmatterOf: no frontmatter yields empty fm and full body', () => {
  withTempDir((dir) => {
    const f = join(dir, 'plain.md');
    writeFileSync(f, 'Just text.\n');
    const { fm, body } = frontmatterOf(f);
    assert.deepEqual(fm, {});
    assert.equal(body, 'Just text.\n');
  });
});

test('entryLastmod: newest of the date-ish fields wins', () => {
  assert.equal(entryLastmod({ date: '2026-07-01' }), '2026-07-01');
  assert.equal(entryLastmod({ date: '2026-07-01', updated: '2026-07-15' }), '2026-07-15');
  assert.equal(
    entryLastmod({ verified: '2026-06-01', probe: { date: '2026-07-20' } }),
    '2026-07-20'
  );
});

test('entryLastmod: Date instances and datetime strings truncate to the day', () => {
  assert.equal(entryLastmod({ date: new Date('2026-07-01T10:30:00Z') }), '2026-07-01');
  assert.equal(entryLastmod({ date: '2026-07-01T10:30:00Z' }), '2026-07-01');
});

test('entryLastmod: undefined when nothing dated', () => {
  assert.equal(entryLastmod({}), undefined);
  assert.equal(entryLastmod(undefined), undefined);
});

test('pageRoutes: index.astro maps to parent, name.ext.ts keeps its extension', () => {
  withTempDir((dir) => {
    writeFileSync(join(dir, 'index.astro'), '');
    writeFileSync(join(dir, 'about.astro'), '');
    writeFileSync(join(dir, 'llms.txt.ts'), '');
    writeFileSync(join(dir, '404.astro'), '');
    writeFileSync(join(dir, '[tag].astro'), '');
    mkdirSync(join(dir, 'guide'));
    writeFileSync(join(dir, 'guide', 'index.astro'), '');
    writeFileSync(join(dir, 'guide', '[slug].md.ts'), '');
    const routes = pageRoutes(dir);
    assert.deepEqual(
      [...routes].sort(),
      ['/', '/about', '/guide', '/llms.txt'],
      'dynamic and 404 routes are excluded'
    );
  });
});

test('routesForContentFile: page collections invalidate entry, index, home', () => {
  assert.deepEqual(routesForContentFile('src/content/articles/2026-07-20-story.md'), [
    '/articles/2026-07-20-story',
    '/articles',
    '/',
  ]);
  assert.deepEqual(routesForContentFile('src/content/practices/quickstart.md'), [
    '/practices',
    '/',
  ]);
  assert.deepEqual(routesForContentFile('newsletter/README.md'), []);
});

// Smoke tests against the real checkout: the exact values move with content,
// but the shape must hold or the sitemap and both gates are broken.
test('routeLastmod: real tree yields dated routes incl. home', () => {
  const map = routeLastmod();
  assert.ok(map.size > 0);
  assert.match(map.get('/') ?? '', /^\d{4}-\d{2}-\d{2}$/);
  assert.match(map.get('/guide') ?? '', /^\d{4}-\d{2}-\d{2}$/);
});

test('siteConfig: origin has no trailing slash; base is "" or /prefix', () => {
  const { site, base } = siteConfig();
  assert.ok(!site.endsWith('/'));
  assert.ok(base === '' || (base.startsWith('/') && !base.endsWith('/')));
});
