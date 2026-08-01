#!/usr/bin/env node
// Referential-integrity gate. The autonomous writers author frontmatter and
// markdown; a typo'd guide id or a base-less internal link ships as a silently
// broken link. This runs in `npm run build`, so it fails the build instead.
//
// Checks:
//   1. every practice's and skill's `section:`, and every example's
//      `demonstrates:`, names a real guide section
//   2. every internal `related[].href` resolves to a real route
//   3. body links: internal markdown links must carry the site base
//      (/developer-marketing/...) and resolve; relative ./x.md links are
//      errors (they 404 on the built site)
//
// Frontmatter is parsed with a real YAML parser (same family Astro/zod
// accepts — block lists, quoted scalars, the lot), and static routes are
// derived from src/pages/ so the gate can't drift from the actual site.

import { readdirSync, existsSync } from 'node:fs';
import { frontmatterOf, pageRoutes, siteConfig } from './lib/routes.mjs';

// Same source as the build (site.config.mjs, via routes.mjs), so the gate
// cannot drift from what Astro emits. base is '' when served at the root.
const BASE = siteConfig().base;

// A collection dir may not exist yet (e.g. weekly/ before the first issue).
const mdFiles = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => /\.mdx?$/.test(f)) : [];
const ids = (dir) => new Set(mdFiles(dir).map((f) => f.replace(/\.mdx?$/, '')));

const guideIds = ids('src/content/guide');
const weeklyIds = ids('src/content/weekly');
const articleIds = ids('src/content/articles');
const diveIds = ids('src/content/deep-dives');
const practiceIds = ids('src/content/practices');
const exampleIds = ids('src/content/examples');
const skillIds = ids('src/content/skills');
const resourceIds = ids('src/content/resources');
const briefIds = ids('src/content/briefs');
const radarIds = ids('src/content/radar');

// Frontmatter parsing and the src/pages route table live in ./lib/routes.mjs,
// shared with the sitemap lastmod hook, the agent-surface gate, and the
// IndexNow ping so none of them can drift from this gate.
const STATIC_ROUTES = pageRoutes();

// Tag vocabulary across the tagged collections → valid /tags/<tag> routes.
const tags = new Set();

const entries = [];
for (const dir of ['guide', 'weekly', 'articles', 'deep-dives', 'briefs', 'practices', 'examples', 'skills', 'resources', 'radar']) {
  for (const f of mdFiles(`src/content/${dir}`)) {
    const file = `src/content/${dir}/${f}`;
    entries.push({ dir, file, ...frontmatterOf(file) });
  }
}
for (const e of entries) {
  for (const t of e.fm?.tags ?? []) if (typeof t === 'string') tags.add(t);
}

const MD_SIBLING_IDS = {
  guide: () => guideIds,
  weekly: () => weeklyIds,
  articles: () => articleIds,
  'deep-dives': () => diveIds,
  briefs: () => briefIds,
  radar: () => radarIds,
  practices: () => practiceIds,
  examples: () => exampleIds,
  skills: () => skillIds,
  resources: () => resourceIds,
};

// href is a base-less site path (the `related` convention) — resolve it.
function resolves(href) {
  const [path, hash] = href.split('#');
  const clean = path.replace(/\/$/, '') || '/';
  if (clean === '/practices' && hash) return practiceIds.has(hash);
  if (clean === '/examples' && hash) return exampleIds.has(hash);
  if (clean === '/skills' && hash) return skillIds.has(hash);
  if (clean === '/resources' && hash) return resourceIds.has(hash);
  if (clean === '/briefs' && hash) return briefIds.has(hash);
  if (STATIC_ROUTES.has(clean)) return true;
  let m;
  // Markdown siblings: every entry serves a raw /<collection>/<id>.md variant.
  if ((m = clean.match(/^\/([a-z-]+)\/([^/]+)\.md$/)) && MD_SIBLING_IDS[m[1]]) {
    return MD_SIBLING_IDS[m[1]]().has(m[2]);
  }
  if ((m = clean.match(/^\/guide\/([^/]+)$/))) return guideIds.has(m[1]);
  if ((m = clean.match(/^\/weekly\/([^/]+)$/))) return weeklyIds.has(m[1]);
  if ((m = clean.match(/^\/articles\/([^/]+)$/))) return articleIds.has(m[1]);
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
  // Skills carry the recommendation's honest limit and a verbatim install line;
  // neither is optional, so a half-written card fails the build rather than
  // shipping as an unqualified endorsement.
  if (dir === 'skills') {
    if (!fm.section) problems.push(`${file}: missing section`);
    else if (!guideIds.has(fm.section)) problems.push(`${file}: section "${fm.section}" is not a guide section`);
    if (!fm.caveat) problems.push(`${file}: missing caveat — a listing without its limit is an endorsement`);
    if (!fm.install) problems.push(`${file}: missing install`);
    if (!fm.source?.url) problems.push(`${file}: missing source.url`);
    if (!fm.verified) problems.push(`${file}: missing verified date`);
  }
  // A brief is a one-line news claim with no byline and no desk behind it, so
  // the primary source is the only thing making it checkable. Missing it, the
  // item is a rumour with a company name attached — fail the build.
  if (dir === 'briefs') {
    if (!fm.company) problems.push(`${file}: missing company`);
    if (!fm.summary) problems.push(`${file}: missing summary — the brief is the summary`);
    if (!fm.source?.url) problems.push(`${file}: missing source.url — an unverifiable brief is a rumour`);
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

  // 3. body markdown links — base-less site paths, same convention as `related`
  // above. scripts/remark-base-paths.mjs adds the base at build time, so content
  // that hard-codes it would come out doubled and would break the day the site
  // moves.
  for (const m of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    if (/^\.{1,2}\//.test(href)) {
      problems.push(`${file}: relative body link "${href}" breaks on the built site — use /<path>`);
    } else if (href.startsWith('/')) {
      if (BASE && (href === BASE || href.startsWith(`${BASE}/`))) {
        problems.push(`${file}: body link "${href}" must be base-less (drop ${BASE} — the build adds it)`);
      } else if (!resolves(href)) {
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
  `check-refs: ok — ${practiceIds.size} practices, ${exampleIds.size} examples, ${skillIds.size} skills, ${resourceIds.size} resources, ${guideIds.size} guide sections, ${weeklyIds.size} weeklies, ${articleIds.size} articles, ${briefIds.size} briefs, ${diveIds.size} dives, ${radarIds.size} radar entries, ${tags.size} tags, ${STATIC_ROUTES.size} static routes.`
);
