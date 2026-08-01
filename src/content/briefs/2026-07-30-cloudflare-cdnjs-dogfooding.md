---
title: cdnjs moves onto Cloudflare's own developer platform, and the write-up is the campaign
company: Cloudflare
date: 2026-07-30
kind: campaign
summary: 'Cloudflare published how it rebuilt cdnjs — 108,000 requests per second, 9 billion a day, a 98.6% cache hit rate — entirely on its own R2, Workers, Workflows, Queues and Durable Objects stack, replacing a fragmented GCP-Functions-and-VMs setup. The migration completed on 2026-06-23 and raised a public platform ceiling on the way: subrequests now go up to 10M on paid plans.'
tags: [content, dogfooding, cloudflare, trust]
source:
  label: "Cloudflare — Dogfooding at scale: migrating cdnjs to Cloudflare's Developer Platform"
  url: https://blog.cloudflare.com/cdnjs-dev-platform-migration/
related:
  - label: Guide — Content that earns trust
    href: /guide/05-content-that-earns-trust
---

The reason this works as marketing is the workload: a named, public, high-traffic service anyone can go measure, rather than a benchmark the vendor designed. "We found the platform's limits and raised them" is a more credible maturity claim than any feature page, because it concedes the limits existed.
