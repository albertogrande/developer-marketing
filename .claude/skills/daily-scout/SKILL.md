---
name: daily-scout
description: Daily developer-marketing signals capture — sweep the last ~24h of practitioner blogs, DevRel communities, and industry research for what's new, append dated one-liners to signals/<week>.md, publish qualifying items as briefs, and patch the guide the moment a hard fact changes. Use when asked to run the scout or capture today's developer-marketing signals.
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
- Skim `editorial/MEMORY.md`: the running threads, the deep-dive candidates,
  and the **guide coverage index** (which section owns which topic). This tells
  you what's already known and where a new fact belongs.

New week file header:

```markdown
# Signals — week <WEEK_ID>

Raw daily capture. One line per signal. Internal — input for the weekly
digest and the guide-refresh pass. Not rendered on the site.
```

## Step 1 — Sweep (practitioner sources first)

Use WebSearch and WebFetch. Budget **4–8 fetches**. Sweep a *fixed* source set
(this is a standing developer-marketing watch, not a rotating beat), and always
capture a resolving link. Public, fetchable sources only — skip login walls and
paywalls.

**Practitioner blogs & operators (start here):**

- Developer marketing / DevRel writers and newsletters: the **DevRel Weekly**
  archive, **Developer Marketing Alliance** blog, **DevRel.co / DevRel
  Collective**, **Draft.dev** blog (technical content marketing),
  **Markepear** (Jakub Czakon), **Adam Frankl** (*The Developer Facing
  Startup*), **Lee Robinson**, **Common Room**, **Elena Verna** (PLG),
  **Lenny's Newsletter** (public posts), **Reforge** public essays,
  **Scaling DevTools** (podcast/notes).
- Operator writing from developer-first companies: engineering/DevRel blogs at
  **Stripe, Twilio, Vercel, Netlify, Postman, MongoDB, DigitalOcean, GitHub,
  Sentry, Auth0, Algolia, Supabase, PlanetScale, Resend** — for how they
  actually run docs, DX, and community.

**Podcast feeds — sweep these every run, they are the most reliable channel
you have:**

RSS is fetchable on days when Reddit and Bluesky are not, and each feed carries
`<pubDate>`, so "what shipped in the last ~24h" is an exact question here rather
than a guess. Fetch the feed, read the newest `<item>`, and capture any episode
dated to the window. One fetch per feed — do not go hunting for audio.

| Show | Feed |
|---|---|
| Scaling DevTools (Jack Bridger) | `https://feeds.transistor.fm/scaling-devtools` |
| Latent Space (swyx & Alessio) | `https://api.substack.com/feed/podcast/1084089.rss` |
| The Pragmatic Engineer (Gergely Orosz) | `https://newsletter.pragmaticengineer.com/feed` |
| devtools.fm | `https://www.devtools.fm/rss.xml` (irregular — gaps of a month are normal) |

Candidates to verify and add if their feeds resolve: **Community Pulse**,
**Fireside with Voxgig**, **The Art of Developer Experience**, **Developer
Marketing Stories**, **Markepear**, **Everything Outside Code**.

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
episode could earn a practice or a deep dive; the weekly editor greps that field
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

**The newsroom beats — money, campaigns, technology (feed the desks):**

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

**Community & discussion — public endpoints that fetch reliably. Verify every
claim against a primary source before repeating it:**

- **Hacker News** (Algolia, always fetchable):
  `https://hn.algolia.com/api/v1/search_by_date?query=developer%20marketing&tags=story`
  and variants for `devrel`, `developer%20experience`, `docs` — follow into hot
  comment threads.
- **Reddit** (public JSON):
  `https://www.reddit.com/r/devrel/search.json?q=&sort=new&restrict_sr=1&limit=25`;
  also r/marketing, r/SaaS, r/ExperiencedDevs for developer-audience threads.
- **Lobsters**: `https://lobste.rs/search?q=devrel&what=stories&order=newest`.
- **Bluesky** (public API, no login):
  `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=developer%20relations&sort=latest`.
