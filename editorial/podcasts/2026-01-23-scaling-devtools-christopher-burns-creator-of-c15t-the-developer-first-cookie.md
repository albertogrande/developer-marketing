---
show: Scaling DevTools
episode: Christopher Burns - creator of c15t, the developer-first cookie banner
date: 2026-01-23
url: https://podcast.scalingdevtools.com/episodes/christopher-burns-creator-of-c15t-the-developer-first-cookie-banner
guests:
  - Christopher Burns (c15t / consent.io) — founder, second-time devtools founder
host: Jack Bridger
topics: [positioning, pricing, content, launches]
candidates: [practice]
distilled: 2026-08-14
---

## What it covers

Christopher Burns explains why he built c15t, an open-source, developer-first
cookie/consent-management framework, after closing his first startup and
almost taking a job at Vercel. The core positioning move: give developers a
seat at the table in a category (cookie banners/CMPs) built until now for
marketers and lawyers, ship the framework fully open source, and monetize the
layer above it (hosting, observability, legal-document generation,
indemnification) through consent.io. A long back half covers London-vs-SF
startup dynamics and is not developer-marketing material.

## Claims worth checking

- [34:27–36:39] Burns says c15t built its own benchmark, CookieBench, because
  Lighthouse wasn't fine-grained enough, and reports c15t renders a cookie
  banner in ~78ms — "seven times faster than the slowest [competitor] we
  benchmarked, but almost two times faster than the closest second" — then
  published the benchmark as open source. Self-reported, from the vendor
  running its own comparison; the benchmark tool itself is public, but the
  numbers are not independently verified here.
- [51:00–52:30] Frames the free open-source cookie banner as "the wedge" —
  giving away the component developers would self-host anyway, then charging
  for what a self-hosted version can't provide: legal indemnification if a
  banner is later found non-compliant. Stated as the company's pricing logic,
  not a measured outcome.
- [70:40–71:00 / "52% month on month growth on NPM downloads"] — self-reported
  growth metric, no absolute numbers, no source link, and no date range beyond
  "almost ending the year" (i.e., referring to 2025).
- [44:47] Cites an unnamed article claiming 70% of cookie banners are
  non-compliant (e.g., still firing Intercom/YouTube trackers after "decline
  all"). Third-hand claim, no source named on the episode.
- Guillermo Rauch (Vercel) is described as a vocal advocate who asked Burns to
  benchmark competitors and later became a partner (NextConf talk). Anecdotal,
  not independently corroborated here.

## Quotes

> "We think we should be giving away all these features for free to then say,
> okay, but you're gonna go pay a lawyer $15,000 to write your terms and
> conditions when we could do it for half the price." — Christopher Burns,
> on the open-core wedge [31:00]

> "The developer was never given a seat at the table, and we're the first tool
> to really give that developer a seat at the table." — Christopher Burns,
> on positioning against marketer/lawyer-first CMP incumbents [43:25]

## Why it matters here

A concrete open-core wedge pattern for `01-positioning-for-developers`: give
away the component a developer would build or self-host anyway, charge for the
liability/compliance layer a self-hosted version structurally can't offer.
The self-published CookieBench benchmark is a small, dated instance of the
standing verification-first-marketing thread (ship a runnable, open
comparison tool instead of a claimed number) — worth a mention if that guide
section gets a second example, though the numbers here are vendor-reported
and unverified, unlike HeimWall's or Cloudflare's entries already on record.

Weakest part for our purposes: every growth and benchmark figure is
self-reported with no independent source; treat as a practitioner narrative
of a positioning bet, not as evidence a reader can cite directly.
