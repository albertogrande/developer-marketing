import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getGuideSorted, getPracticesSorted } from '../lib/content';

// llms-full.txt — the entire guide plus the practices, concatenated as plain
// markdown, so an agent can pull the whole corpus in one fetch.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const guide = await getGuideSorted();
  const practices = await getPracticesSorted();

  const out: string[] = [];
  out.push('# Developer Marketing — a field guide (full text)');
  out.push('');
  out.push(
    'Written for a practitioner marketing to developers. Source: ' + abs('/') + '.'
  );

  out.push('');
  out.push('---');
  out.push('');
  out.push('# The guide');
  for (const g of guide) {
    out.push('');
    out.push(`## ${g.data.title}`);
    out.push(`*Section ${String(g.data.order).padStart(2, '0')} · updated ${isoDate(g.data.updated)} · ${abs(`/guide/${g.id}`)}*`);
    out.push('');
    out.push((g.body ?? '').trim());
  }

  out.push('');
  out.push('---');
  out.push('');
  out.push('# Practices');
  out.push('');
  out.push('Atomic best-practices — when to do what, and why.');
  for (const p of practices) {
    out.push('');
    out.push(`## ${p.data.title}`);
    out.push(`- **When:** ${p.data.when}`);
    out.push(`- **Do:** ${p.data.do}`);
    out.push(`- **Why:** ${p.data.why}`);
    out.push(`- **Section:** ${abs(`/guide/${p.data.section}`)}`);
    if (p.data.sources.length) {
      out.push(`- **Sources:** ${p.data.sources.map((s) => `${s.label} (${s.url})`).join('; ')}`);
    }
  }
  out.push('');

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
