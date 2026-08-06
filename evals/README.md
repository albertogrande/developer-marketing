# Editorial-judgment evals

The writer skills are prompts, and a prompt change used to ship unmeasured.
This harness replays frozen decision points through the **current** skill text
and grades the outcome deterministically — a regex over the decision line, no
judge model.

## Suites

- **scout** (`cases/scout/<id>/`) — synthetic promotion calls: one captured
  signal (`signal.txt`) judged against the scout skill's wire-promotion
  criteria; `expected.yml` says whether it clears the bar (`wire: yes|no`).

The newsroom suite retired with the newsroom itself in the 2026-08 two-writer
refactor (its skill no longer exists to test). The natural next additions are
**editor** cases: frozen weekly states graded on the normal-vs-special-issue
call and on claims-reconciliation decisions (stamp stale vs retire).

## Running

```bash
node evals/run.mjs                      # everything
node evals/run.mjs --suite scout        # one suite
node evals/run.mjs --case small-company # one case
node evals/run.mjs --record             # also write usage/evals/<date>.md
```

Needs the `claude` CLI on PATH and auth (`CLAUDE_CODE_OAUTH_TOKEN` in CI).
Default model is Opus-class (`claude-opus-4-8`); override with `--model` or
`EVAL_MODEL`.

## Cost and cadence

Each case is a real model run — minutes and cents. CI (`evals.yml`) therefore
triggers only on pull requests touching `.claude/skills/**` or `evals/**`:
evals gate prompt changes, not content. The pass-rate floor per suite lives
in `baseline.yml`.

## Adding a case

Scout: write `signal.txt` in the signals one-liner format and `expected.yml`
with a comment naming the criterion that decides it.
