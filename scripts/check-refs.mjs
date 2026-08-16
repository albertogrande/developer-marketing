#!/usr/bin/env node
// Referential-integrity gate. The autonomous writers author frontmatter and
// markdown; a typo'd guide id or a base-less internal link ships as a silently
// broken link. This runs in `npm run build`, so it fails the build instead.
//
// Checks:
//   1. every claim's and skill's `section:`, and every example's
//      `demonstrates:`, names a real guide section
//   2. every internal `related[].href` resolves to a real route
//   3. body links: internal markdown links must carry the site base
//      (/developer-marketing/...) and resolve; relative ./x.md links are
//      errors (they 404 on the built site)
//   4. sourcing floors the skills promise, made deterministic: articles carry
//      ≥2 sources, deep dives ≥3, and in both cases the sources span ≥2
//      independent publishers (registrable domains) — a vendor's blog
//      corroborating the vendor's docs corroborates nothing
//
// Frontmatter is parsed with a real YAML parser (same family Astro/zod
// accepts — block lists, quoted scalars, the lot), and static routes are
// derived from src/pages/ so the gate can't drift from the actual site.

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { frontmatterOf, pageRoutes, siteConfig } from './lib/routes.mjs';
import { independentHostCount } from './lib/sources.mjs';
import { makeResolver, sourcingProblems } from './lib/refs.mjs';

const COLLECTION_DIRS = ['guide', 'issues', 'articles', 'deep-dives', 'signals', 'claims', 'examples', 'skills', 'resources', 'radar'];

/**
 * Collect every referential-integrity problem under `root`.
 *
 * Exported and root-relative so the gate's WIRING can be tested, not just its
 * rules. The rules already had coverage through lib/refs.mjs; how this
 * enumerates ids, tags and routes and feeds them to the resolver did not — and
 * a bug there makes the gate pass vacuously while the suite stays green. That
 * is the failure mode worth a test, because this runs inside `npm run build`
 * and so gates every deploy and every unattended writer commit.
 *
 * @returns {string[]} problems; empty means the tree is sound.
 */
export function checkRefs({ root = '.' } = {}) {
  // Same source as the build (site.config.mjs, via routes.mjs), so the gate
  // cannot drift from what Astro emits. base is '' when served at the root.
  const BASE = siteConfig().base;

  // A collection dir may not exist yet (e.g. issues/ before the first issue).
  const mdFiles = (dir) =>
    existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter((f) => /\.mdx?$/.test(f)) : [];
  const ids = (dir) => new Set(mdFiles(dir).map((f) => f.replace(/\.mdx?$/, '')));

  const guideIds = ids('src/content/guide');
  const issueIds = ids('src/content/issues');
  const articleIds = ids('src/content/articles');
  const diveIds = ids('src/content/deep-dives');
  const claimIds = ids('src/content/claims');
  const exampleIds = ids('src/content/examples');
  const skillIds = ids('src/content/skills');
  const resourceIds = ids('src/content/resources');
  const signalIds = ids('src/content/signals');
  const radarIds = ids('src/content/radar');

  // Frontmatter parsing and the src/pages route table live in ./lib/routes.mjs,
  // shared with the sitemap lastmod hook, the agent-surface gate, and the
  // IndexNow ping so none of them can drift from this gate.
  const STATIC_ROUTES = pageRoutes(join(root, 'src/pages'));

  // Tag vocabulary across the tagged collections → valid /tags/<tag> routes.
  const tags = new Set();

  const entries = [];
  for (const dir of COLLECTION_DIRS) {
    for (const f of mdFiles(`src/content/${dir}`)) {
      const rel = `src/content/${dir}/${f}`;
      entries.push({ dir, file: rel, ...frontmatterOf(join(root, rel)) });
    }
  }
  for (const e of entries) {
    for (const t of e.fm?.tags ?? []) if (typeof t === 'string') tags.add(t);
  }

  const counts = {
    claims: claimIds.size,
    examples: exampleIds.size,
    skills: skillIds.size,
    resources: resourceIds.size,
    guide: guideIds.size,
    issues: issueIds.size,
    signals: signalIds.size,
    articles: articleIds.size,
    dives: diveIds.size,
    radar: radarIds.size,
    tags: tags.size,
    staticRoutes: STATIC_ROUTES.size,
  };

  // href is a base-less site path (the `related` convention) — resolve it.
  // The resolution rules live in ./lib/refs.mjs so they're testable against
  // fixture id sets.
  const resolves = makeResolver({
    ids: {
      guide: guideIds,
      issues: issueIds,
      articles: articleIds,
      'deep-dives': diveIds,
      signals: signalIds,
      radar: radarIds,
      claims: claimIds,
      examples: exampleIds,
      skills: skillIds,
      resources: resourceIds,
    },
    tags,
    staticRoutes: STATIC_ROUTES,
  });

  const problems = [];

  for (const { dir, file, fm, body, err } of entries) {
    if (err) {
      problems.push(`${file}: unparseable frontmatter (${err})`);
      continue;
    }

    // 1. claim.section / example.demonstrates must be a real guide section
    if (dir === 'claims') {
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
    // A signal is a one-line news claim with no byline behind it, so the
    // primary source is the only thing making it checkable. Missing it, the
    // item is a rumour with a company name attached — fail the build.
    if (dir === 'signals') {
      if (!fm.company) problems.push(`${file}: missing company`);
      if (!fm.summary) problems.push(`${file}: missing summary — the item is the summary`);
      if (!fm.source?.url) problems.push(`${file}: missing source.url — an unverifiable item is a rumour`);
    }
    // 4. Sourcing floors on the archived articles and deep dives — a corrected
    // archive entry must still meet the floor it was published under. The zod
    // schema carries the same counts — this mirror runs pre-build with a
    // clearer message, and adds the independence check zod can't express.
    problems.push(...sourcingProblems(dir, fm, file, independentHostCount));

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

  return { problems, counts };
}

// CLI: thin wrapper. `import.meta.main` is not available on Node 20, so guard
// on argv[1] instead — importing this module must never exit the process.
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith('check-refs.mjs');
if (invokedDirectly) {
  const { problems, counts: c } = checkRefs();
  if (problems.length) {
    console.error('check-refs: broken internal references:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(
    `check-refs: ok — ${c.claims} claims, ${c.examples} examples, ${c.skills} skills, ${c.resources} resources, ${c.guide} guide sections, ${c.issues} issues, ${c.signals} signals, ${c.articles} archived articles, ${c.dives} archived dives, ${c.radar} radar entries, ${c.tags} tags, ${c.staticRoutes} static routes.`
  );
}
