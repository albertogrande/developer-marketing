// EPUB 3 writer, built on scripts/lib/zip.mjs.
//
// Scope: a text book. Chapters of prose, a navigable table of contents, and
// nothing else — no cover image, no embedded fonts, no media overlays. That is
// the whole of what a research dossier read on an e-reader needs, and every
// feature left out is one that cannot break on a device we can't test against.
//
// Two compatibility notes worth keeping:
//
//   * A `toc.ncx` is emitted alongside the EPUB 3 `nav.xhtml`. The NCX has been
//     superseded since EPUB 3.0, but older Kindle firmware and Amazon's own
//     conversion pipeline still read it, and an unnavigable book on a device
//     you cannot debug is a bad trade for two hundred bytes.
//   * Chapter bodies arrive as HTML and are normalised to XHTML before they go
//     in. HTML5 tolerates `<br>` and bare `&`; XHTML does not, and a reader
//     that hits a parse error shows a blank page rather than a warning.
//
// `modified` is required and comes from the caller, never from the clock — see
// the note in zip.mjs.

import { zip } from './zip.mjs';

const VOID = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];

const xmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Normalise an HTML fragment into XHTML that a strict parser will accept.
 * Deliberately narrow: it self-closes void elements and repairs bare
 * ampersands. It is not a sanitiser and does not try to be — the input is our
 * own markdown renderer's output, not arbitrary web HTML.
 */
export function toXhtml(html) {
  let out = String(html);

  // A bare `&` is a fatal error in XML. Leave real character and numeric
  // references alone; escape everything else.
  out = out.replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#[xX][0-9a-fA-F]+);)/g, '&amp;');

  // `&nbsp;` and friends are undeclared without a DTD, so they parse as errors.
  // Only the five XML built-ins survive; the rest become literal characters.
  out = out.replace(/&nbsp;/g, ' ').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”');

  for (const tag of VOID) {
    out = out.replace(new RegExp(`<${tag}([^>]*?)\\s*/?>`, 'gi'), (_m, attrs) => `<${tag}${attrs} />`);
  }

  return out;
}

const page = (title, body, lang) =>
  `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${xmlEscape(lang)}" lang="${xmlEscape(lang)}">
<head>
<meta charset="utf-8" />
<title>${xmlEscape(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
${body}
</body>
</html>
`;

// Sized for e-ink and for Amazon's converter, which discards most of what it
// does not understand. Everything here is a hint the device is free to override
// — which is the point: the reader's own type settings should win.
const STYLESHEET = `body { font-family: Georgia, "Times New Roman", serif; line-height: 1.5; margin: 0 5%; text-align: left; widows: 2; orphans: 2; }
h1 { font-size: 1.6em; line-height: 1.25; margin: 1.2em 0 0.6em; page-break-before: always; }
h2 { font-size: 1.25em; line-height: 1.3; margin: 1.6em 0 0.4em; }
h3 { font-size: 1.05em; margin: 1.4em 0 0.3em; }
h4 { font-size: 1em; font-style: italic; margin: 1.2em 0 0.3em; }
p { margin: 0 0 0.8em; }
blockquote { margin: 1em 1.5em; font-style: italic; }
pre { font-family: "Courier New", monospace; font-size: 0.8em; white-space: pre-wrap; word-wrap: break-word; margin: 1em 0; }
code { font-family: "Courier New", monospace; font-size: 0.9em; }
pre code { font-size: 1em; }
ul, ol { margin: 0 0 0.8em 1.4em; padding: 0; }
li { margin: 0 0 0.3em; }
hr { border: 0; border-top: 1px solid #999; margin: 1.6em 20%; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; margin: 1em 0; font-size: 0.9em; }
th, td { border: 1px solid #999; padding: 0.3em 0.5em; text-align: left; }
a { color: inherit; }
.byline { font-style: italic; margin: 0 0 1.2em; }
.titlepage { margin-top: 25%; text-align: center; }
.titlepage h1 { page-break-before: auto; font-size: 2em; }
.subtitle { font-style: italic; font-size: 1.1em; }
.verbatim-note { border-top: 1px solid #999; border-bottom: 1px solid #999; padding: 0.6em 0; margin: 1.2em 0; font-size: 0.9em; font-style: italic; }
`;

/**
 * @param {object} book
 * @param {string} book.title
 * @param {string} [book.subtitle]
 * @param {string} book.author
 * @param {string} book.identifier   Stable and unique; changing it makes readers treat it as a new book.
 * @param {Date|string} book.modified
 * @param {string} [book.language]
 * @param {string} [book.description]
 * @param {string[]} [book.subjects]
 * @param {Array<{title: string, html: string}>} book.chapters
 * @returns {Buffer}
 */
