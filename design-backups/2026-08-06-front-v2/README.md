# Backup — front page v2 ("the edition"), retired 2026-08-06

Snapshot of the homepage before the stream/reference redesign (front v3).

- `index.astro` — the v2 front page: wire ticker, boxed lead ("THE WEEK"),
  secondary issue duo, wire list, handbook/reference rail, keyboard footer.
- `main.scss` — the full stylesheet as of the same commit. The v2-specific
  blocks are `.fm--v2`, `.fm2-grid`, `.tick*`, `.rail-*`, `.fm-duo`,
  `.fm-box--sec`, `.fm-date` (all still present in the live stylesheet too,
  so restoring is just copying `index.astro` back).

To restore: `cp design-backups/2026-08-06-front-v2/index.astro src/pages/index.astro`
and rebuild. Git history also has it: the last commit shipping v2 is the one
that touches this directory's parent commit.
