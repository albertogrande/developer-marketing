# Backlog — deferred engineering work

Things worth fixing that were deliberately left out of scope, so they stop
being rediscovered. Internal, not rendered on the site.

This exists because the notes were already being written and were still being
lost. On 2026-08-16 the scout recorded two real defects — a stdin crash in
`scout-enrich.mjs` and a crawl job returning index pages instead of posts —
each as a clause inside a 400-word sourcing note in `signals/2026-W33.md`.
Both were captured, dated, and correctly diagnosed. Neither was ever going to
be read again. A deferred fix needs a destination, not a mention.

Not to be confused with `editorial/BACKLOG.md`, which is the archived
article-idea pool from the retired daily tier. This file is about the code.

**How to use it.** One line per item, newest first, in this shape:

```
- [<path or workflow>] What is wrong, and the workaround if there is one.
  Found <YYYY-MM-DD> (<where it surfaced>).
```

Add freely — scout, editor, or a human. The bar is a *specific* defect with a
path attached, not a vague improvement: "the `leerob` crawl job returns tag
index pages" belongs here, "sourcing could be better" does not. Move an item
to **Done** with its fix date and commit when it lands; never delete one, so
the record of what was known and when survives.

Nothing gates this file. It is worth exactly what gets written into it.

## Open

- [src/pages/index.astro] The front page's clearest statement of what the site
  is — "The state of the art in developer marketing" — sits in the `lead`
  ternary's **else** branch, so it has rendered exactly never since W28
  published. What a first-time visitor actually reads is: latest issue →
  Signals (labelled launch/release) → the guide third. The site says
  developer marketing in the masthead and shows a devtools news feed on the
  page. Deferred deliberately on 2026-08-19: the reader chose to fix the
  issue's angle first and re-look at the page once an issue written under the
  new angle test is the lead, since the lead *is* the issue's own headline.
  Re-open this if the W34/W35 issues land on-angle and the page still reads
  as an industry feed.
  Found 2026-08-19 (reader feedback: the issue and the site read as a weekly
  devtools summary rather than developer marketing).

- [scripts/scout-sweep.mjs] The four Reddit jobs cannot reach Reddit from CI:
  it blocks datacenter egress at the IP, not at the endpoint. Verified
  2026-08-18 — `www` and `old`, `/new.json` and `/new/.rss`, every User-Agent
  and Accept combination answer 403 direct, and the identical requests answer
  200 through an HTTP proxy. The sweep now uses `/new/.rss` (the only surface
  Reddit serves without a token, and it works wherever egress is not blocked,
  so a local `/daily-scout` run does capture the subreddits) and prints a note
  saying the CI block is permanent rather than transient. Two real fixes, both
  needing a decision and a secret: give the sweep an egress proxy, or register
  a Reddit API app and add OAuth client credentials. Until one lands, treat
  r/devrel, r/marketing, r/SaaS and r/ExperiencedDevs as dark in CI and do not
  describe the watchlist as covering them.
  Found 2026-08-18 (investigating why Signals skews to launches over
  developer-marketing discussion).
  **Update 2026-08-19: partially wrong — the block is not total.** The first
  CI sweep after the `/new/.rss` move (run 32212489274, commit 222e312)
  captured four Reddit events: r/SaaS ×3 and r/devrel ×1. r/ExperiencedDevs
  and r/marketing answered 429 that run, which is rate limiting, not the 403
  IP block. So `/new/.rss` does reach Reddit from CI at least intermittently;
  the proxy/OAuth fixes are still the durable answer, but "dark in CI" is no
  longer an accurate description of all four jobs. Re-measure across a few
  sweeps before rewriting this entry — one run is not a pattern.
  **Update 2026-08-22: the proxy path is wired.** `scripts/lib/proxy.mjs`
  routes every sweep fetch through `SCOUT_PROXY_URL` when the secret exists,
  and scout.yml passes it; setting that one secret is now the whole fix (the
  OAuth app remains the alternative if a proxy is unwanted). See the
  watchlist-sources entry below for the same-day verification.

- [alerting] `ALERT_EMAIL_TO` is not set on the repo, so `notify-failure`'s
  email leg has never sent anything — `send-alert.mjs` no-ops and says so in
  the log. The wiring is complete and correct (`secrets.ALERT_EMAIL_TO` →
  `alert_email_to` → the script); only the secret and a transport
  (`RESEND_API_KEY` or `SMTP_HOST`, plus an `ALERT_FROM` on a verified domain)
  are missing. Until then the sole notice of a failed desk is a GitHub issue
  on a repo nobody is watching closely, which on 2026-08-17 meant a 03:51 UTC
  failure was not seen by a human until 22:00.
  **Needs Alberto** (nothing else is blocking): a Resend API key or SMTP
  credentials, and a from-address on a domain the relay has verified, then
  `gh secret set ALERT_EMAIL_TO` / `RESEND_API_KEY` / `ALERT_FROM`.
  Found 2026-08-17 (run 31991640446 log).

- [routine: "Vigía del pipeline"] The daily watchdog correctly detected and
  diagnosed the 08-17 scout failure and prepared a fix branch, then could not
  deliver any of it: no write access to this repo from that session (the push
  was rejected, and `claude/fix-recover-bot-actor-block` never reached the
  remote), Gmail `enabledInChat: false`, and no GitHub API auth — so it fell
  back to scraping public HTML. Its diagnosis sat in a chat panel for eight
  hours. Give the session repo write access if it should open PRs, or accept
  that it is a diagnostician and fix the alerting above instead.
  **Needs Alberto**: a decision, best made after the alerting above works —
  notify-failure already diagnosed this same failure eleven hours earlier, so
  the routine may not be earning its slot once mail is arriving at 03:51 UTC.
  Found 2026-08-17.

