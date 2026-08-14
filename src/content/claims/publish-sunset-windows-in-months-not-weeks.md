---
title: Publish sunset windows in months, and ledger the dependent clocks
when: Retiring a developer-facing product, API, free tier, or hosted surface — or writing the deprecation policy before you need one.
do: Set the window in months, publish it as a dated, phased policy (announcement → freeze → shutdown), and check what else breaks first — if a dependency of your product dies sooner, that shorter clock is the real window your developers experience.
why: By August 2026 the public ledger of deprecation windows runs from GitHub Spark's ~27 days and GitHub Models' six weeks to MCP's twelve-month minimum and HCP Vagrant Registry's phased ~10 months — and the window itself now reads as positioning — months signal infrastructure, weeks signal a warning label. Spark showed the compounding failure — its `llm()` apps broke when GitHub Models retired on 2026-07-30, five days before Spark's own deprecation was even announced.
section: 04-developer-experience-and-activation
tags: [dx, positioning]
since: The 2026-07/08 deprecation cluster — MCP spec twelve-month offramp (2026-07-28), GitHub Models retired (2026-07-30), GitHub Spark ~27 days (announced 2026-08-04), HCP Vagrant Registry ~10 months (announced 2026-08-03/04)
verify: Re-open the comparables — the Spark and Models changelog entries, the MCP deprecation policy, HashiCorp's HCP Vagrant EOL page — and check whether new sunsets announced since cite their window length as a feature.
status: current
checked: 2026-08-10
updated: 2026-08-10
sources:
  - label: GitHub Changelog — Upcoming deprecation of GitHub Spark on github.com
    url: https://github.blog/changelog/2026-08-04-upcoming-deprecation-of-github-spark-on-github-com/
  - label: HashiCorp — HCP Vagrant Registry end-of-life
    url: https://developer.hashicorp.com/hcp/docs/vagrant/hcp-vagrant-eol
  - label: The 2026-07-28 Specification (Model Context Protocol)
    url: https://blog.modelcontextprotocol.io/posts/2026-07-28/
---

The window is the headline but the mechanics decide who gets burned — a published policy beats a per-event promise, and deprecation-named errors beat silent 404s. The full argument is in the 2026-08-06 dive.