export function buildEpub(book) {
  const { title, subtitle = '', author, identifier, modified, language = 'en', description = '', subjects = [], chapters = [] } = book;

  for (const [field, value] of Object.entries({ title, author, identifier, modified })) {
    if (!value) throw new TypeError(`epub: \`${field}\` is required`);
  }
  if (chapters.length === 0) throw new TypeError('epub: a book needs at least one chapter');

  const stamp = (modified instanceof Date ? modified : new Date(modified));
  if (Number.isNaN(stamp.getTime())) throw new TypeError('epub: invalid `modified`');
  // dcterms:modified must be whole seconds in UTC, per the EPUB 3 spec.
  const modifiedIso = `${stamp.toISOString().slice(0, 19)}Z`;

  const docs = chapters.map((ch, i) => ({
    id: `ch${String(i + 1).padStart(2, '0')}`,
    href: `ch-${String(i + 1).padStart(2, '0')}.xhtml`,
    title: ch.title,
    xhtml: page(ch.title, toXhtml(ch.html), language),
  }));

  const titlePage = page(
    title,
    `<div class="titlepage">
<h1>${xmlEscape(title)}</h1>
${subtitle ? `<p class="subtitle">${xmlEscape(subtitle)}</p>` : ''}
<p>${xmlEscape(author)}</p>
<p>${xmlEscape(modifiedIso.slice(0, 10))}</p>
</div>`,
    language
  );

  const manifest = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="css" href="style.css" media-type="text/css"/>',
    '<item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>',
    ...docs.map((d) => `<item id="${d.id}" href="${d.href}" media-type="application/xhtml+xml"/>`),
  ].join('\n    ');

  const spine = ['<itemref idref="title"/>', '<itemref idref="nav"/>', ...docs.map((d) => `<itemref idref="${d.id}"/>`)].join('\n    ');

  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${xmlEscape(language)}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${xmlEscape(identifier)}</dc:identifier>
    <dc:title>${xmlEscape(title)}</dc:title>
    <dc:creator>${xmlEscape(author)}</dc:creator>
    <dc:language>${xmlEscape(language)}</dc:language>
    <dc:date>${modifiedIso.slice(0, 10)}</dc:date>
${description ? `    <dc:description>${xmlEscape(description)}</dc:description>\n` : ''}${subjects.map((s) => `    <dc:subject>${xmlEscape(s)}</dc:subject>`).join('\n')}${subjects.length ? '\n' : ''}    <meta property="dcterms:modified">${modifiedIso}</meta>
  </metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine toc="ncx">
    ${spine}
  </spine>
</package>
`;

  const nav = page(
    'Contents',
    `<nav epub:type="toc" id="toc">
<h1>Contents</h1>
<ol>
${docs.map((d) => `<li><a href="${d.href}">${xmlEscape(d.title)}</a></li>`).join('\n')}
</ol>
</nav>`,
    language
  );

  const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${xmlEscape(language)}">
  <head>
    <meta name="dtb:uid" content="${xmlEscape(identifier)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${xmlEscape(title)}</text></docTitle>
  <navMap>
${docs
  .map(
    (d, i) => `    <navPoint id="nav-${d.id}" playOrder="${i + 1}">
      <navLabel><text>${xmlEscape(d.title)}</text></navLabel>
      <content src="${d.href}"/>
    </navPoint>`
  )
  .join('\n')}
  </navMap>
</ncx>
`;

  const container = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

  return zip(
    [
      // Must be first and stored — see zip.mjs.
      { name: 'mimetype', data: 'application/epub+zip', store: true },
      { name: 'META-INF/container.xml', data: container },
      { name: 'OEBPS/content.opf', data: opf },
      { name: 'OEBPS/nav.xhtml', data: nav },
      { name: 'OEBPS/toc.ncx', data: ncx },
      { name: 'OEBPS/style.css', data: STYLESHEET },
      { name: 'OEBPS/title.xhtml', data: titlePage },
      ...docs.map((d) => ({ name: `OEBPS/${d.href}`, data: d.xhtml })),
    ],
    { modified: stamp }
  );
}

/**
 * The same book as one self-contained HTML file — for reading in a browser, or
 * for any pipeline that would rather not deal with a ZIP.
 */
export function buildHtml(book) {
  const { title, subtitle = '', author, modified, language = 'en', chapters = [] } = book;
  const stamp = (modified instanceof Date ? modified : new Date(modified)).toISOString().slice(0, 10);
  const slug = (s, i) => `ch-${String(i + 1).padStart(2, '0')}`;

  return `<!doctype html>
<html lang="${xmlEscape(language)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${xmlEscape(title)}</title>
<style>
${STYLESHEET}
body { max-width: 38em; margin: 0 auto; padding: 2em 1.2em 6em; }
nav.toc { margin: 2em 0 3em; }
nav.toc ol { margin-left: 1.2em; }
h1 { page-break-before: auto; }
@media (prefers-color-scheme: dark) { body { background: #14110f; color: #e8e3dc; } hr, th, td { border-color: #4a453f; } }
</style>
</head>
<body>
<div class="titlepage" style="margin-top:0">
<h1>${xmlEscape(title)}</h1>
${subtitle ? `<p class="subtitle">${xmlEscape(subtitle)}</p>` : ''}
<p>${xmlEscape(author)} · ${stamp}</p>
</div>
<nav class="toc">
<h2>Contents</h2>
<ol>
${chapters.map((c, i) => `<li><a href="#${slug(c, i)}">${xmlEscape(c.title)}</a></li>`).join('\n')}
</ol>
</nav>
${chapters.map((c, i) => `<section id="${slug(c, i)}">\n${c.html}\n</section>`).join('\n<hr />\n')}
</body>
</html>
`;
}
