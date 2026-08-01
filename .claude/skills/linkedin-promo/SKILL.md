---
name: linkedin-promo
description: Write the LinkedIn post that promotes one issue of The Week — thesis hook, sourced bullets, a pick from the shelf or swipe file, optional researched sections (voices, jobs), the falsifiable call, and the full-issue link — saved to editorial/linkedin/<week>.md. Use when asked to write the LinkedIn promo for an issue, optionally with a week id like 2026-W30.
---

# The Week — LinkedIn promo

You write the LinkedIn post that promotes one issue of The Week. The format
and its rationale live in `editorial/LINKEDIN.md` — read it first; this skill
is the procedure, that file is the taste. The post is written in **English**,
in the house voice (`editorial/TASTE.md`): short sentences, numbers over
adjectives, what happened → why it matters.

## Step 1 — Pick the issue

If the user named a week (e.g. `2026-W30`), use `src/content/weekly/<week>.md`.
Otherwise use the newest file in `src/content/weekly/`. If the target file
does not exist, stop and say so — never promote an unwritten issue.

Output: `editorial/linkedin/<week>.md`. If it already exists, stop and ask
before overwriting — the user may have already posted it.

## Step 2 — Derive the core from the repo (no research needed)

From the issue file:
- **Hook** — the issue's thesis, restated in one or two plain sentences. Not
  "The Week #N is live"; lead with the claim.
- **What moved** — 3–4 bullets distilled from the body, each carrying its
  primary-source URL from the issue. Preserve epistemic flags
  (vendor-claimed, single-sourced) — they are the brand.
- **One thing to watch** — compress the issue's closing call to one sentence.
  Keep it falsifiable and dated.

From the collections, pick ONE for "From the shelf / swipe file":
- a skill from `src/content/skills/` (include its `install:` line verbatim), or
- an example from `src/content/examples/` (include the artifact `source:` URL).
Choose whichever resonates with the week's theme; alternate types across weeks.

Links: build absolute URLs from `site.config.mjs` (`SITE_ORIGIN` + path,
currently `https://developer-marketing.vercel.app`). The full-issue link is
`<SITE_ORIGIN>/weekly/<week>/`. Never hand-write a different origin.

## Step 3 — Researched sections (optional, ceiling not quota)

These sections are dropped when empty — never padded.

- **Voices** (2–4): practitioner takes from the issue's window. Check the
  week's `signals/<week>.md` first (discussion-type entries often name
  people), then targeted WebSearch. Only quote pages you actually fetched;
  name + role + URL each. Note authors to tag when posting.
- **Jobs** (3–5): open developer-marketing / DevRel roles with location, and
  salary only when the listing states it publicly.
  - **Preferred source: the dev-marketing-jobs board** (the
    `albertogrande/dev-marketing-jobs` repo's public deployment). Fetch its
    server-rendered tabs — no auth or JS needed:
    `https://dev-marketing-jobs.vercel.app/` (marketing),
    `/product-marketing`, `/devrel`. Each row's payload has title, company,
    location, salary, posted date, and the external listing URL. Use the
    board's location gate as-is (EU-remote + Spain-based — it matches the
    audience), prefer roles posted in or near the issue's window, and fix the
    payload's occasional `$$` salary prefix to a single `$`. See
    "Jobs source" in `editorial/LINKEDIN.md`.
  - Fallback if the board is down: WebSearch + fetch each listing page to
    confirm it is open. No fetched page, no bullet.
- **People worth following** (occasional): only when the week's voices
  naturally build to it; verify each person's current role.

## Step 4 — Assemble and save

Follow the template in `editorial/LINKEDIN.md`. Hard rules:

- Every bullet resolves to a URL. No invented quotes, no unverified jobs.
- **No audience metrics, ever** (subscriber counts, views, likes — MASTHEAD
  rule 9: numbers we can't collect honestly, we do without).
- **Nothing is for sale** (rule 8): no affiliate or paid placement anywhere,
  including jobs. The PS promotes only our own free material (the guide).
- **CTA**: while the newsletter transport is undeployed
  (`newsletter/LAUNCH.md`), point to the web archive URL, not "subscribe by
  email". Flip once the domain + DKIM are live.
- Plain text that survives LinkedIn: no markdown headers or bold in the post
  body itself — LinkedIn renders none of it. Use `•` bullets and blank lines.

Write the file with a short frontmatter comment block (week, issue title,
date drafted, authors-to-tag list, any caveats such as "jobs unverified"),
then the post as plain text ready to paste.

Do **not** commit or push — tell the user where the file is.
