#!/usr/bin/env node
// Community-source outage detector. The scout dutifully logs "(sourcing
// note) … unreachable an Nth consecutive day" — and nothing ever alarms:
// Reddit and Bluesky were dark for two weeks with the note scrolling by
// daily. This reads the last week of signals sections and reports any known
// source named unreachable on most of them, so a decayed source becomes a
// tracked issue instead of ambient prose.
//
// Report tool, not a gate: always exits 0; the liveness workflow folds the
// report into the archive-health issue.
//
//   node scripts/check-source-outages.mjs [--days 7] [--min 5] [--report path]

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const DAYS = Number(flag('--days', '7'));
const MIN = Number(flag('--min', '5'));
const reportPath = argv.includes('--report') ? flag('--report', 'source-outage-report.md') : null;

// The scout's community sources, by the name its notes use.
const SOURCES = ['Reddit', 'Bluesky', 'Lobsters', 'Hacker News'];
const DOWN = /(unreachable|unavailable|fetch-blocked|403|blocked at the fetch layer)/i;

// Collect every dated section across the week files, newest first.
const sections = [];
if (existsSync('signals')) {
  for (const f of readdirSync('signals').filter((f) => /^\d{4}-W\d{2}\.md$/.test(f))) {
    const text = readFileSync(`signals/${f}`, 'utf8');
    for (const m of text.matchAll(/^## (\d{4}-\d{2}-\d{2})\n([\s\S]*?)(?=^## |\n*$(?![\s\S]))/gm)) {
      sections.push({ date: m[1], body: m[2] });
    }
  }
}
sections.sort((a, b) => b.date.localeCompare(a.date));
const recent = sections.slice(0, DAYS);

const lines = [];
for (const src of SOURCES) {
  // Sentence-level scoping: a sourcing note is one long line naming every
  // source it swept, so line-level matching would blame healthy sources for
  // their neighbours' outages.
  const days = recent.filter((s) =>
    s.body
      .split(/(?<=[.;])\s+/)
      .some((sentence) => sentence.includes(src) && DOWN.test(sentence))
  );
  if (days.length >= MIN) {
    lines.push(
      `- **${src}** named unreachable on ${days.length} of the last ${recent.length} scout days ` +
        `(latest ${days[0].date}) — find a fallback endpoint or retire it from the skill's source set`
    );
  }
}

const body = lines.length
  ? [`### Community-source outages (≥${MIN} of last ${DAYS} days)`, '', ...lines, ''].join('\n')
  : '';

if (reportPath) {
  writeFileSync(reportPath, body);
  console.log(
    `check-source-outages: ${lines.length} source(s) in sustained outage — report written to ${reportPath}.`
  );
} else if (body) {
  console.log(body);
} else {
  console.log('check-source-outages: no sustained outages in the recent signals.');
}
