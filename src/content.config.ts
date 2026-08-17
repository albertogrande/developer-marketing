import { defineCollection, z } from 'astro:content';
import { glob as globLoader } from 'astro/loaders';

// Ids are the filename minus extension, literally — not slugified. The
// default loader lowercases (2026-W28.md → 2026-w28), silently diverging
// from the filenames the writers link to (/issues/2026-W28) on a
// case-sensitive host. Every machine surface (routes, .md siblings, llms,
// sitemap lastmod) assumes id === filename, so make that the loader's
// contract too.
const glob = (opts: Parameters<typeof globLoader>[0]) =>
  globLoader({ generateId: ({ entry }) => entry.replace(/\.mdx?$/, ''), ...opts });

// The content model stores knowledge by kind, not by prose form. Two
// primitives, one written prose form, one directory — plus read-only archives.
//
//  signals/     — the event log, and the only time-based storage going forward.
//              One file per dated, sourced fact: one company, one thing that
//              happened, two sentences, a link. A small company whose news
//              can't carry 900 words still gets covered here — traction is
//              not a criterion. One file per item: YYYY-MM-DD-company-slug.md.
//  claims/   — the living reference's atomic units. Each is a
//              "when X → do Y (because Z)" claim with a universal provenance
//              spine: `since` (the dated fact that made it true), `verify`
//              (how to re-check), `sources`, and a freshness `status`
//              (current/stale/retired) stamped at `checked`. Guide sections
//              transclude these; machines read /claims.json and llms.txt.
//  issues/   — the one written prose form: the weekly issue ("The Beat").
//              One file per ISO week: YYYY-Www.md. Normally short; when a
//              thread has earned depth the editor writes a long special
//              issue instead — there is no separate deep-dive tier anymore.
//  threads/  — the running stories: the questions this publication is
//              following across weeks, each with a momentum reading, the
//              dated evidence filed onto it, and open loops that say what
//              would settle it. The missing middle between a signal (one
//              day) and an issue (one week). Membership is declared by the
//              members — signals and issues carry `threads: [slug]` — so a
//              thread's timeline grows without the thread file being touched.
//  guide/    — the evergreen reference's composed pages. One file per
//              section: NN-slug.md. Kept continuously current; claims,
//              examples and skills attach to sections.
//  skills/   — the shelf. Real, installable agent skills that do the work the
//              guide describes, each tied to its section, with a verbatim
//              install line and a mandatory caveat.
//  examples/ — the swipe file. Real, sourced dev-marketing artifacts, each
//              with a "why it works" note, the guide section it demonstrates,
//              and a link to the real thing. Evidence for the guide's
//              judgment.
//  resources/ — the directory. Vetted outside help for developer marketing.
//              Each entry is a real provider with a live site, one verifiable
//              proof point, and the date we last checked it.
//  articles/  — ARCHIVE. The daily newsroom tier from the site's second phase
//              (2026-07 → 2026-08). Kept rendered so URLs don't break; no new
//              entries — analysis now ships in the weekly issue.
//  deep-dives/ — ARCHIVE. Long-form pieces from the same phase. No new
//              entries — depth now ships as a long special issue.
//  radar/    — ARCHIVE. The dated daily posts from the site's first phase
//              (2026-07-05 → 2026-07-08), kept rendered so URLs don't break.
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

const issues = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/issues' }),
  schema: z.object({
    title: z.string(),
    // ISO week id, e.g. "2026-W28" — also the filename/slug.
    week: z.string(),
    // The Monday that opens the week this issue COVERS. Display only — it is
    // the stamp under the title ("2026-W30 · 20 July 2026"), not a publish
    // date: the digest ships the Monday *after* the week closes.
    date: z.coerce.date(),
    // When the issue actually shipped — `date` + 7. This is what drives feed
    // ordering and schema.org datePublished. The two are separate because a
    // weekly is written about a window that closed before it: stamping the
    // feed with `date` published every digest a week stale, sinking it below
    // articles it is newer than.
    published: z.coerce.date(),
    summary: z.string(),
    // A longer standfirst rendered under the title — usually only on the
    // occasional long special issue.
    dek: z.string().optional(),
    // Optional revision stamp when an issue is corrected after publication.
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
    // The running threads this issue advanced. Slugs from threads/ — see the
    // note on that collection for why this is a bare slug array and not a
    // `related` entry.
    threads: z.array(z.string()).default([]),
  }),
});

