# Editorial Memory

Agent-maintained. Read before running any desk (scout, newsroom, weekly,
deep-dive); update after. Keep under ~170 lines — retire dead threads by
deleting them (git history preserves everything).

This is the brain that keeps the **guide** current, decides when a thread
has earned a **deep dive**, and gives the **newsroom** its sense of what's
already been said. It is internal (not rendered).

## Standing editorial findings

- **2026-07-11, the practices bar** (inherited from the sibling Claude Code
  guide's measured evals): a corpus's edge over a bare model is current, dated,
  sourced facts — not timeless judgment the model already has. Write practices
  for dated survey waves, channel shifts, and measured patterns first.
  Practices that decay to "model already knows this" get retired or refreshed.
- **2026-07-11, the examples swipe file** (format borrowed from markepear's
  Examples Gallery): `src/content/examples/` catalogs real, sourced
  dev-marketing artifacts — the *evidence* layer under the practices (rule) and
  the guide (judgment). **Cadence: promoted by the weekly editor, 0–3 a week
  and often zero — never a quota**; fed by the scout's ` · example-candidate`
  flag. Rides the existing scout→weekly pipeline, no separate workflow.
- **2026-07-11, desk transition**: the site's first phase (2026-07-05 →
  2026-07-08) published one radar post per day; that quota forced picks on
  quiet days. Now: signals (internal, daily) + The Week (published, Mondays).
  Radar stays rendered as an archive — never add new entries.
- **2026-07-17, the newsroom** (architecture from the sibling The Wire): five
  writing desks (`AUTHORS.md`) publish to `src/content/articles/` — **at most
  one a day, Tue–Sun, editor's call, never a quota**. Decisions log to
  `editorial/NEWSROOM.md`; idea pool in `editorial/BACKLOG.md`. Articles feed
  the product: guide patches, practice/example candidates, deep-dive flags.
  If the newsroom starts padding, cut cadence, not quality.
- **2026-07-26, the directory + the newsletter** (both policy-bound; charter
  rules 8 and 9 in `MASTHEAD.md`). `src/content/resources/` catalogs who a
  practitioner can hire — 24 seed entries, six categories, `/resources` +
  `/resources.json`. Bar: live site, verifiable `signal`, `checked` date,
  `caveat` where warranted. **Nothing is for sale**, no provider previews.
  Maintenance on demand (when a signal names a provider), not a cadence. The
  newsletter is **The Week by email** from `newsletter/` (double opt-in,
  HMAC links, no pixels); send workflow skips while unconfigured. The email
  body *is* the digest — correct a weekly in `src/content/weekly/` and say so
  in the next issue, never silently.

## Running threads

Each thread carries a momentum tag (`↑`/`→`/`↓`) and a `Tension:` note when
evidence cuts against it. Recurring + thinly covered by the guide = deep-dive
candidate (flag below).

- **AI assistants as a primary reader of your docs** `↑` — machine-mediated
  discovery: reading → selection → transaction. House position = the GEO dive
  (2026-07-17): reading = act now, selection = design for, measurement = don't
  buy yet. Numbers on record: Ahrefs 2026-06-15 (137K domains) — 97% of
  llms.txt files get zero requests, AI bots ~1.1% of traffic; Vercel ~10% of
  new signups from ChatGPT (Rauch, 2025-04); ChatGPT referral conversion 7.1%
  (Similarweb, 2026-05). W29: incumbents shipped — GoDaddy Developer Platform
  (07-14; agent-safe checkout → example + practice + §02 bullet), Atlassian
  repositioned Jira as the human+agent hub (07-15). W30: **"agent-safe by
  design" hardened into a category** — OneCLI (07-24 Show HN, 94 pts, 2.9k
  stars, credential gateway), Common Room's headless `cr` CLI + MCP write
  layer gated on identity resolution (07-24; Incident.io 3%→0.3% dupes,
  vendor-claimed), Axtary + ActionRail (07-26, thin). Canonical detail now
  lives in the 07-26 technology article (agent-safe-by-design): what tipped it
  was independent corroboration (The New Stack GoDaddy teardown 07-16, arXiv
  "Open Agent Passport" spec attempt, NHI runtime-authz frame with the
  80%-act-beyond-scope figure). §02 carries the category framing. Texture:
  antirez (07-23) argues repos should ship as templates for agents to *edit* —
  single respected voice, no pushback or adoption evidence yet; "AgentRel"
  vendor framing (Manicule, self-reported $53K MRR, unverified) on scout
  watch. Open loops: a devtool reporting attributed AI-referral signups with a
  number by end of Q3 2026 (the standing falsifiable call); whether any OSS
  guardrail entrant posts real adoption vs. a launch spike; where pre-action
  authz consolidates (MCP layer / cloud gateway / OAP); a second incumbent
  after GoDaddy shipping an agent-safe flow and saying so on the pricing
  page. W31: Google made the retrieval/ranking split explicit and citable —
  Search Central's optimization guide now tells sites to skip llms.txt for
  AI-features ranking (confirmed by Illyes/Taboul at Search Central Live
  APAC, 07-28 signal), while Chrome Lighthouse 13.3 shipped an "Agentic
  Browsing" audit category that checks llms.txt, WebMCP, and agent
  accessibility — corroborates rather than disproves the guide's existing
  hedge (§02, §06 already frame llms.txt as agent-retrieval, not SEO).
  Kastra (07-28 Show HN, 13 pts) extends the agent-safe-by-design roster with
  a cross-tool policy layer (Claude Code/Cursor/Codex at once) rather than a
  single-tool guardrail. Guide: §02, §06.
