#!/usr/bin/env node
// Deliver a pipeline alert to a human, by email.
//
// The desks already fail loudly *inside GitHub*: writer-guard fails the job,
// notify-failure opens or comments a pipeline-failure issue, and health.mjs
// catches the schedule going quiet. On 2026-08-02/03 every one of those fired
// correctly — issues #15 and #17 were open the whole time — and the silence
// was still discovered by a human loading the site three days later. Detection
// was never the problem. Delivery was.
//
// So this is the last hop: it takes an alert and puts it in an inbox. It
// reuses the newsletter's own transport rather than adding a second way to
// send mail, which means it inherits the same relay, the same From: identity,
// and the same "swapping providers is one env var" property.
//
//   ALERT_EMAIL_TO   comma-separated recipients. Unset ⇒ this is a no-op, so
//                    forks and pre-launch checkouts stay quiet.
//   ALERT_SUBJECT    subject line.
//   ALERT_BODY       plain-text body.
//
// Mail config comes from the newsletter's env (FROM_EMAIL, SMTP_*, or
// RESEND_API_KEY) — see newsletter/.env.example.
//
// Exit code is 0 even when sending fails. An alert is a courtesy copy: the
// issue is the durable record, and a dead relay must never turn one red
// workflow into two. Failures print ::warning:: so they show up in the log.

import { config } from '../newsletter/lib/config.mjs';
import { createTransport } from '../newsletter/lib/transport.mjs';

const recipients = (process.env.ALERT_EMAIL_TO || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const subject = process.env.ALERT_SUBJECT || 'Pipeline alert';
const text = process.env.ALERT_BODY || '(no detail supplied)';

if (recipients.length === 0) {
  console.log(
    'send-alert: ALERT_EMAIL_TO is unset — no email sent. The pipeline-failure issue is still the record.'
  );
  process.exit(0);
}

// dry-run writes .eml files to disk, which on an ephemeral runner is the same
// as doing nothing — and doing nothing silently is the bug being fixed here.
if (config.transport === 'dry-run') {
  console.log(
    '::warning::send-alert: ALERT_EMAIL_TO is set but no mail transport is configured (need SMTP_HOST or RESEND_API_KEY), so the alert cannot leave the runner. Configure one, or the only notice of a failure is the GitHub issue.'
  );
  process.exit(0);
}

const transport = createTransport(config, (m) => console.log(m));
let delivered = 0;

for (const to of recipients) {
  try {
    await transport.send({
      to,
      subject,
      text,
      headers: {
        // Keeps autoresponders and vacation replies from answering a robot,
        // and lets the recipient filter these into their own folder.
        'Auto-Submitted': 'auto-generated',
        'X-Alert-Source': 'developer-marketing-pipeline',
      },
    });
    delivered++;
  } catch (err) {
    console.log(
      `::warning::send-alert: could not deliver to ${to} — ${err?.message || err}`
    );
  }
}

await transport.close?.().catch?.(() => {});
console.log(
  `send-alert: delivered ${delivered}/${recipients.length} via ${transport.name}.`
);
