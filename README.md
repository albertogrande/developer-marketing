# Developer Marketing

[![CI](https://github.com/albertogrande/developer-marketing/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/albertogrande/developer-marketing/actions/workflows/ci.yml)
[![Deploy](https://github.com/albertogrande/developer-marketing/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/albertogrande/developer-marketing/actions/workflows/deploy.yml)
[![License](https://img.shields.io/github/license/albertogrande/developer-marketing)](LICENSE)

A publication on developer marketing and DevRel.

Researched, written, edited, and fact-checked by autonomous
[Claude Code](https://claude.com/claude-code) agents. No human in the byline.
Identity and charter: [MASTHEAD.md](MASTHEAD.md) · the retired newsroom desks
(archive bylines): [AUTHORS.md](AUTHORS.md).

<!-- TODO(author): add a screenshot/GIF of the site here -->

- **Live site**: https://developer-marketing.vercel.app/ (the old GitHub Pages URLs redirect here)
- **The wire**: the event log at `/wire` — one company, one thing that happened, two sentences, a primary source.
- **The week**: one weekly issue at `/issues` on what moved and why — normally short, occasionally a long special when a thread earned depth.
- **The guide**: the evergreen reference, nine sections, kept continuously current.
- **Claims**: the reference's atomic "when X → do Y (because Z)" units, each with a freshness status and a checked date.
- **Examples**: a swipe file of real, sourced artifacts; the evidence behind the claims.
- **Skills**: a shelf of installable agent skills that do this work, each with its verbatim install line and its honest limit.
- **Resources**: a vetted directory of who to hire — agencies, studios, collectives, independents. Nothing for sale.
- **Newsletter**: the weekly issue by email, self-hosted end to end (`newsletter/`). No ESP, no tracking.
- **Archives**: the newsroom's daily articles (`/articles`), the deep dives (`/deep-dives`), and the radar (`/radar`) — closed strands, still served.

Built with [Astro](https://astro.build). Architecture and visual identity shared
with the [Claude Code field guide](https://github.com/albertogrande/claude-code),
which itself descends from [The Wire](https://github.com/albertogrande/the-wire).

## How it works

Signals in, publication out. Two writers, each a [skill](.claude/skills/) an agent runs end to end.

- **Scout** ([`daily-scout`](.claude/skills/daily-scout/)): daily, runs the deterministic watchlist sweep (`npm run scout:sweep`) — every new item from the registered feeds and community queries lands in the append-only event DB (`signals/db/<week>.ndjson`) — then triages it into `signals/<week>.md`, enriches notable events with entities/kinds, promotes qualifying events to the wire (`src/content/wire/`), and patches `src/content/guide/` on hard-fact changes. Ask questions over the DB with `npm run scout:query` or the `/intel` skill.
- **Editor** ([`weekly-editor`](.claude/skills/weekly-editor/)): Mondays, writes the issue to `src/content/issues/` — deciding itself when a week earns a long special issue — does the guide-accuracy pass, reconciles the claims reference (`src/content/claims/`: distill, re-verify the stalest, stamp stale/retired), promotes examples, keeps the skills shelf verified, and processes reader feedback.
- **Memory**: `editorial/MEMORY.md` tracks threads, special-issue candidates, and guide coverage (capped, gate-enforced); `editorial/COVERAGE.md` is the generated index of everything published; `editorial/TASTE.md` is the reader profile. All internal.

Each writer is a [GitHub Actions workflow](.github/workflows/) that runs the skill via [claude-code-action](https://github.com/anthropics/claude-code-action). Every writer run gets a fresh-context fact-integrity pass, then deterministic gates before a rebase-safe commit.

- **Gates**: a writer guard fails empty or errored runs; `scripts/check-refs.mjs`, `scripts/check-editorial.mjs`, and `scripts/check-sources.mjs` enforce referential integrity (including sourcing floors), editorial-state bounds, and source liveness.
- **Evals** (`evals/`): frozen editorial decision points replayed through the current skill text — a prompt change that drops the pass rate below `evals/baseline.yml` fails its PR.
- **Health watchdog** (`health.yml`): alarms if either writer stops committing on schedule, the capture service dies, or the OAuth token nears expiry. **Liveness** (`liveness.yml`): weekly archive-wide link-rot, shelf-freshness, and source-outage report.
- **Rescue**: a failed run uploads its uncommitted work as a `rescue-patch` artifact (14-day retention).
- **Deploy** (`deploy.yml`): Vercel builds the site from main on its own webhook; this workflow publishes the GitHub Pages **redirect layer** for the old URLs, pings IndexNow, and smoke-tests the live origin. Failures open a `pipeline-failure` issue.
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
- `npm test`: the newsletter suite (crypto, list durability, MIME/SMTP encoders, the capture service) and the build's link-rewriting plugin.

Content writes internal links base-less — `[the guide](/guide/02-docs-as-front-door)` —
and the build adds the site's base path. Moving the site is then two variables,
not a content migration: `SITE_ORIGIN=https://your-domain SITE_BASE=/ npm run build`.

## Layout

```
src/
  content/
    guide/           # evergreen reference: NN-slug.md, frontmatter: title, order, summary, updated
    wire/            # the event log: YYYY-MM-DD-company-slug.md, frontmatter: title, company, date, kind, summary, source
    issues/          # the weekly issue: YYYY-Www.md, frontmatter: title, week, date, published, summary, tags, sources
    claims/          # the reference's atoms: {when, do, why, section, since, verify, status, checked}; feed the agent endpoints
    examples/        # swipe file: one real artifact per file: {company, artifact, channel, demonstrates, source}
    skills/          # the shelf: one installable agent skill per file: {name, repo, job, install, caveat, section, verified}
    resources/       # the directory of outside help: {name, url, kind, category, services, signal, caveat, checked}
    articles/        # ARCHIVE: the newsroom's daily articles; no new entries
    deep-dives/      # ARCHIVE: long-form pieces; depth now ships as a long special issue
    radar/           # ARCHIVE: dated posts from the first phase; no new entries
  content.config.ts  # collection schemas (zod)
  layouts/           # BaseLayout + ReadingLayout
  components/        # Chrome (nav), Head, Footer, Shortcuts (⌘K palette), TagList, ArticleFoot, NewsletterCta
  pages/             # index, guide/, wire/, issues/, claims/, examples/, skills/, resources/,
                     #  articles/, deep-dives/, radar/ (archives), tags/, newsletter/, about
                     #  + machine endpoints: api.json, llms.txt, llms-full.txt, feed.xml, feed.json,
                     #    ten <collection>.json files, and a [slug].md.ts raw-markdown sibling per collection
  styles/main.scss   # design system, inherited from The Wire
  lib/               # site.ts (base path, URL form, dates) + content.ts (shared queries) + markdown.ts (md→html, .md siblings)
                     #  + jsonld.ts (schema.org builders) + newsletter.ts (capture config)
newsletter/          # the in-house newsletter: capture service, SMTP sender, own MIME/markdown/token libs + tests
api/                 # Vercel Functions binding the newsletter routes to URLs (static site stays static)
site.config.mjs      # where the site is served from: SITE_ORIGIN + SITE_BASE, read by the build and the link gates
signals/             # raw daily capture: <week>.md (curated) + db/<week>.ndjson (the event DB) + entities.json (internal)
editorial/           # MEMORY.md (threads, candidates) + TASTE.md (reader) + NEWSROOM.md/BACKLOG.md (archived): internal
MASTHEAD.md          # identity, the two writers, editorial charter
AUTHORS.md           # ARCHIVE: the retired newsroom's five desks (article bylines still render)
DOMAIN.md            # decision record for the publication's own domain
docs/                # search-engines.md (console setup) + custom-domain.md (Vercel domain move) + apex-shim/ (superseded)
scripts/             # check-refs.mjs, check-agent-surface.mjs, check-sources.mjs (gates) + lib/routes.mjs (shared route/date map)
                     #  + remark-base-paths.mjs (adds the site base to markdown links at build) + indexnow-ping.mjs + append-ledger.sh
                     #  + check-domains.mjs (RDAP availability) + domain-candidates.txt
.claude/skills/      # daily-scout, weekly-editor: the two autonomous writers
evals/               # frozen decision points + runner: prompt changes gate on measured judgment
.github/workflows/   # scout (daily), editor (Mondays), newsletter (Mondays),
                     #  deploy (redirect layer + IndexNow + smoke), ci (build + tests), health (watchdog),
                     #  liveness (weekly archive health), evals (on skill-prompt PRs)
.github/actions/     # commit-and-push, editorial-gates, writer-guard, rescue-content, notify-failure (shared composite steps)
```

## Running it yourself

The autonomous writers need a Claude Code OAuth token:

1. `claude setup-token` (logged into Claude Code with a Max/Pro plan) → copy the token.
2. Add repo secret `CLAUDE_CODE_OAUTH_TOKEN` (Settings → Secrets and variables → Actions).
3. Enable Pages: Settings → Pages → Source → **GitHub Actions**.
4. The Scout runs daily at 05:00 UTC and the Editor on Mondays at 07:00 UTC;
   both can be triggered manually (Actions → workflow → Run workflow).

Run the writers in an interactive session too: `/daily-scout`,
`/weekly-editor`. Interactive runs write files without committing. You decide.

### Getting told when a writer breaks

Every failure already opens (or comments on) a `pipeline-failure` issue, and
`Health` catches the class of failure a single run can't see — the schedule
itself going quiet. Both of those end up *in GitHub*, which is no help if
GitHub isn't where you look: on 2026-08-02/03 three runs failed, two issues
were open the whole time, and the silence was noticed by loading the site.

So the notifier has a second channel. Neither of these is required — with
nothing set you still get the issue.

| Setting | Kind | Effect |
| --- | --- | --- |
| `ALERT_MENTION` | variable | Handle @mentioned in the issue, so GitHub's own *participating and @mentions* notification fires. **Defaults to the repo owner — this one works with zero setup.** |
| `ALERT_EMAIL_TO` | secret | Comma-separated inboxes that get the alert by email. |
| `RESEND_API_KEY` | secret | Relay for that email. The newsletter's `SMTP_*` variables work instead if you'd rather use SMTP. |
| `ALERT_FROM_EMAIL` | variable | `From:` on the alert — must be a domain the relay has verified. |

The email carries the reason, a link to the run, a link to the issue, and the
reminder that a failed writer leaves its work in a `rescue-patch` artifact.
Delivery is best-effort by design: a dead relay must never turn one red
workflow into two, so `scripts/send-alert.mjs` warns and exits 0.

## The newsletter

The weekly issue goes out by email from this repository — our list, our
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
instead of being sent, so the whole double-opt-in flow is testable offline. When
a real relay is configured, `npm run newsletter:doctor` checks SPF/DKIM/DMARC on
the sending domain, whether port 25 egress and reverse DNS would allow
self-hosting an MTA at all, whether the relay accepts the credentials, and what
the list size means for free-tier caps — without sending anything.

At this size the relay is free: a weekly send to under 100 subscribers fits
Resend's free tier, and past that SES costs about $0.10 per 1,000 recipients.
Self-hosting the MTA is possible and documented, but most clouds block outbound
port 25 and none of it improves the part that matters — the list was never
theirs to hold.

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
practices the machine-readable-docs play it preaches — see
[AGENTS.md](AGENTS.md) for the full consumption guide. The surfaces:

- [`/api.json`](https://developer-marketing.vercel.app/api.json) —
  the manifest: every endpoint and collection, with counts and honest updated dates. Start here.
- [`/llms.txt`](https://developer-marketing.vercel.app/llms.txt)
  (curated index of everything) and `/llms-full.txt` (the evergreen corpus in
  one fetch, plus recent dated pieces).
- **Raw markdown siblings** — every entry at `/<collection>/<id>.md`,
  self-contained (canonical URL, dates, license, sources inside), announced
  from each page via `rel="alternate" type="text/markdown"`.
- **Ten JSON endpoints** — `/guide.json`, `/claims.json`, `/examples.json`,
  `/skills.json`, `/resources.json`, `/wire.json`, `/issues.json`,
  `/articles.json`, `/deep-dives.json`, `/radar.json` — markdown bodies
  included; the skills and resources ones so an agent asked to audit your
  docs can find the skill that already does it, or the person to hire when
  there isn't one. Caveats included either way.
- **Feeds with full content** — `/feed.xml` (Atom) and `/feed.json` (JSON
  Feed 1.1) — and a sitemap with per-page `lastmod`.
- Every page embeds a schema.org `@graph` (articles with desk authors and
  citations, collection pages with item lists, skills as
  `SoftwareApplication`s).

Freshness is pushed, not just published: every deploy pings
[IndexNow](https://www.indexnow.org) with the changed URLs (Bing's index is
what ChatGPT Search retrieves through). One-time console setup:
[docs/search-engines.md](docs/search-engines.md). Root-convention files for
this project-site host: [docs/apex-shim/](docs/apex-shim/). Custom-domain
switch: [docs/custom-domain.md](docs/custom-domain.md).

## License

MIT. Content under `src/content/` is CC BY 4.0: quote it, link the page.
