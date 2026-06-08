# Cost Recovery — Architecture Track

> Forward-looking architectural plans owned by the Cost Recovery workstream. **Distinct from the consolidated changeset** in [`../PLAN.md`](../PLAN.md), which is the immediate cost/correctness PR.

## What lives here

Plans that go beyond the immediate consolidated changeset and shape the medium-term pipeline architecture. These are NOT part of the next PR — they're what the architecture should look like AFTER the changeset lands and after L3 redesign + workstream 02/03 design docs return.

## Files

| File | Status | Authoritative? |
|---|---|---|
| [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md) | `draft` | **YES** — current authoritative architectural plan |
| [`L3_75_REDESIGN__SUPERSEDED.md`](./L3_75_REDESIGN__SUPERSEDED.md) | `superseded` 2026-04-24 | NO — reference only; reusable pieces called out in its header |

## How to read this directory

1. Start with [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md). It's the current plan.
2. Read the superseded doc only if you need:
   - The detailed §3 inheritance map (which lens output produces which holistic field).
   - The §7 prompt discipline directives.
   - The §11 fixture-05 stress test output shapes.
   - The §12 failure mode catalog.

## Relationship to the consolidated changeset

The changeset in [`../PLAN.md`](../PLAN.md) operates on the CURRENT architecture and ships FIRST. It preserves L3.75. It fixes the iter_1 regression, the Phase B truncation bug, the cache misses, and dead code.

After the changeset lands and verifies, the architecture pivot in [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md) becomes implementable — pending:

- L3 redesign (lens + sweep schemas) ships.
- Workstream 02 (Conversator) and 03 (RAG) design docs return and confirm injection-point compatibility with lens-direct injection.
- Tue approves the architectural pivot.

## Updates

- **2026-04-24** — Created. `L3_75_REDESIGN.md` (originally written 2026-04-23 in `docs/analysis/`) moved here as `L3_75_REDESIGN__SUPERSEDED.md`. New `L3_ABSORBS_L3_75.md` written as authoritative replacement.
