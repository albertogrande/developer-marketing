import type { APIRoute } from 'astro';
import { absUrl, isoDate } from '../lib/site';
import { getRadarSorted } from '../lib/content';

// The archived radar — dated posts from the site's first phase, frozen but
// still served so nothing that cites them breaks.

export const GET: APIRoute = async () => {
  const radar = await getRadarSorted();

  const items = radar.map((r) => ({
    id: r.id,
    title: r.data.title,
    date: isoDate(r.data.date),
    kind: r.data.kind,
    summary: r.data.summary,
    ...(r.data.take ? { take: r.data.take } : {}),
    tags: r.data.tags,
    sources: r.data.sources,
    url: absUrl(`/radar/${r.id}`),
    markdown_url: absUrl(`/radar/${r.id}.md`),
    body: r.body ?? '',
  }));

  const updated = items[0]?.date ?? '1970-01-01';

  const body = JSON.stringify(
    { title: 'The Beat — radar archive', updated, count: items.length, radar: items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
