---
title: "GitHub Code Quality shipped the default AI price: a seat, plus a meter"
date: 2026-07-22
summary: GitHub Code Quality went GA at $10 per committer a month with metered AI billing on top — the same seat-plus-meter shape Copilot and CodeRabbit already charge, now extended from writing code to reviewing it.
dek: The per-seat number is no longer the price of an AI devtool. It's the floor. What sits on top is a meter, and the whole category has quietly converged on it.
desk: money
byline: Mara Kessler
tags: [pricing, ai, github, monetization]
related:
  - label: Guide — Positioning for developers
    href: /guide/01-positioning-for-developers
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
sources:
  - label: GitHub Code Quality is now generally available (GitHub changelog, 2026-07-20)
    url: https://github.blog/changelog/2026-07-20-github-code-quality-is-now-generally-available/
  - label: GitHub Copilot is moving to usage-based billing (The GitHub Blog)
    url: https://github.blog/news-insights/company-news/github-copilot-is-moving-to-usage-based-billing/
  - label: CodeRabbit plans and pricing (CodeRabbit docs)
    url: https://docs.coderabbit.ai/management/plans
---

On July 20, GitHub moved Code Quality from free public preview to paid general availability. The price is $10 per active committer per month — plus a meter.

That last clause is the whole story. GitHub Code Quality pairs CodeQL's deterministic analysis with AI-assisted detection and Copilot Autofix, and the AI part bills by usage on top of the seat. CodeQL runs consume GitHub Actions minutes, billed separately again. So the $10 line item is not the price. It is the floor.

Look at what GitHub itself is now charging across its AI surface, and the shape repeats:

| Product (as of) | Per-seat price | Metered on top of the seat |
|---|---|---|
| Code Quality (GA 2026-07-20) | $10 / active committer / mo | AI detection + Autofix, usage-based; CodeQL runs on Actions minutes |
| Copilot Business (since 2026-06-01) | $19 / user / mo, incl. $19 AI Credits | token usage past the included credits |
| Copilot Enterprise (since 2026-06-01) | $39 / user / mo, incl. $39 AI Credits | token usage past credits; code review also burns Actions minutes |
| CodeRabbit Pro (annual) | $24 / dev / mo | on-demand credits for over-limit reviews |
| CodeRabbit Pro+ (annual) | $48 / dev / mo | on-demand credits for over-limit reviews |

Every figure here is from the vendor's own pricing page or changelog; none is a valuation or a projection. Read down the right-hand column and the seat is doing less work than it looks. On June 1, GitHub converted Copilot's flat "premium requests" into AI Credits — Business includes $19 of them, Enterprise $39 — that drain by token usage, input, output, and cached, at the published API rate for each model. Inline completions stay free. Everything agentic — chat, agent mode, code review, the CLI — draws down the pool, and when the pool is dry you pay by the token. CodeRabbit, an independent, does the same thing from the other direction: a $24 seat with a rate limit, and on-demand credits to keep reviewing past it.

Code Quality's GA is the tell because of *what* it meters. Copilot metering the model that writes your code is intuitive — generation is obviously a variable cost. Code Quality extends the same two-part tariff to *reviewing* and *scoring* code you already wrote: maintainability, reliability, coverage gates. The meter has crossed from the thing that produces tokens to the thing that inspects them. And it landed with almost no fuss — the changelog drew barely any discussion — which is the real signal. A pricing model nobody argues about is a pricing model that won.

## Why this is the shape

The economics force it. Seat pricing assumes a roughly fixed cost to serve each user. Inference does not behave that way: a heavy agent user can cost 50 times a light one, and the vendor pays that difference to a model provider in near-real time. A flat seat either overcharges the light user into churn or gets eaten alive by the heavy one. The two-part tariff — a seat for access, a meter for consumption — is the textbook fix, and the category has now adopted it in unison. GitHub's own June migration note is explicit that the plan *prices* didn't change; what changed is that usage above the included credit now has a price at all.

For a developer-marketing reader this is not a billing footnote. It is a positioning problem, on both sides of the sale.

## What to do about it

**If you price an AI devtool, separate the license from the meter — and say so.** The seat buys access; the meter buys consumption. Bundling them into one flat number was fine when serving cost was flat; with inference it either bleeds margin or punishes your best users. Publish both, and — this is the part most vendors still botch — publish the cap. The guide's positioning section already argues that where billing is usage-based, a legible monthly ceiling is a trust signal (§01); the AI meter is exactly the case where a developer's first question is "what stops this from surprising me?" GitHub answers it with included credits before the meter starts. Answer it too, or "contact sales" becomes the tell that you're hiding the number.

**If you buy, the seat is not the budget.** A $10 committer line and a $19 Copilot seat read like fixed costs and model like variable ones. Two subtleties compound the bill. First, "active committer" is not "user" — GitHub counts anyone who pushed in the billing period, the same base it used for Advanced Security, so a large monorepo team can surface more billable committers than named licenses. Second, the metered tail scales with adoption: the harder your team leans on agent review and autofix — the behavior the vendor is selling you — the more Actions minutes and AI Credits you burn. Success raises the invoice. Model the tail before you roll out org-wide, not after the first true-up.

**Watch whether the meter stays legible.** Included-credit allowances are the humane version of usage pricing; per-token overage with no visible cap is the version that erodes trust the way a silently pruned free tier does (§04). GitHub's promotional credits for Business and Enterprise — $30 and $70 in monthly AI Credits, up from the standard $19 and $39 — run through August 2026. The honest read of where this category is headed arrives when those promos lapse and the first full metered invoices land.

**What to watch next:** the fourth vendor to move a *non-generative* feature — security scanning, docs, observability — onto a metered AI line, and whether any of them ships the monthly cap alongside the meter. The price model is settled. Whether it's legible is not.
