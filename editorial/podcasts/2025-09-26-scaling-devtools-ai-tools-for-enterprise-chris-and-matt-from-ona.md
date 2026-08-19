---
show: Scaling DevTools
episode: AI Tools for Enterprise - Chris and Matt from Ona
date: 2025-09-26
url: https://podcast.scalingdevtools.com/episodes/building-ai-tools-for-enterprise
guests:
  - Chris (Ona, formerly Gitpod) — co-founder
  - Matt (Ona, formerly Gitpod)
host: Jack Bridger
topics: [positioning, dx, agents]
distilled: 2026-08-19
candidates: [practice]
---

## What it covers

Gitpod's rebrand to Ona (bought the freeletter.com-style ona.com domain), a
60-person company reframing a cloud-dev-environment product around AI agents
rather than human developers. The founders argue this is an extension, not a
pivot: the same VPC-deployable cloud dev environment now doubles as an
isolation boundary for coding agents at regulated enterprises (banks) that
won't allow local agent tools like Claude Code or Cursor to touch source
directly.

## Claims worth checking

- [~06:41] Self-reported: "It takes a developer four to five hours per week to
  set up and maintain a dev environment... we reduce that to ten seconds" —
  attributed to "studies and our own data," no study named or linked. Vendor
  claim.
- [~03:09–03:25] The name change is explained as literal: "pod" no longer
  applies since they left Kubernetes; "Git" undersold what the product does.
  Verifiable reasoning, not a data claim.
- [~13:02] Positioning claim: Ona replaces VDI (Citrix/RDP-style virtual
  desktops) at large regulated enterprises specifically because VDI is
  low-spec and laggy, and Ona's cloud environment + guardrails gives
  equivalent control without the bad experience. Stated as their core
  enterprise wedge, not independently measured.
- [~35:00] The rebrand's underlying thesis, from Matt: with agent capability
  now a commodity ("models are the great equalizer"), the only remaining
  differentiator is the execution environment and integration surface — not
  the model. Argued position, consistent with why they're selling
  infrastructure rather than a model wrapper.

## Quotes

> "The models are commodity... the only thing that's left to differentiate on
> is the environment, is the integration, and that's what we're going after."
> — Chris

> "Everything that makes humans more productive actually makes agents more
> productive too." — Matt

## Why it matters here

A live rebrand case study with the founders' own stated reasoning on the
record — useful raw material if a "why companies rename themselves for the
agent era" thread or practice ever gets written, though right now it's a
single self-interested account with no outside verification of the
productivity numbers. The VDI-replacement positioning and the
"forward-deployed engineer"-adjacent enterprise-navigation description
(getting an internal champion, then the C-level buy-in, to move together) are
the transferable parts; the "10 seconds vs 4-5 hours" figure is not
independently checkable and should not be cited as fact.
