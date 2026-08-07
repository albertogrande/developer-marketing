---
title: Chat SDK adds a Slack approval card that survives redeploys
company: Vercel
date: 2026-08-06
kind: release
summary: 'Vercel shipped human-in-the-loop approvals in the Chat SDK under a new `chat/workflow` subpath: `requestApproval` posts a Slack card with Approve and Deny buttons and suspends a Workflow SDK workflow until someone answers, returning `approved`, `user` and `timedOut`. The approval persists across deploys and restarts with no separate database table or polling loop, and supports scoped approvers, signature-verified decisions and an audit trail written back onto the card.'
tags: [agents, dx]
source:
  label: 'Vercel Changelog — Pause workflows for approval with Chat SDK'
  url: https://vercel.com/changelog/chat-sdk-durable-approvals
related:
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
---

The "no separate table, no polling" framing is aimed squarely at the thing a
developer would otherwise build in an afternoon and maintain for a year — which
is the honest version of a durability pitch.
