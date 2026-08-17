// Raw-markdown sibling of each thread: /threads/<id>.md
//
// Unlike the other siblings this one splices in a derived section. A thread's
// evidence lives in its member signals and issues, so a sibling carrying only
// the body would hand an agent an argument with no record behind it.
import type { APIRoute } from 'astro';
import { getThreadsSorted, getThreadGraph } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';
import { absUrl, isoDate } from '../../lib/site';

export async function getStaticPaths() {
  const [threads, graph] = await Promise.all([getThreadsSorted(), getThreadGraph()]);
  return threads.map((entry) => ({
    params: { slug: entry.id },
    props: { entry, members: graph.membersByThread.get(entry.id) ?? [] },
  }));
}

export const GET: APIRoute = ({ props }) => {
  const { entry, members } = props;
  const timeline = members.length
    ? [
        '## On the record',
        '',
        `${members.length} dated entr${members.length === 1 ? 'y' : 'ies'} filed onto this thread, newest first.`,
        '',
        members
          .map(
            (m: { date: Date; company?: string; title: string; href: string; summary: string }) =>
              `- **${isoDate(m.date)}** — ${m.company ? `${m.company}: ` : ''}[${m.title}](${absUrl(m.href)}): ${m.summary}`
          )
          .join('\n'),
      ].join('\n')
    : undefined;

  return mdResponse(mdDoc('threads', entry, timeline ? [timeline] : []));
};
