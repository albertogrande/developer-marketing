---
title: When an agent is the first reader of your docs
question: What does a product surface owe a reader that is software — and who controls the rail it arrives on?
summary: 'Machine-mediated discovery moved from reading to selecting to transacting. MCP settled into infrastructure, "agent-safe by design" became a category vendors position on, and the distribution rails consolidated fast — Vercel, then GitHub. The open part is who sets the terms on those rails, and what a stranded integrator can do about it.'
status: open
momentum: rising
started: 2026-07-28
updated: 2026-08-17
sections:
  - 02-docs-as-front-door
  - 06-channels-and-distribution
  - 09-answer-engines-and-aeo
openLoops:
  - question: A second stranded-integrator account, or a published review SLA from a major directory. One dated case is an anecdote; two is a pattern operators can plan around.
    by: end of August 2026
  - question: Does anyone report attributed AI-referral signups? Everyone is optimising for agent discovery and nobody has published a conversion number.
    by: end of Q3 2026
  - question: A major MCP host publishing a dated migration plan — the test of whether "MCP is infrastructure" survives its first breaking change.
    by: end of September 2026
tags: [mcp, agents, docs, aeo, distribution]
related:
  - label: Guide — Docs as front door
    href: /guide/02-docs-as-front-door
  - label: Guide — Answer engines & AEO
    href: /guide/09-answer-engines-and-aeo
  - label: Archive — Agent-safe by design
    href: /articles/2026-07-26-agent-safe-by-design
  - label: Archive — The MCP directory review
    href: /articles/2026-08-04-mcp-directory-review
sources:
  - label: 'Model Context Protocol — The 2026-07-28 Specification'
    url: https://blog.modelcontextprotocol.io/posts/2026-07-28/
  - label: 'Google Search Central — AI features optimization guide'
    url: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  - label: 'Josh Symonds — Anthropic hates developers'
    url: https://joshsymonds.com/blog/anthropic-hates-developers/
---

The premise stopped being speculative somewhere around the end of July. An
agent reads the docs, picks the tool, and increasingly completes the
transaction — reading, then selection, then action, in that order, and each
step arrived faster than the last.

What follows from it is a design question with an uncomfortable second half.
The design question — what a surface owes a machine reader — has answers now:
a spec-compliant MCP server, an `llms.txt`, docs whose structure survives
being parsed rather than rendered, and flows that stay safe when the thing
clicking through is not a person. "Agent-safe by design" is a category
vendors position on, not a nice-to-have.

The uncomfortable half is that none of that helps if you cannot get onto the
rail. The rails consolidated in weeks, not years: Vercel's agent plugins in
early August, then GitHub opening its own agent-apps marketplace wired
directly into Copilot's harness on the 14th. Both are curated. Both decide who
is listed.

## The gate has numbers on it now

For most of this thread the "directories are a gated channel" argument rested
on reasoning rather than evidence. Then one integrator published a dated
timeline: submitted in March, left in a queue that was discarded at the end of
July, while OpenAI approved the same connector in twenty-nine days.

That is one account, and it is worth saying so plainly — a single sourced case
is a data point, not a pattern. But it is a *dated* one, which is more than
the category had before, and it puts a number on a cost that vendors describe
as a formality. The open loop is whether a second one lands.

## Tension

The thread's direction of travel assumes vendors want agents in. Not everyone
does: a draft `AGENTS.md` proposed in the Emacs project in early August moved
the other way, restricting agent contributions rather than enabling them, and
it went unmerged. It is a small countertrend and it has not gone anywhere yet.
But "everyone is racing to be agent-readable" is the kind of claim that ages
badly if the governance side turns, and Debian opening a project-wide vote on
LLM contribution policy in mid-August suggests the question is live.
