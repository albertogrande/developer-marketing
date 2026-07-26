import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getSkillsSorted } from '../lib/content';

// Machine-readable shelf for agent consumption — an agent asked to "audit our
// docs" or "write the changelog" can find the tool that already does it.
// Deterministic: `updated` is the newest verification date, not build time.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const skills = await getSkillsSorted();

  const items = skills.map((s) => ({
    id: s.id,
    title: s.data.title,
    name: s.data.name,
    author: s.data.author,
    repo: s.data.repo,
    summary: s.data.summary,
    job: s.data.job,
    agents: s.data.agents,
    install: s.data.install.trimEnd(),
    license: s.data.license,
    // The honest limit travels with the recommendation, not just the pitch.
    caveat: s.data.caveat,
    disclosure: s.data.disclosure,
    // The editorial note — why it's on the shelf and when to reach for it.
    note: (s.body ?? '').trim() || undefined,
    section: s.data.section,
    section_url: abs(`/guide/${s.data.section}`),
    tags: s.data.tags,
    source: s.data.source,
    sources: s.data.sources,
    added: isoDate(s.data.date),
    verified: isoDate(s.data.verified),
  }));

  const updated = items.reduce((m, s) => (s.verified > m ? s.verified : m), '1970-01-01');

  const body = JSON.stringify(
    { title: 'Developer Marketing field guide — skills', updated, count: items.length, skills: items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
