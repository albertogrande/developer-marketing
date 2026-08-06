# Editorial Memory

Agent-maintained; internal. Read before running any desk; update after. Keep
under ~170 lines (`scripts/check-editorial.mjs` enforces it) — retire dead
threads by deleting them; git history preserves everything. Detail that
shipped in a published piece lives in that piece — keep the pointer and the
open loops here, not the narrative. This is the brain that keeps the
**guide** current, decides when a thread has earned a **deep dive**, and
gives the **newsroom** its sense of what's already been said.

## Standing editorial findings

- **2026-07-11, the practices bar**: a corpus's edge over a bare model is
  current, dated, sourced facts — not timeless judgment. Practices that decay
  to "model already knows this" get retired or refreshed.
- **2026-07-11, the examples swipe file**: `src/content/examples/` catalogs
  real, sourced artifacts — the evidence layer under practices and guide.
  **Weekly-editor promotion, 0–3/week, often zero — never a quota.**
- **2026-07-11, desk transition**: daily radar quota retired; now signals
  (internal, daily) + The Week (Mondays). Radar is closed — never add.
- **2026-07-17, the newsroom**: five desks (`AUTHORS.md`) publish to
  `src/content/articles/` — **≤1/day, Tue–Sun, editor's call, never a
  quota**. Decisions → `editorial/NEWSROOM.md`; ideas → `BACKLOG.md`. If the
  newsroom starts padding, cut cadence, not quality.
- **2026-07-26, the directory + the newsletter** (charter rules 8 and 9).
  `src/content/resources/` = who to hire (live site, verifiable `signal`,
  `checked` date, **nothing for sale**; maintenance on demand). Newsletter =
  The Week by email; correct a weekly in `src/content/issues/` and say so in
  the next issue, never silently.

## Running threads

Momentum tags `↑`/`→`/`↓`; `Tension:` when evidence cuts against a thread.
Recurring + thinly covered by the guide = deep-dive candidate (flag below).

- **AI assistants as a primary reader of your docs** `↑` — machine-mediated
  discovery: reading → selection → transaction. House position = the GEO dive
  (2026-07-17): reading = act now, selection = design for, measurement = don't
  buy yet. **"Agent-safe by design" is a category** — canonical
  detail in the 07-26 technology article; roster keeps growing (OneCLI, Common
  Room `cr`, Axtary, ActionRail, Kastra, Sinch Agent Tools 08-04; Tines 3B =
  citizen-builder governance).
  **MCP became infrastructure** —
  the 2026-07-28 spec (stateless core, CIMD auth, ~12-month deprecation
  offramp, all Tier-1 SDKs day one, six hyperscalers committed) is canonical
  in the 07-29 technology article; download figures = self-reported SDK pulls,
  vendor commitments ≠ shipped integrations. Follow-through fast: Copilot code
  review skills+MCP GA + Anthropic rollout 07-29. W31 digest + guide (§02 MCP
  bullet, §06) + practice carry MCP-as-table-stakes and the Google retrieval/
  ranking split (Search ignores llms.txt; Lighthouse audits it unscored).
  `SKILL.md` sub-thread: Copilot GA = GitHub as second skills-as-a-file vendor;
  promote on a third + usage evidence. **Stranded-integrator open loop → news article 08-04**
  (`2026-08-04-mcp-directory-review`, Rio): the directory is a *gated distribution
  channel*, not a formality — reframed off Symonds's single-sourced 4-month vs
  OpenAI-29-day peg onto multiply-sourced review mechanics (Anthropic docs+policy:
  Team/Enterprise portal, no SLA, missing privacy policy = instant reject; Tallyfy +
  sunpeak: "plan in weeks not days," a missing item resets queue place, functional
  test on every tool). Nuance on record: intake migrated Google Form → portal, likely
  why the old queue was discarded. House move → guide §06 (build ≠ distribute; treat
  submission like App Store review, never make one directory your only path). Watching:
  corroboration of *other* stranded Google-Form-era submitters; a review SLA/appeals path.
  "Agent experience" analytics is now a category not one tool (Armature YC 08-04 +
  AgentCat, both MCP-session reconstruction). Open loops: a devtool reporting attributed
  AI-referral signups with a number by end of Q3 2026; a major MCP host publishing a dated
  migration plan by end of Sept; where pre-action authz consolidates. Guide: §02, §06.
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
  (08-01 article; example + practice promoted 08-03). Deprecation cases feed
  Thursday's dive — four dated windows now: HCP Vagrant EOL 08-04 (~21mo,
  longest on record), MCP's 12-month offramp, GitHub Models 07-30 (six weeks,
  no like-for-like), GitHub Spark 08-05 brief (~27-day export, shortest yet);
  Cerebras free-tier sunset lands 08-17. Dive nuance: Spark's `llm()` calls
  broke 07-30 with Models, so a clean window still burned its AI apps. Open
  loops: how Cerebras lands; a second vendor framing a case study around
  limits-raised. Guide: §01, §04, §05, §07.
- **Earned distribution still tops the stack** `→` — Juggler's 07-12 Show HN
  (276 pts, solo, unfunded, AGPL): reputation + a runnable artifact out-distributes
  launch budget (→ example); Launch HN is the default GTM for agent-infra startups.
  Tension: Block's Buzz (07-21, 304 pts, "LLM slop" verdict) — founder credibility
  buys attention, not the verdict. Guide: §06, §07.
- **AI features priced as seat + meter** `→` — the devtools default: per-seat
  license + metered model consumption; GitHub Code Quality GA extended it from
  generation to review (money article 07-22; §01 + practice carry the shape).
  Quiet since. Open loops: first *non-generative* feature on a metered AI line;
  whether Copilot promo-credit lapse (~Sept 2026) → bill-shock. Guide: §01, §04.

## Deep-dive candidates

Promote here when a thread recurs in signals AND the guide covers it thinly.
A dive ships **every Thursday**; these are the trendy half of what it picks
from, gated on outside events — often not ripe. A dive never skips for want
of a hot thread; it goes evergreen instead.

- **COMMISSIONED 2026-08-03 → editorial/COMMISSION.txt**: *The deprecation that
  didn't burn anyone* — migration windows as the trust surface; MCP's twelve-month
  offramp vs GitHub Models' six weeks vs Cerebras landing 08-17. Taken from the
  evergreen shelf; Thursday's run replaces the shelf entry if it writes it.
- **The measurable-ROI DevRel hiring bar** — one practitioner's claim (07-17)
  that postings silently screen for quantified-impact skills. Commission only
  if DevRelCon NYC recaps corroborate it across multiple talks; zero recaps
  through 08-03. **Retire if none by mid-August** (the W32 weekly decides).
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
- **The deprecation that didn't burn anyone** — migration windows as the
  trust surface. **Commissioned 08-03** — replace this entry once written. (`04`)
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
