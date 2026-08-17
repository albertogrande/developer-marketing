# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Read [AGENTS.md](AGENTS.md) too — it holds the invariants for the machine surface
and is the file other agents (and other tools) read. This file is the working
orientation: what the pieces are, and what breaks when you change them.

## Commands

```bash
npm install                 # Node 20, the toolchain pinned in CI
npm run dev                 # Astro on :4321, hot-reloads src/
npm run build               # check-refs → astro build → pagefind → check-agent-surface
npm run check               # check-refs + source liveness on changed content (fast, pre-commit)
npm run preview             # serve the built dist/
npm run typecheck           # astro check — gated at zero errors in CI
npm test                    # node --test, recursive from the repo root
npm run test:coverage       # the same suite with a coverage report (~90% of lines)
npm run ledger:report       # per-desk cost and turn-cap saturation from usage/ledger.csv
```

`npm test` is deliberately the bare recursive form. It used to pass a shell
glob (`newsletter/test/*.test.mjs scripts/*.test.mjs`), which silently skipped
any test added elsewhere — a runner that fails open is worse than no runner.
Test helpers that are not themselves tests live in `newsletter/test-support/`,
outside the patterns Node matches.

The jobs board — weekly sweep (Sunday), deterministic merge:

```bash
npm run jobs:merge              # signals/jobs/incoming.json → signals/jobs/jobs.json
node --test scripts/jobs-merge.test.mjs
```

Podcast transcripts for the scout, cached locally and never committed:

```bash
npm run podcast:transcripts -- --days 2     # publisher transcripts → .cache/
npm run podcast:transcripts -- --list       # report only, download nothing
```

The scout's event DB — deterministic capture of the whole watchlist, and the
substrate the /intel skill queries:

```bash
npm run scout:sweep -- --days 2             # fetch watchlist → signals/db/<week>.ndjson
npm run scout:sweep -- --dry-run            # fetch + triage report, write nothing
npm run scout:query -- --entity vercel      # filter the merged event log
npm run scout:enrich -- --patch -           # validated writes (the model never edits NDJSON)
```

One test file, or one test:

```bash
node --test newsletter/test/tokens.test.mjs
node --test --test-name-pattern "unsubscribe" newsletter/test/store.test.mjs
```

Newsletter, locally (writes `.eml` to `newsletter/data/outbox/` with no transport configured):

```bash
cp newsletter/.env.example newsletter/.env   # fill NEWSLETTER_SECRET
set -a; . newsletter/.env; set +a
npm run newsletter:serve                     # capture service on :8787
npm run newsletter:preview                   # render the newest issue, send nothing
npm run newsletter:doctor                    # SPF/DKIM/DMARC + relay checks, sends nothing
```

Serving from somewhere else is two variables, never a content migration:
`SITE_ORIGIN=https://example SITE_BASE=/ npm run build`.

## Three systems in one repo

**1. The site** — Astro 5, static, eleven content collections under `src/content/`,
schemas in `src/content.config.ts`. Every collection has a human page *and* a
machine twin (`/<collection>.json`, `/<collection>/<id>.md`, feeds, `llms.txt`,
`api.json`). The machine surface is house-rolled in `src/pages/*.ts` — extend
those rather than adding an SEO/llms integration that would fight the base path
and the deterministic-dates rule.

**2. The two autonomous writers** — each a skill in `.claude/skills/`
(`daily-scout`, `weekly-editor`), each driven by a GitHub Actions workflow
(`scout.yml`, `editor.yml`) through `claude-code-action`. The pipeline per
writer run is: skill writes files (never commits) → `writer-guard` fails an
empty or errored run → a **fresh-context fact-integrity pass** with a different
model re-verifies every load-bearing claim → `editorial-gates` (full build +
source liveness) → `commit-and-push`. A failed gate uploads a `rescue-patch`
artifact so a retry costs the run, not the writing. Composite steps live in
`.github/actions/` precisely so they can't drift per workflow.

The content model stores knowledge by kind, not prose form. The scout promotes
qualifying signals to `src/content/signals/` (the published Signals feed — one company, two
sentences, a mandatory `source`; **traction is explicitly not a promotion
criterion**, because ranking by reach is what silently drops the indie tail).
The editor writes the weekly issue to `src/content/issues/` — normally short,
occasionally a **long special issue** when a thread earned depth (the old
deep-dive tier, absorbed) — and reconciles `src/content/claims/`, the
reference's atomic units, each carrying `status` (current/stale/retired) and
`checked`. Claims are never deleted, only retired: their anchors must keep
resolving. `articles/`, `deep-dives/` and `radar/` are closed archives —
still rendered and machine-served, never extended.

**`src/content/threads/`** is the middle tier between the two: the running
stories, each an open `question`, the argument so far, a `momentum` stamp and
`openLoops` saying what would settle it. Membership runs *inward* — signals
and issues carry `threads: [slug]`, nothing on the thread names its members —
so a timeline grows on the next build and the scout can file a signal daily
without touching the thread. The editor owns opening, closing and stamping
(Monday); the scout only files evidence. Like claims, threads are never
deleted: `dormant` or `resolved`, the file stays so anchors resolve. They are
deliberately **out of the feeds** for the guide's reason — continuously
rewritten, so freshness rides on sitemap `lastmod`, `api.json` and `llms.txt`.
Registering a collection touches **four** lists (`src/content.config.ts`,
`COLLECTIONS` in `scripts/lib/routes.mjs`, `check-refs.mjs`, and
`PAGE_COLLECTIONS` in `scripts/lib/refs.mjs`) plus the `mdMatch` alternation
in `src/components/Head.astro` — miss that last one and the agent-surface
gate fails *after* the build, on a missing `rel=alternate`.

