#!/usr/bin/env bash
# Append one row per Claude step to usage/ledger.csv — the per-run cost/usage
# ledger the editorial pipeline commits alongside its content. Reads the
# claude-code-action execution files from $EXEC_WRITER / $EXEC_VERIFY (either
# may be empty when the step was skipped) and $MODEL. Never fails the job:
# the ledger is bookkeeping, not a gate.
set -uo pipefail

mkdir -p usage
LEDGER=usage/ledger.csv
[ -f "$LEDGER" ] || echo "date,workflow,run_id,step,model,cost_usd,duration_ms,turns" > "$LEDGER"

append() {
  local step="$1" file="$2"
  local cost="" dur="" turns=""
  if [ -n "$file" ] && [ -f "$file" ]; then
    cost=$(jq -r '[.. | objects | select(has("total_cost_usd")) | .total_cost_usd] | last // ""' "$file" 2>/dev/null || echo "")
    dur=$(jq -r '[.. | objects | select(has("duration_ms")) | .duration_ms] | last // ""' "$file" 2>/dev/null || echo "")
    turns=$(jq -r '[.. | objects | select(has("num_turns")) | .num_turns] | last // ""' "$file" 2>/dev/null || echo "")
  fi
  echo "$(date -u +%Y-%m-%d),${GITHUB_WORKFLOW:-local},${GITHUB_RUN_ID:-},${step},${MODEL:-},${cost},${dur},${turns}" >> "$LEDGER"
}

append writer "${EXEC_WRITER:-}"
if [ -n "${EXEC_VERIFY:-}" ]; then
  append verify "${EXEC_VERIFY:-}"
fi

exit 0
