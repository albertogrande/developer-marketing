---
show: Scaling DevTools
episode: Robby Russell on Oh My Zsh, Developer Experience, and Open Source
date: 2026-06-24
url: https://podcast.scalingdevtools.com/episodes/robby-russell
guests:
  - Robby Russell — creator of Oh My Zsh; Planet Argon
host: Jack Bridger
topics: [community, dx, distribution, positioning]
candidates: [practice]
distilled: 2026-08-01
---

## What it covers

The origin story of Oh My Zsh: a set of shell configs Robby Russell wanted to
share with a handful of colleagues, which grew into one of the most widely used
open-source developer tools. The useful material for a devtools marketer is not
the growth but the design decisions underneath it — who he chose as the litmus
test user, why installation piggybacked on Git, and how plugins were made
opt-in by default.

## Claims worth checking

- [17:44–18:44] His stated target user was the developer *uncomfortable* at the
  command line, not the power user — that persona was the litmus test for
  whether a change shipped. A design principle stated in retrospect, not a
  documented process.
- [11:35] He credits part of the spread to optimising around Git when Git was
  still new: you installed the tool with Git, which made the install familiar to
  exactly the audience already adopting it. Distribution riding an adjacent
  adoption wave.
- [19:04–19:37] Plugins were installed but not loaded by default, on the
  reasoning that users would not reliably navigate to a config directory. An
  activation-friction decision worth citing.
- [13:25] He reports the project trended persistently on GitHub under the Bash
  category. Recollection, not a figure to quote as data.
- [15:33] Apple switching its default shell from Bash to Zsh is named as a
  growth factor — that platform change is independently verifiable and worth
  confirming before use.
- [14:09] Merchandise has sold steadily for roughly twelve years at about an
  order a day. Self-reported, unaudited.

## Quotes

> "I never set out to think that this is gonna be a popular widely used tool. I
> literally wanted, like, eight..." — Robby Russell [00:00]

## Why it matters here

The strongest evidence in this episode is the persona choice, and it cuts
against how most devtools position: the litmus test was the *least* confident
user in the audience, not the most enthusiastic. That pairs directly with the
guide's argument in `01-positioning-for-developers` that "developers" is not one
persona.

Caveat for any use: this is a retrospective on a project that began around 2009,
told by its creator. Survivorship is doing heavy lifting — he says outright that
other projects of his did not spread and he cannot identify the ingredient.
Cite the design decisions, not the outcome.
