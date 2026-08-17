#!/usr/bin/env node
// Weekly issues → EPUB 3, for e-readers (Kindle's Send-to-Kindle takes EPUB
// directly since 2022; no MOBI conversion needed).
//
// The site is the canonical form of an issue and stays that way: this writes a
// disposable reading copy into gitignored .cache/epub/, never into content. It
// reads the same frontmatter the gates read (scripts/lib/routes.mjs) and the
// same site origin every other URL-producing script reads (site.config.mjs), so
// a rehomed site rehomes the links inside the book too.
//
//   node scripts/issues-to-epub.mjs --latest 2
//   node scripts/issues-to-epub.mjs 2026-W31 2026-W32 --out /tmp/books
//
// Markdown goes through `marked` — the same converter src/lib/markdown.ts uses
// for the feeds and the .md siblings — so a book and a feed render an issue the
// same way, GFM tables included. That helper is TypeScript under src/ and out of
// reach from a plain-node script; the shared thing here is the converter, not a
// second copy of the markdown rules. The ZIP writer is hand-rolled because an
// EPUB is a ZIP with one fixed first entry, and that is smaller than a dep.

import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import { frontmatterOf } from './lib/routes.mjs';
import { SITE_URL } from '../site.config.mjs';

const ISSUES_DIR = 'src/content/issues';

// ---------------------------------------------------------------------------
// Markdown → XHTML
//
// XHTML, not HTML: an EPUB spine document has to parse as XML. marked emits
// HTML5, so void elements are closed on the way out. Raw HTML in a body would
// still ride through unbalanced — no issue has ever carried any, and the
// editor writes markdown, so that stays an assumption rather than a sanitizer.

const marked = new Marked({ gfm: true });

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const VOID = /<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b([^>]*?)\s*\/?>/gi;

// Content links are base-less by house rule (/guide/…, /signals#…). In a file
// that leaves the site entirely they have to become absolute or they dead-end.
const ROOT_REL = /(href|src)="(\/[^"]*)"/g;
const absolutize = (href) => (String(href).startsWith('/') ? SITE_URL + href : String(href));

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

// One line of markdown, no block wrapper — for the summary line.
export const inlineXhtml = (text) =>
  marked
    .parseInline(String(text), { async: false })
    .replace(VOID, (_, tag, attrs) => `<${tag}${attrs}/>`)
    .replace(ROOT_REL, (_, attr, path) => `${attr}="${SITE_URL}${path}"`);

// Returns { html, toc } — toc is the h2 outline, which becomes the book's
// navigation so a long special issue is still skimmable on the device.
export function mdToXhtml(md) {
  const toc = [];
  const html = marked
    .parse(md, { async: false })
    .replace(VOID, (_, tag, attrs) => `<${tag}${attrs}/>`)
    .replace(ROOT_REL, (_, attr, path) => `${attr}="${SITE_URL}${path}"`)
    // marked stopped emitting heading ids in v5; the nav needs anchors.
    .replace(/<h2>([\s\S]*?)<\/h2>/g, (_, inner) => {
      const label = inner.replace(/<[^>]+>/g, '').trim();
      const id = slug(label);
      toc.push({ id, label });
      return `<h2 id="${id}">${inner}</h2>`;
    });
  return { html, toc };
}

// ---------------------------------------------------------------------------
// ZIP (stored + deflate), enough of it to write an EPUB

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// A fixed timestamp, not the clock: same input, same bytes. The house rule
// against Date.now() in the build applies here for the same reason.
const DOS_TIME = 0;
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1;

function zip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const { name, data, store } of entries) {
    const raw = Buffer.from(data);
    const body = store ? raw : deflateRawSync(raw, { level: 9 });
    const method = store ? 0 : 8;
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, body);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(method, 10);
    cd.writeUInt16LE(DOS_TIME, 12);
    cd.writeUInt16LE(DOS_DATE, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(body.length, 20);
    cd.writeUInt32LE(raw.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(0, 38); // external attrs
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + body.length;
  }

  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...chunks, cdBuf, end]);
}

// ---------------------------------------------------------------------------
// EPUB

const CSS = `
body { font-family: Georgia, serif; line-height: 1.5; margin: 0 1em; }
h1 { font-size: 1.5em; line-height: 1.25; margin: 1em 0 0.25em; }
h2 { font-size: 1.15em; margin: 1.6em 0 0.4em; }
h3 { font-size: 1em; margin: 1.4em 0 0.3em; }
p, li { text-align: left; }
li { margin-bottom: 0.6em; }
a { color: inherit; }
code { font-family: monospace; font-size: 0.9em; }
.meta { font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.06em; }
.summary { font-style: italic; margin-bottom: 1.5em; }
.tail { font-size: 0.9em; }
hr { border: 0; border-top: 1px solid currentColor; opacity: 0.3; margin: 2em 0; }
`.trim();

const day = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '').slice(0, 10));

