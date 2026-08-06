// Raw-markdown sibling of each weekly issue: /issues/<id>.md
import type { APIRoute } from 'astro';
import { getIssuesSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getIssuesSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('issues', props.entry));