// threads/ — the running stories, and the missing middle of the content model.
// A signal says what happened on one day; an issue says what a week meant; a
// thread says where a question has been going for months and what would settle
// it. The newsroom always had these (editorial/MEMORY.md ran them privately,
// with a momentum arrow and open loops) — this is that machinery made public.
//
// A thread is NOT a tag. A tag collects things that share a word; a thread
// carries an argument, has a question it is trying to answer, and can be wrong.
// That is why `question` is required and why threads are editor-authored, a
// handful at a time, rather than derived from the tag vocabulary.
//
// Membership runs the other way: signals and issues declare `threads: [slug]`,
// and the thread page inverts that into its timeline. So a thread never has to
// be edited when new evidence lands — the scout attaches the signal and the
// timeline grows on the next build.
//
// Threads are never deleted, for the same reason claims are never deleted: the
// anchors must keep resolving. A thread that stops moving goes `dormant`; one
// whose question got answered goes `resolved`. Both keep their page.
const threads = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/threads' }),
  schema: z.object({
    // The thread's name, as the newsroom says it out loud, e.g.
    // "AI assistants are a primary reader of your docs".
    title: z.string(),
    // The one sentence this thread is trying to answer. Load-bearing: it is
    // what separates a thread from a tag, and it is the honest statement of
    // what we do not yet know. Ends in a question mark or it isn't one.
    question: z.string(),
    // Where the thread stands right now, in two sentences. Card, JSON, llms.txt.
    summary: z.string(),
    // `open` = live, still accumulating evidence. `dormant` = no new evidence
    // for ~3 issues; kept because the question may reopen. `resolved` = the
    // question got a durable answer, which normally means a claim or a guide
    // section now carries it — the body says which.
    status: z.enum(['open', 'dormant', 'resolved']).default('open'),
    // The momentum arrow MEMORY.md has always used (↑ / → / ↓), typed so the
    // page and any filter read the same value. This is about the *evidence
    // rate*, not about whether the thread is important.
    //
    // Deliberately no default: a default would ship "steady" for a thread
    // nobody actually looked at, which is the exact lie the arrow exists to
    // prevent. check-refs requires it too — and since that gate reads raw
    // YAML, a zod default here would be invisible to it and the two would
    // disagree about what "missing" means.
    momentum: z.enum(['rising', 'steady', 'cooling']),
    // The day the thread opened — the first dated evidence, not the day the
    // file was written.
    started: z.coerce.date(),
    // The editor's last revision. Required: this is the thread's honest
    // lastmod, and the whole collection would otherwise be undated (a thread
    // has no single publish date by construction).
    updated: z.coerce.date(),
    // The guide sections this thread feeds. Same contract as claim.section —
    // check-refs fails the build on an id that is not a real section.
    sections: z.array(z.string()).default([]),
    // What would move this thread, and by when. The public form of charter
    // rule 4: staleness is visible, never silent. `by` is prose, not a date,
    // because most loops ripen on an event ("the next SlashData wave") rather
    // than on a calendar day.
    openLoops: z
      .array(z.object({ question: z.string(), by: z.string().optional() }))
      .default([]),
    tags: z.array(z.string()).default([]),
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    // The thread's own load-bearing links. Member signals carry their own
    // sources; these are the ones the running argument rests on.
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  }),
});

// claims/ — the living reference's atomic, retrievable units (and a
// human-readable gallery). Each is a "when X → do Y (because Z)" claim tied to
// a guide section, carrying its own provenance and freshness state. Surfaced
// to agents via /claims.json and /llms.txt.
const claims = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/claims' }),
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
          // Answer-engine optimization: being found and cited when the first
          // impression is an AI answer rather than a search result. Distinct
          // from `docs` (the surface) and `distribution` (the channel) — this
          // is the discipline of being retrievable and quotable.
          'aeo',
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
    // answer? `agree` claims are candidates to retire or refresh.
    probe: z
      .object({
        status: z.enum(['agree', 'partial', 'diverge']),
        date: z.coerce.date(),
      })
      .optional(),
    // Freshness state, stamped by the weekly editor's reconciliation pass.
    // `stale` = the supporting fact may have moved, re-verify; `retired` = no
    // longer holds — the file stays (anchors must resolve) with a body note.
    status: z.enum(['current', 'stale', 'retired']).default('current'),
    // When the claim was last re-verified against its sources.
    checked: z.coerce.date(),
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
    updated: z.coerce.date(),
  }),
});

// articles/ — ARCHIVE. The daily newsroom tier (2026-07 → 2026-08), written
// by the specialized desks (see AUTHORS.md): news, money, campaigns,
// research, technology. No new entries — analysis now ships in the weekly
// issue. Schema unchanged so the archive renders exactly as published.
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
    // The masthead's floor made structural: an article carries at least two
    // sources (check-refs additionally requires two independent publishers).
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .min(2, 'an article needs at least two sources'),
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
    // A dive's argument stands on its research: at least three sources
    // (check-refs additionally requires two independent publishers).
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .min(3, 'a deep dive needs at least three sources'),
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

