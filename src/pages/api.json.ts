import type { APIRoute } from 'astro';
import { absUrl, isoDate, CONTENT_LICENSE_URL } from '../lib/site';
import {
  getArticlesSorted,
  getDivesSorted,
  getExamplesSorted,
  getGuideSorted,
  getPracticesSorted,
  getRadarSorted,
  getSkillsSorted,
  getWeeklySorted,
} from '../lib/content';

// /api.json — the machine front door: one fetch that enumerates every
// machine-readable surface this site serves, with per-collection counts and
// honest updated dates. Deterministic (dates come from content, never from
// the build clock).

const REPO = 'https://github.com/albertogrande/developer-marketing';

export const GET: APIRoute = async () => {
  const [guide, articles, weekly, dives, radar, practices, examples, skills] = await Promise.all([
    getGuideSorted(),
    getArticlesSorted(),
    getWeeklySorted(),
    getDivesSorted(),
    getRadarSorted(),
    getPracticesSorted(),
    getExamplesSorted(),
    getSkillsSorted(),
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
      entries.flatMap((e) => [e.data.date, e.data.updated, e.data.verified] as (Date | undefined)[])
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
    name: 'Developer Marketing — a field guide',
    description:
      'The state of the art in developer marketing — positioning, docs-led growth, DevRel, developer experience, distribution, and the metrics that matter. Kept current by an autonomous agent.',
    site: absUrl('/'),
    repository: REPO,
    license: { code: 'MIT', content: 'CC-BY-4.0', content_url: CONTENT_LICENSE_URL },
    attribution:
      'Content is CC BY 4.0: quote it, link the canonical page, credit "Developer Marketing field guide".',
    cadence: {
      scout: 'daily 05:00 UTC (internal signals; patches the guide when a fact changes)',
      newsroom: 'Tue–Sun 06:30 UTC (at most one article, never a quota)',
      weekly: 'Mon 07:00 UTC (the digest; full guide-accuracy pass)',
    },
    updated: newest(
      [...guide, ...articles, ...weekly, ...dives, ...radar, ...practices, ...examples, ...skills].flatMap(
        (e) => [e.data.date, e.data.updated, (e.data as { verified?: Date }).verified] as (Date | undefined)[]
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
        description: 'The newsroom — dated desk articles (news, money, campaigns, research, technology).',
      }),
      weekly: collection('weekly', weekly, {
        pages: true,
        description: 'The Week — one short digest per ISO week of what actually changed.',
      }),
      'deep-dives': collection('deep-dives', dives, {
        pages: true,
        description: 'Long-form researched pieces, commissioned when a thread earns it.',
      }),
      practices: collection('practices', practices, {
        pages: false,
        description: 'Atomic best-practices: when X → do Y (because Z), dated and sourced.',
      }),
      examples: collection('examples', examples, {
        pages: false,
        description: 'The swipe file — real, sourced dev-marketing artifacts with why-it-works notes.',
      }),
      skills: collection('skills', skills, {
        pages: false,
        description: 'The shelf — installable agent skills, each with a verbatim install line and an honest caveat.',
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
