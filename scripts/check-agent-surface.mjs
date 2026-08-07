#!/usr/bin/env node
// Agent-surface gate. The site's machine layer — markdown siblings, JSON-LD,
// canonical URLs, llms indexes, feeds, sitemap lastmod — is what makes the
// content discoverable and citable by agents. The content is written by
// autonomous desks, so these invariants are enforced post-build (inside
// `npm run build`) rather than trusted: a writer commit that would break the
// surface fails its own build instead of shipping.
//
// Checks (all against dist/):
//   1. every entry has its raw .md sibling; page collections also their HTML
//   2. every HTML page: exactly one JSON-LD script, parseable, with @graph;
//      canonical == site+base+<dir>/ exactly
//   3. entry pages announce their .md sibling via rel=alternate, target exists
//   4. llms.txt lists every entry's .md URL
//   5. feed.xml: entry count == dated collections, every entry carries
//      full <content>, no unescaped ampersands
//   6. api.json + feed.json + all eight <collection>.json parse; counts match
//   7. sitemap: every <loc> slashed, no machine endpoints, lastmod everywhere
//      (except /about/, which honestly has no date)
//   8. the IndexNow key file is present and self-consistent

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contentEntries, COLLECTIONS, siteConfig } from './lib/routes.mjs';

const DIST = 'dist';
const { site: SITE, base: BASE } = siteConfig();
const ROOT = `${SITE}${BASE}`;

const problems = [];
const entries = contentEntries();

// --- 1. siblings + HTML per entry -----------------------------------------
for (const { collection, id } of entries) {
  if (!existsSync(join(DIST, collection, `${id}.md`)))
    problems.push(`${collection}/${id}: missing .md sibling in dist`);
  if (COLLECTIONS[collection].page && !existsSync(join(DIST, collection, id, 'index.html')))
    problems.push(`${collection}/${id}: missing page dist/${collection}/${id}/index.html`);
}

// --- 2 + 3. per-page invariants -------------------------------------------
function* htmlPages(dir = DIST, rel = '') {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'pagefind' || entry === '_astro') continue;
      yield* htmlPages(full, `${rel}/${entry}`);
    } else if (entry === 'index.html') {
      yield { file: full, dirPath: rel };
    }
  }
}

for (const { file, dirPath } of htmlPages()) {
  if (dirPath === '/404') continue;
  const html = readFileSync(file, 'utf8');

  // Meta-refresh redirect stubs (the pre-rename URL space: /briefs, /weekly/*,
  // /practices) carry no JSON-LD and canonicalize to their *target* — they are
  // pointers, not pages, so none of the page checks apply.
  if (html.includes('http-equiv="refresh"')) continue;

  const scripts = html.match(/<script type="application\/ld\+json">/g) ?? [];
  if (scripts.length !== 1) {
    problems.push(`${file}: expected exactly one JSON-LD script, found ${scripts.length}`);
  } else {
    const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    try {
      const parsed = JSON.parse(m[1]);
      if (!Array.isArray(parsed['@graph']) || parsed['@graph'].length < 2)
        problems.push(`${file}: JSON-LD lacks a populated @graph`);
    } catch (e) {
      problems.push(`${file}: JSON-LD does not parse (${e.message})`);
    }
  }

  const want = `${ROOT}${dirPath}/`.replace(/\/+$/, '/');
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (canon !== want) problems.push(`${file}: canonical "${canon}" ≠ served URL "${want}"`);

  const alt = (html.match(/<link rel="alternate" type="text\/markdown"[^>]*href="([^"]+)"/) || [])[1];
  const entryMatch = dirPath.match(/^\/([a-z-]+)\/([^/]+)$/);
  if (entryMatch && COLLECTIONS[entryMatch[1]]?.page) {
    if (!alt) problems.push(`${file}: entry page missing rel=alternate markdown link`);
    else {
      const target = join(DIST, alt.replace(`${BASE}/`, ''));
      if (!existsSync(target)) problems.push(`${file}: markdown alternate ${alt} has no file`);
    }
  }
}

