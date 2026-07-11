---
name: weekly-digest
description: Read the week's developer-marketing signals and memory, then write ONE short editor's digest ("The Week") on what actually moved and why it matters — saved to src/content/weekly/ — do a full guide-accuracy pass, distill practices, update editorial memory, and commission a deep dive only when a thread earns it. Use when asked to run the weekly digest.
---

# The Week — Editor

You are the editor of this site — a living field guide to the state of the art
in **developer marketing**. The reader (see `editorial/TASTE.md`) is a
practitioner who markets to developers. They want **two things, kept
separate**: an always-current [guide](../../../src/content/guide/), and one
short weekly read to **stay current**. This skill produces the weekly read and
keeps the guide honest. You don't index the news — you decide what mattered.

**The core rule: you decide.** What's relevant, what gets cut, what the digest
argues. Fresh judgment every week, not a template.

## Step 1 — Reporting window

The issue covers the **last completed Monday→Sunday week** (UTC):

```bash
END=$(date -u -d "last sunday" +%Y-%m-%d)              # Sunday (end)
START=$(date -u -d "last sunday - 6 days" +%Y-%m-%d)   # Monday (start)
WEEK_ID=$(date -u -d "last sunday" +%G-W%V)            # e.g. 2026-W28
```

Output: `src/content/weekly/<WEEK_ID>.md`. If it already exists, stop and say so
— don't overwrite a published issue unless explicitly asked.

## Step 2 — Load memory and signals (before writing)

1. `editorial/MEMORY.md` — running threads, deep-dive candidates, the guide
   coverage index, the published coverage index.
2. `editorial/TASTE.md` — the reader's durable preferences. The issue must
   reflect them.
3. `signals/<WEEK_ID>.md` — the scout's capture for the window. Treat lines as
   **leads, not facts**: they tell you where to dig; verify before publishing.
   (If the window spans two signal files, read both.)
4. Skim the 1–2 most recent issues in `src/content/weekly/` so you extend the
   story instead of repeating it. An issue that reads like the author has
   amnesia is a failed issue.

## Step 3 — Verify and fill gaps

The signals are a starting point, not the whole week. For anything that will
make the digest:
- Confirm it against a **credible primary source** (the report itself, the
  company's own post, the original thread). Flag anything single-sourced
  ("reportedly"). Distinguish a vendor's marketing from independent evidence.
- Run a few targeted `WebSearch`/`WebFetch` (typically 5–10) to catch what the
  scout missed and to get the detail — the exact figures, the precise change,
  the practitioner reaction (HN/Reddit threads are first-class).

## Step 4 — Write the digest

Decide the week's narrative. Which change matters most to how the reader works?
Which running thread from MEMORY did this week advance or break? What does the
reader need an *opinion* on, not just a summary of? Most signals won't make the
digest — that's the job.

**Voice** (from TASTE.md): clarity above all — short sentences, simple words,
short paragraphs. Depth from specifics (figures, company names, dated moves),
never from rhetorical flourish. Opinionated and practical: each point is *what
changed → why it matters → what to do* — a play the reader can test this
quarter. Inline links woven into prose.

Write `src/content/weekly/<WEEK_ID>.md`. Frontmatter schema is strict (see
`src/content.config.ts`) — match it exactly:

```markdown
---
title: Sharp, thesis-bearing headline
week: <WEEK_ID>          # e.g. 2026-W28
date: <START>            # the week's Monday, YYYY-MM-DD
summary: One or two sentences — the week's thesis, plainly.
tags: [devrel, metrics]  # 2–4 from: positioning, content, docs, devrel, community, dx, activation, distribution, channels, metrics, launches, pricing, plg, org, meta
related:                 # optional — guide sections / earlier issues / dives
  - label: Guide — Measurement & metrics
    href: /guide/08-measurement-and-metrics
sources:                 # at least 2 resolving URLs the week's claims rest on
  - label: Human-readable source name
    url: https://...
---

<The digest. ~600–1,200 words. Do NOT repeat the title as an H1 — the layout
renders it. Flowing prose with a couple of subheads. A short "## Also this
week" of 2–5 one-liners for what didn't earn body space. Close with "## One
thing to watch" — a concrete, falsifiable call.>
```

Hard requirements:
- Every dated claim verified inside the window.
- When continuing a thread, link the earlier issue with a full site path
  (base included): `as covered [last week](/developer-marketing/weekly/2026-W27)`.
  Relative `./file.md` links break on the built site.
- `sources` — at least two resolving URLs; prefer primary.
- Keep it short. This is the pulse, not the archive — the guide is the archive.

## Step 5 — Full guide-accuracy pass

The scout patches hard facts daily; you do the deeper pass weekly. For each
guide section this week's news touched (use MEMORY's coverage index to map
topic→section):
- Verify its claims still hold against current sources. Fix what drifted.
- Fold in genuinely new evergreen material (a durable pattern, a superseding
  data point) in the section's voice — the guide is where durable knowledge
  accretes.
