// Configuration for the in-house newsletter, read once from the environment.
//
// Every value has a safe default except the signing secret, which has none on
// purpose: a predictable secret would let anyone mint a confirmation link for
// an address they do not own.

import { resolve } from 'node:path';
import { SITE_URL as DEFAULT_SITE_URL } from '../../site.config.mjs';

const env = process.env;

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
const bool = (v, fallback) =>
  v === undefined || v === '' ? fallback : /^(1|true|yes|on)$/i.test(v);

const SITE_URL = (env.SITE_URL || DEFAULT_SITE_URL).replace(
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
  // 'ndjson' (a file) or 'postgres' (required on hosts with no durable disk).
  // Inferred from DATABASE_URL, which is what Vercel's Neon integration injects.
  store: env.NEWSLETTER_STORE || (env.DATABASE_URL || env.POSTGRES_URL ? 'postgres' : 'ndjson'),
  dataDir: resolve(env.DATA_DIR || './data'),
  // Prefer the pooled connection string: a serverless function opening direct
  // connections exhausts the database's slots on the first burst of traffic.
  databaseUrl: env.DATABASE_URL || env.POSTGRES_URL || env.DATABASE_URL_UNPOOLED || '',

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
  // How mail leaves: 'smtp' (our client → any relay), 'resend' (their HTTPS
  // API), or 'dry-run' (.eml files in $DATA_DIR/outbox). Inferred from what is
  // configured unless set explicitly. MAIL_DRY_RUN=1 still forces dry-run, so
  // the older switch keeps working.
  transport: bool(env.MAIL_DRY_RUN, false)
    ? 'dry-run'
    : env.MAIL_TRANSPORT || (env.RESEND_API_KEY ? 'resend' : env.SMTP_HOST ? 'smtp' : 'dry-run'),
  smtp: {
    // Resend: smtp.resend.com, user "resend", pass = the API key. SES, Postmark
    // and a Postfix on your own box all speak the same protocol.
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
  resend: {
    apiKey: env.RESEND_API_KEY || '',
    baseUrl: env.RESEND_BASE_URL || 'https://api.resend.com',
  },

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
  // Bearer token for /admin/*, which the sender reads and reports to. Empty
  // disables those endpoints entirely rather than leaving them open.
  adminToken: env.ADMIN_TOKEN || '',
  // Signing secret for relay webhooks (Resend's whsec_…). Empty means every
  // webhook is rejected — the endpoint suppresses addresses, so unauthenticated
  // is not an option.
  webhookSecret: env.WEBHOOK_SECRET || '',
};

/** True when no mail actually leaves — messages land in $DATA_DIR/outbox. */
export const isDryRun = (cfg = config) => cfg.transport === 'dry-run';

/** Fail fast with a readable message rather than serving broken crypto. */
export function assertServerConfig(cfg = config) {
  const problems = [];
  if (!cfg.secret || cfg.secret.length < 32)
    problems.push('NEWSLETTER_SECRET must be set to at least 32 characters (openssl rand -hex 32)');
  if (!cfg.allowedOrigins.length)
    problems.push('ALLOWED_ORIGINS is empty and SITE_URL has no parsable origin');
  if (!['smtp', 'resend', 'dry-run'].includes(cfg.transport))
    problems.push(`MAIL_TRANSPORT "${cfg.transport}" is not one of smtp, resend, dry-run`);
  if (!['ndjson', 'postgres'].includes(cfg.store))
    problems.push(`NEWSLETTER_STORE "${cfg.store}" is not one of ndjson, postgres`);
  if (cfg.store === 'postgres' && !cfg.databaseUrl)
    problems.push('NEWSLETTER_STORE=postgres needs DATABASE_URL');
  if (cfg.transport === 'smtp' && !cfg.smtp.host) problems.push('MAIL_TRANSPORT=smtp needs SMTP_HOST');
  if (cfg.transport === 'resend' && !cfg.resend.apiKey)
    problems.push('MAIL_TRANSPORT=resend needs RESEND_API_KEY');
  if (problems.length) {
    throw new Error(`newsletter config:\n  - ${problems.join('\n  - ')}`);
  }
  return cfg;
}
