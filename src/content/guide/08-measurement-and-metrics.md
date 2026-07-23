---
title: Measurement & metrics
order: 8
summary: The metrics that tell you developer marketing is working, how to measure DevRel without pretending it's direct-response, and the funnel numbers worth instrumenting.
updated: 2026-07-23
---

Developer marketing is measurable — but not with a lead-gen dashboard. Much of its value is leading-indicator (activation, retention, sentiment) and influence (deals it shaped without a clean attribution line). The job is to measure honestly: instrument what you can, be explicit about what you can only influence, and resist forcing everything into last-touch attribution.

## The funnel metrics worth instrumenting

Adapt to your product, but most developer businesses should be able to see:

- **Time-to-first-success** and **time-to-value** — the DX metrics from section 04. Trend them; they gate everything downstream.
- **Activation rate** — share of signups/installs that reach first value. The single most important growth metric for a developer product.
- **Signup → integration → production** conversion — where developers drop between trying and shipping.
- **Retention / active integrations** — are they still calling the API next month? For dev tools, retained usage beats signups every time.
- **Expansion** — usage and surface-area growth within accounts.
- **Adoption-phase cohorts, with the passive seat counted** — for seat- or license-based tools, sort users by how far they've progressed (first use → agentic/advanced use → orchestration) and break out the *licensed-but-unengaged* segment explicitly instead of folding it into an "active" denominator. GitHub built exactly this into its Copilot admin dashboard (2026-07-22): three engaged phases plus a named "Passive" cohort. Naming shelfware gives a renewal buyer an honest number to trust — and a skeptical one a number you've already answered.
- **Docs metrics** — top landing pages, zero-result searches, quickstart drop-off step.

## Measuring DevRel without breaking it

Don't put a lead quota on DevRel (section 03). Measure it on the layer it actually moves:

- **Reach & awareness** — developers reached through talks, content, streams; qualified traffic to docs and repos.
- **Activation & enablement** — workshop attendees who activate; tutorial readers who reach first success.
- **Community health** — contributors, time-to-first-response, sentiment, returning participants.
- **Product feedback delivered** — issues surfaced, features shaped. Real value, usually uncounted.
- **Influenced pipeline** — deals where DevRel touchpoints appear in the story, reported as *influence*, not *attribution*. Sourced-lead credit misrepresents how developer trust actually converts.

## Product usage is the signal nobody else can buy

The same instrumentation that measures activation doubles as go-to-market data. Third-party intent signals — website visits, keyword tracking — are commoditized; every competitor can buy the same feed. First-party product usage is proprietary by definition, and operators who run outbound on it weight it heavily: scoring models built on roughly 80% behavioral signals (usage volume, new users added, in-app engagement) to 20% firmographics, with the play list deliberately capped at a dozen or fewer so sales can actually run it. Get raw usage events into a warehouse you control before you rent anyone's signal layer — the vendors that package these signals keep getting acquired into big GTM suites, and their roadmaps follow their new owners.

## Leading vs lagging

Revenue is lagging and heavily mediated for developer products — the path from a great tutorial to a signed contract is long and multi-touch. Manage to **leading indicators you can move this quarter** (activation, time-to-value, community responsiveness, content that ranks) and hold them accountable to the lagging ones over quarters, not weeks.

## Attribution honesty

- **Peer recommendation and organic discovery are usually your biggest channels and the hardest to attribute.** A model that credits only trackable touches will systematically undervalue exactly what's working and push spend toward what's merely measurable.
- **Prefer a blended view:** self-reported attribution ("how did you hear about us"), cohort analysis, and holdout/geo tests over a false-precision last-touch dashboard.
- **Report ranges and influence, not invented certainty.** For a developer audience, an honest "we influenced this, here's the evidence" is more defensible — and more useful — than a made-up attributed number.

The point of measurement is better decisions, not a prettier board. Instrument the path to value, watch it honestly, and let it tell you where the next unit of effort goes.
