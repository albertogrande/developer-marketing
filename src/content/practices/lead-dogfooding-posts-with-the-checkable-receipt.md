---
title: Lead dogfooding posts with the checkable receipt, not the throughput
when: Writing a "we run our own product on our own platform" case study or migration post.
do: Lead with the cost the exercise made you pay in public — the platform limit you raised for every customer, the bug you fixed, the changelog line a reader can open today — and demote your own throughput and uptime figures to color. If the dogfooding surfaced no limit, bug, or shipped fix, don't publish it as proof.
why: Self-reported scale numbers are unfalsifiable and developers discount them on sight; a raised public limit is verifiable by any reader in your live docs. Cloudflare's July 2026 cdnjs migration post is the template — the 9-billion-requests-a-day figure is the hook, but the proof is the two platform ceilings the migration forced up for everyone (Workers subrequests 1,000 → 10,000 default, and Workflow steps 1,024 → 10,000), both checkable in the public limits docs. A migration story with zero friction reads as fiction, because real systems at scale always hit an edge.
section: 05-content-that-earns-trust
tags: [content]
since: "Cloudflare's cdnjs dogfooding write-up (2026-07-30) — proof carried by raised public platform limits rather than self-reported throughput"
verify: Open Cloudflare's Workers limits docs and confirm the raised subrequest default still stands; watch whether a second vendor frames its dogfooding around limits raised rather than throughput hit.
updated: 2026-08-03
sources:
  - label: "Cloudflare — Dogfooding at scale: migrating cdnjs to Cloudflare's Developer Platform"
    url: https://blog.cloudflare.com/cdnjs-dev-platform-migration/
  - label: Cloudflare Workers — Limits (the live, checkable receipt)
    url: https://developers.cloudflare.com/workers/platform/limits/
---

Same mechanic as the honest benchmark: put the checkable part forward and let the reader rerun it. Dogfooding a product built for exactly that job proves adequacy on home turf, not fit for the reader's workload — borrow the structure, skip the swagger.
