---
show: Scaling DevTools
episode: Cloudflare devs @ AI Engineers Europe (Sunil Pai, Matt Carey & Thomas Ankcorn)
date: 2026-05-27
url: https://podcast.scalingdevtools.com/episodes/cloudflare-devs
guests:
  - Sunil Pai (Cloudflare)
  - Matt Carey (Cloudflare) — code mode
  - Thomas Ankcorn (Cloudflare) — observability
host: Jack Bridger
topics: [devrel, positioning, docs]
distilled: 2026-08-04
---

## What it covers

A short, informal hallway interview at AI Engineer Europe (London) with three
Cloudflare engineers, recorded conference-floor style — mostly banter and
gossip about the event, with one substantive thread: "code mode," Cloudflare's
push to have models write code against an API rather than call a fixed menu of
static tools, and a claim that this reduces the tool-definition surface an
agent needs to hold in context.

## Claims worth checking

- [05:57–06:21] Matt Carey frames code mode as deliberately shrinking the
  number of static tools exposed to a model, in favor of one "write code"
  tool the model uses against an external API — his own description of the
  design intent, not a measured result.
- [06:28–07:29] Sunil Pai predicts code mode won't stay Cloudflare-specific —
  "we suspect every provider is going to be this" — a prediction, stated with
  confidence, no data.
- [08:00–08:53] Thomas Ankcorn's claim that agent-assisted PRs made
  contributing to Cloudflare's internal repos fast, but shifted the
  bottleneck to maintainer trust and relationships — anecdotal, one
  engineer's internal experience.

## Quotes

> "The idea of code mode is that we just let the model write code, and we try
> and reduce the amount of static tools that we expose to the model." — Matt
> Carey [05:57]

> "We suspect that there's no way that it remains a Cloudflare-only thing." —
> Sunil Pai, on code mode spreading to other providers [07:11]

## Why it matters here

Thin evidentiary value — this is conference-floor banter, not a structured
interview, and every claim is one engineer's stated intent or prediction. The
one thing worth tracking: "code mode" (write code against an API instead of
calling static tools) is a second, distinct angle on shrinking an agent's
tool-call surface, adjacent to but not the same as the "agent-safe-by-design"
guardrail category already on record — that pattern gates *what* an agent can
call, this one changes *how* it calls anything at all. Not yet corroborated
outside Cloudflare's own team.