// skills/ — the shelf. Real, installable agent skills that do developer-
// marketing work: one entry per skill, tied to the guide section whose job it
// automates. `install` is verbatim from the publisher and `caveat` is
// mandatory — a listing here is a pointer, not an endorsement, and the honest
// limit belongs on the card. Renders as a gallery at /skills (no per-entry
// page) and feeds /skills.json and llms.txt.
const skills = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/skills' }),
  schema: z.object({
    // What the skill does for a dev-marketing team, in the imperative.
    title: z.string(),
    // The invocable/folder name of the skill itself, e.g. "docs-auditor".
    name: z.string(),
    // Who publishes it, credited as they credit themselves.
    author: z.string(),
    // owner/repo — the identity both humans and agents recognise.
    repo: z.string(),
    // When the shelf added it. Drives ordering.
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    summary: z.string(),
    // The job it does. Controlled vocab — the chips and filters read it, so
    // extend the enum deliberately rather than ad hoc.
    job: z.enum([
      'foundation',
      'positioning',
      'docs',
      'readme',
      'content',
      'seo-geo',
      'dx',
      'product-surface',
      'research',
      'launch',
    ]),
    // Where it runs. 'any' = published to the Agent Skills spec and installable
    // in anything that reads it.
    agents: z
      .array(
        z.enum([
          'claude-code',
          'claude-ai',
          'cursor',
          'windsurf',
          'codex',
          'copilot',
          'gemini-cli',
          'any',
        ])
      )
      .default([]),
    // The install line(s), verbatim from the publisher. Multi-line allowed.
    install: z.string(),
    license: z.string().optional(),
    // The honest limit: what it won't do, or where its output needs a human.
    // Mandatory — an uncaveated tool recommendation is marketing.
    caveat: z.string(),
    // Set when this site's own author published the skill. Shown on the card.
    disclosure: z.string().optional(),
    // The guide section whose work it does, e.g. "02-docs-as-front-door".
    section: z.string(),
    tags: z.array(z.string()).default([]),
    // When the entry was last confirmed: repo alive, install line current.
    verified: z.coerce.date(),
    // The proof: where the skill lives. Mandatory.
    source: z.object({ label: z.string(), url: z.string().url() }),
    // Supporting links — the SKILL.md, the rule set, the spec.
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
  }),
});

// signals/ — the event log. The smallest publishable unit: a company, what it
// did, two sentences, and the link that proves it. Deliberately not prose —
// no byline, no take. `source` is mandatory for the same reason it is on
// examples/: a one-line news claim nobody can go check is a rumour. The
// stream is where the small-company tail lands, so the bar is "it happened
// and here is where to verify it" — traction is not a criterion.
const signals = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/signals' }),
  schema: z.object({
    // The headline — what happened, in the site's voice, no company prefix
    // (the company renders as its own field on the card).
    title: z.string(),
    // The company the news is about, written as they write it.
    company: z.string(),
    // The day the item entered the signals. For something surfaced late, this is
    // the capture date and the body says when it originally shipped.
    date: z.coerce.date(),
    // Optional revision stamp when an item is corrected after publication.
    updated: z.coerce.date().optional(),
    // The two sentences. Rendered on the card, in JSON, and in llms.txt.
    summary: z.string(),
    // What kind of item this is. Controlled vocab — the chips and any future
    // filter read it, so extend the enum deliberately.
    //
    // `podcast` is a deliberately weaker claim than the rest: the scout reads
    // the feed's title, show notes and guest, it does not listen. A podcast
    // signal says what an episode covers, never asserts a fact stated in audio
    // nobody verified. For a podcast item `company` is the show.
    //
    // `signal` is the intelligence tier: a pattern the event DB can prove —
    // three or more dated, sourced events forming a trend — never a single
    // event and never an unsourced prediction. The summary states the observed
    // pattern (a composed, verifiable fact); any forward-looking read lives in
    // the body, explicitly framed as a call, not reported as news. For a
    // pattern item `company` is the pattern's subject (a company, a category,
    // or "The field").
    kind: z.enum(['news', 'release', 'funding', 'launch', 'campaign', 'discussion', 'podcast', 'signal']),
    // The proof: a link to the primary source. Mandatory.
    source: z.object({ label: z.string(), url: z.string().url() }),
    // Supporting links — a teardown, the HN thread, the counter-argument.
    sources: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
    tags: z.array(z.string()).default([]),
    related: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    // The running thread(s) this item is evidence for. Slugs from threads/ —
    // check-refs fails the build on one that names no thread, because a
    // mistyped slug is a silent orphan: the item drops out of the timeline it
    // was filed into and nothing renders differently.
    //
    // Not a `related` entry: `related` is a free-form "see also" display list,
    // while this is a typed edge a gate can validate exactly and
    // getThreadGraph() can invert in one flat pass. Same shape as the other
    // typed cross-collection edges (claim.section, example.demonstrates).
    //
    // Most signals belong to no thread. That is the normal outcome, not a gap.
    threads: z.array(z.string()).default([]),
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
  issues,
  threads,
  signals,
  claims,
  articles,
  'deep-dives': deepDives,
  examples,
  resources,
  skills,
  radar,
};