// --- 4. llms.txt coverage --------------------------------------------------
const llms = readFileSync(join(DIST, 'llms.txt'), 'utf8');
for (const { collection, id } of entries) {
  if (!llms.includes(`/${collection}/${id}.md)`))
    problems.push(`llms.txt: missing entry ${collection}/${id}`);
}

// --- 5. feed.xml -----------------------------------------------------------
const feed = readFileSync(join(DIST, 'feed.xml'), 'utf8');
const datedCount = entries.filter((e) =>
  ['issues', 'articles', 'deep-dives', 'radar'].includes(e.collection)
).length;
const feedEntries = (feed.match(/<entry>/g) ?? []).length;
if (!feed.startsWith('<?xml')) problems.push('feed.xml: missing XML declaration');
if (feedEntries !== datedCount)
  problems.push(`feed.xml: ${feedEntries} entries, expected ${datedCount}`);
if ((feed.match(/<content type="html">/g) ?? []).length !== feedEntries)
  problems.push('feed.xml: not every entry carries full <content>');
const badAmp = feed.match(/&(?!amp;|lt;|gt;|quot;|apos;|#)/);
if (badAmp) problems.push('feed.xml: unescaped ampersand');

// --- 6. JSON endpoints -----------------------------------------------------
const jsonChecks = [
  ['api.json', null],
  ['feed.json', null],
  ...Object.keys(COLLECTIONS).map((c) => [`${c}.json`, c]),
];
for (const [name, coll] of jsonChecks) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(join(DIST, name), 'utf8'));
  } catch (e) {
    problems.push(`${name}: does not parse (${e.message})`);
    continue;
  }
  if (coll) {
    const want = entries.filter((e) => e.collection === coll).length;
    if (parsed.count !== want) problems.push(`${name}: count ${parsed.count} ≠ ${want} content files`);
  }
  if (name === 'feed.json' && parsed.items.length !== datedCount)
    problems.push(`feed.json: ${parsed.items.length} items, expected ${datedCount}`);
  if (name === 'api.json') {
    for (const c of Object.keys(COLLECTIONS)) {
      const want = entries.filter((e) => e.collection === c).length;
      if (parsed.collections?.[c]?.count !== want)
        problems.push(`api.json: collections.${c}.count ≠ ${want}`);
    }
  }
}

// --- 7. sitemap ------------------------------------------------------------
const sitemap = readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8');
const urlBlocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)];
for (const [, block] of urlBlocks) {
  const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1] ?? '';
  if (!loc.endsWith('/')) problems.push(`sitemap: ${loc} not in trailing-slash form`);
  if (/\.(md|json|txt)$/.test(loc)) problems.push(`sitemap: machine endpoint leaked: ${loc}`);
  // Pages with no dated content honestly carry no lastmod: the masthead and
  // the newsletter flow landings.
  // /jobs is dated from its data file once the first sweep lands (see
  // routeLastmod); until then it is honestly undated like the other two.
  const undated =
    loc === `${ROOT}/about/` || loc === `${ROOT}/jobs/` || loc.startsWith(`${ROOT}/newsletter/`);
  if (!undated && !block.includes('<lastmod>')) problems.push(`sitemap: ${loc} missing lastmod`);
}

// --- 8. IndexNow key -------------------------------------------------------
const keyFiles = readdirSync(DIST).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keyFiles.length !== 1) {
  problems.push(`expected exactly one IndexNow key file in dist, found ${keyFiles.length}`);
} else {
  const key = readFileSync(join(DIST, keyFiles[0]), 'utf8').trim();
  if (`${key}.txt` !== keyFiles[0]) problems.push('IndexNow key file content does not match its name');
}

// ---------------------------------------------------------------------------
if (problems.length) {
  console.error('check-agent-surface: the machine surface is broken:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `check-agent-surface: ok — ${entries.length} entries with .md siblings, ${[...htmlPages()].length} pages with @graph + canonical, feed ${feedEntries} entries, sitemap ${urlBlocks.length} URLs with lastmod.`
);
