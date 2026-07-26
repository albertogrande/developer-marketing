// Shared collection queries — the one place that knows how each collection is
// ordered. Pages and machine endpoints import these instead of re-writing the
// sort inline.

import { getCollection, type CollectionEntry } from 'astro:content';

type Dated = { id: string; data: { date: Date } };

// Newest first; id (filename) breaks same-day ties deterministically.
export const entryByDateDesc = (a: Dated, b: Dated) =>
  b.data.date.getTime() - a.data.date.getTime() || b.id.localeCompare(a.id);

// Memoized in production builds — a dozen pages and endpoints call these and
// the collections are immutable within a build. Left un-memoized in dev so
// hot reload keeps seeing fresh content.
const memo = <T>(fn: () => Promise<T>): (() => Promise<T>) => {
  if (!import.meta.env.PROD) return fn;
  let cached: Promise<T> | undefined;
  return () => (cached ??= fn());
};

export const getGuideSorted = memo(async () =>
  (await getCollection('guide')).sort((a, b) => a.data.order - b.data.order)
);

export const getWeeklySorted = memo(async () =>
  (await getCollection('weekly')).sort(entryByDateDesc)
);

export const getDivesSorted = memo(async () =>
  (await getCollection('deep-dives')).sort(entryByDateDesc)
);

// The newsroom — dated desk articles, newest first.
export const getArticlesSorted = memo(async () =>
  (await getCollection('articles')).sort(entryByDateDesc)
);

// Desk key → display label, in one place so pages and endpoints agree.
export const DESK_LABELS: Record<CollectionEntry<'articles'>['data']['desk'], string> = {
  news: 'News',
  money: 'The Money',
  campaigns: 'Campaigns',
  research: 'Research',
  technology: 'Technology',
};

export const getPracticesSorted = memo(async () =>
  (await getCollection('practices')).sort(
    (a, b) => a.data.section.localeCompare(b.data.section) || a.id.localeCompare(b.id)
  )
);

// The swipe file — real, sourced dev-marketing artifacts, newest first.
export const getExamplesSorted = memo(async () =>
  (await getCollection('examples')).sort(entryByDateDesc)
);

// The directory of outside help — grouped by category on the page, so the
// stable order here is category then name (case-insensitive, so "ércule" sorts
// where a reader expects it).
export const getResourcesSorted = memo(async () =>
  (await getCollection('resources')).sort((a, b) =>
    a.data.name.localeCompare(b.data.name, 'en', { sensitivity: 'base' })
  )
);

// Category key → label + one-line "what this section is for". One place, so
// the page, the JSON endpoint and llms.txt describe the directory identically.
export const RESOURCE_CATEGORIES: {
  id: CollectionEntry<'resources'>['data']['category'];
  label: string;
  blurb: string;
}[] = [
  {
    id: 'content',
    label: 'Technical content',
    blurb: 'Tutorials, comparisons and essays written by people who can actually run the thing.',
  },
  {
    id: 'positioning',
    label: 'Positioning & GTM',
    blurb: 'What you say and why anyone should believe it, before you pay anyone to say it at volume.',
  },
  {
    id: 'devrel',
    label: 'DevRel & developer programmes',
    blurb: 'Strategy, friction audits and the people to run a developer programme that survives a budget review.',
  },
  {
    id: 'docs',
    label: 'Documentation',
    blurb: 'The highest-leverage surface you own, treated as engineering rather than as content.',
  },
  {
    id: 'community',
    label: 'Community, events & creators',
    blurb: 'Borrowed reach and owned community: creators, hackathons, ambassador programmes.',
  },
  {
    id: 'research',
    label: 'Research & data',
    blurb: 'Numbers about developers that came from asking developers, with a published method.',
  },
];

export const RESOURCE_CATEGORY_LABELS = Object.fromEntries(
  RESOURCE_CATEGORIES.map((c) => [c.id, c.label])
) as Record<CollectionEntry<'resources'>['data']['category'], string>;

// The archived radar — dated posts from the site's first phase, still rendered.
export const getRadarSorted = memo(async () =>
  (await getCollection('radar')).sort(entryByDateDesc)
);

// The guide's knowledge graph, inverted once per build: for each section,
// the practices that implement it, the examples that evidence it, and the
// dated coverage (articles, weeklies, dives, radar) whose `related` points
// at it. The topic-hub pages and the handbook index both read this.
export type CoverageRef = {
  kind: 'article' | 'weekly' | 'dive' | 'radar';
  title: string;
  href: string;
  date: Date;
};

