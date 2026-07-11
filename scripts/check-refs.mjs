#!/usr/bin/env node
// Referential-integrity gate. The autonomous writers author frontmatter and
// markdown; a typo'd guide id or a base-less internal link ships as a silently
// broken link. This runs in `npm run build`, so it fails the build instead.
//
// Checks:
//   1. every practice's `section:` and every example's `demonstrates:` names a
//      real guide section
//   2. every internal `related[].href` resolves to a real route
//   3. body links: internal markdown links must carry the site base
//      (/developer-marketing/...) and resolve; relative ./x.md links are
//      errors (they 404 on the built site)
//
// Frontmatter is parsed with a real YAML parser (same family Astro/zod
// accepts — block lists, quoted scalars, the lot), and static routes are
// derived from src/pages/ so the gate can't drift from the actual site.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const BASE = (readFileSync('astro.config.mjs', 'utf8').match(/base:\s*'([^']+)'/) || [])[1] || '';

// A collection dir may not exist yet (e.g. weekly/ before the first issue).
const mdFiles = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => /\.mdx?$/.test(f)) : [];
const ids = (dir) => new Set(mdFiles(dir).map((f) => f.replace(/\.mdx?$/, '')));

const guideIds = ids('src/content/guide');
const weeklyIds = ids('src/content/weekly');
const diveIds = ids('src/content/deep-dives');
const practiceIds = ids('src/content/practices');
const exampleIds = ids('src/content/examples');
const radarIds = ids('src/content/radar');

function frontmatterOf(file) {
  const text = readFileSync(file, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  let fm = {};
  if (m) {
    try {
      fm = parseYaml(m[1]) ?? {};
    } catch (e) {
      return { fm: null, body: text, err: e.message };
    }
  }
  return { fm, body: m ? text.slice(m[0].length) : text };
}

// Static routes derived from src/pages/ — index.astro → parent dir, foo.astro
// → /foo, name.ext.ts → /name.ext. Dynamic ([param]) and 404 excluded.
function pageRoutes(dir = 'src/pages', prefix = '') {
  const routes = new Set();
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      for (const r of pageRoutes(full, `${prefix}/${entry}`)) routes.add(r);
      continue;
    }
    if (entry.includes('[') || entry.startsWith('404')) continue;
    if (entry.endsWith('.astro')) {
      const name = entry.replace(/\.astro$/, '');
      routes.add(name === 'index' ? prefix || '/' : `${prefix}/${name}`);
    } else if (entry.endsWith('.ts')) {
      routes.add(`${prefix}/${entry.replace(/\.ts$/, '')}`);
    }
  }
  return routes;
}
const STATIC_ROUTES = pageRoutes();

// Tag vocabulary across the tagged collections → valid /tags/<tag> routes.
const tags = new Set();

const entries = [];
for (const dir of ['guide', 'weekly', 'deep-dives', 'practices', 'examples', 'radar']) {
  for (const f of mdFiles(`src/content/${dir}`)) {
    const file = `src/content/${dir}/${f}`;
    entries.push({ dir, file, ...frontmatterOf(file) });
  }
}
for (const e of entries) {
  for (const t of e.fm?.tags ?? []) if (typeof t === 'string') tags.add(t);
}

// href is a base-less site path (the `related` convention) — resolve it.
function resolves(href) {
  const [path, hash] = href.split('#');
  const clean = path.replace(/\/$/, '') || '/';
  if (clean === '/practices' && hash) return practiceIds.has(hash);
  if (clean === '/examples' && hash) return exampleIds.has(hash);
  if (STATIC_ROUTES.has(clean)) return true;
  let m;
  if ((m = clean.match(/^\/guide\/([^/]+)$/))) return guideIds.has(m[1]);
  if ((m = clean.match(/^\/weekly\/([^/]+)$/))) return weeklyIds.has(m[1]);
  if ((m = clean.match(/^\/deep-dives\/([^/]+)$/))) return diveIds.has(m[1]);
  if ((m = clean.match(/^\/radar\/([^/]+)$/))) return radarIds.has(m[1]);
  if ((m = clean.match(/^\/tags\/([^/]+)$/))) return tags.has(m[1]);
  return false;
}

const problems = [];

for (const { dir, file, fm, body, err } of entries) {
  if (err) {
    problems.push(`${file}: unparseable frontmatter (${err})`);
    continue;
  }

  // 1. practice.section / example.demonstrates must be a real guide section
  if (dir === 'practices') {
    if (!fm.section) problems.push(`${file}: missing section`);
    else if (!guideIds.has(fm.section)) problems.push(`${file}: section "${fm.section}" is not a guide section`);
  }
  if (dir === 'examples') {
    if (!fm.demonstrates) problems.push(`${file}: missing demonstrates`);
    else if (!guideIds.has(fm.demonstrates)) problems.push(`${file}: demonstrates "${fm.demonstrates}" is not a guide section`);
  }

  // 2. related hrefs (frontmatter): base-less site paths or external URLs
  for (const r of fm.related ?? []) {
    const href = r?.href;
    if (typeof href !== 'string' || /^https?:\/\//.test(href)) continue;
    if (!href.startsWith('/')) problems.push(`${file}: related href "${href}" is not absolute`);
    else if (BASE && href.startsWith(`${BASE}/`))
      problems.push(`${file}: related href "${href}" must be base-less (drop ${BASE})`);
    else if (!resolves(href)) problems.push(`${file}: related href "${href}" resolves to nothing`);
  }

  // 3. body markdown links
  for (const m of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    if (/^\.{1,2}\//.test(href)) {
      problems.push(`${file}: relative body link "${href}" breaks on the built site — use ${BASE}/<path>`);
    } else if (href.startsWith('/')) {
      if (BASE && !href.startsWith(`${BASE}/`) && href !== BASE) {
        problems.push(`${file}: body link "${href}" is missing the site base ${BASE}`);
      } else if (!resolves(href.slice(BASE.length) || '/')) {
        problems.push(`${file}: body link "${href}" resolves to nothing`);
      }
    }
  }
}

if (problems.length) {
  console.error('check-refs: broken internal references:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `check-refs: ok — ${practiceIds.size} practices, ${exampleIds.size} examples, ${guideIds.size} guide sections, ${weeklyIds.size} weeklies, ${diveIds.size} dives, ${radarIds.size} radar entries, ${tags.size} tags, ${STATIC_ROUTES.size} static routes.`
);
