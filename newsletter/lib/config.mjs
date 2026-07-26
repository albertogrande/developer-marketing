// Configuration for the in-house newsletter, read once from the environment.
//
// Every value has a safe default except the signing secret, which has none on
// purpose: a predictable secret would let anyone mint a confirmation link for
// an address they do not own.

import { resolve } from 'node:path';

const env = process.env;

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const bool = (v, fallback) =>
  v === undefined || v === '' ? fallback : /^(1|true|yes|on)$/i.test(v);

const SITE_URL = (env.SITE_URL || 'https://albertogrande.github.io/developer-marketing').replace(
  /\/+$/,
  ''
);

// Browsers send the scheme+host only, so the allow-list is origins, not URLs.
const originOf = (u) => {
  try {
    return new URL(u).origin;
  } catch {
    return '';
  }
};

export const config = {
  // --- http -----------------------------------------------------------------
  host: env.HOST || '127.0.0.1',
  port: num(env.PORT, 8787),
  // Where the confirm/unsubscribe redirects land, and the base for links in mail.
  siteUrl: SITE_URL,
  // Who may POST the form. Defaults to the site's own origin; add localhost by
  // hand when developing against `astro dev`.
  allowedOrigins: (env.ALLOWED_ORIGINS || originOf(SITE_URL))
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  // Behind nginx/Caddy the client IP arrives in a header. Off by default: a
  // spoofable header must never be trusted unless a proxy really is in front.
  trustProxy: bool(env.TRUST_PROXY, false),

  // --- storage --------------------------------------------------------------
  dataDir: resolve(env.DATA_DIR || './data'),

  // --- crypto ---------------------------------------------------------------
  // Used for confirm/unsubscribe tokens and to salt stored IP hashes.
  secret: env.NEWSLETTER_SECRET || '',
  confirmTtlDays: num(env.CONFIRM_TTL_DAYS, 7),

  // --- mail -----------------------------------------------------------------
  fromEmail: env.FROM_EMAIL || 'the-week@localhost',
  fromName: env.FROM_NAME || 'Developer Marketing — The Week',
  replyTo: env.REPLY_TO || '',
  // RFC 2919 list identity. Mail clients group and filter on it.
  listId: env.LIST_ID || `the-week.${originOf(SITE_URL).replace(/^https?:\/\//, '') || 'localhost'}`,
  smtp: {
    host: env.SMTP_HOST || '',
    port: num(env.SMTP_PORT, 587),
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    // Implicit TLS (port 465). Otherwise plain connect then STARTTLS.
    secure: bool(env.SMTP_SECURE, num(env.SMTP_PORT, 587) === 465),
    // Only ever set false against a self-signed relay you control.
    rejectUnauthorized: bool(env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
    timeoutMs: num(env.SMTP_TIMEOUT_MS, 20_000),
  },
  // Log the message instead of opening a connection. Set automatically when no
  // SMTP host is configured, so a fresh checkout runs without a mail server.
  dryRun: bool(env.MAIL_DRY_RUN, !env.SMTP_HOST),

  // --- abuse control --------------------------------------------------------
  rate: {
    // Per-IP subscribe attempts inside the window.
    perIp: num(env.RATE_PER_IP, 5),
    windowMs: num(env.RATE_WINDOW_MS, 15 * 60_000),
    // Whole-service ceiling, so one botnet cannot burn the relay's reputation.
    global: num(env.RATE_GLOBAL, 240),
  },
  // A form submitted faster than a human can type is a bot.
  minFillMs: num(env.MIN_FILL_MS, 1200),

  // --- admin ----------------------------------------------------------------
  // Bearer token for GET /admin/subscribers, which the sender reads. Empty
  // disables the endpoint entirely rather than leaving it open.
  adminToken: env.ADMIN_TOKEN || '',
};

/** Fail fast with a readable message rather than serving broken crypto. */
export function assertServerConfig(cfg = config) {
  const problems = [];
  if (!cfg.secret || cfg.secret.length < 32)
    problems.push('NEWSLETTER_SECRET must be set to at least 32 characters (openssl rand -hex 32)');
  if (!cfg.allowedOrigins.length)
    problems.push('ALLOWED_ORIGINS is empty and SITE_URL has no parsable origin');
  if (!cfg.dryRun && !cfg.smtp.host) problems.push('SMTP_HOST is required unless MAIL_DRY_RUN=1');
  if (problems.length) {
    throw new Error(`newsletter config:\n  - ${problems.join('\n  - ')}`);
  }
  return cfg;
}
