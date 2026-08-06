// ISO week arithmetic, as a pure module. The week id is load-bearing — it is
// the issues collection's literal filename (/issues/2026-W28) and the signals
// filename — and the year-boundary logic is exactly the kind of thing that
// breaks silently in late December. Extracted from content.ts so `node --test`
// can pin it; content.ts re-exports from here.

// ISO 8601 week id ('2026-W28') for a date, UTC. Weeks belong to the year
// holding their Thursday, so shifting to the week's Thursday resolves every
// boundary case in one hop.
export function isoWeekId(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const year = t.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.ceil(((t.getTime() - jan1) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}
