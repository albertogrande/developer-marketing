---
title: HeimWall publishes the noise next to the signal
company: HeimWall
date: 2026-07-27
summary: A vendor benchmark that prints its own false-positive breakdown — 1.12% alert rate, 48% of alerts from one noisy rule, a middling F1 it admits to — on a public dataset anyone can rerun, making the headline finding believable instead of dismissible.
artifact: blog
channel: [blog]
demonstrates: 05-content-that-earns-trust
tags: [content, benchmarks, trust, security]
source:
  label: HeimWall — We scanned 27,075 developer prompts to ChatGPT
  url: https://heimwall.ai/blog/we-scanned-27075-developer-prompts
sources:
  - label: The Week — the security benchmark that published its own false-positive rate
    url: https://albertogrande.github.io/developer-marketing/articles/2026-07-21-honest-benchmark-noise
---

The headline find is real (three live-format API keys in 27,075 public ChatGPT prompts from the DevGPT dataset), but the tactic is everything around it: the post prints the 1.12% alert rate, admits 48% of alerts came from a single noisy UUID rule, discloses a CredData F1 of 0.449 that beats no one's marketing copy, and names the limitations it can't measure. Developers read vendor benchmarks looking for what's hidden; publishing the noise first removes the thing they'd have dunked on and turns the comment thread into a methods discussion. The whole play is reproducible — the dataset is public — which is what separates it from a claim.
