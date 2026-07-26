// Raw-markdown sibling of each newsroom article: /articles/<id>.md
import type { APIRoute } from 'astro';
import { getArticlesSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getArticlesSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('articles', props.entry));
