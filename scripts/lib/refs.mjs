// Pure reference-resolution logic, factored out of check-refs.mjs so the
// gate's routing rules and sourcing floors are testable against fixture id
// sets instead of a full repo checkout. check-refs.mjs supplies the real ids;
// the tests supply small fake ones.

// Gallery collections render as #anchors on their index page.
const ANCHOR_GALLERIES = {
  '/practices': 'practices',
  '/examples': 'examples',
  '/skills': 'skills',
  '/resources': 'resources',
  '/briefs': 'briefs',
};

// Collections whose entries have standalone pages under /<collection>/<id>.
const PAGE_COLLECTIONS = ['guide', 'weekly', 'articles', 'deep-dives', 'radar'];

// Build a resolver over the site's id sets. `ids` maps collection name → Set
// of entry ids; `tags` is the tag vocabulary; `staticRoutes` the src/pages
// route table. Returned function takes a base-less href and answers whether
// it resolves to a real route.
export function makeResolver({ ids, tags, staticRoutes }) {
  return function resolves(href) {
    const [path, hash] = href.split('#');
    const clean = path.replace(/\/$/, '') || '/';
    const gallery = ANCHOR_GALLERIES[clean];
    if (gallery && hash) return ids[gallery]?.has(hash) ?? false;
    if (staticRoutes.has(clean)) return true;
    let m;
    // Markdown siblings: every entry serves a raw /<collection>/<id>.md variant.
    if ((m = clean.match(/^\/([a-z-]+)\/([^/]+)\.md$/)) && ids[m[1]]) {
      return ids[m[1]].has(m[2]);
    }
    for (const c of PAGE_COLLECTIONS) {
      if ((m = clean.match(new RegExp(`^/${c}/([^/]+)$`)))) return ids[c]?.has(m[1]) ?? false;
    }
    if ((m = clean.match(/^\/tags\/([^/]+)$/))) return tags.has(m[1]);
    return false;
  };
}

// The sourcing floors the skills promise, made deterministic: articles carry
// ≥2 sources, deep dives ≥3, and both must span ≥2 independent publishers.
// `independentHostCount` is injected so this stays pure (it lives in
// sources.mjs). Returns a list of problem strings, empty when clean.
export function sourcingProblems(dir, fm, file, independentHostCount) {
  if (dir !== 'articles' && dir !== 'deep-dives') return [];
  const floor = dir === 'articles' ? 2 : 3;
  const noun = dir === 'articles' ? 'an article' : 'a deep dive';
  const urls = (fm.sources ?? []).map((s) => s?.url).filter(Boolean);
  if (urls.length < floor) {
    return [`${file}: ${urls.length} source(s) — ${noun} needs at least ${floor}`];
  }
  if (independentHostCount(urls) < 2) {
    return [`${file}: all sources share one publisher — at least two independent domains required`];
  }
  return [];
}
