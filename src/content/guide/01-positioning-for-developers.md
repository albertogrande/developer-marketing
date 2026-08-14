---
title: Positioning for a technical audience
order: 1
summary: How developers decide who to trust, why category and clarity beat adjectives, and how to write a positioning that a skeptical engineer will forward instead of eye-roll.
updated: 2026-08-10
---

Positioning is the answer to "what is this, who is it for, and why should I care" — delivered in the first ten seconds, in language the reader already uses. For developers, weak positioning isn't just ineffective; it's a trust penalty. Vague adjectives ("powerful", "seamless", "next-generation") signal that you're hiding something or don't understand your own product.

## Start from the job, not the category buzzword

Developers evaluate tools by the job to be done: *"send transactional email", "add auth without building it", "search across my data"*. Name that job plainly. The fastest positioning test: can a developer read your homepage headline and correctly guess what the first API call does? If not, rewrite it.

Borrow the discipline of category design when a real new category exists — but most products slot into a job developers already understand. "Stripe for X" clarity beats "reimagining the future of Y" every time.

## The three questions every technical buyer asks

1. **Does it actually work?** Show it. A live code sample, an interactive playground, a real benchmark with methodology. Claims without evidence are noise.
2. **Will it lock me in or slow me down?** Developers price in switching cost and operational risk. Be explicit about standards support, export, self-hosting, and how you fail. Openness is a positioning asset — and that includes pricing: put a real number on the page, and where billing is usage-based, show a monthly cap. "Contact sales" and vague tiers read as something to hide; a legible price is a trust signal. AI-assisted features have converged on a two-part shape — a per-seat license plus metered model consumption (by mid-2026 the pattern ran from code generation to code review: Copilot's seats with draining AI credits, GitHub Code Quality's $10/committer plus usage, CodeRabbit's seat plus on-demand credits). If that's your shape, publish both parts *and* the cap: the seat is the floor, not the price, and a meter the buyer discovers on the invoice is a trust debt you chose. As of August 2026, data rights joined the priced terms: Meta's Muse Code launched with a "contributor" tier roughly 12–21x below list in exchange for training on the user's prompts and completions — as far as we can find, the first time a training-data policy carried a public market rate. Whatever your policy, it now belongs on the pricing page, not in a trust-center FAQ: "we don't train on your code" is a positioning claim with a number attached.
3. **Who else uses it, and were they glad?** Logos matter less than a credible engineer saying "we run this in production and here's what happened." Peer proof outranks vendor proof — and *verifiable* proof outranks both. A logo wall shows someone signed once; a live weekly-download count, a public star-history graph, or a deploy counter shows the thing is used, and a developer can go check the source. Prefer current, reproducible numbers to social proof they have to take on faith.

## "Developers" is not one persona

The single job title hides buyers who behave nothing alike. An indie hacker spending personal money evaluates you on a weekend, alone, and wants to reach a working result before dinner. A platform engineer on a team spends the company's money, has to fit you into an existing stack, and needs organizational buy-in and a switching-cost story before anything ships. Same headline can't serve both: one wants "running in five minutes on the free tier", the other wants "here's how you migrate, what it costs at scale, and who owns it in production." Decide which developer a given page, tutorial, or launch is for, and say so — trying to address every developer at once addresses none of them well.

## Write for the skeptic, not the champion

Your best distribution is a developer forwarding your page to their team with "this looks legit." That happens when the copy respects them: concrete nouns, real numbers, honest scope. Name what you *don't* do. Counter-intuitively, stating limitations up front increases trust and reduces the support and churn cost of mismatched expectations.

## Anti-patterns

- **Adjective soup.** If deleting every adjective leaves the sentence just as informative, the adjectives were doing no work.
- **Marketing-speak the product team wouldn't say.** If your own engineers cringe at the homepage, developers will too.
- **Hiding the product.** "Contact sales to see pricing/docs/the API" tells a developer you're not for them. Let them read, try, and self-qualify.

Positioning is upstream of everything else in this guide. Get it wrong and even great docs and DevRel are pushing the wrong message efficiently.
