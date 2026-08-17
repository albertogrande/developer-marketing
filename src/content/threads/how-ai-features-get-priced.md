---
title: How AI features get priced — seat, meter, and now data
question: Is seat-plus-meter still the devtools default, or is access to training data becoming a third thing developers pay with?
summary: 'Per-seat licence plus metered consumption settled in as the devtools default for AI features. Then Meta priced a discount as a data trade — roughly 12x cheaper on input, 21x on output, in exchange for training on the user''s prompts — and the question became whether an incumbent answers with a tier of its own.'
status: open
momentum: rising
started: 2026-07-22
updated: 2026-08-17
sections:
  - 01-positioning-for-developers
  - 04-developer-experience-and-activation
openLoops:
  - question: Does an incumbent ship — or explicitly rule out — a data-for-discount tier? Silence past the end of August reads as "the entrants are noise".
    by: end of August 2026
  - question: Does a *non-generative* feature get metered? Every metered feature so far bills tokens; the first one that meters something else tells us whether the meter is about AI cost or about a new billing habit.
  - question: What happens when Copilot's promotional credits lapse (~September 2026)? The first public bill-shock story is the test of whether the meter was priced honestly.
    by: around September 2026
tags: [pricing, positioning, ai-coding-agents]
related:
  - label: Guide — Positioning for developers
    href: /guide/01-positioning-for-developers
  - label: Claim — Price AI features as seat plus meter
    href: /claims#price-ai-features-as-seat-plus-meter
  - label: Claim — Put the training-data policy on the pricing page
    href: /claims#put-the-training-data-policy-on-the-pricing-page
  - label: Archive — The seat-plus-meter settlement
    href: /articles/2026-07-22-seat-plus-meter-pricing
sources:
  - label: 'TechCrunch — Meta launches Muse Code, an AI agent for large code bases'
    url: https://techcrunch.com/2026/08/05/meta-launches-muse-code-an-ai-agent-for-large-code-bases/
  - label: 'Meta — Muse Glimmer'
    url: https://developer.meta.com/ai/models/muse-glimmer/
---

The answer we had in July was tidy. AI features in developer tools price as a
per-seat licence plus a metered consumption line — the seat pays for access,
the meter pays for tokens. It is the shape the category converged on without
much argument, and the guide carries it in §01.

August broke the tidiness in one move. Meta launched Muse Code with standard
pay-as-you-go pricing at $1.25/$4.25 per million input/output tokens, and
alongside it a "contributor" tier at $0.10/$0.20 — roughly 12x cheaper on
input and 21x on output — in exchange for Meta training on the user's prompts
and completions. That is not a volume discount and it is not a seat. It is a
third axis: the customer pays with data, and the discount puts a public market
rate on what that data is worth.

The immediate consequence is concrete enough to act on, and it is already a
claim: a training-data policy is now a pricing decision, so it belongs on the
pricing page rather than buried in a DPA. Nobody has to guess what the trade is
worth any more — there is a number.

## The tension

Meta is running both directions at once. The same month it priced Muse Code's
contributor tier as a data trade, it open-sourced Muse Glimmer — 30B
parameters, Apache 2.0, on Hugging Face, running on a single consumer GPU with
no network call at all. One product charges you less for your data; the other
gives away a model that never sees it.

That is genuinely awkward for the thread. The simple reading — "data is the new
currency" — does not survive a free, local, Apache-2.0 release from the same
vendor in the same month. The more careful reading is that the data trade is a
*beta acquisition* mechanism rather than a settled pricing axis, and that
Glimmer is the hedge. If that is right, the contributor tier quietly disappears
at GA and this thread cools.

## Why it moved now

The pricing question got sharp because the product question went flat. Three
terminal coding agents launched inside forty-eight hours in early August —
Muse Code, Memcode, Clark Code — and none of them competed on what the agent
can do: Meta on price-as-data-trade, Memcode on repository memory, Clark on an
Apache-2.0 licence. A fourth, Mirafold, sold a UI layer over the incumbents
rather than an agent at all.

When the accessory market arrives and nobody is arguing about capability, the
terms sheet becomes the product. That is why pricing structure is worth
following weekly right now, and it is the thread's actual bet.
