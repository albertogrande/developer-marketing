import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { withBase } from '../lib/site';

// Atom feed over the radar. Entries dated to their frontmatter date (00:00Z),
// newest first.

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
  const radar = (await getCollection('radar')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  const abs = (slug: string) => new URL(withBase(`/radar/${slug}`), site).href;
  const stamp = (d: Date) => `${d.toISOString().slice(0, 10)}T00:00:00Z`;
  const updated = radar.length ? stamp(radar[0].data.date) : '1970-01-01T00:00:00Z';

  const home = new URL(import.meta.env.BASE_URL, site).href;
  const self = new URL(
    `${import.meta.env.BASE_URL.replace(/\/$/, '')}/feed.xml`,
    site
  ).href;

  const entries = radar
    .map(
      (e) => `  <entry>
    <title>${esc(e.data.title)}</title>
    <link href="${abs(e.id)}" rel="alternate" type="text/html"/>
    <id>${abs(e.id)}</id>
    <updated>${stamp(e.data.date)}</updated>
    <published>${stamp(e.data.date)}</published>
    <summary>${esc(e.data.summary)}</summary>
${e.data.tags.map((t) => `    <category term="${esc(t)}"/>`).join('\n')}
  </entry>`
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
