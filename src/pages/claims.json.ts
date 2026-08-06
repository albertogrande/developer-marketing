import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getClaimsSorted } from '../lib/content';

// Machine-readable claims — the reference's atomic units — for agent
// consumption. Deterministic: `updated` is the newest claim date, not build time.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const claims = await getClaimsSorted();

  const items = claims.map((p) => ({
    id: p.id,
    title: p.data.title,
    when: p.data.when,
    do: p.data.do,
    why: p.data.why,
    // The body is the claim's one-line editorial nuance — ship it to agents.
    note: (p.body ?? '').trim() || undefined,
    since: p.data.since,
    verify: p.data.verify,
    probe: p.data.probe
      ? { status: p.data.probe.status, date: isoDate(p.data.probe.date) }
      : undefined,
    status: p.data.status,
    checked: isoDate(p.data.checked),
    section: p.data.section,
    section_url: abs(`/guide/${p.data.section}`),
    tags: p.data.tags,
    sources: p.data.sources,
    updated: isoDate(p.data.updated),
  }));

  const updated = items.reduce((m, p) => (p.updated > m ? p.updated : m), '1970-01-01');

  const body = JSON.stringify(
    { title: 'Developer Marketing field guide — claims', updated, count: items.length, claims: items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
