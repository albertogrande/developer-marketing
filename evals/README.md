# Editorial-judgment evals

The writer skills are prompts, and a prompt change used to ship unmeasured.
This harness replays frozen decision points through the **current** skill text
and grades the outcome deterministically — a regex over the decision line, no
judge model.

## Suites

- **scout** (`cases/scout/<id>/`) — synthetic promotion calls: one captured
  event (`signal.txt`) judged against Step 3 of the scout skill, "Promote what
  qualifies to Signals"; `expected.yml` says whether it clears the bar
  (`promote: yes|no`).
- **editor** (`cases/editor/<id>/`) — two graded judgments over frozen
  context (`context.md`): the normal-vs-special issue call (Step 4 of
  weekly-editor; `type: shape`, expected `shape: normal|special`) and the
  claims-reconciliation verdict (Step 5.5; `type: claim-status`, expected
  `status: current|stale|retired`).
- **jobs** (`cases/jobs/<id>/`) — two graded judgments over a frozen job
  posting (`jd.txt`): the three-part scope test (`type: scope`, expected
  `include: yes|no`) and the remote-region classification (`type: region`,
  expected `region: worldwide|eu|usa|other`).

The newsroom suite retired with the newsroom itself in the 2026-08 two-writer
refactor (its skill no longer exists to test).

## Running

```bash
node evals/run.mjs                      # everything
node evals/run.mjs --suite scout        # one suite
node evals/run.mjs --case small-company # one case
node evals/run.mjs --repeat 3           # 3 runs per case; reports the spread
node evals/run.mjs --record             # also write usage/evals/<date>.md
```

Needs the `claude` CLI on PATH and auth (`CLAUDE_CODE_OAUTH_TOKEN` in CI).
Default model is Opus-class (`claude-opus-5`); override with `--model` or
`EVAL_MODEL`.

**Repeats and what they tell you.** Each case scores its pass *rate*, and the
suite score is the mean of those rates, so one unstable case out of five costs
0.1 at `--repeat 2` rather than a whole 0.2. The spread is the point: a suite
at 0.80 where every case decides the same way every time is a prompt that is
**wrong**, and a suite at 0.80 that is flaky on two cases is a prompt that is
**ambiguous** at those decision points. Those need opposite fixes, and at
`--repeat 1` they are indistinguishable.

## Cost and cadence

Each case is a real model run — minutes and cents. CI (`evals.yml`) therefore
triggers only on pull requests touching `.claude/skills/**` or `evals/**`:
evals gate prompt changes, not content. The pass-rate floor per suite lives
in `baseline.yml`.

## Adding a case

Scout: write `signal.txt` in the signals one-liner format and `expected.yml`
with a comment naming the criterion that decides it.

Editor: write `context.md` as the frozen inputs (memory excerpt + the week's
evidence, or a claim + what re-verification found) and `expected.yml` with
`type:` plus the expected call — make the case a *clear* call; ambiguous
cases make flaky evals.
