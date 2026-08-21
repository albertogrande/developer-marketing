---
show: Scaling DevTools
episode: How can you actually use AI in DevTools content? With Victor Coisne from Strapi
date: 2025-10-24
url: https://podcast.scalingdevtools.com/episodes/ai-powered-content-creation-inside-strapis-marketing-playbook
guests:
  - Victor Coisne (Strapi) — VP of Marketing
host: Jack Bridger
topics: [content, docs, aeo, metrics]
candidates: [practice]
distilled: 2026-08-18
---

## What it covers

A tactical walkthrough of Strapi's AI-assisted content pipeline: three workflows
(net-new content, content refresh across ~2,000 posts, programmatic SEO),
where AI is trusted versus not, and the tooling for fact-checking, social
listening, and AI-search visibility (GEO).

## Claims worth checking

- [02:08–04:46] Strapi runs three distinct AI content workflows: net-new
  (keyword/SERP-driven, for non-branded search), refresh (AI diffs an
  outdated tutorial for a minor fix or flags it "requires a complete
  rewrite" and adds a disclaimer), and programmatic SEO for
  integration/comparison pages. Self-reported, no output metrics given.
- [09:48–10:40] Strapi deliberately does **not** use AI to write full
  tutorials — those stay human/influencer-authored (code first, then a
  written tutorial built around it) — because tutorial quality bar is
  higher than listicles/FAQ/comparison content, which the AI workflow does
  handle. A specific, testable line drawn between good and bad AI-content
  use cases.
- [12:10–13:52] The seven-step net-new workflow: assignment → research →
  outline → draft → fact-check/code review → internal linking → metadata.
  Self-described process, not independently verified.
- [14:52–17:34] Fact-checking runs through Kapa.ai (a support/docs Q&A bot
  trained on Strapi's own docs) called via API against generated drafts;
  Kapa's "content gap" feature (queries where it answers "I don't know")
  feeds back into the content backlog. Vendor-tool-dependent claim, plausible
  but unverified outside Strapi.
- [17:56–27:34] Social listening via Octolens: a weekly digest of brand/
  competitor mentions goes to PMs and engineering, not just marketing.
  Explicit anti-pattern named: don't jump into every Reddit mention
  promoting your product ("you'll be banned... it's spam") — engage only to
  help, mostly on their own subreddit. Unanswered community questions get an
  AI-generated answer (via Kapa) rather than staying unanswered, because
  those threads get indexed and surfaced in ChatGPT/Google. Self-reported
  practice, not measured.
- [30:12–31:40] For GEO/AI-search tracking, Strapi uses Scrunch and
  Profound (plus SEMrush's newer GEO features) — prompt-based citation
  monitoring against competitors. Named tools, no data shared on results.
- [21:01–23:36] Claims content "freshness" and pillar/cluster internal
  linking matter more under GEO than old SEO, because long, multi-word
  prompts reward deep coverage of niche subtopics that funnel to one
  authoritative, human-written pillar page. Practitioner's framing, not a
  benchmarked finding.
- [39:02–40:04] States Strapi has "yet to see someone getting penalized" by
  Google for large-scale AI-generated programmatic SEO pages, provided the
  content is genuinely useful rather than keyword-stuffed. Anecdotal/
  unverified — no Google statement or case study cited.
- [40:15–40:57] Argues human-in-the-loop matters *more* for developer
  audiences than other personas because developers have an "AI detection
  radar." Stated as a belief, not tested.

## Quotes

> "Developer trust is really hard to gain and really easy to lose." —
> Victor Coisne [00:44]

> "As long as it provides value, the fact that it's automated or AI
> generated, I don't think it's gonna be a red flag." — Victor Coisne,
> on programmatic SEO at scale [39:02]

## Why it matters here

Directly on-topic for `05-content-that-earns-trust` and the AEO section: a
named practitioner giving specific, checkable process detail (which content
types get full AI treatment vs. stay human-authored, how fact-checking is
wired to a docs-trained bot, how GEO tracking tools get used) rather than
generic "use AI for content" advice. Everything here is one company's
self-report with no independent metrics — treat as a sourced practitioner
account, not evidence of what works, and note that before promoting a
`when X → do Y` practice from it, since the guide's practices bar wants
current *and* dated facts, not just a vendor's confident process
description.
