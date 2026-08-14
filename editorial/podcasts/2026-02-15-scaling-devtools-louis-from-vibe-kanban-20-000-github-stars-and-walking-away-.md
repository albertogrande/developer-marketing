---
show: Scaling DevTools
episode: Louis from Vibe Kanban - 20,000 GitHub stars and walking away from 6-figure deals
date: 2026-02-15
url: https://podcast.scalingdevtools.com/episodes/louis-from-vibe-kanban-20-000-github-stars-and-walking-away-from-6-figure-deals
guests:
  - Louis (Vibe Kanban) — cofounder; previously built a code-search startup and a COBOL/legacy-modernization services business before pivoting to Vibe Kanban
host: Jack Bridger
topics: [community, distribution, positioning, devrel]
candidates: [practice]
distilled: 2026-08-11
---

## What it covers

Louis (Vibe Kanban) traces three pivots — an embeddings/code-search startup
(2021), a year of legacy COBOL-modernization services work, then Vibe Kanban,
an open-source multi-agent coding-agent orchestrator that hit roughly 20,000
GitHub stars by the recording date. Most of the episode is about why the
open-source, developer-led motion worked where the two prior products
(source-available and enterprise services) did not, and why he turned down
six-figure enterprise deals to focus on it.

## Claims worth checking

- [00:00, 10:09–10:24] Vibe Kanban's original launch post asked "are you
  spending too much time on Twitter waiting for [Claude] Code?" — within the
  first week, Louis says "10 founders using it fourteen hours a day," which
  he contrasts with four years of traction on the prior product. Self-reported,
  no independent metric.
  Launched to the YC community first, per Louis — narrower initial channel than
  a public Show HN/Twitter launch, worth naming if this becomes a distribution
  example.
- [10:38–10:42] "Approaching 20,000 stars" as of the recording (2026-02-15).
  Self-reported/visible on GitHub, not independently re-checked by this note.
- [11:05–11:13] The prior code-search product had "a lot of stars" but a
  Discord of "like a 100 people" with little contribution; Vibe Kanban's
  Discord is "thousands" of people. Louis's own before/after comparison,
  offered as evidence that stars alone don't indicate a real community.
- [28:03–28:51] Louis says "more than half" of community-shipped features
  arrive as AI-assisted pull requests (a contributor prompts Claude, tests the
  change, opens the PR) and that "maybe 50%" of that code survives review
  as-is. Self-reported estimate, no repo-level count cited.
- [23:44–24:18] The team's first shipped feature was a cow-mooing sound
  effect at the end of each agent run, to pull users off Twitter/back to the
  terminal — framed as the direct answer to the pain point in the launch
  post. Anecdotal but concrete and checkable against the repo's early commit
  history.
- [30:12–31:38] Louis on abandoning a COBOL-modernization services business
  despite six-figure deals already under contract: cites eighteen-month-plus
  enterprise sales cycles, a signed customer going dark mid-deal after a
  leadership change, and a personal dislike of enterprise sales — framed as a
  founder-market-fit mismatch, not a market-size problem ("the technology's
  there... it's founder market fit").

## Quotes

> "It's not enough to just be building SaaS and then accidentally make your
> GitHub repo open instead of closed and then call that open source. You get
> stars, but you won't get a community." — Louis [31:04–31:38]

> "If people see that you're actually responding to the stuff... half the
> time somebody sends in a problem and I just reply with the pull request,
> and then they can watch it get merged and get released." — Louis [31:04]

## Why it matters here

A dated, named-practitioner account of open-source-led distribution
outperforming both a source-available motion and an enterprise-services
motion for the same founders — corroborates the guide's and MEMORY's
"earned distribution still tops the stack" running thread (§06, §07) with a
second, independent example alongside Juggler's Show HN case. The specific,
checkable tactics (multi-channel feedback intake — Discord, GitHub PRs,
issues, discussions, Reddit, direct email; closing the loop by replying with
a merged PR) are candidate material for a practice under
`03-devrel-and-community` or `06-channels-and-distribution`. Weakest part:
every number (stars, Discord size, PR-survival rate) is Louis's own recall
mid-conversation, not pulled from the repo — verify against Vibe Kanban's
GitHub stats before citing a specific figure.
