import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Five collections, all frontmatter-driven so the editorial agents can write
// them deterministically.
//
//  guide/    — the evergreen reference. One file per section: NN-slug.md.
//              This is the product: kept continuously current.
//  weekly/   — the weekly digest ("The Week"). One file per ISO week:
//              YYYY-Www.md. A short "what changed" read to stay current.
//  practices/ — atomic best-practices for agent consumption; rendered for
//              humans at /practices and served to machines via
//              /practices.json and llms.txt.
//  deep-dives/ — long-form researched pieces, commissioned when a thread
//              earns it. One file per piece: YYYY-MM-DD-slug.md.
//  examples/ — the swipe file. Real, sourced dev-marketing artifacts (a
//              pricing page, an API reference, a launch), each with a "why it
//              works" note, the guide section it demonstrates, and a link to
//              the real thing. Evidence for the guide's judgment; browsed as a
//              gallery at /examples and served to machines at /examples.json.
//  resources/ — the directory. Vetted outside help for developer marketing:
//              agencies, studios, collectives, independents. Each entry is a
//              real provider with a live site, one verifiable proof point, and
//              the date we last checked it. Rendered at /resources, served to
//              machines at /resources.json.
//  radar/    — ARCHIVE. The dated daily posts from the site's first phase
//              (2026-07-05 → 2026-07-08), kept rendered so URLs don't break.
//              No new entries: daily capture now goes to signals/ (internal)
//              and the published cadence is the weekly.
//
// Raw daily capture lives in `signals/` (repo root, internal) and editorial
// memory in `editorial/` — neither is rendered; they feed the collections
// above. See .claude/skills/ for the playbooks.
//
// The entry id is the filename without extension, which becomes the URL slug.

const guide = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guide' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    summary: z.string(),
    updated: z.coerce.date(),
  }),
});

const weekly = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/weekly' }),
  schema: z.object({
    title: z.string(),
    // ISO week id, e.g. "2026-W28" — also the filename/slug.
    week: z.string(),
    // Publish date (the week's Monday), drives ordering and the feed.
    date: z.coerce.date(),
    summary: z.string(),
    // Optional revision stamp when a digest is corrected after publication.
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // Cross-links to guide sections or deep dives. `href` is a base-less site
    // path (e.g. "/guide/02-docs-as-front-door") or a full external URL.
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    // Where to check the week's claims — reports, posts, threads.
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

// practices/ — atomic, retrievable best-practices for agent consumption (and a
// human-readable page). Each is a "when X → do Y (because Z)" unit tied to a
// guide section. Surfaced to agents via /practices.json and /llms.txt.
const practices = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/practices' }),
  schema: z.object({
    // Short imperative name, e.g. "Report DevRel as influenced pipeline".
    title: z.string(),
    // The trigger condition — when this applies.
    when: z.string(),
    // The action to take.
    do: z.string(),
    // Why it works / the rationale.
    why: z.string(),
    // The guide section id this belongs to, e.g. "08-measurement-and-metrics".
    section: z.string(),
    // Controlled vocabulary — agents filter by tag, so drift would silently
    // break the filter. Extend the enum deliberately, not ad hoc.
    tags: z
      .array(
        z.enum([
          'positioning',
          'content',
          'docs',
          'devrel',
          'community',
          'dx',
          'activation',
          'distribution',
          'channels',
          'metrics',
          'launches',
          'pricing',
          'plg',
          'org',
        ])
      )
      .default([]),
    // The dated fact that made this true (a survey wave, a report, a shift —
    // e.g. "2026 GEO shift"). The corpus's edge over a bare model is current,
    // dated facts — carry the date or the wave.
    since: z.string().optional(),
    // How to check it still holds (a metric to look at, a source to re-read).
    verify: z.string().optional(),
    // Stamped by a periodic probe: does a bare model already give this
    // answer? `agree` practices are candidates to retire or refresh.
    probe: z
      .object({
        status: z.enum(['agree', 'partial', 'diverge']),
        date: z.coerce.date(),
      })
      .optional(),
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
    updated: z.coerce.date(),
  }),
});

// articles/ — the newsroom. Dated pieces written by the specialized desks
// (see AUTHORS.md): news, money, campaigns, research, technology. At most one
// a day, editor's call — the ceiling is not a quota. One file per piece:
// YYYY-MM-DD-slug.md.
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // Optional revision stamp when a piece is corrected after publication.
    updated: z.coerce.date().optional(),
    summary: z.string(),
    // A longer standfirst rendered under the title.
    dek: z.string().optional(),
    // The desk that owns the story — drives the kicker and the section chip.
    desk: z.enum(['news', 'money', 'campaigns', 'research', 'technology']),
    // The writer's name exactly as in AUTHORS.md.
    byline: z.string(),
    tags: z.array(z.string()).default([]),
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

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

