# Editorial Memory

Agent-maintained; internal. Read before running either writer; update after.
Keep under ~140 lines (`scripts/check-editorial.mjs` enforces it) — the cap
came down when the running threads moved to `src/content/threads/`, and it
should stay down: anything long enough to want more room is a thread, and
belongs there where it has no cap and a reader can see it. Detail that
shipped in a published piece lives in that piece — keep the pointer and the
open loops here, not the narrative. This is the brain that keeps the
**guide** current and decides when a thread has earned a **special issue**.

## Standing editorial findings

- **2026-07-11, the practices bar**: a corpus's edge over a bare model is
  current, dated, sourced facts — practices that decay to "model already
  knows this" get retired or refreshed.
- **2026-07-11, the examples swipe file**: `src/content/examples/` = real,
  sourced artifacts, the evidence layer under practices and guide.
  **Weekly-editor promotion, 0–3/week, often zero — never a quota.**
- **2026-08-06, two writers**: newsroom and deep-dive desks retired;
  `articles/` and `deep-dives/` are archives. Events → Signals (scout,
  daily); analysis → the weekly issue (editor, Mondays), long as a
  **special issue** when a thread earned depth. Claims carry
  `status`/`checked`; the editor reconciles ~3 of the stalest weekly.
- **2026-07-26, the directory + the newsletter** (charter rules 8 and 9).
  `src/content/resources/` = who to hire (live site, verifiable `signal`,
  `checked` date, **nothing for sale**; maintenance on demand). Newsletter =
  The Beat by email; correct a weekly in `src/content/issues/` and say so in
  the next issue, never silently.

## Running threads

**The threads are published** in `src/content/threads/` — that is the record
now: running argument, momentum, dated membership, open loops. Read those
before writing and do not restate them here. Below: only what must NOT
publish, plus the staging area.

- `agents-as-the-first-reader` — the stranded-integrator arc rests on one
  named account. Don't generalise it until a second lands; if one does, that
  is special-issue material, not another signal.
- `proof-over-adjectives` — the "does honesty ever cost anyone" loop is
  unfalsifiable as written: the failures never get published. Rephrase or
  retire it if nothing testable turns up by end of Q3.
- `how-ai-features-get-priced` — if Muse Code's contributor tier quietly
  disappears at GA, cool this to `dormant` rather than resolving it. A
  withdrawn experiment answers nothing.
- `measuring-influence-not-attribution` — the survey/tooling gap may be
  organisational, not technical, which would make this unsettleable from
  public evidence. Reassess at the next survey wave.
- **Cerebras free-tier verdict, logged 2026-08-18**: inconclusive, not clean
  vs. not messy. No incident on Cerebras' status page for 08-17/08-18 and no
  HN/social account of the actual cutover (catalog unchanged: GPT-OSS-120B
  and Gemma4-31B-Multimodal both still operational) — weak evidence of a
  quiet landing, but nobody's confirmed the specific ask (a deprecation-named
  error vs. a bare `404`). Re-check if a first-hand report surfaces; don't
  treat silence past ~end of August as a verdict either way.
  If the two W32 clocks stayed silent through 08-31 — no incumbent
  data-trade answer, no second MCP-directory account or SLA — W35 calls both
  as promised in W33's Things to watch; don't let them slip unremarked.
- The Debian GR result (closes 08-28) moves the new
  `publish-an-agent-contribution-policy` claim — re-verify it in the first
  issue after the result, not on the normal stale rotation.

### Staging — questions not yet threads

Below the bar: no dated evidence in the published record. Promote when it
lands; never open a thread on a question nothing can answer.

- **Developer population plateau → segment depth** — SlashData: ~47M devs,
  ~10% y/y, decelerating, shifting to South Asia / Greater China. SlashData
  published "The Rise of the Builder — Q3 2026" 2026-08-18
  (slashdata.co/post/rise-of-the-builder-developer-trends-q3-2026); fetch
  truncation persisted on retry 08-20, still unread — try a direct fetch of
  the PDF/report itself next time, not the blog post. Guide: §01, §06.

## Special-issue candidates

Promote here when a thread recurs in signals AND the guide covers it thinly.
Most weeks none is ripe and the issue stays normal — never force a special.

- **The terms sheet is the product** — the W30→W32 arc (seat pricing → exit
  windows → data trades) argued weekly; a special could unify it as one
  surface: how devtools terms became public, comparable positioning. Ripens
  if an incumbent answers Meta's data tier or the Copilot credit lapse lands
  (~Sept). Watching.
- **What a developer segment is actually worth** — if the plateau holds
  across the next SlashData wave, "pick a segment and go deep" deserves
  numbers: how operators size and choose segments. Not yet — watching.
- **The two-part tariff** — how AI features get priced (seat + meter's
  history, the cap as trust surface, where the meter breaks). Commission when
  the meter produces its first public bill-shock story — Copilot's
  promo-credit lapse (~Sept 2026) is the likely trigger. Watching.
- **Who owns the rail** — the W31→W33 arc (directory queues → Vercel/GitHub
  marketplaces → SpaceX buying Cursor's distribution → Meta's own index):
  agent-era distribution as one story. Ripens when the first marketplace
  conversion number or a published review SLA lands; would likely be the
  special that resolves `agents-as-the-first-reader`. Watching.

## Evergreen shelf

Durable subjects a practitioner will still need in a year — always ripe.
**Keep at least three on the shelf**: whoever takes one replaces it, drawn
from the thinnest guide sections.

- **What a quickstart owes the reader** — the anatomy of a first five
  minutes: what to cut, what to hard-code, when a sandbox key beats a
  signup, how operators measure the drop-off. (`02`, `04`)
- **Pricing pages developers trust** — the free tier's shape as a promise,
  what a published limit signals, what a tier move does to trust. Cerebras'
  07-16 sunset is a live case; the subject outlives it. (`01`)
- **The champions program ledger** — what an advocates/champions program
  actually costs and returns: the nomination bar, the perks, the expected
  output, when one goes stale, and how operators account for it — §03 is the
  guide's thinnest section and no dive has touched it. (`03`, `08`)
- **What a launch actually buys you** — the measured anatomy of a Show HN /
  Product Hunt spike: traffic half-life, signup quality vs. baseline, day-30
  retention, when deferring beats taking it. §07 is the only guide section
  no dive has touched. (`07`, `06`)

## Guide coverage index

The ten evergreen sections and what each owns — *where* a fact belongs.

- `00-start-here` — orientation, the mental model, how the site updates
- `01-positioning-for-developers` — positioning, segments, trust, proof, pricing shape
- `02-docs-as-front-door` — docs-led growth, quickstarts, machine-readable docs, agent-safe flows
- `03-devrel-and-community` — DevRel programs, community, advocacy
- `04-developer-experience-and-activation` — DX, onboarding, time-to-value, deprecation trust
- `05-content-that-earns-trust` — technical content, honest benchmarks
- `06-channels-and-distribution` — where developers are, channel mix, MCP directories
- `07-launches` — launches developers amplify, HN/PH dynamics
- `08-measurement-and-metrics` — DevRel/marketing measurement, funnels, adoption cohorts
- `09-answer-engines-and-aeo` — AI-search visibility, citations, llms.txt, agent-readable surfaces (added 2026-08-16; the AEO material 06 used to absorb belongs here now, and 06 keeps the channel-mix framing)

## Published coverage

Per-piece index: `editorial/COVERAGE.md`, generated by the gates — grep it;
never append by hand. (Radar archive: 5 entries, closed.)
