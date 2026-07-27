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
- **2026-07-11, the examples swipe file** (new format, borrowed from
  markepear's Examples Gallery): `src/content/examples/` catalogs real, sourced
  dev-marketing artifacts — the *evidence* layer under the practices (rule) and
  the guide (judgment). Each ties to a guide section via `demonstrates` and
  carries a mandatory `source` link. **Cadence: promoted by the weekly editor,
  0–3 a week and often zero — never a quota** (same discipline as the deep
  dive); fed by the scout's ` · example-candidate` signal flag. No new
  workflow/cron — it rides the existing scout→weekly pipeline. Seeded with
  Stripe (§02), Supabase (§01), Tailscale (§05), Cloudflare (§07).
- **2026-07-11, desk transition**: the site's first phase (2026-07-05 →
  2026-07-08) published one radar post per day. That cadence forced a daily
  pick even on quiet days; the desks moved to signals (internal, daily) + The
  Week (published, Mondays). The radar entries remain rendered at /radar as an
  archive — never add new ones.
- **2026-07-17, the newsroom** (architecture from the sibling The Wire): the
  site becomes a technical newspaper on top of the field guide. Five writing
  desks (`AUTHORS.md`: news, money, campaigns, research, technology) publish
  to `src/content/articles/` — **at most one article a day, Tue–Sun, editor's
  call, never a quota** (the anti-padding lesson above is load-bearing). The
  editor's publish/skip decisions live in `editorial/NEWSROOM.md`; the
  evergreen idea pool in `editorial/BACKLOG.md`. Articles feed the product:
  guide patches, practice/example candidates, deep-dive flags. The radar
  lesson stands — if the newsroom starts padding, cut cadence, not quality.
- **2026-07-26, the directory + the newsletter** (two new surfaces, both
  policy-bound; charter rules 8 and 9 in `MASTHEAD.md` are the constraint).
  `src/content/resources/` catalogs **who a practitioner can hire** — 24 seed
  entries across six categories (content, positioning, devrel, docs, community,
  research), rendered at `/resources`, served at `/resources.json`, and joined
  to the tag graph. Bar for an entry: a live site, a *verifiable* `signal`, a
  `checked` date, and a `caveat` where one is warranted. **Nothing is for sale**
  and no provider previews its entry. Maintenance is on demand, not a cadence:
  when a scout signal names a provider (a rebrand, an acquisition, a shop
  closing) refresh or remove the entry and re-stamp `checked`; do not pad the
  list to make it look bigger. The newsletter is **The Week by email**, run
  in-house from `newsletter/` (capture service + own SMTP sender, double opt-in,
  HMAC-signed links, no pixels, no click tracking). The site's capture form is
  live only when `PUBLIC_NEWSLETTER_API` is set at build time; the send workflow
  (`newsletter.yml`, Mondays 09:00 UTC) skips cleanly while unconfigured. The
  email body *is* the published digest, so a correction to a weekly issue is a
  correction to what landed in inboxes — fix it in `src/content/weekly/` and say
  so in the next issue rather than silently editing history.

## Running threads

Each thread carries a momentum tag (`↑` gaining / `→` steady / `↓` stalling)
and, when evidence cuts against it, a `Tension:` note inline. A thread that
keeps recurring in signals and isn't well covered by the guide is a
**deep-dive candidate** (flag it below).

