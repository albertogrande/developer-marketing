// Message construction: RFC 5322 headers, RFC 2047 header encoding, RFC 2045
// quoted-printable bodies, multipart/alternative for text + HTML.
//
// Written out rather than pulled in because the surface we need is small and
// completely specified, and because a mail sender you cannot read line by line
// is a mail sender you cannot debug when a message lands in spam.

import { randomBytes } from 'node:crypto';

const CRLF = '\r\n';
const MAX_LINE = 76; // RFC 2045 §6.7: at most 76 characters, soft breaks included

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

/** RFC 5322 date, always in UTC: "Mon, 27 Jul 2026 07:00:00 +0000". */
export function rfc5322Date(d = new Date()) {
  return (
    `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`
  );
}

const isAscii = (s) => !/[^\x20-\x7e]/.test(s);

/**
 * RFC 2047 encoded-words for non-ASCII header text. Split on UTF-8 character
 * boundaries so a multi-byte character is never cut in half across words.
 */
export function encodeWords(value) {
  const str = String(value);
  if (isAscii(str)) return str;
  const words = [];
  let chunk = '';
  // 45 base64 output chars ≈ 33 input bytes; stay well inside the 75-char limit
  // that "=?UTF-8?B?" + "?=" leaves us.
  for (const ch of str) {
    if (Buffer.byteLength(chunk + ch, 'utf8') > 33) {
      words.push(chunk);
      chunk = '';
    }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${Buffer.from(w, 'utf8').toString('base64')}?=`).join(`${CRLF} `);
}

/**
 * Fold a header onto continuation lines at whitespace, near 78 columns.
 *
 * The 78-column limit is a SHOULD (RFC 5322 §2.1.1); only 998 is a MUST. So a
 * value with nowhere to fold — a long unsubscribe URL, say — is left long
 * rather than folded straight after the colon, which some receivers mishandle.
 */
export function foldHeader(name, value) {
  const raw = `${name}: ${value}`;
  if (raw.length <= 78 || raw.includes(CRLF)) return raw;
  const words = String(value).split(' ');
  const out = [];
  let line = `${name}: ${words.shift() ?? ''}`; // never fold before the first token
  for (const word of words) {
    if (line.length + 1 + word.length > 78) {
      out.push(line);
      line = ' ' + word; // continuation lines start with whitespace
    } else {
      line = `${line} ${word}`;
    }
  }
  out.push(line);
  return out.join(CRLF);
}

/** "Name <addr@example.com>", with the display name encoded or quoted. */
export function formatAddress(address) {
  if (typeof address === 'string') return address;
  const { name, email } = address;
  if (!name) return `<${email}>`;
  if (!isAscii(name)) return `${encodeWords(name)} <${email}>`;
  // Specials per RFC 5322 §3.2.3 have to live inside a quoted-string.
  const needsQuotes = /[()<>@,;:\\".\[\]]/.test(name);
  const display = needsQuotes ? `"${name.replace(/([\\"])/g, '\\$1')}"` : name;
  return `${display} <${email}>`;
}

/** RFC 2045 quoted-printable. Handles soft breaks and trailing whitespace. */
export function quotedPrintable(input) {
  const normalized = String(input).replace(/\r\n?/g, '\n');
  const bytes = Buffer.from(normalized, 'utf8');
  const lines = [];
  let line = '';

  const flush = () => {
    // A line may not end in whitespace: encode the final space or tab.
    if (line.endsWith(' ') || line.endsWith('\t')) {
      const enc = line.endsWith(' ') ? '=20' : '=09';
      const head = line.slice(0, -1);
      if (head.length + enc.length > MAX_LINE) lines.push(head + '=', enc);
      else lines.push(head + enc);
    } else {
      lines.push(line);
    }
    line = '';
  };

  for (const byte of bytes) {
    if (byte === 0x0a) {
      flush();
      continue;
    }
    const printable =
      (byte >= 0x21 && byte <= 0x7e && byte !== 0x3d) || byte === 0x20 || byte === 0x09;
    const piece = printable ? String.fromCharCode(byte) : `=${byte.toString(16).toUpperCase().padStart(2, '0')}`;
    // Reserve one column for the trailing "=" of a soft line break.
    if (line.length + piece.length > MAX_LINE - 1) {
      lines.push(line + '=');
      line = '';
    }
    line += piece;
  }
  flush();
  return lines.join(CRLF);
}

/**
 * Build a complete RFC 5322 message.
 *
 * @param {object} msg
 * @param {{name?: string, email: string}} msg.from
 * @param {string} msg.to
 * @param {string} msg.subject
 * @param {string} msg.text          plain-text alternative (required: some of
 *                                   this audience genuinely reads mail in mutt)
 * @param {string} [msg.html]
 * @param {Record<string,string>} [msg.headers]  extra headers, e.g. List-*
 * @param {Date} [msg.date]
 * @param {string} [msg.messageId]
 * @returns {string} the raw message, CRLF line endings, no trailing dot
 */
export function buildMessage({ from, to, subject, text, html, headers = {}, date = new Date(), messageId }) {
  if (!text) throw new Error('mime.buildMessage: a text/plain alternative is required');

  const domain = String(from.email).split('@')[1] || 'localhost';
  const id = messageId || `<${Date.now().toString(36)}.${randomBytes(8).toString('hex')}@${domain}>`;

  const head = [
    foldHeader('From', formatAddress(from)),
    foldHeader('To', to),
    foldHeader('Subject', encodeWords(subject)),
    foldHeader('Date', rfc5322Date(date)),
    foldHeader('Message-ID', id),
    foldHeader('MIME-Version', '1.0'),
  ];
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined || value === null || value === '') continue;
    head.push(foldHeader(name, String(value)));
  }

  if (!html) {
    head.push(foldHeader('Content-Type', 'text/plain; charset=utf-8'));
    head.push(foldHeader('Content-Transfer-Encoding', 'quoted-printable'));
    return head.join(CRLF) + CRLF + CRLF + quotedPrintable(text) + CRLF;
  }

  const boundary = `--=_alt_${randomBytes(12).toString('hex')}`;
  head.push(foldHeader('Content-Type', `multipart/alternative; boundary="${boundary}"`));

  const body = [
    '',
    'This is a message in MIME format. If you can read this, your mail client',
    'does not understand multipart messages — the plain-text part follows.',
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    quotedPrintable(text),
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    quotedPrintable(html),
    `--${boundary}--`,
    '',
  ];

  return head.join(CRLF) + CRLF + body.join(CRLF);
}
