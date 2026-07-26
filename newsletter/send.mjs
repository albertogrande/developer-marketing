#!/usr/bin/env node
// The sender. Takes one published weekly digest and delivers it to the
// confirmed list, one SMTP session, one message per recipient.
//
//   node newsletter/send.mjs --dry-run --out /tmp/issue.html   # render, send nothing
//   node newsletter/send.mjs --test me@example.com             # one real message
//   node newsletter/send.mjs --week 2026-W29 --yes             # the real thing
//
// Safety rails, in order of how much they have saved someone at some point:
//   * a real send refuses to start without --yes
//   * every delivery is appended to data/sent/<week>.ndjson, and a re-run skips
//     anyone already in it, so a crash halfway through costs nothing
//   * --rate throttles to whatever the relay will tolerate
//   * a permanent (5xx) rejection drops that recipient and keeps going; a
//     temporary (4xx) one is retried once
//
// Recipients come from the local store, or over HTTP from the capture service
// (--api) when the sender runs somewhere else, like CI.

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './lib/config.mjs';
import { openStore } from './lib/store.mjs';
import { sign } from './lib/tokens.mjs';
import { buildMessage } from './lib/mime.mjs';
import { SmtpClient, SmtpError } from './lib/smtp.mjs';
import { issueEmail } from './lib/templates.mjs';
import { loadIssue, latestIssueId } from './lib/issues.mjs';

