# Backlog — deferred engineering work

Things worth fixing that were deliberately left out of scope, so they stop
being rediscovered. Internal, not rendered on the site.

This exists because the notes were already being written and were still being
lost. On 2026-08-16 the scout recorded two defects — a stdin crash in
`scout-enrich.mjs` and a source it read as returning index pages instead of
posts — each as a clause inside a 400-word sourcing note in
`signals/2026-W33.md`. Both were captured, dated and specific. Neither was
ever going to be read again. A deferred fix needs a destination, not a
mention — and a destination is also where a diagnosis gets re-checked: one of
those two, once someone finally did, turned out to be wrong (see Done).

Not to be confused with `editorial/BACKLOG.md`, which is the archived
article-idea pool from the retired daily tier. This file is about the code.

**How to use it.** One line per item, newest first, in this shape:

```
- [<path or workflow>] What is wrong, and the workaround if there is one.
  Found <YYYY-MM-DD> (<where it surfaced>).
```

Add freely — scout, editor, or a human. The bar is a *specific* defect with a
path attached, not a vague improvement: "`scout-enrich --patch -` throws
ERR_INVALID_ARG_TYPE" belongs here, "sourcing could be better" does not. Move
an item to **Done** with its fix date and commit when it lands; never delete
one, so the record of what was known and when survives.

Nothing gates this file. It is worth exactly what gets written into it.

## Open

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

- [.github/workflows/recover.yml] The `allowed_bots` fix cannot be verified
  until the next *scheduled* writer failure. A manual `workflow_dispatch` runs
  as a human actor and does not exercise the bot path at all, which is why the
  gap survived a full day of green manual runs. Worth confirming the first time
  a scheduled run fails, rather than assuming.
  Found 2026-08-17 (run 31992479909).

- [.github/workflows/editor.yml] `Editor.writer` reached its 90-turn cap
  (94 turns, 1 of 1 runs) and shipped only because `tolerate_max_turns` let a
  truncated run through — the exact condition `writer-guard`'s own warning says
  not to leave standing. Either raise the cap or cut the work per turn; check
  with `node scripts/ledger-report.mjs --days 14` once there are more runs.
  Found 2026-08-17 (usage ledger).

- [editorial/MEMORY.md] At 130 lines against its declared ~140-line cap;
  `check-editorial.mjs` is already warning. Due a prune at the next weekly
  pass, before the graded warning becomes a hard stop.
  Found 2026-08-17 (`npm run check`).

## Done

- [scripts/scout-enrich.mjs] The three `-` (stdin) modes threw
  `ERR_INVALID_ARG_TYPE`: `readFile(0, 'utf8')` cannot take a descriptor. Reads
  the stream now, refuses two `-` flags in one run, and reports empty or
  malformed input as the documented exit 1 instead of an unhandled rejection.
  `scripts/scout-enrich.test.mjs` pins all four cases; they fail against the
  old code.
  Found 2026-08-16 (`signals/2026-W33.md`). Fixed 2026-08-18 (1565b16).

- [actions] Every GitHub-owned action was on a node20 major and being
  force-run on Node 24. checkout, setup-node, cache and upload-artifact are on
  `@v5` — the runtime bump and nothing else; the later majors were read and
  deliberately not taken (checkout v6 relocates the persisted credentials the
  writers' push depends on). `deploy-pages@v4` was node20 in its own right and
  `upload-pages-artifact@v3` nested a node20 upload, so both went to `@v5` too,
  which is what actually silences deploy.yml.
  Found 2026-08-17 (annotations on every workflow run). Fixed 2026-08-18
  (759e6a8).

- [scripts/lib/scout-sources.mjs] **Not a defect — the entry was wrong.** The
  `leerob` job is a sitemap job, not a crawl, and the slugs it returns are
  posts: `/rust` is "Rust Is Eating JavaScript", `/agents` is "Coding Agents &
  Complexity Budgets", `/developer-marketing` is "On Developer Marketing".
  leerob.com publishes at bare topic-shaped slugs, which is what made them read
  as tag indexes. Re-checked 2026-08-18 by running the registered
  include/exclude against the live sitemap: 68 locs in, 17 kept, every one a
  post. The `/bio`-style non-posts named in the report were excluded by 7164df6
  four days after it was written. Nothing to fix; the standing caveat is
  unchanged — the sitemap restamps every `<loc>` with the build time, and only
  cross-week dedupe keeps that from re-appending the back catalogue.
  Found 2026-08-14 (`signals/2026-W33.md`). Closed 2026-08-18.
