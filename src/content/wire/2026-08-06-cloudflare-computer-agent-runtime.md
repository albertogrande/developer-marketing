---
title: Cloudflare open-sources an agent runtime that picks isolates over containers
company: Cloudflare
date: 2026-08-06
kind: release
summary: 'Cloudflare published `@cloudflare/computer` on 2026-08-03, surfaced in this sweep as an early preview: an open-source npm library that gives an agent a declaratively-defined, pre-primed filesystem and routes each task to the cheapest compute primitive, using a lightweight isolate for file operations and a full Linux container only when one is needed. Cloudflare states the goal is holding container use under 10% of agent workloads.'
tags: [agents, cloudflare, dx]
source:
  label: 'Cloudflare — @cloudflare/computer'
  url: https://blog.cloudflare.com/cloudflare-computer
related:
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
---

Shipping this as an npm package rather than a Workers feature is the move worth
noting — it is installable and auditable by developers who are not Cloudflare
customers, which makes the infrastructure argument before the account signup
does. The under-10% figure is Cloudflare's own target, not a measured result.
