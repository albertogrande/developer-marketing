---
name: daily-scout
description: Daily developer-marketing capture — run the deterministic watchlist sweep into the event DB (signals/db/), triage it plus targeted searches into dated one-liners in signals/<week>.md, enrich notable events with entities and kinds, publish qualifying items to Signals (src/content/signals/), and patch the guide the moment a hard fact changes. Use when asked to run the scout or capture today's developer-marketing signals.
argument-hint: [optional focus, e.g. "DevRel metrics" or "docs-led growth"]
---

# The Scout — Daily Signals

You run the collecting desk for this site: a living field guide to the state of
the art in **developer marketing**. You are the **scout, not the editor**. Your
job takes minutes: capture what changed in the **last ~24 hours**, as raw dated
one-liners, and correct the guide only where a fact is now plainly wrong. No
essays, no synthesis — the weekly editor does that. The value is capture: a
report, a teardown, or a hot thread that's easy to find today is hard to find
by Monday.

Read `editorial/TASTE.md` first — it's who you're capturing for: a practitioner
who markets to developers and wants practical, testable, sourced things. Write
files only — the workflow commits.

## Step 0 — Orient

```bash
TODAY=$(date -u +%Y-%m-%d)                 # UTC calendar date
WEEK_FILE="signals/$(date -u +%G-W%V).md"  # current ISO week (UTC)
```

- Read the current `$WEEK_FILE` if it exists — **never duplicate** a signal
  already captured this week. Create it if missing (header below).
- Skim `editorial/MEMORY.md`: the running threads, the special-issue candidates,
  and the **guide coverage index** (which section owns which topic). This tells
  you what's already known and where a new fact belongs.

New week file header:

```markdown
# Signals — week <WEEK_ID>

Raw daily capture. One line per signal. Internal — input for the weekly
digest and the guide-refresh pass. Not rendered on the site.
```

## Step 1 — Sweep (the tool collects; you triage)

**Run the deterministic sweep first** — it fetches the whole watchlist (the
RSS/Atom feeds, the podcast feeds, Hacker News, Show HN, the subreddits,
Lobsters, Bluesky) and appends every new in-window item to the event DB
(`signals/db/<WEEK_ID>.ndjson`), whether or not anything is ever written
about it. That DB is the record that the day happened:

```bash
npm run scout:sweep -- --days 2
```

Read its triage report — that IS the sweep of the watchlist. The report also
lists unreachable sources (tolerated; a persistently dead feed is worth a
line in your report). The watchlist itself lives in
`scripts/lib/scout-sources.mjs`; adding coverage is an edit there, not extra
fetching here.

**Then spend your own budget where the tool can't go** — **4–8 fetches**,
now for depth, not discovery:

- Open the primary source behind anything you might promote (Step 3's rule:
  a source you opened).
- A broad `WebSearch` for `"developer marketing"`, `"developer relations"`,
  `"developer experience"` in the last day or two — the valve for what the
  watchlist misses. Rotate in `"answer engine optimization"`, `"AI search"
  developers` or `llms.txt` when the answer-engine beat has been quiet for a
  few days: that thread moves in studies and platform statements, which land
  outside devtools feeds. Log out-of-watchlist finds into the DB so the
  capture stays complete:

```bash
echo '[{"title":"…","url":"https://…","source":"websearch","summary":"…"}]' \
  | npm run scout:enrich -- --add -
```

- Public, fetchable sources only — skip login walls and paywalls.

**Enrich what matters.** For the events you triage as significant (promoted,
signal-worthy, or clearly part of a running thread), stamp the intelligence
fields — entities from `signals/entities.json` (register genuinely new ones
first with `--new-entities`), an `event` kind, topics:

```bash
echo '[{"id":"<id from the triage>","entities":["vercel"],"event":"deprecation","topics":["pricing"]}]' \
  | npm run scout:enrich -- --patch -
```

A handful of enriched events a day is plenty — enrich judgment, not the
firehose. Never edit `signals/db/*.ndjson` by hand; the tool validates so
the log stays replayable.

Entity coverage is not your job to solve by volume: `scout:query --auto`
already reaches every event whose own words name a registered entity. What
`entities` adds is the judgment a substring match can't — the event that is
*about* Vercel without saying so. Spend the stamps there.

