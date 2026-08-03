---
title: 'llms-txt-checker: can the answer engines read you at all'
name: llms-txt-checker
author: Infrasity Labs
repo: Infrasity-Labs/dev-gtm-claude-skills
date: 2026-07-26
summary: Probes robots.txt, llms.txt and llms-full.txt, scores AI-readiness against a structured checklist, and needs no API key.
job: seo-geo
agents: [claude-code, claude-ai, codex]
install: npx skills add Infrasity-Labs/dev-gtm-claude-skills
license: MIT
caveat: Presence, not persuasion — every file can pass while the content behind them earns no citation.
section: 06-channels-and-distribution
tags: [geo, distribution, docs, agents]
verified: 2026-08-03
source:
  label: 'dev-gtm-claude-skills: llms-txt-checker'
  url: https://github.com/Infrasity-Labs/dev-gtm-claude-skills
related:
  - label: 'Deep dive: when the reader is a model'
    href: /deep-dives/2026-07-17-geo-for-devtools-when-the-reader-is-a-model
  - label: Channels & distribution
    href: /guide/06-channels-and-distribution
---

The cheapest check on this page: minutes, no credentials, and it answers a
question most devtool teams have not formally asked — whether the systems now
fielding "what should I use for X" can reach and parse us at all. Treat the
result as a floor rather than a strategy. A pass means you are legible; being
chosen is a content problem, and blocking the crawlers you did not mean to block
is a robots.txt problem you will be glad you found before the next quarter's
traffic review.
