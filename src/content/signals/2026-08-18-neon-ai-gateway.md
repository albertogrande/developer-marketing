---
title: Neon puts an LLM gateway inside the Postgres backend, pass-through pricing
company: Neon
date: 2026-08-18
kind: launch
summary: 'Neon shipped AI Gateway, a beta backend primitive that lets a Neon app call frontier and open-weight models through one endpoint alongside its existing Postgres, storage, functions and auth — usage lands on the same Neon invoice.'
tags: [pricing, positioning, dx]
source:
  label: 'Neon — LLMs belong in your backend'
  url: https://neon.com/blog/llms-belong-in-your-backend
related:
  - label: Guide — Positioning for developers
    href: /guide/01-positioning-for-developers
---

The pricing move is the notable part: Neon says it passes through each
provider's published per-token rate with no markup — and the gateway itself
is free for the duration of the beta — betting the value is consolidation
(one invoice, branch-scoped credentials) rather than a margin on inference.
