---
show: Scaling DevTools
episode: Baseten CEO and co-founder Tuhin Srivastava on inference and feedback loops
date: 2025-11-14
url: https://podcast.scalingdevtools.com/episodes/scaling-ai-infrastructure-with-basetens-tuhin-srivastava
guests:
  - Tuhin Srivastava (Baseten) — CEO and co-founder
host: Jack Bridger
topics: [dx, activation, positioning, metrics]
distilled: 2026-08-17
---

## What it covers

Tuhin Srivastava traces Baseten's path from a 2019 "picks and shovels for ML"
bet through a slow multi-year build phase to explosive growth once the
generative-AI market arrived in 2023 (headcount roughly 20 → 100+ in eighteen
months, a $150M Series D by the time of recording). The back half is a
DX-principles conversation: what makes an infrastructure product usable under
speed pressure, and how Baseten decides what to build next around a single
metric — inference volume.

## Claims worth checking

- [08:08–08:51] His stated rule for moving fast at a small company: "kill the
  feedback loops between you and your customer" — ship, hear feedback,
  improve, communicate, retest, as fast as possible. Self-reported operating
  principle, not measured.
- [13:12–14:36] Baseten's product decisions run through one filter — "will
  this lead to more inference?" — described as the company's literal
  build/buy/partner test, including which cloud-compute partnerships to sign.
  Self-reported strategy, not independently verified.
- [15:29–17:29] Three DX factors he names as what developers actually get
  frustrated about with inference infra: speed, debuggability, and
  observability once a model is in production. Anecdotal, from his own
  customer conversations.
- [16:51–17:05] His summary DX principle, stated as a direct echo of what he
  says Vercel and PlanetScale also do: "make the easy things easy, make the
  hard things possible, don't let the developer get blocked." Framing, not a
  new data point.
- [22:21–22:48] Founder advice: resist scaling before the product is right,
  because early abstraction/technology decisions are expensive to reverse
  once customers depend on them. Self-reported, generic startup advice framed
  around his own experience.

## Quotes

> "Make it easy to get started. Make the easy things easy. Make the hard
> things possible. Don't let the developer get blocked." — Tuhin Srivastava
> [00:00]

> "We just need to kill the feedback loops between you and your customer...
> and make them really, really, really fast." — Tuhin Srivastava [08:08]

## Why it matters here

A named practitioner's version of the guide's activation argument: speed of
the build-feedback-ship loop as the operating metric for an infra devtool,
not a headline KPI. Useful as an attributed practice for
`04-developer-experience-and-activation`, but every claim here is founder
self-report from one company's growth story — none of it is measured or
independently checkable, and the episode is not evidence that this approach
generalizes beyond Baseten.
