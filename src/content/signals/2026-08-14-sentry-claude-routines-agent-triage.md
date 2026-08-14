---
title: Sentry dogfoods Claude Routines and its own MCP server to triage 800 agent conversations overnight
company: Sentry
date: 2026-08-14
kind: release
summary: 'Sentry built an automated morning workflow in which a Claude Routine queries Sentry''s Agent Tracing product through the Sentry MCP server to triage roughly 800 of its own AI agent''s conversations from the previous night, finding about 21% hit at least one tool error. The routine files tickets in Linear for issues it finds, replacing what had been manual, ad-hoc review.'
tags: [mcp, agents, devrel]
source:
  label: 'Sentry — Automated agent triage with Agent Tracing and Claude Routines'
  url: https://blog.sentry.io/claude-routines-agent-triage
related:
  - label: Guide — DevRel and community
    href: /guide/03-devrel-and-community
---

A concrete, numbers-attached dogfooding case for MCP-as-infrastructure: a vendor using its own MCP server, not just shipping one for others.
