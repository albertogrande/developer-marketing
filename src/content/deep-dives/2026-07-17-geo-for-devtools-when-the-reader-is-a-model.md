---
title: 'GEO for devtools: what to do when the reader is a model'
date: 2026-07-17
summary: Machine-mediated discovery is real — Vercel gets 10% of signups from ChatGPT — but most of what's sold as GEO is ritual. The work that pays is docs and API surfaces you should want anyway.
dek: A $1B monitoring unicorn, a file 97% of crawlers never read, and a registrar that lets an agent buy a domain — the machine-reader thread finally has enough evidence to sort into "do now," "design for," and "don't buy yet."
tags: [docs, channels, distribution]
related:
  - label: Guide — Docs as the front door
    href: /guide/02-docs-as-front-door
  - label: Guide — Channels & distribution
    href: /guide/06-channels-and-distribution
  - label: 'The Week, 2026-W28 — The agent reading your docs is starting to shop'
    href: /weekly/2026-W28
  - label: Radar — AI assistants are reading your docs
    href: /radar/2026-07-07-ai-assistants-are-reading-your-docs
sources:
  - label: 'GEO: Generative Engine Optimization (Aggarwal et al., KDD 2024)'
    url: https://arxiv.org/abs/2311.09735
  - label: The llms.txt proposal (Jeremy Howard, September 2024)
    url: https://llmstxt.org/
  - label: 'Ahrefs — We analyzed 137K sites: 97% of llms.txt files never get read (June 2026)'
    url: https://ahrefs.com/blog/llmstxt-study/
  - label: Search Engine Journal — Google says llms.txt is purely speculative for now (June 2026)
    url: https://www.searchenginejournal.com/google-says-llms-txt-is-purely-speculative-for-now/577576/
  - label: Search Engine Journal — Google's llms.txt guidance depends on which product you ask (2025)
    url: https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask/575431/
  - label: Cloudflare — The crawl before the fall of referrals (July 2025)
    url: https://blog.cloudflare.com/ai-search-crawl-refer-ratio-on-radar/
  - label: 'Cloudflare — The crawl-to-click gap: AI bots, training, and referrals (August 2025)'
    url: https://blog.cloudflare.com/crawlers-click-ai-bots-training/
  - label: Guillermo Rauch — ChatGPT now refers 10% of new Vercel signups (April 2025)
    url: https://x.com/rauchg/status/1910093634445422639
  - label: Guillermo Rauch — ChatGPT referred under 1% of Vercel signups six months earlier (February 2025)
    url: https://x.com/rauchg/status/1898122330653835656
  - label: Similarweb — Gen AI stats and AI visibility trends (May 2026)
    url: https://www.similarweb.com/blog/marketing/geo/gen-ai-stats/
  - label: Fortune — Profound raises $96M at a $1B valuation (February 2026)
    url: https://fortune.com/2026/02/24/exclusive-as-ai-threatens-search-profound-raises-96-million-to-help-brands-stay-visible/
  - label: GoDaddy — Introducing the GoDaddy Developer Platform (July 2026)
    url: https://www.godaddy.com/resources/news/introducing-the-godaddy-developer-platform-domain-apis-for-developers-and-their-agents
  - label: OpenBenchmarks — verified benchmarks for agents
    url: https://openbenchmarks.com
  - label: Crawlie — SEO and GEO monitoring with an MCP endpoint
    url: https://www.crawlie.co/
  - label: 'Ian Paterson — Free LLM API Tiers in 2026: Groq, Cerebras, Mistral & More'
    url: https://ianlpaterson.com/blog/free-llm-api-2026/
---

A developer's first impression of your product is increasingly a paraphrase. A coding assistant summarizes your docs inside the editor. An answer engine compares you to two competitors in a chat window. And as of this month, an agent can go further than reading: GoDaddy's new developer platform is built so an agent can quote, register, and pay for a domain end to end. The reader of your marketing is, more and more often, a model.

An industry has formed around this fact almost overnight, and it has a name — `GEO`, generative engine optimization — a venture-funded tooling category, and a growing pile of rituals. It also has a loud counter-camp that says the whole thing is repackaged SEO snake oil, and the counter-camp is holding some genuinely damning data.

Both camps are right about different layers. The thesis of this piece: **machine-mediated discovery is a real channel with real conversion numbers, but almost everything sold under the GEO label is either premature or free — the durable work is making your docs and API surfaces machine-legible, which is work you should want anyway.** Sorting the layers is the whole job. So let's sort them.

## How we got here

