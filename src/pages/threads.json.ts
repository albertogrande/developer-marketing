import type { APIRoute } from 'astro';
import { withBase, isoDate } from '../lib/site';
import { getThreadsSorted, getThreadGraph } from '../lib/content';

// Machine-readable threads for agent consumption — the site's link graph made
// legible in one fetch: which questions are open, what evidence is filed onto
// each, and what would settle it.
// Deterministic: `updated` is the newest thread's own stamp, not build time.

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const abs = (p: string) => new URL(withBase(p), site).href;

  const [threads, graph] = await Promise.all([getThreadsSorted(), getThreadGraph()]);

  const items = threads.map((t) => {
    const members = graph.membersByThread.get(t.id) ?? [];
    return {
      id: t.id,
      title: t.data.title,
      // The open question — the thread's whole reason to exist.
      question: t.data.question,
      summary: t.data.summary,
      status: t.data.status,
      momentum: t.data.momentum,
      // The running argument.
      body: (t.body ?? '').trim() || undefined,
      opened: isoDate(t.data.started),
      updated: isoDate(t.data.updated),
      sections: t.data.sections.map((s) => abs(`/guide/${s}`)),
      open_loops: t.data.openLoops.map((l) => ({ question: l.question, by: l.by })),
      tags: t.data.tags,
      sources: t.data.sources,
      url: abs(`/threads/${t.id}`),
      markdown_url: abs(`/threads/${t.id}.md`),
      // Uncapped on purpose: the membership edge is what makes the rest of the
      // site navigable to an agent, and truncating it would silently hide
      // evidence rather than merely shorten a payload.
      members: members.map((m) => ({
        kind: m.kind,
        title: m.title,
        company: m.company,
        summary: m.summary,
        url: abs(m.href),
        date: isoDate(m.date),
      })),
    };
  });

  const updated = items.reduce((m, t) => (t.updated > m ? t.updated : m), '1970-01-01');

  const body = JSON.stringify(
    { title: 'The Beat — the threads', updated, count: items.length, threads: items },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
