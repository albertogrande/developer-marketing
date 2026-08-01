# LinkedIn — promoting The Week

Internal playbook. Not rendered on the site. How each issue of
[The Week](../src/content/weekly/) gets its LinkedIn promo post, what the
format borrows from the best comparable out there, and where the house rules
bend it.

## The comparable

Matteo Tittarelli promotes each issue of *The GTM Engineer Pulse* (Substack)
with a LinkedIn post in a fixed shape:

> Hook ("Pulse #35 is live.") → Recent News (3 bullets, links) → Favourite MCP
> of the week (1 pick) → LinkedIn Hot Takes (4 quoted takes, authors tagged,
> "+5 more inside") → GTME Jobs (salary + location) → Top GTMEs to Follow
> (5 tagged people) → Recommended Resources (3 links) → Full edition link →
> PS: course promo.

What makes it work: it is skimmable, every line is a link, the people layer
(tagged authors, people to follow) does the distribution for him — every tag
is a notification and a candidate reshare — and the numbered hook trains the
reader to expect the next issue.

### What he has that we don't

| His section | Our status |
|---|---|
| Hot takes with tagged authors | No voices section anywhere; we cite companies, not people |
| Jobs (salary + location) | Fed by the `dev-marketing-jobs` board (see below) |
| Favourite MCP of the week | Raw material exists (skills shelf, swipe file) but no weekly single pick |
| Top people to follow | Nothing |
| PS selling a course | Deliberately never — nothing is for sale (MASTHEAD rule 8) |
| Implicit audience proof (Substack likes, cohorts) | Deliberately never — no audience metrics we can't collect honestly (rule 9) |

### What we have that he doesn't

- **A thesis, not a link list.** Each issue argues one thing; the post leads
  with that argument, not with "the issue is live".
- **"One thing to watch"** — a falsifiable, dated call. On LinkedIn this is
  the comeback hook: readers can return and check whether we were right.
- **Epistemic labels.** Vendor-claimed flagged as vendor-claimed,
  single-sourced marked inline. He links; we grade the link.
- **A free compounding product behind the pulse** (guide, practices, swipe
  file, skills shelf, resources) instead of a paid school. The PS slot points
  at the guide.
- **The privacy stance.** No pixels, no click tracking, double opt-in. For a
  technical audience this is a differentiator worth one line, occasionally.

## The post template

English, always (the reader in `TASTE.md` is the same reader). House voice:
short sentences, what happened → why it matters. One post per issue, published
the week the issue ships. Drafts live in `editorial/linkedin/<week>.md`.

```
<Thesis hook — the issue's argument in one or two plain sentences.
Not "The Week #N is live"; the claim itself. The issue number can close
the post instead.>

What moved this week:
• <3–4 bullets distilled from the issue body, each with its primary-source
  link. Numbers over adjectives. Keep the epistemic flags ("vendor-claimed",
  "single-sourced") — they are the brand.>

From the shelf / swipe file (pick ONE, alternate weeks):
• <One skill (with install line) or one example (with link), chosen to
  resonate with the week's theme.>

Voices (when the week produced any worth quoting):
• <2–4 practitioner takes with name + link. Tag the authors on LinkedIn.
  Only real quotes from fetched sources — same sourcing bar as the site.>

Jobs (when we have verified listings):
• <Title — Company | salary if public | location — link.
  Source: the dev-marketing-jobs board (preferred) or a verified listing page.>

People worth following:
• <Occasional, not weekly. 3–5 names with role + why.>

One thing to watch:
<The issue's falsifiable call, compressed to one sentence.>

Full issue: <absolute URL to /weekly/<week>>
PS. Everything behind it — the guide, practices, swipe file, skills shelf —
is free: <site URL>. No paywall, no tracking.
```

Section rules:

- **Derived sections** (news bullets, pick of the week, one thing to watch,
  links) come straight from the repo — the weekly issue, `src/content/skills/`,
  `src/content/examples/`, `src/content/resources/`. No new research needed.
- **Researched sections** (voices, jobs, people) need a per-week research
  pass; they are optional. An empty section is dropped, never padded — same
  ceiling-not-quota rule as the newsroom.
- **Sourcing bar is the site's.** Every bullet resolves to a URL. No invented
  quotes, no unverifiable jobs, no audience numbers, ever.
- **CTA:** until the newsletter transport is deployed (see
  `newsletter/LAUNCH.md`), the call to action is the web archive URL, not
  "subscribe by email". Flip to the subscribe page when the domain + DKIM
  work is done.
- **Nothing is for sale** applies here exactly as on the site: no affiliate
  links, no paid placement in jobs or resources, and the PS promotes only our
  own free material.

## Jobs source: dev-marketing-jobs

The jobs section is fed by the `albertogrande/dev-marketing-jobs` repo's
**public deployment at https://dev-marketing-jobs.vercel.app** — call it,
don't absorb its code into this repo. The board is server-rendered, so its
tabs are readable with a plain fetch (no auth, no JS needed):

- `/` — marketing, growth, content and marketing-leadership roles
- `/product-marketing` — PMM roles
- `/devrel` — DevRel / advocacy / developer-community roles

Each job row carries title, company, location, salary (when public), posted
date, and the external listing URL (Greenhouse/Ashby/Workable) in the page
payload. The board's own location gate — fully-remote EU-eligible plus
anything Spain-based — is also the post's gate: it matches the audience.
Quirk: the payload sometimes double-prefixes salary (`$$150,000`); write a
single `$`. Prefer roles posted within the issue's window or shortly before.
Fallback if the board is down: manual web search with each listing page
fetched and verified. See `.claude/skills/linkedin-promo/`.

## Producing a post

Run `/linkedin-promo [week]` (defaults to the latest issue). It writes
`editorial/linkedin/<week>.md` and never commits — same contract as the desk
skills.
