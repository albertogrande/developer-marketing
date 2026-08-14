---
title: 'changelog-generator: the most-read page nobody owns'
name: changelog-generator
author: Composio
repo: ComposioHQ/awesome-claude-skills
date: 2026-07-26
summary: Reads git history, groups changes into added, improved, fixed and breaking, drops internal noise, and returns release notes a human can edit in ten minutes.
job: launch
agents: [claude-code]
install: |
  git clone https://github.com/ComposioHQ/awesome-claude-skills.git
  mkdir -p ~/.claude/skills
  cp -r awesome-claude-skills/changelog-generator ~/.claude/skills/
license: Apache-2.0 (per-skill may differ)
caveat: Commits are the wrong source for why a change matters. It drafts the what; the why, the migration note and the breaking-change warning are yours.
section: 07-launches
tags: [launches, changelog, releases, docs]
verified: 2026-08-10
source:
  label: 'awesome-claude-skills: changelog-generator'
  url: https://github.com/ComposioHQ/awesome-claude-skills/tree/master/changelog-generator
related:
  - label: Launches developers amplify
    href: /guide/07-launches
---

For most developer products the changelog is read more often than the blog and
owned by nobody, because translating forty commits into user-facing language is a
chore that loses to whatever shipped that week. Handing the first draft to an
agent is the cheapest way to restore the cadence — and cadence is the point, as
the operators who turned releases into a recurring weekly beat keep
demonstrating. Keep the human edit: the categories come from the commits, but
"you must change your webhook handler before August" never does.
