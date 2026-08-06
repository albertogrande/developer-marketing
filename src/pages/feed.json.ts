import type { APIRoute } from 'astro';
import { absUrl } from '../lib/site';
import { getFeedItems } from '../lib/content';
import { mdToHtml } from '../lib/markdown';

// JSON Feed 1.1 (https://jsonfeed.org) — same coverage as feed.xml, with
// content_html for readers and content_text carrying the raw markdown for
// agents. The _markdown extension points at each entry's .md sibling.

const AUTHOR = 'The Beat';

export const GET: APIRoute = async () => {
  const items = await getFeedItems();
  const stamp = (d: Date) => `${d.toISOString().slice(0, 10)}T00:00:00Z`;

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'The Beat — developer marketing, on the record',
    home_page_url: absUrl('/'),
    feed_url: absUrl('/feed.json'),
    description:
      'The state of the art in developer marketing — kept current by an autonomous agent.',
    language: 'en',
    authors: [{ name: AUTHOR, url: absUrl('/about') }],
    items: items.map((e) => ({
      id: absUrl(e.path),
      url: absUrl(e.path),
      title: e.title,
      summary: e.summary,
      content_html: mdToHtml(e.body),
      content_text: e.body,
      date_published: stamp(e.date),
      ...(e.updated ? { date_modified: stamp(e.updated) } : {}),
      ...(e.tags.length ? { tags: e.tags } : {}),
      authors: [{ name: e.byline ?? AUTHOR }],
      _markdown: { url: absUrl(`${e.path}.md`) },
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
};
