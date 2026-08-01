---
title: Cloudflare's dogfooding proof isn't that cdnjs runs on Workers — it's the limits it raised
date: 2026-08-01
summary: Cloudflare moved cdnjs — 9 billion requests a day — onto its own Developer Platform; the copyable part isn't the migration, it's the two public limits the exercise forced it to raise for every customer.
dek: Every vendor says it runs on its own stuff. The tell that it's true is when the dogfooding breaks something you then have to fix in public.
desk: campaigns
byline: Nico Ferrant
tags: [content, trust, dogfooding, cloudflare]
related:
  - label: Guide — Content that earns trust
    href: /guide/05-content-that-earns-trust
  - label: Guide — Positioning for developers
    href: /guide/01-positioning-for-developers
sources:
  - label: "Dogfooding at scale: migrating cdnjs to Cloudflare's Developer Platform (Cloudflare)"
    url: https://blog.cloudflare.com/cdnjs-dev-platform-migration/
  - label: Cloudflare Workers — Limits (subrequests per invocation)
    url: https://developers.cloudflare.com/workers/platform/limits/
---

Cloudflare rebuilt cdnjs — one of the internet's busiest open-source CDNs — entirely on its own Developer Platform, and then [wrote it up](https://blog.cloudflare.com/cdnjs-dev-platform-migration/). Read it as what it is: content marketing for Workers, R2, and the rest of the stack, published by the company that sells them. "We run our own busiest thing on our own product" is the oldest proof move in developer marketing, and every platform vendor makes some version of it. That claim, on its own, is worth almost nothing — of course you run on your own stuff.

The interesting part is what the exercise cost them, in public. That's the template.

## Reconstruct the mechanics

The migration itself is straightforward to state. cdnjs used to run on a hybrid of Google Cloud Functions, Cloud Storage, Pub/Sub, and a git-sync VM. As of 2026-06-23 it runs end to end on Cloudflare's own building blocks: R2 as the single source of truth for file content, KV for metadata, Workers and Workers Cache to serve, and Workflows, Queues, Durable Objects, and Containers to run the ingestion pipeline. Cloudflare says it now serves 108,000 requests per second — 9 billion a day — across 330-plus data centers at a 98.6% cache hit rate. Those figures are self-reported and unfalsifiable by a reader; treat them as the hook, not the evidence.

The evidence is two lines most write-ups would have buried. During the migration Cloudflare hit two of its *own* platform limits: 1,000 subrequests per Worker invocation, and 1,024 steps per Workflow. Instead of quietly engineering around them for one internal team, the Workers and Workflows teams raised the ceilings — and raised them for everyone. The subrequest limit is now a default of 10,000, configurable up to 10 million on paid plans; you can check that in the live [Workers limits docs](https://developers.cloudflare.com/workers/platform/limits/) right now, not just in the blog post. Workflow steps went from 1,024 to a default of 10,000, per Cloudflare's own account.

That's the whole move. Not "we run cdnjs on Workers" — anyone can assert that. It's "we ran cdnjs on Workers, it broke against two published limits, and here is the changelog where we fixed them for you too." The proof isn't the migration. It's the receipt the migration generated.

## Copy this

Dogfooding is only proof when it costs you something a reader can see. The play:

- **Pick your genuinely-busiest real workload, not a demo.** A 9-billion-request CDN is credible precisely because you can't fake the scale. A hello-world tutorial dressed as a case study is not dogfooding; it's a screenshot.
- **Name what broke.** The specific limits — 1,000 subrequests, 1,024 steps — are the honesty signal. A migration post with zero friction reads as fiction, because real systems at scale always hit an edge.
- **Turn the friction into a shipped, public fix.** The subrequest bump is a changelog line every customer can verify. That converts your internal war story into a product improvement other people can check — which is the difference between a brag and a proof.
- **Let the reader rerun the claim.** The traffic numbers you can't audit; the raised limit you can. Lead the trust on the part that's checkable, the way [HeimWall published a rerunnable benchmark](/guide/05-content-that-earns-trust) rather than a private one.

## Skip that

Don't confuse the vanity metrics with the proof. The 98.6% cache hit rate and 108k req/s are Cloudflare's own numbers about Cloudflare's own system; they're fine as color, but if the post rested on them it would be indistinguishable from every other "look how fast we are" post developers already discount.

And be honest about the easy version of this genre: dogfooding a product you built for exactly this job is not a stretch, and a reader knows it. Cloudflare migrating a CDN onto a CDN platform proves the platform is *adequate for its home turf* — useful, but not the same as proving it fits your workload. Borrow the structure, not the swagger: if your dogfooding didn't surface a single limit, a bug, or a fix you had to ship, you don't have a proof post. You have an ad.

There's no big Hacker News groundswell around this one, which fits the pattern — competent infrastructure work rarely trends. It doesn't need to. Flagging it for the swipe file as a dogfooding-as-proof template.

**What to watch:** whether the raised-a-limit-for-everyone move becomes the standard shape of the platform case study. If a second vendor frames its dogfooding around the ceilings it lifted rather than the throughput it hit, the floor for a credible "we run on our own stuff" post just moved — and the ones that skip the receipt will read, correctly, as marketing.
