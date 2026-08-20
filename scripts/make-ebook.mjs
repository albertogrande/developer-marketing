#!/usr/bin/env node
// Build a book from a directory of markdown chapters.
//
//   npm run ebook:build -- <dir>
//   npm run ebook:build -- <dir> --out /tmp
//
// The directory holds a `book.yml` manifest and one markdown file per chapter.
// Output is `<slug>.epub` and `<slug>.html`, side by side: the EPUB for a
// Kindle or any e-reader, the HTML for a browser.
//
// Why this exists rather than a dependency: an EPUB is a ZIP of XHTML, the repo
// already owns its MIME and SMTP layers for the same reason, and `marked` (the
// one piece worth borrowing) is already a dependency for the site.
//
// The books this builds are not site content and are not committed — see the
// `research/` note in .gitignore. Nothing here writes into src/.
//
// This file is also in albertogrande/railway, which is where the Railway
// dossier now lives. It is generic: change one copy, change both.
//
// book.yml:
//   title:       required
//   subtitle:    optional
//   author:      required
//   identifier:  required, stable — changing it makes readers file a new book
//   modified:    required, a date. Never the clock: same input, same bytes.
//   language:    optional, defaults to en
//   description: optional
//   subjects:    optional list
//   chapters:    required list of { file, title? }
//                `title` defaults to the chapter's first `# ` heading.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { marked } from 'marked';

import { buildEpub, buildHtml } from './lib/epub.mjs';

function parseArgs(argv) {
  const args = { dir: '', out: '' };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') args.help = true;
    else rest.push(argv[i]);
  }
  args.dir = rest[0] || '';
  return args;
}

const usage = `Usage: node scripts/make-ebook.mjs <dir> [--out <dir>]

  <dir>    a directory holding book.yml and its chapter markdown
  --out    where to write (default: <dir>/dist)
`;

function loadManifest(dir) {
  let raw;
  try {
    raw = readFileSync(join(dir, 'book.yml'), 'utf8');
  } catch {
    throw new Error(`make-ebook: no book.yml in ${dir}`);
  }
  const manifest = parseYaml(raw);
  if (!manifest || typeof manifest !== 'object') throw new Error('make-ebook: book.yml is empty');

  for (const field of ['title', 'author', 'identifier', 'modified', 'chapters']) {
    if (!manifest[field]) throw new Error(`make-ebook: book.yml is missing \`${field}\``);
  }
  if (!Array.isArray(manifest.chapters) || manifest.chapters.length === 0) {
    throw new Error('make-ebook: book.yml `chapters` must be a non-empty list');
  }

  // yaml parses an unquoted date into a Date; both forms are fine downstream,
  // but normalising here keeps the filename and the metadata in step.
  manifest.modified =
    manifest.modified instanceof Date ? manifest.modified.toISOString() : String(manifest.modified);

  return manifest;
}

function loadChapter(dir, entry) {
  const file = typeof entry === 'string' ? entry : entry.file;
  if (!file) throw new Error('make-ebook: every chapter needs a `file`');

  let md;
  try {
    md = readFileSync(join(dir, file), 'utf8');
  } catch {
    throw new Error(`make-ebook: chapter not found — ${file}`);
  }

  // A chapter file may carry a small frontmatter block; it is metadata for the
  // human editing the source, never rendered into the book.
  md = md.replace(/^---\n[\s\S]*?\n---\n/, '');

  const heading = md.match(/^#\s+(.+)$/m);
  const title = (typeof entry === 'object' && entry.title) || (heading && heading[1].trim());
  if (!title) throw new Error(`make-ebook: ${file} has no \`# \` heading and no title in book.yml`);

  return { title, html: marked.parse(md, { gfm: true, async: false }) };
}

function main(argv) {
  const args = parseArgs(argv);
  if (args.help || !args.dir) {
    console.log(usage);
    return args.help ? 0 : 1;
  }

  const dir = resolve(args.dir);
  const manifest = loadManifest(dir);
  const chapters = manifest.chapters.map((c) => loadChapter(dir, c));

  const book = { ...manifest, chapters };
  const slug = manifest.slug || basename(dir);
  const outDir = resolve(args.out || join(dir, 'dist'));
  mkdirSync(outDir, { recursive: true });

  const epub = buildEpub(book);
  const html = buildHtml(book);
  const epubPath = join(outDir, `${slug}.epub`);
  const htmlPath = join(outDir, `${slug}.html`);
  writeFileSync(epubPath, epub);
  writeFileSync(htmlPath, html);

  const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
  const words = chapters.reduce((n, c) => n + c.html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length, 0);
  console.log(`${manifest.title}`);
  console.log(`  ${chapters.length} chapters, ~${words.toLocaleString('en-US')} words`);
  console.log(`  ${epubPath}  ${kb(epub.length)}`);
  console.log(`  ${htmlPath}  ${kb(Buffer.byteLength(html))}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

export { parseArgs, loadManifest, loadChapter, main };
