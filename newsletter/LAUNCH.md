# Going live

The code is done and tested. What is left is configuration, one decision, and a
domain. This is the order that gets there fastest, with who has to do each step.

Nothing here is reversible-with-difficulty: the list is ours, the relay is one
environment variable, and the site degrades honestly at every stage.

## The critical path

```
  ┌─ 1. merge the branch ─────────────────── 5 min   ─┐
  │                                                   ├─→ 5. doctor → test send → live
  ├─ 2. a domain you own ────────────────── 10 min   ─┤
  ├─ 3. a host for /subscribe ───────── 30 min–2 h   ─┤
  └─ 4. secrets and variables ───────────── 10 min   ─┘
```

Steps 2, 3 and 4 are independent — do them in whatever order suits. Step 3 is
the only one with a real decision in it.

## 1. Merge — 5 minutes

Nothing ships from a branch. `claude/resources-newsletter-setup-xequ9n` is green:
build, 96 tests, no dead links. Merging publishes `/resources` immediately —
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

## 3. Somewhere to accept a POST — the one decision

A static site cannot take a form post. Two shapes, and they are not equally
fast:

**A. A small box — live today, zero new code.** Any $5 VPS, Fly machine or
container. `newsletter/README.md` has the systemd unit and the Caddy block.
The list is a file you can back up with `cp`. Works identically whether the site
sits on GitHub Pages or Vercel, because the service was always separate.

**B. One Vercel deployment — needs a database first.** Consolidating the endpoint
into the same project as `/api/subscribe` is tidier and where you are heading
anyway, but serverless has no durable filesystem, so the NDJSON list cannot live
there. That means picking a store (Postgres via Neon or Vercel Postgres; Upstash
Redis if you would rather stay dependency-free over HTTP) and writing an adapter.

The adapter is a known, bounded piece of work: `newsletter/test/store-contract.mjs`
is the specification as executable tests. Twelve tests, twelve behaviours, eight
methods — point them at a new backend and passing means the service and the
sender work against it unchanged. That is deliberately the *only* thing that has
to change.

Fastest overall: **A now, B later if you still want it.** A costs nothing to
throw away — the site config is one variable either way — and it gets the form
live while the domain's DNS is still propagating.

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
| `ADMIN_TOKEN` | so the send job can read the list |
| `RESEND_API_KEY` | or `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` |
| `FROM_EMAIL`, `REPLY_TO` | on the domain from step 2 |
| `TRUST_PROXY=1` | only if a reverse proxy sits in front |

In the repository, so the forms render live and the weekly send runs:

- **variable** `NEWSLETTER_API` → the service's public URL (or `/api` if same-origin)
- **secrets** `NEWSLETTER_SECRET`, `NEWSLETTER_ADMIN_TOKEN`, `FROM_EMAIL`, and
  `RESEND_API_KEY` (or the `SMTP_*` set)

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

Stated plainly, because discovering it later is worse:

- **Bounce and complaint handling.** Nothing consumes Resend's webhooks or
  processes DSNs, so a dead address stays on the list and keeps being mailed.
  Harmless for a small list, corrosive to sender reputation as it grows. This is
  the first thing to build after launch: a webhook route plus a `bounced` status
  the sender skips. Half a day.
- **A Vercel-native store**, if you choose shape B above. Bounded by the
  contract tests. Half a day.
- **List export.** `data/subscribers.ndjson` is the export; if you want a CSV
  command, say so.
- **No welcome email.** Confirming lands on `/newsletter/confirmed` and the next
  issue is the first thing that arrives. That is a choice, not an omission.
- **Nothing prunes the pending pile.** Unconfirmed records stay forever; the copy
  on `/newsletter` promises they are dropped. A weekly `compact()` plus a delete
  of pending records older than the confirm TTL would make that literally true.
  An hour.

## Maintaining the directory

`/resources` is 24 entries checked on 2026-07-26. It is not on a cadence and
should not be padded. When a scout signal names a provider — a rebrand, an
acquisition, a shop closing — refresh or remove the entry and re-stamp `checked`.
`npm run check` verifies every link still resolves; run it before publishing a
refresh. The rules are in `MASTHEAD.md` (charter 8) and `editorial/MEMORY.md`.
