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

## Mail — decided, not yet wired

**The newsletter cannot send as `thebeat.dev` today**, and neither can the
pipeline alerts. The mail identity in `newsletter/.env.example` (`FROM_EMAIL`,
`REPLY_TO`, `LIST_ID`) describes the intended end state. What is actually true,
verified against live DNS on 2026-08-18:

| Record | State |
|---|---|
| apex `MX` + `v=spf1 include:spf.efwd.registrar-servers.com ~all` | **present** — Namecheap's forwarding defaults |
| any email **forwarding rule** | **none defined** — so `hello@thebeat.dev` accepts nothing and `REPLY_TO` drops silently |
| `send.thebeat.dev` SPF/MX, `resend._domainkey.thebeat.dev` | **absent** — the domain is not verified with a relay |
| `_dmarc.thebeat.dev` | **absent** |

### The decision: thebeat.dev takes the Resend slot

Resend's free plan verifies **one** domain, and `orka.sh` has been holding it —
`resend._domainkey.orka.sh` and `send.orka.sh` (SPF + `feedback-smtp.eu-west-1`
MX) are live today. The choice was a paid plan or a freed slot; the slot wins,
because this is the domain that publishes. `orka.sh` gives up Resend sending
when it is removed — its inbound mail is unaffected, it runs on Namecheap
Private Email (`mx1/mx2.privateemail.com`), which is a different service.

Leave the `orka.sh` records in DNS rather than tidying them. They cost nothing,
they are inert once the domain is gone from Resend, and they make going back a
dashboard action instead of a DNS round-trip.

### The runbook

1. **Resend** — remove `orka.sh`, add `thebeat.dev`, region `eu-west-1` (where
   `orka.sh` already sent from, so the reasoning about latency and data
   residency does not change).
2. **Namecheap → Advanced DNS** — add the three records Resend shows. Copy them
   from the dashboard; the DKIM key is unique per domain. The shape, from what
   `orka.sh` carries today:

   | Type | Host | Value |
   |---|---|---|
   | `TXT` | `send` | `v=spf1 include:amazonses.com ~all` |
   | `MX` | `send` | `feedback-smtp.eu-west-1.amazonses.com`, priority 10 |
   | `TXT` | `resend._domainkey` | `p=MIGfMA0…` (from the dashboard) |

   All three sit on names of their own. **The apex is untouched** — it carries
   the forwarding SPF, a domain may publish only one SPF record, and the
   forwarding is what makes `REPLY_TO` work.
3. **Namecheap → Domain → Redirect Email** — forward `hello@thebeat.dev` and
   `dmarc@thebeat.dev` to a real inbox. Free, and both are load-bearing: a
   `REPLY_TO` that black-holes is worse than none, and DMARC's `rua` must be on
   a domain that authorises it, which a same-domain address does by definition.
4. **`_dmarc.thebeat.dev`** — a `TXT` reading
   `v=DMARC1; p=none; rua=mailto:dmarc@thebeat.dev`. Monitor only; tighten to
   `quarantine` once the reports look clean.
5. **Verify** — `npm run newsletter:doctor -- --dkim-selector resend`. It checks
   SPF, DKIM, DMARC and the relay's own view of the domain, and sends nothing.

### What this unblocks, in order

The **alerts** land first and need almost nothing: one repo variable
`ALERT_FROM_EMAIL=alerts@thebeat.dev`, plus the secrets `RESEND_API_KEY` and
`ALERT_EMAIL_TO`. No mailbox is involved — an alert is outbound-only, to a
human's existing inbox. The **newsletter** needs the forwarder and DMARC as
well, because it takes replies and is judged by inbox providers.

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
