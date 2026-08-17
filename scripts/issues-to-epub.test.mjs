import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mdToXhtml, buildEpub } from './issues-to-epub.mjs';

test('headings become the h2 outline, with stable anchors', () => {
  const { html, toc } = mdToXhtml('## The discount is a data trade\n\nBody.\n');
  assert.match(html, /<h2 id="the-discount-is-a-data-trade">/);
  assert.deepEqual(toc, [{ id: 'the-discount-is-a-data-trade', label: 'The discount is a data trade' }]);
});

test('base-less content links are absolutized, external ones left alone', () => {
  const { html } = mdToXhtml('See [the guide](/guide/01-positioning) and [TC](https://techcrunch.com/x).');
  assert.match(html, /href="https:\/\/thebeat\.dev\/guide\/01-positioning"/);
  assert.match(html, /href="https:\/\/techcrunch\.com\/x"/);
});

test('emphasis nested inside bold keeps both, and its closing run', () => {
  // `**a *b*** —` is the shape the weekly editor actually writes; a naive
  // non-greedy `**` pass strands a stray asterisk after the strong.
  const { html } = mdToXhtml('- **An AGENTS.md that says *do not generate*** — the first one.\n');
  assert.match(html, /<strong>An AGENTS\.md that says <em>do not generate<\/em><\/strong> — the first one\./);
  assert.doesNotMatch(html, /\*/);
});

test('code spans stay literal and do not eat ordinary numbers', () => {
  const { html } = mdToXhtml('Run `npx skills add` — 20x less than in 2026.');
  assert.match(html, /<code>npx skills add<\/code>/);
  assert.match(html, /20x less than in 2026\./);
});

test('wrapped list items join as one item, not one item per line', () => {
  const { html } = mdToXhtml('- **First.** A line\n  wrapped across two.\n- **Second.** Another.\n');
  assert.equal(html.match(/<li>/g).length, 2);
  assert.match(html, /A line\s+wrapped across two\./);
});

test('markup characters in prose are escaped', () => {
  const { html } = mdToXhtml('Ampersands & angle brackets in `a <tag>` survive.');
  assert.match(html, /Ampersands &amp; angle brackets/);
  assert.match(html, /<code>a &lt;tag&gt;<\/code>/);
});

test('void elements close, so the spine document stays XML', () => {
  const { html } = mdToXhtml('One\n\n---\n\nTwo  \nthree\n');
  assert.match(html, /<hr\s*\/>/);
  assert.match(html, /<br\s*\/>/);
  assert.doesNotMatch(html, /<(hr|br)[^/]*>/);
});

test('GFM tables render, so a desk body with one is not silently mangled', () => {
  const { html } = mdToXhtml('| a | b |\n| --- | --- |\n| 1 | 2 |\n');
  assert.match(html, /<table>[\s\S]*<td>1<\/td>/);
});

test('buildEpub writes an OCF archive with mimetype stored first', () => {
  const dir = mkdtempSync(join(tmpdir(), 'epub-'));
  const file = join(dir, '2026-W32.md');
  writeFileSync(
    file,
    [
      '---',
      'title: A commodity, priced',
      'week: 2026-W32',
      'date: 2026-08-03',
      'published: 2026-08-10',
      'summary: One sentence.',
      'tags: [pricing]',
      'sources:',
      '  - label: TechCrunch',
      '    url: https://techcrunch.com/x',
      'related:',
      '  - label: Guide',
      '    href: /guide/01-positioning',
      '---',
      '',
      '## A heading',
      '',
      'A paragraph.',
      '',
    ].join('\n')
  );

  const buf = buildEpub(file, '2026-W32');
  assert.equal(buf.subarray(0, 4).toString('latin1'), 'PK\x03\x04');
  // OCF: the first entry must be an uncompressed `mimetype`, so a reader can
  // sniff the type without inflating anything.
  assert.equal(buf.readUInt16LE(8), 0, 'mimetype must be stored, not deflated');
  assert.equal(buf.subarray(30, 38).toString('latin1'), 'mimetype');
  assert.equal(buf.subarray(38, 58).toString('latin1'), 'application/epub+zip');
  assert.ok(buf.includes(Buffer.from('OEBPS/content.opf')));
  assert.ok(buf.includes(Buffer.from('PK\x05\x06', 'latin1')), 'end-of-central-directory record');
});

test('the same issue builds byte-identical books', () => {
  const dir = mkdtempSync(join(tmpdir(), 'epub-'));
  const file = join(dir, '2026-W32.md');
  writeFileSync(file, '---\ntitle: T\nweek: 2026-W32\npublished: 2026-08-10\n---\n\nBody.\n');
  assert.deepEqual(buildEpub(file, '2026-W32'), buildEpub(file, '2026-W32'));
});

test('an issue with unreadable frontmatter fails loudly', () => {
  const dir = mkdtempSync(join(tmpdir(), 'epub-'));
  const file = join(dir, 'broken.md');
  writeFileSync(file, 'No frontmatter at all.\n');
  assert.throws(() => buildEpub(file, 'broken'), /unreadable frontmatter/);
});
