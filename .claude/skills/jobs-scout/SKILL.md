---
name: jobs-scout
description: Weekly jobs sweep — find currently-open, fully-remote marketing-leadership, growth and product-marketing roles at developer-focused or AI companies, confirm each against the employer's original posting, classify its remote region, and write signals/jobs/incoming.json for the deterministic merge. Use when asked to run the jobs sweep or refresh the jobs board.
---

# The Jobs Scout — weekly sweep

You are the scraping worker for this site's jobs board. Your only job in this
run is to **discover currently-open roles and write them to
`signals/jobs/incoming.json`**. A deterministic script (`npm run jobs:merge`)
runs after you — it owns validation, dedupe, stable ids, timestamps, liveness
and aging, and writes `signals/jobs/jobs.json`. **Do NOT touch
`signals/jobs/jobs.json` yourself.**

Job boards and aggregators are a **discovery layer only** — you use them to
find candidate roles and to reach the employer's original posting. Never trust
a board's rendering of a job's location, remote-type, status, or date; those
authoritative fields come from the **original employer JD**, nowhere else.

## Steps

1. Read `signals/jobs/sources.json`: `boards`, `companies`, `searchQueries`.
2. **Discover candidates + checkpoint.** For each source — a `WebSearch` query
   or a `WebFetch` of a board/company URL — extract every plausibly-matching
   role and **immediately `Write signals/jobs/incoming.json`** with the full
   cumulative array so far. This checkpoint guarantees output even if you run
   out of turns. At this stage a job is only a *candidate*.
3. **Resolve to the original JD URL**: for any candidate whose best-known link
   is an aggregator/board listing, `WebFetch` that listing to pull the
   employer's real apply/posting URL, fix the entry, and re-`Write`. Required
   work, not polish.
4. **Read the original JD — required, authoritative.** `WebFetch` the
   employer's own posting page. From it, overriding anything the board said:
   - **`location`** — the location text the employer states.
   - **`remote`** — as the JD actually describes it. **Only fully-remote roles
     are kept**; discard `hybrid` and `onsite` outright, no exceptions.
   - **`region`** — see "Classify the remote region" below.
   - **`postedAt`** — the publish date on the employer's posting (never a
     board's re-share date). `null` if it states none.
   - **Open/closed** — if the page 404s, is gone, or says it is no longer
     accepting applications, **drop the candidate**.

   A candidate you could not confirm against its original JD is **not** ready
   to emit. Prefer dropping it over publishing board-derived guesses.

**Turn budget — the #1 rule:** a run that ends without having written
`signals/jobs/incoming.json` is a total failure. After your very first source
you must already have written it once; never let more than two tool calls pass
without a re-`Write`. Accuracy over volume: when you run low on turns, stop
discovering and finish confirming what you have. If a page needs JavaScript or
404s, skip it and move on — no retries.

## Scope — include a role only if ALL THREE hold

**(A) The company is developer-focused or an AI company.**
1. **Developer-focused** — its primary customers/ICP are software developers,
   engineers, or technical builders: devtools, APIs, cloud & dev
   infrastructure, databases, SDKs, AI/ML tooling, open-source companies,
   security or data tooling aimed at engineers.
2. **An AI company** — a foundation-model lab, AI infrastructure/tooling
   company, or a well-known AI product company. These qualify even when their
   ICP is broader than developers.

A generic SaaS/consumer company that merely "uses AI" is neither — exclude it.
When the ICP is unclear, check what they sell; if still unclear, leave it out.

**(B) The role is one of exactly three categories** — this board is
deliberately narrower than "all marketing":

- **`marketing-leadership`** — Head/VP/Director of Marketing, CMO, Head of
  Growth. Leadership of the marketing function.
- **`growth`** — growth marketing ICs and managers: Growth Marketing Manager,
  Growth Lead, demand-side growth roles.
- **`product-marketing`** — Product Marketing Manager/Lead/Director, including
  technical/developer PMM.

**Not on this board (yet, deliberately):** DevRel/advocacy/community roles,
content/brand/comms/demand-gen/lifecycle/ops ICs, sales, engineering. A great
Developer Advocate opening is out of scope — do not emit it.

**(C) The role is fully remote.** No hybrid, no onsite, no exceptions. The JD
decides, never the board's label.

## Classify the remote region

Every included role is remote; `region` says remote *where*, read from the JD:

- **`worldwide`** — no stated hiring-region restriction ("remote",
  "remote — global", "anywhere"). Unstated restriction = worldwide: a JD that
  restricts hiring says so.
- **`eu`** — restricted to or clearly anchored in Europe/EMEA/UK, or requires
  European working hours.
- **`usa`** — restricted to the US/Canada/Americas, requires US work
  authorization, or names US timezones as a requirement.
- **`other`** — restricted to some other specific region (LATAM, APAC, a
  single non-EU/non-US country).

The merge has a deterministic fallback classifier, but your JD-derived value
wins — set it explicitly on every entry.

## Output — `signals/jobs/incoming.json`

A JSON array; each object exactly:

```json
{
  "title": "Head of Marketing",
  "company": "Acme",
  "companyUrl": "https://acme.dev",
  "location": "Remote (US timezones)",
  "remote": "remote",
  "region": "worldwide | eu | usa | other",
  "category": "marketing-leadership | growth | product-marketing",
  "tags": ["head-of-marketing", "devtools"],
  "salary": "$150k–$190k or null",
  "url": "https://jobs.ashbyhq.com/acme/1234-head-of-marketing",
  "source": "yc-workatastartup",
  "summary": "One or two sentences: the role, and why the company is developer-focused.",
  "postedAt": "2026-08-01 or null"
}
```

Rules:
- `url` MUST be the **employer's own apply/posting page** (careers site or its
  ATS — greenhouse.io, ashbyhq.com, lever.co, workable…). It is the dedupe
  key. NEVER an aggregator/board URL; if you cannot find the employer's apply
  URL, skip the posting.
- `source` = the source `name` from sources.json, or `"search"`.
- `salary` only if stated — never guess.
- Dedupe obvious repeats yourself; cross-source dupes are fine (the merge
  collapses them by canonical URL and by company+title identity).

Nothing here is ever paid placement — a listing earns its slot by matching the
scope, and nothing else (MASTHEAD.md applies to the board too). Aim for
quality over volume; end by confirming how many roles you wrote and how many
candidates you dropped unconfirmed.
