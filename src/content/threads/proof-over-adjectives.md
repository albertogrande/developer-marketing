---
title: Proof over adjectives — publishing the uncomfortable number
question: Does publishing the number that cuts against you actually outperform claiming the one that flatters you?
summary: 'Developers fact-check in public, so the durable move is shipping something checkable — a dogfooding migration with its costs named, a benchmark that reports where you lose, a review workflow that prints its own counter-number. The same logic now governs deprecations: the window is the headline, and a dated one buys more trust than a generous vague one.'
status: open
momentum: rising
started: 2026-07-30
updated: 2026-08-17
sections:
  - 04-developer-experience-and-activation
  - 05-content-that-earns-trust
  - 07-launches
openLoops:
  - question: A second limits-raised case study — a vendor that dogfooded, hit its own published ceiling, and said so with the number.
  - question: The first vendor to market a migration plan as a feature rather than an apology. Deprecation is currently damage control everywhere; treating it as a selling point is the untested move.
  - question: Does a published counter-number ever measurably cost someone? The thread assumes honesty pays, and that assumption has not been falsified because nobody publishes the failures.
tags: [content, dogfooding, trust, deprecation, dx]
related:
  - label: Guide — Content that earns trust
    href: /guide/05-content-that-earns-trust
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
  - label: Archive — The honest benchmark and the noise floor
    href: /articles/2026-07-21-honest-benchmark-noise
  - label: Archive — Cloudflare dogfoods cdnjs
    href: /articles/2026-08-01-cloudflare-dogfoods-cdnjs
sources:
  - label: "Cloudflare — Dogfooding at scale: migrating cdnjs to Cloudflare's Developer Platform"
    url: https://blog.cloudflare.com/cdnjs-dev-platform-migration/
  - label: 'Sentry — How we built an automated debugging workflow at Sentry'
    url: https://blog.sentry.io/automated-debugging-workflow-sentry
---

The mechanism is not complicated. A developer audience checks claims, in
public, at speed. So an adjective costs nothing to write and earns nothing,
while a number someone can go and verify does work — and a number that cuts
against you does the most work of all, because nobody publishes those by
accident.

Three distinct mechanics are on the record, and it is worth keeping them
distinct rather than filing them all under "be honest".

**Dogfooding that names its own cost.** Cloudflare migrated cdnjs onto its own
developer platform and measured the exercise by the internal limits it had to
raise — the interesting output was not "it worked" but the list of places it
did not, yet.

**A benchmark that reports where you lose.** The honest-benchmark pattern:
publish the comparison including the runs where the competitor wins, and the
whole table becomes citable instead of dismissible.

**A workflow that prints its counter-number.** Sentry shipped its Seer review
numbers with the close-without-merge rate up 12.5% — and argued that the
increase was healthy rather than hiding it. That is the hardest version of the
move, because it requires having a thesis about why your bad-looking number is
good.

## The deprecation window is the same argument

This is where the thread earned its guide edits. When a product goes away, the
window is the headline and the mechanics decide whether anyone gets burned.
The ledger the site has built up is stark once it is laid side by side: Spark
at roughly 27 days, GitHub Models 29 days to dead, Cerebras about a month, MCP
at twelve, HCP Vagrant at roughly twenty-one.

A dated window a developer can plan against is a proof point in exactly the
way a benchmark is. A generous but vague one is an adjective.

## Tension

Founder credibility buys attention, not a verdict — and the reverse of this
thread is that proof does not always win the room either. Block shipped Buzz
in late July to 304 points on Hacker News and a broadly "LLM slop" reception:
the reach was real and the judgment went against it anyway. Publishing
something checkable is necessary, and this thread has not shown it is
sufficient.
