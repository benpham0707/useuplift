# Post-Run Results — Cost Recovery

> Populated after the verification run. Holds ledger outputs, quality review notes, decision on ship vs revert.

**Last updated**: 2026-04-23
**Status**: empty — verification has not run yet.

---

## Expected contents

When the verification run lands, this directory should hold:

- `RUN_<timestamp>.md` — one entry per verification run, with:
  - Fixture list run
  - Cost gate results (ledger-measured)
  - Correctness gate results
  - Quality gate results (Tue's qualitative review)
  - Per-phase attribution ("Phase B1 landed, iter_1 rate dropped from 62.5% to X%")
  - Overall verdict: `ship` / `refine` / `revert`
- `LEDGER_<fixture>_<timestamp>.jsonl` — raw cost ledger for inspection
- `REGRESSIONS.md` — if any gate failed, what and why
