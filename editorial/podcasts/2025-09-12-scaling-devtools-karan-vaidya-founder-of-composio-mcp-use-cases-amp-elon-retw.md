---
show: Scaling DevTools
episode: "Karan Vaidya, founder of Composio: MCP use cases & Elon retweets"
date: 2025-09-12
url: https://podcast.scalingdevtools.com/episodes/from-viral-moments-to-mcp-scaling-kaposios-ai-integration-story
guests:
  - Karan Vaidya (Composio) — founder
host: Jack Bridger
topics: [mcp, community, distribution, agents]
candidates: [practice]
distilled: 2026-08-20
---

## What it covers

Composio's founder on riding the MCP wave to ~100,000 users in six months:
launch-moment opportunism tied to frontier-model releases, framework-specific
distribution (LangChain, LlamaIndex, CrewAI communities), and why the company
treats tool-call quality as a shared-learning system across agents.

## Claims worth checking

- [03:32–04:39] Composio's Grok 3 launch-day example was retweeted by Elon
  Musk and reached "approximately 2,000,000 views"; a later Grok 4 CLI
  example reached "500k views" and ~700–800 GitHub stars in two days.
  Self-reported, unverifiable view counts, no engagement-to-signup
  conversion given for these specific posts.
- [05:14–05:36] States sign-ups roughly doubled ("at least 100% jump") on the
  day of the Musk retweet, but explicitly cannot say how many were "good"
  (retained) users versus traffic. A rare instance of a founder naming the
  limit of his own vanity metric rather than just citing the number.
- [15:12–16:44] Growth mechanism named specifically: build native integration
  packages for agent frameworks (LangChain, LlamaIndex, CrewAI) while each
  framework's own community was still small and hungry for integrations,
  then let framework maintainers (Harrison Chase, Jerry Liu, João Moura,
  named) reshare the examples into their own audiences. A distribution
  tactic tied to a specific market window (frameworks pre-consolidation),
  not necessarily repeatable now that the space has matured.
- [17:12–17:38] Claims blog posts tied to model releases got "a million plus
  views... across Reddit, Twitter individually" at points in Jan/Feb 2025.
  Self-reported aggregate, no per-post breakdown or source attribution.
- [40:47–41:28] States the two lessons from six months of growth: (1)
  developers don't want to be sold — publish something genuinely useful and
  let it spread on its own; (2) optimize the onboarding moment obsessively,
  because a bad first impression is "catastrophic" and hard to reverse for
  an infrastructure/auth product. Both are stated as beliefs, not measured
  outcomes.
- [19:56–20:16] Pricing-tier naming as a deliberate developer-marketing
  choice: tiers labeled "totally free," "ridiculously cheap," and "some
  serious business" ($229/mo) rather than conventional tier names, framed
  explicitly as using the pricing page's attention as content space rather
  than wasting it on boilerplate.

## Quotes

> "Developers don't like to be sold... build something cool with whatever
> product, write about it, post about it, let it open. In most cases, if
> it's really good, people will be excited and try to use it." — Karan
> Vaidya [40:47]

> "If one agent using Composio does a mistake, we kind of learn from it, and
> the next agent using Composio shouldn't make the same mistake." — Karan
> Vaidya [00:00]

## Why it matters here

Relevant to `06-channels-and-distribution` (MCP directories/marketplaces) and
`07-launches` (moment-tied launch opportunism). The growth numbers throughout
are entirely self-reported with no independent verification — view counts,
sign-up spikes and star counts all come from the founder with no analytics
screenshot or third-party confirmation, so treat as a practitioner's account
of what worked for one company in one market window (early MCP, framework
communities still small), not as a general playbook. The most testable,
narrowly-scoped claim is the framework-community distribution tactic; the
Elon-retweet numbers are the least — they're a single lucky break, not a
repeatable channel.
