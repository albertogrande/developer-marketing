---
title: Answer engines & AEO
order: 9
summary: What to do when the first impression is a model's paraphrase — the three layers of machine-mediated discovery, which of them pay today, and how to measure your presence without buying a dashboard.
updated: 2026-08-17
---

A growing share of developers meet your product as a paraphrase. A coding assistant summarizes your docs inside the editor; an answer engine compares you against two competitors in a chat window; an agent reads your API reference to decide whether it can do the job. The discipline that has formed around this goes by several names — AEO (answer engine optimization), GEO (generative engine optimization) — and it arrives with a venture-funded tooling category and a large pile of ritual attached. Sorting the real work from the ritual is most of the job.

The one-line position: **machine-mediated discovery is a real channel with real conversion numbers, but almost everything sold under the AEO label is either premature or free — the durable work is making your docs and API surfaces machine-legible, which is work you should want anyway.**

## Three layers, three different bets

Everything in this space sorts into three layers with very different risk profiles. Conflating them is what makes the category feel like snake oil.

- **The reading layer — real, cheap, do it now.** Models already mediate first impressions. The work is unglamorous: serve docs as static HTML rather than client-rendered JavaScript; make one section answer one question, so a chunk retrieved alone still makes sense; put real numbers — pricing, rate limits, latency — on ungated pages where a model can quote them instead of guessing; publish OpenAPI for the reference; and check that `robots.txt` isn't blocking *retrieval* bots while you deliberate about *training* bots, which are a separate population and a separate decision.
- **The selection layer — early, design for it if you sell an API.** Nobody can show you conversion data on agent-initiated purchases yet, but the pattern is legible: machine-readable everything, quote-then-execute pricing so an agent can't be surprise-billed, idempotency keys so a retry can't double-buy, scoped tokens so an agent can search without holding purchase permission, and consent records of what was agreed and when. GoDaddy's developer platform (July 2026) is the most copyable artifact the thread has produced. Every element doubles as good API design for humans, which is why it's worth adopting before the data arrives.
- **The measurement layer — forming, mostly don't buy yet.** Enterprises will pay to know how AI describes them; Profound raised $96M at a $1B valuation in February 2026 with 700+ enterprise customers. At Fortune-500 scale, across hundreds of SKUs and ten AI surfaces, a dashboard may earn its keep. For a typical devtool company the math is different, and the free check gets you most of the signal.

## What the numbers actually support

The honest read requires holding two sets of evidence at once.

**The channel is real.** Vercel reported ChatGPT referring 10% of new signups in April 2025, up from under 1% six months earlier — first-party attribution on its own funnel. The mechanism was plumbing, not magic: docs rendered as static HTML and structured so a model could retrieve a clean answer to a task-shaped question. Similarweb's May 2026 read puts ChatGPT referral conversion at 7.1%, second only to paid search at 7.8% and ahead of organic, social and email. A visitor arriving from an AI answer arrives pre-qualified — the model already matched your tool to their task and answered their first three objections.

**The traffic exchange is lopsided, and that's fine for you.** Cloudflare's crawl-to-refer ratios (July 2025) ran to roughly 38,000:1 for Anthropic's crawlers, ~1,100:1 for OpenAI and ~195:1 for Perplexity, with around 80% of AI crawler activity being model training rather than answering a live question. Publishers who sell pageviews have a real grievance here. You don't sell pageviews: if a model ingests your docs ten thousand times to produce one well-timed "use X for this, here's the code" in a developer's editor, you got the good end of that trade.

**The ranking metaphor doesn't hold.** Citations churn — by the measure of the vendor selling the fix, up to 90% of sources cited in AI answers shift over time, and different models draw on largely distinct source sets. There is no stable position to hold, which is precisely why per-model rank tracking is the weakest thing to buy first.

## llms.txt: ship it, expect nothing

This one is settled enough to state plainly, because the two authorities finally agree from opposite directions.

Ahrefs checked all 137,210 domains in its Web Analytics that received traffic in May 2026. About 28% had shipped a valid `llms.txt` — remarkable adoption for an unofficial spec — but **97% of those files received zero requests**. Of requests that did arrive, 96% were bots, and the largest single category was SEO audit tools (21.7%), the industry checking its own homework; AI retrieval bots were 1.1%. AI bots made essentially no requests for files that *don't* exist, meaning they aren't probing for it.

Google then made the split official. Search Central's AI-features guidance states that sites don't need machine-readable files or Markdown mirrors to appear in Google Search including its AI features, "as Google Search itself doesn't use them" — so the file is not a ranking or visibility input. Meanwhile Chrome's Lighthouse added a default Agentic Browsing audit category (Chrome 150 or later) that checks for `llms.txt` and WebMCP as agent-readiness signals, deliberately unscored because the standards are still emerging.

That is retrieval versus ranking, made explicit by the one company that owns both a search index and a browser: nothing for the index, something still unmeasured for browser-borne agents. So ship it — an afternoon's cheap insurance, and its absence reads badly to the audit tools your prospects run — but expect nothing from it, and never let a checkbox file substitute for the docs work underneath. The file is the index; the content is the product.

## Measuring it without buying anything

The free check gets most of the signal and costs twenty minutes a month:

- Open three assistants and ask the **task-shaped** questions your buyers actually ask — "how do I add auth to a Next.js app", not "best auth provider". Record whether you appear, what's said about your pricing and limits, and whether it is *true*. Accuracy matters more than presence: a confident wrong answer about your free tier costs you more than absence does.
- Add an AI-referral segment in analytics and a free-text "how did you hear about us" field. Vercel's 10% figure came from exactly that kind of first-party attribution, not from a platform.
- Watch your own logs for retrieval bots. Which crawlers fetch which pages is a fact you own, and it tells you more than a rank tracker. The population is unstable enough that this check has to recur: Meta's own indexer went from roughly 2% to 37.8% of observed AI-crawler requests in under a month (Promptwatch, August 2026) — the single heaviest AI crawler in those logs, arriving almost from nowhere — so a robots policy or allowlist tuned to last year's bot names quietly goes stale.
- Buy tooling when the free check stops scaling — hundreds of pages, many surfaces, someone accountable for the number — not before.

## What earns citations, and what repels

The work that gets you quoted is mostly the work that serves human readers, which is the tell that it's durable:

- **Specific, quotable facts.** Concrete numbers, named limits and dated benchmarks are what a model can lift into an answer. Marketing adjectives are unquotable by construction.
- **One question per section.** Retrieval returns chunks, not pages. A section that only makes sense after reading the three above it is invisible to the reader that matters.
- **Verifiable claims over positioning language.** When the evaluator is a machine comparing three tools, published, checkable numbers beat superlatives.
- **Loud deprecation.** Machine readers make this a survival trait: an agent that receives a clean, versioned deprecation notice reroutes; an agent that hits a silent 404 tells its developer your product is broken.
- **Gating and client-side rendering repel.** Content behind a form or assembled by JavaScript is content the model cannot cite. This is the oldest lesson in the guide arriving through a new door.

## The honest caveat

This section describes a channel that is moving faster than the evidence about it. The lab result everyone quotes — visibility gains "up to 40%" from adding quotable statistics and citations — comes from an academic benchmark (Aggarwal et al., KDD 2024), not from the field, and the paper itself warns the effect varies widely by domain. Treat any vendor number about your own visibility as a hypothesis you test against your funnel. The reading-layer work is the part that pays regardless of how the rest of it resolves, because it is indistinguishable from doing your docs properly.