- [watchlist sources] Reddit (r/devrel, r/marketing, r/SaaS, r/ExperiencedDevs),
  Bluesky's three saved searches, the Latent Space RSS feed and
  search-engine-land RSS all return HTTP 403 at the fetch layer, and have for
  roughly a month of consecutive runs. The scout reports it daily and captures
  nothing from any of them, so the community half of the watchlist is dark.
  Needs a real decision: fix the fetch (headers/auth/a different transport),
  swap the sources, or retire them from `scripts/lib/scout-sources.mjs` so the
  daily note stops carrying a block that nobody can act on.
  Found 2026-07-22 (recurring in every `signals/` sourcing note since).
  **Update 2026-08-22: resized and one secret from fixed.** A full source
  audit from a non-runner egress found every 403'd web source (Search Engine
  Land, mkt1, april-dunford, latent.space) answers 200 there — same UA, same
  URL — so the whole family is the Reddit IP block, not per-source breakage.
  The sweep and the podcast fetcher now route through `SCOUT_PROXY_URL` when
  the secret exists (`scripts/lib/proxy.mjs`, wired in scout.yml; no-op until
  then). **Needs Alberto**: any HTTP(S) proxy URL as the `SCOUT_PROXY_URL`
  repo secret — that one value unblocks Reddit and all four feeds at once.
  Separately, the audit resized the "silent for 3+ weeks" list from
  `scout:stats --health`: the eight practitioner sources registered 08-19
  (tomasz-tunguz, product-marketing-alliance, productled, reforge, markepear,
  draft-dev, april-dunford, mkt1) have only seen two CI sweeps, and the
  08-16 operator/changelog block (astro, deno, fly, mongodb, microsoft,
  railway ×2, sentry) parses clean with latest posts simply predating
  registration — quiet, not broken. A 08-22 dry run captured tomasz-tunguz
  and railway-changelog events on the first try. No source needs retiring on
  this evidence.

- [.github/workflows/recover.yml] The `allowed_bots` fix cannot be verified
  until the next *scheduled* writer failure. A manual `workflow_dispatch` runs
  as a human actor and does not exercise the bot path at all, which is why the
  gap survived a full day of green manual runs. Worth confirming the first time
  a scheduled run fails, rather than assuming.
  Found 2026-08-17 (run 31992479909).

- [editorial/MEMORY.md] At 138 lines (as of 2026-08-21) against its declared
  ~140-line cap; `check-editorial.mjs` is already warning. Due a prune at the
  next weekly pass, before the graded warning becomes a hard stop.
  Found 2026-08-17 (`npm run check`).

## Done

- [.github/workflows/{scout,editor}.yml] The commit-and-push `paths` lists
  didn't include root `BACKLOG.md`, so anything a CI writer appended here was
  written and then silently dropped at commit time — the 08-21 sweep's
  podcast-notes entry never reached the remote, exactly the loss this file
  exists to prevent. Both writers' paths now carry `BACKLOG.md`.
  Found and fixed 2026-08-21 (general health check).

- [editorial/podcasts/] Three 08-18 notes (Strapi/Coisne, PlanetScale/Dicken,
  the TAB episode) were saved under hand-shortened filenames instead of their
  transcript-cache stems; the 08-21 sweep rewrote them under the correct stems
  but couldn't delete the mis-named duplicates (`rm` blocked in its sandbox).
  This is the entry that sweep wrote and lost to the paths gap above.
  Duplicates verified byte-identical and deleted.
  Found 2026-08-21 (`signals/2026-W34.md`); fixed 2026-08-21.

- [.github/workflows/editor.yml] `Editor.writer` reached its 90-turn cap
  (94 turns, 1 of 1 runs) and shipped only because `tolerate_max_turns` let a
  truncated run through — the exact condition `writer-guard`'s own warning says
  not to leave standing. Cap raised to 120; re-check saturation with
  `node scripts/ledger-report.mjs` once more runs land.
  Found 2026-08-17 (usage ledger); fixed 2026-08-21.

- [actions] `actions/checkout@v4`, `actions/cache@v4`, `actions/setup-node@v4`
  and `actions/upload-artifact@v4` target Node 20 and are being force-run on
  Node 24, with a deprecation warning on every job. All four bumped to `@v5`
  (tags verified to exist upstream first).
  Found 2026-08-17 (annotations on every workflow run); fixed 2026-08-21.

- [scripts/scout-enrich.mjs] The `--patch -`, `--new-entities -` and `--add -`
  stdin modes threw `ERR_INVALID_ARG_TYPE` — `readFile(0, 'utf8')` was the
  culprit (the promises API refuses a bare fd). stdin is now drained as a
  stream; the temp-file workaround is no longer needed.
  Found 2026-08-16 (`signals/2026-W33.md`); fixed 2026-08-21.

- [scripts/lib/scout-sources.mjs] The `leerob` crawl job was recorded as
  returning only tag/category index pages. **Closed as a misdiagnosis**,
  verified 2026-08-21: the top-level slugs are the posts — `/rust` is "Rust Is
  Eating JavaScript", `/agents` is "Coding Agents & Complexity Budgets",
  `/heroku` is "The Story of Heroku". The URLs merely look like tag pages. The
  non-post slugs are already carried by the job's exclude list, and the
  every-deploy `lastmod` restamp is absorbed by cross-week dedupe (see the
  entry's own comment in scout-sources.mjs). No change made.
  Found 2026-08-14 (`signals/2026-W33.md`); closed 2026-08-21.
