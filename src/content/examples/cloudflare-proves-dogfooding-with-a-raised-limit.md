---
title: Cloudflare proves the dogfooding with a limit it raised for everyone
company: Cloudflare
date: 2026-08-03
summary: The cdnjs migration post earns its proof not from self-reported throughput but from two public platform ceilings the migration forced Cloudflare to raise for every customer — a receipt any reader can check in the live limits docs.
artifact: blog
channel: [blog]
demonstrates: 05-content-that-earns-trust
tags: [content, dogfooding, trust, cloudflare]
source:
  label: "Dogfooding at scale: migrating cdnjs to Cloudflare's Developer Platform"
  url: https://blog.cloudflare.com/cdnjs-dev-platform-migration/
sources:
  - label: Cloudflare Workers — Limits (the raised subrequest ceiling, live)
    url: https://developers.cloudflare.com/workers/platform/limits/
  - label: W3Techs — cdnjs usage among websites (independent scale measurement)
    url: https://w3techs.com/technologies/details/cd-cdnjs
---

"We run our busiest thing on our own platform" is the oldest proof move in developer marketing, and on its own it's unfalsifiable. Cloudflare's version works because the migration hit two of its own published limits — 1,000 subrequests per Worker invocation, 1,024 Workflow steps — and instead of engineering around them internally, the platform teams raised the ceilings for every customer (subrequests now default 10,000, up to 10M on paid plans). The self-reported numbers (9B requests/day, 98.6% cache hit) are the hook; the checkable changelog line is the evidence. Copy the shape: real workload, named friction, shipped public fix.
