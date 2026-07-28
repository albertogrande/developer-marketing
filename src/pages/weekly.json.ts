import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getWeeklySorted } from '../lib/content';

// Recent weekly digests — the structured "what changed lately" source.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const weekly = await getWeeklySorted();

  const issues = weekly.map((w) => ({
    id: w.id,
    title: w.data.title,
    week: w.data.week,
    // `date` opens the week covered; `published` is when the issue shipped.
    date: isoDate(w.data.date),
    published: isoDate(w.data.published),
    summary: w.data.summary,
    tags: w.data.tags,
    url: abs(`/weekly/${w.id}`),
    body: w.body ?? '',
  }));

  const updated = issues.length ? issues[0].published : '1970-01-01';

  const body = JSON.stringify(
    { title: 'Developer Marketing field guide — weekly digests', updated, count: issues.length, issues },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
