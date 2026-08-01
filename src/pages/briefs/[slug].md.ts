// Raw-markdown sibling of each brief: /briefs/<id>.md
// (Briefs render as anchors on the /briefs wire — the sibling's frontmatter
// carries that canonical.)
import type { APIRoute } from 'astro';
import { getBriefsSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getBriefsSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('briefs', props.entry));
