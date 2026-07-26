// The build step that lets content stop encoding where the site is deployed.
// Small mdast trees by hand rather than a parser: the plugin's job is URL
// rewriting, and that is what these assert.

import test from 'node:test';
import assert from 'node:assert/strict';
import remarkBasePaths from './remark-base-paths.mjs';

const link = (url) => ({ type: 'link', url, children: [] });
const tree = (...children) => ({ type: 'root', children });

/** Run the plugin and return the urls in document order. */
function urls(node, base) {
  remarkBasePaths({ base })(node);
  const found = [];
  (function walk(n) {
    if (n.url) found.push(n.url);
    for (const child of n.children ?? []) walk(child);
  })(node);
  return found;
}

test('root-relative links get the base', () => {
  assert.deepEqual(
    urls(tree(link('/guide/02-docs-as-front-door'), link('/weekly/2026-W28')), '/developer-marketing'),
    ['/developer-marketing/guide/02-docs-as-front-door', '/developer-marketing/weekly/2026-W28']
  );
});

test('nothing else is touched', () => {
  const untouched = [
    'https://example.com/x',
    'http://example.com/x',
    '//cdn.example.com/x',
    'mailto:a@b.co',
    '#anchor',
    './sibling.md',
    '../parent.md',
  ];
  assert.deepEqual(urls(tree(...untouched.map(link)), '/developer-marketing'), untouched);
});

test('a link that already carries the base is not doubled', () => {
  // Belt and braces: check-refs rejects these, but a double prefix would be a
  // silently broken link rather than a loud one.
  assert.deepEqual(
    urls(tree(link('/developer-marketing/guide/00-start-here'), link('/developer-marketing')), '/developer-marketing'),
    ['/developer-marketing/guide/00-start-here', '/developer-marketing']
  );
});

test('serving at the root rewrites nothing', () => {
  assert.deepEqual(urls(tree(link('/guide/00-start-here')), '/'), ['/guide/00-start-here']);
  assert.deepEqual(urls(tree(link('/guide/00-start-here')), undefined), ['/guide/00-start-here']);
});

test('images and reference definitions are rewritten too', () => {
  const doc = tree(
    { type: 'image', url: '/og-default.png', children: [] },
    { type: 'definition', identifier: 'g', url: '/guide', children: [] }
  );
  assert.deepEqual(urls(doc, '/developer-marketing'), [
    '/developer-marketing/og-default.png',
    '/developer-marketing/guide',
  ]);
});

test('links nested inside other nodes are found', () => {
  const doc = tree({
    type: 'listItem',
    children: [{ type: 'paragraph', children: [{ type: 'strong', children: [link('/practices')] }] }],
  });
  assert.deepEqual(urls(doc, '/developer-marketing'), ['/developer-marketing/practices']);
});

test('a trailing slash on the base does not produce a double slash', () => {
  assert.deepEqual(urls(tree(link('/guide')), '/developer-marketing/'), ['/developer-marketing/guide']);
});
