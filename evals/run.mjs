#!/usr/bin/env node
// Editorial-judgment eval harness. The four writer skills are prompts, and
// until now a prompt change shipped unmeasured. This replays frozen decision
// points — real repo states mined from git history for the newsroom, synthetic
// promotion calls for the scout — through the *current* skill text with a
// headless `claude -p`, grades the decision lines deterministically (regex,
// no judge model), and compares the pass rate against evals/baseline.yml.
//
// Usage:
//   node evals/run.mjs                       # all suites
//   node evals/run.mjs --suite newsroom      # one suite
//   node evals/run.mjs --case 2026-07-30     # one case (substring match)
//   node evals/run.mjs --record              # also write usage/evals/<date>.md
//   node evals/run.mjs --model <id>          # override the model
//
// Cost note: each newsroom case is a real model run over ~40 files of frozen
// editorial state (a few minutes, tens of cents at Opus-class pricing); the
// full suite is ~11 runs. That is why CI only triggers this on changes to
// .claude/skills/** or evals/** — evals gate prompt changes, not content.

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
// Default to the production newsroom writer's model: the eval must measure
// the prompt at the model that will run it.
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

// --- newsroom: frozen repo state → publish/skip decision line ---------------

function runNewsroomCase(dir) {
  const expected = loadExpected(dir);
  const scratch = mkdtempSync(join(tmpdir(), 'eval-newsroom-'));
  try {
    cpSync(join(dir, 'state'), scratch, { recursive: true });
    // The skill under test is always the CURRENT one — that is the point.
    const skillDest = join(scratch, '.claude', 'skills', 'newsroom');
    mkdirSync(skillDest, { recursive: true });
    cpSync(join(ROOT, '.claude', 'skills', 'newsroom', 'SKILL.md'), join(skillDest, 'SKILL.md'));

    const prompt = [
      `Today is ${expected.date}. You are the editor making the newsroom's`,
      `publish/skip decision (the decision phase of .claude/skills/newsroom/SKILL.md —`,
      `read it first). Read MASTHEAD.md, AUTHORS.md, editorial/TASTE.md,`,
      `editorial/MEMORY.md, editorial/NEWSROOM.md, editorial/BACKLOG.md, the`,
      `signal files under signals/, and the published articles under`,
      `src/content/articles/. Decide from these written inputs only — you have`,
      `no web access in this session; treat claims the inputs mark as verified`,
      `as verified. Do not write or edit any files, and do not write the`,
      `article. End your reply with exactly one decision line in the`,
      `NEWSROOM.md log format, as the last line:`,
      `- ${expected.date} · ran · <desk> · <slug> — <one-clause why>`,
      `or`,
      `- ${expected.date} · skip — <one-clause why>`,
    ].join(' ');

    const out = claude(prompt, {
      cwd: scratch,
      allowedTools: 'Read,Glob,Grep,Bash(ls *)',
      maxTurns: 30,
    });

    const lines = [...out.matchAll(/^- \d{4}-\d{2}-\d{2} · (ran|skip)(?: · ([a-z]+))?.*$/gm)];
    const last = lines.at(-1);
    if (!last) return { pass: false, detail: 'no decision line in output' };
    const [, decision, desk] = last;
    const problems = [];
    if (decision !== expected.decision)
      problems.push(`decision ${decision}, expected ${expected.decision}`);
    if (expected.desk && desk !== expected.desk)
      problems.push(`desk ${desk ?? '(none)'}, expected ${expected.desk}`);
    for (const re of expected.must_mention ?? []) {
      if (!new RegExp(re, 'i').test(out)) problems.push(`missing mention /${re}/`);
    }
    for (const re of expected.must_not ?? []) {
      if (new RegExp(re, 'i').test(out)) problems.push(`forbidden mention /${re}/`);
    }
    return { pass: problems.length === 0, detail: problems.join('; ') || last[0] };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

// --- scout: one signal line → promote-to-brief yes/no -----------------------

function runScoutCase(dir) {
  const expected = loadExpected(dir);
  const signal = readFileSync(join(dir, 'signal.txt'), 'utf8').trim();
  const prompt = [
    `Read the promotion criteria in Step 3 of .claude/skills/daily-scout/SKILL.md`,
    `("Promote what qualifies to briefs"). Then judge this single captured`,
    `signal against those criteria exactly as written:`,
    `\n\n${signal}\n\n`,
    `Would the scout promote this signal to a brief under src/content/briefs/?`,
    `Judge only from the criteria and the signal — do not fetch anything.`,
    `End your reply with exactly one line, as the last line: "BRIEF: yes" or "BRIEF: no".`,
  ].join(' ');

  const out = claude(prompt, { cwd: ROOT, allowedTools: 'Read,Grep', maxTurns: 10 });
  const m = [...out.matchAll(/^BRIEF:\s*(yes|no)\s*$/gim)].at(-1);
  if (!m) return { pass: false, detail: 'no BRIEF line in output' };
  const got = m[1].toLowerCase();
  const want = expected.brief === true || expected.brief === 'yes' ? 'yes' : 'no';
  return { pass: got === want, detail: `BRIEF: ${got}, expected ${want}` };
}

// --- scoreboard -------------------------------------------------------------

const RUNNERS = { newsroom: runNewsroomCase, scout: runScoutCase };
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
