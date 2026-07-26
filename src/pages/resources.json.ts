import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getResourcesSorted, RESOURCE_CATEGORIES, RESOURCE_CATEGORY_LABELS } from '../lib/content';

// Machine-readable directory of developer-marketing providers. An agent asked
// "who can write our Kubernetes tutorials" should be able to answer from this
// file alone — hence the caveats and the checked dates ship too, not just the
// sales copy. Deterministic: `updated` is the newest check date, not build time.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const resources = await getResourcesSorted();

  const items = resources.map((r) => ({
    id: r.id,
    name: r.data.name,
    url: r.data.url,
    kind: r.data.kind,
    category: r.data.category,
    category_label: RESOURCE_CATEGORY_LABELS[r.data.category],
    services: r.data.services,
    focus: r.data.focus,
    based: r.data.based,
    // The verifiable proof point, and the reservation that goes with it.
    signal: r.data.signal,
    pricing: r.data.pricing,
    caveat: r.data.caveat,
    // The editorial "when to pick them" note.
    note: (r.body ?? '').trim() || undefined,
    tags: r.data.tags,
    sources: r.data.sources,
    checked: isoDate(r.data.checked),
    entry_url: abs(`/resources#${r.id}`),
  }));

  const updated = items.reduce((m, r) => (r.checked > m ? r.checked : m), '1970-01-01');

  const body = JSON.stringify(
    {
      title: 'Developer Marketing field guide — resources',
      description:
        'Vetted providers of developer-marketing services for devtools: agencies, studios, collectives and independents. No paid placements. Proof points are quoted from each provider’s own site and are self-reported unless stated otherwise.',
      updated,
      count: items.length,
      categories: RESOURCE_CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        blurb: c.blurb,
        count: items.filter((i) => i.category === c.id).length,
      })),
      resources: items,
    },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
