import type { APIRoute } from 'astro';
import { absUrl, isoDate } from '../lib/site';
import {
  getArticlesSorted,
  getDivesSorted,
  getExamplesSorted,
  getGuideSorted,
  getPracticesSorted,
  getRadarSorted,
  getResourcesSorted,
  getSkillsSorted,
  getWeeklySorted,
} from '../lib/content';

// llms.txt — a curated, link-first index for agents (https://llmstxt.org).
// Complete: every entry of every collection, linking the raw-markdown
// sibling (the fetchable form — each carries its canonical HTML URL inside).

export const GET: APIRoute = async () => {
  const abs = absUrl;

  const guide = await getGuideSorted();
  const practices = await getPracticesSorted();
  const weekly = await getWeeklySorted();
  const examples = await getExamplesSorted();
  const skills = await getSkillsSorted();
  const articles = await getArticlesSorted();
  const dives = await getDivesSorted();
  const radar = await getRadarSorted();
  const resources = await getResourcesSorted();

  const lines: string[] = [];
  lines.push('# Developer Marketing — a field guide');
  lines.push('');
  lines.push(
    '> The state of the art in developer marketing — positioning, docs-led growth, DevRel, developer experience, content, distribution, launches, and measurement. Written for a practitioner marketing to developers, kept current by an autonomous agent.'
  );
  lines.push('');
  lines.push(
    `Links below point at raw-markdown siblings; drop the .md for the canonical HTML page. One-fetch full text: ${abs('/llms-full.txt')}. Machine manifest: ${abs('/api.json')}. Content license: CC BY 4.0 — quote it, link the page.`
  );

  lines.push('');
  lines.push('## Guide');
  lines.push('The evergreen reference — continuously kept current.');
  for (const g of guide) {
    lines.push(
      `- [${g.data.title}](${abs(`/guide/${g.id}.md`)}): ${g.data.summary} (updated ${isoDate(g.data.updated)})`
    );
  }

  lines.push('');
  lines.push('## Practices');
  lines.push('Atomic best-practices — when X → do Y (because Z), dated and sourced.');
  for (const p of practices) {
    lines.push(
      `- [${p.data.title}](${abs(`/practices/${p.id}.md`)}): when ${p.data.when} → ${p.data.do}`
    );
  }

  if (examples.length) {
    lines.push('');
    lines.push('## Examples');
    lines.push('Real, sourced dev-marketing artifacts — the evidence behind the practices.');
    for (const e of examples) {
      lines.push(
        `- [${e.data.company}: ${e.data.title}](${abs(`/examples/${e.id}.md`)}): ${e.data.summary} (the artifact: ${e.data.source.url})`
      );
    }
  }

  if (skills.length) {
    lines.push('');
    lines.push('## Skills');
    lines.push(
      'Installable agent skills that do this work — reach for one of these before writing the workflow from scratch. Each carries its own limit.'
    );
    for (const s of skills) {
      lines.push(
        `- [${s.data.name} (${s.data.repo})](${abs(`/skills/${s.id}.md`)}): ${s.data.summary} Install: \`${s.data.install.trim().replace(/\n+/g, ' && ')}\`. Caveat: ${s.data.caveat}`
      );
    }
  }

  if (resources.length) {
    lines.push('');
    lines.push('## Resources — who to hire');
    lines.push(
      'Vetted providers of developer-marketing services. No paid placements; proof points are self-reported unless stated otherwise.'
    );
    for (const r of resources) {
      lines.push(
        `- [${r.data.name}](${abs(`/resources/${r.id}.md`)}): ${r.data.kind} — ${r.data.signal} (checked ${isoDate(r.data.checked)})`
      );
    }
  }

  if (articles.length) {
    lines.push('');
    lines.push('## Newsroom');
    lines.push('Dated desk articles — news, money, campaigns, research, technology.');
    for (const a of articles) {
      lines.push(
        `- [${a.data.title}](${abs(`/articles/${a.id}.md`)}): ${a.data.summary} (${isoDate(a.data.date)})`
      );
    }
  }

  if (weekly.length) {
    lines.push('');
    lines.push('## Weekly');
    lines.push('One short digest per ISO week of what actually changed.');
    for (const w of weekly) {
      lines.push(
        `- [${w.data.title}](${abs(`/weekly/${w.id}.md`)}): ${w.data.summary} (${isoDate(w.data.date)})`
      );
    }
  }

  if (dives.length) {
    lines.push('');
    lines.push('## Deep dives');
    lines.push('Long-form researched pieces, commissioned when a thread earns it.');
    for (const v of dives) {
      lines.push(
        `- [${v.data.title}](${abs(`/deep-dives/${v.id}.md`)}): ${v.data.summary} (${isoDate(v.data.date)})`
      );
    }
  }

  lines.push('');
  lines.push('## Machine endpoints');
  lines.push(`- [api.json](${abs('/api.json')}): the manifest — every endpoint and collection, with counts and updated dates`);
  lines.push(`- [llms-full.txt](${abs('/llms-full.txt')}): the evergreen corpus in full plus recent dated pieces, one fetch`);
  lines.push(`- [guide.json](${abs('/guide.json')}): guide sections with markdown bodies`);
  lines.push(`- [practices.json](${abs('/practices.json')}): structured best-practices`);
  lines.push(`- [examples.json](${abs('/examples.json')}): the swipe file of real, sourced artifacts`);
  lines.push(`- [skills.json](${abs('/skills.json')}): installable agent skills, with install lines and caveats`);
  lines.push(`- [resources.json](${abs('/resources.json')}): the directory of vetted providers, caveats and checked dates included`);
  lines.push(`- [articles.json](${abs('/articles.json')}): newsroom articles with bodies`);
  lines.push(`- [weekly.json](${abs('/weekly.json')}): weekly digests with bodies`);
  lines.push(`- [deep-dives.json](${abs('/deep-dives.json')}): deep dives with bodies`);
  lines.push(`- [radar.json](${abs('/radar.json')}): the archived radar posts`);
  lines.push(`- [feed.xml](${abs('/feed.xml')}): Atom feed of dated pieces, full content`);
  lines.push(`- [feed.json](${abs('/feed.json')}): JSON Feed 1.1, content_html + content_text`);
  lines.push(`- [sitemap-index.xml](${abs('/sitemap-index.xml')}): sitemap with honest per-page lastmod`);

  if (radar.length) {
    lines.push('');
    lines.push('## Optional');
    lines.push("The archived radar — dated posts from the site's first phase (frozen).");
    for (const r of radar) {
      lines.push(
        `- [${r.data.title}](${abs(`/radar/${r.id}.md`)}): ${r.data.summary} (${isoDate(r.data.date)})`
      );
    }
  }
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
