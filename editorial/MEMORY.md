# Editorial Memory

Agent-maintained; internal. Read before running either writer; update after.
Keep under ~170 lines (`scripts/check-editorial.mjs` enforces it) — retire
dead threads by deleting them; git history preserves everything. Detail that
shipped in a published piece lives in that piece — keep the pointer and the
open loops here, not the narrative. This is the brain that keeps the
**guide** current and decides when a thread has earned a **special issue**.

## Standing editorial findings

- **2026-07-11, the practices bar**: a corpus's edge over a bare model is
  current, dated, sourced facts — not timeless judgment. Practices that decay
  to "model already knows this" get retired or refreshed.
- **2026-07-11, the examples swipe file**: `src/content/examples/` catalogs
  real, sourced artifacts — the evidence layer under practices and guide.
  **Weekly-editor promotion, 0–3/week, often zero — never a quota.**
- **2026-07-11, desk transition**: daily radar quota retired; now signals
  (internal, daily) + The Beat (Mondays). Radar is closed — never add.
- **2026-08-06, two writers**: the newsroom (daily articles) and the deep
  dive retired; `src/content/articles/` and `src/content/deep-dives/` are
  archives. Events → Signals (scout, daily); analysis → the weekly issue
  (editor, Mondays), which runs long as a **special issue** when a thread
  earned depth. Claims carry `status`/`checked`; the editor reconciles ~3 of
  the stalest each week.
- **2026-07-26, the directory + the newsletter** (charter rules 8 and 9).
  `src/content/resources/` = who to hire (live site, verifiable `signal`,
  `checked` date, **nothing for sale**; maintenance on demand). Newsletter =
  The Beat by email; correct a weekly in `src/content/issues/` and say so in
  the next issue, never silently.

## Running threads

Momentum tags `↑`/`→`/`↓`; `Tension:` when evidence cuts against a thread.
Recurring + thinly covered by the guide = special-issue candidate (flag below).

- **AI assistants as a primary reader of your docs** `↑` — machine-mediated
  discovery: reading → selection → transaction. House position = the GEO dive
  (2026-07-17): reading = act now, selection = design for, measurement = don't
  buy yet. **"Agent-safe by design" is a category** — canonical detail in the
  07-26 technology article; roster keeps growing (OneCLI, Common Room `cr`,
  Axtary, ActionRail, Kastra, Sinch Agent Tools 08-04; Tines 3B = governance).
  **MCP became infrastructure** — the 07-28 spec (stateless core, CIMD auth,
  ~12mo deprecation offramp, all Tier-1 SDKs day one, six hyperscalers) is
  canonical in the 07-29 technology article; W31 digest + guide (§02, §06) +
  practice carry MCP-as-table-stakes. `SKILL.md` sub-thread: Copilot GA =
  GitHub as second skills-as-a-file vendor; **skills.sh adds packs 08-07**
  (Vercel — bundle skills into one shareable/installable link), a
  distribution primitive for the same thread; promote on a third vendor +
  usage evidence. **Stranded-integrator thread shipped as news article
  08-04** (`2026-08-04-mcp-directory-review`, Rio: the MCP directory is a
  *gated distribution channel*, review mechanics multiply-sourced) — house
  move in guide §06. Watching: corroboration of other stranded submitters; a
  review SLA/appeals path. "Agent experience" analytics is now a category, not
  one tool (Armature YC 08-04 + AgentCat, both MCP-session reconstruction).
  **Countertrend** (08-07, proposal not merged): Emacs's draft AGENTS.md tells
  LLMs to search/analyze, not generate, and surface its no-LLM-contributions
  policy — roster so far only logged enabling adoptions. **Reading into
  acting** (08-08): Cloudflare's Kitesurf, an agent-only browser trading human
  affordances for token/CPU cost, and Supabase joining Perplexity Computer as
  a connector that reads/writes Postgres from chat — the transaction stage the
  GEO dive said not to measure yet is starting to ship product. Open loops: a
  devtool reporting attributed AI-referral signups by end of Q3 2026; a major
  MCP host publishing a dated migration plan by end of Sept; where pre-action
  authz consolidates. Guide: §02, §06.
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
  single-sourced; DevRelCon recaps absent through 08-06 (14 days post-wrap) —
  the W32 weekly decides retirement at the mid-August deadline. Open loops:
  fourth signal-tool deal / first disclosed price; a second AI devtool
  shipping passive-seat reporting, or a public renewal story citing one, by
  end of Q3; the recaps. Guide: §08, §03.
