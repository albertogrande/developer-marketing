import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { withBase } from '../lib/site';

// Atom feed over the weekly digests, deep dives, and the archived radar
// entries, newest first. Entries are dated to their frontmatter date (00:00Z).
// Signals and the guide are not syndicated — the feed is the "what's new to
// read" stream.

const SITE_TITLE = 'Developer Marketing — a field guide';
const SITE_DESC =
  'The state of the art in developer marketing — kept current by an autonomous agent.';
const AUTHOR = 'Developer Marketing field guide';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async (context) => {
  const site = context.site!; // https://albertogrande.github.io

  const weekly = (await getCollection('weekly')).map((e) => ({
    title: e.data.title,
    summary: e.data.summary,
    date: e.data.date,
    tags: e.data.tags,
    path: `/weekly/${e.id}`,
  }));
  const articles = (await getCollection('articles')).map((e) => ({
    title: e.data.title,
    summary: e.data.summary,
    date: e.data.date,
    tags: e.data.tags,
    path: `/articles/${e.id}`,
  }));
  const dives = (await getCollection('deep-dives')).map((e) => ({
    title: e.data.title,
    summary: e.data.summary,
    date: e.data.date,
    tags: e.data.tags,
    path: `/deep-dives/${e.id}`,
  }));
  const radar = (await getCollection('radar')).map((e) => ({
    title: e.data.title,
    summary: e.data.summary,
    date: e.data.date,
    tags: e.data.tags,
    path: `/radar/${e.id}`,
  }));

  const items = [...weekly, ...articles, ...dives, ...radar].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  const abs = (path: string) => new URL(withBase(path), site).href;
  const stamp = (d: Date) => `${d.toISOString().slice(0, 10)}T00:00:00Z`;
  const updated = items.length ? stamp(items[0].date) : '1970-01-01T00:00:00Z';

  const home = new URL(import.meta.env.BASE_URL, site).href;
  const self = new URL(
    `${import.meta.env.BASE_URL.replace(/\/$/, '')}/feed.xml`,
    site
  ).href;

  const entries = items
    .map(
      (e) => `  <entry>
    <title>${esc(e.title)}</title>
    <link href="${abs(e.path)}" rel="alternate" type="text/html"/>
    <id>${abs(e.path)}</id>
    <updated>${stamp(e.date)}</updated>
    <published>${stamp(e.date)}</published>
    <summary>${esc(e.summary)}</summary>
${e.tags.length ? e.tags.map((t) => `    <category term="${esc(t)}"/>`).join('\n') + '\n' : ''}  </entry>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${esc(SITE_TITLE)}</title>
  <subtitle>${esc(SITE_DESC)}</subtitle>
  <link href="${self}" rel="self" type="application/atom+xml"/>
  <link href="${home}" rel="alternate" type="text/html"/>
  <updated>${updated}</updated>
  <id>${home}</id>
  <author><name>${esc(AUTHOR)}</name></author>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
