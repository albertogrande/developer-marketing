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
npm test                    # node --test over newsletter/test/*.test.mjs and scripts/*.test.mjs
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

**1. The site** — Astro 5, static, nine content collections under `src/content/`,
schemas in `src/content.config.ts`. Every collection has a human page *and* a
machine twin (`/<collection>.json`, `/<collection>/<id>.md`, feeds, `llms.txt`,
`api.json`). The machine surface is house-rolled in `src/pages/*.ts` — extend
those rather than adding an SEO/llms integration that would fight the base path
and the deterministic-dates rule.

**2. The autonomous newsroom** — four editorial desks, each a skill in
`.claude/skills/` (`daily-scout`, `newsroom`, `weekly-digest`, `deep-dive`), each
driven by a GitHub Actions workflow through `claude-code-action`. The pipeline
per writer run is: skill writes files (never commits) → `writer-guard` fails an
empty or errored run → a **fresh-context fact-integrity pass** with a different
model re-verifies every load-bearing claim → `editorial-gates` (full build +
source liveness) → `commit-and-push`. A failed gate uploads a `rescue-patch`
artifact so a retry costs the run, not the writing. Composite steps live in
`.github/actions/` precisely so they can't drift per workflow.

Editorial state is plain markdown, all internal: `signals/<ISO-week>.md` (raw
capture), `editorial/MEMORY.md` (running threads, coverage), `editorial/TASTE.md`
(the reader), `editorial/NEWSROOM.md` (publish/skip decision log),
`editorial/BACKLOG.md`. `MASTHEAD.md` is the charter; `AUTHORS.md` the five
writing desks. The desks run interactively too — `/daily-scout`, `/newsroom`,
`/weekly-digest`, `/deep-dive [topic]` — writing files without committing.

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
  silently break `/weekly/2026-W28` on a case-sensitive host.
- **Content links are base-less.** Markdown bodies and `related[].href` write
  `/guide/02-docs-as-front-door`; `scripts/remark-base-paths.mjs` adds the base
  at build. Content must never encode where the site is deployed.
- **Dates come from frontmatter, never `Date.now()`.** Sitemap `lastmod`,
  `api.json` `updated`, and the feeds all derive from content — builds are
  reproducible and freshness claims are honest.
- **Adding a required frontmatter field** means changing four things in the same
  commit: the zod schema, the writing skill that authors it,
  `scripts/check-refs.mjs`, and the machine endpoints that would surface it.
- **Controlled vocabularies are enums on purpose** (practice `tags`, example
  `artifact`/`channel`, skill `job`/`agents`, resource `kind`/`category`/
  `services`). Agents filter on them, so drift breaks the filter silently —
  extend the enum deliberately.

## Shared modules that exist to prevent drift

Prefer editing these over inlining a second copy of the same knowledge:

- `scripts/lib/routes.mjs` — the route table, frontmatter parsing and date map,
  shared by both gates, the sitemap hook, and the IndexNow ping.
- `site.config.mjs` — the only place that knows where the site is served from;
  read by the Astro build, the gates, and every newsletter URL.
- `src/lib/content.ts` — every collection query and sort order, plus
  `getGuideGraph` (the section → practices/examples/skills/coverage inversion)
  and `getFeedItems`. Pages and endpoints import these instead of re-sorting.
- `src/lib/markdown.ts` — the `.md` sibling builder; siblings must stay
  self-contained (canonical URL, dates, license, sources inside).

## Editorial rules worth knowing before touching content

The charter is in `MASTHEAD.md` and it is load-bearing, not decoration. The three
that most often catch a change: the daily article slot is **a ceiling, not a
quota** (a logged skip is a successful run); every load-bearing claim carries a
public source and single-sourced claims say so inline; **nothing is for sale** —
no sponsored slots, no affiliate links, no paid placement, including in
`src/content/resources/`.

Content under `src/content/` is CC BY 4.0; code is MIT.
