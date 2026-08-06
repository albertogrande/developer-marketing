// schema.org JSON-LD builders. Head.astro always emits the site-wide
// WebSite + Organization pair (and an auto breadcrumb); pages pass the nodes
// only they can build — an article with its author/citations, a collection
// page with its item list — via the `jsonLd` prop. Everything derives from
// existing frontmatter; URLs are absolute via absUrl.

import type { CollectionEntry } from 'astro:content';
import { absUrl, isoDate, CONTENT_LICENSE_URL } from './site';
import { AUTHORS } from './authors';
import { DESK_LABELS } from './content';

export const ORG_NAME = 'The Beat';
const WEBSITE_ID = () => `${absUrl('/')}#website`;
const ORG_ID = () => `${absUrl('/')}#org`;

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function websiteNode(description: string) {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID(),
    name: 'The Beat — a developer marketing field guide',
    description,
    url: absUrl('/'),
    inLanguage: 'en',
    publisher: { '@id': ORG_ID() },
  };
}

export function orgNode() {
  return {
    '@type': 'Organization',
    '@id': ORG_ID(),
    name: ORG_NAME,
    url: absUrl('/'),
    logo: { '@type': 'ImageObject', url: absUrl('/og-default.png') },
  };
}

type Desk = keyof typeof AUTHORS;

// The desk bylines, as schema Persons anchored to the masthead on /about.
// AUTHORS.md openly documents the agent-run masthead — no fabricated sameAs.
export function personNode(desk: Desk) {
  const a = AUTHORS[desk];
  return {
    '@type': 'Person',
    name: a.name,
    jobTitle: a.title,
    description: a.line,
    url: `${absUrl('/about')}#${slugify(a.name)}`,
    worksFor: { '@id': ORG_ID() },
  };
}

const citations = (sources: { label: string; url: string }[]) =>
  sources.slice(0, 10).map((s) => ({ '@type': 'CreativeWork', name: s.label, url: s.url }));

type ArticleOpts = {
  schemaType: 'Article' | 'NewsArticle' | 'TechArticle';
  title: string;
  description: string;
  url: string;
  published?: Date;
  updated?: Date;
  author?: object;
  section?: string;
  tags?: string[];
  sources?: { label: string; url: string }[];
};

export function articleNode(o: ArticleOpts) {
  return {
    '@type': o.schemaType,
    headline: o.title,
    description: o.description,
    url: o.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': o.url },
    image: absUrl('/og-default.png'),
    ...(o.published ? { datePublished: isoDate(o.published) } : {}),
    ...(o.updated ? { dateModified: isoDate(o.updated) } : {}),
    author: o.author ?? { '@id': ORG_ID() },
    publisher: { '@id': ORG_ID() },
    isPartOf: { '@id': WEBSITE_ID() },
    license: CONTENT_LICENSE_URL,
    inLanguage: 'en',
    ...(o.section ? { articleSection: o.section } : {}),
    ...(o.tags?.length ? { keywords: o.tags.join(', ') } : {}),
    ...(o.sources?.length ? { citation: citations(o.sources) } : {}),
  };
}

// Article node for a newsroom piece, from its entry alone.
export function newsArticleNode(entry: CollectionEntry<'articles'>) {
  const d = entry.data;
  return articleNode({
    schemaType: 'NewsArticle',
    title: d.title,
    description: d.summary,
    url: absUrl(`/articles/${entry.id}`),
    published: d.date,
    updated: d.updated,
    author: personNode(d.desk),
    section: DESK_LABELS[d.desk],
    tags: d.tags,
    sources: d.sources,
  });
}

export type ListedItem = { name: string; url: string };

export function collectionPageNode(o: {
  name: string;
  description: string;
  url: string;
  // Plain name/url items — or full nodes (e.g. SoftwareApplication) via
  // itemNodes, which wins when both are given.
  items?: ListedItem[];
  itemNodes?: object[];
  updated?: Date;
}) {
  const elements = o.itemNodes
    ? o.itemNodes.map((n, i) => ({ '@type': 'ListItem', position: i + 1, item: n }))
    : (o.items ?? []).map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: it.name,
        url: it.url,
      }));
  return {
    '@type': 'CollectionPage',
    name: o.name,
    description: o.description,
    url: o.url,
    isPartOf: { '@id': WEBSITE_ID() },
    inLanguage: 'en',
    license: CONTENT_LICENSE_URL,
    ...(o.updated ? { dateModified: isoDate(o.updated) } : {}),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: elements.length,
      itemListElement: elements,
    },
  };
}

// A shelf skill as an installable application, anchored to its gallery card.
export function softwareAppNode(entry: CollectionEntry<'skills'>) {
  const d = entry.data;
  return {
    '@type': 'SoftwareApplication',
    name: d.name,
    description: d.summary,
    url: `${absUrl('/skills')}#${entry.id}`,
    installUrl: d.source.url,
    applicationCategory: 'DeveloperApplication',
    author: { '@type': 'Organization', name: d.author },
    ...(d.license ? { license: d.license } : {}),
  };
}