**Topics are a closed vocabulary** (`TOPICS` in `scripts/lib/scout-sources.mjs`),
because a free-text field drifted into 38 slugs across 51 events in a
fortnight and made every topic filter quietly incomplete. The tool rejects an
unknown topic and resolves a retired one, so you do not need the list
memorized — but reuse before you extend, and extending is an edit to that
file, not a new string here.

The one to be deliberate about is **`aeo`**: anything about being found, read
or cited by answer engines and coding assistants (AI search visibility,
llms.txt, citation studies, crawl-to-referral data, AEO/GEO tooling). It is
what lets `scout:query --topic aeo` answer "what has moved in AI-search
visibility lately", so stamp it even when the event is filed under another
beat. `ai-search` and `crawlers` are retired into it.

**Podcasts — new episodes already land in the sweep's triage** (the sweep
reads the same `PODCASTS` registry the transcript pipeline uses). Your job is
the transcript-and-notes flow below, not re-fetching feeds.

**Transcripts, when the publisher provides one.** Run:

```bash
npm run podcast:transcripts -- --days 2      # every feed; --show <id> for one
```

It reads each feed's `<podcast:transcript>` tag, downloads the best format,
converts it to speaker-labelled text and writes it to `.cache/transcripts/`.
It prints one line per episode it could *not* transcribe, with the reason.

Two things to expect rather than treat as breakage: transcription **lags
publication** (Transistor covers 193 of 195 Scaling DevTools episodes, but not
the newest one or two), and shows marked `on-page` in
`scripts/lib/podcasts.mjs` put the transcript on the episode page instead of in
the feed — for those, fetch the episode URL the tool prints.

**Distil what you fetch, then drain a little of the backlog.** A transcript is
disposable; the note written from it is the lasting asset. After the sweep:

```bash
npm run podcast:transcripts -- --pending    # transcript available, no note yet
```

Write notes into `editorial/podcasts/` following the format in that directory's
`README.md` — topics, claims with timestamps and an honest label (measured /
self-reported / anecdotal), a couple of short attributed quotes, and what the
episode is *not* evidence for. Set `candidates:` in the frontmatter when the
episode could earn a claim or a special issue; the weekly editor greps that field
and never sees a note you leave unflagged. Omit it when the episode promotes
nothing, which is most of them. Filename must match what `--pending` expects
(same stem as the cached transcript, `.md` instead of `.txt`), because a note
existing is the only record that an episode is done.

Then take **up to three** backlog episodes per run, newest first. The back
catalogue is ~190 episodes and drains in a couple of months at that rate; do
not try to clear it in one sitting, and never let backlog work crowd out
today's sweep — the day's news is the job, the archive is the surplus. If the
sweep ran long, skip the backlog entirely and say so in the report.

**With a transcript you may quote; without one you may not.** A transcript is a
real, checkable source: quote a sentence or two, name the speaker, link the
episode. Everything else still applies — do not paste long passages into a
brief, do not commit a cached transcript, and do not treat a transcript as
site content. It is someone else's copyrighted work; `.cache/` is gitignored
for exactly that reason. Short attributed quotation is normal journalism;
reproducing the episode is not.

**Without a transcript you cannot listen, so never write as if you did.** You
have the title, the show notes, the guest and the links — that is all. The
brief says *what the episode covers*; it does not assert a figure stated in
audio nobody verified. If a number in the show notes is load-bearing, attribute
it inline ("the episode notes say…") or leave it out, and say in the body that
the item was summarised from the episode page.

Being on a good podcast is not itself news: an episode earns a brief when its
subject matters to a developer-marketing practitioner, and a strong engineering
episode on a general show often does not.

