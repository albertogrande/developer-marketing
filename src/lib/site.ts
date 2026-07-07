// Small shared helpers: base-path prefixing (GitHub Pages serves under
// /claude-code) and UTC-stable date formatting.

const RAW_BASE = import.meta.env.BASE_URL ?? '/';
const BASE = RAW_BASE.replace(/\/$/, ''); // "/claude-code"

export function withBase(p: string): string {
  return `${BASE}${p.startsWith('/') ? '' : '/'}${p}`;
}

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts });

export const fmtLong = (d: Date) =>
  fmt(d, { day: 'numeric', month: 'long', year: 'numeric' }); // 4 July 2026
export const fmtMed = (d: Date) =>
  fmt(d, { day: 'numeric', month: 'short', year: 'numeric' }); // 4 Jul 2026
export const fmtShort = (d: Date) =>
  fmt(d, { day: 'numeric', month: 'short' }); // 4 Jul

export const isoDate = (d: Date) => d.toISOString().slice(0, 10); // 2026-07-04

export function byDateDesc<T extends { date: Date; id: string }>(a: T, b: T) {
  const d = b.date.getTime() - a.date.getTime();
  return d !== 0 ? d : b.id.localeCompare(a.id);
}
