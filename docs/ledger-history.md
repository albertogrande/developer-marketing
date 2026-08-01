# Ledger history note — rows before 2026-08-01

`usage/ledger.csv` rows written before 2026-08-01 carry two known recording
bugs, left in place because the ledger is append-only history:

1. **Writer and verify rows are duplicates.** `claude-code-action` reuses one
   execution-file path across invocations, so by the time the ledger step ran,
   both `EXEC_WRITER` and `EXEC_VERIFY` pointed at the verify run's file. On
   every two-step day the two rows are byte-identical in cost, duration, and
   turns — summing the column double-counts those days. Sum the `writer` rows
   only for a lower bound; the true total lies between that and the recorded
   total.

2. **Verify rows carry the writer's model label.** A single `$MODEL` env var
   stamped both rows, so e.g. deep-dive `verify` rows say `claude-fable-5`
   when the verifier actually ran `claude-sonnet-5`.

Both were fixed on 2026-08-01: the workflows snapshot the writer's execution
file before the verify step runs, and `scripts/append-ledger.sh` reads each
row's model from its own execution file (falling back to per-step
`MODEL_WRITER`/`MODEL_VERIFY`). Rows from that date on are trustworthy
per-step records.
