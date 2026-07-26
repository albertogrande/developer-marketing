// Raw-markdown sibling of each archived radar entry: /radar/<id>.md
import type { APIRoute } from 'astro';
import { getRadarSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getRadarSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('radar', props.entry));
