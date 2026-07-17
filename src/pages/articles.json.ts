import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getArticlesSorted } from '../lib/content';

// Recent newsroom articles — the structured "what the desks published" source.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const articles = await getArticlesSorted();

  const items = articles.map((a) => ({
    id: a.id,
    title: a.data.title,
    desk: a.data.desk,
    byline: a.data.byline,
    date: isoDate(a.data.date),
    summary: a.data.summary,
    tags: a.data.tags,
    sources: a.data.sources,
    url: abs(`/articles/${a.id}`),
    body: a.body ?? '',
  }));

  const updated = items.length ? items[0].date : '1970-01-01';

  const body = JSON.stringify(
    { title: 'Developer Marketing — newsroom articles', updated, count: items.length, articles: items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