- **Developer population plateau → segment depth** `→` — SlashData: ~47M
  developers, ~10% y/y and decelerating, shifting to South Asia / Greater
  China. Re-check each wave (none since April). Guide: §01, §06.
- **Verification-first marketing** `↑` — developers fact-check in public;
  ship proof, not adjectives. Two campaigns examples on record, distinct
  mechanics: HeimWall's honest benchmark (07-21 article; example 07-27) and
  Cloudflare's cdnjs dogfooding measured by the public limits it raised
  (08-01 article; example + practice promoted 08-03). **The deprecation dive
  shipped** (2026-08-06, `the-deprecation-that-didnt-burn-anyone` — the
  archive's final dive): house position — the window is the headline but
  mechanics decide burn (published policy > per-event promise; dated phases;
  API-as-channel/brownouts; day-one offramp; honest no-like-for-like;
  compounding clocks — Spark's `llm()` broke before Spark's own notice
  existed). Windows on file: Spark ~27d, Models 29d-to-dead, Cerebras ~1mo,
  MCP 12mo, HCP Vagrant ~21mo. Open loops: **how Cerebras lands 08-17**
  (clean = deprecation-named errors + stable catalog, not silent 404s — log
  either way); second limits-raised case study; first vendor marketing a
  migration plan as a feature. Guide: §01, §04, §05, §07.
- **Earned distribution still tops the stack** `→` — Juggler's 07-12 Show HN
  (276 pts, solo, unfunded, AGPL): reputation + a runnable artifact out-distributes
  launch budget (→ example); Launch HN is the default GTM for agent-infra startups.
  Tension: Block's Buzz (07-21, 304 pts, "LLM slop" verdict) — founder credibility
  buys attention, not the verdict. Guide: §06, §07.
- **AI features priced as seat + meter** `→` — the devtools default: per-seat
  license + metered model consumption; GitHub Code Quality GA extended it from
  generation to review (money article 07-22; §01 + practice carry the shape).
  **New variant 08-07**: Meta's Muse Code beta prices a "contributor" tier
  ~12x/21x cheaper for training rights on prompts/completions — a discount
  sold as a data trade, not volume or seats. Open loops: first *non-generative*
  feature on a metered AI line; Copilot promo-credit lapse (~Sept 2026) →
  bill-shock; a second vendor following Meta's data-tier shape. Guide: §01, §04.

## Special-issue candidates

Promote here when a thread recurs in signals AND the guide covers it thinly.
The Monday editor checks this list before deciding the issue's shape; most
weeks none is ripe and the issue stays normal — never force a special.

- **The measurable-ROI DevRel hiring bar** — one practitioner's claim (07-17);
  zero DevRelCon recaps corroborate it through 08-06. **Retire if none by
  mid-August** (the W32 weekly decides).
- **What a developer segment is actually worth** — if the plateau holds
  across the next SlashData wave, "pick a segment and go deep" deserves
  numbers: how operators size and choose segments. Not yet — watching.
- **The two-part tariff** — how AI features get priced (seat + meter's
  history, the cap as trust surface, where the meter breaks). Commission when
  the meter produces its first public bill-shock story — Copilot's
  promo-credit lapse (~Sept 2026) is the likely trigger. Watching.

## Evergreen shelf

Durable subjects a practitioner will still need in a year — always ripe.
A special issue may take from here when no trendy thread has earned the
depth. **Keep at least three on the shelf**: whoever takes one replaces it,
drawn from the thinnest guide sections.

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
