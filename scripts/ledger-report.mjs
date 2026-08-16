#!/usr/bin/env node
// Read usage/ledger.csv and say what it actually shows: what each desk costs,
// and — the reason this exists — how close each writer runs to its turn cap.
//
// The caps were tuned by reading the CSV by hand after an incident, which is
// how the scout ended up sitting AT its ceiling most nights: writer-guard
// warns "if this recurs, raise --max-turns rather than letting the desk
// publish partial work", it recurred nightly, and nothing was watching the
// trend. A truncated run is not a failed run — tolerate_max_turns lets it
// through — so saturation is invisible unless something adds it up.
//
// Usage:
//   node scripts/ledger-report.mjs                # all time
//   node scripts/ledger-report.mjs --days 30      # recent window
//   node scripts/ledger-report.mjs --caps scout.writer=70,editor.writer=90

import { readFileSync, existsSync } from 'node:fs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};

const LEDGER = 'usage/ledger.csv';
const DAYS = Number(flag('--days', '0')) || 0;

// The caps live in the workflows; passing them in keeps this script from
// becoming a second place that claims to know them.
const CAPS = Object.fromEntries(
  (flag('--caps', 'Scout.writer=70,Scout.verify=60,Editor.writer=90,Editor.verify=60,Jobs.writer=60') || '')
    .split(',')
    .filter(Boolean)
    .map((pair) => {
      const [k, v] = pair.split('=');
      return [k.toLowerCase(), Number(v)];
    })
);

if (!existsSync(LEDGER)) {
  console.error(`ledger-report: no ${LEDGER} yet.`);
  process.exit(1);
}

const [header, ...lines] = readFileSync(LEDGER, 'utf8').trim().split('\n');
const cols = header.split(',');
const rows = lines
  .map((l) => Object.fromEntries(l.split(',').map((v, i) => [cols[i], v])))
  .filter((r) => r.date && r.workflow && r.step);

const cutoff = DAYS
  ? new Date(Date.now() - DAYS * 86400e3).toISOString().slice(0, 10)
  : '0000-00-00';
const inWindow = rows.filter((r) => r.date >= cutoff);

if (!inWindow.length) {
  console.error('ledger-report: no rows in window.');
  process.exit(1);
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Group by desk+step, which is the unit a cap applies to.
const groups = new Map();
for (const r of inWindow) {
  const key = `${r.workflow}.${r.step}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

console.log(
  `usage ledger — ${inWindow.length} rows${DAYS ? ` over the last ${DAYS} days` : ''} (${inWindow[0].date} → ${inWindow.at(-1).date})\n`
);

const pad = (s, n) => String(s).padEnd(n);
console.log(
  `${pad('desk.step', 18)}${pad('runs', 6)}${pad('med turns', 11)}${pad('max', 6)}${pad('cap', 6)}${pad('at cap', 8)}${pad('med $', 8)}${pad('total $', 9)}model`
);
console.log('-'.repeat(94));

const warnings = [];
for (const [key, rs] of [...groups].sort()) {
  const turns = rs.map((r) => num(r.turns)).filter((n) => n != null);
  const costs = rs.map((r) => num(r.cost_usd)).filter((n) => n != null);
  const cap = CAPS[key.toLowerCase()] ?? null;
  // "At cap" counts runs that reached or passed the ceiling. Those are the
  // ones that finished only because tolerate_max_turns let them.
  const atCap = cap ? turns.filter((t) => t >= cap).length : 0;
  const models = [...new Set(rs.map((r) => r.model).filter(Boolean))];

  console.log(
    pad(key, 18) +
      pad(rs.length, 6) +
      pad(median(turns) ?? '-', 11) +
      pad(turns.length ? Math.max(...turns) : '-', 6) +
      pad(cap ?? '-', 6) +
      pad(cap ? `${atCap}/${turns.length}` : '-', 8) +
      pad(costs.length ? (median(costs) ?? 0).toFixed(2) : '-', 8) +
      pad(costs.length ? costs.reduce((a, b) => a + b, 0).toFixed(2) : '-', 9) +
      models.join('/')
  );

  if (cap && turns.length && atCap / turns.length >= 0.5) {
    warnings.push(
      `${key}: ${atCap} of ${turns.length} runs reached the ${cap}-turn cap (median ${median(turns)}). ` +
        `The desk is being truncated routinely — raise the cap or cut the work per turn.`
    );
  }
}

const totalCost = inWindow
  .map((r) => num(r.cost_usd))
  .filter((n) => n != null)
  .reduce((a, b) => a + b, 0);
const days = new Set(inWindow.map((r) => r.date)).size;
console.log(
  `\ntotal $${totalCost.toFixed(2)} across ${days} day(s) — $${(totalCost / days).toFixed(2)}/day`
);

if (warnings.length) {
  console.log('\nsaturation:');
  for (const w of warnings) console.log(`  - ${w}`);
}
