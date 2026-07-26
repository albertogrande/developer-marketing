# Going live

The code is done and tested. What is left is configuration, a domain, and one
afternoon of deployment. This is the order that gets there fastest, with who has
to do each step.

Nothing here is reversible-with-difficulty: the list is ours, the relay is one
environment variable, and the site degrades honestly at every stage.

## The critical path

```
  ┌─ 1. merge the branch ─────────────────── 5 min   ─┐
  │                                                   ├─→ 5. doctor → test send → live
  ├─ 2. a domain you own ────────────────── 10 min   ─┤
  ├─ 3. deploy the endpoint ────────── 30 min–4 h   ─┤
  └─ 4. secrets and variables ───────────── 10 min   ─┘
```

Steps 2, 3 and 4 are independent — do them in whatever order suits.

## 1. Merge — 5 minutes

Nothing ships from a branch. `claude/resources-newsletter-setup-xequ9n` is green:
build, 142 tests, no dead links. Merging publishes `/resources` immediately —
that half has no external dependency at all. The newsletter call-to-action ships
in its honest "not wired up yet" state until step 4.

## 2. A domain — 10 minutes, then DNS propagation

**This is the true blocker for email, and only you can do it.** No relay will
send as `albertogrande.github.io` or `*.vercel.app`; they cannot be
DKIM-authenticated. You need a domain you control.

Once you have one:

- add it in Resend, paste the SPF and DKIM records it gives you into DNS
- add a DMARC record yourself: `_dmarc  TXT  "v=DMARC1; p=none; rua=mailto:you@yourdomain"`
  (start at `p=none`, tighten to `quarantine` once reports look clean)
- point `FROM_EMAIL` at it, e.g. `the-week@yourdomain`

Verify with `npm run newsletter:doctor -- --dkim-selector resend`. It checks all
three records and the domain's verification status in Resend, and sends nothing.

## 3. Deploy the endpoint — built, needs connecting

A static site cannot take a form post, so the endpoint is a Vercel Function. This
part is **done**: `api/` holds seven small files, each binding one route from
`newsletter/server.mjs`, and they are tested by driving real `Request` objects
through them (`newsletter/test/vercel.test.mjs`).

No framework conversion was needed. Vercel runs functions from a top-level `api/`
directory for any project, including a plain static build, so the Astro site is
untouched and still static.

```
api/
  subscribe.js          → POST /api/subscribe
  confirm.js            → GET  /api/confirm?t=…
  unsubscribe.js        → GET|POST /api/unsubscribe?t=…
  health.js             → GET  /api/health
  webhooks/resend.js    → POST /api/webhooks/resend
  admin/subscribers.js  → GET  /api/admin/subscribers
  admin/suppress.js     → POST /api/admin/suppress
```

Because the endpoint is same-origin, set `PUBLIC_NEWSLETTER_API=/api` and CORS
stops applying at all.

The list goes in Postgres, because a serverless filesystem is not durable. Cost:
nothing — Neon's free tier is 0.5 GB and 100 compute-hours a month, and this
table is kilobytes. Use the **self-managed** Neon integration from the Vercel
Marketplace rather than the Vercel-managed one: same auto-injected `DATABASE_URL`,
same per-preview database branch, but you own the Neon account, so the data and
its billing do not become Vercel's to hold. Use the **pooled** connection string;
a function opening direct connections exhausts the database's slots on the first
burst.

`DATABASE_URL` alone selects the Postgres store — no other configuration.

### Serving at the root

Pages serves this site under `/developer-marketing`; Vercel and a custom domain
serve at `/`. The build takes that from `site.config.mjs`:

```
SITE_ORIGIN=https://your-domain  SITE_BASE=/  npm run build
```

**That flag alone is not enough, and the build will tell you so.** Fourteen links
inside published articles hard-code the current base — `/developer-marketing/guide
/…` — because that is what works today and what the link gate has always required.
At the root they would 404, so `check-refs` fails the build instead of shipping
them.

Fixing it properly is a small, separate change with a decision in it: content
should stop encoding the deployment path, which means a remark plugin that adds
the base at build time, inverting rule 3 in `scripts/check-refs.mjs`, rewriting
those fourteen links, and updating the writer instructions in `.claude/skills/`
so the next digest follows the new convention. An hour or two, and worth doing
once rather than papering over — a `sed` alone would be undone by the next
weekly issue.

