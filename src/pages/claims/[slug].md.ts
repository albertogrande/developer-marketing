// Raw-markdown sibling of each claim: /claims/<id>.md
// (Claims render as anchors on the /claims gallery — the sibling's
// frontmatter carries that canonical.)
import type { APIRoute } from 'astro';
import { getClaimsSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getClaimsSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('claims', props.entry));
