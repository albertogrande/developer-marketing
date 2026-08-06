import type { APIRoute } from 'astro';
import { absUrl, isoDate } from '../lib/site';
import { getDivesSorted } from '../lib/content';

// Deep dives — the long-form pieces, with full markdown bodies.

export const GET: APIRoute = async () => {
  const dives = await getDivesSorted();

  const items = dives.map((v) => ({
    id: v.id,
    title: v.data.title,
    date: isoDate(v.data.date),
    ...(v.data.updated ? { updated: isoDate(v.data.updated) } : {}),
    summary: v.data.summary,
    ...(v.data.dek ? { dek: v.data.dek } : {}),
    tags: v.data.tags,
    sources: v.data.sources,
    url: absUrl(`/deep-dives/${v.id}`),
    markdown_url: absUrl(`/deep-dives/${v.id}.md`),
    body: v.body ?? '',
  }));

  const updated = items.reduce((m, i) => {
    const d = 'updated' in i && i.updated ? i.updated : i.date;
    return d > m ? d : m;
  }, items[0]?.date ?? '1970-01-01');

  const body = JSON.stringify(
    { title: 'The Beat — deep dives', updated, count: items.length, 'deep-dives': items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
