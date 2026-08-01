// The URL grammar behind the liveness checker and the meaning of "independent
// sources" behind the sourcing floor. Both are shared knowledge in
// lib/sources.mjs; a silent regression here rots links or lets a one-publisher
// article through the gate.

import test from 'node:test';
import assert from 'node:assert/strict';
import { extractUrls, registrableHost, independentHostCount } from './lib/sources.mjs';

test('extractUrls: frontmatter url fields', () => {
  assert.deepEqual(
    extractUrls('source:\n  label: X\n  url: https://example.com/post\n'),
    ['https://example.com/post']
  );
});

test('extractUrls: markdown links keep balanced Wikipedia-style parens', () => {
  assert.deepEqual(
    extractUrls('[foo](https://en.wikipedia.org/wiki/Foo_(bar))'),
    ['https://en.wikipedia.org/wiki/Foo_(bar)']
  );
});

test('extractUrls: bare links in signals one-liners, trailing punctuation stripped', () => {
  assert.deepEqual(
    extractUrls('- 2026-07-30 something happened https://news.example.org/item.'),
    ['https://news.example.org/item']
  );
});

test('extractUrls: unbalanced trailing paren is cruft', () => {
  assert.deepEqual(
    extractUrls('(see https://example.com/page)'),
    ['https://example.com/page']
  );
});

test('extractUrls: deduplicates across syntaxes', () => {
  const text = 'url: https://example.com/a\n[a](https://example.com/a)';
  assert.deepEqual(extractUrls(text), ['https://example.com/a']);
});

test('registrableHost: strips subdomains and www', () => {
  assert.equal(registrableHost('https://blog.vendor.com/post'), 'vendor.com');
  assert.equal(registrableHost('https://www.vendor.com/'), 'vendor.com');
  assert.equal(registrableHost('https://docs.api.vendor.com/x'), 'vendor.com');
});

test('registrableHost: keeps three labels under deep public suffixes', () => {
  assert.equal(registrableHost('https://www.example.co.uk/page'), 'example.co.uk');
  assert.equal(registrableHost('https://news.example.com.au/'), 'example.com.au');
});

test('registrableHost: null for garbage', () => {
  assert.equal(registrableHost('not a url'), null);
});

test('independentHostCount: same publisher counts once', () => {
  assert.equal(
    independentHostCount([
      'https://blog.cloudflare.com/post',
      'https://developers.cloudflare.com/docs',
    ]),
    1
  );
});

test('independentHostCount: distinct publishers count separately', () => {
  assert.equal(
    independentHostCount([
      'https://blog.cloudflare.com/post',
      'https://w3techs.com/technologies',
      'https://queue.acm.org/detail.cfm?id=1',
    ]),
    3
  );
});
