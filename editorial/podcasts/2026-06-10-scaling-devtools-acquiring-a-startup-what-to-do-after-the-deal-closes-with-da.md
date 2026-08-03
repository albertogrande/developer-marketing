---
show: Scaling DevTools
episode: "Acquiring a startup: what to do AFTER the deal closes - with Dan Moore from FusionAuth"
date: 2026-06-10
url: https://podcast.scalingdevtools.com/episodes/dan-moore-20b5f6a6-a30f-4ee8-82a4-64eacb40027f
guests:
  - Dan Moore (FusionAuth) — led post-acquisition integration of Permify
host: Jack Bridger
topics: [positioning, docs, devrel]
candidates: [practice]
distilled: 2026-08-02
---

## What it covers

FusionAuth acquired Permify (open-source, Zanzibar-style fine-grained
authorization, five employees, based in Turkey) in November 2025. Dan Moore
walks through his own after-the-close playbook: messaging to four distinct
audiences, pricing and packaging decisions, account/access inventory,
migration timelines, and cross-marketing once integration work is real. Framed
throughout as one company's n-of-1 experience, explicitly flagged as such by
the guest himself.

## Claims worth checking

- [03:30–05:29] Messaging has to be sequenced to four separate audiences
  before close — acquired company's users/customers, acquiring company's
  users, press, and internal staff on both sides — because "the last thing you
  want to do is communicate something that turns out not to be true." His own
  process, not a general study.
- [04:16] "No one cares about your product launch unless you're like a big
  company, but people do care about... an acquisition" — their CMO's stated
  reasoning for treating the deal as a press moment. Attributed internally,
  not sourced externally.
- [06:26] Executive-level (not team-level) decision to keep the acquired
  open-source project open source post-acquisition — framed as a trust
  commitment to the OSS community, made explicit before any public
  communication went out.
- [09:26–10:28] Pricing outcome: bundled the acquired feature into the
  enterprise tier only (not self-serve), based on customer interviews showing
  it's a "great add-on, not necessary for every customer" — same shape as SCIM
  or Kubernetes support in their existing lineup. One company's packaging
  call, useful as a comparable, not a rule.
- [25:44] Standing migration-window rule of thumb he gives: month-long
  deprecation windows are too short for a DevTool, "months, year-ish... felt
  like the right thing," and longer again when there's no drop-in replacement
  (his RDS vs. DynamoDB analogy). Stated as personal judgment, not measured
  against churn data — but a concrete number worth comparing against the
  GitHub Models six-week window on record (2026-07-30 signal).
- [34:12–35:41] Enablement tactic: a recurring "Permify slide" at every
  all-hands plus a sales one-sheeter naming exactly when to mention the
  acquired product, to keep integration work from losing internal attention
  once the announcement splash fades.

## Quotes

> "You actually want to put the control in the hands of the customers... what
> you don't wanna do is force it." — Dan Moore, on migration timing [27:37]

> "No one cares about your product launch unless you're like a big company,
> but people do care about... a dollar figure and acquisition." — Dan Moore,
> paraphrasing his CMO [04:16]

## Why it matters here

A rare first-person account of the unglamorous integration work behind a
devtools acquisition — relevant to `04-developer-experience-and-activation`
(migration windows, trust during a deprecation-adjacent event) and
`03-devrel-and-community` (keeping an acquired OSS project's community
intact). The month-vs-year migration-window judgment is a useful comparable
for the deprecation-trust thread already running in memory, but it is one
practitioner's estimate for one deal, not a benchmark — cite it as Moore's
call, not as a rule.
