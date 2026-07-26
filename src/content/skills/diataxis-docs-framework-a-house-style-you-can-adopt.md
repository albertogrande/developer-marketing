---
title: 'diataxis-docs-framework: a house style you can adopt instead of argue'
name: diataxis-docs-framework
author: Anivar Aravind
repo: anivar/developer-docs-framework
date: 2026-07-26
summary: Diátaxis expanded to fourteen content types, 27 rules, and six pluggable style guides — Google, Microsoft, Stripe, Canonical, Good Docs, or minimal.
job: docs
agents: [claude-code, cursor, windsurf, codex]
install: git clone https://github.com/anivar/developer-docs-framework
license: MIT
caveat: Ships as reference material with no one-line installer — clone it and copy the folder into .claude/skills/. The rules synthesise published methodologies; they are not measured against your readers.
section: 02-docs-as-front-door
tags: [docs, content, writing]
verified: 2026-07-26
source:
  label: anivar/developer-docs-framework
  url: https://github.com/anivar/developer-docs-framework
related:
  - label: Docs as the front door
    href: /guide/02-docs-as-front-door
---

Where an auditor scores what you have, this decides what to write. Diátaxis'
four modes — tutorial, how-to, reference, explanation — expand into the fourteen
types a developer product actually ships (quickstart, integration guide,
migration guide, troubleshooting, SDK reference, config reference, runbook,
glossary), each with its own guidance and anti-patterns. The pluggable style
guides are the pragmatic part: a team picks Google or Stripe or minimal and
inherits a settled answer on voice, person and tense, which is an argument you
otherwise re-run in every review.
