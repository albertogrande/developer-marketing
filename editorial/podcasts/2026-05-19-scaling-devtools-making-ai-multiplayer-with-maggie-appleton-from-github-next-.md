---
show: Scaling DevTools
episode: Making AI multiplayer with Maggie Appleton from GitHub Next @ AIE Europe
date: 2026-05-19
url: https://podcast.scalingdevtools.com/episodes/maggie-appleton
guests:
  - Maggie Appleton (GitHub Next) — agentic collaboration research
host: Jack Bridger
topics: [devrel, docs, community, activation]
candidates: [deep-dive]
distilled: 2026-08-04
---

## What it covers

Maggie Appleton (GitHub Next, GitHub's R&D lab) on why single-player coding
agents don't scale to teams: when everyone runs their own agent locally, you
get duplicate features, merge conflicts, and unreviewable PRs, because the
organizational context a team needs to agree on *what* to build never enters
any agent's context window. She walks through ACE (Agentic Collaboration
Environment), GitHub Next's research prototype — a shared, real-time
multiplayer workspace where a team and its coding agents work in the same
session against a cloud sandbox, rather than each engineer working alone and
surfacing only a final PR.

## Claims worth checking

- [00:32–01:23] Her core argument: scaling individual output with agents does
  not produce team alignment — "no one's planning around, no one's aligning
  enough" — and the result is duplicate or unwanted features shipped fast.
  Stated as a pattern she's observed "across other people's companies and
  even within our own," not measured.
- [02:54–03:19] PRs are structurally the wrong place to do collaboration
  because they're the review artifact at the *end* of a process — a design
  critique, not a data point.
- [04:33–05:44] ACE connects every session to a cloud micro-VM shared by the
  whole team, explicitly to avoid the git-worktree/local-stash friction of
  pulling a coworker into your own machine. Product description, not a
  result — ACE was in research preview at recording time, moving toward
  technical preview with no stated date.
- [09:39–10:35] Secondhand anecdote about "token maxing" — Appleton reports
  hearing, from a Pragmatic Engineer conversation, that some big-tech
  performance-review metrics on AI usage incentivize burning tokens on
  low-value work. Doubly unverified (her paraphrase of someone else's
  claim) — flag, do not cite as fact.
- [12:35–13:28] A proactive-agent dashboard concept (summarize what
  teammates worked on overnight, flag file-level collision risk before it
  happens) — her stated favorite feature, unshipped.

## Quotes

> "You need the full organization human context in your context window as
> you are writing code. You can't just take the code that exists and your
> mediocre prompt and make a plan with [an agent] locally that no one else
> can see." — Maggie Appleton [02:29]

> "Reviewing PRs is awful in the age of agentic AI... there's so much
> friction and isolation of the work, and we just need to bring everything
> into the cloud in real time." — Maggie Appleton [07:31]

## Why it matters here

A named GitHub researcher, on the record, arguing that the docs-and-PR-driven
collaboration model this site's own guide assumes is already breaking under
agent-driven code volume — distinct from the "agent-safe-by-design" guardrail
thread and from MCP-as-infrastructure; this is about *human* team coordination
around agents, not agent-to-system access control. Worth tracking as its own
thread: if ACE or a competitor ships past research preview with adoption
numbers, it's deep-dive material on what a "docs as front door" and
"activation" story look like when the reader is a team of agents plus
humans, not a solo developer. Weakest part: every claim is Appleton's
observation or design intent — nothing here is measured, and ACE itself is
unreleased.
