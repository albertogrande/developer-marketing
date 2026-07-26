// Raw-markdown sibling of each shelf skill: /skills/<id>.md
// (Skills render as anchors on the /skills gallery — the sibling's
// frontmatter carries that canonical.)
import type { APIRoute } from 'astro';
import { getSkillsSorted } from '../../lib/content';
import { mdDoc, mdResponse } from '../../lib/markdown';

export async function getStaticPaths() {
  return (await getSkillsSorted()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export const GET: APIRoute = ({ props }) => mdResponse(mdDoc('skills', props.entry));
