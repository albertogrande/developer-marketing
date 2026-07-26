// Raw-markdown sibling of each directory resource: /resources/<id>.md
// (Resources render as anchors on the /resources gallery — the sibling's
// frontmatter carries that canonical.)
import type { APIRoute } from 'astro';
import { getResourcesSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getResourcesSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('resources', props.entry));
