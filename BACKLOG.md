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

- [alerting] `ALERT_EMAIL_TO` is not set on the repo, so `notify-failure`'s
  email leg has never sent anything — `send-alert.mjs` no-ops and says so in
  the log. The wiring is complete and correct (`secrets.ALERT_EMAIL_TO` →
  `alert_email_to` → the script); only the secret and a transport
  (`RESEND_API_KEY` or `SMTP_HOST`, plus an `ALERT_FROM` on a verified domain)
  are missing. Until then the sole notice of a failed desk is a GitHub issue
  on a repo nobody is watching closely, which on 2026-08-17 meant a 03:51 UTC
  failure was not seen by a human until 22:00.
  Found 2026-08-17 (run 31991640446 log).

- [routine: "Vigía del pipeline"] The daily watchdog correctly detected and
  diagnosed the 08-17 scout failure and prepared a fix branch, then could not
  deliver any of it: no write access to this repo from that session (the push
  was rejected, and `claude/fix-recover-bot-actor-block` never reached the
  remote), Gmail `enabledInChat: false`, and no GitHub API auth — so it fell
  back to scraping public HTML. Its diagnosis sat in a chat panel for eight
  hours. Give the session repo write access if it should open PRs, or accept
  that it is a diagnostician and fix the alerting above instead.
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

- [actions] `actions/checkout@v4`, `actions/cache@v4`, `actions/setup-node@v4`
  and `actions/upload-artifact@v4` target Node 20 and are being force-run on
  Node 24, with a deprecation warning on every job. Bump to `@v5` before the
  forcing turns into a failure.
  Found 2026-08-17 (annotations on every workflow run).

- [editorial/MEMORY.md] At 130 lines against its declared ~140-line cap;
  `check-editorial.mjs` is already warning. Due a prune at the next weekly
  pass, before the graded warning becomes a hard stop.
  Found 2026-08-17 (`npm run check`).

- [scripts/scout-enrich.mjs] The `--patch -`, `--new-entities -` and `--add -`
  stdin modes throw `ERR_INVALID_ARG_TYPE` on Node 20.20.2 — `readFile(0,
  'utf8')` is the culprit. Workaround: write the payload to a temp file and
  pass its path. Every enrich call is paying the workaround tax.
  Found 2026-08-16 (`signals/2026-W33.md`).

- [scripts/lib/scout-sources.mjs] The `leerob` crawl job returns 24 items that
  are all site tag/category index pages (`/rust`, `/agents`, `/bio`, …) rather
  than posts, so it contributes nothing to triage while still costing a source
  job every sweep. Needs a selector fix or removal.
  Found 2026-08-14 (`signals/2026-W33.md`).

## Done

_Nothing yet._
