import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getBriefsSorted } from '../lib/content';

// Machine-readable wire for agent consumption.
// Deterministic: `updated` is the newest brief date, not build time.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const briefs = await getBriefsSorted();

  const items = briefs.map((b) => ({
    id: b.id,
    title: b.data.title,
    company: b.data.company,
    kind: b.data.kind,
    // The two sentences — the brief itself.
    summary: b.data.summary,
    // The optional trailing note: why it matters, what to watch.
    note: (b.body ?? '').trim() || undefined,
    tags: b.data.tags,
    source: b.data.source,
    sources: b.data.sources,
    url: abs(`/briefs#${b.id}`),
    markdown_url: abs(`/briefs/${b.id}.md`),
    date: isoDate(b.data.date),
    updated: b.data.updated ? isoDate(b.data.updated) : undefined,
  }));

  const updated = items.reduce((m, b) => ((b.updated ?? b.date) > m ? (b.updated ?? b.date) : m), '1970-01-01');

  const body = JSON.stringify(
    { title: 'Developer Marketing field guide — briefs', updated, count: items.length, briefs: items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
