// Small shared helpers: base-path prefixing (GitHub Pages serves under
// /developer-marketing), absolute/canonical URL construction, and UTC-stable
// date formatting.

const RAW_BASE = import.meta.env.BASE_URL ?? '/';
const BASE = RAW_BASE.replace(/\/$/, ''); // "/developer-marketing"

export const SITE_ORIGIN = import.meta.env.SITE ?? 'https://albertogrande.github.io';

// Content is CC BY 4.0 (code is MIT) — stated in README, LICENSE, and the
// structured data / machine surfaces that cite this constant.
export const CONTENT_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

// Search-console ownership tokens (see docs/search-engines.md). Empty strings
// emit nothing; fill in after verifying the site in each console.
export const VERIFICATION = { google: '', bing: '' };

// The one URL convention: page routes carry a trailing slash — that is the URL
// GitHub Pages actually serves for a directory build, so linking it directly
// saves a 301 hop on every navigation and keeps cited URLs identical to
// canonical ones. File-ish routes (.md, .json, .xml, .txt, .svg, …) never do.
// A #hash or ?query survives normalization.
const normalize = (p: string): string => {
  const m = p.match(/^([^#?]*)([#?][\s\S]*)?$/)!;
  let path = m[1];
  const tail = m[2] ?? '';
  const last = path.split('/').pop() ?? '';
  if (path && !last.includes('.') && !path.endsWith('/')) path += '/';
  return `${path || '/'}${tail}`;
};

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

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

export const fmtLong = (d: Date) =>
  fmt(d, { day: 'numeric', month: 'long', year: 'numeric' }); // 4 July 2026
export const fmtMed = (d: Date) =>
  fmt(d, { day: 'numeric', month: 'short', year: 'numeric' }); // 4 Jul 2026

export const isoDate = (d: Date) => d.toISOString().slice(0, 10); // 2026-07-04

// Collection ordering lives in ./content.ts (entryByDateDesc & friends).
