// Raw-markdown sibling of each wire item: /wire/<id>.md
// (Items render as anchors on the /wire stream — the sibling's frontmatter
// carries that canonical.)
import type { APIRoute } from 'astro';
import { getWireSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getWireSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('wire', props.entry));
