# Editorial Memory

Agent-maintained. Read before running any desk (scout, weekly, deep-dive);
update after. Keep under ~150 lines — retire dead threads by deleting them
(git history preserves everything).

This is the brain that keeps the **guide** current and decides when a thread
has earned a **deep dive**. It is internal (not rendered).

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
  eats the dog food (/llms.txt, /practices.json). Guide: §02 (docs), §06
  (channels). → [radar 07-07](../src/content/radar/2026-07-07-ai-assistants-are-reading-your-docs.md)
- **DevRel measurement: influence, not attribution** `→` — the 2026
  practitioner consensus keeps landing on influenced pipeline + activation
  over last-touch sourced leads; new pressure: "does our brand show up in
  AI-generated answers" entering as a discovery metric (07-07 radar). Guide:
  §08 (measurement), §03 (devrel).
- **Developer population plateau → segment depth** `→` — SlashData puts the
  population at ~47M with growth decelerating to ~10% y/y, aging, shifting to
  South Asia / Greater China (07-06 radar). Direction durable, figures move
  each wave — re-check on new waves. Guide: §01 (positioning), §06 (channels).
- **Verification-first marketing** `↑` — developers fact-check claims in
  public, so ship proof, not adjectives: live verifiable metrics over logo
  walls, real prices with caps, runnable launches over influencer choruses
  (07-08 radar); connects to time-to-value as the real growth engine
  (07-06 dive). Guide: §01, §05, §07.

## Deep-dive candidates

Promote here when a thread is recurring in signals AND the guide only covers
it thinly. The weekly desk commissions from this list.

- **GEO for devtools: marketing when the reader is a model** — the AI-readers
  thread keeps compounding (docs restructuring, llms.txt, AI-answer presence
  as a discovery metric) and the guide covers it in fragments across §02/§06.
  A dive on what a devtool marketer should actually do about machine-mediated
  discovery — what's measurable, what's cargo cult — is close to ripe.
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

## Coverage index (published)

Weeklies and dives, newest first. Append one line each time. (Radar archive:
5 entries, 2026-07-05 → 2026-07-08 — closed.)

- 2026-07-06 · dive · *Time-to-value: the growth engine hiding in your onboarding* · dx, activation, metrics