- **Broad sweep**: a `WebSearch` for `"developer marketing"`, `"developer
  relations"`, or `"developer experience"` in the last day or two, to catch
  anything the lists miss.

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
  `src/content/practices/` entries. When in doubt, flag it; the editor decides.
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
- Append a **desk flag** when a signal could carry a newsroom article
  (`.claude/skills/newsroom/`): ` · news-candidate` (industry news that
  changes a decision), ` · analysis-candidate` (a money move or pattern —
  funding, M&A, pricing), ` · campaign-candidate` (a campaign/launch worth a
  teardown), ` · tech-candidate` (a stack technology shift with adoption
  evidence). One signal can carry a desk flag *and* practice/example flags —
  they feed different desks. When in doubt, flag it; the editor decides.
- Discussions are first-class: an HN thread tearing down a devtool launch is a
  signal even if no outlet wrote it up — link the thread.
- Note trajectory when visible ("second wave of…", "follow-up to Monday's…").
- A quiet day is fine — 3 real lines beat 10 padded ones. Genuinely nothing
  new: append `## <TODAY>` with `- (quiet day)` so the editor knows you ran.
- No takes beyond a clause. The weekly editor verifies and opines.

## Step 3 — Promote what qualifies to briefs

Signals are internal; `src/content/briefs/` is the published wire. This is the
tier below a newsroom article, and it exists for two reasons: a day the
newsroom logs a skip should still reach a reader, and a small company whose
news can't carry 900 words should still get covered.

Promote a signal when **all** of these hold:

- Something **happened** — a company shipped, launched, raised, renamed,
  deprecated, or published something. A think-piece with no event behind it is
  a signal, not a brief.
- There is a **primary source** you opened: the changelog, the blog post, the
  Show HN thread, the filing. Not a write-up about a write-up.
- You can say what happened in **two sentences** without hedging into vagueness.

Do **not** promote: unverified claims (a signal flagged "reportedly" stays a
signal), sourcing notes, thread-carryover lines, or anything whose only source
is a vendor's own marketing page making an unverifiable claim.

Traction is **not** a criterion. A 2-point Show HN from a company nobody has
heard of clears this bar if something real happened and the link proves it —
that is the point of the tier. Ranking by reach is what pushes the small-company
tail out of coverage entirely.

One file per item, `src/content/briefs/YYYY-MM-DD-company-slug.md`:

```markdown
---
title: <the headline — what happened, no company prefix>
company: <as they write it>
date: <today, or the capture date for something surfaced late>
kind: news | release | funding | launch | campaign | discussion | podcast
summary: '<exactly two sentences — the brief itself>'
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

`date` is when the item entered the wire. If something shipped weeks ago and
only cleared today's sweep, use today and say so in the summary or the note —
don't backdate, and don't imply it is fresher than it is.

For `kind: podcast`, `company` is **the show**, not the guest's employer, and
the note should state plainly that the item was summarised from the episode
page rather than from listening. The guest and their company belong in the
summary.

Several briefs a day is normal and correct; zero is fine on a genuinely quiet
day. `check-refs.mjs` fails the build on a brief missing `company`, `summary`,
or `source.url` — an unverifiable one-line news claim is a rumour with a
company name attached.

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
deep-dive candidate, grep them — a thread that keeps recurring across episodes
is stronger evidence than one that surfaced once on HN.

In `editorial/MEMORY.md`, only if today changed something:
- Attach a notable signal to an existing **running thread** (or note a
  genuinely new one — don't leave a big story orphaned).
- If a topic keeps recurring in signals and the guide covers it thinly, add or
  bump a **deep-dive candidate**.
Keep it terse; the weekly editor does the full maintenance pass.

## Step 6 — Report

End with a short plain-text summary: how many signals you captured (filename),
how many briefs you published and which signals you left unpromoted, which
guide sections you patched and why, and anything you left out because you
couldn't confirm it. Do **not** run git — the workflow commits and deploys.
