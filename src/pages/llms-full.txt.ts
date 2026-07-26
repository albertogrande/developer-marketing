import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getExamplesSorted, getGuideSorted, getPracticesSorted, getSkillsSorted } from '../lib/content';

// llms-full.txt — the entire guide plus the practices, concatenated as plain
// markdown, so an agent can pull the whole corpus in one fetch.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const guide = await getGuideSorted();
  const practices = await getPracticesSorted();
  const examples = await getExamplesSorted();
  const skills = await getSkillsSorted();

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

  if (examples.length) {
    out.push('');
    out.push('---');
    out.push('');
    out.push('# Examples');
    out.push('');
    out.push('Real, sourced dev-marketing artifacts — the evidence behind the practices.');
    for (const e of examples) {
      out.push('');
      out.push(`## ${e.data.company}: ${e.data.title}`);
      out.push(`- **Why it works:** ${e.data.summary}`);
      out.push(`- **Artifact:** ${e.data.artifact}`);
      out.push(`- **Demonstrates:** ${abs(`/guide/${e.data.demonstrates}`)}`);
      out.push(`- **See it:** ${e.data.source.label} (${e.data.source.url})`);
      const note = (e.body ?? '').trim();
      if (note) {
        out.push('');
        out.push(note);
      }
    }
  }

  if (skills.length) {
    out.push('');
    out.push('---');
    out.push('');
    out.push('# Skills');
    out.push('');
    out.push(
      'Installable agent skills that do this work. The caveat is part of the recommendation.'
    );
    for (const s of skills) {
      out.push('');
      out.push(`## ${s.data.name} — ${s.data.title}`);
      out.push(`- **Does:** ${s.data.summary}`);
      out.push(`- **Publisher:** ${s.data.author} (${s.data.repo})`);
      out.push(`- **Install:** ${s.data.install.trim().replace(/\n+/g, ' && ')}`);
      out.push(`- **Runs in:** ${s.data.agents.join(', ') || 'unspecified'}`);
      out.push(`- **Caveat:** ${s.data.caveat}`);
      if (s.data.disclosure) out.push(`- **Disclosure:** ${s.data.disclosure}`);
      out.push(`- **Does the work of:** ${abs(`/guide/${s.data.section}`)}`);
      out.push(`- **Source:** ${s.data.source.label} (${s.data.source.url})`);
      out.push(`- **Verified:** ${isoDate(s.data.verified)}`);
      const note = (s.body ?? '').trim();
      if (note) {
        out.push('');
        out.push(note);
      }
    }
  }
  out.push('');

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
