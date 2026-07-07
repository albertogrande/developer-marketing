import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Two collections, both frontmatter-driven so the radar agent can write them
// deterministically.
//
//  radar/  — dated updates. One file per entry: YYYY-MM-DD-slug.md
//  guide/  — the evergreen reference. One file per section: NN-slug.md
//
// The entry id is the filename without extension, which becomes the URL slug.

const radar = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/radar' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // What kind of item this is — drives the category chip.
    kind: z
      .enum(['news', 'release', 'workflow', 'discussion', 'tip', 'note'])
      .default('news'),
    summary: z.string(),
    // The editorial point of view — rendered as a "The take" callout.
    take: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // Cross-links to guide sections or other radar posts. `href` is a
    // base-less site path (e.g. "/guide/01-models-and-effort" or
    // "/radar/2026-07-04-...") or a full external URL.
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    // Where to check the original — tweets, changelog entries, blog posts.
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

const guide = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
    updated: z.coerce.date(),
  }),
});

// deepDives/ — long-form, researched articles. One file per piece:
// YYYY-MM-DD-slug.md. Like radar entries they are dated and sourced, but they
// are standalone deep dives rather than one-item updates.
const deepDives = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/deep-dives' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // Optional revision stamp for when a dive is refreshed after publication.
    updated: z.coerce.date().optional(),
    summary: z.string(),
    // A longer standfirst rendered under the title.
    dek: z.string().optional(),
    tags: z.array(z.string()).default([]),
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

export const collections = { radar, guide, 'deep-dives': deepDives };
