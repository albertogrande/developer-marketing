// Renders the newest real weekly digest as an email and checks the properties
// that matter once a message has left the building: no dead links, no tracking,
// a plain-text half, and an unsubscribe that works.

import test from 'node:test';
import assert from 'node:assert/strict';
import { latestIssueId, listIssues, loadIssue } from '../lib/issues.mjs';
import { issueEmail, confirmEmail } from '../lib/templates.mjs';
import { buildMessage } from '../lib/mime.mjs';

const SITE = 'https://albertogrande.github.io/developer-marketing';
const UNSUB = 'https://list.example.test/unsubscribe?t=token';

const week = latestIssueId();
const hasIssues = Boolean(week);

test('the weekly directory is readable and ordered newest first', () => {
  const issues = listIssues();
  assert.ok(issues.length > 0, 'no weekly issues found — is the content still at src/content/weekly?');
  assert.deepEqual(issues, [...issues].sort().reverse());
});

test('a bad week id is refused rather than guessed at', () => {
  assert.throws(() => loadIssue('nonsense'), /ISO week id/);
  assert.throws(() => loadIssue('1999-W99'), /no issue at/);
});

test('the newest issue renders to a sendable message', { skip: !hasIssues }, () => {
  const issue = loadIssue(week);
  const mail = issueEmail({
    issue,
    siteUrl: SITE,
    webUrl: `${SITE}/weekly/${week}`,
    unsubscribeUrl: UNSUB,
  });

  assert.ok(mail.subject.includes(issue.title), 'the subject carries the issue title');
  assert.ok(mail.text.length > 200, 'the plain-text half is real, not a stub');
  assert.ok(mail.html.includes('<!doctype html>'));
  assert.ok(mail.html.includes(UNSUB), 'the HTML carries the unsubscribe link');
  assert.ok(mail.text.includes(UNSUB), 'so does the plain text');
  assert.ok(mail.html.includes(`${SITE}/weekly/${week}`), 'and a link to the web version');

  // The whole point of running the list ourselves.
  assert.ok(!/<img/i.test(mail.html), 'no images means no open tracking');
  assert.ok(!/utm_|\?ref=|\/track\//i.test(mail.html), 'no click tracking parameters');
  assert.ok(!/<script/i.test(mail.html));
});

test('site-internal links come out absolute, not root-relative', { skip: !hasIssues }, () => {
  const issue = loadIssue(week);
  const mail = issueEmail({ issue, siteUrl: SITE, webUrl: `${SITE}/weekly/${week}`, unsubscribeUrl: UNSUB });

  const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length > 0);
  for (const href of hrefs) {
    assert.ok(
      /^(https?:|mailto:)/.test(href) || href === '#',
      `"${href}" would be a dead link in an inbox`
    );
  }
  // The plain text must not leave bare site paths either.
  for (const match of mail.text.matchAll(/<([^>\s]+)>/g)) {
    const url = match[1];
    if (url.includes('@')) continue; // an email address in prose
    assert.ok(/^https?:/.test(url), `plain text link "${url}" is not absolute`);
  }
});

test('the rendered issue survives MIME assembly', { skip: !hasIssues }, () => {
  const issue = loadIssue(week);
  const mail = issueEmail({ issue, siteUrl: SITE, webUrl: `${SITE}/weekly/${week}`, unsubscribeUrl: UNSUB });
  const raw = buildMessage({
    from: { name: 'The Week', email: 'week@example.com' },
    to: 'reader@example.org',
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    headers: {
      'List-Unsubscribe': `<${UNSUB}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });

  assert.match(raw, /^List-Unsubscribe-Post: List-Unsubscribe=One-Click$/m);
  for (const line of raw.split('\r\n')) {
    assert.ok(line.length <= 998, `line of ${line.length} exceeds the RFC 5322 hard limit`);
  }
  assert.ok(!raw.includes('\n\n'), 'CRLF throughout');
});

test('a long link survives quoted-printable intact', () => {
  // Confirm and unsubscribe URLs are ~130 characters, so the encoder soft-wraps
  // them. That is correct, and it is also the classic way to ship a subtly
  // broken opt-in link — so decode the built message the way a mail client does
  // and check the URL comes back byte for byte.
  const confirmUrl = `https://list.example.test/confirm?t=${'v1.confirm.aGVsbG8.0.'}${'x'.repeat(64)}`;
  const mail = confirmEmail({ siteUrl: SITE, confirmUrl });
  const raw = buildMessage({
    from: { name: 'The Week', email: 'week@example.com' },
    to: 'reader@example.org',
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });

  const decoded = raw
    .replace(/=\r\n/g, '') // soft line breaks
    .replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  const occurrences = decoded.split(confirmUrl).length - 1;
  assert.equal(occurrences, 3, 'the URL appears whole in the button, the fallback and the plain text');
});

test('the confirmation email is one link and no marketing', () => {
  const mail = confirmEmail({ siteUrl: SITE, confirmUrl: 'https://list.example.test/confirm?t=abc' });
  assert.match(mail.subject, /^Confirm your subscription/);
  assert.ok(mail.html.includes('https://list.example.test/confirm?t=abc'));
  assert.ok(mail.text.includes('https://list.example.test/confirm?t=abc'));
  assert.ok(!/<img/i.test(mail.html));
  // Says plainly that ignoring it is the end of the matter.
  assert.match(mail.text, /Ignore this email/i);
});