const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseArgs(argv) {
  const args = { rate: 60, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    switch (arg) {
      case '--week': args.week = next(); break;
      case '--dry-run': args.dryRun = true; break;
      case '--out': args.out = next(); break;
      case '--test': args.test = next(); break;
      case '--limit': args.limit = Number(next()); break;
      case '--rate': args.rate = Number(next()); break;
      case '--list': args.list = next(); break;
      case '--api': args.api = next(); break;
      case '--yes': args.yes = true; break;
      case '--help': case '-h': args.help = true; break;
      default:
        throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

const USAGE = `
newsletter/send.mjs — deliver one weekly issue

  --week <YYYY-Www>   issue to send (default: the newest in src/content/weekly)
  --dry-run           render and report, send nothing
  --out <file>        write the rendered HTML (works with --dry-run)
  --test <email>      send one real message to this address only
  --limit <n>         stop after n recipients
  --rate <n>          messages per minute (default 60)
  --list <file>       subscriber NDJSON (default $DATA_DIR/subscribers.ndjson)
  --api <url>         fetch recipients from a running service instead
  --yes               required for a real send to the list

Environment: NEWSLETTER_SECRET, PUBLIC_BASE_URL, SITE_URL, SMTP_*, FROM_EMAIL,
ADMIN_TOKEN (with --api). See newsletter/README.md.
`;

/** Confirmed subscribers, from the service over HTTP or from the file. */
async function loadRecipients({ api, list }) {
  if (api) {
    const url = `${api.replace(/\/+$/, '')}/admin/subscribers`;
    const res = await fetch(url, { headers: { authorization: `Bearer ${config.adminToken}` } });
    if (!res.ok) throw new Error(`recipients: ${url} returned ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.subscribers)) throw new Error('recipients: malformed response');
    return data.subscribers;
  }
  const store = await openStore(config.dataDir, list ? { file: list } : {});
  return store.confirmed().map((r) => ({ email: r.email, id: r.id }));
}

/** Addresses already delivered for this issue — the resume log. */
async function loadSent(week) {
  const path = join(config.dataDir, 'sent', `${week}.ndjson`);
  if (!existsSync(path)) return { path, done: new Set() };
  const raw = await readFile(path, 'utf8');
  const done = new Set();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const rec = JSON.parse(line);
      if (rec.ok && rec.email) done.add(rec.email);
    } catch {
      /* a torn line just means one address gets a second attempt */
    }
  }
  return { path, done };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return void log(USAGE);

  if (!config.secret || config.secret.length < 32) {
    throw new Error('NEWSLETTER_SECRET must be set (the same secret the service signs with)');
  }

  const week = args.week || latestIssueId();
  if (!week) throw new Error('no issues found in src/content/weekly');
  const issue = loadIssue(week);
  const webUrl = `${config.siteUrl}/weekly/${week}`;
  const base = (process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  if (!base) throw new Error('PUBLIC_BASE_URL must point at the capture service (it signs the unsubscribe links)');

  log(`issue   ${week} — ${issue.title}`);
  log(`web     ${webUrl}`);

  // A preview needs a token like any other message; a throwaway id keeps the
  // rendered file from carrying a real subscriber's unsubscribe link.
  const previewToken = sign(config.secret, 'unsubscribe', 'preview', 0);
  const preview = issueEmail({
    issue,
    siteUrl: config.siteUrl,
    webUrl,
    unsubscribeUrl: `${base}/unsubscribe?t=${encodeURIComponent(previewToken)}`,
  });
  log(`subject ${preview.subject}`);

  if (args.out) {
    await writeFile(args.out, preview.html, 'utf8');
    log(`wrote   ${args.out} (${Buffer.byteLength(preview.html)} bytes html, ${Buffer.byteLength(preview.text)} bytes text)`);
  }

  // --- who gets it ---------------------------------------------------------
  let recipients;
  if (args.test) {
    recipients = [{ email: args.test, id: 'test' }];
  } else {
    recipients = await loadRecipients(args);
  }

  const { path: sentPath, done } = args.test ? { path: null, done: new Set() } : await loadSent(week);
  const queue = recipients.filter((r) => !done.has(r.email)).slice(0, args.limit);
  log(`list    ${recipients.length} confirmed · ${done.size} already sent · ${queue.length} to send`);

  if (args.dryRun) {
    log('\n--- text alternative ---\n');
    log(preview.text);
    log('\ndry run: nothing sent.');
    return;
  }
  if (!queue.length) return void log('nothing to do.');
  if (!args.test && !args.yes) {
    throw new Error('refusing to send to the list without --yes');
  }
  if (config.dryRun) {
    throw new Error('MAIL_DRY_RUN is set (or SMTP_HOST is missing) — configure SMTP before a real send');
  }

  // --- send ----------------------------------------------------------------
  if (sentPath) await mkdir(join(config.dataDir, 'sent'), { recursive: true });
  const gapMs = args.rate > 0 ? Math.max(0, Math.round(60_000 / args.rate)) : 0;
  const smtp = { ...config.smtp, name: new URL(config.siteUrl).hostname };

  let client = await new SmtpClient(smtp).connect();
  let sent = 0;
  let failed = 0;
  let sinceConnect = 0;

  const record = async (entry) => {
    if (sentPath) await appendFile(sentPath, JSON.stringify(entry) + '\n', 'utf8');
  };

  for (const person of queue) {
    // Relays get unhappy about very long sessions; a fresh one every 100
    // messages is cheap insurance.
    if (sinceConnect >= 100) {
      await client.quit();
      client = await new SmtpClient(smtp).connect();
      sinceConnect = 0;
    }

    const token = sign(config.secret, 'unsubscribe', person.id, 0);
    const unsubscribeUrl = `${base}/unsubscribe?t=${encodeURIComponent(token)}`;
    const mail = issueEmail({ issue, siteUrl: config.siteUrl, webUrl, unsubscribeUrl });
    const raw = buildMessage({
      from: { name: config.fromName, email: config.fromEmail },
      to: person.email,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      headers: {
        'List-Id': `<${config.listId}>`,
        'List-Unsubscribe': `<${unsubscribeUrl}>${config.replyTo ? `, <mailto:${config.replyTo}?subject=unsubscribe>` : ''}`,
        // RFC 8058: lets the client's own unsubscribe button work without
        // opening a browser, which mailbox providers now expect from bulk mail.
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-Archive': `<${config.siteUrl}/weekly>`,
        ...(config.replyTo ? { 'Reply-To': config.replyTo } : {}),
        Precedence: 'bulk',
      },
    });

    try {
      await client.send({ from: config.fromEmail, to: person.email, raw });
      sent++;
      sinceConnect++;
      await record({ ok: true, email: person.email, id: person.id, at: new Date().toISOString() });
      if (sent % 25 === 0) log(`  … ${sent}/${queue.length}`);
    } catch (err) {
      const smtpErr = err instanceof SmtpError ? err : null;
      // Temporary failure: one retry on a fresh connection, then move on.
      if (smtpErr && !smtpErr.permanent) {
        try {
          await client.quit().catch(() => {});
          client = await new SmtpClient(smtp).connect();
          sinceConnect = 0;
          await client.send({ from: config.fromEmail, to: person.email, raw });
          sent++;
          sinceConnect++;
          await record({ ok: true, email: person.email, id: person.id, at: new Date().toISOString(), retried: true });
          continue;
        } catch (retryErr) {
          err = retryErr;
        }
      }
      failed++;
      console.error(`  ! ${person.email}: ${err.message}`);
      await record({ ok: false, email: person.email, id: person.id, at: new Date().toISOString(), error: err.message });
      // Keep the session usable after a rejected recipient.
      await client.reset().catch(async () => {
        client = await new SmtpClient(smtp).connect();
        sinceConnect = 0;
      });
    }

    if (gapMs) await sleep(gapMs);
  }

  await client.quit();
  log(`\ndone: ${sent} sent, ${failed} failed${sentPath ? ` · log ${sentPath}` : ''}`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`send: ${err.message}`);
  process.exit(1);
});
