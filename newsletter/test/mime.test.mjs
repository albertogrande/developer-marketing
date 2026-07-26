import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMessage,
  encodeWords,
  foldHeader,
  formatAddress,
  quotedPrintable,
  rfc5322Date,
} from '../lib/mime.mjs';
import { dotStuff } from '../lib/smtp.mjs';

test('dates are RFC 5322 and always UTC', () => {
  assert.equal(rfc5322Date(new Date('2026-07-27T07:00:00Z')), 'Mon, 27 Jul 2026 07:00:00 +0000');
  assert.equal(rfc5322Date(new Date('2026-01-05T23:09:03Z')), 'Mon, 5 Jan 2026 23:09:03 +0000');
});

test('ASCII headers are left alone', () => {
  assert.equal(encodeWords('The Week: launches and pricing'), 'The Week: launches and pricing');
});

test('non-ASCII headers become encoded words on character boundaries', () => {
  const subject = 'ércule, naïve — a subject with accents and an em dash';
  const encoded = encodeWords(subject);
  assert.match(encoded, /^=\?UTF-8\?B\?/);
  const decoded = encoded
    .split(/\r\n /)
    .map((word) => Buffer.from(word.replace(/^=\?UTF-8\?B\?/, '').replace(/\?=$/, ''), 'base64').toString('utf8'))
    .join('');
  assert.equal(decoded, subject, 'multi-byte characters survive the split');
  for (const word of encoded.split(/\r\n /)) assert.ok(word.length <= 75, `encoded word too long: ${word.length}`);
});

test('long headers fold onto continuation lines that start with whitespace', () => {
  const folded = foldHeader('List-Archive', `<https://example.com/weekly> ${'word '.repeat(30)}`);
  const [first, ...rest] = folded.split('\r\n');
  assert.ok(first.startsWith('List-Archive: <https://example.com/weekly>'));
  assert.ok(rest.length > 0, 'it actually folded');
  for (const line of [first, ...rest]) assert.ok(line.length <= 78, `line of ${line.length}`);
  for (const line of rest) assert.match(line, /^ /);
});

test('a long value with nowhere to fold stays on one line, not folded at the colon', () => {
  const url = `<https://list.example.com/unsubscribe?t=${'a'.repeat(160)}>`;
  const folded = foldHeader('List-Unsubscribe', url);
  assert.equal(folded, `List-Unsubscribe: ${url}`);
  assert.ok(folded.length < 998, 'still inside the hard line limit');
});

test('display names are quoted or encoded as needed', () => {
  assert.equal(formatAddress({ email: 'a@b.co' }), '<a@b.co>');
  assert.equal(formatAddress({ name: 'The Week', email: 'a@b.co' }), 'The Week <a@b.co>');
  assert.equal(
    formatAddress({ name: 'Dev Marketing, Ltd.', email: 'a@b.co' }),
    '"Dev Marketing, Ltd." <a@b.co>'
  );
  assert.match(formatAddress({ name: 'ércule', email: 'a@b.co' }), /^=\?UTF-8\?B\?.*\?= <a@b\.co>$/);
});

test('quoted-printable keeps every line inside 76 characters', () => {
  const body = 'Ein längerer Absatz über Entwicklermarketing, '.repeat(12);
  const encoded = quotedPrintable(body);
  for (const line of encoded.split('\r\n')) assert.ok(line.length <= 76, `line of ${line.length}`);
});

test('quoted-printable escapes what it must and round-trips', () => {
  const encoded = quotedPrintable('a = b\nnaïve\ntrailing space \nplain');
  assert.match(encoded, /a =3D b/);
  assert.match(encoded, /na=C3=AFve/);
  assert.match(encoded, /trailing space=20/, 'a line may not end in whitespace');

  const decoded = Buffer.from(
    encoded.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))),
    'binary'
  ).toString('utf8');
  assert.equal(decoded, 'a = b\r\nnaïve\r\ntrailing space \r\nplain');
});

test('a multipart message is well formed', () => {
  const raw = buildMessage({
    from: { name: 'The Week', email: 'week@example.com' },
    to: 'reader@example.org',
    subject: 'Issue 1',
    text: 'plain body',
    html: '<p>html body</p>',
    headers: { 'List-Unsubscribe': '<https://example.com/u?t=1>', Empty: '' },
    date: new Date('2026-07-27T07:00:00Z'),
    messageId: '<abc@example.com>',
  });

  const split = raw.indexOf('\r\n\r\n');
  const head = raw.slice(0, split);
  const body = raw.slice(split + 4);
  assert.match(head, /^From: The Week <week@example\.com>/m);
  assert.match(head, /^To: reader@example\.org$/m);
  assert.match(head, /^Subject: Issue 1$/m);
  assert.match(head, /^Date: Mon, 27 Jul 2026 07:00:00 \+0000$/m);
  assert.match(head, /^Message-ID: <abc@example\.com>$/m);
  assert.match(head, /^MIME-Version: 1\.0$/m);
  assert.match(head, /^List-Unsubscribe: <https:\/\/example\.com\/u\?t=1>$/m);
  assert.ok(!/^Empty:/m.test(head), 'empty headers are dropped');

  const boundary = head.match(/boundary="([^"]+)"/)[1];
  assert.equal(raw.split(`--${boundary}`).length - 1, 3, 'two parts plus the closing delimiter');
  assert.match(body, /Content-Type: text\/plain; charset=utf-8/);
  assert.match(body, /Content-Type: text\/html; charset=utf-8/);
  assert.ok(raw.trimEnd().endsWith(`--${boundary}--`));
  assert.ok(!raw.includes('\n\n'), 'CRLF only, no bare newlines');
});

test('a text-only message skips the multipart wrapper', () => {
  const raw = buildMessage({
    from: { email: 'a@b.co' },
    to: 'c@d.co',
    subject: 'plain',
    text: 'just text',
  });
  assert.match(raw, /Content-Type: text\/plain; charset=utf-8/);
  assert.ok(!raw.includes('multipart/alternative'));
});

test('a message with no plain-text part is refused', () => {
  assert.throws(
    () => buildMessage({ from: { email: 'a@b.co' }, to: 'c@d.co', subject: 's', text: '', html: '<p>x</p>' }),
    /text\/plain alternative is required/
  );
});

test('a line of a single dot cannot end the DATA payload early', () => {
  assert.equal(dotStuff('line one\r\n.\r\nline two\r\n'), 'line one\r\n..\r\nline two\r\n');
  assert.equal(dotStuff('.hidden\r\n'), '..hidden\r\n');
  assert.equal(dotStuff('nothing to do\r\n'), 'nothing to do\r\n');
});