// examples/ — the swipe file. Each entry is one real, sourced artifact from a
// developer-facing company, tagged on two axes (what kind of artifact, which
// channel) and tied to the guide section it demonstrates. The `source` link is
// mandatory: an example a reader can't go check is just an assertion. Atomic,
// so it renders as a gallery (no per-entry page) and feeds /examples.json and
// llms.txt alongside the practices.
const examples = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/examples' }),
  schema: z.object({
    // Short, descriptive title of the tactic — "Stripe injects your test keys".
    title: z.string(),
    // The company behind the artifact.
    company: z.string(),
    // When it was captured — drives ordering and the "new" markers.
    date: z.coerce.date(),
    // Optional revision stamp when an example is refreshed.
    updated: z.coerce.date().optional(),
    // The one-line "why it works" — shown on the card, in JSON, in llms.txt.
    summary: z.string(),
    // What kind of artifact this is (markepear's content-type axis). Controlled
    // so the gallery chips and filters don't drift — extend deliberately.
    artifact: z.enum([
      'landing-page',
      'pricing',
      'docs',
      'blog',
      'launch',
      'changelog',
      'social',
      'free-tool',
      'product-tour',
      'readme',
      'video',
      'ad',
    ]),
    // Where the artifact lives (markepear's channel axis). Controlled vocab.
    channel: z
      .array(
        z.enum([
          'web',
          'docs',
          'blog',
          'github',
          'hackernews',
          'reddit',
          'twitter',
          'linkedin',
          'youtube',
          'newsletter',
          'podcast',
          'conference',
        ])
      )
      .default([]),
    // The guide section id this example demonstrates, e.g.
    // "02-docs-as-front-door" — the cross-link back to the reference.
    demonstrates: z.string(),
    // Free-form tactic/topic tags — feed the tag pages alongside weekly & dives.
    tags: z.array(z.string()).default([]),
    // The proof: a link to the real artifact. Mandatory.
    source: z.object({ label: z.string(), url: z.string().url() }),
    // Optional supporting sources (a teardown, the operator's own write-up).
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

// resources/ — the directory of outside help. One file per provider. The bar
// for an entry: a live site, a real developer-marketing service (not a tool or
// a media property), and one *verifiable* proof point — a named client wall, a
// published price, a book, a conference they run, a network size they state.
// `signal` carries that proof and `checked` stamps when a human-or-agent last
// opened the page. `caveat` is mandatory in spirit, not in schema: say the
// uncomfortable thing (self-reported numbers, six months old, not devtools-only)
// where it applies. No paid placements, ever — see /about.
const resources = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/resources' }),
  schema: z.object({
    // The provider's name as they write it — "Draft.dev", "ércule".
    name: z.string(),
    // Their home page. Doubles as the entry's proof link.
    url: z.string().url(),
    // What kind of thing you are hiring. Drives the chip on the card.
    kind: z.enum([
      'agency', // a shop with a bench and account management
      'studio', // small, senior, one discipline done deeply
      'collective', // a network you hire practitioners out of, directly
      'independent', // one person
      'network', // creators/programs at scale, brokered
      'platform', // software first, services attached
      'research', // sells data and studies, not campaigns
    ]),
    // The section of the directory this sits in. Ordering and labels live in
    // lib/content.ts (RESOURCE_CATEGORIES) so pages and endpoints agree.
    category: z.enum(['content', 'positioning', 'devrel', 'docs', 'community', 'research']),
    // What they actually sell. Controlled so the filter chips can't drift.
    services: z
      .array(
        z.enum([
          'content',
          'docs',
          'devrel',
          'community',
          'events',
          'positioning',
          'gtm',
          'seo-geo',
          'video',
          'design',
          'ads',
          'research',
          'education',
        ])
      )
      .min(1),
    // How dev-specific the practice is. "technical-b2b" is not a demerit — it
    // is a warning to check they have shipped to developers specifically.
    focus: z.enum(['devtools', 'technical-b2b']),
    // Where they are, loosely — "US · remote", "Europe". Buyers ask.
    based: z.string().optional(),
    // The strongest thing about them that a reader can go verify. Required:
    // an entry nobody can check is an ad.
    signal: z.string(),
    // Published pricing only — never a quote we were given, never an estimate.
    pricing: z.string().optional(),
    // The honest reservation. Omit only when there genuinely isn't one.
    caveat: z.string().optional(),
    tags: z.array(z.string()).default([]),
    // When the site and the claims above were last opened and checked.
    checked: z.coerce.date(),
    // Supporting links beyond `url` — a launch post, a methodology page, a book.
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

// radar/ — archived. Schema unchanged from the site's first phase so the
// existing entries render exactly as published.
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
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

export const collections = {
  guide,
  weekly,
  articles,
  practices,
  'deep-dives': deepDives,
  examples,
  resources,
  radar,
};
