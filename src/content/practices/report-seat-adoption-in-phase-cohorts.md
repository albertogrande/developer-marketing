---
title: Report seat-based AI adoption in phase cohorts, passive seats included
when: Reporting adoption of a seat- or license-based AI product — to your own leadership, in a customer-facing admin dashboard, or ahead of an enterprise renewal.
do: Break seats into progression cohorts (first use → advanced/agentic use → orchestration) and name the licensed-but-unengaged segment explicitly as its own line, instead of hiding it inside an "active seats" denominator. If you sell the product, ship this view to the buyer's admin before they build a hostile version themselves.
why: Raw seat counts hide shelfware, and buyers have started looking for it — HCLTech's 500-enterprise survey (with Raconteur, 2026-07) found 90% of decision-makers say GenAI is transforming workflows while only 18% see significant revenue impact, so the renewal conversation now runs on proof, not activity. GitHub shipped exactly this shape for Copilot on 2026-07-22 — three engaged phases plus a named "Passive (licensed but not engaged)" cohort, with per-cohort throughput comparisons. The vendor that names its own shelfware controls the honest number in the room.
section: 08-measurement-and-metrics
tags: [metrics, pricing]
since: GitHub's Copilot impact dashboard (2026-07-22) — the first major vendor to name a "Passive" seat cohort in its own admin product — landing the same week as HCLTech's 90%-transformation / 18%-revenue-impact survey.
verify: Open the GitHub changelog entry and confirm the Passive cohort still ships; check whether a second seat-based AI devtool has since adopted phase-cohort reporting (if several have, this is table stakes, not an edge).
updated: 2026-07-27
sources:
  - label: GitHub changelog — new Copilot usage metrics impact dashboard (2026-07-22)
    url: https://github.blog/changelog/2026-07-22-new-copilot-usage-metrics-impact-dashboard/
  - label: HCLTech — The Blueprint for AI Leadership (500 enterprises, with Raconteur)
    url: https://www.hcltech.com/press-releases/hcltech-report-exposes-widening-ai-divide-only-18-enterprises-seeing-revenue-impact
---

The dated shift is who counts the empty seat: a bare model will tell you to measure activation, but not that the biggest AI seat-seller now names its own shelfware in the buyer's dashboard — because an 18%-revenue-impact market negotiates renewals on that number either way.
