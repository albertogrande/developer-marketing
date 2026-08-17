#!/usr/bin/env node
// Shelf-staleness checker. The skills shelf carries a `verified:` date and
// resources a `checked:` date — the promise that a human (or desk) recently
// confirmed the thing still exists and the caveat still holds. The weekly
// skill rotates through ~3 entries a week, but nothing measured whether the
// rotation kept up. This does, deterministically: any entry whose stamp is
// older than the threshold lands in the report.
//
// Report tool, not a gate: always exits 0. The weekly liveness workflow files
// the report as an issue for the desks to work through.
//
// Usage:
//   node scripts/check-freshness.mjs [--days 60] [--report path]
//     --report writes markdown (default freshness-report.md); without it the
//     report prints to stdout.

import { writeFileSync } from 'node:fs';
import { contentEntries, entryLastmod } from './lib/routes.mjs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const DAYS = Number(flag('--days', '60'));
const reportPath = argv.includes('--report') ? flag('--report', 'freshness-report.md') : null;

// The freshness stamp per collection: the field that means "a person checked
// this recently", not the entry's publish date.
// A live thread that nobody has worked in the window is the exact staleness
// its momentum arrow claims to prevent, so it reports alongside the shelf.
const STAMP = { skills: 'verified', resources: 'checked', claims: 'checked', threads: 'updated' };

const today = new Date();
const cutoff = new Date(today.getTime() - DAYS * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

const stale = [];
for (const { collection, id, file, fm } of contentEntries()) {
  const field = STAMP[collection];
  if (!field || !fm) continue;
  const stamp = entryLastmod({ [field]: fm[field] });
  if (!stamp) {
    stale.push({ collection, id, file, stamp: '(missing)', field });
  } else if (stamp < cutoff) {
    stale.push({ collection, id, file, stamp, field });
  }
}

stale.sort((a, b) => a.stamp.localeCompare(b.stamp));

const lines = stale.length
  ? [
      `### Stale shelf entries (${stale.length} older than ${DAYS} days)`,
      '',
      ...stale.map(
        (s) => `- \`${s.file}\` — \`${s.field}: ${s.stamp}\` (re-verify or delist)`
      ),
      '',
    ]
  : [];
const body = lines.join('\n');

if (reportPath) {
  writeFileSync(reportPath, body);
  console.log(
    `check-freshness: ${stale.length} stale entr${stale.length === 1 ? 'y' : 'ies'} (>${DAYS}d) — report written to ${reportPath}.`
  );
} else if (body) {
  console.log(body);
} else {
  console.log(`check-freshness: all shelf stamps within ${DAYS} days.`);
}