- **AI assistants as a primary reader of your docs** `↑` — machine-mediated
  discovery, from docs restructuring to agents selecting (and now buying from)
  vendors. House position = the GEO dive (published 2026-07-17): reading = act
  now, selection = design for, measurement = don't buy yet. Hard numbers on
  record: Ahrefs (2026-06-15, 137K domains) — 97% of llms.txt files get zero
  requests, AI retrieval bots ~1.1% of that traffic; pro side: Vercel ~10% of
  new signups from ChatGPT (Rauch, 2025-04), ChatGPT referral conversion 7.1%
  (Similarweb, 2026-05). **W29 turned the corner: incumbents shipped.**
  GoDaddy's Developer Platform (07-14 — markdown docs, hand-the-spec quickstart,
  quote-token + idempotency + consent purchase flow) → example
  (godaddy-builds-the-checkout-for-the-agent), practice
  (make-your-purchase-flow-agent-safe), new §02 "actionable by agents" bullet;
  Atlassian repositioned Jira as the human+agent orchestration hub (07-15).
  Open loop: the falsifiable call — a devtool reporting attributed AI-referral
  signups with a number by end of Q3 2026. (Crawlie domain: use .co.) New
  texture (07-23, antirez): argues repos should ship as templates for AI
  agents to *edit*, not just frozen releases for humans to read — reading
  vs. editing may be separate design problems; single-sourced, watching for
  practitioner pushback (07-24: no pushback found yet). New texture (07-24):
  OneCLI's Show HN (94 pts, OSS credential gateway keeping raw API keys away
  from agents) is a second buildable-category data point alongside GoDaddy's
  agent-safe checkout — "make the agent's actions safe by design" is starting
  to look like a pattern, not a one-off. Caveat (07-24 newsroom): OneCLI is not
  new — it first hit Show HN as "Vault for AI Agents in Rust" in March 2026, so
  treat this as a re-launch/corroboration, not a fresh category. Newsroom
  skipped it as a daily peg (two tools, one re-launch = weekly texture, not an
  article); the "safe-by-design" pattern is a **technology-desk article
  candidate once a third distinct tool lands** (backlog). Adjacent texture
  (07-25): Common Room's headless `cr` CLI + MCP write-layer lets agents
  execute GTM workflows directly, gated on identity resolution to stop
  agent-driven writes from creating duplicate records (Incident.io
  vendor-claimed 3%→0.3% duplicate-account rate) — same "guardrail the
  agent's actions by design" shape, but for CRM data integrity, not
  security/payments, so it's a cousin thread, not the third confirming tool.
  Newsroom skipped it as a daily peg (07-25): already-covered vendor +
  vendor-claimed proof only = weekly texture, not an article. Two more
  thin-traction Show HNs landed same-day (07-26): Axtary and ActionRail, both
  binding agent actions to pre-approved payloads before execution — volume of
  attempts on this shape keeps rising, but each individual entrant still has
  ~3 points, no adoption proof; the pattern call still rests on GoDaddy +
  OneCLI, not on count of launches. **Newsroom ran the category piece
  2026-07-26** (technology · Sam Arroyo ·
  [article](../src/content/articles/2026-07-26-agent-safe-by-design.md)): the
  backlog trigger ("write when a third distinct tool lands") is met and
  exceeded — five distinct entrants across payments/credentials/CRM/content/
  runtime, and what tipped it from "loud" to "moving" is *independent
  corroboration*: The New Stack's GoDaddy teardown (07-16, "then it had to build
  guardrails"), an arXiv pre-action-authorization spec attempt ("Open Agent
  Passport," authors' numbers: 53ms median, 0% on 879 top-tier attacks), and an
  NHI Mgmt Group analyst frame (07-10: authentication asks can-you-connect,
  runtime authz asks should-you-do-this-now; cites 80% of orgs seeing agents act
  beyond scope). House take: build the checkpoint if your product lets an agent
  take a consequential action, and *document* the transaction flow — a
  positioning claim competitors mostly can't make yet; §02's "actionable by
  agents" bullet gained the category+research framing (07-26). Open loops now:
  whether an OSS entrant posts real adoption vs. a launch spike; whether authz
  consolidates at the MCP layer / a cloud gateway / OAP; whether a second
  incumbent after GoDaddy ships an agent-safe flow and says so on the pricing
  page. New,
  under-sourced texture (07-25 web sweep): an "AgentRel" framing is emerging —
  Manicule pitches "DevRel rebuilt for a world where agents make the decisions"
  (self-reported $53K MRR / 100% MoM on a startup-listicle blog, not
  independently verified); a scout watch for the agent-as-buyer thread's
  positioning/vendor angle, not yet article-grade. Post-article texture
  (07-27): two more thin Show HNs (ModelFuzz runtime guardrails, an OpenCode
  tool-call verifier plugin, 2 pts each) landed the day after the 07-26
  category piece — attempt volume is still climbing, still no adoption proof;
  not a new data point, just confirms the piece published into a live trend
  rather than a peak. Guide: §02 (docs), §06 (channels).