- **DevRel measurement: influence, not attribution** `↑` — consensus on
  influenced pipeline + activation; AI-answer presence entering as a discovery
  metric. Signal layer consolidating into GTM stacks: Zoom+Common Room
  (07-02) was the third roll-up in eight months (Clari+Salesloft 12-2025,
  Apollo+Pocus 03-2026), all terms undisclosed — money article 2026-07-18.
  Otter case distilled W29 (2x outbound pipeline, ~80% behavioral scoring,
  10–12 play cap → practice score-outbound-on-first-party-usage, §08). W30
  extension to the *seller* side: GitHub's Copilot impact dashboard (07-22 —
  phase cohorts code-first/agent-first/multi-agent + a named "Passive"
  licensed-but-unengaged segment; news article 07-23, §08 bullet, practice
  report-seat-adoption-in-phase-cohorts distilled 07-27) landing the same week
  as HCLTech/Raconteur's 500-enterprise survey (90% say AI transforms
  workflows, 18% see significant revenue impact; vendor-commissioned). W30
  digest thesis: the seat-seller arming buyers to count shelfware = the
  renewal conversation running on proof. Hiring side: the measurable-ROI
  hiring-bar claim (07-17 teaser) is still single-sourced — DevRelCon NYC
  wrapped 07-23 and **no recaps published through 07-26**; carried to W31
  with a deadline (no recaps by mid-August → it was one person's job search).
  Open loops: fourth signal-tool deal / first disclosed price; the W30 watch —
  a second AI devtool shipping phase-cohort/passive-seat reporting, or a
  public renewal story citing a passive-seat count, by end of Q3; the recaps.
  Guide: §08, §03.
- **Developer population plateau → segment depth** `→` — SlashData: ~47M
  developers, growth decelerating to ~10% y/y, aging, shifting to South Asia /
  Greater China (07-06 radar). Direction durable, figures move each wave —
  re-check on new waves (none since April). Guide: §01, §06.
- **Verification-first marketing** `↑` — developers fact-check in public;
  ship proof, not adjectives. W30 extended the frame downstream to renewals
  (see DevRel-measurement thread: name your own shelfware before the buyer
  computes a hostile version). HeimWall's honest-benchmark post (07-21
  campaigns article; publish the noise next to the signal — 1.12% alert rate,
  48% of alerts one UUID rule, own F1 0.449 on CredData, rerunnable on public
  DevGPT) **promoted to examples 07-27**
  (heimwall-publishes-the-noise-with-the-benchmark). Counter-case: Cerebras
  sunsets its free tier 2026-08-17 ($5 credits behind a payment method) after
  quietly pruning its model catalog — the cost is quiet re-anchoring, not a
  firestorm (HN thread drew 4 pts); §04 carries the
  deprecation-as-trust-event paragraph. Open loop: how the 08-17 sunset
  actually lands. Guide: §01, §04, §05, §07.
- **Earned distribution still tops the stack** `→` — Juggler's 07-12 Show HN
  (276 pts, solo, unfunded, AGPL) is the cleanest proof that reputation + a
  runnable artifact out-distributes launch budget (→ example). Launch HN is
  the default GTM for agent-infra startups (Agnost + Coasty, YC S26, same
  week). Tension: Block's Buzz (07-21, 304 HN pts, skeptical "LLM slop"
  verdict) — founder credibility buys attention, not the verdict. Slop-era
  texture: answer forums 20 min/day before pitching; exact-match + negative
  keywords over abandoning paid search. Still watching for a paid push
  developers reward. Guide: §06, §07.
- **AI features priced as seat + meter** `↑` — the devtools default: per-seat
  license + metered model consumption. GitHub Code Quality GA (07-20:
  $10/active committer/mo + usage-based AI detection/Autofix + CodeQL on
  Actions; 10,000+ enterprises in preview) extended the shape from generation
  to review. Comparables: Copilot Business $19 / Enterprise $39 per user/mo
  with AI credits draining by usage (since 06-01-2026); CodeRabbit Pro
  $24/dev/mo + on-demand credits. Money article 07-22; W30 digest led with
  it; §01 now carries the shape + publish-seat-meter-and-cap evergreen
  (07-27); practice price-ai-features-as-seat-plus-meter distilled 07-27.
  Counter-texture: Helical Insight un-gated its paid tier into Community
  Edition (07-23, 1 pt — a data point, not a trend). Open loops: first
  *non-generative* feature (security scan, docs, observability) on a metered
  AI line; whether Copilot's promo credits lapsing (~Sept 2026) produces
  bill-shock backlash. Guide: §01, §04.

