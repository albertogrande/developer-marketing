#!/usr/bin/env node
// Mails one issue to an e-reader, as a document rather than as a newsletter.
//
//   node scripts/send-to-kindle.mjs                  # the newest issue
//   node scripts/send-to-kindle.mjs --week 2026-W32
//   node scripts/send-to-kindle.mjs --dry-run        # build it, send nothing
//
// Two decisions worth knowing about.
//
// HTML, not EPUB. Amazon's Send-to-Kindle converter rejected 2026-W32 as an
// EPUB with a bare "error E999" — three times, including under a different
// filename — while epubcheck validated the same book clean against EPUB 3.3
// and the neighbouring issue converted fine. The HTML build of that issue went
// through on the first try. The error is opaque and reproduces only on their
// side, so this takes the path that works.
//
// The repo's own mailer, not a second one. `newsletter/lib/transport.mjs` is
// already the one place that knows how mail leaves the building (smtp /
// resend / dry-run, inferred from env), so this borrows it rather than
// growing a parallel sender with its own credentials.
//
// Recipients are personal addresses and never live in the repo: KINDLE_ADDRESS
// carries them (comma-separated for more than one device). Unset, this exits
// successfully having done nothing, the same way newsletter.yml treats an
// unconfigured list — a fork must not be permanently red.

import { config } from '../newsletter/lib/config.mjs';
import { createTransport } from '../newsletter/lib/transport.mjs';
import { latestIssueId, loadIssue } from '../newsletter/lib/issues.mjs';
import { buildHtml } from './issues-to-epub.mjs';
import { SITE_URL } from '../site.config.mjs';

const ISSUES_DIR = 'src/content/issues';

export function parseArgs(argv) {
  const args = { week: '', dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--week') args.week = String(argv[++i] ?? '');
    else if (argv[i] === '--dry-run') args.dryRun = true;
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  return args;
}

/** Comma-separated addresses, blank entries dropped. */
export const recipientsFrom = (value) =>
  String(value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// What a Kindle shows in its library is the document's title, so the subject
// line is decoration — but a person reading their sent mail wants to know
// which issue went out.
export const subjectFor = (issue, week) => `The Beat — ${week}: ${issue.title}`;

export const bodyFor = (issue, week) =>
  [
    issue.title,
    '',
    issue.summary ?? '',
    '',
    `Read it on the web: ${SITE_URL}/issues/${week}`,
    '',
    'Attached as HTML for Send-to-Kindle.',
  ].join('\n');

export async function sendIssue({ week: requestedWeek, dryRun = false }, log = console.log) {
  const recipients = recipientsFrom(process.env.KINDLE_ADDRESS);
  if (!recipients.length) {
    log('send-to-kindle: KINDLE_ADDRESS is not set — nothing to do.');
    return { sent: 0, skipped: true };
  }

  const week = requestedWeek || latestIssueId();
  if (!week) throw new Error('no issues found in src/content/issues');
  // loadIssue throws when the file is missing, which is the loud failure the
  // newsletter workflow's comment argues for: a wrong or absent week must
  // never quietly become last week's issue.
  const issue = loadIssue(week);

  const html = buildHtml(`${ISSUES_DIR}/${week}.md`, week);
  const attachment = {
    filename: `the-beat-${week}.html`,
    contentType: 'text/html',
    content: html,
  };

  log(`issue     ${week} — ${issue.title}`);
  log(`document  ${attachment.filename} · ${(html.length / 1024).toFixed(1)} KB`);
  log(`from      ${config.fromEmail}`);
  log(`to        ${recipients.join(', ')}`);

  if (dryRun) {
    log('send-to-kindle: --dry-run, sending nothing.');
    return { sent: 0, week, skipped: false, dryRun: true };
  }

  const transport = createTransport(config, (line) => log(line));
  let sent = 0;
  try {
    for (const to of recipients) {
      await transport.send({
        to,
        subject: subjectFor(issue, week),
        text: bodyFor(issue, week),
        attachments: [attachment],
        // Amazon replies to the sending address on a conversion failure; a
        // list header on a personal-document mail would be a lie anyway.
        headers: {},
      });
      sent++;
    }
  } finally {
    await transport.close();
  }

  log(`send-to-kindle: ${sent}/${recipients.length} sent via ${transport.name}.`);
  return { sent, week, skipped: false };
}

if (process.argv[1]?.endsWith('send-to-kindle.mjs')) {
  try {
    const result = await sendIssue(parseArgs(process.argv.slice(2)));
    // A skipped run is a success: nothing configured, nothing owed.
    process.exit(result.sent === 0 && !result.skipped && !result.dryRun ? 1 : 0);
  } catch (e) {
    console.error(`send-to-kindle: ${e.message}`);
    process.exit(1);
  }
}
