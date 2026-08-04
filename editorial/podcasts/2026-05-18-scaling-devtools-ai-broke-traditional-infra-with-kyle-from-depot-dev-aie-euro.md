---
show: Scaling DevTools
episode: AI broke traditional infra - with Kyle from Depot.dev @ AIE Europe
date: 2026-05-18
url: https://podcast.scalingdevtools.com/episodes/kyle-depot-520afe9c-7809-47b2-89c6-0b5931da426b
guests:
  - Kyle Galbraith (Depot.dev) — CI/CD infrastructure
host: Jack Bridger
topics: [dx/activation, positioning, docs]
distilled: 2026-08-04
---

## What it covers

Kyle Galbraith on Depot CI, launched roughly two weeks before this recording
(early May 2026): a CI engine Depot built from scratch, first speaking GitHub
Actions syntax with a TypeScript/Python SDK planned, running on Depot's own
sandbox tech. His framing is that agent-driven code volume is breaking
existing CI/CD, source control, and review tooling built around a human at
every step, and that Depot CI's pitch is owning the full pipeline rather than
the ~30% Depot's GitHub Actions runners previously covered.

## Claims worth checking

- [00:24–00:49] "The response has been off the charts. Everybody's moving
  their GitHub Actions workflows over to Depot CI" — vendor's own
  characterization of uptake two weeks post-launch, no numbers attached.
- [02:58–03:32] "DevTools growth rate has more than doubled in the past
  three months... across revenue, across product usage," attributed
  "literally all of it" to AI/agents — self-reported, no baseline or figures
  given, Depot's own growth.
- [05:16–06:23] Claim that GitHub Actions is "struggling to keep one nine of
  reliability" under agent-driven load — anecdotal, asserted without a
  source or incident data; worth checking against GitHub's own status
  history before repeating.

## Quotes

> "It's kind of like saying water is wet in 2026, but DevTools growth rate
> has more than doubled in the past three months." — Kyle Galbraith [02:58]

> "What do we do when there's 10,000 agents on a 10-person engineering team
> producing 10x the amount of code that now needs to be reviewed?" — Kyle
> Galbraith [03:32]

## Why it matters here

A vendor's own launch narrative for a real product move (Depot CI, taking
the CI pipeline in-house rather than layering runners on GitHub Actions) —
useful as an example of a devtools company repositioning around "agent load
breaks legacy infra," but every growth and reliability claim here is
self-reported and unattributed. Not brief-worthy on its own (no verifiable
primary source beyond the founder's own words); flag if a second,
independently-sourced account of CI/CD strain under agent load surfaces —
that would make this a corroborating data point rather than one vendor's
pitch.
