#!/usr/bin/env bash
# Append one row per Claude step to usage/ledger.csv — the per-run cost/usage
# ledger the editorial pipeline commits alongside its content. Reads the
# claude-code-action execution files from $EXEC_WRITER / $EXEC_VERIFY (either
# may be empty when the step was skipped). The model is read from each row's
# own execution file, falling back to $MODEL_WRITER / $MODEL_VERIFY (then
# $MODEL) — one shared model label would mislabel the verify row, since the
# desks verify on a different model than they write with. Never fails the
# job: the ledger is bookkeeping, not a gate.
#
# The workflows snapshot the writer's execution file to a distinct path before
# the verify step runs — the action reuses one output path, so without the
# snapshot both rows would read the verify run's file.
set -uo pipefail

mkdir -p usage
LEDGER=usage/ledger.csv
[ -f "$LEDGER" ] || echo "date,workflow,run_id,step,model,cost_usd,duration_ms,turns" > "$LEDGER"

append() {
  local step="$1" file="$2" fallback_model="$3"
  local model="" cost="" dur="" turns=""
  if [ -n "$file" ] && [ -f "$file" ]; then
    model=$(jq -r '[.. | objects | select(has("model")) | .model] | last // ""' "$file" 2>/dev/null || echo "")
    cost=$(jq -r '[.. | objects | select(has("total_cost_usd")) | .total_cost_usd] | last // ""' "$file" 2>/dev/null || echo "")
    dur=$(jq -r '[.. | objects | select(has("duration_ms")) | .duration_ms] | last // ""' "$file" 2>/dev/null || echo "")
    turns=$(jq -r '[.. | objects | select(has("num_turns")) | .num_turns] | last // ""' "$file" 2>/dev/null || echo "")
  fi
  [ -n "$model" ] || model="$fallback_model"
  echo "$(date -u +%Y-%m-%d),${GITHUB_WORKFLOW:-local},${GITHUB_RUN_ID:-},${step},${model},${cost},${dur},${turns}" >> "$LEDGER"
}

append writer "${EXEC_WRITER:-}" "${MODEL_WRITER:-${MODEL:-}}"
if [ -n "${EXEC_VERIFY:-}" ]; then
  append verify "${EXEC_VERIFY:-}" "${MODEL_VERIFY:-${MODEL:-}}"
fi

exit 0
