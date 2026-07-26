---
title: 'mcp-builder: your tool descriptions are now the docs'
name: mcp-builder
author: Anthropic
repo: anthropics/skills
date: 2026-07-26
summary: Anthropic's own four-phase guide to building an MCP server — research, implement, review, then generate ten evaluations that test whether a model can actually use it.
job: product-surface
agents: [claude-code, claude-ai]
install: |
  /plugin marketplace add anthropics/skills
  /plugin install example-skills@anthropic-agent-skills
license: Apache-2.0
caveat: An engineering skill, engineering-owned in most teams. Bring it to whoever ships the server rather than running it alone.
section: 04-developer-experience-and-activation
tags: [dx, mcp, agents, activation]
verified: 2026-07-26
source:
  label: 'anthropics/skills: mcp-builder'
  url: https://github.com/anthropics/skills/tree/main/skills/mcp-builder
sources:
  - label: SKILL.md — the four phases and the evaluation format
    url: https://github.com/anthropics/skills/blob/main/skills/mcp-builder/SKILL.md
related:
  - label: Developer experience & activation
    href: /guide/04-developer-experience-and-activation
---

For a growing share of your users the tool description *is* the documentation:
they never read the reference, because an agent chose your tool on the strength
of one sentence and a JSON schema. That makes naming, annotations
(`readOnlyHint`, `destructiveHint`, `idempotentHint`) and error copy a
first-touch surface, and it is on a marketing shelf because nobody else in the
company is going to own how it reads. The phase most worth stealing is the last
one: ten independent, verifiable evaluation questions that measure whether a
model can complete real tasks against your server — a time-to-first-call test
for the agent era.
