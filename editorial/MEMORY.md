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

## Running threads

Each thread carries a momentum tag (`↑` gaining / `→` steady / `↓` stalling)
and, when evidence cuts against it, a `Tension:` note inline. A thread that
keeps recurring in signals and isn't well covered by the guide is a
**deep-dive candidate** (flag it below).

- **AI assistants as a primary reader of your docs** `↑` — coding assistants
  and answer engines increasingly mediate a developer's first impression;
  practitioners restructure docs for machine retrieval and ship llms.txt
  (07-07 radar). Caveat held so far: no major AI provider has confirmed
  reading llms.txt — the durable win is chunk-retrievable docs. This site now
  eats the dog food (/llms.txt, /practices.json). Now compounding on three
  fronts: GEO-monitoring is getting productized (Show HN "Crawlie Cloud",
  07-10 signal), the machine-mediated-discovery thread is extending from docs
  to API/vendor selection itself (Show HN "OpenBenchmarks", 07-11 signal —
  agents picking SaaS APIs, not just reading about them), and now a live
  example of agent-safe API design as a shipped product surface — GoDaddy's
  new Developer Platform serves docs as markdown/plain-text/OpenAPI and adds
  quote-then-execute + idempotency + consent so an agent can transact, not
  just read (07-17 signal, example-candidate). W28 issue led with this thread
  ("from reading your docs to picking your vendor") and folded machine-reader
  bullets into §02 and §06; the commissioned deep dive **published 2026-07-17**
  ([dive](../src/content/deep-dives/2026-07-17-geo-for-devtools-when-the-reader-is-a-model.md)) —
  its three-layer frame (reading = act now / selection = design for / measurement
  = don't buy yet) is now the house position. Research hardened the llms.txt
  caveat into fact: Ahrefs (2026-06-15, 137K domains) found 97% of llms.txt
  files get zero requests and AI retrieval bots are 1.1% of what little traffic
  exists; Mueller (2026-06-02) calls it "purely speculative." Strongest pro
  numbers on record: Vercel at 10% of new signups from ChatGPT (Rauch,
  2025-04), ChatGPT referral conversion 7.1% (Similarweb, 2026-05), Profound
  at $1B valuation (2026-02). Open loop: the dive re-upped W28's falsifiable
  call — a second devtool company reporting attributed AI-referral signups
  with a number by end of Q3 2026; watch for it.
  Note: Crawlie moved domains crawlie.dev → crawlie.co mid-July — use .co.
  Guide: §02 (docs), §06 (channels). →
  [radar 07-07](../src/content/radar/2026-07-07-ai-assistants-are-reading-your-docs.md)
- **DevRel measurement: influence, not attribution** `↑` — the 2026
  practitioner consensus keeps landing on influenced pipeline + activation
  over last-touch sourced leads; new pressure: "does our brand show up in
  AI-generated answers" entering as a discovery metric (07-07 radar). Now
  showing up on the hiring side too: DevRel job postings reportedly screen for
  specific, measurable-ROI skills the listings don't state outright (07-17
  signal, one practitioner's account — watch for corroboration). The signal
  layer itself is consolidating into GTM stacks: Zoom is acquiring Common
  Room (announced 07-02, caught via a 07-17 Draft.dev breakdown) — third
  community/product-signal-to-revenue-attribution roll-up this year (Clari+
  Salesloft 12-2025, Apollo+Pocus 03-2026) — and Common Room's own 07-18 Otter
  case study shows the mechanism: first-party product usage, not intent data,
  drives the outbound play (07-18 signals). Guide: §08 (measurement), §03
  (devrel).
- **Developer population plateau → segment depth** `→` — SlashData puts the
  population at ~47M with growth decelerating to ~10% y/y, aging, shifting to
  South Asia / Greater China (07-06 radar). Direction durable, figures move
  each wave — re-check on new waves. Guide: §01 (positioning), §06 (channels).
- **Verification-first marketing** `↑` — developers fact-check claims in
  public, so ship proof, not adjectives: live verifiable metrics over logo
  walls, real prices with caps, runnable launches over influencer choruses
  (07-08 radar); connects to time-to-value as the real growth engine
  (07-06 dive). New cautionary case on the trust side: Cerebras quietly
  pruned its free-tier model catalog with no deprecation notice, breaking
  hardcoded integrations with silent 404s (07-16 signal) — the inverse
  lesson: silent breaking changes burn the same trust verifiable proof
  builds. Guide: §01, §05, §07.
- **Earned distribution still tops the stack** `→` — Juggler's 07-12 Show HN
  (276 points, solo, unfunded, AGPL) is the cleanest recent proof that
  reputation + a runnable open-source artifact out-distributes launch budget;
  promoted to examples (juggler-launches-on-reputation-and-a-runnable-repo).
  Watch for counter-evidence: earned launches that flop despite substance, or
  paid pushes that developers actually reward. Guide: §06, §07.

W28 orphan triage: Shopify's 07-09 plan-testing change (dx/time-to-value,
covered in the W28 "Also" section) dropped as a one-off — the time-to-value
thread already has its dive; Crawlie/OpenBenchmarks folded into the
AI-assistants thread above.

## Deep-dive candidates

Promote here when a thread is recurring in signals AND the guide only covers
it thinly. The weekly desk commissions from this list.

- **What a developer segment is actually worth** — if the population plateau
  holds across the next SlashData wave, the "pick a segment and go deep" claim
  deserves numbers: how operators size and choose segments. Not yet — watching.

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

- (none yet — newsroom founded 2026-07-17)

## Coverage index (published)

Weeklies and dives, newest first. Append one line each time. (Radar archive:
5 entries, 2026-07-05 → 2026-07-08 — closed.)

- 2026-07-17 · dive · *GEO for devtools: what to do when the reader is a model* · docs, channels, distribution
- 2026-W28 · weekly · *The agent reading your docs is starting to shop* · docs, channels, distribution, launches
- 2026-07-06 · dive · *Time-to-value: the growth engine hiding in your onboarding* · dx, activation, metrics
