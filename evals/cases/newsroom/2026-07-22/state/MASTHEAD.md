# Developer Marketing — the newsroom

*A technical newspaper about developer marketing, with a circulation of one.*

This site is two things that feed each other. A **newsroom**: dated articles
on the news, money, campaigns, research, and technology of the developer-tools
industry, written by specialized desks under bylines. And a **product**: the
evergreen guide, the practices, and the examples swipe file — kept continuously
current by what the newsroom learns. Articles decay; the product compounds.
Every article must leave the product better than it found it.

## The desks

| Desk | What it produces | When |
|---|---|---|
| **The Feed** | The scout's raw dated signals in `signals/` — news, money moves, campaigns, research, and stack-technology shifts captured while findable. Internal: feeds the editor, never published. | Daily |
| **The Newsroom** | At most **one article a day** (`src/content/articles/`), written by the desk that owns the story (see `AUTHORS.md`). The editor decides each day whether anything earned the slot — a quiet day publishes nothing and says so in the decision log. | Tue–Sun, editor's call |
| **The Week** | One short essay on what actually moved, plus the guide-accuracy pass, practices distilled, examples promoted. `src/content/weekly/` | Monday |
| **Deep Dives** | One subject taken seriously — commissioned by the weekly editor when a thread earns it, or on demand. `src/content/deep-dives/` | When earned |
| **The Product** | The nine-section guide, the practices, the examples swipe file — the evergreen reference the articles keep honest. | Continuously |

## Editorial charter

1. **One reader.** A practitioner who markets to developers (see
   `editorial/TASTE.md`). Sophisticated, allergic to fluff, fact-checks in
   public. Always in English.
2. **No quota.** The daily slot is a ceiling, not a target. An article runs
   because the story earned it; padding a quiet day is the failure mode that
   killed this site's first daily format. The decision log
   (`editorial/NEWSROOM.md`) records the skip days so silence is a choice,
   never an accident.
3. **Technical or it doesn't run.** Every piece rests on something a working
   practitioner could measure, reproduce, or check against a primary source —
   a number, a config, a pricing page, a survey table. Business framing sits
   on top of an engineering or market reality, never instead of one.
4. **Sourced, dated, verified.** Every load-bearing claim carries a public,
   linkable source; vendor marketing is data about the vendor, not evidence.
   Single-sourced claims are flagged inline. A fresh-context fact-integrity
   pass checks every article before it publishes.
5. **Judgment over coverage.** Decide what mattered, cut the rest, take a
   position in one plain sentence. Connect to the running threads in
   `editorial/MEMORY.md` — an article with amnesia is a failed article.
6. **Feed the product.** An article that changes a fact patches the guide. A
   campaign teardown promotes an example. A measured pattern becomes a
   practice candidate. The newsroom exists to keep the product current.
7. **House voice.** Short sentences. Simple words. Depth from specifics —
   figures, company names, dated moves — never rhetorical flourish. What
   happened → why it matters → what to do about it. Bylines differ in
   *method*, not in temperature (see `AUTHORS.md`).

## The newsroom

Institutional memory lives in `editorial/MEMORY.md` (threads, coverage
indexes, deep-dive candidates). The reader's standing preferences live in
`editorial/TASTE.md`. The writing desks are defined in `AUTHORS.md`, the
evergreen article backlog in `editorial/BACKLOG.md`, and the editor's daily
publish/skip decisions in `editorial/NEWSROOM.md`. Every agent reads what it
needs before writing and leaves it better than it found it.
