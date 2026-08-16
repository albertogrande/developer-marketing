---
title: Structure docs so an AI assistant can retrieve them
when: Planning docs work, an information-architecture overhaul, or deciding whether to publish llms.txt.
do: Make "is this page retrievable by an LLM" a first-class docs review question — one section answers one question, golden path up top, descriptive link text — and publish an llms.txt as a curated index. Treat llms.txt as cheap insurance for the agent surface, never as SEO — Google is explicit that Search ignores it.
why: A growing share of your docs' readers are coding assistants and answer engines, and a developer's first impression is increasingly a machine's paraphrase of your content. Chunk-retrievable structure is what gets you cited — and it helps human readers for free. The llms.txt caveat is now measured and official — Ahrefs' June 2026 study of 137K domains found 97% of llms.txt files receive zero requests, and Google's AI-features guidance says Search itself does not use the file for ranking or AI features, while Chrome's Lighthouse audits its presence as an agent-readiness signal. Retrieval and ranking are separate layers; the file serves only the first.
section: 02-docs-as-front-door
tags: [docs, distribution, aeo]
since: 2026 — assistants and answer engines mediate developer discovery; Ahrefs (2026-06-15) measured llms.txt going almost entirely unread, and Google made the split official — ignored by Search, audited by Lighthouse's agentic-browsing category
verify: Ask a coding assistant a task-shaped question about your product and check whether it cites your docs correctly; re-check Google's AI-features guide and the Lighthouse agentic-browsing docs for whether either side of the split has moved.
status: current
checked: 2026-08-03
updated: 2026-08-03
sources:
  - label: 'Ahrefs — We analyzed 137K sites: 97% of llms.txt files never get read'
    url: https://ahrefs.com/blog/llmstxt-study/
  - label: Google Search Central — AI features optimization guide (llms.txt clarification)
    url: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  - label: Chrome for Developers — Lighthouse agentic browsing scoring
    url: https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring
  - label: Deep dive — GEO for devtools, when the reader is a model
    url: https://albertogrande.github.io/developer-marketing/deep-dives/2026-07-17-geo-for-devtools-when-the-reader-is-a-model
  - label: Mintlify — Real llms.txt examples from leading tech companies
    url: https://www.mintlify.com/blog/real-llms-txt-examples
---

The durable investment is the underlying content — accurate, well-structured, answering real questions — which compounds regardless of which indexing standard wins. Ship llms.txt as an afternoon's cheap insurance, but never let the checkbox file substitute for the docs work: today the checkbox is all it is.
