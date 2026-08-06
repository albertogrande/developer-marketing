import type { APIRoute } from 'astro';
import { absUrl, isoDate } from '../lib/site';
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
  getWireSorted,
} from '../lib/content';

// llms.txt — a curated, link-first index for agents (https://llmstxt.org).
// Complete: every entry of every collection, linking the raw-markdown
// sibling (the fetchable form — each carries its canonical HTML URL inside).

export const GET: APIRoute = async () => {
  const abs = absUrl;

  const guide = await getGuideSorted();
  const claims = await getClaimsSorted();
  const issues = await getIssuesSorted();
  const examples = await getExamplesSorted();
  const skills = await getSkillsSorted();
  const articles = await getArticlesSorted();
  const dives = await getDivesSorted();
  const radar = await getRadarSorted();
  const resources = await getResourcesSorted();
  const wire = await getWireSorted();

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
  lines.push('## Claims');
  lines.push(
    'The reference, atomized — when X → do Y (because Z), dated, sourced, freshness-stamped. Claims marked stale or retired say so.'
  );
  for (const p of claims) {
    const flag = p.data.status === 'current' ? '' : ` [${p.data.status}]`;
    lines.push(
      `- [${p.data.title}](${abs(`/claims/${p.id}.md`)}): when ${p.data.when} → ${p.data.do}${flag}`
    );
  }

  if (examples.length) {
    lines.push('');
    lines.push('## Examples');
    lines.push('Real, sourced dev-marketing artifacts — the evidence behind the claims.');
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

  if (wire.length) {
    lines.push('');
    lines.push('## The Wire');
    lines.push(
      'The event log — one company, one thing that happened, two sentences, and the primary source that proves it.'
    );
    for (const b of wire) {
      lines.push(
        `- [${b.data.company}: ${b.data.title}](${abs(`/wire/${b.id}.md`)}): ${b.data.summary} (${b.data.kind}, ${isoDate(b.data.date)}; source: ${b.data.source.url})`
      );
    }
  }

  if (issues.length) {
    lines.push('');
    lines.push('## Issues');
    lines.push(
      'The Week — one issue per ISO week of what actually changed; occasionally a long special where a thread earned depth.'
    );
    for (const w of issues) {
      lines.push(
        `- [${w.data.title}](${abs(`/issues/${w.id}.md`)}): ${w.data.summary} (${isoDate(w.data.published)})`
      );
    }
  }

  lines.push('');
  lines.push('## Machine endpoints');
  lines.push(`- [api.json](${abs('/api.json')}): the manifest — every endpoint and collection, with counts and updated dates`);
  lines.push(`- [llms-full.txt](${abs('/llms-full.txt')}): the evergreen corpus in full plus recent dated pieces, one fetch`);
  lines.push(`- [guide.json](${abs('/guide.json')}): guide sections with markdown bodies`);
  lines.push(`- [claims.json](${abs('/claims.json')}): structured claims with status and checked dates`);
  lines.push(`- [examples.json](${abs('/examples.json')}): the swipe file of real, sourced artifacts`);
  lines.push(`- [skills.json](${abs('/skills.json')}): installable agent skills, with install lines and caveats`);
  lines.push(`- [resources.json](${abs('/resources.json')}): the directory of vetted providers, caveats and checked dates included`);
  lines.push(`- [wire.json](${abs('/wire.json')}): the event log — dated items with company, kind and primary source`);
  lines.push(`- [issues.json](${abs('/issues.json')}): weekly issues with bodies`);
  lines.push(`- [articles.json](${abs('/articles.json')}): the archived newsroom articles with bodies`);
  lines.push(`- [deep-dives.json](${abs('/deep-dives.json')}): the archived deep dives with bodies`);
  lines.push(`- [radar.json](${abs('/radar.json')}): the archived radar posts`);
  lines.push(`- [feed.xml](${abs('/feed.xml')}): Atom feed of dated pieces, full content`);
  lines.push(`- [feed.json](${abs('/feed.json')}): JSON Feed 1.1, content_html + content_text`);
  lines.push(`- [sitemap-index.xml](${abs('/sitemap-index.xml')}): sitemap with honest per-page lastmod`);

  lines.push('');
  lines.push('## Optional — archives (no new entries)');
  if (articles.length) {
    lines.push('');
    lines.push('### Newsroom archive');
    lines.push('Dated desk articles from the daily tier (2026-07 → 2026-08); analysis now ships in the weekly issue.');
    for (const a of articles) {
      lines.push(
        `- [${a.data.title}](${abs(`/articles/${a.id}.md`)}): ${a.data.summary} (${isoDate(a.data.date)})`
      );
    }
  }
  if (dives.length) {
    lines.push('');
    lines.push('### Deep dives archive');
    lines.push('Long-form researched pieces; depth now ships as a long special issue.');
    for (const v of dives) {
      lines.push(
        `- [${v.data.title}](${abs(`/deep-dives/${v.id}.md`)}): ${v.data.summary} (${isoDate(v.data.date)})`
      );
    }
  }
  if (radar.length) {
    lines.push('');
    lines.push('### Radar archive');
    lines.push("Dated posts from the site's first phase (frozen).");
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
