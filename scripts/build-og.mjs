#!/usr/bin/env node
// Regenerates public/og-default.png — the social card every page points at via
// the og:image meta tag (src/components/Head.astro).
//
//   node scripts/build-og.mjs            # write public/og-default.png
//   node scripts/build-og.mjs --check    # render to a temp file, compare, exit 1 on drift
//
// The card is source, not a binary someone has to reverse-engineer: the SVG
// below is the whole design, so a rename or a re-tagline is a text edit here
// followed by one command. That is the same reason the redirect layer and the
// coverage index are scripts rather than committed output.
//
// Two deliberate constraints:
//   * The URL and the tagline are read from site.config.mjs and the constants
//     below rather than typed in twice — the previous card outlived two moves
//     and shipped a dead github.io URL for months because nothing tied it to
//     the site's own config.
//   * Text is rendered in Menlo, present on every macOS box and substituted
//     sanely elsewhere. It is a design tool run by hand, not a build gate, so
//     it depends on `sharp` (a transitive Astro dependency) and says so
//     plainly if that is missing rather than failing the build.

import { writeFile, readFile } from 'node:fs/promises';
import { SITE_ORIGIN } from '../site.config.mjs';

const OUT = new URL('../public/og-default.png', import.meta.url);

// The masthead line, kept identical to Head.astro's full title.
const TAGLINE = 'developer marketing, on the record';
const WORDMARK = 'The Beat';
const HOST = SITE_ORIGIN.replace(/^https?:\/\//, '').replace(/\/+$/, '');

// The card is the header wordmark writ large, so it carries no prompt and no
// cursor either — the mark is the publication's name, not a typed command.
// The "$" still belongs to genuine command lines (the newsletter form's
// `$ the-beat subscribe --weekly`) and "&gt;" to page kickers and the favicon;
// the wordmark simply stopped being one of them.
//
// History worth keeping: an earlier pass moved this card from "$" to "&gt;" on
// the mistaken belief that "$" appeared nowhere else, and was reverted. The
// card and src/components/Chrome.astro must always render the same lockup —
// they drifted once (hyphen here, space there) and that is what retired the
// command form.

const BG = '#0d1117';
const AMBER = '#f59e0b';
const AMBER_SOFT = '#f0b429';
const FG = '#e6edf3';
const MUTED = '#8b949e';
const FAINT = '#6e7681';

const WORDMARK_SIZE = 64;
const WORDMARK_X = 80;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="8" fill="${AMBER}"/>
  <g font-family="Menlo, ui-monospace, monospace">
    <text x="${WORDMARK_X}" y="280" font-size="${WORDMARK_SIZE}" font-weight="700" fill="${FG}" letter-spacing="2">${WORDMARK}</text>
    <text x="${WORDMARK_X}" y="360" font-size="34" fill="${AMBER_SOFT}">${TAGLINE}</text>
    <text x="${WORDMARK_X}" y="428" font-size="24" fill="${MUTED}">positioning · docs · devrel · dx · distribution</text>
    <text x="${WORDMARK_X}" y="466" font-size="24" fill="${MUTED}">daily signals, one weekly issue, and a guide kept current</text>
    <text x="${WORDMARK_X}" y="504" font-size="24" fill="${MUTED}">by an autonomous agent — every claim sourced</text>
    <text x="${WORDMARK_X}" y="576" font-size="26" fill="${FAINT}">${HOST}</text>
  </g>
</svg>`;

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error(
    'build-og: needs `sharp` (ships with Astro; `npm i -D sharp` if this is a bare checkout).'
  );
  process.exit(1);
}

const png = await sharp(Buffer.from(svg), { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toBuffer();

if (process.argv.includes('--check')) {
  const current = await readFile(OUT).catch(() => null);
  if (current && current.equals(png)) {
    console.log('build-og: public/og-default.png is current.');
    process.exit(0);
  }
  console.error('build-og: public/og-default.png is stale — run `node scripts/build-og.mjs`.');
  process.exit(1);
}

await writeFile(OUT, png);
console.log(`build-og: wrote public/og-default.png (${png.length} bytes) for ${HOST}.`);
