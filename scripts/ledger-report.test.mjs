// The saturation detector is the point of ledger-report, so it gets a test:
// a desk sitting at its cap must be reported, and one with headroom must not.
// Getting this backwards would quietly justify either leaving a truncated desk
// alone or raising a cap that was never the constraint.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const HEADER = 'date,workflow,run_id,step,model,cost_usd,duration_ms,turns';
const REPORT = join(process.cwd(), 'scripts', 'ledger-report.mjs');

/** Run the report against a throwaway repo root holding just a ledger. */
function report(rows, args = []) {
  const root = mkdtempSync(join(tmpdir(), 'ledger-'));
  try {
    mkdirSync(join(root, 'usage'), { recursive: true });
    writeFileSync(join(root, 'usage/ledger.csv'), [HEADER, ...rows].join('\n') + '\n');
    return execFileSync('node', [REPORT, ...args], { cwd: root, encoding: 'utf8' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const row = (date, wf, step, turns, cost = '1.00') =>
  `${date},${wf},123,${step},claude-sonnet-5,${cost},1000,${turns}`;

test('flags a desk that keeps reaching its cap', () => {
  const out = report(
    [
      row('2026-08-10', 'Scout', 'writer', 71),
      row('2026-08-11', 'Scout', 'writer', 77),
      row('2026-08-12', 'Scout', 'writer', 97),
      row('2026-08-13', 'Scout', 'writer', 60),
    ],
    ['--caps', 'Scout.writer=70']
  );
  assert.match(out, /saturation:/);
  assert.match(out, /3 of 4 runs reached the 70-turn cap/);
  assert.match(out, /raise the cap or cut the work per turn/);
});

test('stays quiet when the desk has headroom', () => {
  const out = report(
    [
      row('2026-08-10', 'Scout', 'writer', 20),
      row('2026-08-11', 'Scout', 'writer', 31),
      row('2026-08-12', 'Scout', 'writer', 18),
    ],
    ['--caps', 'Scout.writer=70']
  );
  assert.doesNotMatch(out, /saturation:/);
  assert.match(out, /Scout\.writer/);
});

test('reports per-desk totals and a daily average', () => {
  const out = report([
    row('2026-08-10', 'Scout', 'writer', 20, '2.00'),
    row('2026-08-10', 'Scout', 'verify', 8, '0.50'),
    row('2026-08-11', 'Scout', 'writer', 22, '1.50'),
  ]);
  assert.match(out, /total \$4\.00 across 2 day\(s\) — \$2\.00\/day/);
  // Each desk.step is its own row: a cap applies to one, not to the pair.
  assert.match(out, /Scout\.writer/);
  assert.match(out, /Scout\.verify/);
});

test('--days windows the rows', () => {
  const today = new Date().toISOString().slice(0, 10);
  const out = report(
    [row('2020-01-01', 'Scout', 'writer', 99), row(today, 'Scout', 'writer', 10)],
    ['--days', '7']
  );
  assert.match(out, /1 rows over the last 7 days/);
});

test('a desk with no configured cap reports usage without a verdict', () => {
  const out = report([row('2026-08-10', 'Newsroom', 'writer', 61)], ['--caps', 'Scout.writer=70']);
  assert.match(out, /Newsroom\.writer/);
  assert.doesNotMatch(out, /saturation:/);
});
