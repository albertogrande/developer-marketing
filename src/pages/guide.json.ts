import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getGuideSorted } from '../lib/content';

// The evergreen guide, section by section, with raw markdown body — the
// structured source for agents that want one section rather than the full
// llms-full.txt corpus.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const guide = await getGuideSorted();

  const sections = guide.map((g) => ({
    id: g.id,
    title: g.data.title,
    order: g.data.order,
    summary: g.data.summary,
    updated: isoDate(g.data.updated),
    url: abs(`/guide/${g.id}`),
    body: g.body ?? '',
  }));

  const updated = sections.reduce((m, s) => (s.updated > m ? s.updated : m), '1970-01-01');

  const body = JSON.stringify(
    { title: 'Developer Marketing field guide — sections', updated, count: sections.length, sections },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
