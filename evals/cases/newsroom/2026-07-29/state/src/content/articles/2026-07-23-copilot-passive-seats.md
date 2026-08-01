---
title: GitHub's Copilot dashboard now counts the seats nobody uses
date: 2026-07-23
summary: A new enterprise dashboard sorts Copilot seats into adoption-phase cohorts and breaks out a "Passive" segment — GitHub productizing the adoption story its buyers are being asked to prove.
dek: The category leader just made "licensed but not engaged" a first-class metric — and handed every devtool a template for reporting adoption instead of raw seat activity.
desk: news
byline: Rio Vidal
tags: [metrics, ai, github, devrel]
related:
  - label: Guide — Measurement & metrics
    href: /guide/08-measurement-and-metrics
  - label: Article — The community-signal category's third acquirer
    href: /articles/2026-07-18-community-signal-rollup
sources:
  - label: New Copilot usage metrics impact dashboard (GitHub Changelog, 2026-07-22)
    url: https://github.blog/changelog/2026-07-22-new-copilot-usage-metrics-impact-dashboard/
  - label: HCLTech — widening AI divide, only 18% see revenue impact (2026-07-21)
    url: https://www.hcltech.com/de-de/press-releases/hcltech-report-exposes-widening-ai-divide-only-18-enterprises-seeing-revenue-impact
  - label: The 5 usage-based plays Otter.ai used to 2x outbound pipeline (Common Room)
    url: https://www.commonroom.io/blog/otter-webinar-recap/
---

On July 22, GitHub shipped a new Copilot usage metrics impact dashboard for enterprise admins. It stops reporting Copilot as a pile of active seats and instead sorts users into adoption-phase cohorts — with a separate bucket for the people who have a license and don't touch it.

That last bucket is the story. GitHub gave a name to shelfware.

## What's confirmed

Per GitHub's changelog, the dashboard groups seats into three engaged cohorts — **Phase 1 (Code-first)**, **Phase 2 (Agent-first)**, and **Phase 3 (Multi-agent or Copilot app)** — plus a **Passive** segment defined as "licensed but not engaged." The phase labels come from the same `ai_adoption_phase` classification the Copilot usage metrics API already exposes, computed over a rolling 28-day window. For each cohort the dashboard reports average pull requests merged per user per month, median PR merge velocity, user count, share of total users, and average lines of code per day. It also shows an "adoption multiplier" comparing engaged users against passive ones, and six-month trends for cohort growth and throughput. It's aimed at enterprise administrators and org owners, and it enhances rather than replaces the existing metrics API.

That is the whole of the confirmed news: a reporting surface, not a product capability. No pricing change, no new model, no gate. What changed is how GitHub tells you the tool is working.

## Why it matters

Two sentences of product news, so the rest of this is *so what*.

The frame GitHub picked is the one this beat has been tracking all month: measure adoption as **influence and progression**, not a raw activity count. The guide's §08 argues developer marketing should be measured on the layer it actually moves — activation, progression to value, influence — and should resist forcing everything into a single last-touch number. GitHub just built exactly that shape into the admin console for the biggest AI dev tool in the market. Seats don't "convert"; they progress from writing code, to running agents, to orchestrating multiple agents — and some never leave the parking lot.

The Passive cohort is the honest half. Every seat-based tool has licensed-but-unengaged users, and the standard dashboard move is to launder them into an "active" denominator or quietly drop them. Naming them does two things. It gives a renewal-side buyer a number to push on — *why am I paying for 400 seats when 120 are passive?* — and it gives the seller a defensible adoption story that doesn't pretend the passive seats aren't there. For a product-marketing or DevRel team, that is the difference between a metric a procurement lead trusts and one they discount on sight.

The timing sharpens it. The day before, HCLTech published "The Blueprint for AI Leadership," a survey of 500 enterprise decision-makers run with Raconteur: 90% say GenAI and agentic AI are transforming their workflows, but only 18% report significant revenue impact. Read that as a vendor-commissioned survey — HCLTech sells AI transformation services and has an interest in a "divide" that consulting closes — but the gap it names is the exact gap GitHub's cohorts are built to argue about. When the whole market is being asked to prove AI spend pays off, the vendor that hands admins a credible progression-and-passive breakdown is answering a question the buyer is already being forced to ask.

None of this is unique to GitHub. Common Room's Otter.ai case study made the same bet from the outside: score accounts roughly 80% on first-party product behavior, because observed usage beats bought intent. GitHub has now turned that logic inward — onto its own seats — and put it in the box.

## What isn't confirmed

Whether this moves the ROI conversation is speculation. A prettier dashboard doesn't create revenue impact; it reframes the reporting. It's also unknown whether competitors — Cursor, GitLab Duo, JetBrains — copy the phase-cohort shape, or whether "passive seat" hardens into a renewal metric buyers use against vendors at the table. Those are the tells to watch, not facts to bank.

## The one move this week

Report your own tool's adoption the way GitHub just did, whether or not you ship through Copilot.

Stop leading with "active seats" or signup counts. Sort your users into progression cohorts — first call, first integration, in production — and **break out the passive segment explicitly** rather than hiding it in the denominator. Then trend the cohorts. This is a §08 measurement play, and it's copyable with a warehouse query and a week of definition work; you do not need GitHub's console to do it. The payoff is a story a skeptical buyer believes: here's who's progressing, here's the multiplier between engaged and passive, and here's what we're doing about the seats that aren't moving. In an ROI-skeptical quarter, the honest breakdown is the one that survives the renewal review.

**What to watch next:** whether a second major AI dev tool ships adoption-phase cohorts, and whether the DevRelCon NYC recaps — the conference wrapped today, tracks on agent-facing DX and measuring adoption — land any independent read on how teams are actually reporting AI-tool impact. If "passive seat" shows up in a renewal negotiation, this dashboard stopped being a reporting change and became a pricing one.
