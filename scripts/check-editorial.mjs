#!/usr/bin/env node
// Editorial-state gate. MEMORY.md declares its own line cap ("Keep under
// ~170 lines") and the weekly skill is told to prune to it — but nothing
// enforced it, and the file drifted to 2× the cap before anyone noticed.
// A memory file that grows without bound stops being a working memory: the
// desks read all of it every run, and the pruning discipline is what keeps
// the signal density up. This makes the cap binding.
//
// Also sanity-checks signals/ filenames (ISO week form YYYY-Www.md) — a
// misnamed week file is invisible to every desk that greps by week id.
//
// Runs in `npm run check` and the editorial-gates action. Warns at 90% of
// cap, fails above cap.

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const problems = [];
const warnings = [];

// --- MEMORY.md line cap -----------------------------------------------------
const MEMORY = 'editorial/MEMORY.md';
if (existsSync(MEMORY)) {
  const text = readFileSync(MEMORY, 'utf8');
  const m = text.match(/[Kk]eep (?:it )?under ~?(\d+) lines/);
  const cap = m ? Number(m[1]) : 170;
  const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
  if (lines > cap) {
    problems.push(
      `${MEMORY}: ${lines} lines exceeds its own ~${cap}-line cap — prune (retire dead threads; git history preserves everything)`
    );
  } else if (lines > cap * 0.9) {
    warnings.push(`${MEMORY}: ${lines} lines — within 10% of the ~${cap}-line cap, prune soon`);
  }
} else {
  problems.push(`${MEMORY}: missing`);
}

// --- signals/ filenames -----------------------------------------------------
if (existsSync('signals')) {
  for (const f of readdirSync('signals')) {
    if (f.startsWith('.')) continue;
    if (!/^\d{4}-W\d{2}\.md$/.test(f)) {
      problems.push(`signals/${f}: not an ISO week filename (YYYY-Www.md) — desks grep by week id`);
    }
  }
}

for (const w of warnings) console.warn(`warn: ${w}`);
if (problems.length) {
  console.error('check-editorial: editorial state problems:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('check-editorial: ok.');