Until then, deploying to Vercel with the default base works fine; the site just
lives at `your-domain/developer-marketing/`.

## 4. Secrets and variables — 10 minutes

Generate the signing secret once and keep it identical everywhere; changing it
invalidates every outstanding confirm and unsubscribe link.

```
openssl rand -hex 32     # NEWSLETTER_SECRET
openssl rand -hex 24     # ADMIN_TOKEN
```

On the host running the service (or the Vercel project):

| | |
|---|---|
| `NEWSLETTER_SECRET` | the value above |
| `PUBLIC_BASE_URL` | where the service is reachable, e.g. `https://list.yourdomain` |
| `SITE_URL` | the published site, for the confirm/unsubscribe redirects |
| `ALLOWED_ORIGINS` | the site's origin, so only it can post the form |
| `ADMIN_TOKEN` | so the send job can read the list and report rejections |
| `WEBHOOK_SECRET` | the `whsec_…` from Resend, or bounces are never honoured |
| `DATABASE_URL` | pooled connection string, if the store is Postgres |
| `RESEND_API_KEY` | or `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` |
| `FROM_EMAIL`, `REPLY_TO` | on the domain from step 2 |
| `TRUST_PROXY=1` | only if a reverse proxy sits in front |

In the repository, so the forms render live and the weekly send runs:

- **variable** `NEWSLETTER_API` → the service's public URL (or `/api` if same-origin)
- **secrets** `NEWSLETTER_SECRET`, `NEWSLETTER_ADMIN_TOKEN`, `FROM_EMAIL`, and
  `RESEND_API_KEY` (or the `SMTP_*` set)

And in Resend, one webhook pointing at `https://your-host/webhooks/resend`,
subscribed to `email.bounced` and `email.complained`.

Until `NEWSLETTER_API` is set the call-to-action says so rather than failing
silently, and the send workflow skips instead of going red.

## 5. First send

```
npm run newsletter:doctor -- --dkim-selector resend   # must be "ready"
node newsletter/send.mjs --test you@yourdomain        # one real message
```

Read that message in Gmail **and** in a terminal client. Check the unsubscribe
link works and that your mail client's own unsubscribe button appears. Then:

```
node newsletter/send.mjs --yes --rate 30
```

Or let the Monday workflow do it. Either way the send is resumable: every
delivery is logged and a re-run skips whoever already got it.

## What is not built yet

Stated plainly, because discovering it later is worse.

**Done since this list was written:**

- ~~Bounce and complaint handling.~~ Built. `POST /webhooks/resend` verifies the
  relay's Svix signature and suppresses on permanent bounces and complaints; a
  transient failure is counted and five in a row suppresses. The sender also
  reports the `550`s it sees for itself, so the SMTP path needs no webhook at all.
  Add the webhook in Resend, subscribe it to `email.bounced` and
  `email.complained`, and set `WEBHOOK_SECRET`.
- ~~A Postgres store.~~ Built and contract-tested against a real database.
- ~~Pruning the pending pile.~~ `prunePending(ttlDays)` exists on both stores and
  is contract-tested. Still needs a caller — a weekly cron line, one hour of work.

**Still outstanding:**

- **Serving at the root** (see below). The config switch is in; 14 links in
  published content are not.
- **A cron for `prunePending`.** The privacy note promises unconfirmed addresses
  are dropped; the function exists, nothing calls it yet.
- **List export.** `data/subscribers.ndjson` *is* the export for the file store;
  Postgres needs a `newsletter:export` command, or `psql -c "copy … to csv"`.
- **No welcome email.** Confirming lands on `/newsletter/confirmed` and the next
  issue is the first thing that arrives. A choice, not an omission.

## Maintaining the directory

`/resources` is 24 entries checked on 2026-07-26. It is not on a cadence and
should not be padded. When a scout signal names a provider — a rebrand, an
acquisition, a shop closing — refresh or remove the entry and re-stamp `checked`.
`npm run check` verifies every link still resolves; run it before publishing a
refresh. The rules are in `MASTHEAD.md` (charter 8) and `editorial/MEMORY.md`.