Underneath the curated capture sits the **event DB**: `scout:sweep` fetches
the registered watchlist (`scripts/lib/scout-sources.mjs` — RSS/Atom feeds,
HN/Show-HN queries, scoped subreddits, Lobsters, Bluesky) and appends every
in-window item to `signals/db/<ISO-week>.ndjson`, append-only and dedup-by-id,
whether or not anything is written about it. The scout enriches notable
events (entities from `signals/entities.json`, an event kind, topics) through
`scout:enrich` — never by editing NDJSON directly — and `scout:query`/the
`/intel` skill answer questions over the merged log. Raw capture is not
verification; only published signals and the issues pass the fact-integrity bar.

Editorial state is plain markdown, all internal: `signals/<ISO-week>.md` (raw
capture), `editorial/MEMORY.md` (running threads, special-issue candidates),
`editorial/TASTE.md` (the reader); `editorial/NEWSROOM.md` and
`editorial/BACKLOG.md` are archived read-only. `MASTHEAD.md` is the charter;
`AUTHORS.md` documents the retired desks whose bylines the article archive
still renders. The writers run interactively too — `/daily-scout`,
`/weekly-editor` — writing files without committing.

**2½. The jobs board** — a fourth, narrower capture: fully-remote
marketing-leadership / growth / product-marketing roles at devtools and AI
companies (no DevRel, deliberately), swept weekly by the `jobs-scout` skill
(`jobs.yml`, Sunday) and stored in `signals/jobs/jobs.json`. The skill only
discovers and classifies; `scripts/jobs-merge.mjs` owns every integrity
decision — validation, URL-canonical dedupe, identity collapse, ATS-board
liveness (Ashby/Greenhouse APIs), two-missed-sweeps aging. Rendered at `/jobs`
grouped by remote region (worldwide/eu/usa/other — a classification, never a
gate) with the machine twin at `/jobs.json`. Ported from the private
`dev-marketing-jobs` repo; listings are never paid placements.

**3. The newsletter** (`newsletter/`) — self-hosted end to end: own list, own
MIME/SMTP/token libraries, no ESP and no tracking of any kind. `server.mjs`
holds the routes; `api/*.js` are thin Vercel bindings to the same handlers via
`newsletter/lib/vercel.mjs`, so there is one implementation behind both
deployments. Two swap points, each isolated to one file: `lib/transport.mjs`
(smtp / resend / dry-run, inferred from env) and `lib/store-open.mjs` (NDJSON
append-only log locally, Postgres on serverless — both satisfy
`test/store-contract.mjs`). `pg` is an optional dependency; keep the Postgres
import lazy.

## Invariants that gates enforce

`npm run build` runs `scripts/check-refs.mjs` before the build and
`scripts/check-agent-surface.mjs` after it. **If a change breaks a gate, fix the
change, not the gate.**

- **URL form.** Page URLs carry a trailing slash; file-ish URLs (`.md`, `.json`,
  `.xml`, `.txt`) never do. Use `withBase` / `absUrl` / `canonicalFor` from
  `src/lib/site.ts` — never hand-build a URL.
- **Ids are literal filenames** minus extension. `src/content.config.ts`
  overrides Astro's loader `generateId` because the default lowercases and would
  silently break `/issues/2026-W28` on a case-sensitive host.
- **Content links are base-less.** Markdown bodies and `related[].href` write
  `/guide/02-docs-as-front-door`; `scripts/remark-base-paths.mjs` adds the base
  at build. Content must never encode where the site is deployed.
- **Dates come from frontmatter, never `Date.now()`.** Sitemap `lastmod`,
  `api.json` `updated`, and the feeds all derive from content — builds are
  reproducible and freshness claims are honest.
- **Adding a required frontmatter field** means changing four things in the same
  commit: the zod schema, the writing skill that authors it,
  `scripts/check-refs.mjs`, and the machine endpoints that would surface it.
- **Controlled vocabularies are enums on purpose** (claim `tags`/`status`,
  example `artifact`/`channel`, skill `job`/`agents`, resource `kind`/
  `category`/`services`). Agents filter on them, so drift breaks the filter
  silently — extend the enum deliberately.

## Shared modules that exist to prevent drift

Prefer editing these over inlining a second copy of the same knowledge:

- `scripts/lib/routes.mjs` — the route table, frontmatter parsing and date map,
  shared by both gates, the sitemap hook, and the IndexNow ping.
- `scripts/lib/podcasts.mjs` — the podcast watch list plus the feed/transcript
  parsers, shared by the fetch tool and its tests so the scout's source set
  lives in one place. Transcripts are cached to gitignored `.cache/` and are
  never content: they are a third party's copyrighted work, so they are used to
  verify or briefly quote with attribution, then discarded.
- `site.config.mjs` — the only place that knows where the site is served from;
  read by the Astro build, the gates, and every newsletter URL.
- `src/lib/content.ts` — every collection query and sort order, plus
  `getGuideGraph` (the section → claims/examples/skills/coverage inversion)
  and `getFeedItems`. Pages and endpoints import these instead of re-sorting.
- `src/lib/markdown.ts` — the `.md` sibling builder; siblings must stay
  self-contained (canonical URL, dates, license, sources inside).

## Editorial rules worth knowing before touching content

The charter is in `MASTHEAD.md` and it is load-bearing, not decoration. The
three that most often catch a change: publishing is **criteria, not a quota**
(a thin signals day and a normal-length issue are successful runs); every
load-bearing claim carries a public source and single-sourced claims say so
inline; **nothing is for sale** — no sponsored slots, no affiliate links, no
paid placement, including in `src/content/resources/`.

Content under `src/content/` is CC BY 4.0; code is MIT.