- **DevRel measurement: influence, not attribution** `↑` — consensus on
  influenced pipeline + activation over sourced leads; AI-answer presence
  entering as a discovery metric. The signal layer is consolidating into GTM
  stacks: Zoom+Common Room (announced 07-02) is the third roll-up in eight
  months (Clari+Salesloft 12-2025, Apollo+Pocus 03-2026), all terms
  undisclosed — newsroom ran it 2026-07-18 (money · Mara Kessler ·
  [article](../src/content/articles/2026-07-18-community-signal-rollup.md)).
  House take: own the first-party signal (raw events in your own warehouse),
  measure community as influence not attribution. W29 distilled the Otter
  case study (07-17: 2x outbound pipeline, ~80% behavioral scoring, 10–12
  play cap) into practice (score-outbound-on-first-party-usage) and a new §08
  paragraph. Hiring side: one practitioner claims postings silently screen
  for measurable-ROI skills (07-17 teaser) — W29's watch item; DevRelCon NYC
  (07-22/23, wrapped 07-23) recaps are the corroboration test — none published
  yet, watch W31. GitHub's new Copilot impact dashboard (07-22: adoption-phase
  cohorts — code-first / agent-first / multi-agent / passive — replacing raw
  seat-activity counts) is a seller-side instance of influence-not-attribution,
  built to answer the ROI-skepticism gap HCLTech's 500-enterprise survey named
  the same week (90% say AI is transforming workflows, only 18% see
  significant revenue impact; vendor-commissioned, flag accordingly). Newsroom
  ran the dashboard 2026-07-23 (news · Rio Vidal ·
  [article](../src/content/articles/2026-07-23-copilot-passive-seats.md)):
  house take = report adoption in progression cohorts and *count the
  passive/licensed-but-unengaged seat* rather than hiding it in an "active"
  denominator; §08 gained the adoption-phase-cohorts bullet (07-23).
  Passive-seat/phase-cohort reporting is a live **practice-candidate** for the
  weekly (when reporting seat-based adoption → break out progression phases +
  the passive segment, because raw seat counts hide shelfware and buyers push
  on it). Open loops: the fourth signal-tool deal / first disclosed price;
  whether a second AI dev tool ships phase cohorts and "passive seat" enters
  renewal talks; the DevRelCon recaps. Guide: §08, §03.
- **Developer population plateau → segment depth** `→` — SlashData puts the
  population at ~47M with growth decelerating to ~10% y/y, aging, shifting to
  South Asia / Greater China (07-06 radar). Direction durable, figures move
  each wave — re-check on new waves. Guide: §01 (positioning), §06 (channels).
- **Verification-first marketing** `↑` — developers fact-check claims in
  public, so ship proof, not adjectives: live verifiable metrics, real prices
  with caps, runnable launches (07-08 radar); connects to time-to-value
  (07-06 dive). Named counter-case: Cerebras sunsets its free tier 2026-08-17
  ($5 credits behind a payment method) after quietly pruning its model
  catalog earlier this year — silent 404s on hardcoded integrations
  (single-sourced practitioner account). Tension / W29 correction: the
  "backlash" was smaller than the signals implied — the HN thread drew 4
  points and resignation, not outrage; the real cost is quiet re-anchoring,
  not a firestorm. §04 gained the deprecation-as-trust-event paragraph.
  Newsroom ran the HeimWall honest-benchmark post 2026-07-21 (campaigns ·
  Nico Ferrant · [article](../src/content/articles/2026-07-21-honest-benchmark-noise.md)):
  the copyable play is publishing the noise next to the signal (false-positive
  rate, top rule = 48% of alerts, own weak CredData F1 0.449), reproducible on
  the public DevGPT dataset. §05's honest-benchmarks bullet gained the
  publish-the-noise sharpening (07-21). Still ` · example-candidate` for the
  weekly swipe file. Guide: §01, §04, §05, §07.
- **Earned distribution still tops the stack** `→` — Juggler's 07-12 Show HN
  (276 points, solo, unfunded, AGPL) is the cleanest recent proof that
  reputation + a runnable open-source artifact out-distributes launch budget;
  promoted to examples (juggler-launches-on-reputation-and-a-runnable-repo).
  W29 channel-side read: Launch HN is the default GTM for agent-infra
  startups (Agnost YC S26, 85 pts 07-14; Coasty YC S26, 44 pts 07-15 — same
  batch, same channel, same week). Slop-era texture (Ask HN 07-15): forum
  answering 20 min/day before pitching; exact-match + negative keywords over
  abandoning paid search. First counter-evidence (07-21): Jack Dorsey's Block
  launched Buzz (open-source Slack+GitHub rival, agents get Nostr identity) on
  pure founder credibility — 304 HN pts but a skeptical verdict ("LLM slop") —
  reputation buys attention, not the verdict. Still watching for a paid push
  developers reward. Guide: §06, §07.
