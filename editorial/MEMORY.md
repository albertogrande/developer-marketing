# Editorial Memory

Agent-maintained; internal. Read before running any desk; update after. Keep
under ~170 lines (`scripts/check-editorial.mjs` enforces it) — retire dead
threads by deleting them; git history preserves everything. Detail that
shipped in a published piece lives in that piece — keep the pointer and the
open loops here, not the narrative. This is the brain that keeps the
**guide** current, decides when a thread has earned a **deep dive**, and
gives the **newsroom** its sense of what's already been said.

## Standing editorial findings

- **2026-07-11, the practices bar** (from the sibling guide's measured
  evals): a corpus's edge over a bare model is current, dated, sourced facts
  — not timeless judgment the model already has. Practices that decay to
  "model already knows this" get retired or refreshed.
- **2026-07-11, the examples swipe file** (format from markepear):
  `src/content/examples/` catalogs real, sourced artifacts — the *evidence*
  layer under the practices (rule) and the guide (judgment). **Promoted by
  the weekly editor, 0–3 a week and often zero — never a quota**; fed by the
  scout's ` · example-candidate` flag.
- **2026-07-11, desk transition**: the first phase's one-radar-post-per-day
  quota forced picks on quiet days. Now: signals (internal, daily) + The
  Week (published, Mondays). Radar is a closed archive — never add entries.
- **2026-07-17, the newsroom** (architecture from the sibling The Wire): five
  desks (`AUTHORS.md`) publish to `src/content/articles/` — **at most one a
  day, Tue–Sun, editor's call, never a quota**. Decisions log to
  `editorial/NEWSROOM.md`; ideas pool in `editorial/BACKLOG.md`. Articles
  feed the product: guide patches, practice/example candidates, dive flags.
  If the newsroom starts padding, cut cadence, not quality.
- **2026-07-26, the directory + the newsletter** (charter rules 8 and 9).
  `src/content/resources/` catalogs who a practitioner can hire — bar: live
  site, verifiable `signal`, `checked` date, `caveat` where warranted.
  **Nothing is for sale.** Maintenance on demand, not a cadence. The
  newsletter is **The Week by email** (double opt-in, HMAC links, no pixels);
  the email body *is* the digest — correct a weekly in `src/content/weekly/`
  and say so in the next issue, never silently.

## Running threads

Momentum tags `↑`/`→`/`↓`; `Tension:` when evidence cuts against a thread.
Recurring + thinly covered by the guide = deep-dive candidate (flag below).

- **AI assistants as a primary reader of your docs** `↑` — machine-mediated
  discovery: reading → selection → transaction. House position = the GEO dive
  (2026-07-17): reading = act now, selection = design for, measurement =
  don't buy yet. Numbers on record: Ahrefs 2026-06-15 — 97% of llms.txt
  files get zero requests, AI bots ~1.1% of traffic; Vercel ~10% of signups
  from ChatGPT (Rauch, 2025-04); ChatGPT referral conversion 7.1%
  (Similarweb, 2026-05). **"Agent-safe by design" is a category** — canonical
  detail in the 07-26 technology article; roster keeps growing (OneCLI,
  Common Room `cr`, Axtary, ActionRail, Kastra cross-tool policy; Tines 3B
  reframes toward citizen-builder governance). **MCP became infrastructure** —
  the 2026-07-28 spec (stateless core, CIMD auth, ~12-month deprecation
  offramp, all Tier-1 SDKs day one, six hyperscalers committed) is canonical
  in the 07-29 technology article; download figures are self-reported SDK
  pulls, vendor commitments ≠ shipped integrations. W31: Google made the
  retrieval/ranking split explicit (skip llms.txt for AI-features ranking;
  Lighthouse 13.3 ships an "Agentic Browsing" audit) — corroborates the
  guide's hedge (§02, §06). Emerging sub-thread (07-30, skipped): the
  `SKILL.md` convention escaping the agent harness — promote when a third
  *independent* surface ships skills-as-a-file with usage evidence. Open
  loops: a devtool reporting attributed AI-referral signups with a number by
  end of Q3 2026 (standing falsifiable call); OSS guardrail adoption vs.
  launch spike; where pre-action authz consolidates; a second incumbent
  shipping an agent-safe flow; an MCP-cutover bill-shock or outage story.
  Guide: §02, §06.
- **DevRel measurement: influence, not attribution** `↑` — consensus on
  influenced pipeline + activation; AI-answer presence entering as a
  discovery metric. Signal layer consolidating into GTM stacks: Zoom+Common
  Room (07-02) was the third roll-up in eight months, all terms undisclosed —
  money article 2026-07-18. Seller side: Copilot impact dashboard with the
  named "Passive" seat segment (news article 07-23; practice distilled) the
  same week as HCLTech's 500-enterprise survey (90% transformation / 18%
  revenue impact; vendor-commissioned). **The CFO dive shipped** (2026-07-30):
  house position on record — report the *program* in four auditable numbers,
  manage the *people* on craft. Kept detail: DevRel Foundation Metrics WG
  archived 2025-11-08; 11th survey wave = 62% report to C-level / 18% link
  revenue / 61% can't demonstrate impact. Hiring-bar claim (07-17) still
  single-sourced; DevRelCon recaps absent through 08-01, mid-August deadline
  holds. Open loops: fourth signal-tool deal / first disclosed price; a
  second AI devtool shipping passive-seat reporting, or a public renewal
  story citing one, by end of Q3; the recaps. Guide: §08, §03.
