---
title: Sentry prints the number that cuts against it, then argues for it
company: Sentry
date: 2026-08-10
summary: A build-in-public post on routing AI bug-fix PRs through Slack reports two flattering deltas and one uncomfortable one — close-without-merge up 12.5% — and defends the uncomfortable one on the merits, which is what makes the other two believable.
artifact: blog
channel: [blog]
demonstrates: 05-content-that-earns-trust
tags: [content, dogfooding, metrics, sentry]
source:
  label: Sentry — How we built an automated debugging workflow at Sentry
  url: https://blog.sentry.io/automated-debugging-workflow-sentry
---

The workflow itself is ordinary vendor content: Seer opens PRs for detected issues, Claude routines pick the right engineer and ping them in Slack, action rate rises about 21% and 48-hour response rate about 13%. What earns the read is the third number — PRs closed without merging rose 12.5% — printed alongside the wins and then argued as healthy, because engineers often investigated Seer's narrow fix and shipped a broader one instead. Seer costs $40 per contributor per month, so this post is doing commercial work; disclosing the metric a skeptic would hunt for is what lets it. Copy the shape: report the delta that hurts, then make the case, in numbers, for why it's the right trade.
