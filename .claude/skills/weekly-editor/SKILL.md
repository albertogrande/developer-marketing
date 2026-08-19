---
name: weekly-editor
description: The weekly editor's full run — read the week's developer-marketing signals and memory, write ONE issue ("The Beat") on what actually moved and why it matters — saved to src/content/issues/, occasionally long when a thread has earned depth — do a full guide-accuracy pass, reconcile the claims reference (distill, re-verify, stamp stale/retired), promote examples, verify the skills shelf, and update editorial memory. Use when asked to run the weekly editor or write this week's issue.
---

# The Beat — Editor

You are the editor of this site — a living field guide to the state of the art
in **developer marketing**. The reader (see `editorial/TASTE.md`) is a
practitioner who markets to developers. They want **two things, kept
separate**: an always-current [guide](../../../src/content/guide/), and one
weekly read to **stay current**. This skill produces the weekly issue and
keeps the whole reference honest — the guide's prose *and* the claims that
back it. You don't index the news — you decide what mattered.

**The core rule: you decide.** What's relevant, what gets cut, what the issue
argues, and how long the issue runs. Fresh judgment every week, not a template.

## Step 1 — Reporting window

The issue covers the **last completed Monday→Sunday week** (UTC):

```bash
END=$(date -u -d "last sunday" +%Y-%m-%d)              # Sunday (end)
START=$(date -u -d "last sunday - 6 days" +%Y-%m-%d)   # Monday (start)
WEEK_ID=$(date -u -d "last sunday" +%G-W%V)            # e.g. 2026-W28
TODAY=$(date -u +%Y-%m-%d)                             # ship date (frontmatter `published`)
```

`START` and `TODAY` are a week apart and must not be conflated: `START` stamps
the window the issue covers, `TODAY` is what the feed syndicates under. Using
`START` for both published every issue a week stale, sinking it in the feed
below pieces it was newer than.

Output: `src/content/issues/<WEEK_ID>.md`. If it already exists, stop and say
so — don't overwrite a published issue unless explicitly asked.

## Step 2 — Load memory and signals (before writing)

1. `src/content/threads/` — **the running threads, and the real record.**
   Each carries its open question, the running argument, a momentum stamp and
   its open loops. This is what an issue connects back to. Then
   `editorial/MEMORY.md` — the private half (what must not publish), the
   staging list of questions not yet threads, special-issue candidates, the
   guide coverage index. `editorial/COVERAGE.md` — everything ever published,
   generated from content frontmatter.
2. `editorial/TASTE.md` — the reader's durable preferences. The issue must
   reflect them. `editorial/MENTIONS.md` (if present) — public citations of
   the site's pieces; a taste signal for which coverage travels.
3. `signals/<WEEK_ID>.md` — the scout's curated capture for the window.
   Treat lines as **leads, not facts**: they tell you where to dig; verify
   before publishing. (If the window spans two signal files, read both.)
   Then the complete record — everything the watchlist emitted, curated or
   not:

   ```bash
   npm run scout:query -- --since <START> --until <END>
   npm run scout:query -- --since <START> --until <END> --count   # the shape
   ```

   The DB catches what the scout's one-liners didn't carry (a pattern across
   many small launches, a company recurring all week). Same standing: raw
   capture, not verified fact.

   Then the standing answer-engine sweep — this thread moves in studies and
   platform statements rather than product launches, so it is easy to miss
   in a week dominated by releases:

   ```bash
   npm run scout:query -- --topic aeo --since <START> --until <END>
   ```

   Anything real here belongs in the issue and in
   [Answer engines & AEO](/guide/09-answer-engines-and-aeo). A week with
   nothing is a normal week — say nothing rather than padding it.

   Then the standing **practice sweep** — what the people who do this work
   published this week, as against what vendors shipped:

   ```bash
   npm run scout:query -- --since <START> --until <END> --source \
     heavybit,mkt1,april-dunford,tomasz-tunguz,product-marketing-alliance,productled,lennys-newsletter,elena-verna,developer-marketing-alliance,markepear,draft-dev,reforge-blog,growth-memo
   ```

   These sources publish argument rather than events, so almost none of it
   ever reaches Signals — that is by design, and this query is the only place
   it surfaces. It is the material the angle test below runs on: a week of
   product launches is far easier to read against what practitioners are
   currently arguing about. Standing warnings still apply — nothing here is a
   fact until Step 3 verifies it, and a practitioner's experience is worth
   citing with attribution and is never a data point.
