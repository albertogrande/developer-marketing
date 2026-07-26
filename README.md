# Developer Marketing

[![CI](https://github.com/albertogrande/developer-marketing/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/albertogrande/developer-marketing/actions/workflows/ci.yml)
[![Deploy](https://github.com/albertogrande/developer-marketing/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/albertogrande/developer-marketing/actions/workflows/deploy.yml)
[![License](https://img.shields.io/github/license/albertogrande/developer-marketing)](LICENSE)

A newspaper on developer marketing and DevRel.

Researched, written, edited, and fact-checked by autonomous
[Claude Code](https://claude.com/claude-code) agents. No human in the byline.
Identity, desks, and charter: [MASTHEAD.md](MASTHEAD.md) · the writing desks:
[AUTHORS.md](AUTHORS.md).

<!-- TODO(author): add a screenshot/GIF of the site here -->

- **Live site**: https://albertogrande.github.io/developer-marketing/
- **The newsroom**: dated desk articles at `/articles`, at most one a day when the story earns it.
- **The guide**: the evergreen reference, nine sections, kept continuously current.
- **The week**: a short weekly digest of what moved, newest first, each sourced.
- **Deep dives**: long-form pieces, commissioned when a thread earns the depth.
- **Practices**: atomic "when X → do Y (because Z)" units, human- and machine-readable.
- **Examples**: a swipe file of real, sourced artifacts; the evidence behind the practices.
- **Resources**: a vetted directory of who to hire — agencies, studios, collectives, independents. Nothing for sale.
- **Newsletter**: the weekly digest by email, self-hosted end to end (`newsletter/`). No ESP, no tracking.
- **Radar (archive)**: the dated daily posts from the site's first phase.

Built with [Astro](https://astro.build). Architecture and visual identity shared
with the [Claude Code field guide](https://github.com/albertogrande/claude-code),
which itself descends from [The Wire](https://github.com/albertogrande/the-wire).

## How it works

Signals in, paper out. Four desks, each a [skill](.claude/skills/) an agent runs end to end.

- **Scout** ([`daily-scout`](.claude/skills/daily-scout/)): daily, sweeps blogs, communities, and research into `signals/<week>.md` and patches `src/content/guide/` on hard-fact changes.
- **Newsroom** ([`newsroom`](.claude/skills/newsroom/)): Tue–Sun, the owning desk ([AUTHORS.md](AUTHORS.md)) publishes at most one article to `src/content/articles/`, logging each decision to `editorial/NEWSROOM.md`.
- **Weekly editor** ([`weekly-digest`](.claude/skills/weekly-digest/)): weekly, writes the digest and distills `src/content/practices/` and `src/content/examples/`, commissioning a **deep dive** ([`deep-dive`](.claude/skills/deep-dive/)) when a thread earns it.
- **Memory**: `editorial/MEMORY.md` tracks threads and guide coverage; `editorial/TASTE.md` is the reader profile. Both internal.

Each desk is a [GitHub Actions workflow](.github/workflows/) that runs the skill via [claude-code-action](https://github.com/anthropics/claude-code-action). Every writer run gets a fresh-context fact-integrity pass, then deterministic gates before a rebase-safe commit.

- **Gates**: a writer guard fails empty or errored runs; `scripts/check-refs.mjs` and `scripts/check-sources.mjs` enforce referential integrity and source liveness.
- **Health watchdog** (`health.yml`): alarms if the scout or weekly stops committing on schedule.
- **Rescue**: a failed run uploads its uncommitted work as a `rescue-patch` artifact (14-day retention).
- **Deploy** (`deploy.yml`): builds and publishes to GitHub Pages; failures open a `pipeline-failure` issue.
- **Content**: frontmatter-driven (see `src/content.config.ts`) so agents write it deterministically.

## Local development

Prerequisites: Node 20 and npm (the toolchain pinned in CI).

```
npm install
npm run dev
```

Astro starts on port 4321 and serves the site at its base path:

```
┃ Local    http://localhost:4321/developer-marketing
```

- `npm run dev`: hot-reloads `src/`.
- `npm run build`: check-refs gate + production build to `dist/` + Pagefind search index.
- `npm run check`: referential integrity + source liveness on changed content.
- `npm run preview`: serves the built `dist/`.
- `npm test`: the newsletter suite (crypto, list durability, MIME/SMTP encoders, the capture service).

## Layout

```
src/
  content/
    guide/           # evergreen reference: NN-slug.md, frontmatter: title, order, summary, updated
    articles/        # the newsroom: YYYY-MM-DD-slug.md, frontmatter: title, date, desk, byline, summary, tags, sources
    weekly/          # weekly digest: YYYY-Www.md, frontmatter: title, week, date, summary, tags, sources
    practices/       # atomic best-practices: {when, do, why, section, since, verify}; feed the agent endpoints
    deep-dives/      # long-form pieces: YYYY-MM-DD-slug.md, dated + sourced
    examples/        # swipe file: one real artifact per file: {company, artifact, channel, demonstrates, source}
    resources/       # the directory of outside help: {name, url, kind, category, services, signal, caveat, checked}
    radar/           # ARCHIVE: dated posts from the first phase; no new entries
  content.config.ts  # collection schemas (zod)
  layouts/           # BaseLayout + ReadingLayout
  components/        # Chrome (nav), Head, Footer, Shortcuts (⌘K palette), TagList, ArticleFoot, NewsletterCta
  pages/             # index, guide/, articles/, weekly/, deep-dives/, practices/, examples/, resources/, tags/, radar/,
                     #  newsletter/ (subscribe + confirm/unsubscribe landings), about, feed.xml.ts
                     #  + machine endpoints: llms.txt, llms-full.txt, practices.json, guide.json, weekly.json,
                     #    articles.json, examples.json, resources.json
  styles/main.scss   # design system, inherited from The Wire
  lib/               # site.ts (base path + dates) + content.ts (shared collection queries) + newsletter.ts (capture config)
newsletter/          # the in-house newsletter: capture service, SMTP sender, own MIME/markdown/token libs + tests
signals/             # raw daily capture, one file per ISO week (internal, not rendered)
editorial/           # MEMORY.md (threads, coverage) + TASTE.md (reader) + NEWSROOM.md (decision log) + BACKLOG.md (idea pool): internal
MASTHEAD.md          # identity, desks, editorial charter
AUTHORS.md           # the newsroom's five writing desks
scripts/             # check-refs.mjs, check-sources.mjs (gates) + append-ledger.sh (usage bookkeeping)
.claude/skills/      # daily-scout, newsroom, weekly-digest, deep-dive: the autonomous desks
.github/workflows/   # scout (daily), newsroom (Tue–Sun), weekly (Mondays), deep-dive (on demand), newsletter (Mondays),
                     #  deploy (Pages), ci (build + tests), health (watchdog)
.github/actions/     # commit-and-push, editorial-gates, writer-guard, notify-failure (shared composite steps)
```

## Running it yourself

The autonomous desks need a Claude Code OAuth token:

1. `claude setup-token` (logged into Claude Code with a Max/Pro plan) → copy the token.
2. Add repo secret `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets and variables → Actions).
3. Enable Pages: Settings → Pages → Source → **GitHub Actions**.
4. The Scout runs daily at 05:00 UTC, the Newsroom Tue–Sun at 06:30 UTC,
   and the Weekly on Mondays at 07:00 UTC;
   both can be triggered manually (Actions → Scout / Weekly → Run workflow).
   Deep Dive is manual-only, or the Weekly commissions one when a thread earns it.

Run the desks in an interactive session too: `/daily-scout`, `/newsroom`, `/weekly-digest`,
`/deep-dive [topic]`. Interactive runs write files without committing. You decide.

## The newsletter

The weekly digest goes out by email from this repository — our list, our
templates, our sender, no email service provider owning the audience and no
tracking of any kind. A mail relay (Resend, SES, Postmark, your own Postfix)
does the last mile over SMTP or, on serverless hosts, Resend's HTTPS API;
`newsletter/lib/transport.mjs` is the only file that knows which. Full
documentation, including Resend setup, the Vercel migration notes, a systemd
unit and the deliverability checklist:
[`newsletter/README.md`](newsletter/README.md).

```
cp newsletter/.env.example newsletter/.env    # fill in NEWSLETTER_SECRET
set -a; . newsletter/.env; set +a
npm run newsletter:serve                      # capture service on :8787
npm run newsletter:preview                    # render the newest issue, send nothing
```

With no transport configured, mail is written to `newsletter/data/outbox/*.eml`
instead of being sent, so the whole double-opt-in flow is testable offline.

The static site cannot accept a POST, so the subscribe form needs that service's
public URL at build time. Set the repository **variable** `NEWSLETTER_API` (e.g.
`https://list.example.com`, or `/api` if the endpoint ends up same-origin) and
the next deploy renders live forms; leave it unset and the call-to-action says so
instead of failing silently. Sending needs secrets `NEWSLETTER_SECRET` (the same
one the service signs with), `NEWSLETTER_ADMIN_TOKEN`, `FROM_EMAIL`, and one
transport — `RESEND_API_KEY`, or `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`. Without
them the weekly send job skips and stays green.

## Use the guide from your own sessions

The guide is also a **source agents can query**, not just a site to read. It
practices the machine-readable-docs play it preaches. It publishes machine
endpoints: [`/llms.txt`](https://albertogrande.github.io/developer-marketing/llms.txt)
(curated index), `/llms-full.txt` (the whole corpus in one file),
`/practices.json`, `/guide.json`, `/weekly.json`, `/examples.json`, and
`/resources.json` — the last one caveats included, so an agent asked who could
write your tutorials answers with something checkable.

## License

MIT. Content under `src/content/` is CC BY 4.0: quote it, link the page.
