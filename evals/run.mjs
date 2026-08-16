#!/usr/bin/env node
// Editorial-judgment eval harness. The writer skills are prompts, and a
// prompt change should not ship unmeasured. This replays frozen decision
// points — synthetic promotion calls for the scout, synthetic shape and
// claim-status calls for the editor — through the *current* skill text with
// a headless `claude -p`, grades the decision lines deterministically
// (regex, no judge model), and compares the pass rate against
// evals/baseline.yml. (The newsroom suite retired with the newsroom itself
// in the 2026-08 two-writer refactor.)
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

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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
const MODEL = flag('--model', process.env.EVAL_MODEL || 'claude-opus-5');
const RECORD = argv.includes('--record');
// baseline.yml justifies its sub-1.0 floors with "model decisions have
// variance" — but every case ran exactly once, so the harness asserted a
// variance it never measured. With 5 scout cases at n=1 a single flip moves
// the rate by 0.2, so a 0.8 floor is only reachable at exactly 4/5 or 5/5.
// Repeats make the number mean something; 1 stays the default because each
// run is a real model call.
const REPEAT = Math.max(1, Number(flag('--repeat', '1')) || 1);
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

// --- editor: frozen context → shape or claim-status decision line -----------

// Two graded judgments, one suite: the normal-vs-special issue call (Step 4
// of weekly-editor) and the claims reconciliation verdict (Step 5.5). Each
// case is synthetic-but-realistic frozen context; the grade is the final
// decision line only — no writing, no web.
function runEditorCase(dir) {
  const expected = loadExpected(dir);
  const context = readFileSync(join(dir, 'context.md'), 'utf8');
  const isShape = expected.type === 'shape';

  const prompt = isShape
    ? [
        `Read Step 4 of .claude/skills/weekly-editor/SKILL.md ("Write the issue`,
        `(and decide its length)") — the two-shapes rule. Then judge this frozen`,
        `Monday-morning context against that rule exactly as written:`,
        `\n\n${context}\n\n`,
        `Decide only from these written inputs — no web access, no file edits.`,
        `End your reply with exactly one line, as the last line:`,
        `"SHAPE: normal" or "SHAPE: special".`,
      ].join(' ')
    : [
        `Read the "Re-verify the stalest" rules in Step 5.5 of`,
        `.claude/skills/weekly-editor/SKILL.md. Then judge this re-verification`,
        `outcome against those rules exactly as written:`,
        `\n\n${context}\n\n`,
        `Decide only from these written inputs — no web access, no file edits.`,
        `End your reply with exactly one line, as the last line:`,
        `"STATUS: current", "STATUS: stale" or "STATUS: retired".`,
      ].join(' ');

  const out = claude(prompt, { cwd: ROOT, allowedTools: 'Read,Grep', maxTurns: 10 });
  const re = isShape ? /^SHAPE:\s*(normal|special)\s*$/gim : /^STATUS:\s*(current|stale|retired)\s*$/gim;
  const m = [...out.matchAll(re)].at(-1);
  if (!m) return { pass: false, detail: `no ${isShape ? 'SHAPE' : 'STATUS'} line in output` };
  const got = m[1].toLowerCase();
  const want = isShape ? expected.shape : expected.status;
  const problems = [];
  if (got !== want) problems.push(`${isShape ? 'SHAPE' : 'STATUS'}: ${got}, expected ${want}`);
  for (const s of expected.must_not ?? []) {
    if (out.includes(s)) problems.push(`forbidden output "${s}"`);
  }
  return { pass: problems.length === 0, detail: problems.join('; ') || `${isShape ? 'SHAPE' : 'STATUS'}: ${got}` };
}

// --- scout: one captured event → promote-to-Signals yes/no ------------------

// This suite spent the 2026-08 two-writer refactor asking about a tier that no
// longer exists: it cited Step 3 as "Promote what qualifies to the wire" and
// asked whether the item would be promoted "to the wire under
// src/content/wire/". The heading is "Promote what qualifies to Signals" and
// the directory is src/content/signals/; src/content/wire/ is gone. The model
// was silently reconciling a prompt against a skill it did not match, and the
// 0.8 floor was wide enough to hide it. The criteria themselves never changed,
// so the cases stay valid — only the vocabulary was stale.
//
// The decision token is PROMOTE, not SIGNAL, because "signal" is overloaded
// here: signals/ at the repo root is internal raw capture and
// src/content/signals/ is the published feed, so "SIGNAL: no" would read as a
// claim about the wrong one.
function runScoutCase(dir) {
  const expected = loadExpected(dir);
  const signal = readFileSync(join(dir, 'signal.txt'), 'utf8').trim();
  const prompt = [
    `Read the promotion criteria in Step 3 of .claude/skills/daily-scout/SKILL.md`,
    `("Promote what qualifies to Signals"). Then judge this single captured`,
    `event against those criteria exactly as written:`,
    `\n\n${signal}\n\n`,
    `Would the scout promote this to the published Signals feed under`,
    `src/content/signals/?`,
    `Judge only from the criteria and the event — do not fetch anything.`,
    `End your reply with exactly one line, as the last line: "PROMOTE: yes" or "PROMOTE: no".`,
  ].join(' ');

  const out = claude(prompt, { cwd: ROOT, allowedTools: 'Read,Grep', maxTurns: 10 });
  const m = [...out.matchAll(/^PROMOTE:\s*(yes|no)\s*$/gim)].at(-1);
  if (!m) return { pass: false, detail: 'no PROMOTE line in output' };
  const got = m[1].toLowerCase();
  const want = expected.promote === true || expected.promote === 'yes' ? 'yes' : 'no';
  return { pass: got === want, detail: `PROMOTE: ${got}, expected ${want}` };
}

