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

export const getPracticesSorted = memo(async () =>
  (await getCollection('practices')).sort(
    (a, b) => a.data.section.localeCompare(b.data.section) || a.id.localeCompare(b.id)
  )
);

// The swipe file — real, sourced dev-marketing artifacts, newest first.
export const getExamplesSorted = memo(async () =>
  (await getCollection('examples')).sort(entryByDateDesc)
);

// The archived radar — dated posts from the site's first phase, still rendered.
export const getRadarSorted = memo(async () =>
  (await getCollection('radar')).sort(entryByDateDesc)
);

export type TaggedEntry =
  | { kind: 'weekly'; entry: CollectionEntry<'weekly'> }
  | { kind: 'deep-dive'; entry: CollectionEntry<'deep-dives'> }
  | { kind: 'practice'; entry: CollectionEntry<'practices'> }
  | { kind: 'example'; entry: CollectionEntry<'examples'> }
  | { kind: 'radar'; entry: CollectionEntry<'radar'> };

// tag -> everything carrying it, across the tagged collections (the radar
// archive included, so its topics stay discoverable).
export const collectByTag = memo(async (): Promise<Map<string, TaggedEntry[]>> => {
  const [weekly, dives, practices, examples, radar] = await Promise.all([
    getWeeklySorted(),
    getDivesSorted(),
    getPracticesSorted(),
    getExamplesSorted(),
    getRadarSorted(),
  ]);
  const map = new Map<string, TaggedEntry[]>();
  const add = (tag: string, item: TaggedEntry) => {
    if (!map.has(tag)) map.set(tag, []);
    map.get(tag)!.push(item);
  };
  for (const entry of weekly) for (const t of entry.data.tags) add(t, { kind: 'weekly', entry });
  for (const entry of dives) for (const t of entry.data.tags) add(t, { kind: 'deep-dive', entry });
  for (const entry of practices) for (const t of entry.data.tags) add(t, { kind: 'practice', entry });
  for (const entry of examples) for (const t of entry.data.tags) add(t, { kind: 'example', entry });
  for (const entry of radar) for (const t of entry.data.tags) add(t, { kind: 'radar', entry });
  return map;
});