- **AI features priced as seat + meter** `↑` — the devtools category has
  converged on a two-part tariff for AI: a per-seat license plus metered
  model consumption. GitHub Code Quality's GA (07-20: $10/active committer/mo
  + usage-based AI detection & Autofix + CodeQL on Actions minutes) extends
  the shape from generation (Copilot) to *review*. Comparables on record:
  Copilot Business $19/Enterprise $39 per user/mo, each incl. matching AI
  Credits that drain by token usage since the 06-01-2026 usage-billing move;
  CodeRabbit Pro $24/dev/mo (annual) + on-demand credits past the rate limit.
  Newsroom ran it 2026-07-22 (money · Mara Kessler ·
  [article](../src/content/articles/2026-07-22-seat-plus-meter-pricing.md)).
  House take: the seat is the floor, not the price — publish both the seat and
  the meter, and the monthly cap with them (§01's legible-pricing/usage-cap
  advice is exactly where the AI meter bites; §04's silent-deprecation trust
  cost is the failure mode of an uncapped meter). Open loop: the first
  *non-generative* feature (security scan, docs, observability) put on a
  metered AI line, and whether Copilot's promo credits lapsing (~Sept 2026)
  produces bill-shock backlash. Counter-texture (07-23): a Show HN from
  Helical Insight un-gating its BI platform's paid tier (AI analytics,
  embedding, SSO, RLS) into Community Edition, monetizing on support/SLAs
  instead — traction was minimal (1 pt) so not yet evidence of a trend, just
  a data point to watch. Guide: §01, §04.

W29 orphan triage: Frhog (07-17) dropped as a one-off; Atlassian's Jira
repositioning folded into AI-assistants; Agnost/Coasty + Ask HN slop folded
into earned distribution.

## Deep-dive candidates

Promote here when a thread is recurring in signals AND the guide only covers
it thinly. The weekly desk commissions from this list.

- **What a developer segment is actually worth** — if the population plateau
  holds across the next SlashData wave, the "pick a segment and go deep" claim
  deserves numbers: how operators size and choose segments. Not yet — watching.
- **The measurable-ROI DevRel hiring bar** — one practitioner's claim (07-17
  DevRelCon teaser) that postings silently screen for quantified-impact
  skills. Commission only if the DevRelCon NYC recaps (conference 07-22/23)
  corroborate it across multiple talks — would pair the influence-not-
  attribution thread with the org/hiring angle the guide barely covers. W29
  skipped commissioning on this basis: single-sourced until the recaps land.

## Guide coverage index

The nine evergreen sections and what each owns. Keep the scout/weekly honest
about *where* a fact belongs.

- `00-start-here` — orientation, the mental model, how the site updates
- `01-positioning-for-developers` — positioning, segments, trust, proof
- `02-docs-as-front-door` — docs-led growth, quickstarts, machine-readable docs
- `03-devrel-and-community` — DevRel programs, community, advocacy
- `04-developer-experience-and-activation` — DX, onboarding, time-to-value
- `05-content-that-earns-trust` — technical content, honest benchmarks
- `06-channels-and-distribution` — where developers are, GEO/AI answers
- `07-launches` — launches developers amplify, HN/PH dynamics
- `08-measurement-and-metrics` — DevRel/marketing measurement, funnels

## Coverage index (articles)

Newsroom articles, newest first — `- YYYY-MM-DD · <desk> · *<title>* ·
<tags>`. The newsroom appends one line per published article; the editor
scans this (plus the index below) before assigning, so the paper never
re-runs a story in new clothes.

- 2026-07-26 · technology · *A checkpoint before the tool call: 'agent-safe by design' is becoming a category* · ai, agents, positioning, docs
- 2026-07-23 · news · *GitHub's Copilot dashboard now counts the seats nobody uses* · metrics, ai, github, devrel
- 2026-07-22 · money · *GitHub Code Quality shipped the default AI price: a seat, plus a meter* · pricing, ai, github, monetization
- 2026-07-21 · campaigns · *The security benchmark that published its own false-positive rate* · content, benchmarks, trust, security
- 2026-07-18 · money · *The community-signal category just got its third acquirer in eight months* · m&a, community, devrel, measurement

## Coverage index (published)

Weeklies and dives, newest first. Append one line each time. (Radar archive:
5 entries, 2026-07-05 → 2026-07-08 — closed.)

- 2026-W29 · weekly · *Incumbents start shipping for the agent-as-buyer* · docs, positioning, dx, launches
- 2026-07-17 · dive · *GEO for devtools: what to do when the reader is a model* · docs, channels, distribution
- 2026-W28 · weekly · *The agent reading your docs is starting to shop* · docs, channels, distribution, launches
- 2026-07-06 · dive · *Time-to-value: the growth engine hiding in your onboarding* · dx, activation, metrics
