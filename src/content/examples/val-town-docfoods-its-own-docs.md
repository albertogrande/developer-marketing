---
title: Val Town rebuilds its docs on Val Town, and prices the trade
company: Val Town
date: 2026-08-17
summary: A dogfooding migration that names its own cost — the post ranks its priorities UX over AX over DX, prints the ~500ms cache-miss penalty next to the ~100ms edit loop it bought, and keeps llms.txt and Copy-as-markdown for the agent reader.
artifact: blog
channel: [blog, docs]
demonstrates: 05-content-that-earns-trust
tags: [dogfooding, docs, dx]
source:
  label: Val Town — Docfooding, Eating Our Own Documentation
  url: https://blog.val.town/docfooding
---

"We moved our docs onto our own platform" is a press release; this post is a
ledger. Val Town left Astro and Cloudflare for its own runtime — server-
rendered, no build step, edits live in about 100ms — and then names exactly
what that costs readers: markdown parsed on the server, CSS concatenated at
request time, uncached pages that can take ~500ms. The explicit UX > AX > DX
ranking admits the migration optimizes for the builder's feedback loop, and
invites the audience to argue. Copy the shape: if you dogfood in public,
publish the column of the ledger that runs against you — it is what makes the
other column readable as fact rather than marketing.