W30 orphan triage: nothing orphaned — Buzz folded into earned distribution,
antirez + AgentRel into AI-assistants, Helical into seat+meter, DevRelCon
silence into DevRel measurement.

## Deep-dive candidates

Promote here when a thread recurs in signals AND the guide covers it thinly.
A dive ships **every Thursday**; this list is the trendy half of what it picks
from. These entries are gated on outside events, so the list is often not ripe
— that is expected and is why the evergreen shelf below exists. A dive is never
skipped for want of a hot thread; it goes evergreen instead.

- **The measurable-ROI DevRel hiring bar** — one practitioner's claim (07-17)
  that postings silently screen for quantified-impact skills. Commission only
  if DevRelCon NYC recaps corroborate across multiple talks. Status: wrapped
  07-23, zero recaps through 07-26; W29 and W30 both skipped on this basis.
  **Retire if no recaps by mid-August.**
- **What a developer segment is actually worth** — if the plateau holds
  across the next SlashData wave, "pick a segment and go deep" deserves
  numbers: how operators size and choose segments. Not yet — watching.
- **The two-part tariff** — how AI features get priced (seat + meter's
  history, the cap as trust surface, where the meter breaks). Guide covers it
  in one §01 bullet; thread is hot but the money article (07-22) is fresh.
  Commission when the meter produces its first public bill-shock story —
  Copilot's promo-credit lapse (~Sept 2026) is the likely trigger. Watching.

## Evergreen shelf

Durable subjects a practitioner will still need in a year — no news hook
required, so they are always ripe. Thursday's dive takes from here whenever no
trendy thread has earned the depth, which is most weeks. **Keep at least three
on the shelf**: whoever takes one replaces it, drawn from the guide sections
the coverage index shows as thinnest. A dive that goes evergreen is a normal
week, not a fallback.

- **What a quickstart owes the reader** — the anatomy of a first five minutes:
  what to cut, what to hard-code, when a sandbox key beats a signup, and how
  operators actually measure the drop-off. Guide covers the principle in §02
  and §04 but never the mechanics. (`02`, `04`)
- **Pricing pages developers trust** — why the free tier's shape reads as a
  promise, what a published limit signals, and what happens to trust when a
  tier moves. Cerebras' 07-16 sunset is a live case; the subject outlives it.
  (`01`)
- **The deprecation that didn't burn anyone** — migration windows, codemods,
  and the comms cadence that separates a clean deprecation from a churn event.
  §04 owns "deprecation trust" in a single bullet. (`04`)
- **What to report to a CFO** — the DevRel measurement question underneath the
  influence-vs-attribution argument: which four numbers survive contact with
  finance, and what each one costs to collect. (`03`, `08`)

## Guide coverage index

The nine evergreen sections and what each owns. Keep the scout/weekly honest
about *where* a fact belongs.

- `00-start-here` — orientation, the mental model, how the site updates
- `01-positioning-for-developers` — positioning, segments, trust, proof, pricing shape
- `02-docs-as-front-door` — docs-led growth, quickstarts, machine-readable docs, agent-safe flows
- `03-devrel-and-community` — DevRel programs, community, advocacy
- `04-developer-experience-and-activation` — DX, onboarding, time-to-value, deprecation trust
- `05-content-that-earns-trust` — technical content, honest benchmarks
- `06-channels-and-distribution` — where developers are, GEO/AI answers
- `07-launches` — launches developers amplify, HN/PH dynamics
- `08-measurement-and-metrics` — DevRel/marketing measurement, funnels, adoption cohorts

## Coverage index (articles)

Newsroom articles, newest first — `- YYYY-MM-DD · <desk> · *<title>* ·
<tags>`. The newsroom appends one line per published article.

- 2026-07-26 · technology · *A checkpoint before the tool call: 'agent-safe by design' is becoming a category* · ai, agents, positioning, docs
- 2026-07-23 · news · *GitHub's Copilot dashboard now counts the seats nobody uses* · metrics, ai, github, devrel
- 2026-07-22 · money · *GitHub Code Quality shipped the default AI price: a seat, plus a meter* · pricing, ai, github, monetization
- 2026-07-21 · campaigns · *The security benchmark that published its own false-positive rate* · content, benchmarks, trust, security
- 2026-07-18 · money · *The community-signal category just got its third acquirer in eight months* · m&a, community, devrel, measurement

## Coverage index (published)

Weeklies and dives, newest first. Append one line each time. (Radar archive:
5 entries, 2026-07-05 → 2026-07-08 — closed.)

- 2026-W30 · weekly · *The AI seat gets a price — and the empty ones get counted* · pricing, metrics, docs, launches
- 2026-W29 · weekly · *Incumbents start shipping for the agent-as-buyer* · docs, positioning, dx, launches
- 2026-07-17 · dive · *GEO for devtools: what to do when the reader is a model* · docs, channels, distribution
- 2026-W28 · weekly · *The agent reading your docs is starting to shop* · docs, channels, distribution, launches
- 2026-07-06 · dive · *Time-to-value: the growth engine hiding in your onboarding* · dx, activation, metrics
