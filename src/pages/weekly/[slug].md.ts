// Raw-markdown sibling of each weekly digest: /weekly/<id>.md
import type { APIRoute } from 'astro';
import { getWeeklySorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getWeeklySorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('weekly', props.entry));
