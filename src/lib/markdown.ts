// The markdown-for-agents layer: every content entry serves a raw
// /<collection>/<id>.md sibling next to its HTML (announced via
// <link rel="alternate" type="text/markdown">), and the feeds render bodies
// to HTML with the same converter. Each sibling is self-contained — an agent
// that fetches nothing else still gets the canonical URL, dates, license,
// sources, and related links.

import { Marked } from 'marked';
import { stringify as yamlStringify } from 'yaml';
import type { CollectionEntry } from 'astro:content';
import { absUrl, isoDate, CONTENT_LICENSE_URL } from './site';
import { DESK_LABELS } from './content';

const marked = new Marked({ gfm: true });

// Markdown → HTML for feed <content> payloads (desk bodies use GFM tables).
export function mdToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

const SITE_NAME = 'Developer Marketing — a field guide';

type Kind =
  | 'guide'
  | 'articles'
  | 'issues'
  | 'deep-dives'
  | 'wire'
  | 'radar'
  | 'claims'
  | 'examples'
  | 'skills'
  | 'resources';

type AnyEntry =
  | CollectionEntry<'guide'>
  | CollectionEntry<'articles'>
  | CollectionEntry<'issues'>
  | CollectionEntry<'deep-dives'>
  | CollectionEntry<'wire'>
  | CollectionEntry<'radar'>
  | CollectionEntry<'claims'>
  | CollectionEntry<'examples'>
  | CollectionEntry<'skills'>
  | CollectionEntry<'resources'>;

// Collections whose entries render as #anchors on a gallery page rather than
// standalone pages — their canonical is the anchor.
const GALLERY: Partial<Record<Kind, true>> = {
  claims: true,
  examples: true,
  skills: true,
  resources: true,
  wire: true,
};

const linkList = (items: { label: string; url: string }[]) =>
  items.map((s) => `- [${s.label}](${s.url})`).join('\n');

// related[].href is a base-less site path or an external URL.
const relatedUrl = (href: string) => (/^https?:\/\//.test(href) ? href : absUrl(href));

export function mdDoc(kind: Kind, entry: AnyEntry): string {
  const d = entry.data as Record<string, any>;
  const canonical = GALLERY[kind] ? `${absUrl(`/${kind}`)}#${entry.id}` : absUrl(`/${kind}/${entry.id}`);

  const fm: Record<string, unknown> = { title: d.title ?? d.name, canonical };
  if (d.date) fm.published = isoDate(d.date);
  if (d.updated) fm.updated = isoDate(d.updated);
  if (kind === 'guide') fm.updated = isoDate(d.updated); // guide has no publish date
  if (kind === 'articles') {
    fm.desk = DESK_LABELS[d.desk as keyof typeof DESK_LABELS];
    fm.byline = d.byline;
  }
  if (kind === 'issues') fm.week = d.week;
  if (kind === 'radar') fm.kind = d.kind;
  if (kind === 'skills') {
    fm.skill = d.name;
    fm.author = d.author;
    fm.repo = d.repo;
    if (d.verified) fm.verified = isoDate(d.verified);
  }
  if (kind === 'examples') fm.company = d.company;
  if (kind === 'wire') {
    fm.company = d.company;
    fm.kind = d.kind;
  }
  if (kind === 'claims') {
    fm.status = d.status;
    fm.checked = isoDate(d.checked);
  }
  if (kind === 'resources') {
    fm.provider_url = d.url;
    fm.kind = d.kind;
    fm.checked = isoDate(d.checked);
  }
  if (d.tags?.length) fm.tags = d.tags;
  fm.collection = kind;
  fm.site = absUrl('/');
  fm.license = CONTENT_LICENSE_URL;

  const parts: string[] = [`---\n${yamlStringify(fm).trimEnd()}\n---`, '', `# ${d.title ?? d.name}`, ''];
  if (GALLERY[kind]) {
    parts.push(`> Canonical: ${canonical} — this entry renders on the ${kind} gallery page, not standalone.`, '');
  }
  if (d.summary) parts.push(`> ${d.summary}`, '');
  if (d.dek) parts.push(d.dek, '');

  // The structured core of the gallery collections lives in frontmatter
  // fields, not the body — synthesize it so the .md is the whole entry.
  if (kind === 'claims') {
    parts.push(`- **When**: ${d.when}`, `- **Do**: ${d.do}`, `- **Why**: ${d.why}`);
    if (d.since) parts.push(`- **Since**: ${d.since}`);
    if (d.verify) parts.push(`- **Verify**: ${d.verify}`);
    if (d.probe) parts.push(`- **Probe**: bare-model answer ${d.probe.status} (${isoDate(d.probe.date)})`);
    parts.push(`- **Status**: ${d.status} (checked ${isoDate(d.checked)})`);
    parts.push('');
  }
  if (kind === 'examples') {
    parts.push(
      `- **Company**: ${d.company}`,
      `- **Artifact**: ${d.artifact}`,
      ...(d.channel?.length ? [`- **Channels**: ${d.channel.join(', ')}`] : []),
      `- **Demonstrates**: ${absUrl(`/guide/${d.demonstrates}`)}`,
      `- **The artifact**: [${d.source.label}](${d.source.url})`,
      ''
    );
  }
  if (kind === 'wire') {
    parts.push(
      `- **Company**: ${d.company}`,
      `- **Kind**: ${d.kind}`,
      `- **Source**: [${d.source.label}](${d.source.url})`,
      ''
    );
  }
  if (kind === 'skills') {
    parts.push(
      `- **Skill**: \`${d.name}\` by ${d.author} ([${d.repo}](${d.source.url}))`,
      `- **Job**: ${d.job}`,
      ...(d.agents?.length ? [`- **Agents**: ${d.agents.join(', ')}`] : []),
      ...(d.license ? [`- **License**: ${d.license}`] : []),
      `- **Verified**: ${isoDate(d.verified)} (repo alive, install line current)`,
      '',
      '**Install** (verbatim from the publisher):',
      '',
      '```',
      String(d.install).trimEnd(),
      '```',
      '',
      `**Caveat**: ${d.caveat}`,
      ...(d.disclosure ? ['', `**Disclosure**: ${d.disclosure}`] : []),
      ''
    );
  }

  if (kind === 'resources') {
    parts.push(
      `- **What**: ${d.kind}${d.services?.length ? ` (${d.services.join(', ')})` : ''}`,
      `- **Focus**: ${d.focus === 'devtools' ? 'devtools' : 'technical B2B'}${d.based ? ` · ${d.based}` : ''}`,
      `- **Signal**: ${d.signal}`,
      ...(d.pricing ? [`- **Pricing**: ${d.pricing}`] : []),
      ...(d.caveat ? [`- **Caveat**: ${d.caveat}`] : []),
      `- **Site**: ${d.url} · checked ${isoDate(d.checked)}`,
      ''
    );
  }

  const body = (entry.body ?? '').trim();
  if (body) parts.push(body, '');

  if (d.take) parts.push(`**The take**: ${d.take}`, '');

  if (d.sources?.length) parts.push('## Sources', '', linkList(d.sources), '');
  if (d.related?.length) {
    parts.push(
      '## Related',
      '',
      d.related.map((r: { label: string; href: string }) => `- [${r.label}](${relatedUrl(r.href)})`).join('\n'),
      ''
    );
  }

  parts.push('---', '', `Part of [${SITE_NAME}](${absUrl('/')}). Content license: CC BY 4.0 — quote it, link the canonical page.`);
  return parts.join('\n') + '\n';
}

export const mdResponse = (text: string) =>
  new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
