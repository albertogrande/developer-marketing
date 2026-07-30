---
title: 'Four numbers that survive the CFO: what a developer motion should actually report'
date: 2026-07-30
summary: 62% of DevRel teams now report to the C-suite, but only 18% can tie their work to revenue — and the vendors' own dashboards are starting to hand your CFO usage numbers whether you report them or not. The fix is four auditable numbers, each with a known cost to collect.
dek: DevRel has spent seven years arguing about whether it should be measured in money. Meanwhile the seller's dashboard started counting your empty seats, the signal vendors got acquired into GTM suites, and the field's own metrics working group went quiet. The argument is over — what's left is choosing numbers a finance team can re-derive.
tags: [devrel, metrics, measurement]
related:
  - label: Guide — Measurement & metrics
    href: /guide/08-measurement-and-metrics
  - label: Guide — DevRel & community
    href: /guide/03-devrel-and-community
  - label: Article — GitHub's Copilot dashboard now counts the seats nobody uses
    href: /articles/2026-07-23-copilot-passive-seats
  - label: Article — The community-signal category just got its third acquirer in eight months
    href: /articles/2026-07-18-community-signal-rollup
  - label: 'Dive — Time-to-value: the growth engine hiding in your onboarding'
    href: /deep-dives/2026-07-06-time-to-value-is-the-growth-engine
sources:
  - label: Mary Thengvall — DevRel Qualified Leads (blog series, from December 2019)
    url: https://www.marythengvall.com/blog/category/DevRel+Qualified+Leads
  - label: State of Developer Relations — 2024 report (11th annual)
    url: https://www.stateofdeveloperrelations.com/2024devrelreport
  - label: devrel.agency — Announcing the 11th Annual State of Developer Relations Report (September 2024)
    url: https://www.devrel.agency/post/announcing-the-11th-annual-state-of-developer-relations-report
  - label: Develocity — A look into the 10th Annual State of Developer Relations report
    url: https://develocity.io/a-look-into-the-10th-annual-state-of-developer-relations-report/
  - label: swyx — DevRel's Death as Zero Interest Rate Phenomenon (dx.tips, early 2024)
    url: https://dx.tips/zirp
  - label: Forecastable — Why your CFO distrusts partner-sourced pipeline
    url: https://forecastable.com/partner-sourced-vs-partner-influenced/
  - label: GitHub Changelog — New Copilot usage metrics impact dashboard (2026-07-22)
    url: https://github.blog/changelog/2026-07-22-new-copilot-usage-metrics-impact-dashboard/
  - label: Common Room — The 5 usage-based plays Otter.ai used to 2x outbound pipeline
    url: https://www.commonroom.io/blog/otter-webinar-recap/
  - label: DevRel Foundation (Linux Foundation) — working groups
    url: https://dev-rel.org/about/working-groups
  - label: DevRel Foundation — Metrics & Reporting working group (archived November 2025)
    url: https://github.com/DevRel-Foundation/wg-metrics-reporting
  - label: HCLTech — Report exposes widening AI divide, only 18% of enterprises seeing revenue impact (July 2026)
    url: https://www.hcltech.com/press-releases/hcltech-report-exposes-widening-ai-divide-only-18-enterprises-seeing-revenue-impact
---

