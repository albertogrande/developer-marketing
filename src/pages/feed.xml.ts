import type { APIRoute } from 'astro';
import { absUrl } from '../lib/site';
import { getFeedItems } from '../lib/content';
import { mdToHtml } from '../lib/markdown';

// Atom feed over the dated pieces (weekly, newsroom, deep dives, radar
// archive), newest first, full content included so a reader — human or agent
// — needs no second fetch. The guide is not syndicated (see getFeedItems).

const SITE_TITLE = 'The Beat — a developer marketing field guide';
const SITE_DESC =
  'The state of the art in developer marketing — kept current by an autonomous agent.';
const AUTHOR = 'The Beat';

const esc = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const GET: APIRoute = async () => {
  const items = await getFeedItems();

  const stamp = (d: Date) => `${d.toISOString().slice(0, 10)}T00:00:00Z`;
  const latest = (i: (typeof items)[number]) => i.updated ?? i.date;
  const updated = items.length
    ? stamp(items.reduce((m, i) => (latest(i) > m ? latest(i) : m), latest(items[0])))
    : '1970-01-01T00:00:00Z';

  const home = absUrl('/');
  const self = absUrl('/feed.xml');

  const entries = items
    .map(
      (e) => `  <entry>
    <title>${esc(e.title)}</title>
    <link href="${absUrl(e.path)}" rel="alternate" type="text/html"/>
    <link href="${absUrl(`${e.path}.md`)}" rel="alternate" type="text/markdown"/>
    <id>${absUrl(e.path)}</id>
    <updated>${stamp(latest(e))}</updated>
    <published>${stamp(e.date)}</published>
    <author><name>${esc(e.byline ?? AUTHOR)}</name></author>
    <summary>${esc(e.summary)}</summary>
    <content type="html">${esc(mdToHtml(e.body))}</content>
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
  <rights>CC BY 4.0 — quote it, link the page</rights>
${entries}
</feed>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
