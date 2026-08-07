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
  getSignalsSorted,
  RESOURCE_CATEGORY_LABELS,
} from '../lib/content';

// llms-full.txt — the corpus in one fetch, bounded so it never grows without
// limit: the evergreen product (guide, claims, examples, skills) always in
// full; the dated strands in full for roughly the freshness window answer
// engines actually cite (issues 8, archived articles 12, dives 4) and as
// dated links to their .md siblings beyond it; the radar archive links-only.

// Signals items are the exception to the "recent in full, older as links"
// treatment: each is already two sentences, so the recent window carries them
// inline and older ones are left to /signals.json and llms.txt rather than
// link-listed here — the signals grows faster than any other strand and would
// crowd out the corpus this file exists to serve.
const RECENT = { issues: 8, articles: 12, dives: 4, signals: 30 };

export const GET: APIRoute = async () => {
  const abs = absUrl;

  const guide = await getGuideSorted();
  const claims = await getClaimsSorted();
  const examples = await getExamplesSorted();
  const skills = await getSkillsSorted();
  const issues = await getIssuesSorted();
  const articles = await getArticlesSorted();
  const dives = await getDivesSorted();
  const radar = await getRadarSorted();
  const resources = await getResourcesSorted();
  const signals = await getSignalsSorted();

  const out: string[] = [];
  out.push('# The Beat — developer marketing, on the record (full text)');
  out.push('');
  out.push(
    'Written for a practitioner marketing to developers. Source: ' +
      abs('/') +
      '. Index: ' +
      abs('/llms.txt') +
      '. Manifest: ' +
      abs('/api.json') +
      '. License: CC BY 4.0 — quote it, link the canonical page.'
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
  out.push('# Claims');
  out.push('');
  out.push('The reference, atomized — when to do what, and why. Each claim carries a freshness status.');
  for (const p of claims) {
    out.push('');
    out.push(`## ${p.data.title}`);
    out.push(`- **When:** ${p.data.when}`);
    out.push(`- **Do:** ${p.data.do}`);
    out.push(`- **Why:** ${p.data.why}`);
    out.push(`- **Status:** ${p.data.status} (checked ${isoDate(p.data.checked)})`);
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
    out.push('Real, sourced dev-marketing artifacts — the evidence behind the claims.');
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

  if (resources.length) {
    out.push('');
    out.push('---');
    out.push('');
    out.push('# Resources — who to hire');
    out.push('');
    out.push(
      'Vetted providers of developer-marketing services. No paid placements. Proof points are quoted from each provider’s own site and are self-reported unless stated otherwise; `checked` is when the page was last read.'
    );
    for (const r of resources) {
      out.push('');
      out.push(`## ${r.data.name}`);
      out.push(`- **What:** ${r.data.kind}, ${RESOURCE_CATEGORY_LABELS[r.data.category]} (${r.data.services.join(', ')})`);
      out.push(`- **Focus:** ${r.data.focus === 'devtools' ? 'devtools' : 'technical B2B'}${r.data.based ? ` · ${r.data.based}` : ''}`);
      out.push(`- **Signal:** ${r.data.signal}`);
      if (r.data.pricing) out.push(`- **Pricing:** ${r.data.pricing}`);
      if (r.data.caveat) out.push(`- **Caveat:** ${r.data.caveat}`);
      out.push(`- **Site:** ${r.data.url} · checked ${isoDate(r.data.checked)}`);
      const note = (r.body ?? '').trim();
      if (note) {
        out.push('');
        out.push(note);
      }
    }
  }

  // Dated strands: recent in full, the rest one dated link line each.
  type Dated = {
    id: string;
    body?: string;
    data: { title: string; summary: string; date: Date; updated?: Date };
  };
  const datedSection = (
    heading: string,
    intro: string,
    entries: Dated[],
    pathOf: (id: string) => string,
    fullCount: number
  ) => {
    if (!entries.length) return;
    out.push('');
    out.push('---');
    out.push('');
    out.push(`# ${heading}`);
    out.push('');
    out.push(intro);
    for (const e of entries.slice(0, fullCount)) {
      out.push('');
      out.push(`## ${e.data.title}`);
      out.push(
        `*${isoDate(e.data.date)}${e.data.updated ? ` · updated ${isoDate(e.data.updated)}` : ''} · ${abs(pathOf(e.id))}*`
      );
      out.push('');
      out.push(`> ${e.data.summary}`);
      out.push('');
      out.push((e.body ?? '').trim());
    }
    const older = entries.slice(fullCount);
    if (older.length) {
      out.push('');
      out.push(`Older (${older.length}, full text at the link):`);
      for (const e of older) {
        out.push(`- ${isoDate(e.data.date)} — [${e.data.title}](${abs(`${pathOf(e.id)}.md`)})`);
      }
    }
  };

  datedSection(
    'The Beat',
    'One issue per ISO week of what actually changed; occasionally a long special where a thread earned depth.',
    issues,
    (id) => `/issues/${id}`,
    RECENT.issues
  );
  if (signals.length) {
    out.push('');
    out.push('---');
    out.push('');
    out.push('# Signals');
    out.push('');
    out.push(
      `The event log — short dated items, newest first (most recent ${Math.min(signals.length, RECENT.signals)} of ${signals.length}). Full set: ${abs('/signals.json')}.`
    );
    for (const b of signals.slice(0, RECENT.signals)) {
      out.push('');
      out.push(`## ${b.data.company}: ${b.data.title}`);
      out.push(
        `*${isoDate(b.data.date)}${b.data.updated ? ` · updated ${isoDate(b.data.updated)}` : ''} · ${b.data.kind} · ${abs(`/signals`)}#${b.id}*`
      );
      out.push('');
      out.push(b.data.summary);
      out.push(`- **Source:** ${b.data.source.label} (${b.data.source.url})`);
      const note = (b.body ?? '').trim();
      if (note) {
        out.push('');
        out.push(note);
      }
    }
  }

  datedSection(
    'Newsroom archive',
    'Dated desk articles from the daily tier (2026-07 → 2026-08); no new entries — analysis now ships in the weekly issue.',
    articles,
    (id) => `/articles/${id}`,
    RECENT.articles
  );
  datedSection(
    'Deep dives archive',
    'Long-form researched pieces; no new entries — depth now ships as a long special issue.',
    dives,
    (id) => `/deep-dives/${id}`,
    RECENT.dives
  );

  if (radar.length) {
    out.push('');
    out.push('---');
    out.push('');
    out.push('# Radar archive');
    out.push('');
    out.push("Dated posts from the site's first phase (frozen) — full text at the links:");
    for (const r of radar) {
      out.push(`- ${isoDate(r.data.date)} — [${r.data.title}](${abs(`/radar/${r.id}.md`)})`);
    }
  }
  out.push('');

  return new Response(out.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
