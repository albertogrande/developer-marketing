# The newsletter

The weekly digest, delivered by email. Self-hosted end to end: our list, our
templates, our sender, no Mailchimp, Substack or beehiiv anywhere in the path.
Zero runtime dependencies — everything here is Node's standard library.

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

### Deliverability

Nothing here can rescue a domain with no mail reputation, so before the first
send: SPF, DKIM and DMARC on the sending domain, a `FROM_EMAIL` on a domain you
control, and a submission relay that signs DKIM for you. Send to yourself with
`--test` and read the result in Gmail and in a terminal client before sending to
anyone else.

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
