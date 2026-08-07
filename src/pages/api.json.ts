import type { APIRoute } from 'astro';
import { absUrl, isoDate, CONTENT_LICENSE_URL } from '../lib/site';
import {
  getArticlesSorted,
  getClaimsSorted,
  getDivesSorted,
  getExamplesSorted,
  getGuideSorted,
  getIssuesSorted,
  getRadarSorted,
  getResourcesSorted,
  getSkillsSorted,
  getSignalsSorted,
} from '../lib/content';

// /api.json — the machine front door: one fetch that enumerates every
// machine-readable surface this site serves, with per-collection counts and
// honest updated dates. Deterministic (dates come from content, never from
// the build clock).

const REPO = 'https://github.com/albertogrande/developer-marketing';

export const GET: APIRoute = async () => {
  const [guide, articles, issues, dives, signals, radar, claims, examples, skills, resources] =
    await Promise.all([
      getGuideSorted(),
      getArticlesSorted(),
      getIssuesSorted(),
      getDivesSorted(),
      getSignalsSorted(),
      getRadarSorted(),
      getClaimsSorted(),
      getExamplesSorted(),
      getSkillsSorted(),
      getResourcesSorted(),
    ]);

  const newest = (dates: (Date | undefined)[]) => {
    const ds = dates.filter((d): d is Date => !!d).map(isoDate).sort();
    return ds[ds.length - 1] ?? '1970-01-01';
  };

  type AnyColl = { id: string; data: Record<string, unknown> }[];
  const collection = (
    name: string,
    entries: AnyColl,
    opts: { pages: boolean; description: string }
  ) => ({
    description: opts.description,
    count: entries.length,
    updated: newest(
      entries.flatMap(
        (e) => [e.data.date, e.data.updated, e.data.verified, e.data.checked] as (Date | undefined)[]
      )
    ),
    index_url: absUrl(`/${name}`),
    json_url: absUrl(`/${name}.json`),
    // Every entry serves a raw-markdown sibling at this pattern; entries of
    // gallery collections (pages: false) render as #<id> anchors on index_url.
    markdown_url_pattern: absUrl(`/${name}/{id}.md`),
    entry_pages: opts.pages,
    ids: entries.map((e) => e.id),
  });

  const manifest = {
    name: 'The Beat — developer marketing, on the record',
    description:
      'The state of the art in developer marketing — positioning, docs-led growth, DevRel, developer experience, distribution, and the metrics that matter. Kept current by an autonomous agent.',
    site: absUrl('/'),
    repository: REPO,
    license: { code: 'MIT', content: 'CC-BY-4.0', content_url: CONTENT_LICENSE_URL },
    attribution:
      'Content is CC BY 4.0: quote it, link the canonical page, credit "The Beat".',
    cadence: {
      scout:
        'daily 05:00 UTC (internal signals; promotes qualifying items to the signals; patches the guide when a fact changes)',
      editor:
        'Mon 07:00 UTC (writes the weekly issue — occasionally a long special; full guide-accuracy pass; reconciles the claims reference)',
    },
    updated: newest(
      [
        ...guide,
        ...articles,
        ...issues,
        ...dives,
        ...signals,
        ...radar,
        ...claims,
        ...examples,
        ...skills,
        ...resources,
      ].flatMap(
        (e) =>
          [
            e.data.date,
            e.data.updated,
            (e.data as { verified?: Date }).verified,
            (e.data as { checked?: Date }).checked,
          ] as (Date | undefined)[]
      )
    ),
    endpoints: [
      { url: absUrl('/api.json'), type: 'application/json', description: 'This manifest.' },
      { url: absUrl('/llms.txt'), type: 'text/markdown', description: 'Curated llmstxt.org index of everything, linking raw-markdown siblings.' },
      { url: absUrl('/llms-full.txt'), type: 'text/markdown', description: 'The evergreen corpus in full plus recent dated pieces, one fetch.' },
      { url: absUrl('/feed.xml'), type: 'application/atom+xml', description: 'Atom feed of dated pieces, full content included.' },
      { url: absUrl('/feed.json'), type: 'application/feed+json', description: 'JSON Feed 1.1 of dated pieces, content_html and content_text.' },
      { url: absUrl('/sitemap-index.xml'), type: 'application/xml', description: 'Sitemap with honest per-page lastmod.' },
      { url: absUrl('/robots.txt'), type: 'text/plain', description: 'Crawl policy: everything public, AI crawlers welcome.' },
    ],
    collections: {
      guide: collection('guide', guide, {
        pages: true,
        description: 'The evergreen reference — nine topic hubs, continuously kept current.',
      }),
      articles: collection('articles', articles, {
        pages: true,
        description:
          'ARCHIVE — the daily newsroom tier (2026-07 → 2026-08). No new entries; analysis now ships in the weekly issue.',
      }),
      issues: collection('issues', issues, {
        pages: true,
        description:
          'The Beat — one issue per ISO week of what actually changed; occasionally a long special where a thread earned depth.',
      }),
      'deep-dives': collection('deep-dives', dives, {
        pages: true,
        description:
          'ARCHIVE — long-form researched pieces (2026-07). No new entries; depth now ships as a long special issue.',
      }),
      signals: collection('signals', signals, {
        pages: false,
        description:
          'The signals — the event log: one company, one thing that happened, two sentences, and a mandatory primary source. No paid placements.',
      }),
      claims: collection('claims', claims, {
        pages: false,
        description:
          'The claims — the reference’s atomic units: when X → do Y (because Z), dated, sourced, with a freshness status (current/stale/retired) and a checked date.',
      }),
      examples: collection('examples', examples, {
        pages: false,
        description: 'The swipe file — real, sourced dev-marketing artifacts with why-it-works notes.',
      }),
      skills: collection('skills', skills, {
        pages: false,
        description: 'The shelf — installable agent skills, each with a verbatim install line and an honest caveat.',
      }),
      resources: collection('resources', resources, {
        pages: false,
        description:
          'The directory — vetted providers of developer-marketing services, with proof points, caveats, and checked dates. No paid placements.',
      }),
      radar: collection('radar', radar, {
        pages: true,
        description: 'Archived dated posts from the site’s first phase (frozen).',
      }),
    },
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
