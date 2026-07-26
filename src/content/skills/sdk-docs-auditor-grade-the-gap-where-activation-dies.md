---
title: 'sdk-docs-auditor: grade the gap where activation dies'
name: sdk-docs-auditor
author: Infrasity Labs
repo: Infrasity-Labs/dev-gtm-claude-skills
date: 2026-07-26
summary: Scores SDK docs across the six sections integration actually fails in — installation, quick start, error handling, troubleshooting, examples, best practices — as an HTML report.
job: dx
agents: [claude-code, claude-ai, codex]
install: npx skills add Infrasity-Labs/dev-gtm-claude-skills
license: MIT
caveat: It audits the docs for the SDK, not the SDK. A clean report on a hostile API is still a hostile API.
section: 04-developer-experience-and-activation
tags: [dx, activation, docs, sdk]
verified: 2026-07-26
source:
  label: 'dev-gtm-claude-skills: sdk-docs-auditor'
  url: https://github.com/Infrasity-Labs/dev-gtm-claude-skills
related:
  - label: Developer experience & activation
    href: /guide/04-developer-experience-and-activation
---

Activation rarely dies at install; it dies in the hour after, when the first call
returns an error nobody documented. The six sections this grades map almost
exactly onto that hour, and the two teams usually miss — error handling and
troubleshooting — are the two nobody is measured on. Run it on your own SDK docs
and on the competitor a prospect is comparing you against; the delta is a more
persuasive internal argument than a satisfaction survey.
