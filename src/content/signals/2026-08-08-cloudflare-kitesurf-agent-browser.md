---
title: Cloudflare ships a browser built only for agents, not humans
company: Cloudflare
date: 2026-08-08
kind: launch
summary: 'Cloudflare launched Kitesurf on 2026-08-06, a stateless browser that runs entirely in V8 isolates on Workers and, in Cloudflare''s own tests, uses 3-4x less CPU and 5-7x less memory than Chromium for agent tasks like screenshots and HTML extraction (while running about 1.7-1.8x slower), while staying a drop-in replacement for existing Puppeteer, Playwright and MCP/CDP clients. It ships free in beta and trades away tabs, extensions, WebGL and real TLS fingerprinting — the things only a human user needs.'
tags: [agents, ai-coding-agents, dx, positioning]
source:
  label: 'Cloudflare Blog — Introducing Kitesurf'
  url: https://blog.cloudflare.com/kitesurf/
sources:
  - label: 'Cloudflare Changelog — Introducing Kitesurf, an agent-first browser on Browser Run'
    url: https://developers.cloudflare.com/changelog/post/2026-08-06-kitesurf/
related:
  - label: Guide — Channels & distribution
    href: /guide/06-channels-and-distribution
---

The roster of "agent-safe by design" products so far has been about being
read correctly — docs, MCP servers, skill manifests. Kitesurf is a step past
that: infrastructure built for an agent to act, priced and engineered around
what an agent actually spends (tokens, CPU, context) rather than what a human
notices (pixels, tabs, chrome). Cloudflare is shipping it as a full
product, not a side experiment — worth watching whether Kitesurf's cost curve
becomes the pitch other browser-automation vendors have to answer.