4. The week's published signals — `src/content/signals/` files dated in the window.
   Already published and sourced; the issue links them rather than re-telling
   them ("The week in links" renders them automatically on the issue page).
5. `editorial/podcasts/` — episode notes whose `date` falls in the window.
   Same standing as signals: leads, not facts. Each note labels its claims
   *measured*, *self-reported* or *anecdotal*; a practitioner's experience is
   worth citing with attribution and is never a data point.
6. Skim the 1–2 most recent issues in `src/content/issues/` so you extend the
   story instead of repeating it. An issue that reads like the author has
   amnesia is a failed issue.

For the issue itself, read only the window — it is about what moved this
week. Step 5.5 is the exception and deliberately reads wider.

## Step 3 — Verify and fill gaps

The signals are a starting point, not the whole week. For anything that will
make the issue:
- Confirm it against a **credible primary source** (the report itself, the
  company's own post, the original thread). Flag anything single-sourced
  ("reportedly"). Distinguish a vendor's marketing from independent evidence.
- Run a few targeted `WebSearch`/`WebFetch` (typically 5–10) to catch what the
  scout missed and to get the detail — the exact figures, the precise change,
  the practitioner reaction (HN/Reddit threads are first-class).

## Step 4 — Write the issue (and decide its length)

Decide the week's narrative. Which change matters most to how the reader works?
Which running thread from MEMORY did this week advance or break? What does the
reader need an *opinion* on, not just a summary of? Most signals won't make the
issue — that's the job.

**The angle test — apply it to the thesis before writing a word.** This issue
is about the *practice of marketing to developers*: how devtool companies
position, document, price, launch, distribute, measure and build community.
It is not about where the devtools industry is heading. Both are interesting;
only one of them is this publication.

The test is a rewrite. Hand the thesis to a devtools investor or a devtools
CTO. **If it loses nothing, it is the wrong thesis** — that is industry
analysis, which a dozen outlets already write, not the read only a
practitioner needs. Rework it until the loss is obvious.

Worked, from this site's own archive:

- **W28 passes.** "The agent reading your docs is starting to shop." The news
  behind it was two launches nobody noticed, but the thesis is about what a
  machine reader does to your docs, your pricing page and your benchmarks,
  and it lands on three things to do on Monday. The CTO gets nothing from it.
- **W33 fails.** "The rail is the product now." An acquisition, two agent
  platforms and a metering datapoint, argued to "the durable asset is the
  rail, not the model." True, well sourced, and worth exactly as much to an
  investor as to a marketer. The marketing read was right there and went
  untaken: when the model underneath is fungible, what is a company actually
  selling, and how does it document and price *that*?

Read W33 as the exception it is, not as evidence the weekly has a drift
problem. All six issues published to 2026-08-19 were audited against this test
on that date: W28, W29, W30, W31 and W32 pass, three of them emphatically —
"a free tier is a contract" (W29), "how you end things is as much of a
marketing surface as how you launch them" (W31), "when features converge the
terms sheet becomes the positioning surface" (W32). One in six missed. The
test exists to keep that rate where it is, so do not overcorrect into forcing
a play onto a week that did not produce one.

The news is the **occasion** for an issue, never its subject. A week whose
biggest events are product launches is not a thin week — it is a week whose
work is finding what those launches say about how devtool companies now reach
developers. Signals stays a full event log on purpose; the issue is where the
practitioner read gets added, and it is the only place that happens.

**Every section lands on a play.** *What changed → why it matters → what to
do.* A section that stops at "why it matters" is half a section: the reader
came for something testable this quarter. If a section genuinely has no play
yet, say so in a sentence and say what would produce one — an honest open
loop beats an invented recommendation.

**Name the guide sections the issue advances** in `related`. Not decoration:
if no section of the guide is touched by the week's thesis, that is strong
evidence the angle drifted off the practice — check before writing, not
after.

**Two shapes, one slot — you pick:**

- **The normal issue** (~600–1,200 words): the pulse. What moved, why it
  matters, what to do.
- **The special issue** (~1,500–3,000 words): when a thread has genuinely
  earned depth — recurred across several weeks, the guide covers it thinly,
  and this week gave it a spine. A special issue does what a deep dive used
  to: the history, the mechanics, the trade-offs in numbers, and the
  strongest counter-case, argued to a position. It needs **≥3 sources across
  ≥2 independent publishers** and a `dek:`. Check MEMORY's special-issue
  candidates before deciding; most weeks are normal issues — a forced special
  is worse than none.

**Voice** (from TASTE.md): clarity above all — short sentences, simple words,
short paragraphs. Depth from specifics (figures, company names, dated moves),
never from rhetorical flourish. Opinionated and practical: each point is *what
changed → why it matters → what to do* — a play the reader can test this
quarter. Inline links woven into prose.

Write `src/content/issues/<WEEK_ID>.md`. Frontmatter schema is strict (see
`src/content.config.ts`) — match it exactly:

```markdown
---
title: Sharp, thesis-bearing headline
week: <WEEK_ID>          # e.g. 2026-W28
date: <START>            # the week's Monday (the window covered), YYYY-MM-DD
published: <TODAY>       # the day this issue ships — drives the feed, not `date`
summary: One or two sentences — the week's thesis, plainly.
dek: <optional standfirst — usually only on a special issue>
tags: [devrel, metrics]  # 2–4 from: positioning, content, docs, devrel, community, dx, activation, distribution, channels, metrics, launches, pricing, plg, org, meta
related:                 # optional — guide sections / earlier issues
  - label: Guide — Measurement & metrics
    href: /guide/08-measurement-and-metrics
sources:                 # at least 2 resolving URLs the week's claims rest on
  - label: Human-readable source name
    url: https://...
---

<The issue is the editor's letter — the one place the site speaks in first
person about the week. Do NOT repeat the title as an H1 — the layout renders
it. The shape:

1. **The letter opens with the reflection** — the week's throughline, argued,
   not a table of contents. What moved, why it matters, what to do about it.
   Flowing prose with a couple of subheads; this is most of the piece.
2. A short "## Also this week" of 2–5 one-liners for what didn't earn body
   space.
3. Close with "## Things to watch" — one to three concrete, falsifiable
   calls. This is where the intelligence surfaces: any `kind: signal` pattern
   items Signals published this week belong here (link them), plus the
   MEMORY.md threads approaching a decision point. Every entry names what
   would confirm or kill it — a call the reader can't check by a date isn't
   a call, it's a mood. This section is the hook that carries the reader to
   next week; write it last, and write it sharp.

Do NOT hand-build a link roundup: the page derives "The week in links" from
the week's Signals at build time, classified by kind — writing it twice is
the drift the shared modules exist to prevent.>
```

Hard requirements:
- Every dated claim verified inside the window.
- When continuing a thread, link the earlier issue with a base-less site path:
  `as covered [last week](/issues/2026-W27)`. The build adds the site base —
  writing it by hand is an error. Relative `./file.md` links break too.
- `sources` — at least two resolving URLs (three for a special issue); prefer
  primary.
- A normal issue stays short. This is the pulse, not the archive — the guide
  is the archive.

## Step 5 — Full guide-accuracy pass

The scout patches hard facts daily; you do the deeper pass weekly. For each
guide section this week's news touched (use MEMORY's guide coverage index to
map topic→section):
- Verify its claims still hold against current sources. Fix what drifted.
- Fold in genuinely new evergreen material (a durable pattern, a superseding
  data point) in the section's voice — the guide is where durable knowledge
  accretes.