The term is younger than it feels. "Generative Engine Optimization" comes from a Princeton-led paper ([Aggarwal et al., KDD 2024](https://arxiv.org/abs/2311.09735), first posted November 2023) that asked whether content changes could improve a source's visibility in AI-generated answers. The headline finding — visibility gains "up to 40%" from tactics like adding quotable statistics and citations — is the number every GEO vendor deck has cited since. Keep its context: it was measured on `GEO-bench`, a research benchmark, and the paper itself warns the effect varies widely by domain. It is a lab result, not a field result.

The second artifact arrived in September 2024, when Jeremy Howard of Answer.AI proposed [llms.txt](https://llmstxt.org/): a curated markdown index at your site root, pitched as a way to hand context-window-limited models "brief background information, guidance, and links to detailed markdown files." It cost an afternoon to ship, so devtool companies shipped it in droves — Anthropic, Stripe, Cursor, and thousands more.

Then the money arrived. [Profound](https://fortune.com/2026/02/24/exclusive-as-ai-threatens-search-profound-raises-96-million-to-help-brands-stay-visible/), a platform that monitors how brands appear in AI answers, raised a $35M Series B led by Sequoia in August 2025 and a $96M Series C at a $1B valuation in February 2026 — 700+ enterprise customers, including MongoDB and Figma, about 18 months after launch. At the other end of the market, this month's Show HN pages carried [Crawlie](https://www.crawlie.co/) ($19/month, GEO checks plus an MCP endpoint so your agent can run the audit) and [OpenBenchmarks](https://openbenchmarks.com) (externally verified API benchmarks served to agents over an unauthenticated REST API and OpenAPI docs, plus an OAuth-gated MCP endpoint). A category that did not exist two years ago now spans from a unicorn to weekend projects.

That is the hype side of the ledger. The evidence side is messier, and more interesting.

## What the skeptics can prove

Steelman the counter-case properly, because parts of it are airtight.

**Nobody reads llms.txt.** In June 2026, Ahrefs' Louise Linehan and Xibeijia Guan [checked all 137,210 domains](https://ahrefs.com/blog/llmstxt-study/) in Ahrefs Web Analytics that received traffic in May. About 28% had shipped a valid llms.txt — remarkable adoption for a two-year-old unofficial spec. But **97% of those files received zero requests** in the study period. Of the requests that did arrive, 96% were bots, and the biggest requester category was SEO audit tools (21.7%) — the industry checking its own homework. AI retrieval bots, the ones that would actually put you in an answer, were 1.1%. Most damning: AI bots made essentially zero requests for llms.txt files that *don't* exist, meaning they aren't even probing for it. Google's John Mueller said the quiet part in June: ["it's purely speculative for now — the file has existed for years, yet none of the AI systems use it."](https://www.searchenginejournal.com/google-says-llms-txt-is-purely-speculative-for-now/577576/) That echoes what [Gary Illyes told a Search Central Live audience in 2025](https://www.searchenginejournal.com/googles-llms-txt-guidance-depends-on-which-product-you-ask/575431/): Google isn't pursuing llms.txt. The caveat this desk attached a week ago — "no major provider has confirmed reading it" — turns out to have been generous.

**The traffic exchange is brutally lopsided.** Cloudflare's Radar data made the crawl-to-refer ratio a public metric in 2025: for every HTML page visit an AI platform referred back, [Anthropic's crawlers requested roughly 38,000 pages as of July 2025](https://blog.cloudflare.com/crawlers-click-ai-bots-training/) (down from an eye-watering 286,930:1 in January), OpenAI about 1,100:1, Perplexity about 195:1 — orders of magnitude from classic search economics, and trending in different directions by platform (Anthropic's ratio fell sharply from January to July 2025; Perplexity's roughly quadrupled over the same span). (Secondhand write-ups claim a specific, much-lower Claude ratio for May 2026; none traces to a source solid enough to print here, so treat any number more recent than Cloudflare's own August 2025 post as unverified.) And roughly 80% of AI crawler activity is model training, not answering a live user's question. If you expected AI platforms to replace the search traffic they're eroding, the data says no.

**The measurement target moves.** Profound's own research — note the source: the vendor selling the fix — finds that [up to 90% of the sources cited in AI answers can shift over time](https://fortune.com/2026/02/24/exclusive-as-ai-threatens-search-profound-raises-96-million-to-help-brands-stay-visible/), and different models draw on largely distinct source sets. Whatever "ranking" you buy a dashboard to track is churning under you, per-model.

So: the flagship GEO artifact is unread, the traffic subsidy is a rounding error, and the metric is a moving target. Case closed?

## What the skeptics can't explain away

No. Because the refutation targets the rituals, and the channel is not the rituals.

The cleanest devtool number belongs to Vercel. In April 2025, CEO Guillermo Rauch reported that [ChatGPT referred 10% of new Vercel signups](https://x.com/rauchg/status/1910093634445422639), up from [under 1% roughly six months earlier](https://x.com/rauchg/status/1898122330653835656) — his own attribution, on his own funnel. The mechanics behind it were mundane: Vercel made sure docs rendered as static HTML rather than client-side JavaScript, and structured content so a model could retrieve a clean answer to a task-shaped question. No llms.txt magic — plumbing.

Quality data points the same direction. Similarweb's May 2026 read puts [ChatGPT referral conversion at 7.1%](https://www.similarweb.com/blog/marketing/geo/gen-ai-stats/) — second only to paid search at 7.8%, ahead of organic search, social, and email. AI referral *volume* is still small next to search, but it more than tripled between September 2024 and September 2025, and when ChatGPT made brand links clickable on May 7, 2026, pages per visit rose 24% and homepage referrals jumped to roughly 60% of its traffic — behavior that looks like *discovery*, not lookup. A visitor who arrives from an AI answer arrives pre-qualified: the model already matched your tool to their task and answered their first three objections.

The crawl-to-refer ratio, read again with marketer's eyes rather than publisher's eyes, isn't even bad news for you. A devtool company is not a news site; you don't sell pageviews. If a model ingests your docs ten thousand times to produce one perfectly-timed "use X for this, here's the code" in a developer's editor, you got the good end of that trade. The publishers subsidizing AI platforms with content have a real grievance. You have a distribution channel with a strange billing model.

And the selection layer — agents not just reading about your product but transacting with it — stopped being hypothetical this month. [GoDaddy's Developer Platform](https://www.godaddy.com/resources/news/introducing-the-godaddy-developer-platform-domain-apis-for-developers-and-their-agents) (July 14) ships docs as markdown, a consolidated `llms-full.txt`, and OpenAPI — the quickstart literally opens with "hand `domains-v3.json` to your LLM as context." Then it goes further than docs: a quote-then-execute purchase flow returns a short-expiry `quoteToken` at an exact price so an agent can't be surprise-billed; registration requires idempotency keys so a retry can't double-buy; consent objects record what was agreed and when; scoped tokens let an agent search domains without ever holding purchase permission. That is a marketing surface *and* a safety spec, and it's the most copyable artifact this thread has produced. OpenBenchmarks — six points on HN, but aimed squarely at agents making build-vs-buy calls — is the same bet from the other side: when the evaluator is a machine, verified numbers in machine-readable formats are the pitch.

## The three layers, and what each is worth

Everything above sorts into three layers with very different risk profiles.

**The reading layer — real, cheap, act now.** Models already mediate first impressions; the Vercel case proves the funnel exists and your own analytics can prove your share of it. The work is unglamorous: serve docs as static HTML; make one section answer one question so a chunk retrieved alone still makes sense; put real numbers — pricing, limits, latency — on ungated pages where a model can quote them instead of guessing; publish OpenAPI for the reference; and check your `robots.txt` isn't blocking *retrieval* bots while you deliberate about *training* bots (Cloudflare's purpose breakdown shows those are different populations — you can decide the training question separately without silencing yourself in answers). Mueller's one non-speculative recommendation points here too: the optimization that matters most is not blocking the agents. Note what this list is: docs quality, honest pricing pages, accurate references. The machine reader raises the price of things developer marketing was already supposed to do.

**The selection layer — early, design for it if you sell an API.** No one can show you conversion data on agent-initiated purchases yet; GoDaddy's platform is days old and OpenBenchmarks is a seedling. But the GoDaddy pattern — machine-readable everything, quote-then-execute, idempotency, scoped consent — is worth adopting *now* if agents plausibly transact with your product, because every element doubles as good API design for humans. This is DX engineering wearing a marketing hat. It also carries this thread's cautionary tale: weeks before GoDaddy launched, [a developer wrote up Cerebras quietly pruning its free-tier model catalog](https://ianlpaterson.com/blog/free-llm-api-2026/), breaking a hardcoded integration with a silent 404 instead of a deprecation notice. An agent that gets a clean, versioned deprecation notice reroutes; an agent that hits a silent 404 tells its developer your product is broken. Machine readers make loud deprecation a survival trait.

**The measurement layer — forming, mostly don't buy yet.** The $155M invested in Profound says enterprises will pay to know how AI describes them, and at Fortune-500 scale, with hundreds of SKUs across ten AI surfaces, a dashboard may genuinely earn its keep. For a typical devtool company the honest math is different: citations churn up to 90%, each model reads different sources, and the free check gets you most of the signal — open three assistants, ask the task-shaped questions your buyers ask ("how do I add auth to a Next.js app," not "best auth provider"), and record whether you appear, what's said about your pricing, and whether it's *true*. Do it monthly; it costs twenty minutes. Add an `ai-referral` segment in analytics and a free-text "how did you hear about us" field — Rauch's 10% figure came from exactly that kind of first-party attribution, not from a GEO platform. Buy tooling when the free check stops scaling, not before.

And llms.txt? Ship it — it's an afternoon, it's cheap insurance if any provider ever flips it on, and its absence would be the wrong signal to the 21.7% of requesters that are audit tools your prospects might run. But the Ahrefs data closes the argument: expect nothing from it, and never let a checkbox file substitute for the underlying docs work, because today the checkbox is all it is.

## The falsifiable version

The W28 issue of The Week made a call worth repeating with a date on it: by end of Q3 2026, at least one devtool company beyond Vercel publicly reports meaningful signups or API-key activations attributed to AI referral, with a number attached. The base rates say it should happen — conversion at 7.1%, volume tripling year over year. If nobody can produce that number by October, then the GEO category is running ahead of its market, and the reading-layer work — which pays for itself in human-legible docs regardless — remains the only part of this story you should fund.

That's the state of the art in one sentence: **treat the model as your most literal-minded reader — feed it clean structure and true numbers, design your API so its agents can transact safely, measure with the free checks, and keep your wallet closed until the dashboards can prove they know something your own funnel doesn't.**
