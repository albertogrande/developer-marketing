#!/usr/bin/env node
// Editorial-judgment eval harness. The writer skills are prompts, and a
// prompt change should not ship unmeasured. This replays frozen decision
// points — synthetic promotion calls for the scout — through the *current*
// skill text with a headless `claude -p`, grades the decision lines
// deterministically (regex, no judge model), and compares the pass rate
// against evals/baseline.yml. (The newsroom suite retired with the newsroom
// itself in the 2026-08 two-writer refactor; editor cases over the
// wire/claims model are the natural next additions.)
//
// Usage:
//   node evals/run.mjs                       # all suites
//   node evals/run.mjs --suite scout         # one suite
//   node evals/run.mjs --case small-company  # one case (substring match)
//   node evals/run.mjs --record              # also write usage/evals/<date>.md
//   node evals/run.mjs --model <id>          # override the model
//
// Cost note: each case is a real model run (minutes, cents). That is why CI
// only triggers this on changes to .claude/skills/** or evals/** — evals
// gate prompt changes, not content.

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const SUITE = flag('--suite', 'all');
const ONLY = flag('--case', null);
// Default to an Opus-class model: the eval must measure the prompt at the
// class of model that will run it.
const MODEL = flag('--model', process.env.EVAL_MODEL || 'claude-opus-4-8');
const RECORD = argv.includes('--record');
const CASE_TIMEOUT_MS = 10 * 60 * 1000;

function claude(prompt, { cwd, allowedTools, maxTurns }) {
  const res = spawnSync(
    'claude',
    [
      '-p',
      prompt,
      '--model',
      MODEL,
      '--allowedTools',
      allowedTools,
      '--max-turns',
      String(maxTurns),
    ],
    { cwd, encoding: 'utf8', timeout: CASE_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 }
  );
  if (res.error) throw res.error;
  return (res.stdout || '') + '\n' + (res.stderr || '');
}

function caseDirs(suite) {
  const base = join(ROOT, 'evals', 'cases', suite);
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((d) => !ONLY || d.includes(ONLY))
    .map((d) => join(base, d))
    .filter((d) => existsSync(join(d, 'expected.yml')));
}

function loadExpected(dir) {
  return parseYaml(readFileSync(join(dir, 'expected.yml'), 'utf8'));
}

// --- scout: one signal line → promote-to-wire yes/no ------------------------

function runScoutCase(dir) {
  const expected = loadExpected(dir);
  const signal = readFileSync(join(dir, 'signal.txt'), 'utf8').trim();
  const prompt = [
    `Read the promotion criteria in Step 3 of .claude/skills/daily-scout/SKILL.md`,
    `("Promote what qualifies to the wire"). Then judge this single captured`,
    `signal against those criteria exactly as written:`,
    `\n\n${signal}\n\n`,
    `Would the scout promote this signal to the wire under src/content/wire/?`,
    `Judge only from the criteria and the signal — do not fetch anything.`,
    `End your reply with exactly one line, as the last line: "WIRE: yes" or "WIRE: no".`,
  ].join(' ');

  const out = claude(prompt, { cwd: ROOT, allowedTools: 'Read,Grep', maxTurns: 10 });
  const m = [...out.matchAll(/^WIRE:\s*(yes|no)\s*$/gim)].at(-1);
  if (!m) return { pass: false, detail: 'no WIRE line in output' };
  const got = m[1].toLowerCase();
  const want = expected.wire === true || expected.wire === 'yes' ? 'yes' : 'no';
  return { pass: got === want, detail: `WIRE: ${got}, expected ${want}` };
}

// --- scoreboard -------------------------------------------------------------

const RUNNERS = { scout: runScoutCase };
const suites = SUITE === 'all' ? Object.keys(RUNNERS) : [SUITE];
const baselinePath = join(ROOT, 'evals', 'baseline.yml');
const baseline = existsSync(baselinePath)
  ? parseYaml(readFileSync(baselinePath, 'utf8'))
  : {};

const board = [];
for (const suite of suites) {
  const dirs = caseDirs(suite);
  if (!dirs.length) continue;
  for (const dir of dirs) {
    const id = `${suite}/${dir.split('/').at(-1)}`;
    process.stdout.write(`${id} … `);
    let result;
    try {
      result = RUNNERS[suite](dir);
    } catch (e) {
      result = { pass: false, detail: `runner error: ${e.message}` };
    }
    console.log(result.pass ? 'PASS' : `FAIL — ${result.detail}`);
    board.push({ suite, id, ...result });
  }
}

if (!board.length) {
  console.error('evals: no cases matched.');
  process.exit(1);
}

let failedBaseline = false;
const summary = [];
for (const suite of suites) {
  const rows = board.filter((r) => r.suite === suite);
  if (!rows.length) continue;
  const passed = rows.filter((r) => r.pass).length;
  const rate = passed / rows.length;
  const floor = baseline[suite];
  const vs =
    floor != null ? (rate >= floor ? `≥ baseline ${floor}` : `BELOW baseline ${floor}`) : 'no baseline';
  if (floor != null && rate < floor) failedBaseline = true;
  summary.push(`${suite}: ${passed}/${rows.length} (${rate.toFixed(2)}) — ${vs}`);
}
console.log('\n' + summary.join('\n'));

if (RECORD) {
  const date = new Date().toISOString().slice(0, 10);
  const out = join(ROOT, 'usage', 'evals', `${date}.md`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    [
      `# Eval run — ${date}`,
      '',
      `Model: ${MODEL}`,
      '',
      ...summary.map((s) => `- ${s}`),
      '',
      ...board.map((r) => `- ${r.pass ? 'PASS' : 'FAIL'} ${r.id}${r.pass ? '' : ` — ${r.detail}`}`),
      '',
    ].join('\n')
  );
  console.log(`recorded → ${out}`);
}

process.exit(failedBaseline ? 1 : 0);
