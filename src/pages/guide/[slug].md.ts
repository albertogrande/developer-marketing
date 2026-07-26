// Raw-markdown sibling of each guide section: /guide/<id>.md
import type { APIRoute } from 'astro';
import { getGuideSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getGuideSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('guide', props.entry));
