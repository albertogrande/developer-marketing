// The thread inversion, as a pure function.
//
// Membership runs from the members inward: a signal or an issue declares
// `threads: [slug]`, and nothing on the thread file names its members. That
// keeps a thread's timeline growing without the thread being edited — the
// scout tags a signal, the next build picks it up — but it means somebody has
// to turn N member records into one map per thread. This is that somebody.
//
// Pure and dependency-free (no `astro:content`) for the reason src/lib/dates.mjs
// and src/lib/url-core.mjs are: `node --test` can then pin the behaviour that
// actually has edge cases — the issue date choice, the two-thread member, the
// unknown slug — without booting a content layer.

// A member's contribution to a timeline. `company` is present for signals only.
/**
 * @typedef {{ kind: 'signal' | 'issue', id: string, title: string,
 *             company?: string, summary: string, href: string, date: Date }} ThreadMember
 */

/**
 * Invert thread membership.
 *
 * @param {{ threads: {id: string, data: any}[],
 *           signals: {id: string, data: any}[],
 *           issues:  {id: string, data: any}[] }} input
 * @returns {{ membersByThread: Map<string, ThreadMember[]>,
 *             threadsBySection: Map<string, {id: string, data: any}[]>,
 *             threadsByMember: Map<string, {id: string, data: any}[]> }}
 */
export function buildThreadGraph({ threads = [], signals = [], issues = [] }) {
  const byId = new Map(threads.map((t) => [t.id, t]));

  /** @type {Map<string, ThreadMember[]>} */
  const membersByThread = new Map();
  /** @type {Map<string, {id: string, data: any}[]>} */
  const threadsByMember = new Map();

  const attach = (collection, entry, member) => {
    for (const slug of entry.data.threads ?? []) {
      const thread = byId.get(slug);
      // An unknown slug is dropped, never thrown. check-refs is what fails on
      // it, loudly and by filename; throwing here would turn a one-character
      // content typo into an unrecoverable build with a stack trace instead.
      if (!thread) continue;
      if (!membersByThread.has(slug)) membersByThread.set(slug, []);
      membersByThread.get(slug).push(member);

      const key = `${collection}:${entry.id}`;
      if (!threadsByMember.has(key)) threadsByMember.set(key, []);
      threadsByMember.get(key).push(thread);
    }
  };

  for (const s of signals) {
    attach('signals', s, {
      kind: 'signal',
      id: s.id,
      title: s.data.title,
      company: s.data.company,
      summary: s.data.summary,
      // Signals have no page of their own — the whole feed renders at /signals,
      // so the citable form is the anchor.
      href: `/signals#${s.id}`,
      date: s.data.date,
    });
  }

  for (const w of issues) {
    attach('issues', w, {
      kind: 'issue',
      id: w.id,
      title: w.data.title,
      summary: w.data.summary,
      href: `/issues/${w.id}`,
      // `published`, not `date`: an issue's `date` is the Monday it COVERS and
      // is a week behind by construction, which would file it in the timeline
      // before signals it actually postdates. getGuideGraph makes the same call.
      date: w.data.published,
    });
  }

  for (const members of membersByThread.values()) {
    members.sort((a, b) => b.date.getTime() - a.date.getTime() || b.id.localeCompare(a.id));
  }

  /** @type {Map<string, {id: string, data: any}[]>} */
  const threadsBySection = new Map();
  for (const t of threads) {
    for (const section of t.data.sections ?? []) {
      if (!threadsBySection.has(section)) threadsBySection.set(section, []);
      threadsBySection.get(section).push(t);
    }
  }

  return { membersByThread, threadsBySection, threadsByMember };
}

// Status → sort rank. Live threads lead; the rest stay published (their URLs
// have to keep resolving, same rule as retired claims) and sink.
export const THREAD_STATUS_RANK = { open: 0, dormant: 1, resolved: 2 };

/**
 * Live first, then most recently worked. Deliberately NOT date-descending:
 * `started` is when the thread opened, and the ordering claim this page makes
 * is "what is being worked on", not "what is newest".
 */
export const threadByStanding = (a, b) =>
  THREAD_STATUS_RANK[a.data.status] - THREAD_STATUS_RANK[b.data.status] ||
  b.data.updated.getTime() - a.data.updated.getTime() ||
  a.id.localeCompare(b.id);