export const getGuideGraph = memo(async () => {
  const [practices, examples, articles, weekly, dives, radar] = await Promise.all([
    getPracticesSorted(),
    getExamplesSorted(),
    getArticlesSorted(),
    getWeeklySorted(),
    getDivesSorted(),
    getRadarSorted(),
  ]);

  const practicesBySection = new Map<string, typeof practices>();
  for (const p of practices) {
    if (!practicesBySection.has(p.data.section)) practicesBySection.set(p.data.section, []);
    practicesBySection.get(p.data.section)!.push(p);
  }

  const examplesBySection = new Map<string, typeof examples>();
  for (const e of examples) {
    if (!examplesBySection.has(e.data.demonstrates)) examplesBySection.set(e.data.demonstrates, []);
    examplesBySection.get(e.data.demonstrates)!.push(e);
  }

  const coverageBySection = new Map<string, CoverageRef[]>();
  const stripHash = (h: string) => h.split('#')[0].replace(/\/$/, '');
  const addRef = (href: string, ref: CoverageRef) => {
    const m = stripHash(href).match(/^\/guide\/(.+)$/);
    if (!m) return;
    if (!coverageBySection.has(m[1])) coverageBySection.set(m[1], []);
    coverageBySection.get(m[1])!.push(ref);
  };
  for (const a of articles)
    for (const r of a.data.related)
      addRef(r.href, { kind: 'article', title: a.data.title, href: `/articles/${a.id}`, date: a.data.date });
  for (const w of weekly)
    for (const r of w.data.related)
      addRef(r.href, { kind: 'weekly', title: w.data.title, href: `/weekly/${w.id}`, date: w.data.date });
  for (const v of dives)
    for (const r of v.data.related)
      addRef(r.href, { kind: 'dive', title: v.data.title, href: `/deep-dives/${v.id}`, date: v.data.date });
  for (const e of radar)
    for (const r of e.data.related)
      addRef(r.href, { kind: 'radar', title: e.data.title, href: `/radar/${e.id}`, date: e.data.date });
  for (const refs of coverageBySection.values()) refs.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { practicesBySection, examplesBySection, coverageBySection };
});

export type TaggedEntry =
  | { kind: 'weekly'; entry: CollectionEntry<'weekly'> }
  | { kind: 'article'; entry: CollectionEntry<'articles'> }
  | { kind: 'deep-dive'; entry: CollectionEntry<'deep-dives'> }
  | { kind: 'practice'; entry: CollectionEntry<'practices'> }
  | { kind: 'example'; entry: CollectionEntry<'examples'> }
  | { kind: 'resource'; entry: CollectionEntry<'resources'> }
  | { kind: 'radar'; entry: CollectionEntry<'radar'> };

// tag -> everything carrying it, across the tagged collections (the radar
// archive included, so its topics stay discoverable).
export const collectByTag = memo(async (): Promise<Map<string, TaggedEntry[]>> => {
  const [weekly, articles, dives, practices, examples, resources, radar] = await Promise.all([
    getWeeklySorted(),
    getArticlesSorted(),
    getDivesSorted(),
    getPracticesSorted(),
    getExamplesSorted(),
    getResourcesSorted(),
    getRadarSorted(),
  ]);
  const map = new Map<string, TaggedEntry[]>();
  const add = (tag: string, item: TaggedEntry) => {
    if (!map.has(tag)) map.set(tag, []);
    map.get(tag)!.push(item);
  };
  for (const entry of weekly) for (const t of entry.data.tags) add(t, { kind: 'weekly', entry });
  for (const entry of articles) for (const t of entry.data.tags) add(t, { kind: 'article', entry });
  for (const entry of dives) for (const t of entry.data.tags) add(t, { kind: 'deep-dive', entry });
  for (const entry of practices) for (const t of entry.data.tags) add(t, { kind: 'practice', entry });
  for (const entry of examples) for (const t of entry.data.tags) add(t, { kind: 'example', entry });
  for (const entry of resources) for (const t of entry.data.tags) add(t, { kind: 'resource', entry });
  for (const entry of radar) for (const t of entry.data.tags) add(t, { kind: 'radar', entry });
  return map;
});
