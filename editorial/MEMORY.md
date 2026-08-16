# Editorial Memory

Agent-maintained; internal. Read before running either writer; update after.
Keep under ~170 lines (`scripts/check-editorial.mjs` enforces it) — retire
dead threads by deleting them; git history preserves everything. Detail that
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

Momentum `↑`/`→`/`↓`; `Tension:` = evidence cuts against; recurring + thin
guide coverage = special-issue candidate (flag below).

- **AI assistants as a primary reader of your docs** `↑` — machine-mediated
  discovery: reading → selection → transaction. House position = the GEO dive
  (2026-07-17). **"Agent-safe by design" is a category** (07-26 article;
  roster: OneCLI, Common Room `cr`, Axtary, ActionRail, Kastra, Sinch 08-04;
  Tines 3B). **MCP became infrastructure** — 2026-07-28 spec canonical in the
  07-29 article; W31 + guide (§02, §06) + practice carry MCP-as-table-stakes
  and the Google retrieval/ranking split. `SKILL.md` sub-thread: promote on a
  third skills-as-a-file vendor + usage evidence. **Directory = gated
  channel** (08-04 article, house move in §06); **W32 put numbers on the
  gate**: Symonds' dated timeline (submitted 03-22, queue discarded 07-30;
  OpenAI approved same connector in 29 days) — still one account, §06 carries
  it. Distribution rail consolidating: Vercel Agent Plugins 1.0.0 (08-06,
  AWS/Anysphere/GitHub/Microsoft/OpenAI); **GitHub opened its own rail
  08-14**, an agent-apps Marketplace wired into Copilot's harness.
  Pre-action authz has two rival answers (Auth0 XAA, IdP-mediated, 08-06 vs.
  Eve Maler's U4A PoC, resource-owner-mediated, 08-10) — watch which an MCP
  host ships. **Reading into acting** (08-08): Kitesurf (agent-only
  browser) and Supabase as a read/write Perplexity connector; enterprise
  infra joined the MCP roster (Nutanix, 08-11), then a data platform
  (MongoDB, 08-14). Countertrend: Emacs draft AGENTS.md (08-03, unmerged)
  restricts agents rather than enabling them. Open loops: second
  stranded-integrator account or an Anthropic review SLA by end of Aug (W32
  watch #3); attributed AI-referral signups by end of Q3; a major MCP
  host's dated migration plan by end of Sept. Guide: §02, §06.
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
  revenue / 61% can't demonstrate impact. **Hiring-bar claim retired 08-10**
  (W32, on the standing deadline; reasoning in that issue). Open loops:
  fourth signal-tool deal / first disclosed price; a second AI devtool
  shipping passive-seat reporting, or a public renewal story citing one, by
  end of Q3. Guide: §08, §03.
- **Developer population plateau → segment depth** `→` — SlashData: ~47M
  developers, ~10% y/y and decelerating, shifting to South Asia / Greater
  China. Re-check each wave (none since April). Guide: §01, §06.
- **Verification-first marketing** `↑` — developers fact-check in public;
  ship proof, not adjectives. Three campaigns examples on record, distinct
  mechanics: HeimWall's honest benchmark (07-21 article; example 07-27),
  Cloudflare's cdnjs dogfooding measured by the public limits it raised
  (08-01 article; example + practice promoted 08-03), and Sentry's Seer
  workflow post printing the counter-number (close-without-merge +12.5%)
  and arguing it healthy — example promoted + §05 updated 08-10. **The
  deprecation dive shipped** (2026-08-06, `the-deprecation-that-didnt-burn-anyone`):
  the window is the headline, mechanics decide burn. Windows ledger (now in
  §04 + claim distilled 08-10): Spark ~27d, Models 29d-to-dead, Cerebras
  ~1mo, MCP 12mo, HCP Vagrant ~21mo. Open loops: **how Cerebras lands 08-17**
  (clean = deprecation-named errors + stable catalog, not silent 404s — log
  either way; W32 watch #2); second limits-raised case study; first vendor
  marketing a migration plan as a feature. Guide: §01, §04, §05, §07.
- **Earned distribution still tops the stack** `→` — Juggler's 07-12 Show HN
  (276 pts, solo, unfunded, AGPL): reputation + a runnable artifact out-distributes
  launch budget (→ example); Launch HN is the default GTM for agent-infra startups.
  Tension: Block's Buzz (07-21, 304 pts, "LLM slop" verdict) — founder credibility
  buys attention, not the verdict. Guide: §06, §07.
- **AI features priced as seat + meter — and now data rights** `↑` — the
  devtools default: per-seat license + metered consumption (money article
  07-22; §01 + practice carry the shape). **W32 centered the Meta variant**:
  Muse Code's "contributor" tier ~12x/21x cheaper for training rights — a
  discount sold as a data trade; claim distilled + §01 updated 08-10 (a
  training-data policy now has a public market rate; put it on the pricing
  page). Tension (08-11): Meta open-sourced Muse Glimmer (30B, Apache 2.0,
  free) the same month — the opposite distribution model. Context: coding
  agents commoditized — three entrants in 48h (Muse/Memcode/Clark), none on
  capability; accessory market arrived (Mirafold); pattern signal 08-07.
  Open loops: incumbent ships or rules out a data tier by end of Aug (W32
  watch #1); first *non-generative* metered feature; Copilot promo-credit
  lapse (~Sept 2026) → bill-shock.
  Guide: §01, §04.

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
