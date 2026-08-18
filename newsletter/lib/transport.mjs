// How a finished message actually leaves the building.
//
// Owning the list, the templates and the sending logic is the point. Owning the
// *pipe* is not: injecting mail into the internet from your own MTA means IP
// warm-up, reverse DNS, blocklist monitoring and a reputation you cannot buy
// back once it is gone. So a relay is a dependency worth having — and this is
// the one place that knows about it, so swapping it is one env var.
//
//   MAIL_TRANSPORT=smtp      our own SMTP client → any relay (Resend, SES, …)
//   MAIL_TRANSPORT=resend    Resend's HTTPS API — for hosts where outbound
//                            SMTP is awkward, e.g. serverless functions
//   MAIL_TRANSPORT=dry-run    writes .eml files to $DATA_DIR/outbox
//
// Unset, it is inferred: RESEND_API_KEY → resend, SMTP_HOST → smtp, neither →
// dry-run, so a fresh checkout runs with no mail server at all.
//
// Trade-off worth knowing: over SMTP the bytes on the wire are the ones
// mime.mjs built, headers and encoding included. Over the HTTP API, Resend
// assembles the MIME from the fields we hand it — custom headers survive
// (List-Unsubscribe included) but the assembly is theirs. Both are honest
// choices; SMTP is the one with no assembly you cannot inspect.

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildMessage } from './mime.mjs';
import { SmtpClient } from './smtp.mjs';

/**
 * A send failure the caller can act on. `permanent` decides retry-or-drop:
 * 4xx-permanent means this recipient will never work, temporary means the relay
 * is busy and the same message is worth trying again.
 */
export class MailError extends Error {
  constructor(message, { permanent = false, status = 0, detail = '' } = {}) {
    super(message);
    this.name = 'MailError';
    this.permanent = permanent;
    this.status = status;
    this.detail = detail;
  }
}

/** True for anything the sender should retry rather than drop. */
export const isTemporary = (err) => err?.permanent === false;

// ---------------------------------------------------------------------------
// dry run — the default when nothing is configured
// ---------------------------------------------------------------------------
function dryRunTransport(config, log) {
  return {
    name: 'dry-run',
    async send({ to, subject, text, html, headers, attachments }) {
      const raw = buildMessage({
        from: { name: config.fromName, email: config.fromEmail },
        to,
        subject,
        text,
        html,
        headers,
        attachments,
      });
      const dir = join(config.dataDir, 'outbox');
      await mkdir(dir, { recursive: true });
      // Write it out rather than swallowing it: you can open the .eml and read
      // exactly what a subscriber would have received.
      const file = join(dir, `${Date.now()}-${to.replace(/[^a-z0-9]+/gi, '_')}.eml`);
      await writeFile(file, raw, 'utf8');
      log(`mail[dry-run] → ${to} · ${subject} · ${file}`);
      return { transport: 'dry-run', file };
    },
    async close() {},
  };
}

// ---------------------------------------------------------------------------
// smtp — our client, one session across many recipients
// ---------------------------------------------------------------------------
function smtpTransport(config, log) {
  const options = { ...config.smtp, name: hostnameOf(config.siteUrl) };
  let client = null;
  let sinceConnect = 0;
  // Relays get unhappy about very long sessions; a fresh one every hundred
  // messages is cheap insurance.
  const maxPerConnection = 100;

  const connect = async () => {
    client = await new SmtpClient(options).connect();
    sinceConnect = 0;
    return client;
  };

  return {
    name: 'smtp',
    async send({ to, subject, text, html, headers, attachments }) {
      const raw = buildMessage({
        from: { name: config.fromName, email: config.fromEmail },
        to,
        subject,
        text,
        html,
        headers,
        attachments,
      });

      if (!client || sinceConnect >= maxPerConnection) {
        if (client) await client.quit().catch(() => {});
        await connect();
      }

      try {
        const reply = await client.send({ from: config.fromEmail, to, raw });
        sinceConnect++;
        log(`mail[smtp] → ${to} · ${subject}`);
        return { transport: 'smtp', response: reply?.text };
      } catch (err) {
        const permanent = err?.permanent === true;
        // Keep the session usable after a rejected recipient; if RSET itself
        // fails the connection is gone, so drop it and reconnect on the next
        // message.
        if (client) {
          await client.reset().catch(async () => {
            await client.quit().catch(() => {});
            client = null;
          });
        }
        throw new MailError(err?.message || 'smtp send failed', {
          permanent,
          status: err?.code ?? 0,
          detail: err?.response ?? '',
        });
      }
    },
    async close() {
      if (client) await client.quit().catch(() => {});
      client = null;
    },
  };
}

// ---------------------------------------------------------------------------
// resend — HTTPS API, for hosts where holding a TCP session open is awkward
// ---------------------------------------------------------------------------
function resendTransport(config, log, { fetchImpl = fetch } = {}) {
  const endpoint = `${config.resend.baseUrl.replace(/\/+$/, '')}/emails`;

  return {
    name: 'resend',
    async send({ to, subject, text, html, headers = {}, attachments = [] }) {
      // Resend rejects unknown/reserved header names; the List-* headers and
      // Precedence are the ones that matter for bulk mail and they pass through.
      const payload = {
        from: config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail,
        to: [to],
        subject,
        text,
        ...(html ? { html } : {}),
        ...(config.replyTo ? { reply_to: config.replyTo } : {}),
        ...(Object.keys(headers).length ? { headers } : {}),
        // Resend takes attachments as base64 fields and builds the MIME its
        // way — the same trade-off the note at the top of this file describes.
        ...(attachments.length
          ? {
              attachments: attachments.map((a) => ({
                filename: a.filename,
                content: Buffer.from(a.content).toString('base64'),
                ...(a.contentType ? { content_type: a.contentType } : {}),
              })),
            }
          : {}),
      };

      let res;
      try {
        res = await fetchImpl(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${config.resend.apiKey}`,
            'content-type': 'application/json',
            // Same address + same issue twice is the same send, not two.
            ...(headers['X-Idempotency-Key'] ? { 'Idempotency-Key': headers['X-Idempotency-Key'] } : {}),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(config.smtp.timeoutMs),
        });
      } catch (err) {
        // A network fault or a timeout: the message itself may be fine.
        throw new MailError(`resend: ${err?.message || 'request failed'}`, { permanent: false });
      }

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 429 and 5xx are worth retrying; a rejected address or an invalid
        // payload never will be.
        const permanent = !(res.status === 429 || res.status >= 500);
        throw new MailError(`resend: ${body?.message || res.statusText} (${res.status})`, {
          permanent,
          status: res.status,
          detail: JSON.stringify(body).slice(0, 300),
        });
      }

      log(`mail[resend] → ${to} · ${subject} · ${body?.id ?? 'no id'}`);
      return { transport: 'resend', id: body?.id };
    },
    async close() {},
  };
}

const hostnameOf = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
};

/**
 * Build the configured transport. `log` is injected so the service and the
 * sender can each label their own output.
 */
export function createTransport(config, log = () => {}, deps = {}) {
  switch (config.transport) {
    case 'resend':
      if (!config.resend.apiKey) throw new Error('MAIL_TRANSPORT=resend but RESEND_API_KEY is not set');
      return resendTransport(config, log, deps);
    case 'smtp':
      if (!config.smtp.host) throw new Error('MAIL_TRANSPORT=smtp but SMTP_HOST is not set');
      return smtpTransport(config, log);
    case 'dry-run':
      return dryRunTransport(config, log);
    default:
      throw new Error(`unknown MAIL_TRANSPORT "${config.transport}" (smtp | resend | dry-run)`);
  }
}
