---
title: Six vendors ship a common plugin format so agent extensions stop being per-client
company: Vercel
date: 2026-08-06
kind: launch
summary: 'Agent Plugins 1.0.0 went public as an open, vendor-neutral packaging standard — a directory with a `plugin.json` manifest and fixed locations for Agent Skills and MCP servers — refined collaboratively by AWS, Anysphere, GitHub, Microsoft, OpenAI and Vercel, with a Technical Steering Committee drawn from the same set. ChatGPT, Codex, Cursor, GitHub Copilot, Kiro and VS Code support it at launch, which means a plugin author packages components once instead of repackaging the same skill for each client.'
tags: [agents, mcp, launches, positioning]
source:
  label: 'Vercel — Introducing Agent Plugins'
  url: https://vercel.com/blog/introducing-agent-plugins
sources:
  - label: 'Vercel Changelog — Introducing Agent Plugins 1.0.0'
    url: https://vercel.com/changelog/introducing-agent-plugins-1-0-0
related:
  - label: Guide — Channels & distribution
    href: /guide/06-channels-and-distribution
  - label: Guide — Launches developers amplify
    href: /guide/07-launches
---

The distribution story is the story. Every vendor on that masthead already had
its own extension format, and each one was a moat that cost plugin authors a
repackaging tax. Agreeing on a manifest converts that tax into reach — and it
is a specification, not a product, so no one on the list owns the surface. Worth
watching whether the clients that did *not* sign (Claude Code, Zed, JetBrains)
adopt the format or hold their own.
