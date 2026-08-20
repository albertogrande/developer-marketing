import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildEpub, buildHtml, toXhtml } from './epub.mjs';

const BOOK = {
  title: 'A Field Dossier',
  subtitle: 'Notes before a meeting',
  author: 'The Beat',
  identifier: 'urn:uuid:test-0001',
  modified: '2026-08-20T12:00:00Z',
  description: 'A test book.',
  subjects: ['research'],
  chapters: [
    { title: 'How to read this', html: '<h1>How to read this</h1><p>Short &amp; sharp.</p>' },
    { title: 'At a glance', html: '<h1>At a glance</h1><p>Facts.<br>More facts.</p><hr>' },
  ],
};

/* ------------------------------------------------------------- toXhtml --- */

test('toXhtml closes void elements', () => {
  assert.equal(toXhtml('<p>a<br>b</p>'), '<p>a<br />b</p>');
  assert.equal(toXhtml('<hr>'), '<hr />');
  assert.equal(toXhtml('<img src="x.png" alt="x">'), '<img src="x.png" alt="x" />');
  // Already-closed tags must not gain a second slash.
  assert.equal(toXhtml('<br />'), '<br />');
});

test('toXhtml repairs bare ampersands but keeps real references', () => {
  assert.equal(toXhtml('<p>Fish & chips</p>'), '<p>Fish &amp; chips</p>');
  assert.equal(toXhtml('<p>a &amp; b</p>'), '<p>a &amp; b</p>');
  assert.equal(toXhtml('<p>&#8212;</p>'), '<p>&#8212;</p>');
  assert.equal(toXhtml('<p>&#x2014;</p>'), '<p>&#x2014;</p>');
  // Undeclared named entities are fatal in XML without a DTD, so they resolve.
  assert.equal(toXhtml('<p>a&nbsp;b</p>'), '<p>a b</p>');
  assert.equal(toXhtml('<p>a&mdash;b</p>'), '<p>a—b</p>');
});

/* ------------------------------------------------------------ buildEpub --- */

test('required metadata is enforced', () => {
  assert.throws(() => buildEpub({ ...BOOK, title: '' }), /`title` is required/);
  assert.throws(() => buildEpub({ ...BOOK, identifier: '' }), /`identifier` is required/);
  assert.throws(() => buildEpub({ ...BOOK, modified: '' }), /`modified` is required/);
  assert.throws(() => buildEpub({ ...BOOK, modified: 'not a date' }), /invalid `modified`/);
  assert.throws(() => buildEpub({ ...BOOK, chapters: [] }), /at least one chapter/);
});

test('the same book builds byte-identically twice', () => {
  assert.deepEqual(buildEpub(BOOK), buildEpub(BOOK));
});

test('unpacks into a well-formed EPUB 3', (t) => {
  let dir;
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
  } catch {
    t.skip('unzip not available');
    return;
  }

  try {
    dir = mkdtempSync(join(tmpdir(), 'epub-test-'));
    const file = join(dir, 'book.epub');
    writeFileSync(file, buildEpub(BOOK));
    execFileSync('unzip', ['-t', file], { stdio: 'ignore' });
    execFileSync('unzip', ['-q', file, '-d', dir]);

    const read = (p) => readFileSync(join(dir, p), 'utf8');

    assert.equal(read('mimetype'), 'application/epub+zip');
    assert.match(read('META-INF/container.xml'), /full-path="OEBPS\/content\.opf"/);

    const opf = read('OEBPS/content.opf');
    assert.match(opf, /<dc:title>A Field Dossier<\/dc:title>/);
    assert.match(opf, /<dc:identifier id="bookid">urn:uuid:test-0001<\/dc:identifier>/);
    assert.match(opf, /<meta property="dcterms:modified">2026-08-20T12:00:00Z<\/meta>/);

    // Every manifest item must exist on disk, and every spine idref must be a
    // manifest id — the two failures that produce a book with missing chapters.
    const ids = new Set([...opf.matchAll(/<item id="([^"]+)" href="([^"]+)"/g)].map((m) => m[1]));
    for (const [, , href] of opf.matchAll(/<item id="([^"]+)" href="([^"]+)"/g)) {
      readFileSync(join(dir, 'OEBPS', href));
    }
    for (const [, idref] of opf.matchAll(/<itemref idref="([^"]+)"\/>/g)) {
      assert.ok(ids.has(idref), `spine references unknown manifest id ${idref}`);
    }

    // One nav entry and one NCX navPoint per chapter, in order.
    const nav = read('OEBPS/nav.xhtml');
    const ncx = read('OEBPS/toc.ncx');
    for (const ch of BOOK.chapters) {
      assert.ok(nav.includes(ch.title), `nav is missing ${ch.title}`);
      assert.ok(ncx.includes(ch.title), `ncx is missing ${ch.title}`);
    }
    assert.equal([...ncx.matchAll(/<navPoint /g)].length, BOOK.chapters.length);

    // The chapter bodies must be XHTML — the `<br>` in chapter 2 gets closed.
    assert.match(read('OEBPS/ch-02.xhtml'), /<br \/>/);
    assert.doesNotMatch(read('OEBPS/ch-02.xhtml'), /<br>/);
  } finally {
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------ buildHtml --- */

test('the HTML twin carries every chapter and links to each', () => {
  const html = buildHtml(BOOK);
  assert.match(html, /<title>A Field Dossier<\/title>/);
  for (const [i, ch] of BOOK.chapters.entries()) {
    const id = `ch-${String(i + 1).padStart(2, '0')}`;
    assert.ok(html.includes(`id="${id}"`), `missing section ${id}`);
    assert.ok(html.includes(`href="#${id}"`), `missing toc link for ${id}`);
    assert.ok(html.includes(ch.title));
  }
});
