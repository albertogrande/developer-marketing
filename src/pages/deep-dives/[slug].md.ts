// Raw-markdown sibling of each deep dive: /deep-dives/<id>.md
import type { APIRoute } from 'astro';
import { getDivesSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getDivesSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('deep-dives', props.entry));
