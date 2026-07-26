---
title: "docs-auditor: make “our docs are fine” falsifiable"
name: docs-auditor
author: Infrasity Labs
repo: Infrasity-Labs/dev-gtm-claude-skills
date: 2026-07-26
summary: Thirty-three checks across AI discoverability, structure, content quality, SEO and internal linking, returned as a 0–100 score with prioritised fixes.
job: docs
agents: [claude-code, claude-ai, codex]
install: npx skills add Infrasity-Labs/dev-gtm-claude-skills
license: MIT
caveat: Structural checks cannot tell you whether the quickstart runs. Pair the score with a real time-to-first-call test on a clean machine.
section: 02-docs-as-front-door
tags: [docs, seo, geo, metrics]
verified: 2026-07-26
source:
  label: 'dev-gtm-claude-skills: docs-auditor'
  url: https://github.com/Infrasity-Labs/dev-gtm-claude-skills
related:
  - label: Docs as the front door
    href: /guide/02-docs-as-front-door
---

Docs are the highest-leverage surface you own and nobody scores their own. A
thirty-three-check pass with a number at the end is worth having mostly because
it converts "our docs are fine" into a claim someone can disagree with before a
launch, and because the AI-discoverability half of the checklist is work most
docs teams have not yet been asked to do. The same repo carries
`api-docs-quality-report` for per-endpoint scoring and the linking audits
(`orphan-pages-internal-linking-opportunities`, `no-outlinks-audit`) that catch
the pages nothing points at — a common quiet failure in docs that grew by
accretion.
