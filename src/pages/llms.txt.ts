import type { APIRoute } from 'astro';
import { withBase } from '../lib/site';
import {
  getArticlesSorted,
  getExamplesSorted,
  getGuideSorted,
  getPracticesSorted,
  getResourcesSorted,
  getWeeklySorted,
} from '../lib/content';

// llms.txt — a curated, link-first index for agents (https://llmstxt.org).
// Points at the guide sections, the practices, and the machine endpoints.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const guide = await getGuideSorted();
  const practices = await getPracticesSorted();
  const weekly = await getWeeklySorted();
  const examples = await getExamplesSorted();
  const articles = await getArticlesSorted();
  const resources = await getResourcesSorted();

  const lines: string[] = [];
  lines.push('# Developer Marketing — a field guide');
  lines.push('');
  lines.push(
    '> The state of the art in developer marketing — positioning, docs-led growth, DevRel, developer experience, content, distribution, launches, and measurement. Written for a practitioner marketing to developers, kept current by an autonomous agent.'
  );
  lines.push('');
  lines.push(
    'For the full text in one file, see the /llms-full.txt link below. Structured data is at /practices.json, /guide.json, /weekly.json, /examples.json, and /resources.json.'
  );

  lines.push('');
  lines.push('## Guide');
  for (const g of guide) {
    lines.push(`- [${g.data.title}](${abs(`/guide/${g.id}`)}): ${g.data.summary}`);
  }

  lines.push('');
  lines.push('## Practices');
  for (const p of practices) {
    lines.push(`- [${p.data.title}](${abs(`/guide/${p.data.section}`)}): when ${p.data.when} → ${p.data.do}`);
  }

  if (examples.length) {
    lines.push('');
    lines.push('## Examples');
    lines.push('Real, sourced dev-marketing artifacts — the evidence behind the practices.');
    for (const e of examples) {
      lines.push(
        `- [${e.data.company}: ${e.data.title}](${e.data.source.url}): ${e.data.summary} (demonstrates ${abs(`/guide/${e.data.demonstrates}`)})`
      );
    }
  }

  if (resources.length) {
    lines.push('');
    lines.push('## Resources');
    lines.push(
      'Who to hire for developer marketing — vetted providers, no paid placements. Claims are self-reported unless stated otherwise.'
    );
    for (const r of resources) {
      lines.push(
        `- [${r.data.name}](${r.data.url}): ${r.data.kind}, ${r.data.services.join('/')} — ${r.data.signal}${r.data.caveat ? ` Caveat: ${r.data.caveat}` : ''} (${abs(`/resources#${r.id}`)})`
      );
    }
  }

  if (weekly.length) {
    lines.push('');
    lines.push('## Weekly');
    for (const w of weekly.slice(0, 8)) {
      lines.push(`- [${w.data.title}](${abs(`/weekly/${w.id}`)}): ${w.data.summary}`);
    }
  }

  if (articles.length) {
    lines.push('');
    lines.push('## Newsroom');
    lines.push('Dated desk articles — news, money, campaigns, research, technology.');
    for (const a of articles.slice(0, 10)) {
      lines.push(`- [${a.data.title}](${abs(`/articles/${a.id}`)}): ${a.data.summary}`);
    }
  }

  lines.push('');
  lines.push('## Machine endpoints');
  lines.push(`- [llms-full.txt](${abs('/llms-full.txt')}): the whole guide and practices as one markdown file`);
  lines.push(`- [practices.json](${abs('/practices.json')}): structured best-practices`);
  lines.push(`- [guide.json](${abs('/guide.json')}): guide sections with markdown bodies`);
  lines.push(`- [weekly.json](${abs('/weekly.json')}): recent weekly digests`);
  lines.push(`- [articles.json](${abs('/articles.json')}): newsroom articles with bodies`);
  lines.push(`- [examples.json](${abs('/examples.json')}): the swipe file of real, sourced artifacts`);
  lines.push(`- [resources.json](${abs('/resources.json')}): the directory of developer-marketing providers`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
