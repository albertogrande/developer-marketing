---
show: Scaling DevTools
episode: 'Matt Klein - cofounder of Bitdrift: meeting developers where they are and early days of AWS'
date: 2025-12-19
url: https://podcast.scalingdevtools.com/episodes/scaling-devtools-episode-matt-klein-bitdrift-mp4
guests: [Matt Klein]
host: Jack (Scaling DevTools)
topics: [dx/activation, devrel/community, launches]
candidates: [practice]
distilled: 2026-08-15
---

## What it covers

Matt Klein — creator of Envoy (open-sourced from Lyft in 2016, now
near-ubiquitous infrastructure) and cofounder/CEO of Bitdrift, a mobile
observability company spun out of Lyft in 2023 — on why Bitdrift added
commodity crash reporting even though its actual differentiator is
on-device data storage plus real-time, remotely-configurable capture rules
(avoiding the bandwidth/compute cost of shipping all telemetry to a
backend). He also covers Envoy's growth mechanics (build in the open on
GitHub, recruit users and co-maintainers deliberately, give conference
talks) and the difficulty of a corporate spinout keeping one big customer
(Lyft) without that counting as product-market fit.

## Claims worth checking

- Bitdrift customers wouldn't adopt without crash reporting even though
  it's not the product's differentiator, because "most mobile developers...
  never had observability. All they have is crash reporting" via
  Crashlytics/Bugsnag/Sentry — self-reported, anecdotal, from Klein's own
  sales conversations. [~35:00–36:07]
- Claim that adding crash reporting was a precondition for signing "some
  very big deals" currently in progress — self-reported, unverified
  (deals not yet closed at time of recording). [~36:20]
- Envoy's popularity attributed to being built for "dynamic" infrastructure
  (things constantly failing/moving, per the Kubernetes-era shift) rather
  than the more static networking software that preceded it, plus
  deliberate community-building on GitHub — Klein's own retrospective
  account, not a measured causal claim. [~19:28–22:28]

## Quotes

- "If they don't understand, it's our fault that they don't understand,
  not their fault... our product has to be better to make them figure out
  the better way." — Matt Klein [~00:00, ~45:26]
- "You have to meet customers where they are, and then you need to lead
  them to this promised place." — Matt Klein [~36:07]
- "No one wants more tools... if they can see a path to having less tools,
  that's a positive for sure." — Matt Klein, on the "single pane of glass"
  ambition in observability [~39:28]

## Why it matters here

Supports a practice: **when launching a differentiated product against an
entrenched incumbent workflow, ship the incumbent's table-stakes feature
before leaning on your differentiator** — Klein's account is that Bitdrift's
actual innovation (on-device storage, remote-configurable capture) didn't
matter to prospects who still needed basic crash reporting and didn't want
another vendor. This is self-reported founder experience, not measured
adoption data — the episode is evidence of one company's stated reasoning,
not of the tactic's effect on conversion or retention. Ties loosely to the
DX/activation guide section (`04`) on what a tool has to match before a
differentiator gets evaluated.
