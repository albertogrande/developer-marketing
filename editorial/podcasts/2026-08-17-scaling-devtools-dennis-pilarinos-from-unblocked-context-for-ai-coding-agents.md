---
show: Scaling DevTools
episode: Dennis Pilarinos from Unblocked — context for AI coding agents
date: 2026-08-17
url: https://podcast.scalingdevtools.com/episodes/dennis-pilarinos-from-unblocked-context-engineering-for-ai-coding-agents
guests:
  - Dennis Pilarinos (Unblocked) — founder, context-layer product for AI coding agents
host: Jack Bridger
topics: [agents, dx, docs]
distilled: 2026-08-18
---

## What it covers

A product interview, not a marketing one: Pilarinos describes Unblocked's pivot
from a Q&A context layer for human developers to a context layer for coding
agents, and lays out a four-stage maturity model he sees customers move
through — ad hoc local context files, hand-curated static context checked into
the repo, exposing line-of-business systems via MCP, then a reconciled
knowledge graph. No timestamps in the publisher's transcript (plain speaker
labels only), so positions below are described by order, not time.

## Claims worth checking

- [early] Unblocked claims agents complete tasks 40–60% faster and use 30–50%
  fewer tokens with its context layer versus without. Founder-stated, no
  methodology or third-party measurement given — vendor claim, not evidence.
- [mid] He names "satisfaction of search" (borrowed from radiology) for why
  MCP-only setups plateau: an agent hits one data source, finds a
  plausible answer, and stops searching rather than reconciling across
  sources. Anecdotal pattern description, not measured.
- [mid] Identity resolution — one person has separate identities across
  GitHub/Slack/Notion/Confluence — is described as the hardest problem behind
  permission-aware agent answers (an agent must resolve "can this person see
  this" at runtime). One vendor's account of their own build, not a general
  finding.
- [late] Explicit product philosophy: don't ask the org to clean up or
  restructure existing docs/Slack/etc. before the tool works — connect to the
  mess as-is. Stated as a deliberate design choice, not tested against a
  competitor that requires curation.

## Quotes

> "Context is — intelligence is not the gap. It's context that's missing." —
> Dennis Pilarinos

> "I've never met a team that feels like their documentation is well organized
> and up to date." — Dennis Pilarinos

## Why it matters here

Weak for this site's purposes: it's a technical product interview with
self-reported vendor metrics, not a developer-marketing or DevRel story, and
none of the numbers are independently checkable. The one transferable idea is
the maturity-model framing (files → curated context → MCP → knowledge graph)
as a way to talk about where a reader's own org sits — but it comes from the
vendor selling the top rung, so treat it as a sales narrative dressed as an
industry stage model, not a neutral taxonomy.
