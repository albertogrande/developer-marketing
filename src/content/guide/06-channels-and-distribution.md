---
title: Channels & distribution
order: 6
summary: Where developers actually pay attention, which channels reach them and which repel them, and why earned beats paid for a technical audience.
updated: 2026-08-10
---

Developers are reachable, but not through the channels most marketing playbooks assume. They block ads, ignore cold email, and distrust anything that feels like a funnel. They *do* pay attention to peers, to genuinely useful content, and to being where the work happens. Distribution for developers is mostly about earning attention, not buying it.

## Where developers are

- **Search.** The default entry point. Developers search by task and land on docs, tutorials, and Q&A. Owning task-intent search is the most durable channel you have.
- **Peer networks & word of mouth.** The strongest force in developer adoption. Tools spread developer-to-developer and team-to-team. Everything that increases the odds a happy developer tells another is distribution.
- **Community platforms.** GitHub, Stack Overflow, Reddit (r/programming and niche subs), Hacker News, Lobsters, Discord/Slack communities, and increasingly Bluesky and Mastodon for technical discussion. Presence means participating, not posting brochures.
- **Content platforms.** Dev.to, Hashnode, personal blogs, YouTube (long-form tutorials and conference talks), and technical newsletters.
- **Events.** Conferences, meetups, hackathons, and workshops — high cost, high trust, best for depth and relationships rather than reach.
- **Open source.** A useful open-source project is a distribution channel: it earns stars, contributors, and top-of-mind presence with exactly the right people.
- **AI assistants & answer engines.** A growing share of first impressions are machine-mediated: a coding assistant or answer engine paraphrases your docs — and, increasingly, compares you against alternatives when a developer (or their agent) is choosing a tool. You can't buy presence here; you earn it with retrievable docs, machine-readable surfaces (llms.txt, OpenAPI, an MCP server), and specific, quotable facts. Building an MCP server and *distributing* it are two jobs: the vendor directories (Anthropic's Connectors Directory, OpenAI's) are curated, reviewed channels with app-store-grade vetting and no published review SLA, so treat submission like an App Store review — annotate every tool, ship a complete privacy policy, prepare a populated reviewer test account — and never make one directory your only path to users; publish your own install instructions and connect URL so the launch doesn't wait on the queue. The queue risk is documented, not hypothetical: one integrator's dated timeline (August 2026) shows a submission held four months in Anthropic's review queue and then discarded with instructions to resubmit, while OpenAI approved the same connector in 29 days — the spread between channels is that wide, and it's invisible until you're in it. Treat the search index and the agent as separate layers: Google's AI-features guidance is explicit that Search itself does not use llms.txt for ranking or AI features, while Chrome's Lighthouse audits the same file as an agent-readiness signal — the file serves agents, not SEO. Measurement of this channel is still immature — the honest check is asking assistants task-shaped questions in your category and seeing whether, and how accurately, you appear.

## Earned beats paid

For most developer products the ranking is: **earned > owned > paid.**

- **Earned** — a developer's blog post, a HN front page, a conference talk, a GitHub trending spot, a peer recommendation. Highest trust, hardest to manufacture, worth the most.
- **Owned** — your docs, blog, community, newsletter, and open-source repos. The compounding base you fully control.
- **Paid** — sponsorships (newsletters, podcasts, conferences, OSS) tend to outperform display/programmatic, because they borrow trusted context. Straight ads to developers are usually a poor return.

## Channels that repel

- **Interruptive ads and pop-ups** on technical content.
- **Cold sales outreach** to individual developers, especially "I noticed you use X" spam.
- **Gating everything** behind forms — it shrinks reach far more than it grows pipeline.
- **Astroturfing.** Fake community engagement, undisclosed shilling, or planted reviews. If discovered — and it usually is — the reputational cost dwarfs any short-term gain.

## Pick few, go deep

You cannot be excellent everywhere. Concentrate on the two or three channels where your specific developers actually are, and earn a real presence there, rather than spreading thin across every platform. Depth builds the trust that breadth can't.
