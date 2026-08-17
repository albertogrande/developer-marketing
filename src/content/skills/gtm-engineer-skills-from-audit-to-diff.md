---
title: 'gtm-engineer-skills: from audit to diff'
name: improve-aeo-geo
author: onvoyage-ai
repo: onvoyage-ai/gtm-engineer-skills
date: 2026-07-26
summary: Twelve skills that research, plan and then patch — AEO/GEO auditing with framework-specific fixes, shipped with worked plans for a Next.js blog and a WordPress site.
job: seo-geo
agents: [claude-code]
install: |
  git clone https://github.com/onvoyage-ai/gtm-engineer-skills.git
  mkdir -p ~/.claude/skills
  ln -s "$PWD/gtm-engineer-skills/audit-website-aeo" ~/.claude/skills/audit-website-aeo
  ln -s "$PWD/gtm-engineer-skills/improve-aeo-geo" ~/.claude/skills/improve-aeo-geo
license: MIT
caveat: Manual clone-and-symlink per skill, and a marketing agent editing your app needs the same review as any other contributor.
section: 09-answer-engines-and-aeo
tags: [aeo, seo, distribution, tooling]
verified: 2026-08-17
source:
  label: onvoyage-ai/gtm-engineer-skills
  url: https://github.com/onvoyage-ai/gtm-engineer-skills
related:
  - label: Channels & distribution
    href: /guide/06-channels-and-distribution
---

The third GEO entry here, and the one that goes past reporting: alongside brand
and keyword research it carries `improve-aeo-geo`, which proposes
framework-specific changes to the site itself. Pick between the three by what you
are short of. Knowledge you lack: read the rules. A number you lack: run the
`llms.txt` probe. A diff you lack, on a site you own and can review: this one.
The marketing-engineer role it assumes — someone comfortable opening a pull
request against the marketing site — is the role this whole shelf quietly
requires.