function chapter(fm, id, body) {
  const canonical = `${SITE_URL}/issues/${id}`;
  const { html, toc } = mdToXhtml(body);

  const links = (items, hrefKey) =>
    items
      .map((it) => `<li><a href="${esc(absolutize(it[hrefKey]))}">${esc(it.label ?? it[hrefKey])}</a></li>`)
      .join('');

  const tail = [];
  if (Array.isArray(fm.sources) && fm.sources.length)
    tail.push(`<h2 id="sources">Sources</h2><ul>${links(fm.sources, 'url')}</ul>`);
  if (Array.isArray(fm.related) && fm.related.length)
    tail.push(`<h2 id="related">Related</h2><ul>${links(fm.related, 'href')}</ul>`);

  const dates = [fm.published && `published ${day(fm.published)}`, fm.updated && `updated ${day(fm.updated)}`]
    .filter(Boolean)
    .join(' · ');

  const doc = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
<meta charset="utf-8"/>
<title>${esc(fm.title)}</title>
<link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
<h1 id="top">${esc(fm.title)}</h1>
<p class="meta">The Beat · ${esc(fm.week ?? id)}${dates ? ` · ${esc(dates)}` : ''}</p>
${fm.summary ? `<p class="summary">${inlineXhtml(fm.summary)}</p>` : ''}
${html}
<div class="tail">
${tail.join('\n')}
<hr/>
<p>Canonical: <a href="${esc(canonical)}">${esc(canonical)}</a><br/>
Content licensed CC BY 4.0.</p>
</div>
</body>
</html>`;

  return { doc, toc: [{ id: 'top', label: fm.title }, ...toc, ...(tail.length ? [{ id: 'sources', label: 'Sources' }] : [])] };
}

export function buildEpub(file, id) {
  const { fm, body, err } = frontmatterOf(file);
  if (err || !fm?.title) throw new Error(`${file}: unreadable frontmatter${err ? ` — ${err}` : ''}`);

  const { doc, toc } = chapter(fm, id, body);
  const uid = `urn:uuid:${createHash('sha1')
    .update(`${SITE_URL}/issues/${id}`)
    .digest('hex')
    .replace(/^(.{8})(.{4})(.{3})(.{3})(.{12}).*$/, '$1-$2-5$3-a$4-$5')}`;
  const title = `The Beat — ${fm.week ?? id}: ${fm.title}`;

  const navItems = toc.map((t) => `<li><a href="issue.xhtml#${t.id}">${esc(t.label)}</a></li>`).join('');
  const nav = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head><meta charset="utf-8"/><title>Contents</title></head>
<body>
<nav epub:type="toc" id="toc"><h1>Contents</h1><ol>${navItems}</ol></nav>
</body>
</html>`;

  // toc.ncx is EPUB 2, superseded by nav.xhtml — kept because some readers
  // (Kindle's converter among them) still look for it first.
  const ncxPoints = toc
    .map(
      (t, n) =>
        `<navPoint id="n${n}" playOrder="${n + 1}"><navLabel><text>${esc(t.label)}</text></navLabel><content src="issue.xhtml#${t.id}"/></navPoint>`
    )
    .join('');
  const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head><meta name="dtb:uid" content="${uid}"/></head>
<docTitle><text>${esc(title)}</text></docTitle>
<navMap>${ncxPoints}</navMap>
</ncx>`;

  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="en">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="pub-id">${uid}</dc:identifier>
<dc:title>${esc(title)}</dc:title>
<dc:language>en</dc:language>
<dc:creator>The Beat</dc:creator>
<dc:date>${esc(day(fm.published ?? fm.date))}</dc:date>
<dc:source>${esc(`${SITE_URL}/issues/${id}`)}</dc:source>
<dc:rights>CC BY 4.0</dc:rights>
${Array.isArray(fm.tags) ? fm.tags.map((t) => `<dc:subject>${esc(String(t))}</dc:subject>`).join('') : ''}
<meta property="dcterms:modified">${esc(day(fm.updated ?? fm.published ?? fm.date))}T00:00:00Z</meta>
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="css" href="style.css" media-type="text/css"/>
<item id="issue" href="issue.xhtml" media-type="application/xhtml+xml"/>
</manifest>
<spine toc="ncx"><itemref idref="issue"/></spine>
</package>`;

  const container = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`;

  return zip([
    // must be first and stored, per OCF: readers sniff the archive for it
    { name: 'mimetype', data: 'application/epub+zip', store: true },
    { name: 'META-INF/container.xml', data: container },
    { name: 'OEBPS/content.opf', data: opf },
    { name: 'OEBPS/nav.xhtml', data: nav },
    { name: 'OEBPS/toc.ncx', data: ncx },
    { name: 'OEBPS/style.css', data: CSS },
    { name: 'OEBPS/issue.xhtml', data: doc },
  ]);
}

// ---------------------------------------------------------------------------
// CLI

function main(argv) {
  let outDir = '.cache/epub';
  let latest = 0;
  const ids = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outDir = argv[++i];
    else if (argv[i] === '--latest') latest = Number(argv[++i] || 1);
    else if (argv[i].startsWith('--')) throw new Error(`unknown flag ${argv[i]}`);
    else ids.push(argv[i].replace(/\.md$/, ''));
  }

  const all = readdirSync(ISSUES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort(); // ids are ISO weeks: lexical order is chronological

  const wanted = ids.length ? ids : all.slice(-(latest || 1));
  const missing = wanted.filter((id) => !all.includes(id));
  if (missing.length) throw new Error(`no such issue(s): ${missing.join(', ')}`);

  mkdirSync(outDir, { recursive: true });
  for (const id of wanted) {
    const buf = buildEpub(join(ISSUES_DIR, `${id}.md`), id);
    const out = join(outDir, `the-beat-${id}.epub`);
    writeFileSync(out, buf);
    console.log(`${out}  ${(buf.length / 1024).toFixed(1)} KB`);
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error(`issues-to-epub: ${e.message}`);
    process.exit(1);
  }
}
