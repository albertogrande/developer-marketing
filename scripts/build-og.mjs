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
const WORDMARK = 'the beat';
const HOST = SITE_ORIGIN.replace(/^https?:\/\//, '').replace(/\/+$/, '');

// The card is the header wordmark writ large: same "$" prompt, same `the beat`
// with a space, same block cursor — which is the wordmark's beat and not
// decoration, so the card never ships without it.
//
// The site uses two prompt glyphs by role — "$" for the wordmark and for the
// newsletter form's real command line, "&gt;" for page kickers and the favicon,
// where it is a list marker. An earlier pass moved this card to "&gt;" on the
// mistaken belief that "$" appeared nowhere else; it appears in the one place
// that matters most.
//
// This card and src/components/Chrome.astro must always render the same
// lockup. They drifted once — hyphen in the header, space here — so if you
// touch one, re-run this script and diff the other.
const PROMPT = '$';

const BG = '#0d1117';
const AMBER = '#f59e0b';
const AMBER_SOFT = '#f0b429';
const FG = '#e6edf3';
const CURSOR = '#c9d1d9';
const MUTED = '#8b949e';
const FAINT = '#6e7681';

// Menlo at font-size N advances 0.6*N per character — the block cursor has to
// land exactly after the wordmark, so its x is computed, never eyeballed.
const WORDMARK_SIZE = 64;
const WORDMARK_X = 80;
const ADVANCE = 0.6 * WORDMARK_SIZE;
const cursorX = Math.round(WORDMARK_X + `${PROMPT} ${WORDMARK}`.length * ADVANCE);

// XML-escape the prompt for the SVG source; the length maths above uses the
// literal single character, not the entity.
const promptGlyph = PROMPT.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="8" fill="${AMBER}"/>
  <g font-family="Menlo, ui-monospace, monospace">
    <text x="${WORDMARK_X}" y="280" font-size="${WORDMARK_SIZE}" font-weight="700" fill="${AMBER}">${promptGlyph}</text>
    <text x="${WORDMARK_X + ADVANCE}" y="280" font-size="${WORDMARK_SIZE}" font-weight="700" fill="${FG}" xml:space="preserve"> ${WORDMARK}</text>
    <rect x="${cursorX}" y="232" width="30" height="56" fill="${CURSOR}"/>
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
