---
show: Scaling DevTools
episode: Lawrence Jones from Incident.io @ AIE Europe — building an AI SRE
date: 2026-04-14
url: https://podcast.scalingdevtools.com/episodes/lawrence-jones-from-incident-io-aie-europe
guests:
  - Lawrence Jones (Incident.io) — building an AI SRE product
host: Jack Bridger
topics: [dx/activation]
distilled: 2026-08-06
---

## What it covers

A short hallway-style interview at AI Engineers Europe. Jones describes
Incident.io's AI SRE (automated incident root-causing) ahead of general
availability: why raw "paste logs into an LLM" doesn't work (context limits,
no organizational memory), what their system does instead (structured
telemetry summarization, an org-context memory layer, a desktop app that
pairs a live coding-agent session back into the central investigation), and
a war story about the tool finding a China telecom timeout documented only
in Chinese-language carrier docs, correctly overriding the team's initial
firewall theory.

## Claims worth checking

- [01:30–01:51] "85–90% accuracy" on root-cause analysis for incidents run
  through a well-configured AI SRE setup. Self-reported, no methodology,
  denominator, or customer count given — vendor's own headline number about
  its own unreleased product.
- [00:41] Says the tool is "properly launching this for general access, like,
  very, very soon" as of the April recording — a launch-timing claim, not
  confirmed shipped as of this note; check for a GA announcement before
  citing.

## Quotes

> "If you just take [an LLM] and you say, hey, give it a shot, it will
> spiral off ... you can't really trust it." — Lawrence Jones [04:55–05:35]

## Why it matters here

Not evidence for anything measurable — it's a pre-GA product pitch with one
unverified accuracy figure. No `candidates` flag: nothing here clears the
practice bar (single-sourced, unmeasured) and it's not a distinct enough
thread for a deep dive on its own. Worth a grep-hit later only if a second,
independently sourced AI-SRE accuracy claim shows up — otherwise this stays
background.
