# Developer Marketing — a living field guide

A living field guide to the state of the art in **developer marketing**, DevRel,
and developer experience — positioning, docs-led growth, community, activation,
distribution, launches, and the metrics that matter. Written for a practitioner
who markets to developers.

Kept current by autonomous [Claude Code](https://claude.com/claude-code) agents.
No human in the byline.

- **Live site** — https://albertogrande.github.io/developer-marketing/
- **The guide** — the evergreen reference, nine sections, kept continuously current.
- **The week** — a short weekly digest of what moved, newest first, each sourced.
- **Deep dives** — long-form pieces, commissioned when a thread earns the depth.
- **Practices** — atomic "when X → do Y (because Z)" units, human- and machine-readable.
- **Radar (archive)** — the dated daily posts from the site's first phase.

Built with [Astro](https://astro.build). Architecture and visual identity shared
with the [Claude Code field guide](https://github.com/albertogrande/claude-code),
which itself descends from [The Wire](https://github.com/albertogrande/the-wire).

## How it works

Signals in, guide out. Three desks, each a [skill](.claude/skills/) an agent runs end to end:

- The **scout** (`.claude/skills/daily-scout/`) runs daily: it sweeps
  practitioner blogs, DevRel communities, and industry research, files raw
  one-liners to `signals/<week>.md`, and patches `src/content/guide/` the moment
  a hard fact changes.
- The **weekly editor** (`.claude/skills/weekly-digest/`) runs weekly: it reads
  the week's signals and writes one short issue to `src/content/weekly/`, does a
  fuller guide-accuracy pass, distills `src/content/practices/` from the week's
  practice-candidates, and — when a thread has earned it — commissions a
  **deep dive** (`.claude/skills/deep-dive/`) into `src/content/deep-dives/`.
- `editorial/MEMORY.md` (running threads, deep-dive candidates, the guide
  coverage index) is the brain that decides what's worth depth;
  `editorial/TASTE.md` is the reader profile. Both are internal.

Each desk is a [GitHub Actions workflow](.github/workflows/) — `scout.yml`
(daily), `weekly.yml` (Mondays), `deep-dive.yml` (on demand, or dispatched by
the Weekly when it commissions one) — that runs the skill via
[claude-code-action](https://github.com/anthropics/claude-code-action). Every
writer run gets a **fresh-context fact-integrity pass** (a second Claude that
verifies changed claims against primary sources), then deterministic gates
(`scripts/check-refs.mjs` referential integrity in the build,
`scripts/check-sources.mjs` source liveness) before a rebase-safe commit. The
**Deploy workflow** then builds the site and publishes to GitHub Pages;
failures open a `pipeline-failure` issue instead of dying silently.

Content is frontmatter-driven (see `src/content.config.ts`) so the agents can
write it deterministically.

## Local development

```
npm install
npm run dev      # http://localhost:4321/developer-marketing
```

- `npm run dev` — hot-reloads `src/`.
- `npm run build` — check-refs gate + production build to `dist/` + Pagefind search index.
- `npm run check` — referential integrity + source liveness on changed content.
- `npm run preview` — serves the built `dist/`.

## Layout

```
src/
  content/
    guide/           # evergreen reference — NN-slug.md, frontmatter: title, order, summary, updated
    weekly/          # weekly digest — YYYY-Www.md, frontmatter: title, week, date, summary, tags, sources
    practices/       # atomic best-practices — {when, do, why, section, since, verify} — feed the agent endpoints
    deep-dives/      # long-form pieces — YYYY-MM-DD-slug.md, dated + sourced
    radar/           # ARCHIVE — dated posts from the first phase; no new entries
  content.config.ts  # collection schemas (zod)
  layouts/           # BaseLayout + ReadingLayout
  components/        # Chrome (nav), Head, Footer, Shortcuts (⌘K palette), TagList, ArticleFoot
  pages/             # index, guide/, weekly/, deep-dives/, practices/, tags/, radar/, about, feed.xml.ts
                     #  + machine endpoints: llms.txt, llms-full.txt, practices.json, guide.json, weekly.json
  styles/main.scss   # design system, inherited from The Wire
  lib/               # site.ts (base path + dates) + content.ts (shared collection queries)
signals/             # raw daily capture, one file per ISO week (internal, not rendered)
editorial/           # MEMORY.md (threads, coverage, dive candidates) + TASTE.md (reader) — internal
scripts/             # check-refs.mjs, check-sources.mjs (gates) + append-ledger.sh (usage bookkeeping)
.claude/skills/      # daily-scout, weekly-digest, deep-dive — the autonomous desks
.github/workflows/   # scout (daily), weekly (Mondays), deep-dive (on demand), deploy (Pages), ci (build check)
.github/actions/     # commit-and-push, editorial-gates, notify-failure (shared composite steps)
```

## Running it yourself

The autonomous desks need a Claude Code OAuth token:

1. `claude setup-token` (logged into Claude Code with a Max/Pro plan) → copy the token.
2. Add repo secret `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets and variables → Actions).
3. Enable Pages: Settings → Pages → Source → **GitHub Actions**.
4. The Scout runs daily at 05:00 UTC and the Weekly on Mondays at 07:00 UTC;
   both can be triggered manually (Actions → Scout / Weekly → Run workflow).
   Deep Dive is manual-only, or the Weekly commissions one when a thread earns it.

Run the desks in an interactive session too: `/daily-scout`, `/weekly-digest`,
`/deep-dive [topic]`. Interactive runs write files without committing — you decide.

## Use the guide from your own sessions

The guide is also a **source agents can query**, not just a site to read — it
practices the machine-readable-docs play it preaches. It publishes machine
endpoints: [`/llms.txt`](https://albertogrande.github.io/developer-marketing/llms.txt)
(curated index), `/llms-full.txt` (the whole corpus in one file),
`/practices.json`, `/guide.json`, and `/weekly.json`.

## License

MIT. Content under `src/content/` is CC BY 4.0 — quote it, link the page.
