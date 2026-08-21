---
show: Scaling DevTools
episode: Rita Kozlov from Cloudflare — competing with the hyperscalers
date: 2025-08-21
url: https://podcast.scalingdevtools.com/episodes/rita-kozlov-from-cloudflare-competing-with-the-hyperscalers
guests:
  - Rita Kozlov (Cloudflare) — VP of Developers and AI
host: Jack Bridger
topics: [positioning, dx, org-design]
candidates: [practice]
distilled: 2026-08-21
---

## What it covers

Cloudflare's VP of Developers and AI on the strategic logic behind the
developer platform (Workers → containers), how a ~5,000-person company keeps
startup-speed shipping, and how product feedback stays close to engineers
rather than routing through a long chain.

## Claims worth checking

- [00:57–02:24] Cloudflare deliberately delayed shipping Containers as a
  standalone product for "quite a few years" despite running the underlying
  tech in production internally (dogfooded for Workers Builds, Browser
  Isolation), because the team debated whether it fit their efficiency-first
  platform story before releasing it to customers. Self-reported strategic
  rationale, not independently verified.
- [03:34–05:05] States Cloudflare's platform strategy explicitly as
  Christensen-style disruption: "we're not going to beat AWS... on their
  units of economics," so the bet is a more efficient compute model
  (Workers/isolates) rather than competing on hyperscaler terms. Attributed
  to company leadership being literal "students of Clay Christensen,"
  including the founders — a stated internal philosophy, not a measured
  outcome.
- [20:59–22:43] Ships with different rollout rigor by product maturity:
  built a feature-flagging system specifically to allow opt-in breaking
  changes to the Workers runtime API; new zero-user products ship fast with
  no canary process, while mature products get gradual/canary rollout.
  Concrete, checkable engineering practice as described by the VP overseeing
  it.
- [26:25–26:53] States Cloudflare is ~5,000 people versus an estimated "tens
  of thousands" at AWS — her own order-of-magnitude estimate, not a cited
  figure for AWS headcount.
- [29:35–31:20] Structure: generally one PM per product/engineering-manager
  pairing, with small "tiger teams" (a PM plus a few engineers pulled from
  other teams) spun up for new product bets, deliberately kept small to move
  fast. Self-described org practice.
- [32:39–35:19] Origin story of the Agents SDK: built by a small ad hoc group
  (Kozlov, Sunil Pai, Matt Silverlock and others) starting from writing the
  docs first, with an initial internal deadline set before code existed
  ("today is Feb 10, what if we launch March 1"); acknowledges publicly it
  "took longer than a weekend" contrary to how the story is sometimes told.
  Anecdotal, self-reported.

## Quotes

> "We're not going to beat AWS on their units of economics. But if we create
> a new way of running compute that is significantly more efficient, that
> does become a game that makes sense to play." — Rita Kozlov [00:00]

> "If you're not a little embarrassed by what you're shipping, you've waited
> too long." — Rita Kozlov [18:30]

## Why it matters here

Relevant to `01-positioning-for-developers` (disruption-framed positioning
against hyperscalers, stated explicitly rather than implied) and to the
thin `03-devrel-and-community`/org-design ground this site covers lightly
(small tiger teams, PM-as-voice-of-customer, docs-first product builds).
Everything here is one exec's account of her own company's internal
process and strategy — credible as a named, on-record practitioner
statement, but not a measured or third-party-verified result, and it
reads more like company mythology (disruption theory, "we hire curious
people") than a testable practice. The concrete, transferable piece is the
maturity-tiered rollout process (feature flags for breaking API changes,
canary by product age) — that is specific enough to cite.
