import type { APIRoute } from 'astro';
import { absUrl } from '../lib/site';
import jobs from '../../signals/jobs/jobs.json';

// Machine-readable jobs board. Deterministic: `updated` is the newest
// lastSeenAt in the data, never the build clock. Every job here is open —
// the merge drops dead postings instead of flagging them.

type Job = {
  id: string;
  lastSeenAt: string;
  [k: string]: unknown;
};

export const GET: APIRoute = async () => {
  const all = jobs as Job[];
  const updated = all.reduce((m, j) => (j.lastSeenAt > m ? j.lastSeenAt : m), '');

  const body = JSON.stringify(
    {
      title: 'The Beat — jobs',
      description:
        'Open, fully-remote marketing-leadership, growth and product-marketing roles at developer-focused and AI companies. Region says where "remote" applies: worldwide, eu, usa, other.',
      url: absUrl('/jobs'),
      updated: updated || undefined,
      count: all.length,
      jobs: all,
    },
    null,
    2
  );

  return new Response(body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
