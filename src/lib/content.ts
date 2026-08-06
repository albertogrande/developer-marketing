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

// The issues — the weekly prose form, newest first (by the Monday covered).
export const getIssuesSorted = memo(async () =>
  (await getCollection('issues')).sort(entryByDateDesc)
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

// The wire — the event log, newest first. Same tie-break as every other
// dated collection, which matters here: items land several to a day.
export const getWireSorted = memo(async () =>
  (await getCollection('wire')).sort(entryByDateDesc)
);

// Wire kind → display label, in one place so the card chip, the JSON endpoint
// and llms.txt describe an item identically.
export const WIRE_KIND_LABELS: Record<CollectionEntry<'wire'>['data']['kind'], string> = {
  news: 'News',
  release: 'Release',
  funding: 'Funding',
  launch: 'Launch',
  campaign: 'Campaign',
  discussion: 'Discussion',
  podcast: 'Podcast',
};

// ISO-8601 week id for a date — 'YYYY-Www', the same string the issues
// collection uses as its id and the scout uses for signals/<week>.md. Matches
// `date -u +%G-W%V` exactly, year boundaries included (2027-01-03 → 2026-W53),
// which is what lets an issue find its own wire items by id alone. The
// implementation lives in ./dates.mjs (pure, `node --test`-pinned); imported
// (not just re-exported) because this module uses it below.
import { isoWeekId } from './dates.mjs';
export { isoWeekId };

// ISO week id → the wire items published in it, newest first. The weekly
// issue reads this to render "The week in links" without anyone writing the
// roundup a second time: the items already carry company, two sentences and a
// source.
export const getWireByWeek = memo(async (): Promise<Map<string, CollectionEntry<'wire'>[]>> => {
  const map = new Map<string, CollectionEntry<'wire'>[]>();
  for (const entry of await getWireSorted()) {
    const key = isoWeekId(entry.data.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
});

// The claims — the reference's atomic units, in the guide's own order.
export const getClaimsSorted = memo(async () =>
  (await getCollection('claims')).sort(
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

// The shelf — installable agent skills, ordered by the guide section whose job
// they do (then by id) so the page reads in the guide's own order rather than
// by the arbitrary date a batch was added.
export const getSkillsSorted = memo(async () =>
  (await getCollection('skills')).sort(
    (a, b) => a.data.section.localeCompare(b.data.section) || a.id.localeCompare(b.id)
  )
);

// The archived radar — dated posts from the site's first phase, still rendered.
export const getRadarSorted = memo(async () =>
  (await getCollection('radar')).sort(entryByDateDesc)
);

// The guide's knowledge graph, inverted once per build: for each section,
// the claims that implement it, the examples that evidence it, the skills
// that automate it, and the dated coverage (issues plus the archives) whose
// `related` points at it. The topic-hub pages and the handbook index both
// read this.
export type CoverageRef = {
  kind: 'article' | 'issue' | 'dive' | 'radar';
  title: string;
  href: string;
  date: Date;
};

export const getGuideGraph = memo(async () => {
  const [claims, examples, skills, articles, issues, dives, radar] = await Promise.all([
    getClaimsSorted(),
    getExamplesSorted(),
    getSkillsSorted(),
    getArticlesSorted(),
    getIssuesSorted(),
    getDivesSorted(),
    getRadarSorted(),
  ]);

  const claimsBySection = new Map<string, typeof claims>();
  for (const p of claims) {
    if (!claimsBySection.has(p.data.section)) claimsBySection.set(p.data.section, []);
    claimsBySection.get(p.data.section)!.push(p);
  }

  const examplesBySection = new Map<string, typeof examples>();
  for (const e of examples) {
    if (!examplesBySection.has(e.data.demonstrates)) examplesBySection.set(e.data.demonstrates, []);
    examplesBySection.get(e.data.demonstrates)!.push(e);
  }

  const skillsBySection = new Map<string, typeof skills>();
  for (const s of skills) {
    if (!skillsBySection.has(s.data.section)) skillsBySection.set(s.data.section, []);
    skillsBySection.get(s.data.section)!.push(s);
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
  for (const w of issues)
    for (const r of w.data.related)
      addRef(r.href, { kind: 'issue', title: w.data.title, href: `/issues/${w.id}`, date: w.data.published });
  for (const v of dives)
    for (const r of v.data.related)
      addRef(r.href, { kind: 'dive', title: v.data.title, href: `/deep-dives/${v.id}`, date: v.data.date });
  for (const e of radar)
    for (const r of e.data.related)
      addRef(r.href, { kind: 'radar', title: e.data.title, href: `/radar/${e.id}`, date: e.data.date });
  for (const refs of coverageBySection.values()) refs.sort((a, b) => b.date.getTime() - a.date.getTime());

  return { claimsBySection, examplesBySection, skillsBySection, coverageBySection };
});

// The syndication stream — every dated prose piece (issues, plus the
// archived newsroom, deep dives and radar), newest first, one shape. Both
// feeds read this; the guide is deliberately absent (it mutates continuously
// — its freshness is carried by sitemap lastmod, api.json, and llms.txt
// dates instead) and so is the wire (short items would drown the prose).
export type FeedItem = {
  title: string;
  summary: string;
  date: Date;
  updated?: Date;
  tags: string[];
  path: string;
  body: string;
  byline?: string;
};

export const getFeedItems = memo(async (): Promise<FeedItem[]> => {
  const [issues, articles, dives, radar] = await Promise.all([
    getIssuesSorted(),
    getArticlesSorted(),
    getDivesSorted(),
    getRadarSorted(),
  ]);
  const items: FeedItem[] = [
    // An issue syndicates under the day it SHIPPED, not the Monday it covers —
    // `date` is a week behind by construction, which sank each new issue
    // below the articles it is newer than.
    ...issues.map((e) => ({
      title: e.data.title,
      summary: e.data.summary,
      date: e.data.published,
      updated: e.data.updated,
      tags: e.data.tags,
      path: `/issues/${e.id}`,
      body: e.body ?? '',
    })),
    ...articles.map((e) => ({
      title: e.data.title,
      summary: e.data.summary,
      date: e.data.date,
      updated: e.data.updated,
      tags: e.data.tags,
      path: `/articles/${e.id}`,
      body: e.body ?? '',
      byline: e.data.byline,
    })),
    ...dives.map((e) => ({
      title: e.data.title,
      summary: e.data.summary,
      date: e.data.date,
      updated: e.data.updated,
      tags: e.data.tags,
      path: `/deep-dives/${e.id}`,
      body: e.body ?? '',
    })),
    ...radar.map((e) => ({
      title: e.data.title,
      summary: e.data.summary,
      date: e.data.date,
      tags: e.data.tags,
      path: `/radar/${e.id}`,
      body: e.body ?? '',
    })),
  ];
  return items.sort((a, b) => b.date.getTime() - a.date.getTime());
});

export type TaggedEntry =
  | { kind: 'issue'; entry: CollectionEntry<'issues'> }
  | { kind: 'article'; entry: CollectionEntry<'articles'> }
  | { kind: 'deep-dive'; entry: CollectionEntry<'deep-dives'> }
  | { kind: 'claim'; entry: CollectionEntry<'claims'> }
  | { kind: 'example'; entry: CollectionEntry<'examples'> }
  | { kind: 'resource'; entry: CollectionEntry<'resources'> }
  | { kind: 'skill'; entry: CollectionEntry<'skills'> }
  | { kind: 'wire'; entry: CollectionEntry<'wire'> }
  | { kind: 'radar'; entry: CollectionEntry<'radar'> };

// tag -> everything carrying it, across the tagged collections (the radar
// archive included, so its topics stay discoverable).
export const collectByTag = memo(async (): Promise<Map<string, TaggedEntry[]>> => {
  const [issues, articles, dives, claims, examples, resources, skills, wire, radar] =
    await Promise.all([
      getIssuesSorted(),
      getArticlesSorted(),
      getDivesSorted(),
      getClaimsSorted(),
      getExamplesSorted(),
      getResourcesSorted(),
      getSkillsSorted(),
      getWireSorted(),
      getRadarSorted(),
    ]);
  const map = new Map<string, TaggedEntry[]>();
  const add = (tag: string, item: TaggedEntry) => {
    if (!map.has(tag)) map.set(tag, []);
    map.get(tag)!.push(item);
  };
  for (const entry of issues) for (const t of entry.data.tags) add(t, { kind: 'issue', entry });
  for (const entry of articles) for (const t of entry.data.tags) add(t, { kind: 'article', entry });
  for (const entry of dives) for (const t of entry.data.tags) add(t, { kind: 'deep-dive', entry });
  for (const entry of claims) for (const t of entry.data.tags) add(t, { kind: 'claim', entry });
  for (const entry of examples) for (const t of entry.data.tags) add(t, { kind: 'example', entry });
  for (const entry of resources) for (const t of entry.data.tags) add(t, { kind: 'resource', entry });
  for (const entry of skills) for (const t of entry.data.tags) add(t, { kind: 'skill', entry });
  for (const entry of wire) for (const t of entry.data.tags) add(t, { kind: 'wire', entry });
  for (const entry of radar) for (const t of entry.data.tags) add(t, { kind: 'radar', entry });
  return map;
});
