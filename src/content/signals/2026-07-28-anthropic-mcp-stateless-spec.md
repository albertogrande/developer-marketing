---
title: MCP goes stateless in its largest revision since launch
company: Anthropic
date: 2026-07-28
kind: release
summary: 'The new Model Context Protocol spec drops `initialize` and session IDs so any server instance can answer any request behind a plain load balancer, graduates Tasks and MCP Apps into a versioned extensions framework, and hardens auth with RFC 9207 issuer validation in place of Dynamic Client Registration. All four Tier-1 SDKs shipped support on publication day, with AWS, Cloudflare, Figma, Google Cloud, Microsoft and Netlify publicly committed.'
tags: [mcp, agents, docs, ai]
source:
  label: Model Context Protocol — The 2026-07-28 Specification
  url: https://blog.modelcontextprotocol.io/posts/2026-07-28/
sources:
  - label: Anthropic — Bringing MCP 2026-07-28 to Claude
    url: https://claude.com/blog/bringing-mcp-2026-07-28-to-claude
related:
  - label: Guide — Docs as the front door
    href: /guide/02-docs-as-front-door
---

Anthropic followed two days later with its own rollout: MCP Apps live, enterprise-managed auth, observability dashboards for connector developers, tunnels in research preview, and 950+ servers in the connectors directory. The migration bill for anyone already hosting a stateful MCP server is the thing to watch — no practitioner has yet published what the stateless cutover cost them.