// --- jobs: one frozen JD → in-scope yes/no, or its remote region ------------

// evals.yml triggers on `.claude/skills/**`, which includes jobs-scout — so a
// change to that skill has always been able to fire a run that could not test
// it. Two graded judgments, matching where the skill actually decides: the
// three-part scope test (developer-focused/AI company AND one of exactly three
// role categories AND fully remote) and the region classification.
function runJobsCase(dir) {
  const expected = loadExpected(dir);
  const jd = readFileSync(join(dir, 'jd.txt'), 'utf8').trim();
  const isScope = expected.type === 'scope';

  const prompt = isScope
    ? [
        `Read the "Scope — include a role only if ALL THREE hold" rules in`,
        `.claude/skills/jobs-scout/SKILL.md. Then judge this frozen job posting`,
        `against those rules exactly as written:`,
        `\n\n${jd}\n\n`,
        `Decide only from these written inputs — no web access, no file edits.`,
        `End your reply with exactly one line, as the last line:`,
        `"INCLUDE: yes" or "INCLUDE: no".`,
      ].join(' ')
    : [
        `Read the "Classify the remote region" rules in`,
        `.claude/skills/jobs-scout/SKILL.md. Then classify this frozen job`,
        `posting against those rules exactly as written:`,
        `\n\n${jd}\n\n`,
        `Decide only from these written inputs — no web access, no file edits.`,
        `End your reply with exactly one line, as the last line:`,
        `"REGION: worldwide", "REGION: eu", "REGION: usa" or "REGION: other".`,
      ].join(' ');

  const out = claude(prompt, { cwd: ROOT, allowedTools: 'Read,Grep', maxTurns: 10 });
  const re = isScope
    ? /^INCLUDE:\s*(yes|no)\s*$/gim
    : /^REGION:\s*(worldwide|eu|usa|other)\s*$/gim;
  const m = [...out.matchAll(re)].at(-1);
  if (!m) return { pass: false, detail: `no ${isScope ? 'INCLUDE' : 'REGION'} line in output` };
  const got = m[1].toLowerCase();
  const want = isScope
    ? expected.include === true || expected.include === 'yes'
      ? 'yes'
      : 'no'
    : String(expected.region);
  return { pass: got === want, detail: `${isScope ? 'INCLUDE' : 'REGION'}: ${got}, expected ${want}` };
}

// --- scoreboard -------------------------------------------------------------

const RUNNERS = { scout: runScoutCase, editor: runEditorCase, jobs: runJobsCase };
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
    // Each attempt is an independent model call on the same frozen inputs, so
    // a case that flips between them is telling you something a single run
    // hides: the prompt is ambiguous at this decision point, not merely wrong.
    const attempts = [];
    for (let i = 0; i < REPEAT; i++) {
      try {
        attempts.push(RUNNERS[suite](dir));
      } catch (e) {
        attempts.push({ pass: false, detail: `runner error: ${e.message}` });
      }
    }
    const passes = attempts.filter((a) => a.pass).length;
    // A case scores its pass RATE, so one flaky case out of five costs 0.1 at
    // --repeat 2 rather than the whole 0.2 a binary result would.
    const rate = passes / attempts.length;
    const flaky = passes > 0 && passes < attempts.length;
    const detail = attempts.find((a) => !a.pass)?.detail ?? attempts[0].detail;
    const label =
      REPEAT === 1
        ? rate === 1
          ? 'PASS'
          : `FAIL — ${detail}`
        : `${passes}/${REPEAT}${flaky ? ' FLAKY' : ''}${rate === 1 ? '' : ` — ${detail}`}`;
    console.log(label);
    board.push({ suite, id, rate, passes, attempts: attempts.length, flaky, detail, pass: rate === 1 });
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
  const rate = rows.reduce((s, r) => s + r.rate, 0) / rows.length;
  const floor = baseline[suite];
  const vs =
    floor != null ? (rate >= floor ? `≥ baseline ${floor}` : `BELOW baseline ${floor}`) : 'no baseline';
  if (floor != null && rate < floor) failedBaseline = true;
  const spread =
    REPEAT > 1
      ? (() => {
          const flakies = rows.filter((r) => r.flaky);
          // The spread is the point of repeating: a suite at 0.80 with every
          // case decided the same way every time is a prompt that is wrong,
          // and one at 0.80 that is flaky on two cases is a prompt that is
          // ambiguous. Those need opposite fixes.
          return ` — ${flakies.length} of ${rows.length} case(s) unstable across ${REPEAT} runs${
            flakies.length ? `: ${flakies.map((r) => r.id).join(', ')}` : ''
          }`;
        })()
      : '';
  const passedWhole = rows.filter((r) => r.rate === 1).length;
  summary.push(
    `${suite}: ${passedWhole}/${rows.length} cases fully passing, mean rate ${rate.toFixed(2)} — ${vs}${spread}`
  );
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
      `Model: ${MODEL} · repeats: ${REPEAT}`,
      '',
      ...summary.map((s) => `- ${s}`),
      '',
      ...board.map(
        (r) =>
          `- ${r.rate === 1 ? 'PASS' : r.flaky ? 'FLAKY' : 'FAIL'} ${r.id} (${r.passes}/${r.attempts})` +
          `${r.rate === 1 ? '' : ` — ${r.detail}`}`
      ),
      '',
    ].join('\n')
  );
  console.log(`recorded → ${out}`);
}

process.exit(failedBaseline ? 1 : 0);
