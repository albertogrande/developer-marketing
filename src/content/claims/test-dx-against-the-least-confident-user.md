---
title: Test DX decisions against your least confident user, not your power user
when: Choosing the litmus-test persona for onboarding, defaults, and install-path decisions in a developer tool.
do: Pick the least confident developer in your real audience — the one uncomfortable at the command line, unwilling to edit a config directory — and gate ship/no-ship decisions on whether the change works for them. Ride an install path they already trust rather than introducing your own.
why: This is Robby Russell's attributed account of Oh My Zsh's design (Scaling DevTools, June 2026), not a measured result — but it cuts against the default devtools instinct of designing for the enthusiast. He credits the spread to exactly these calls - the target user was the developer *uncomfortable* in the terminal, installation piggybacked on Git just as Git adoption was rising, and plugins shipped installed but not loaded because users wouldn't reliably navigate to a config directory. He is equally clear his other projects didn't spread and he can't name the missing ingredient, so cite the design decisions, not the outcome.
section: 01-positioning-for-developers
tags: [positioning, dx, activation]
since: "Scaling DevTools episode with Robby Russell (2026-06-24) — the design-decision account, stated in retrospect"
verify: The claims are anecdotal and retrospective; treat as a named practitioner's position. Re-check against any measured activation data comparing default-on vs. opt-in configuration for developer tools.
status: current
checked: 2026-08-03
updated: 2026-08-03
sources:
  - label: Scaling DevTools — Robby Russell on Oh My Zsh, Developer Experience, and Open Source
    url: https://podcast.scalingdevtools.com/episodes/robby-russell
---

The transferable unit is the litmus test, not the nostalgia: "developers" is never one persona, and the member of your audience with the least patience for friction is the honest gate. A bare model will tell you to reduce friction; the dated, attributed part is that one of the most widely adopted developer tools was explicitly built by testing against the least confident user while its category competitors courted power users.