- **Developer population plateau → segment depth** `→` — SlashData: ~47M
  developers, ~10% y/y and decelerating, aging, shifting to South Asia /
  Greater China (07-06 radar). Re-check each wave (none since April).
  Guide: §01, §06.
- **Verification-first marketing** `↑` — developers fact-check in public;
  ship proof, not adjectives. Two campaigns examples on record, distinct
  mechanics: HeimWall's honest benchmark (07-21 article; example 07-27) and
  Cloudflare's cdnjs dogfooding measured by the public limits it raised
  (08-01 article; flagged example-candidate). Deprecation counter-cases feed
  the evergreen dive: Cerebras free-tier sunset 2026-08-17 (quiet re-anchoring,
  §04); GitHub Models' full retirement (07-30, six weeks, no like-for-like
  replacement) is the second data point, against a practitioner's months-to-a-year
  rule of thumb (podcast note, 06-10). Open loops: how the 08-17 Cerebras sunset
  lands; whether a second vendor frames a case study around limits-raised rather
  than throughput-hit. Guide: §01, §04, §05, §07.
- **Earned distribution still tops the stack** `→` — Juggler's 07-12 Show HN
  (276 pts, solo, unfunded, AGPL): reputation + a runnable artifact
  out-distributes launch budget (→ example). Launch HN is the default GTM
  for agent-infra startups. Tension: Block's Buzz (07-21, 304 pts, skeptical
  "LLM slop" verdict) — founder credibility buys attention, not the verdict.
  Still watching for a paid push developers reward. Guide: §06, §07.
- **AI features priced as seat + meter** `↑` — the devtools default: per-seat
  license + metered model consumption; GitHub Code Quality GA extended the
  shape from generation to review (money article 07-22; §01 carries the
  shape; practice distilled; comparables in the article). Open loops: first
  *non-generative* feature on a metered AI line; whether Copilot's promo
  credits lapsing (~Sept 2026) produces bill-shock backlash. Guide: §01, §04.

## Deep-dive candidates

Promote here when a thread recurs in signals AND the guide covers it thinly.
A dive ships **every Thursday**; these are the trendy half of what it picks
from, gated on outside events — often not ripe. A dive never skips for want
of a hot thread; it goes evergreen instead.

- **The measurable-ROI DevRel hiring bar** — one practitioner's claim (07-17)
  that postings silently screen for quantified-impact skills. Commission only
  if DevRelCon NYC recaps corroborate it across multiple talks; zero recaps
  through 08-01. **Retire if none by mid-August.**
- **What a developer segment is actually worth** — if the plateau holds
  across the next SlashData wave, "pick a segment and go deep" deserves
  numbers: how operators size and choose segments. Not yet — watching.
- **The two-part tariff** — how AI features get priced (seat + meter's
  history, the cap as trust surface, where the meter breaks). Commission when
  the meter produces its first public bill-shock story — Copilot's
  promo-credit lapse (~Sept 2026) is the likely trigger. Watching.

## Evergreen shelf

Durable subjects a practitioner will still need in a year — always ripe.
Thursday's dive takes from here whenever no trendy thread has earned the
depth, which is most weeks. **Keep at least three on the shelf**: whoever
takes one replaces it, drawn from the thinnest guide sections.

- **What a quickstart owes the reader** — the anatomy of a first five
  minutes: what to cut, what to hard-code, when a sandbox key beats a
  signup, how operators measure the drop-off. (`02`, `04`)
- **Pricing pages developers trust** — the free tier's shape as a promise,
  what a published limit signals, what a tier move does to trust. Cerebras'
  07-16 sunset is a live case; the subject outlives it. (`01`)
- **The deprecation that didn't burn anyone** — migration windows, codemods,
  and the comms cadence separating a clean deprecation from a churn event.
  GitHub Models (07-30) is the second live case. (`04`)
- **What a launch actually buys you** — the measured anatomy of a Show HN /
  Product Hunt spike: traffic half-life, signup quality vs. baseline, day-30
  retention, when deferring beats taking it. §07 is the only guide section
  no dive has touched. (`07`, `06`)

## Guide coverage index

The nine evergreen sections and what each owns — *where* a fact belongs.

- `00-start-here` — orientation, the mental model, how the site updates
- `01-positioning-for-developers` — positioning, segments, trust, proof, pricing shape
- `02-docs-as-front-door` — docs-led growth, quickstarts, machine-readable docs, agent-safe flows
- `03-devrel-and-community` — DevRel programs, community, advocacy
- `04-developer-experience-and-activation` — DX, onboarding, time-to-value, deprecation trust
- `05-content-that-earns-trust` — technical content, honest benchmarks
- `06-channels-and-distribution` — where developers are, GEO/AI answers
- `07-launches` — launches developers amplify, HN/PH dynamics
- `08-measurement-and-metrics` — DevRel/marketing measurement, funnels, adoption cohorts

## Published coverage

The per-piece index is `editorial/COVERAGE.md`, generated from content
frontmatter by the gates — grep it for what has already run; never append by
hand. (Radar archive: 5 entries, closed.)