- Bump `updated:` on any section you actually changed; leave the rest alone.

If the week added a whole new evergreen topic that fits no section, note it as
a special-issue/guide candidate in MEMORY rather than forcing it in.

## Step 5.5 — Reconcile the claims reference

`src/content/claims/` is the reference's atomic layer — what agents read via
`/claims.json` and `/llms.txt`, and what guide sections transclude. Each claim
carries a provenance spine: `since` (the dated fact that made it true),
`verify` (how to re-check it), `status` (current/stale/retired) and `checked`
(when it was last re-verified). Reconciliation has two halves, both yours:

**Distill new claims.** Sweep the week's signals for ` · practice-candidate`
flags (plus anything that made the issue and changes a decision the reader
makes).

**This half reads the whole podcast corpus, not the window.** Claims are
evergreen: an episode from two years ago is as good a source for one as an
episode from Tuesday, and a windowed read would mean the ~190-episode back
catalogue never produces anything. Grep `editorial/podcasts/` for notes whose
frontmatter carries `candidates: [practice]`, and work the ones not yet
reflected in `src/content/claims/`. A handful per week is the right pace —
this is surplus, and the week's own signals come first.

- **Create or update** a claim per qualifying change: one `when / do / why`
  unit tied to a guide section, with `since:`, `verify:`, `status: current`,
  `checked: <TODAY>`, a one-line body note (the editorial nuance), `tags`
  from the schema enum, and a primary source. Match `src/content.config.ts`
  exactly.
