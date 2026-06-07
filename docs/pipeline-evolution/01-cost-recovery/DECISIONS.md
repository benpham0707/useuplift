# Decisions — Cost Recovery

> Decisions Tue has made or is asked to make. Append-only, dated.

**Last updated**: 2026-04-26

---

## Open decisions

### D5 — Integration sequencing with 02 / 03 / Architecture track before any fixture run

**Raised**: 2026-04-26 (Tue)
**Context**: Tue's directive — the consolidated changeset should not be finalized or run in isolation from the rest of the system iteration plan. The verification run is the most expensive single artifact in this workstream and tests the entire pipeline. Running it before integrating with:
- 02 Conversator design (returning shortly, will affect L3 walk + L5 injection surfaces)
- 03 RAG design (returning shortly, will affect retrieval flag flip + injection surfaces)
- Architecture-track L3.75 retirement plan (`planned`, `L3_ABSORBS_L3_75.md`)
- The four locked changeset decisions (D1–D4 above)

…would risk:
- A verification run that validates a pipeline shape that's about to be re-architected.
- Localized improvements that aren't aligned with the system-wide plan.
- Wasted spend on a $1.50–$2.00 fixture that doesn't also stress the integration seams 02/03 will introduce.

**Outcome**: this decision supersedes D4 (single 3-fixture run for $10–12) and replaces it with a sequenced integration gate.

**Required gate before any fixture run**:
1. 02 design doc returns and updates `02-conversator-ground-truth/PLAN.md`.
2. 03 design doc returns and updates `03-intelligent-rag/PLAN.md`.
3. H7 (lens-direct injection acks) resolved by both 02 and 03.
4. H1, H2, H3, H4, H5, H6 reviewed against the returned designs and either resolved or explicitly carried.
5. Cost chat re-evaluates the changeset against the integrated picture — confirm Phases A–E are still the right Phase A–E (not invalidated by integration realities).
6. Architecture track's relationship to the changeset re-confirmed (changeset still runs first, pivot still follows — but ensure no Phase A–E item is undermined by the imminent L3.75 retirement).
7. Only THEN, schedule the single-fixture verification run.

**Decision**: APPROVED (2026-04-26, Tue) — integration first, then 1-fixture verification.

---

## Resolved decisions

### D1 — poolDensity coaching warning

**Raised**: 2026-04-23
**Resolved**: 2026-04-26
**Context**: `coachingService.ts:2809–2810` uses `archetypeContext.poolDensity` (numeric) to warn students on saturated archetypes. Phase C3 low-consumer deletions would remove this field from Phase B output.

**Options**:
- **(a)** Keep the warning, migrate prompt to emit `rarity: 'common' | 'moderate' | 'rare'` instead of numeric poolDensity. Update coaching consumer.
- **(b)** Delete the warning entirely. Simplifies coaching, loses the saturation signal.
- **(c)** Keep `poolDensity` field — don't delete. Accept the ~200 tokens in Phase B output. Re-test whether discipline+caps alone get us under cap.

**Decision**: **(c)** Keep field (2026-04-26, Tue).
**Rationale**: smallest risk for this PR. 200 tokens not load-bearing for hitting the cap. Migration to `rarity` (option a) deferrable; better executed under the L3.75 retirement when archetypeContext gets re-architected anyway.

---

### D2 — `revealedQualities` → `valuesRevealed` merge

**Raised**: 2026-04-23
**Resolved**: 2026-04-26
**Context**: Phase B has `revealedQualities: string[]` and `valuesRevealed: string[]` — overlapping concepts. Merging saves ~200 tokens but `essayCoachingRoutes.ts:237,264,305` exports `revealedQualities`.

**Options**:
- **(a)** Keep both for this PR (safe).
- **(b)** Merge now, update API route.

**Decision**: **(a)** Keep both (2026-04-26, Tue).
**Rationale**: not load-bearing for cap; consumer migration cost > savings for this PR. Defer to a future cleanup pass.

---

### D3 — `SYNTHESIS_MAX_TOKENS_PHASE_B` safety buffer

**Raised**: 2026-04-23
**Resolved**: 2026-04-26
**Context**: Current cap 10,000. Target after Phase C: ≤8,000. Buffer prevents truncation-class recurrence on variance.

**Options**:
- **(a)** Raise cap to 12,000.
- **(b)** Keep at 10,000.

**Decision**: **(a)** Raise to 12,000 (2026-04-26, Tue).
**Rationale**: defensive, cheap, eliminates a class of failures. 2,500-token headroom costs nothing on disciplined runs.

---

### D4 — Verification budget approval (SUPERSEDED)

**Raised**: 2026-04-23
**Resolved**: 2026-04-26 (superseded by D5 integration gate + revised verification scope)
**Original options**: 2/3/8 fixtures.

**Decision**: **revised** (2026-04-26, Tue). Replaces the multi-fixture proposal with:
- **1-fixture verification** (not 3, not 8). Default fixture: 05-harvard-2028-i-too-can-dance (median, well-understood baseline, has full prior cost ledger for delta comparison).
- **Cost target per run**: $1.50–$2.00 if the changeset lands as expected (not $3–4). This implies the changeset's expected effect is independently visible in the ledger of a single run.
- **Trigger**: only after D5 integration gate is satisfied.
- **Failure-on-fixture-05 follow-up**: if fixture 05 reveals a Phase B truncation regression that fixture 05 doesn't trip (because 05 was previously NEAR cap, not OVER it), THEN — and only then — schedule a follow-up run on fixture 02 or 09. Don't pre-budget for it.

**Rationale**: Tue's correction — we never read through all 8 fixtures. Single-fixture verification is the standard. The $3–4-per-run number was inflated by my prior assumption of post-cuts pricing; ledger should show post-cuts cost ≤$2.00. If it doesn't, that itself is the signal to investigate, not a reason to expand fixture count.

---

## How to close a decision

1. Move entry from `Open` to `Resolved`.
2. Add `**Decision**: <option> (<date>, <by>)` and optional `**Rationale**: <reason>` line.
3. Update [PLAN.md](./PLAN.md) status if decision unblocks a phase.
