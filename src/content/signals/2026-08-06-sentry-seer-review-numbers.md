---
title: Sentry publishes the numbers from routing its own AI bug-fix PRs through Slack
company: Sentry
date: 2026-08-06
kind: news
summary: 'Sentry published a build-in-public post describing the internal workflow it rolled out in mid-July: its Seer agent opens pull requests for detected issues, and Claude routines then pick the most relevant engineer and notify them in Slack rather than leaving the PR to be found. Sentry reports roughly a 21% increase in action rate on those PRs, a 13% increase in 48-hour response rate, and a 12.5% increase in close-without-merge — arguing the last is a healthy outcome, since engineers often chose a broader fix than Seer''s narrower one.'
tags: [dogfooding, agents, metrics, content]
threads: [proof-over-adjectives, measuring-influence-not-attribution]
source:
  label: 'Sentry — How we built an automated debugging workflow at Sentry'
  url: https://blog.sentry.io/automated-debugging-workflow-sentry
related:
  - label: Guide — Content that earns trust
    href: /guide/05-content-that-earns-trust
  - label: Guide — Measurement & metrics
    href: /guide/08-measurement-and-metrics
---

A dogfooding post that ships its own counter-evidence is rare enough to note:
publishing the close-without-merge rise, and then arguing for it, is what makes
the other two numbers legible rather than promotional. Seer is priced at $40 per
active contributor per month for unlimited use, so the post is doing commercial
work — but it earns the read by showing the workflow, not the product.
