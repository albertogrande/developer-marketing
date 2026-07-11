import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getExamplesSorted } from '../lib/content';

// Machine-readable swipe file for agent consumption.
// Deterministic: `updated` is the newest example date, not build time.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const examples = await getExamplesSorted();

  const items = examples.map((e) => ({
    id: e.id,
    title: e.data.title,
    company: e.data.company,
    summary: e.data.summary,
    artifact: e.data.artifact,
    channel: e.data.channel,
    // The "why it works" body — ship the editorial nuance to agents.
    why: (e.body ?? '').trim() || undefined,
    demonstrates: e.data.demonstrates,
    demonstrates_url: abs(`/guide/${e.data.demonstrates}`),
    tags: e.data.tags,
    source: e.data.source,
    sources: e.data.sources,
    date: isoDate(e.data.date),
  }));

  const updated = items.reduce((m, e) => (e.date > m ? e.date : m), '1970-01-01');

  const body = JSON.stringify(
    { title: 'Developer Marketing field guide — examples', updated, count: items.length, examples: items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
