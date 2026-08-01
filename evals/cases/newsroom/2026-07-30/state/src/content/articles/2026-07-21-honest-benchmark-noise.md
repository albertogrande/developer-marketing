---
title: The security benchmark that published its own false-positive rate
date: 2026-07-21
summary: HeimWall's secret-scan post ran on a public dataset anyone can rerun, showed which rule produced half its alerts, and printed its own mediocre benchmark scores — a copyable template for content that survives a developer's fact-check.
dek: A vendor found three live API keys in developer prompts. The copyable part is everything it published next to that number.
desk: campaigns
byline: Nico Ferrant
tags: [content, benchmarks, trust, security]
related:
  - label: Guide — Content that earns trust
    href: /guide/05-content-that-earns-trust
  - label: Guide — Positioning for developers
    href: /guide/01-positioning-for-developers
sources:
  - label: We scanned 27,075 real developer prompts to ChatGPT and found 3 live API keys (HeimWall)
    url: https://heimwall.ai/blog/we-scanned-27075-developer-prompts
  - label: DevGPT — Studying Developer-ChatGPT Conversations (MSR 2024 Mining Challenge, arXiv 2309.03914)
    url: https://arxiv.org/abs/2309.03914
  - label: CredData — credential-detection benchmark (Samsung)
    url: https://github.com/Samsung/CredData
---

HeimWall sells a tool that watches for secrets and PII leaking into Cursor, Claude Code, and Copilot. So its new post — [*We scanned 27,075 real developer prompts to ChatGPT and found 3 live API keys*](https://heimwall.ai/blog/we-scanned-27075-developer-prompts) — is vendor content marketing, and you should read it as data about the vendor, not as independent research. The headline finding is exactly what its product exists to catch. That is the least interesting thing about it.

The interesting thing is what HeimWall printed underneath the headline. Most security-scan content stops at the scary number. This one kept going, and the way it kept going is the template.

## Reconstruct the mechanics

Start with the data. The 27,075 prompts are not live ChatGPT traffic HeimWall somehow intercepted — they are the [DevGPT dataset](https://arxiv.org/abs/2309.03914), a public academic corpus of real developer-ChatGPT conversations released for the 2024 Mining Software Repositories challenge, captured from GitHub and Hacker News in 2023. That choice matters. A skeptic can download the same dataset, point their own scanner at it, and check whether HeimWall's numbers hold. The benchmark is reproducible by construction. Most "we scanned X and found Y" posts run on private traffic you have to take on faith; this one runs on data you can pull yourself.

Then the findings, stated with denominators. Three live-format API keys (two OpenAI `sk-...`, one Google `AIzaSy...`) and 49 real email addresses, out of 27,075 prompts — a 1.12% alert rate (303 flagged), of which 0.041% were critical. HeimWall notes the keys have sat in a public 2023 dataset for two years and should be assumed long since revoked. No breathless "your secrets are leaking right now." A rate, a date, a caveat.

The move that earns the byline is the noise section. HeimWall published its false positives, by rule:

| Rule | Fired on | Verdict |
|---|---|---|
| `SECRET_UUID` | 146 prompts — 48% of all alerts | Mostly database and request IDs. False positives. |
| `PII_CREDIT_CARD` | 55 prompts (0.203%) | All false positives — timestamps and hashes that pass a Luhn check. |

Nearly half of everything the scanner flagged came from one over-eager UUID rule. A vendor is telling you, in a marketing post, that its own detector is noisy and exactly where. It goes further and prints its scores on two public benchmarks: 0.573 precision and 0.369 recall — an F1 of 0.449 — on Samsung's [CredData](https://github.com/Samsung/CredData) credential set, and an 81.5% removal rate on a Gretel PII benchmark. An F1 under 0.5 is not a number a marketing team volunteers. HeimWall put it in the post and drew the line itself: *"A benchmark readout that skips the noise analysis is marketing."*

## Copy this

The play is not "scan something and post the finding." Every security vendor does that, and developers have learned to discount it on sight. The play is **publish the noise next to the signal**:

- **Run on data your reader can rerun.** A public dataset turns a claim into an experiment. Reproducibility is the proof; the scary number is just the hook.
- **Give every count a denominator and a date.** "Three keys" is marketing. "Three keys in 27,075 prompts from a 2023 corpus, assume revoked" is a measurement.
- **Show which rule produced your false positives.** Admitting that one UUID rule caused 48% of your alerts reads as competence, not weakness — it says you actually looked.
- **Print the benchmark you'd rather hide.** An honest F1 of 0.449 buys more trust than a cherry-picked 0.95, because the reader knows which one they can believe.

This is the verification-first pattern the [guide's content section](/guide/05-content-that-earns-trust) argues for, made concrete: developers fact-check in public, so the content that survives is the content built to be checked. Flagging this one for the swipe file as a runnable honest-benchmark template.

## Skip that

One thing not to copy: the framing gap. "We scanned 27,075 real developer prompts to ChatGPT" reads, at a glance, like HeimWall is watching live conversations — the exact anxiety its product sells against. The prompts are an archival public dataset, and you only learn that a few paragraphs in. The post earns its trust back with everything it discloses, but the hook leans harder than the method supports. If you borrow the structure, close that gap in the first line, not the fifth: the honesty of the body is worth more when the headline doesn't spend it.

There is no Hacker News groundswell around this post, which fits the wider pattern — verification-first content rarely goes viral. It just quietly refuses to be dismissed. For a developer audience, that is usually the better trade.

**What to watch:** whether the honest-benchmark table becomes a genre. If a second and third security vendor start publishing their false-positive rates because the first one got credit for it, the floor for "credible benchmark" just moved — and the posts that skip the noise section will read, correctly, as marketing.