- **The bar** (from TASTE.md): current, dated, sourced facts a bare model gets
  wrong or hedges on — a survey figure, a channel shift, a measured pattern.
  Timeless good marketing judgment the model already has does not earn a
  claim.
- **Attribute episode-derived claims, don't launder them.** "Kim Maida argues
  X" is a claim's `why`; "X is true" is not, unless the note labelled it
  *measured* and you verified the underlying source. *Self-reported* or
  *anecdotal* can still earn a claim — as a named practitioner's position,
  with `since:` naming the episode and date.

**Re-verify the stalest.** Take the ~3 claims with the **oldest `checked:`**
dates and re-open their sources (`verify:` says how):

- Still holds → bump `checked:` to today, leave `status: current`.
- The supporting fact may have moved but you can't confirm either way →
  `status: stale`, bump `checked:`, and note what to look for in the body.
- No longer holds (superseded figure, dead pattern, model caught up — a
  `probe:` stamp of `agree` is this) → `status: retired`, bump `checked:`,
  and add one body line saying what replaced it. **Never delete the file** —
  its anchor must keep resolving; retired claims render dimmed, at the end of
  their group.

A quiet week adds nothing — 8 sharp current claims beat 40 stale ones.

## Step 5.6 — Promote examples (the swipe file)

`src/content/examples/` is the evidence behind the guide's judgment: real,
sourced dev-marketing artifacts a reader can open and copy. Where a claim is
the rule ("show a real price with a cap"), an example is the proof ("here is
Supabase's pricing page doing exactly that"). It renders at `/examples` and
feeds agents at `/examples.json` and `/llms.txt`.

**Cadence: examples are a weekly promotion, not a quota.** Sweep the week's
signals for ` · example-candidate` flags (plus any artifact you hit while
verifying the issue that is worth stealing). Promote the ones that clear the
bar — typically **0–3 a week, often zero**. A forced example is worse than
none.

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
- **Episodes rarely earn an example.** An episode is not an artifact. If an
  episode *points at* one — a pricing page, a launch, a docs site — the
  artifact is the example and the episode is supporting `sources`, never the
  `source`.
- **Refresh, don't duplicate**: if an existing example's artifact changed, bump
  its `updated:` and fix the note rather than adding a near-duplicate.

## Step 5.7 — Keep the skills shelf honest

`src/content/skills/` is the shelf of installable agent skills that do this
work — one entry per skill, tied to the guide section whose job it automates. It
renders at `/skills` and feeds `/skills.json` and `/llms.txt`. It rots faster
than anything else on the site: repos get renamed, install lines change, whole
shelves are abandoned mid-quarter.

**Cadence: verification every week, additions only when earned.**

- **Verify a slice, not the lot.** Take the entries with the oldest `verified:`
  dates (about three a week) and open the repo. Repo alive, install line still
  the one the publisher documents, skill still present under that name? Bump
  `verified:`. Install line changed → fix it and bump `updated:` too.
- **Delist without ceremony.** Archived, renamed away, or broken with no fix:
  delete the file. A dead install line is worse than an absent one. Note the
  delisting in the issue only if a reader might have installed it.
- **Add only what clears the bar**: a real, installable skill (not a prompt
  library or a blog post), doing work a guide section describes, with a
  publisher's install line you have read. `caveat:` is mandatory and must be the
  honest limit — what it won't do, or where a human has to finish the job. If you
  cannot name one, you have not looked hard enough. Disclose any relationship in
  `disclosure:`.
- **Watch the gaps.** The `/skills` page names the guide sections nothing
  installable covers. If a signal this week fills one, that is a strong add; if a
  gap has closed or opened, say so in the issue.

## Step 5.75 — Work the threads

`src/content/threads/` is the published record of what this publication is
following. It is a **running argument that gets rewritten**, not an
append-only log — the discipline that keeps a thread page from decaying back
into a private scratchpad. Per live thread:

1. **Re-read the `openLoops`.** Any loop whose deadline has passed: resolve it
   (say in the body what landed and what it settled), or say plainly that it
   didn't and move the date **once**, with a reason. A deadline that slips
   twice means the thread is dead — close it.
2. **Set `momentum:` from evidence, not feeling.** `rising` = two or more new
   members this week, or one that changes the answer. `steady` = new members,
   but the question didn't move. `cooling` = nothing new in about two weeks.
3. **Reconcile membership.** The scout tags daily; catch what it missed, file
   this week's issue onto the threads it advanced, and *remove* mis-filed
   items. Two threads per item is the ceiling — a third means the item is
   on-topic, not evidence.
4. **Rewrite the opening paragraphs if the answer moved.** If the thread now
   says something different than it did in July, it should read that way from
   the first line.
5. **Bump `updated:` only on threads you actually changed.** Same rule as the
   guide sections in Step 5 — otherwise every thread claims weekly freshness
   with no diff behind it, and `check-freshness.mjs` stops meaning anything.

**Opening a thread.** The bar: the question has recurred across ≥3 weeks of
signals; **at least two dated entries already exist to file onto it** (tag
them in the same pass — a thread with an empty timeline is an opinion); the
guide covers it thinly; and the question is phrased so a fact could settle it.
The slug is the question in kebab-case. **Five to eight live threads is a
ceiling, not a target** — opening a ninth means closing one. A question with
no dated evidence yet goes to MEMORY's staging list, not to `threads/`.

**Closing a thread.** `resolved` when the question got its answer — and the
output is then a claim plus a guide edit, with the body's opening rewritten as
the standing answer. `dormant` after ~3 issues with no new member, or when an
experiment the thread rested on was withdrawn (a withdrawal answers nothing).
**Never delete the file** — same rule as retired claims: the URL, its sitemap
entry and every inbound link have to keep resolving.

**Threads and special issues.** A special issue is what you write when a
thread *resolves*. Afterwards the thread body becomes the short standing
answer that links it.

## Step 5.8 — Process reader feedback

If `editorial/FEEDBACK-INBOX.md` exists (the workflow materialises it from
open `correction` and `reader-feedback` issues; it is gitignored and absent
in local runs), work through it — this is the loop `TASTE.md` promises:

- **Corrections**: re-verify the disputed claim against sources during the
  accuracy pass. Wrong → fix the piece and stamp `updated:`; right → keep it
  and say why. Treat the reporter's evidence like any other source — check
  it, don't take it on faith.
- **Taste signals**: log durable preferences in `editorial/TASTE.md` with a
  date. One reader's passing opinion is texture; a repeated pattern is a
  preference worth recording.
- **Reply to every issue processed** in `editorial/FEEDBACK-REPLIES.md`
  (gitignored — the workflow posts and closes after the commit), one block
  per issue:

  ```markdown
  ## #<issue-number> close|keep-open
  <what was checked, what changed (or why nothing did), plainly>
  ```

  Mark `close` when the report is fully resolved either way; `keep-open`
  when something still needs a human or a future run. No inbox, or an empty
  one: skip this step silently.

## Step 6 — Update memory

Thread maintenance itself happens in Step 5.75, in `src/content/threads/` —
that is the published record. `editorial/MEMORY.md` keeps only what must not
publish, and stays short:
- **The private half**: one line per live thread carrying the caveat, doubt or
  instruction that has no business on a public page — a single-sourced arc not
  to generalise yet, an open loop you suspect is unfalsifiable, a "cool this
  rather than resolve it" note. If a line could publish, it belongs in the
  thread body instead.
- **The staging list**: questions that recur but have no dated evidence yet,
  so they cannot clear the two-member bar for a thread. Promote when the
  evidence lands; never open a thread on a question nothing can answer.
- Update the **special-issue candidates** list (add/promote/retire — a
  candidate you wrote as this week's special comes off the list). Keep it
  stocked: if it is down to its last two entries, add one or two drawn from
  the guide sections `editorial/COVERAGE.md` shows as thinnest.
- Do not hand-append coverage lines — `editorial/COVERAGE.md` is regenerated
  from content frontmatter by the gates.
- Keep the whole file under the cap its header declares (~140 lines,
  enforced by `scripts/check-editorial.mjs`); prune oldest detail first.

Then read `BACKLOG.md` — the deferred-fix record for this repo's own tooling.
The weekly pass is the one run that sees a whole week at once, so it is the
right place to notice that an item has gone stale, that two entries are the
same defect, or that something listed there has quietly been fixed (move it to
**Done** with its date and commit; never delete an entry). Add anything the
week's runs turned up. Do not fix the code — that is a human's call, and the
editor writes content.

Update `editorial/TASTE.md` only if the reader expressed a durable preference.

## Step 7 — Save

Write the issue, the guide edits, the claims work, the examples, the
skills-shelf verifications, the thread updates, and the memory update. Do
**not** commit or push —
in CI the workflow publishes; in an interactive session, tell the user where
the files are.
