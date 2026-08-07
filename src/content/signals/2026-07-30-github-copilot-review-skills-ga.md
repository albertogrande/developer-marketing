---
title: A SKILL.md file now steers Copilot code review, in GA
company: GitHub
date: 2026-07-30
kind: release
summary: 'GitHub moved Copilot code review''s agent skills and MCP support from preview to general availability on 2026-07-29: a SKILL.md file under .github/skills steers the reviewing agent, MCP tool calls are deliberately restricted to read-only, and new per-comment attribution shows which skill or server produced each suggestion. Available across Copilot Pro, Pro+, Business and Enterprise.'
tags: [agents, mcp, dx]
source:
  label: 'GitHub Changelog — Copilot code review: agent skills and MCP now generally available'
  url: https://github.blog/changelog/2026-07-29-copilot-code-review-agent-skills-and-mcp-now-generally-available/
related:
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
---

The skill-as-a-file pattern stopped being an agent-harness convention and
became a shipped enterprise feature. And the read-only MCP restriction is
agent-safe-by-design applied by an incumbent to its own product — the
checkpoint-before-the-action pattern, at GA scale.
