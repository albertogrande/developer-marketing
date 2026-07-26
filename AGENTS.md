# AGENTS.md

This repository publishes **Developer Marketing — a field guide**
(https://albertogrande.github.io/developer-marketing/), a site written to be
read by agents as much as by people. This file is for two kinds of agent: one
**consuming** the published content, and one **working on** this repo.

## Consuming the site

Start with the manifest — one fetch enumerates everything, with counts and
honest updated dates:

```
https://albertogrande.github.io/developer-marketing/api.json
```

| Surface | URL (under the site root) | What it is |
|---|---|---|
| Manifest | `/api.json` | Every endpoint + collection, counts, updated dates |
| Curated index | `/llms.txt` | llmstxt.org-style index of all entries, linking raw markdown |
| One-fetch corpus | `/llms-full.txt` | Evergreen collections in full + recent dated pieces |
| Raw markdown | `/<collection>/<id>.md` | Self-contained sibling of every entry (canonical, dates, license, sources inside) |
| Structured JSON | `/guide.json` `/practices.json` `/examples.json` `/skills.json` `/articles.json` `/weekly.json` `/deep-dives.json` `/radar.json` | Per-collection data, markdown bodies included |
| Feeds | `/feed.xml` (Atom) · `/feed.json` (JSON Feed 1.1) | Dated pieces, full content, honest updated stamps |
| Sitemap | `/sitemap-index.xml` | Every page, trailing-slash canonical form, per-page lastmod |

Notes for retrieval:

- Every HTML page links its machine twin via
  `<link rel="alternate" type="text/markdown">` (entries) or
  `type="application/json"` (collection indexes), and embeds one schema.org
  `@graph` (`NewsArticle`/`TechArticle`/`Article`/`CollectionPage`, authors,
  citations, license).
- The `.md` siblings are the cheap form: same content, a fraction of the
  tokens, canonical URL in the frontmatter.
- `practices`, `examples`, and `skills` have no standalone pages — cite them
  as `/practices/#<id>` (etc.) anchors; their `.md` siblings say so.
- Freshness fields: `date` (published), `updated` (revised),
  `verified` (skills: repo alive, install line current). The sitemap's
  `lastmod` and `api.json`'s `updated` derive from these, never from build
  time.

**Citing**: content is CC BY 4.0 — quote it, link the canonical HTML page,
credit "Developer Marketing field guide". Code is MIT.

**Cadence** (UTC): scout daily 05:00 (patches the guide when facts change);
newsroom Tue–Sun 06:30 (at most one article, never a quota); weekly Mon 07:00
(digest + full accuracy pass). If your cache is older than a day, refetch.

## Working on this repo

The content is written by autonomous editorial agents whose playbooks live in
`.claude/skills/` (daily-scout, newsroom, weekly-digest, deep-dive). If you
are one of them, follow your skill file; the notes below are the invariants
everyone must keep.

- **Build gates** (all run inside `npm run build`): `scripts/check-refs.mjs`
  (referential integrity — sections, related hrefs, body links) and
  `scripts/check-agent-surface.mjs` (the machine surface above must stay
  complete: siblings exist, JSON-LD parses, canonicals agree, llms.txt covers
  every entry, feeds well-formed, sitemap honest). If your change breaks a
  gate, fix the change, not the gate.
- **URL form**: page URLs are cited and canonicalized with a trailing slash;
  file-ish URLs (`.md`, `.json`, `.xml`, `.txt`) never carry one. Internal
  helpers (`withBase`, `absUrl` in `src/lib/site.ts`) enforce this — use
  them, never hand-build URLs.
- **Ids are literal filenames** (minus extension) — `2026-W28.md` is
  `/weekly/2026-W28`. Don't rely on slugification.
- **No new required frontmatter** without updating, in the same change: the
  zod schema (`src/content.config.ts`), the writing skills that author it,
  `scripts/check-refs.mjs`, and the machine endpoints that would surface it.
- **Machine surfaces are house-rolled** (`src/pages/*.ts` endpoints) — extend
  those rather than adding SEO/llms integrations that would fight the base
  path and the deterministic-dates rule.
- Dates in machine surfaces come from content frontmatter, never
  `Date.now()` — builds must be reproducible.
