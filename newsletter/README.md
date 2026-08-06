# The newsletter

The weekly digest, delivered by email. Self-hosted end to end: our list, our
templates, our sender, no Mailchimp, Substack or beehiiv anywhere in the path.
Almost zero runtime dependencies — everything here is Node's standard library,
except `lib/issues.mjs`, which reads weekly frontmatter with the repo's `yaml`
parser (so the newsletter tests run from the repo root, where `node_modules`
lives). The optional Postgres store lazily imports `pg` on serverless only.

The one part worth outsourcing is the pipe, and at this size it is free. See
[Transports: do we need Resend?](#transports-do-we-need-resend) and
[Do we have to pay for it?](#do-we-have-to-pay-for-it) — short answers: a relay
yes, a paid plan no, and either way it is one environment variable.

**Going live:** [`LAUNCH.md`](LAUNCH.md) is the sequenced checklist — what to do
in what order, who has to do it, and what is deliberately not built yet.

A guide that tells people to respect developers cannot run its own list through
a service that pixel-tracks them. So it doesn't.

```
newsletter/
  server.mjs        the capture service: subscribe, confirm, unsubscribe
  send.mjs          the sender: one issue → the confirmed list
  doctor.mjs        preflight: SPF/DKIM/DMARC, port 25, rDNS, credentials, cost
  lib/
    config.mjs      environment → config, with fail-fast validation
    store.mjs       the list: append-only NDJSON, replayed into memory
    store-postgres.mjs  the same list in Postgres, for hosts with no disk
    store-open.mjs  which of the two to open
    webhooks.mjs    relay bounce/complaint events, signature-verified
    tokens.mjs      HMAC-signed confirm/unsubscribe links
    transport.mjs   how mail leaves: smtp | resend | dry-run
    smtp.mjs        an SMTP client (EHLO, STARTTLS, AUTH, MAIL/RCPT/DATA)
    mime.mjs        RFC 5322 headers, RFC 2047 encoding, quoted-printable
    markdown.mjs    the markdown subset the digests use → HTML + plain text
    templates.mjs   the two emails: confirmation, issue
    issues.mjs      reads src/content/issues/<YYYY-Www>.md
  test/             134 tests: node --test newsletter/test/*.test.mjs
                    (133 without a database; the Postgres contract skips)
```

## How it fits together

The site is static on GitHub Pages, which cannot accept a POST. So the form on
the site posts to this service, running anywhere you like:

```
  reader                         GitHub Pages                 your box
  ──────                         ────────────                 ────────
  types email  ──────────────▶   NewsletterCta.astro
                                 (form action) ──POST──────▶  /subscribe
                                                                 │
                                                    pending record + one email
                                                                 │
  clicks confirm link ──────────────────────────────────────▶  /confirm
                                                                 │
                                              303 ──▶ /newsletter/confirmed
  ...
  Monday                                                      send.mjs
                                                    reads src/content/issues/,
                                                    renders, delivers over SMTP
```

The site only needs to know one thing: where the service is. It is baked in at
build time as `PUBLIC_NEWSLETTER_API`. Without it the call-to-action degrades to
an honest "not wired up yet" note instead of a form that fails silently.

## Run it

```
cp newsletter/.env.example newsletter/.env      # fill in NEWSLETTER_SECRET
set -a; . newsletter/.env; set +a
npm run newsletter:serve
```

With no `SMTP_HOST` the service starts in dry-run mode and writes each message
to `newsletter/data/outbox/*.eml` instead of sending it, so the whole flow is
testable on a laptop with no mail server:

```
curl -sS localhost:8787/subscribe -H 'content-type: application/json' \
  -d '{"email":"you@example.com","source":"/local"}'
open newsletter/data/outbox/*.eml        # the confirmation, exactly as sent
curl -sS 'localhost:8787/confirm?t=<token from the email>' -i
curl -sS localhost:8787/health
```

Then point the site at it:

```
PUBLIC_NEWSLETTER_API=http://localhost:8787 npm run dev
```

## Deploy it

Any host that can run Node 20 and hold a file. Put TLS in front of it — the
service listens on `127.0.0.1` by default precisely so it cannot be exposed
without a proxy in front.

A systemd unit, for a box you already own:

```ini
# /etc/systemd/system/newsletter.service
[Unit]
Description=developer-marketing newsletter capture
After=network-online.target

[Service]
Type=simple
User=newsletter
WorkingDirectory=/srv/developer-marketing
EnvironmentFile=/etc/newsletter.env
ExecStart=/usr/bin/node newsletter/server.mjs
Restart=on-failure
RestartSec=5
# The service needs to write exactly one directory.
ReadWritePaths=/srv/developer-marketing/newsletter/data
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
```

Caddy in front (TLS and the public hostname in three lines):

```
list.example.com {
	reverse_proxy 127.0.0.1:8787
}
```

Set `TRUST_PROXY=1` once a proxy is in front, or rate limiting will count every
request against the proxy's own address. Then set the repository variable
`PUBLIC_NEWSLETTER_API` to `https://list.example.com` so the next site build
renders live forms.

## Transports: do we need Resend?

Yes to a relay, and Resend is a reasonable one. To be precise about what that
does and does not mean:

**A relay is not an email service provider.** Mailchimp, Substack and beehiiv
want to own the list, the templates, the signup form and the analytics — that is
the thing this directory exists to avoid. A relay takes a finished message and
injects it into the internet. Everything that matters stays here: the list, the
consent record, the tokens, the templates, the archive, the decision not to
track anyone.

**Running our own MTA instead would be worse, not purer.** Sending directly from
a box means IP warm-up, reverse DNS, feedback loops, blocklist monitoring, and a
reputation you cannot buy back once a shared-hosting neighbour has burned it.
For one weekly email to a small list, that is a hobby, not an advantage.

So: a relay is a dependency worth having, and `transport.mjs` is the only file
that knows which one, so it stays swappable.

| Transport | When | What it costs us |
|---|---|---|
| `smtp` (default) | Any relay: Resend, SES, Postmark, your own Postfix | Nothing. The bytes on the wire are the ones `mime.mjs` built. |
| `resend` | Serverless hosts, where holding a TCP session open is awkward | Resend assembles the MIME from the fields we hand it. Headers pass through; the assembly is theirs. |
| `dry-run` | Local development, CI, previews | Writes `.eml` files, sends nothing. |

The transport is inferred: `RESEND_API_KEY` → `resend`, `SMTP_HOST` → `smtp`,
neither → `dry-run`. Set `MAIL_TRANSPORT` to override.

### Do we have to pay for it?

No, and probably not ever. Two separate questions get tangled here.

**"Do we need a paid plan?"** No. A weekly send to fewer than 100 confirmed
subscribers fits inside Resend's free tier with room to spare (3,000/month, and
the 100/day cap is the one that matters since a weekly send goes out in one day).
Past that, the cheap answer is not Resend Pro at $20/month — it is Amazon SES at
**$0.10 per 1,000 recipients** ([pricing](https://aws.amazon.com/ses/pricing/),
checked 2026-07-26), with no daily cap:

| Confirmed subscribers | Emails/month | Resend | SES |
|---|---|---|---|
| 50 | ~215 | free | ~$0.02 |
| 100 | ~430 | free (at the cap) | ~$0.04 |
| 500 | ~2,150 | $20/mo (daily cap) | ~$0.22 |
| 5,000 | ~21,500 | $20/mo | ~$2.15 |

SES is fiddlier to set up (sandbox removal, a support request for the sending
limit) and gives you a worse dashboard. It is also two orders of magnitude
cheaper and speaks the same SMTP, so switching is three environment variables.
Start free, and if the list ever grows enough to matter, move to SES.

**"Could we do the delivery ourselves and pay nobody?"** Technically yes: install
Postfix, point `SMTP_HOST=127.0.0.1 SMTP_PORT=25` at it, and this code sends
through it unchanged. What stops most people is not the software:

- **Port 25 egress is blocked on nearly every cloud.** Google Cloud blocks it
  permanently with no exceptions. DigitalOcean and Hetzner block it by default
  and unblock case by case, after account age and a support ticket. AWS, Azure
  and Oracle require a request too. Ports 587 and 465 — submission to a relay —
  stay open everywhere, which is exactly the shape the industry has settled on.
- **Reverse DNS is mandatory.** Gmail and Microsoft check that your sending IP
  has a PTR record resolving back to itself. Plenty of hosts do not let you set
  one.
- **A fresh cloud IP starts in the hole.** Large parts of VPS address space sit
  in Spamhaus's policy lists precisely because it is where spam comes from, so
  step one is often asking to be delisted for a reputation you have not built.
- **Microsoft is unforgiving of new small senders** — deferrals and silent drops
  are the norm until you enroll in SNDS/JMRP and accumulate history.
- **You inherit bounce and complaint handling.** A relay gives you suppression
  lists and webhooks; your own MTA gives you a mailbox full of DSNs that nobody
  reads while your reputation quietly rots. This sender does not process bounces
  today — that work is real, and it is the strongest argument against DIY.

So the honest trade is not money against independence. It is **a few cents a
month against a recurring operations job**, for zero gain in what actually
matters — the list, the consent record and the archive are already ours, and the
relay only ever sees one finished message at a time.

Run the preflight before deciding. It measures all of the above on the machine
you would actually send from, and sends nothing:

```
npm run newsletter:doctor -- --dkim-selector resend
```

```
port 25 egress (only needed to run our own MTA)
  warn  outbound 25 — timed out (blocked or filtered) — normal: most clouds
        block it (GCP permanently; DigitalOcean and Hetzner on request).
```

That one line is usually the end of the debate.

### Setting up Resend

Either transport works with it. SMTP first, since it keeps our own MIME
end to end:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587          # or 465 with SMTP_SECURE=1
SMTP_USER=resend       # literally "resend"
SMTP_PASS=re_…         # the API key
FROM_EMAIL=the-week@yourdomain.com
```

Or the HTTPS API, which needs no port to be open outbound:

```
RESEND_API_KEY=re_…
```

Before the first send:

1. **Verify a domain.** Resend is domain-first and has no shared-sender
   fallback, so `FROM_EMAIL` must be on a domain you have added and
   authenticated (it gives you the SPF/DKIM records; add a DMARC policy
   yourself). A `*.vercel.app` or `*.github.io` hostname cannot be verified —
   this needs a domain you own.
2. **Leave tracking off.** Open and click tracking are per-domain and
   [disabled by default](https://resend.com/docs/dashboard/domains/tracking).
   Leave them that way: open tracking injects a 1×1 pixel and click tracking
   rewrites every link through a redirector, which would quietly break the
   promise printed in every issue and on `/newsletter`. If you ever enable them,
   change those pages first.
3. **Mind the free tier's daily cap.** As of 2026-07-26 the free plan is 3,000
   emails a month *and 100 a day*; Pro is $20/month with no daily limit
   ([pricing](https://resend.com/pricing)). One weekly send to more than 100
   confirmed subscribers exceeds the free cap in a single run — the sender's
   resume log means the overflow can be re-sent the next day, but that is a
   symptom, not a plan. Upgrade at ~100 subscribers.
4. **Send to yourself first.** `node newsletter/send.mjs --test you@example.com`,
   then read it in Gmail *and* in a terminal client.

None of this is load-bearing for the architecture. Switching to SES later is
`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — the list never moves.

### Deliverability

Nothing here can rescue a domain with no mail reputation, so before the first
send: SPF, DKIM and DMARC on the sending domain, a `FROM_EMAIL` on a domain you
control, and a relay that signs DKIM for you. Send to yourself with `--test` and
read the result in Gmail and in a terminal client before sending to anyone else.

## Deploying the site on Vercel

Moving the *site* off GitHub Pages changes nothing here: the capture service is
deployed separately either way, and the site only needs its URL. Set
`PUBLIC_NEWSLETTER_API` in the Vercel project's environment variables instead of
as a repository variable, and remember Astro only exposes `PUBLIC_`-prefixed
variables to the browser bundle.

If you would rather have one deployment instead of two, the endpoint can move
into the Vercel project as a function, and the form becomes same-origin:

```
PUBLIC_NEWSLETTER_API=/api        # relative works: the form posts to /api/subscribe
```

Two things to know before you do that:

1. **The filesystem is not durable.** A serverless function gets a read-only
   filesystem apart from `/tmp`, which is per-instance and evaporates. The
   NDJSON store cannot live there — the list would be lost. It needs a database:
   Vercel Postgres or Neon (SQL, easy to `SELECT` a list out of), Turso, or
   Upstash Redis. `openStore()` is the seam: `get`, `getById`, `subscribe`,
   `confirm`, `unsubscribe`, `confirmed`, `all`, `stats`. Implement those eight
   against your store of choice and nothing else changes.
2. **Use the Node runtime and the `resend` transport.** The Edge runtime has no
   `node:net`, so the SMTP client cannot run there; and even on the Node runtime,
   an SMTP handshake inside a short-lived function is a worse bet than one
   HTTPS call.
3. **Set `CRON_SECRET`.** `vercel.json` schedules a daily `/api/cron-prune`
   call that drops unconfirmed addresses past the confirmation window — the
   privacy page's promise. Vercel authenticates its cron requests with
   `Authorization: Bearer $CRON_SECRET` once the variable exists; without it
   the route answers 404 and nothing prunes. (The long-lived `server.mjs`
   deployment needs none of this — it prunes itself daily.)

Keep the weekly send in GitHub Actions regardless. A send to a real list takes
minutes of wall-clock at a polite rate — longer than a serverless function
should live — and the workflow already exists, reads recipients over the admin
endpoint, and resumes cleanly. Vercel Cron is a fine trigger if you prefer, but
have it start a job, not do the sending.

Also worth updating when the domain changes: `site` and `base` in
`astro.config.mjs` (Vercel serves at the root, so `base` goes away), `SITE_URL`
for the service, and the sending domain in Resend.

## Send an issue

```
# render only — writes the HTML, prints the plain text, sends nothing
npm run newsletter:preview

# one real message, to you
node newsletter/send.mjs --test you@example.com

# the real thing (--yes is required; --week defaults to the newest issue)
node newsletter/send.mjs --week 2026-W30 --yes --rate 30
```

Every delivery is appended to `newsletter/data/sent/<week>.ndjson` and a re-run
skips anyone already in it, so an interrupted send is resumed by running the
same command again. Recipients come from the local list, or over HTTP from a
running service with `--api https://list.example.com` plus `ADMIN_TOKEN`.

## Bounces and complaints

A list that keeps mailing dead addresses is how a sending reputation dies. Both
halves are handled:

**Asynchronous — the relay tells us later.** Add a webhook in Resend pointing at
`https://your-host/webhooks/resend`, subscribe it to `email.bounced` and
`email.complained`, and put the `whsec_…` it gives you in `WEBHOOK_SECRET`. The
endpoint verifies the Svix signature (HMAC-SHA256 over `id.timestamp.body`, with
a five-minute replay window) before it believes anything — it suppresses
addresses, so an unauthenticated version would let a stranger cancel readers one
at a time. With no secret configured, every webhook is rejected.

**Synchronous — we saw it ourselves.** Over SMTP a dead mailbox is a `550` at
`RCPT TO`, known immediately with no webhook involved. The sender records it, via
`POST /admin/suppress` when it is running elsewhere, or straight to the store when
it is not.

Policy, in both paths:

- A **permanent** bounce suppresses immediately.
- A **transient** one (mailbox full, greylisted) does not: it is counted, and
  five in a row suppresses, because a mailbox that is full for five weeks is gone.
- A **complaint** is a harder no than an unsubscribe and is treated as final.
- Suppressed addresses can return, but only by re-subscribing and clicking the
  confirmation link — which is itself proof the mailbox is alive again.
- `email.opened` and `email.clicked` are **ignored even when offered**, and the
  relay's own tracking should stay switched off. `/newsletter` promises we cannot
  tell whether you read an issue.

## Where the list lives

Two stores, one contract (`test/store-contract.mjs`), chosen with
`NEWSLETTER_STORE` or inferred from the environment:

| | `ndjson` (default) | `postgres` |
|---|---|---|
| Where | a file you can back up with `cp` | Neon, Supabase, Vercel Postgres, your own |
| Needs | a durable filesystem and one writer | a connection string |
| Use when | a box, a container, a VM | serverless, where there is no disk |

A `DATABASE_URL` in the environment selects Postgres on its own, which is exactly
what Vercel's Neon integration injects — so a deployment there needs no extra
configuration. Use the **pooled** connection string; a function opening direct
connections exhausts the database's slots on the first burst. `pg` is an optional
dependency, imported only on that path.

The table is created on first connect. To run the contract against a real
database:

```
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/postgres \
  node --test newsletter/test/store-postgres.test.mjs
```

Without `TEST_DATABASE_URL` those cases skip, so CI stays green with no database.

## What is stored, and what is not

One line of NDJSON per state change, in `newsletter/data/subscribers.ndjson`
(or one row per address in Postgres):

```json
{"email":"reader@example.com","id":"kR3…","status":"confirmed","created":"…","confirmedAt":"…","source":"/weekly","ipHash":"9f2…"}
```

The address, an opaque id, the status, timestamps, the page the signup came
from, and an HMAC of the submitting IP (keyed with the service secret, truncated
to 96 bits) used only for rate limiting. Delivery failures add `bouncedAt`,
`bounceReason` and a soft-bounce counter, so a dead mailbox is not mailed twice.
No names, no enrichment, no profiles.

Not stored, because it is never collected: opens, clicks, user agents, or
anything else that would require a pixel or a redirect. The only numbers the list
produces are how many people are on it and how many messages were refused.

`/newsletter` tells readers exactly this, and one contract test enforces it: a
record may only carry the fields on that page, so a store that quietly adds one
fails the suite until the disclosure is updated or the field is dropped.

## The rules this implements

- **Double opt-in.** An address is `pending` until its signed link is clicked.
  Ignore the email and the record never becomes deliverable.
- **A confirm link is not an unsubscribe link.** Tokens are bound to a purpose,
  a subject and an expiry under one HMAC, so none of the three can be edited.
- **Unsubscribe links never expire.** An issue read in three years must still
  work; the alternative is a trapped reader.
- **One-click unsubscribe.** `List-Unsubscribe` plus `List-Unsubscribe-Post`
  (RFC 8058), so the mail client's own button works without a browser.
- **The subscribe endpoint reveals nothing.** A new address, an address already
  on the list, and a honeypot hit all get the same response.
- **Credentials never cross a plaintext link.** If a relay offers STARTTLS the
  client takes it; if it offers none and credentials are configured, the send
  is refused rather than downgraded.

## Testing

```
npm test        # node --test newsletter/test/*.test.mjs
```

The suite covers token forgery attempts, list durability (torn lines,
concurrent writes, compaction, restart), MIME and quoted-printable encoding
against the RFCs, the markdown renderer's escaping and link safety, the SMTP
conversation against a scripted fake relay (including a refused plaintext
`AUTH`), and the HTTP service end to end — honeypot, speed trap, rate limits,
CORS, the confirm and unsubscribe flows, and the admin endpoint.

One test renders the newest real digest and asserts that no link in it is
root-relative, because a `/developer-marketing/…` href works on the site and is
dead in an inbox.