**If a show publishes no transcript at all** and an episode genuinely matters,
local speech-to-text is the fallback — [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
(MIT) or [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT) run
offline against the `<enclosure>` audio URL the tool already parses. It is
deliberately **not** wired into this skill or CI: a full episode costs real
CPU-minutes per run, and the shows that matter most here already give
transcripts away. Reach for it by hand for a specific episode, under the same
quoting rules, or propose adding it if a show becomes important enough to
justify the bill.

**Research & data:**

- **SlashData** developer economics, **State of Developer Relations** surveys,
  **Stack Overflow Developer Survey**, **GitHub Octoverse**, **DX / DevEx
  research** (Forsgren et al.).

**Answer engines (the AEO beat):**

- The watchlist carries this beat directly — **Search Engine Land**,
  **Growth Memo**, **SparkToro** and the **Profound** crawl, plus the
  `llms.txt` / `"answer engine"` / `"AI search"` HN queries. Most of what
  those sources publish is general-marketing SEO and is *not* for this site.
- What qualifies: a **measured** fact about machine-mediated discovery
  (citation studies, crawl-to-referral data, referral-conversion numbers), a
  platform changing the rules (a search or assistant vendor's official
  position on llms.txt, crawling, or citations), or a **devtool company**
  reporting its own AI-referral numbers or shipping for machine readers.
  Vendor visibility dashboards marketing their own category are not news;
  their *data*, with the incentive named, sometimes is.
- Stamp every one with the `aeo` topic, and hang the published ones off
  [Answer engines & AEO](/guide/09-answer-engines-and-aeo) in `related`.

**The money, campaigns and technology beats (feed the editor's angles):**

- **Money:** devtools funding rounds, acquisitions, valuations, and pricing
  changes — TechCrunch/press-release announcements, the company's own post,
  public filings. Capture the amount, stage, and investors when stated;
  label vendor-claimed numbers as such.
- **Campaigns:** a devtool launch, campaign, or piece of marketing making
  noise *right now* — a Launch Week, a Show HN doing numbers, an ad
  developers are discussing, a rebrand. Link the artifact itself, not just
  the commentary.
- **Technology:** a stack technology visibly gaining traction (protocols,
  databases, agent tooling, ML infra) — a launch, a big adoption story, a
  telling jobs/survey datapoint. The bar is adoption evidence, not noise.

**Community & discussion — the sweep already queried HN, Show HN, the
subreddits, Lobsters and Bluesky.** Your part: follow the triage into hot
comment threads when the discussion itself is the signal, and verify every
claim against a primary source before repeating it. If the sweep reported
Reddit/Bluesky unreachable (some networks 403 them), a manual WebFetch of
the same public endpoints is the fallback — log anything found via
`scout:enrich --add`.

Capture, in order of value to the reader:
1. **Plays & tactics** — a positioning, pricing, docs, launch, or channel move
   by a developer-first company that a practitioner could copy or must react to.
2. **Research & data** — new survey waves, reports, benchmarks with numbers.
3. **Frameworks & tips** — concrete, reproducible practitioner advice.
4. **Discussion** — what the community argues about (a teardown blowing up, a
   measurement debate, a pricing controversy).

Distinguish independent evidence from a vendor's marketing. If you can't
confirm a claim in a credible source, capture it *flagged* ("reportedly") —
never launder it into fact.

## Step 2 — Append signals

Add **3–10 lines** under a `## <TODAY>` heading. One line each:

```markdown
- [<short headline or thread title>](<url>) — <one clause: what + why it might matter> (<area> · <play|research|framework|tip|discussion>[ · practice-candidate])
```

- `<area>` from the guide coverage index: `positioning`, `docs`,
  `devrel/community`, `dx/activation`, `content`, `channels/distribution`,
  `launches`, `metrics`, or `meta`.
- Append ` · practice-candidate` when the signal **changes a decision the
  reader makes** — a dated data point that shifts a play, a channel that
  stopped/started working, a measurable pattern with numbers — not merely an
  interesting read. These become the weekly editor's queue for distilling
  `src/content/claims/` entries. When in doubt, flag it; the editor decides.
- Append ` · example-candidate` when the signal is a **concrete, still-live
  artifact a reader could open in a new tab and copy** — a specific pricing
  page, a launch page, an API reference, a landing-page hero, a changelog, a
  README. Include the direct link to the artifact itself (not a write-up about
  it). These feed the weekly editor's swipe file (`src/content/examples/`). A
  play with no linkable artifact is a practice-candidate, not an example.
- Append ` · skill-candidate` when the signal is an **installable agent skill**
  that does developer-marketing work — a published skill, plugin, or marketplace
  entry with a real install line, not a prompt collection or a think-piece about
  agents. Include the repo link. These feed the weekly editor's shelf
  (`src/content/skills/`), where a mandatory caveat and an install line the
  editor has read are the price of admission.
- Append an **angle flag** when a signal could carry a longer treatment in
  the weekly issue: ` · news-candidate` (industry news that changes a
  decision), ` · analysis-candidate` (a money move or pattern — funding, M&A,
  pricing), ` · campaign-candidate` (a campaign/launch worth a teardown),
  ` · tech-candidate` (a stack technology shift with adoption evidence). One
  signal can carry an angle flag *and* practice/example flags — they feed
  different passes of the editor's run. When in doubt, flag it; the editor
  decides.
- Discussions are first-class: an HN thread tearing down a devtool launch is a
  signal even if no outlet wrote it up — link the thread.
- Note trajectory when visible ("second wave of…", "follow-up to Monday's…").
- A quiet day is fine — 3 real lines beat 10 padded ones. Genuinely nothing
  new: append `## <TODAY>` with `- (quiet day)` so the editor knows you ran.
- No takes beyond a clause. The weekly editor verifies and opines.

## Step 3 — Promote what qualifies to Signals

The `signals/` directory at the repo root is internal raw capture; `src/content/signals/` is the published Signals feed — the event
log, and the only place dated news lands. It exists so that a small company
whose news can't carry long-form prose still gets covered, and so every
qualifying event reaches a reader the same day.

**Promote from the event DB, not from what you happened to hand-search.** The
sweep is the candidate pool; the handful of items you fetched for depth is a
subset of it, not a replacement. Walk the day's events before you promote:

```bash
npm run scout:query -- --since <the day you are writing up>
```

A run that promotes one item out of a hundred-plus captured events has almost
certainly applied a bar that isn't written below. Check which one.

Promote a signal when **all** of these hold:

- Something **happened** — a company shipped, launched, raised, renamed,
  deprecated, or published something. A think-piece with no event behind it is
  an internal signal, not a published one.
- There is a **primary source** you opened: the changelog, the blog post, the
  Show HN thread, the filing. Not a write-up about a write-up.
- You can say what happened in **two sentences** without hedging into vagueness.

Those three are the **whole** bar. Nothing else gates promotion.

Do **not** promote: unverified claims (a signal flagged "reportedly" stays a
signal), sourcing notes, thread-carryover lines, or anything whose only source
is a vendor's own marketing page making an unverifiable claim.

Traction is **not** a criterion. A 2-point Show HN from a company nobody has
heard of clears this bar if something real happened and the link proves it —
that is the point of the tier. Ranking by reach is what pushes the small-company
tail out of coverage entirely.

Neither is **significance**, and it is the filter that creeps back in wearing
other clothes. These are **not** reasons to hold an item:

- no adoption numbers, no named customers, "just a press release" — a shipped
  product with a primary source is a publishable signal, whether or not anyone bit yet;
- "routine," "incremental," or "another entrant in a category we've covered" —
  Signals is an event log, and the third entrant is what makes it a trend;
- a podcast episode with no transcript yet — `kind: podcast` is summarised from
  the episode page, and the note says so (see below);
- the item is small, or you can't yet tell whether it matters. The weekly editor
  decides what mattered; the scout's job is that the event is on the record.

The honest reject is "nothing happened" or "I couldn't open a primary source."
If you are reaching for a different sentence, promote it.

One file per item, `src/content/signals/YYYY-MM-DD-company-slug.md`:

```markdown
---
title: <the headline — what happened, no company prefix>
company: <as they write it>
date: <the date of THIS run — never the source's publication date>
kind: news | release | funding | launch | campaign | discussion | podcast | signal
summary: '<exactly two sentences — the item itself>'
tags: [<reuse existing tags where they fit>]
source:
  label: <publisher — headline>
  url: <the primary source>
sources:          # optional supporting links
  - label: ...
    url: ...
related:          # optional; base-less guide paths
  - label: Guide — <section title>
    href: /guide/<section-id>
---

<Optional: one short paragraph on why it matters or what to watch. Skip it
when the two sentences are the whole story — the body is not a quota.>
```

`date` — and the `YYYY-MM-DD` in the filename — is **the day this run writes the
item**, not the day the source published.

**Never restate that date in the summary.** The stream, the front page and the
issue roundup all stamp it next to the item; "Vercel shipped X on 2026-08-06"
under a 2026-08-06 heading is the same fact twice. Write "Vercel shipped X:
…" and let the timeline carry the when.

State a date in the summary **only when it differs from the item's own** — and
then it is mandatory, because that is the gap the reader can't see. Three cases
where it earns its place:

- **Surfaced late**: something shipped days or weeks before it cleared the
  sweep. "Cloudflare published `@cloudflare/computer` on 2026-08-03, surfaced
  in this sweep…" — without it the item implies a freshness it doesn't have.
- **A future deadline**: an end-of-life, a migration cutoff, a GA date.
- **A span the item is about**: a deprecation window, a pattern's window.

Backdating is the failure mode to watch for, because it hides working runs: an
item filed under the publisher's date makes the day it was actually captured
look empty, and Signals look like it skipped. Two sentences that name the ship
date carry that information without moving the file.

For `kind: podcast`, `company` is **the show**, not the guest's employer, and
the note should state plainly that the item was summarised from the episode
page rather than from listening. The guest and their company belong in the
summary.

**Several published signals a day is the normal outcome**, not a good one. The
watchlist captures on the order of a hundred-plus events a day across news,
launches, changelogs, Show HN, podcasts and vendor blogs; on that volume, a
run that promotes nothing has usually mis-set the bar rather than met a quiet
day. Publishing is still criteria and not a quota — a genuinely thin day is a
real thing and you must never pad the feed to hit a number — but zero is a
result to explain in the sourcing note, naming what you looked at and why
nothing cleared the three criteria, not one to pass over in silence.

`check-refs.mjs` fails the build on an item missing `company`, `summary`, or
`source.url` — an unverifiable one-line news claim is a rumour with a company
name attached.

## Step 3½ — Read the pattern (kind: signal — the intelligence tier)

Signals is not only a log of events; it is the surface where the system shows
it *sees*. After promoting the day's events, ask the DB whether today's items
rhyme with something already captured:

```bash
npm run scout:query -- --entity <slug>       # what has this company been doing?
npm run scout:query -- --event deprecation   # how many of these lately?
npm run scout:query -- --topic pricing
```

Publish a pattern item — `kind: signal` — when **all** of these hold:

- **Three or more dated events**, each with its own primary source, form the
  pattern. Two is a coincidence; keep it in MEMORY.md as a thread instead.
- The summary states the pattern as a **composed fact**: "X is the third Y in
  N weeks", with the count and the window. A reader can check it by clicking.
- `source` is the newest event's primary source; the other events go in
  `sources`, one entry each. The pattern's evidence is the links, all of them.

The epistemic line is hard and it is what keeps the intelligence tier honest:
the **summary** carries only what the events prove happened. Any forward
read — what this probably means, what to watch for next — lives in the
**body**, framed explicitly as a call ("The read:", "What to watch:"), so the
reader always knows whether they are reading the record or the bet. A
prediction stated as news is the one way this tier can rot; MASTHEAD's
fact-integrity bar applies to the summary in full.

`company` is the pattern's subject: a company when one drives it, a category
("Coding agents"), or "The field". Zero pattern items on most days is
correct — a forced pattern is worse than none. When one lands, note it in
MEMORY.md so the weekly editor can pick it up for "things to watch".

## Step 4 — Patch the guide (only for hard, unambiguous facts)

The guide is the product; it must never state something the data just
disproved. If a signal is an **unambiguous factual change** to a guide section
under `src/content/guide/` — a survey figure superseded by a new wave, a tool
or program discontinued, a company case study invalidated by a pivot — fix it
now:

- Edit the section: fix the fact, keep the voice and structure.
- Bump its `updated:` frontmatter to `<today>`.
- Do NOT touch `order` or `title` unless the section's scope genuinely changed.

Leave interpretation, framing, and anything you couldn't verify to the weekly
pass. When in doubt, capture the signal and don't touch the guide. Don't bump
`updated` for cosmetic edits.

## Step 5 — Update memory (light)

Episode notes in `editorial/podcasts/` are part of memory now: before flagging a
special-issue candidate, grep them — a thread that keeps recurring across episodes
is stronger evidence than one that surfaced once on HN.

In `editorial/MEMORY.md`, only if today changed something:
- Attach a notable signal to an existing **running thread** (or note a
  genuinely new one — don't leave a big story orphaned).
- If a topic keeps recurring in signals and the guide covers it thinly, add or
  bump a **special-issue candidate**.
Keep it terse; the weekly editor does the full maintenance pass.

## Step 6 — Report

End with a short plain-text summary: how many signals you captured (filename),
how many signals you published and which signals you left unpromoted, which
guide sections you patched and why, and anything you left out because you
couldn't confirm it. Do **not** run git — the workflow commits and deploys.
