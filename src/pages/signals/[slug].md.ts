// Raw-markdown sibling of each signal: /signals/<id>.md
// (Items render as anchors on the /signals stream — the sibling's frontmatter
// carries that canonical.)
import type { APIRoute } from 'astro';
import { getSignalsSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getSignalsSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('signals', props.entry));
