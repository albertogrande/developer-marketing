import type { APIRoute } from 'astro';
import { withBase } from '../lib/site';
import { getGuideSorted, getPracticesSorted, getWeeklySorted } from '../lib/content';

// llms.txt — a curated, link-first index for agents (https://llmstxt.org).
// Points at the guide sections, the practices, and the machine endpoints.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const guide = await getGuideSorted();
  const practices = await getPracticesSorted();
  const weekly = await getWeeklySorted();

  const lines: string[] = [];
  lines.push('# Developer Marketing — a field guide');
  lines.push('');
  lines.push(
    '> The state of the art in developer marketing — positioning, docs-led growth, DevRel, developer experience, content, distribution, launches, and measurement. Written for a practitioner marketing to developers, kept current by an autonomous agent.'
  );
  lines.push('');
  lines.push(
    'For the full text in one file, see the /llms-full.txt link below. Structured data is at /practices.json, /guide.json, and /weekly.json.'
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

  if (weekly.length) {
    lines.push('');
    lines.push('## Weekly');
    for (const w of weekly.slice(0, 8)) {
      lines.push(`- [${w.data.title}](${abs(`/weekly/${w.id}`)}): ${w.data.summary}`);
    }
  }

  lines.push('');
  lines.push('## Machine endpoints');
  lines.push(`- [llms-full.txt](${abs('/llms-full.txt')}): the whole guide and practices as one markdown file`);
  lines.push(`- [practices.json](${abs('/practices.json')}): structured best-practices`);
  lines.push(`- [guide.json](${abs('/guide.json')}): guide sections with markdown bodies`);
  lines.push(`- [weekly.json](${abs('/weekly.json')}): recent weekly digests`);
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
