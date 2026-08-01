# Editorial-judgment evals

The writer skills are prompts, and a prompt change used to ship unmeasured.
This harness replays frozen decision points through the **current** skill text
and grades the outcome deterministically — a regex over the decision line, no
judge model.

## Suites

- **newsroom** (`cases/newsroom/<date>/`) — real historical decision points
  mined from git: each case's `state/` is the exact repo state (signals,
  memory, decision log, backlog, published articles) the editor saw that
  morning, and `expected.yml` is the call it actually made (ran/skip, desk).
  The runner materialises the state in a scratch dir, overlays the current
  `newsroom` skill, and asks for the decision line only — no article, no web.
- **scout** (`cases/scout/<id>/`) — synthetic promotion calls: one captured
  signal (`signal.txt`) judged against the scout skill's brief-promotion
  criteria; `expected.yml` says whether it clears the bar (`brief: yes|no`).

## Running

```bash
node evals/run.mjs                     # everything
node evals/run.mjs --suite newsroom    # one suite
node evals/run.mjs --case 2026-07-30   # one case
node evals/run.mjs --record            # also write usage/evals/<date>.md
```

Needs the `claude` CLI on PATH and auth (`CLAUDE_CODE_OAUTH_TOKEN` in CI).
Default model is the production newsroom writer's (`claude-opus-4-8`);
override with `--model` or `EVAL_MODEL`.

## Cost and cadence

Each newsroom case is a real model run over ~40 files of frozen state — a few
minutes and tens of cents at Opus-class pricing; the full suite is ~11 runs.
CI (`evals.yml`) therefore triggers only on pull requests touching
`.claude/skills/**` or `evals/**`: evals gate prompt changes, not content.
The pass-rate floor per suite lives in `baseline.yml`.

## Adding a case

Newsroom: pick a decision from `editorial/NEWSROOM.md` that was a *clear*
call (ambiguous days make flaky evals), find the newsroom commit for that
date, and extract its parent's state:

```bash
c=$(git log --format="%H %s" | grep "Newsroom: <date>" | cut -d' ' -f1)^
mkdir -p evals/cases/newsroom/<date>/state
# copy editorial/*, signals/*, src/content/articles/*, MASTHEAD.md, AUTHORS.md
git show "$c:editorial/MEMORY.md" > evals/cases/newsroom/<date>/state/editorial/MEMORY.md
# … and so on, then write expected.yml
```

Scout: write `signal.txt` in the signals one-liner format and `expected.yml`
with a comment naming the criterion that decides it.
