---
title: 'skill-creator: package what you know as something installable'
name: skill-creator
author: Anthropic
repo: anthropics/skills
date: 2026-07-26
summary: Scaffolds and validates an Agent Skill — the packaging format that puts your conventions, gotchas and idiomatic examples inside the agent your users already work in.
job: content
agents: [claude-code, claude-ai]
install: |
  /plugin marketplace add anthropics/skills
  /plugin install example-skills@anthropic-agent-skills
license: Apache-2.0
caveat: Ship knowledge that is genuinely yours. A skill that reads like a brochure gets uninstalled faster than a bad README gets closed.
section: 05-content-that-earns-trust
tags: [content, docs, agents, distribution]
verified: 2026-07-26
source:
  label: 'anthropics/skills: skill-creator'
  url: https://github.com/anthropics/skills/tree/main/skills/skill-creator
sources:
  - label: The Agent Skills specification
    url: https://github.com/anthropics/skills/tree/main/spec
related:
  - label: Content that earns trust
    href: /guide/05-content-that-earns-trust
---

A skill is a content surface that did not exist two years ago: your migration
gotchas, your idiomatic error handling, your "do not do it that way" — installed
into the tool a developer is already in, invoked without them ever visiting your
site. This is the tool that builds and validates one, and the discipline it
enforces is the discipline good docs need anyway: a description tight enough to
trigger on the right task, progressive disclosure so the body stays small, no
dead weight. The shelves catalogued on this page are themselves the evidence
that the format travels — thirty-four skills, sixty skills, installed by
strangers with one command.
