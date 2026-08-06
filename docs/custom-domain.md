# The custom domain

The site is served from **https://thebeat.dev** — Vercel hosting, Namecheap
registration and DNS, apex canonical. This file records how that is wired and
what to change if it ever moves again.

## The shape

| Piece | Where | Value |
|---|---|---|
| Registrar + DNS | Namecheap (BasicDNS) | `dns1/dns2.registrar-servers.com` |
| Host | Vercel | apex primary, `www` 308s to it |
| Canonical origin | `site.config.mjs` | `SITE_ORIGIN = https://thebeat.dev` |
| Base path | `site.config.mjs` | `SITE_BASE = /` (served at the root) |

`SITE_ORIGIN` and `SITE_BASE` are the only two values that know where the site
lives. Every canonical, sitemap entry, feed id, JSON-LD node, llms link,
`robots.txt` Sitemap line, `.md` sibling and the IndexNow key location derives
from them, so a move is a config change and never a content migration.

## Two redirect layers keep old citations alive

Nothing that was ever published 404s:

1. **`albertogrande.github.io/developer-marketing/*`** — the original GitHub
   Pages project site. `scripts/build-redirects.mjs` publishes a stub for every
   URL it ever served, and it reads `site.config.mjs`, so those stubs started
   pointing at `thebeat.dev` on the next deploy with no edit.
2. **`developer-marketing.vercel.app/*`** — the project's Vercel hostname,
   configured in Project → Settings → Domains as a **308 redirect to
   `thebeat.dev`** (path-preserving). This is *not* automatic: adding a custom
   domain leaves the `*.vercel.app` hostname serving its own 200 copy of the
   site, which would be a duplicate origin. The redirect was set by hand and
   should be re-set if the domain is ever re-added.

A third, unrelated layer handles the 2026-08 content-model rename
(`briefs`→`wire`, `weekly`→`issues`, `practices`→`claims`) — see
`vercel.json` and the `redirects` block in `astro.config.mjs`.

## Mail

Mail on the domain is deliberately split so the two uses cannot collide:

- **apex** (`thebeat.dev`) — Namecheap email forwarding. Its `MX` records and
  the `v=spf1 include:spf.efwd.registrar-servers.com ~all` TXT stay untouched;
  this is what makes `REPLY_TO` reach a person.
- **`send.thebeat.dev`** — Resend's sending subdomain, carrying its own SPF,
  DKIM and MX. Keeping it on a subdomain is the point: a domain may hold only
  one SPF record, so a second one at the apex would break both.
- **`_dmarc.thebeat.dev`** — `p=none` to start, monitoring only.

`npm run newsletter:doctor` checks all of this and sends nothing.

## If it moves again

1. Vercel → Project → Settings → Domains → add the domain; it reports the DNS
   records to set and provisions HTTPS.
2. Point the DNS at them, then update `SITE_ORIGIN` in `site.config.mjs` (or
   set the env var in Vercel — the default just keeps local builds and the
   link gates agreeing without configuration).
3. Keep the old host attached to the project so its 308s survive. Redirect
   layers are cheap; dead citations are not.
4. Re-verify the origin in Google Search Console and Bing Webmaster Tools and
   resubmit the sitemap — see `search-engines.md`.

## Why the apex, and why it matters for AEO

One clean host is the citable identity: answer engines consolidate signals on
the canonical origin, and a short apex is what people and models actually
retype. The custom domain also survives any future hosting move without
breaking a single cited URL — the strongest durability property a citation can
have.