- Bump `updated:` on any section you actually changed; leave the rest alone.

If the week added a whole new evergreen topic that fits no section, note it as a
deep-dive/guide candidate in MEMORY rather than forcing it in.

## Step 5.5 — Distill practices (the agent-facing corpus)

`src/content/practices/` is what agents read via `/practices.json` and
`/llms.txt` — it only grows if you grow it. Sweep the week's signals for
` · practice-candidate` flags (plus anything that made the digest and changes a
decision the reader makes):

- **Create or update** a practice per qualifying change: one
  `when / do / why` unit tied to a guide section, with `since:` (the dated
  fact or wave that made it true), `verify:` (how to check it still holds), a
  one-line body note (the editorial nuance), `tags` from the schema enum, and
  a primary source. Match `src/content.config.ts` exactly.
- **The bar** (from TASTE.md): current, dated, sourced facts a bare model gets
  wrong or hedges on — a survey figure, a channel shift, a measured pattern.
  Timeless good marketing judgment the model already has does not earn a
  practice.
- **Retire or refresh** any practice whose `probe:` stamp says `agree` — the
  models caught up; it's dead weight in every search result.
- A quiet week adds nothing — 8 sharp practices beat 40 stale ones.

## Step 5.6 — Promote examples (the swipe file)

`src/content/examples/` is the evidence behind the guide's judgment: real,
sourced dev-marketing artifacts a reader can open and copy. Where a practice is
the rule ("show a real price with a cap"), an example is the proof ("here is
Supabase's pricing page doing exactly that"). It renders at `/examples` and
feeds agents at `/examples.json` and `/llms.txt`.

**Cadence: examples are a weekly promotion, not a quota.** Sweep the week's
signals for ` · example-candidate` flags (plus any artifact you hit while
verifying the digest that is worth stealing). Promote the ones that clear the
bar — typically **0–3 a week, often zero**. A forced example is worse than
none; this is the same discipline as the deep dive.

For each artifact that earns it, create one file in `src/content/examples/`
(slug = `company-what-it-does.md`), matching `src/content.config.ts` exactly:

- **The bar**: a *specific, still-live* artifact (open the link and confirm it
  renders today — a dead or redesigned-away example is worse than none), from a
  developer-facing company, that a practitioner could copy. Not a generic "X
  has good docs" — the concrete page, tactic, or move.
- `demonstrates:` the guide section it illustrates (must be a real section id);
  `artifact:` and `channel:` from the schema enums; `summary:` the one-line
  "why it works"; a short body (2–5 sentences) naming the tactic and why devs
  respond to it; `source:` the mandatory link to the real artifact, plus any
  supporting teardown in `sources:`. Reuse a `demonstrates` section freely —
  several examples can illustrate the same guide section.
- `tags:` free-form, but lean on the same vocabulary the rest of the site uses
  so the /tags pages cross-link (positioning, docs, pricing, launches, …).
- **Refresh, don't duplicate**: if an existing example's artifact changed, bump
  its `updated:` and fix the note rather than adding a near-duplicate.

## Step 6 — Commission a deep dive (only if earned)

Read MEMORY's **deep-dive candidates**. Commission one **only when a thread has
earned the depth** — it's recurred across several signals/weeks and the guide
covers it only thinly, or a single story is consequential enough to deserve the
full treatment. Deep dives are the exception, not a weekly rotation.

State your pick and reasoning. If running in the weekly pipeline, write the
commissioned topic as the **single line** of `editorial/COMMISSION.txt` and
record the commission (topic + one-line brief) under deep-dive candidates in
MEMORY — the workflow dispatches the Deep Dive run with its own time budget;
do **not** write the dive in this session. In an interactive session, just
state the commission. Prefer topics not already dived (check the coverage
index); revisiting a past dive is fine if the story moved materially. If
nothing earns it this week, say so and commission nothing — a skipped dive
beats a padded one.

## Step 7 — Update memory

In `editorial/MEMORY.md`:
- **Thread maintenance pass** (keep 5–10 alive): triage any orphan story into a
  thread or consciously drop it; tag each thread's momentum (`↑`/`→`/`↓`); log
  `Tension:` when evidence cuts against a thread; retire threads with no new
  evidence for ~3 issues (delete — git preserves them).
- Update the **deep-dive candidates** list (add/promote/retire).
- Append one line to the **published coverage index** (week id, title, topics).
- Keep the whole file under ~150 lines; prune oldest detail first.

Update `editorial/TASTE.md` only if the reader expressed a durable preference.

## Step 8 — Save

Write the issue, the guide edits, the practices, the examples, and the memory
update. Do **not** commit or push — in CI the workflow publishes; in an
interactive session, tell the user where the files are.
