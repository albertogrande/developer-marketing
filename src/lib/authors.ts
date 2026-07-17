// The newsroom's bylines — display data for the five desks, mirroring
// AUTHORS.md (the editorial source of truth). Used by article pages (byline
// card) and the about page (the masthead). Keep in sync with AUTHORS.md.

import type { CollectionEntry } from 'astro:content';

type Desk = CollectionEntry<'articles'>['data']['desk'];

export const AUTHORS: Record<Desk, { name: string; title: string; line: string }> = {
  news: {
    name: 'Rio Vidal',
    title: 'The Correspondent',
    line: 'Devtools and DevRel industry news that changes a decision — confirmed facts separated from speculation, ending on what to watch next.',
  },
  money: {
    name: 'Mara Kessler',
    title: 'The Analyst',
    line: 'The money in devtools: funding, M&A, valuations, pricing. Opens from one hard number, builds a table, lands the thesis the numbers force.',
  },
  campaigns: {
    name: 'Nico Ferrant',
    title: 'The Critic',
    line: 'The campaign or launch that made noise, torn down honestly — the artifact linked, the mechanics reconstructed, a verdict on what to copy.',
  },
  research: {
    name: 'Ivy Osei',
    title: 'The Researcher',
    line: 'Survey waves, reports, benchmarks — read at the primary source, methodology checked, sample and sponsor always stated.',
  },
  technology: {
    name: 'Sam Arroyo',
    title: 'The Technologist',
    line: 'Technologies gaining traction in the dev stack, explained plainly, with adoption evidence and the marketing angle they open.',
  },
};
