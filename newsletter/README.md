# The newsletter

The weekly digest, delivered by email. Self-hosted end to end: our list, our
templates, our sender, no Mailchimp, Substack or beehiiv anywhere in the path.
Zero runtime dependencies — everything here is Node's standard library.

The one thing worth buying is the pipe. See
[Transports: do we need Resend?](#transports-do-we-need-resend) — short answer,
yes, and it costs one env var either way.

A guide that tells people to respect developers cannot run its own list through
a service that pixel-tracks them. So it doesn't.

```
newsletter/
  server.mjs        the capture service: subscribe, confirm, unsubscribe
  send.mjs          the sender: one issue → the confirmed list
  lib/
    config.mjs      environment → config, with fail-fast validation
    store.mjs       the list: append-only NDJSON, replayed into memory
    tokens.mjs      HMAC-signed confirm/unsubscribe links
    transport.mjs   how mail leaves: smtp | resend | dry-run
    smtp.mjs        an SMTP client (EHLO, STARTTLS, AUTH, MAIL/RCPT/DATA)
    mime.mjs        RFC 5322 headers, RFC 2047 encoding, quoted-printable
    markdown.mjs    the markdown subset the digests use → HTML + plain text
    templates.mjs   the two emails: confirmation, issue
    issues.mjs      reads src/content/weekly/<YYYY-Www>.md
  test/             69 tests: node --test newsletter/test/*.test.mjs
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
                                                    reads src/content/weekly/,
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

## What is stored, and what is not

One line of NDJSON per state change, in `newsletter/data/subscribers.ndjson`:

```json
{"email":"reader@example.com","id":"kR3…","status":"confirmed","created":"…","confirmedAt":"…","source":"/weekly","ipHash":"9f2…"}
```

The address, an opaque id, the status, timestamps, the page the signup came
from, and an HMAC of the submitting IP (keyed with the service secret, truncated
to 96 bits) used only for rate limiting. No names, no enrichment, no profiles.

Not stored, because it is never collected: opens, clicks, user agents, or
anything else that would require a pixel or a redirect. The only number the list
produces is how many people are on it.

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
