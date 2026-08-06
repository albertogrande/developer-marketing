# The Beat — the masthead

*A technical publication about developer marketing, with a circulation of one.*

This site is two things that feed each other. A **stream**: the wire's dated,
sourced events and one weekly issue that says what they meant. And a
**reference**: the evergreen guide with its claims, examples, skills and
directory — kept continuously current by what the stream learns. Stream
pieces decay; the reference compounds. Every issue must leave the reference
better than it found it.

## The two writers

| Writer | What it produces | When |
|---|---|---|
| **The Scout** | Raw dated signals in `signals/` (internal), qualifying events promoted to **the wire** (`src/content/wire/` — one company, two sentences, a primary source), and guide patches when a hard fact changes. | Daily |
| **The Editor** | **The Beat** (`src/content/issues/`): one issue on what actually moved — normally short, occasionally a **long special issue** when a thread has earned depth. Plus the guide-accuracy pass, the claims reconciliation (distill / re-verify / stamp stale or retired), examples promoted, the skills shelf verified, memory updated. | Monday |

The reference the writers maintain: the nine-section **guide**
(`src/content/guide/`), its atomic **claims** (`src/content/claims/`, each
with `status` and `checked`), the **examples** swipe file, the **skills**
shelf, and the **directory** (`src/content/resources/` — reviewed, never
sold).

Closed archives, still served: the newsroom's daily articles
(`src/content/articles/`), the deep dives (`src/content/deep-dives/`), and
the radar (`src/content/radar/`).

## Editorial charter

1. **One reader.** A practitioner who markets to developers (see
   `editorial/TASTE.md`). Sophisticated, allergic to fluff, fact-checks in
   public. Always in English.
2. **No quota.** Wire promotion is criteria, not volume — a quiet day
   publishes nothing and that is a successful run. The issue ships weekly,
   but its *length* is earned: most weeks are short, and a special issue
   runs only when a thread has genuinely earned the depth. Padding is the
   failure mode that killed this site's first daily format.
3. **Technical or it doesn't run.** Every piece rests on something a working
   practitioner could measure, reproduce, or check against a primary source —
   a number, a config, a pricing page, a survey table. Business framing sits
   on top of an engineering or market reality, never instead of one.
4. **Sourced, dated, verified.** Every load-bearing claim carries a public,
   linkable source; vendor marketing is data about the vendor, not evidence.
   Single-sourced claims are flagged inline. A fresh-context fact-integrity
   pass checks every piece before it publishes. The reference goes further:
   every claim carries `since` (what made it true), `verify` (how to
   re-check), and a `status` stamped at `checked` — staleness is visible,
   never silent.
5. **Judgment over coverage.** Decide what mattered, cut the rest, take a
   position in one plain sentence. Connect to the running threads in
   `editorial/MEMORY.md` — an issue with amnesia is a failed issue.
6. **Feed the reference.** An issue that changes a fact patches the guide. A
   campaign teardown promotes an example. A measured pattern becomes a
   claim. A claim whose fact moved gets stamped stale or retired — never
   silently deleted. The stream exists to keep the reference current.
7. **House voice.** Short sentences. Simple words. Depth from specifics —
   figures, company names, dated moves — never rhetorical flourish. What
   happened → why it matters → what to do about it.
8. **Nothing is for sale.** No sponsored slots, no affiliate links, no paid
   placement or ranking anywhere on this site, and the directory
   (`src/content/resources/`) is held to the same bar as the rest: a live site,
   one proof point a reader can verify, the date it was checked, and the
   uncomfortable caveat stated. A provider never previews its own entry. A
   claim quoted from a vendor's own page is self-reported and says so.
9. **Don't surveil the reader.** No analytics that identify a person, no open
   pixels, no click tracking in the newsletter (`newsletter/`). Consent is
   double opt-in and leaving is one click. Audience numbers we cannot collect
   honestly, we do without.

## The desk

Institutional memory lives in `editorial/MEMORY.md` (threads, coverage
index, special-issue candidates, the evergreen shelf). The reader's standing
preferences live in `editorial/TASTE.md`. The retired newsroom's decision
log (`editorial/NEWSROOM.md`) and backlog (`editorial/BACKLOG.md`) are
read-only history. Every agent reads what it needs before writing and leaves
it better than it found it.