Somewhere this quarter, a CFO is deciding whether the developer motion — the DevRel team, the developer-marketing budget, the community program — earns another year. The [2024 State of Developer Relations report](https://www.stateofdeveloperrelations.com/2024devrelreport) says 62% of DevRel teams now report to founders or C-level executives, 20% directly to the CEO. It also says only 18% tie their metrics to revenue influence, and 61% struggle to demonstrate impact. Read those three numbers together: the field won the org-chart argument and is still losing the budget argument, in the same room.

The thesis of this piece is one sentence: **report four numbers the finance team can re-derive from systems it already trusts — cost per activated developer, activated-to-revenue conversion, influenced pipeline under a written rule finance co-signed, and net revenue retention split by developer engagement — and move everything else to an appendix.** Each of the four has a knowable cost to collect. Reach, views, stars, and community warmth are real, and they are context, not currency. The currency is what survives an audit.

## How the field got stuck

The measurement argument is older than most of the teams having it. The canonical early answer is Mary Thengvall's [DevRel Qualified Leads](https://www.marythengvall.com/blog/category/DevRel+Qualified+Leads), from December 2019: since DevRel keeps getting judged on other departments' metrics — signups for sales, badge scans for marketing — repurpose the "qualified lead" into something DevRel actually controls. A DQL is a person the team connects to the company who creates value anywhere: a community member who becomes a case study, a beta tester, a bug reporter, an integration partner, a hire, sometimes a customer. The framework's virtue is that it counts work DevRel uniquely does. Its limit, which matters for this piece, is that finance cannot price a bug report. DQLs are a good internal operations metric and a weak budget defense, because the person auditing the budget has no system of record where a DQL lives.

Then came the correction. swyx's [DevRel's Death as Zero Interest Rate Phenomenon](https://dx.tips/zirp) is the essay of record on 2023–24: the 2020–2022 buildout was a ZIRP artifact, the contraction was a right-sizing, and — the sharper point — late-ZIRP DevRel had developed what he calls performative overaccountability — "trying to instrument and measure every little youtube view and github star as though it matters." The Common Room survey he cites found 26% of DevRel respondents had experienced layoffs in 2023. The 2024 survey wave put layoffs at 15% and median total compensation at $193,000 — expensive people, still getting cut at meaningful rates, still mostly unable to show a revenue line.

Two details from the record say the field knows this is unresolved. In the 10th annual survey (2023), measurement was the top challenge in the field at 67.3% — ahead of awareness, ahead of burnout. And the [DevRel Foundation](https://dev-rel.org/about/working-groups) — the Linux Foundation project meant to standardize the discipline — had a dedicated [Metrics & Reporting working group](https://github.com/DevRel-Foundation/wg-metrics-reporting) that was archived in November 2025 with a one-line README: "This working group is no longer active." The community-engagement and resources groups carried on. The field's own attempt to standardize its answer to the CFO went quiet first.

## Why 2026 forces the issue

You could read seven years of stalemate as evidence the question is unanswerable. What changed is that other people started answering it for you, with your usage data.

On 2026-07-22, GitHub shipped a [Copilot impact dashboard](https://github.blog/changelog/2026-07-22-new-copilot-usage-metrics-impact-dashboard/) that sorts an enterprise's licensed users into adoption-phase cohorts — and breaks out a named "Passive" segment: licensed, paid for, unengaged. That is a vendor handing the buyer's finance team a shelfware count ([our coverage](/articles/2026-07-23-copilot-passive-seats)). The renewal conversation for every seat-based devtool is converging on the same shape: the CFO opens a dashboard someone else built and asks why 30% of the seats are dark. If the developer-facing team hasn't brought its own usage-linked numbers, it doesn't get to frame that conversation — it gets framed by it.

The same consolidation is happening one layer down. The tools that package community and product signals into revenue language keep getting acquired into GTM suites — Clari merged with Salesloft in a deal that closed December 2025, Apollo bought Pocus in March 2026, Zoom agreed to buy Common Room in July ([our coverage](/articles/2026-07-18-community-signal-rollup); all terms undisclosed). The market is betting real money that developer-behavior signals belong in the revenue stack. The operators already there agree: Otter.ai's growth team [described](https://www.commonroom.io/blog/otter-webinar-recap/) scoring outbound on roughly 80% behavioral signals to 20–30% firmographics and doubling outbound pipeline — a vendor-hosted account, so discount accordingly, but directionally consistent with everything else in this list.

The conclusion practitioners keep resisting: the question is no longer *whether* the developer motion gets measured in revenue terms. It's whether the numbers come from you, with definitions you wrote, or from someone else's dashboard.

## The four numbers

The test for every candidate number is the same. Can the CFO re-derive it from a system finance already trusts — the warehouse, the CRM, the billing system? If yes, it's currency. If it lives only in your team's spreadsheet, it's a story. Stories are fine; they go in the appendix.

### 1. Cost per activated developer

Take the quarter's spend on the developer motion. Divide by the number of developers who reached your activation bar — not signups, the bar itself: first successful API call, first deploy, first workflow completed. (If you haven't defined that bar, that's the prerequisite work; [the time-to-value dive](/deep-dives/2026-07-06-time-to-value-is-the-growth-engine) is the anatomy.)

This is the top-of-funnel number finance actually wants from you. It's the developer-native analog of customer acquisition cost, and it's honest in a way "cost per signup" is not, because a signup that never calls the API is a vanity row. It also trends the right way when the team is doing real work: better docs, a faster quickstart, and sharper targeting all push it down.

**Cost to collect:** a cross-team definition meeting and a few weeks of instrumentation — activation events flowing into the warehouse with stable identifiers. Ongoing cost near zero. **Failure mode:** definition drift. The bar quietly lowers so the number improves. Fix: the definition is written down, versioned, and changing it requires telling finance you changed it.

### 2. Activated-to-revenue conversion

Of the developers (or accounts) that activated in a cohort, what share reached production, paid, or a qualified opportunity within a stated window? This is the bridge number — it converts "we activate developers" from a leading-indicator claim into a demonstrated link to money. Reported by cohort, it also answers the question CFOs ask second: is the quality of what you bring in going up or down?

**Cost to collect:** this is where identity resolution stops being a data-engineering footnote and becomes the tax. Product accounts, CRM records, and billing rows describe the same human three different ways; joining them is the whole job. It's also, not coincidentally, the pitch of every signal vendor that just got acquired — Common Room's own case material claims a customer cut duplicate records from 3% to 0.3% (vendor-claimed). Budget a real data-engineering investment the first quarter and a maintenance drip after. **Failure mode:** silently counting only the easy joins, which overstates conversion for exactly the segments you already understand.

### 3. Influenced pipeline — under a rule finance co-signed

Here's where most reports die, and the mechanics of why come from the partnerships world, where finance has seen this movie longest. [Forecastable's write-up](https://forecastable.com/partner-sourced-vs-partner-influenced/) on partner pipeline puts it in one line: "A CFO will defend a partnerships investment that produces $3M in partner-sourced ARR with a defensible attribution rule. But a CFO won't defend a '$10M influenced' number" — especially, it adds, when the influenced figure "double-counts every deal an AE mentioned to a partner in passing." Swap "partner" for "DevRel" and every word holds. The moment finance audits one deal in your influenced number and finds a webinar attendance two months after the SDR sourced it, the entire figure — and next year's headcount ask — collapses with it.

The fix is not to abandon influence; it's to make the rule auditable and boring. Pick three or four *documented* touch types — a workshop a named buyer-side developer attended, a community thread your team resolved for someone on the account, a hands-on lab at an event with a badge scan. Write the rule down. Get sales ops and finance to sign it. Report influenced pipeline *only* under that rule, always separated from sourced (which will be smaller, and should be), and volunteer a quarterly audit: pull ten influenced deals at random, show the touches. An invited audit is the cheapest trust you will ever buy.

**Cost to collect:** mostly political, not technical — CRM hygiene and the negotiation of the rule itself. Two months of nagging, then a habit. **Failure mode:** touch inflation. Every logged touch type you add makes the number bigger and less believable. The discipline is keeping the list short.

### 4. Net revenue retention, split by developer engagement

Take accounts with active developer usage — real engagement against your activation and usage bars — and accounts without. Report net revenue retention for each. If the developer motion works the way you claim, engaged accounts renew better and expand more, and the spread between those two NRR figures is the single most persuasive number in the whole report, because it's denominated in the CFO's own unit.

This is also the defensive number. GitHub's passive-seat cohort is this exact computation run from the seller's side; the [HCLTech/Raconteur survey wave](https://www.hcltech.com/press-releases/hcltech-report-exposes-widening-ai-divide-only-18-enterprises-seeing-revenue-impact) from the same week (500 enterprises, vendor-commissioned) had 90% of enterprises saying AI transforms workflows while only 18% see significant revenue impact — buyers are being armed to find the gap between paying and using. Computing your own engagement-split NRR means that when the passive-seat question arrives at *your* renewal, you answer with a number you've already reconciled, not a rebuttal you're improvising.

**Cost to collect:** the most expensive of the four — it stacks on the identity join from number 2 and adds cohort work in the warehouse; realistically a quarter of part-time data-engineering effort before the first honest cut. **Failure mode:** confusing correlation with cause. Engaged accounts may retain better because healthy accounts engage. Say so in the footnote — a CFO trusts a team that flags its own confound far more than one that claims a clean causal line — and if you want the causal version, that's what holdouts are for.

## The strongest case against — taken seriously

The counter-argument is not a strawman; it's the field's majority position, held by its most credible people. In the 10th annual survey, 88.7% of practitioners said sales activities are not part of DevRel. Thengvall built DQLs precisely because money-metrics imported from other departments were metrics DevRel "has zero control over." And the failure the camp predicts is real and well documented: put a pipeline number on an advocate and the advocacy dies — developers smell capture instantly, and the trust that made the program work is the first casualty. [Our own guide](/guide/03-devrel-and-community) says a version of this: don't put a lead quota on DevRel.

Steelmanned fully: *any* revenue reporting, however carefully fenced, becomes a target the moment budgets tighten — Goodhart's law with a org chart. The team that reports influenced pipeline in Q1 gets an influenced-pipeline *goal* in Q3, and by next year advocates are prioritizing accounts by deal size. If the numbers exist, they will eventually be used as quotas. The only safe move is not to create them.

Here is why that position, held sincerely, keeps losing: the numbers get created anyway. The 2023–24 correction was not gentler on the teams that refused revenue framing; by swyx's account and the survey record, it hit them first, at 26% layoff exposure, while the field's median comp sat near $200K — a cost line that visible does not get to opt out of a language the CFO understands. And 2026's twist is that abstention no longer even keeps the numbers from existing: the seller's dashboard, the acquired signal vendors, and the buyer's own procurement team are all computing usage-to-revenue numbers about your motion. Refusing to report is no longer refusing to be measured. It's just refusing to be present when the measuring happens.

The honest synthesis: the quota objection is an argument about *individual* incentives, and it's correct at that level. Never put pipeline goals on a named advocate; measure people on the craft — content shipped, questions answered, feedback landed in the roadmap. But the *program* — the budget line the CFO sees — must be reported in auditable currency, because that's the level where the alternative is someone else's dashboard. Report the program in money. Manage the people on craft. The failure mode isn't reporting revenue; it's collapsing the two levels into one.

## What this looks like on one page

The report to finance is one page, quarterly:

1. **Cost per activated developer** — trend, with the activation definition footnoted and versioned.
2. **Activated-to-revenue conversion** — by cohort, window stated, join coverage stated ("we can match 74% of product accounts to CRM; here's the plan for the rest").
3. **Influenced pipeline** — under the co-signed rule, sourced reported separately, audit standing invitation.
4. **NRR split by engagement** — with the correlation caveat in print.

Then one appendix page for everything the four numbers can't carry: reach, community health, product feedback shipped, the DQL stories. That material is real — it explains *why* the four numbers move — but it's evidence for the mechanism, not the mechanism's price.

And one line at the bottom that costs nothing and buys more credibility than any figure: **what we stopped counting this quarter, and why.** A team that retires its own vanity metric in writing is making the exact move the whole report depends on — showing finance it would rather have a smaller true number than a bigger soft one. That is, in the end, the entire trade: the four numbers are smaller than the story you could tell. They're also the only ones still standing after the audit.
