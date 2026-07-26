---
title: 'readme-skill: write and review the repo front door'
name: readme
author: Alberto Grande
repo: albertogrande/readme-skill
date: 2026-07-26
summary: Generates or audits a README against a cited standard, scored out of 100 across identity, trust, onboarding, structure, craft, and agent-readability.
job: readme
agents: [claude-code]
install: |
  /plugin marketplace add albertogrande/readme-skill
  /plugin install readme-skill@readme-skill
license: MIT
caveat: One artifact only — it grades the README, not the docs site behind it, and the voice is yours to supply via a style profile.
disclosure: Published by this site's author.
section: 02-docs-as-front-door
tags: [docs, readme, github, positioning]
verified: 2026-07-26
source:
  label: albertogrande/readme-skill
  url: https://github.com/albertogrande/readme-skill
sources:
  - label: The rule set — anatomy.md
    url: https://github.com/albertogrande/readme-skill/blob/main/skills/readme/references/anatomy.md
---

For most developer products the README *is* the landing page: it is where a link
from Hacker News lands, what a model retrieves when someone asks what your thing
does, and the page read before anyone reaches the docs site. This is the only
skill on the shelf that treats it as a scored artifact — every rule traces to a
source (the canonical guides, twenty top-tier READMEs, GitHub's own docs, and
2025–2026 research on how agents read repos), and `review` returns a rubric with
concrete replacement text for the worst offender instead of vague prose. Reach
for it before a launch, and again the moment an install command changes.
