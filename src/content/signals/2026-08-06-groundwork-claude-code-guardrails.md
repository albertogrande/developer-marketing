---
title: A guardrails plugin ships as three installable Claude Code plugins
company: Groundwork
date: 2026-08-06
kind: launch
summary: 'Groundwork launched on Show HN as a starter pack of three MIT-licensed Claude Code plugins installed from a marketplace line: a Bash guard that blocks curl-piping, `dd`/`mkfs` and fork bombs outright and prompts before `rm -rf`, force-push, database drops and credential access, plus a wiki-grounded verification loop and an agent-memory lifecycle plugin. The guard is designed to hold even when Claude Code''s own permission prompts are disabled, and ships BATS tests plus a `/guardrails:self-test` command for checking the blocks without running anything dangerous.'
tags: [agents, security, dx]
source:
  label: 'Show HN — Safety Guardrails for Claude Code'
  url: https://github.com/choiyounggi/groundwork
related:
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
---

Included with zero stars and zero forks at the time of capture — traction is not
a promotion criterion here, and the artifact is real, installable and testable.
The distribution choice is the notable part: shipping as marketplace plugins with
a verbatim install line rather than a repo to clone is the packaging that gets a
safety tool actually adopted.
