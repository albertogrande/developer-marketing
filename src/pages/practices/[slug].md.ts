// Raw-markdown sibling of each practice: /practices/<id>.md
// (Practices render as anchors on the /practices gallery — the sibling's
// frontmatter carries that canonical.)
import type { APIRoute } from 'astro';
import { getPracticesSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getPracticesSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('practices', props.entry));
