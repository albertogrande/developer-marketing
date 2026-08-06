// Small shared helpers: base-path prefixing (empty when served at the root,
// as on Vercel; "/developer-marketing" on a project-site host), absolute/
// canonical URL construction, and UTC-stable date formatting.

const RAW_BASE = import.meta.env.BASE_URL ?? '/';
const BASE = RAW_BASE.replace(/\/$/, ''); // '' at the root

export const SITE_ORIGIN = import.meta.env.SITE ?? 'https://developer-marketing.vercel.app';

// Content is CC BY 4.0 (code is MIT) — stated in README, LICENSE, and the
// structured data / machine surfaces that cite this constant.
export const CONTENT_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

// Search-console ownership tokens (see docs/search-engines.md). Empty strings
// emit nothing; fill in after verifying the site in each console.
export const VERIFICATION = { google: '', bing: '' };

// The one URL convention lives in ./url-core.mjs (a pure module so
// `node --test` can pin it — see scripts/url-core.test.mjs): page routes
// carry a trailing slash, file-ish routes never do, #hash/?query survive.
import { normalizePath as normalize } from './url-core.mjs';

export function withBase(p: string): string {
  const n = normalize(p);
  return `${BASE}${n.startsWith('/') ? '' : '/'}${n}`;
}

// Absolute URL for a base-less site path — the form machine surfaces
// (feeds, JSON-LD, llms.txt, .md siblings) must carry.
export function absUrl(p: string): string {
  return new URL(withBase(p), SITE_ORIGIN).href;
}

// Canonical for a rendered page. Astro.url.pathname already carries the base;
// apply the same trailing-slash rule so canonicals, og:url, sitemap entries,
// and internal links all agree on one URL form.
export function canonicalFor(pathname: string): string {
  return new URL(normalize(pathname), SITE_ORIGIN).href;
}

// The base-less site path of a rendered page ('/guide/foo/'), the form the
// internal route conventions use.
export function stripBase(pathname: string): string {
  return pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

export const fmtLong = (d: Date) =>
  fmt(d, { day: 'numeric', month: 'long', year: 'numeric' }); // 4 July 2026
export const fmtMed = (d: Date) =>
  fmt(d, { day: 'numeric', month: 'short', year: 'numeric' }); // 4 Jul 2026

export const isoDate = (d: Date) => d.toISOString().slice(0, 10); // 2026-07-04

// The Mon–Sun range a weekly issue covers, from its `date` (the Monday).
// "20–26 July 2026" within a month, "27 July – 2 August 2026" across one,
// years spelled out on both sides when the week straddles New Year. This is
// the reader-facing stamp: the Monday alone read as a publish date and made
// the newest issue look a week old.
export const fmtWeekRange = (monday: Date, style: 'long' | 'med' = 'long') => {
  const month = style === 'long' ? ('long' as const) : ('short' as const);
  const sunday = new Date(monday.getTime() + 6 * 86400e3);
  const sameYear = monday.getUTCFullYear() === sunday.getUTCFullYear();
  if (!sameYear)
    return `${fmt(monday, { day: 'numeric', month, year: 'numeric' })} – ${fmt(sunday, { day: 'numeric', month, year: 'numeric' })}`;
  if (monday.getUTCMonth() === sunday.getUTCMonth())
    return `${monday.getUTCDate()}–${fmt(sunday, { day: 'numeric', month, year: 'numeric' })}`;
  return `${fmt(monday, { day: 'numeric', month })} – ${fmt(sunday, { day: 'numeric', month, year: 'numeric' })}`;
};

// Collection ordering lives in ./content.ts (entryByDateDesc & friends).
