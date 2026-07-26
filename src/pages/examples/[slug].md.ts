// Raw-markdown sibling of each example: /examples/<id>.md
// (Examples render as anchors on the /examples gallery — the sibling's
// frontmatter carries that canonical.)
import type { APIRoute } from 'astro';
import { getExamplesSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getExamplesSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('examples', props.entry));
