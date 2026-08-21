---
show: Scaling DevTools
episode: How PlanetScale write content, with Ben Dicken
date: 2025-10-17
url: https://podcast.scalingdevtools.com/episodes/creating-developer-content-that-actually-works-with-planetscale
guests:
  - Ben Dicken (PlanetScale) — Developer Educator, ex-database engineer and CS faculty
host: Jack Bridger
topics: [content, dx]
candidates: [practice, example]
distilled: 2026-08-18
---

## What it covers

PlanetScale's developer educator on why its long-form interactive blog posts
(D3.js-built visualizations of hard drives, SSDs, tape systems) drive
outsized traffic, and the editorial philosophy behind them: value first,
product pitch confined to the end.

## Claims worth checking

- [04:14–05:22] The first interactive post (B-tree visualizations, made "for
  fun," not tied to a launch) got ~80,000 page views in the first one to two
  weeks and hit the Hacker News front page. Self-reported, no analytics
  screenshot, but a specific and checkable order of magnitude.
- [10:54–12:52] The flagship piece — [IO devices and latency](https://planetscale.com/blog/io-devices-and-latency)
  — was deliberately timed to PlanetScale Metal's launch, but the launch
  slipped ~6 months and Dicken used the extra time to deepen the visuals
  rather than ship to the original deadline. A concrete instance of "let the
  content slip with the launch, not the other way around."
- [12:23–13:12] Editorial bar stated as a question, not a checklist: "would
  an engineer want to read this?" — content should teach something real
  regardless of whether the reader ever buys, on the theory that the
  association with rigor is what builds brand trust with a technical buyer.
  Stated philosophy, not measured against a control.
- [24:11–26:36] Distinguishes two content jobs: broad-awareness pieces meant
  to go viral on evergreen tech (e.g., MySQL vs. Postgres internals, useful
  even to non-DBAs) versus benchmark/performance pieces aimed at engineers
  actively evaluating a database, timed to new releases (cites in-progress
  Postgres 17 vs. 18 async-IO benchmarking as an example of the latter).
- [36:11–39:48] The IO-devices post spends almost the entire piece on
  vendor-neutral storage history/education, with the PlanetScale Metal pitch
  concentrated at the end and a site banner at launch — his framing: "you
  can tell we're not BS-ing you" because of the research depth before the
  ask. The linked Hacker News top comment ("so good I forgot you were
  marketing a product to me") is cited as validation of the approach.
- [17:54–19:36] States PlanetScale is ~90% engineers with a small marketing
  function, and credits a "fully remote, writing-heavy culture" (drawing an
  analogy to early GitHub) for having many engineers who write their own
  technical blog posts. Anecdotal comparison, not a study.

## Quotes

> "Every time somebody interacts with something that I created for
> PlanetScale, I want them to be able to walk away having felt like I became
> a better engineer... regardless of whether they ever buy a database from
> PlanetScale." — Ben Dicken [00:00]

> "The bar shouldn't be meeting the bar." — Ben Dicken, on iterating past
> "good enough" on each post [22:21]

## Why it matters here

The clearest fit is `05-content-that-earns-trust`: an on-record, named
example of a devtool's flagship content piece with a real page-view figure
and a stated editorial rule (evergreen education first, product pitch last,
concentrated at the end). [IO devices and latency](https://planetscale.com/blog/io-devices-and-latency)
is itself an openable artifact — a live example candidate, not just a claim
about one — and the episode is the supporting source for why it was built
the way it was. Weakest part: every traffic number is self-reported without
analytics evidence, and "would an engineer want to read this" is a taste
heuristic, not a repeatable process — so it supports a practice about
editorial philosophy, not a measured technique.
