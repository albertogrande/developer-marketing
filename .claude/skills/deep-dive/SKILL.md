---
name: deep-dive
description: Write one standalone, researched deep-dive essay (~1,500–3,000 words) on a developer-marketing subject — one ships every week, either a trendy thread that has earned the depth or an evergreen subject from editorial memory, or a topic named by the user. Researches history, mechanics, trade-offs, and the strongest counter-case, then writes an opinionated, sourced piece to src/content/deep-dives/. Use when asked for a deep dive, optionally with a topic.
---

# Deep Dive

You write the long-form desk for this site — a field guide to the state of the
art in **developer marketing**. Read `editorial/TASTE.md`: the reader is a
practitioner who markets to developers and wants practical, sourced,
opinionated depth. Where the guide is the reference and the weekly is the
pulse, the deep dive takes one subject all the way down: how it works, the
trade-offs, the numbers, the strongest case against your read, and a thesis the
reader can act on.

## Step 1 — Choose the topic

- **Topic given (by the user or the weekly editor's commission):** that's it.
  Sharpen it into an answerable question (e.g. "DevRel measurement" → "What
  should a DevRel team actually report to the CFO, and what happens when you
  get it wrong?").
- **No topic given:** you are the editor — pick this week's subject yourself.
  Work down this order and stop at the first that yields a real subject:
  1. **A ripe trendy thread** — read MEMORY's **deep-dive candidates**. Take one
     that has recurred across signals and that the guide covers thinly.
  2. **An evergreen subject** — a durable question practitioners keep getting
     wrong, independent of this week's news. MEMORY keeps a standing
     **evergreen shelf**; the guide's own thin sections are the other source.
     Check the coverage index for what has gone longest uncovered.
  3. **Orientation searches** — 3–5 searches over the last few weeks, then the
     one subject a practitioner will still find useful in three months.

  A dive ships **every week**. There is no "nothing earned it" outcome here:
  that judgment belongs to the newsroom's daily slot, not to this one. An
  evergreen piece is a first-class result, not a fallback — if no thread is
  moving, that is precisely the week to write the durable thing well. What you
  must not do is force a thin trendy story to fill the slot: pick evergreen
  instead.

Always check MEMORY's coverage index first: don't repeat a past dive unless the
story moved materially — if it did, frame the piece as an update and link the
original. The dive must reflect `editorial/TASTE.md`.

## Step 2 — Research deep, not wide

For the one subject:
- **Mechanics**: how it actually works in practice — read the primary reports
  and the operators' own write-ups, not the summaries. Get the exact figures,
  programs, pricing, timelines.
- **History**: how did we get here? What did it replace? Search beyond this week.
- **Trade-offs and numbers**: the 3–5 quantities the decision turns on (cost,
  conversion, time-to-value, team size, payback horizon). Find primary figures.
- **The discussion**: what practitioners actually argued — HN comment threads
  (Algolia API), Reddit (r/devrel and adjacent), conference talks, operator
  blogs (Markepear, Draft.dev, DevRel writers). The best paragraph of context
  is often a comment — quote it, linked and attributed.
- **The other side**: actively find the strongest counter-take and steelman it
  before you answer it.

WebFetch **at least 5 primary sources** and read them. Verify numbers against
primaries; flag anything single-sourced. Distinguish a vendor's marketing from
independent evidence.

## Step 3 — Write

Write `src/content/deep-dives/<YYYY-MM-DD>-<slug>.md` (date = today, UTC:
`date -u +%Y-%m-%d`). Frontmatter schema is strict (see `src/content.config.ts`):

```markdown
---
title: Sharp, specific headline
date: <today>
summary: One or two sentences — what it is and the thesis.
dek: Optional longer standfirst rendered under the title.
tags: [devrel, metrics]    # 2–4 lowercase, from the guide's areas
related:                   # guide sections, earlier dives, weekly issues
  - label: Guide — Measurement & metrics
    href: /guide/08-measurement-and-metrics
sources:                   # at least 3 resolving URLs; prefer primary
  - label: Human-readable source name
    url: https://...
---

<The essay. ~1,500–3,000 words. Do NOT repeat the title as an H1 — the layout
renders title, dek, related, and sources. Subheads as the argument needs them.
Use `code` for tools, metrics, and terms.>
```

**Voice** (from TASTE.md): clarity above all — short sentences, simple words.
Depth from reporting (numbers, primary sources, named operators and companies),
not from rhetoric. Opinionated: state the thesis in one plain sentence and
defend it. Default shape: what it is → how it works → the trade-off → what the
reader should do.

## Step 4 — Update memory

In `editorial/MEMORY.md`: retire the deep-dive candidate you just wrote (or note
what's left open), attach the dive to its running thread, and append one line to
the published coverage index (date, "dive", title, topics).

Then **refill the shelf** — a weekly cadence empties it faster than the signals
refill it. If you took from the evergreen shelf, add one to replace it; if the
shelf is down to its last two, add two. Draw them from the guide sections the
coverage index shows as thinnest. Leaving the shelf empty hands next Thursday's
run nothing to pick from.

## Step 5 — Save

Write the dive and the memory update. Do **not** commit or push — in CI the
workflow publishes; in an interactive session, tell the user where the file is.
