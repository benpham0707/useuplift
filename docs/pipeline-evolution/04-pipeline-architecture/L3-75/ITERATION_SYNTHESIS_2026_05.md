# L3.75 Retirement — Iteration Synthesis (May 2026)

> **Status**: `in-progress` — captures the May 6–7 design iteration, integrates the work cohesively across existing plans, and orders the path to L3.75 retirement.
>
> **Audience**: future sessions. Read this first if picking up the L3.75 retirement track.
>
> **Last updated**: 2026-05-07.

---

## TL;DR

Across two days (May 6–7) two pieces of work landed:

1. **R1 prompt-side fix shipped** (`f181f84`). 25 edits across `holisticSynthesis.ts` + `crystallizer.ts` aligning paragraph-numbering convention (1-indexed prose, 0-indexed data). Bridge value: the L4 portion is permanent; the L3.75 portion gets thrown away when L3.75 retires.

2. **`FIELD_DISPOSITION_TABLE.md` drafted and approved** (this directory). 45 L3.75 output fields classified into seven dispositions. Five design decisions resolved.

The decisions sharpen [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md): more fields move to **deterministic composition** than the absorption plan originally had as lens emissions, the residue call shrinks from 4 fields to truly-emergent-only, and calibration is per-essayType from the start. Cost projection moves the architecture-track endpoint from ~$0.08/essay (absorption plan) to ~$0.09–0.10/essay equivalent — slightly higher because we kept the SignatureMove micro-call separate from the residue call, but with markedly higher reliability and a much smaller LLM-touched surface.

**No further API spend authorized this iteration.** Per the cost discipline memory, calibration and output improvements bundle before the next $1.70 verification run.

---

## What just shipped

### R1 prompt fix — `f181f84` (May 6)

**Diagnosis**: L3 walk had used 1-indexed input markers (`[P${i + 1}]`) since day one. L3.75 and L4 silently re-rendered the same paragraphs as 0-indexed (`[P${i}]`) in their LLM input context, then asked for 1-indexed display via parentheticals. The strongest signal — input markers — won, producing 65 R1 lint findings in the post-Gap-1 Crochet dump.

**Three categories of edits**:
- **A. Prompt text** (8 edits, `holisticSynthesis.ts`): SHARED_PREAMBLE convention rule, contamination example, bookending example, curation Level 3 example, SignatureMove EVIDENCE GROUNDING, both worked-example preambles, post-example note.
- **B. Input rendering** (15 sites across both files): `[P${i}]` → `[P${i + 1}]` everywhere the LLM sees a paragraph label.
- **C. Convention block** (3 sites in `crystallizer.ts`): explicit `=== DISPLAY CONVENTION ===` prepended to L4a NorthStar / L4a ScoreMatrix / L4b system prompts.

**Verification at commit time**: `npx tsc --noEmit` exit 0, `npx vitest run tests/unit/dump-lint.test.ts` 11 passed + 2 skipped. Real R1 reduction confirms only on next dump regen.

**Bridge accounting**:
- L4 edits (Categories C + half of B): permanent. Stand even after L3.75 retires.
- L3.75 edits (Category A + the holisticSynthesis.ts portions of B): throwaway. Deleted with L3.75.
- Net: shipping the bridge was correct because the L4 portion is permanent infrastructure.

---

## What's drafted but uncommitted

### `FIELD_DISPOSITION_TABLE.md` (May 7)

Row-by-row classification of every L3.75 output field. 431 lines. Approved at design review.

**Disposition tally**:

| Disposition | Count | Cost | Owner |
|---|---|---|---|
| **DET** — Deterministic composition | 17 | $0 | Pure-function `compositionLayer.ts` |
| **LENS** — Lens-direct LLM emission | 28 | rolled into L3 redesign | L3 dimension lens prompts |
| **RESIDUE** — Pass 3 small Sonnet call | 4 | ~$0.05 | One bounded post-lens call |
| **L35** — Migrated to L3.5 output | 3 | $0 (additive) | L3.5 schema extension |
| **L4B** — Migrated to L4b | 1 | $0 | L4b ImprovementManifest |
| **CUT** — Deleted entirely | 8+ | savings | — |
| **MICRO** — SignatureMove validated micro-call | 1 | ~$0.04 | Standalone, today's pattern preserved |

**Five design decisions resolved**:
1. `growthArc` → LENS (Story or Character lens; templating produces architectural-function listing, not growth narrative)
2. `institutionalFit` → LENS (Admissions lens; templating type-casts archetypes)
3. `arcTrajectory` → RESIDUE (templating produces register listing, not arc shape)
4. Calibration constants → per-essayType config from the start (`CALIBRATION[essayType]` keyed by `'common_app' | 'piq' | 'supplement'`)
5. Lens-failure behavior → inherit from walk where equivalent exists; emit empty otherwise (no fallback synthesis)

See [`FIELD_DISPOSITION_TABLE.md`](./FIELD_DISPOSITION_TABLE.md) for the full per-field detail.

---

## How this threads through existing plans

| Existing plan | What changes in this iteration |
|---|---|
| [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md) — locked direction | **Sharpened, not superseded**. Same architectural pivot (kill L3.75, absorb into L3 + L3.5 + L4b). The disposition table extends it by pushing 6 specific fields (`peakMoments`, `emotionalProgression`, `craftSignatures`, `stabilityRegions`, `imageSystem`, `connectionGraphSummary`) from LENS to DET. Cuts/migrations all preserved. The absorption plan's "Pass 3" is renamed "RESIDUE call" and shrinks to the irreducible 4 fields. |
| [`L3/PLAN.md`](../L3/PLAN.md) — draft | Lens prompts (Voice / Meaning / Story / Admissions) implement the LENS rows from the disposition table. Lens output schemas need refinement to emit only canonical profile fields, not duplicates of what composition already produces. |
| [`L4/PLAN.md`](../L4/PLAN.md) — draft | Confirmed: pairedImprovement migration to L4b ImprovementManifest. NorthStar + ScoreMatrix prompt updates for cut fields (already partially in flight via R1 fix in `crystallizer.ts`). |
| [`MASTER_INTEGRATION_PLAN.md`](../MASTER_INTEGRATION_PLAN.md) — locked v2 | Phase 4a (L3 redesign + L3.75 deletion) absorbs this disposition. No new sub-phase needed. The composition layer is a new ~300–400 line pure-function module added to Phase 4a's deliverable list. |
| [`01-cost-recovery/PLAN.md`](../../01-cost-recovery/PLAN.md) — frozen on D5 gate | Unchanged. Cost-recovery changeset still ships first as a bridge under current architecture. The R1 fix already shipped (May 6) is a one-off independent of this changeset. |
| [`L3_75_REDESIGN__SUPERSEDED.md`](./L3_75_REDESIGN__SUPERSEDED.md) | Still superseded. No relationship to this iteration. |

**Dependency graph**:

```
R1 prompt fix (SHIPPED f181f84)
    │
    └── L4 portion: permanent infrastructure
    └── L3.75 portion: throwaway when L3.75 retires
        │
        ▼
FIELD_DISPOSITION_TABLE.md (DRAFTED)
    │
    └── feeds → compositionLayer.ts implementation (PENDING)
    └── feeds → L3 redesign lens prompts (PENDING — extends L3/PLAN.md)
    └── feeds → Residue call prompt (PENDING — refines L3_ABSORBS Pass 3)
    └── feeds → L3.5 schema additions (PENDING — contradictionFlags + essayStrengthSignatures)
    └── feeds → L4b ImprovementManifest extension (PENDING)
    │
    ▼
L3.75 retirement PR
    │
    Blocked by:
    ├── ⬜ 02 Conversator design return
    ├── ⬜ 03 RAG design return
    ├── ⬜ Composition layer + snapshot parity ($0 work)
    ├── ⬜ Lens prompts drafted
    ├── ⬜ Residue call prompt drafted
    ├── ⬜ Single bundled verification dump regen (~$1.70)
    └── ⬜ Tue final approval
```

---

## Architectural read — why this matters

### Audit evidence: L3.75 is mostly repetitive
- §1.3 Strength Signatures: 6 of 12 entries read like internal verdicts copied wholesale from L3/L3.5
- §1.4 Coherence Report: 11 contradictions, ~6 are same-fact-cross-sections re-routed through `system_disagreement` lens
- §3.4: ~250 lines of duplicated rationale prose
- Gap 1: `strengthSignatures[0]` ("Misdirection opening") + `signatureMove.instances[0-1]` cite the same evidence; `strengthSignatures[4]` ("Specific naming") + `signatureMove.instances[3]` cite Agnes-the-elephant — duplicated synthesis at parallel granularity

### The structural-composition discipline (this iteration's framing)
Most of L3.75's work falls into four categories:
1. **Aggregation** (~30%): collecting per-paragraph observations the walk already produced
2. **Topology / pattern detection** (~10%): graph algorithms, run-length encoding, set differences
3. **Composition** (~20%): templated joins of structured slots (writerPortrait template-from-3-lenses, imageSystem from imageRecurrences)
4. **Listicle filtering** (~10%): "take L3 techniques where significance ≥ X, dedupe, cap"

Only ~30% is **genuine emergence** that requires LLM synthesis. The disposition table separates these so each is owned by the right mechanism: pure functions for the first four categories, lens-direct emission for dimension distillation, residue call only for irreducibly cross-dimensional fields.

### Cost trajectory

| State | L3.75-equivalent cost | Total essay cost (Crochet baseline) |
|---|---|---|
| Today (May 7, post-Gap-1) | ~$0.49 | $1.69 |
| After 01 cost-recovery changeset (Phases A–E land) | ~$0.30–0.40 | ~$1.30–1.40 |
| After L3.75 retirement (this iteration's destination) | ~$0.09–0.10 | ~$0.85–0.95 |
| Compounded downstream (smaller profile injected into L4/L5/L6) | — | additional ~$0.10 |
| **Endpoint** | **~$0.09–0.10** | **~$0.75–0.85** (~50% recovery vs today) |

Note: the L3.75-retirement-track endpoint cost is slightly higher than the absorption plan's ~$0.08 because we keep SignatureMove as its own validated micro-call rather than folding into the residue call. The trade-off is reliability — SignatureMove's validator pattern (substring + paragraph-index + null-on-drift) is proven on Crochet + Three Days; folding into a multi-field call dilutes the validator's guarantees.

---

## Sequenced next steps (with blockers)

### 1. Hold for input from other workstreams (BLOCKING)
- **02 Conversator design return** — `awaiting-integration` per `00-index/CURRENT_STATE.md`. The design must confirm ExperienceProfile injection compatible with lens-direct emission.
- **03 Intelligent RAG design return** — same status. Research-block injection points into lens user prompts.
- **Tue's review of `FIELD_DISPOSITION_TABLE.md`** — five decisions resolved 2026-05-07; the doc itself is approved but the integration into the master plan is still pending Tue's read of this synthesis doc.

### 2. Composition layer implementation (zero API cost)
**Independent of upstream blockers.** Can start immediately.
- Implement `src/services/essayIntelligence/analysis/compositionLayer.ts` per the function signatures in `FIELD_DISPOSITION_TABLE.md` § "Composition Layer — module spec"
- 16 pure functions, each with ≥3 unit tests including null-slot, empty-array, single-paragraph edge cases
- Per-essayType `CALIBRATION` config with three pre-tuned profiles (common_app / piq / supplement)
- Snapshot parity gate: run composition functions against persisted Crochet + Three Days JSONs (already on disk per R6 / commit `465ab62`); diff against existing L3.75 outputs for equivalent fields
- Acceptance: composition outputs are semantically equivalent or richer for every field. Worse fields → reclassify in disposition table to LENS or RESIDUE before any LLM work

### 3. Lens prompt specification (depends on 02 + 03)
Lens prompts (Voice / Meaning / Story / Admissions) implement the LENS rows. Each lens emits its dimension's canonical profile fields directly — no separate synthesis.
- Update [`L3/PLAN.md`](../L3/PLAN.md) with lens emission schemas matching disposition table
- Each lens prompt absorbs discipline directives from `L3_75_REDESIGN__SUPERSEDED.md` §7
- Cap each lens output at ~3–4K tokens (split documented as fallback if quality degrades)

### 4. Residue call prompt (depends on lens schemas)
Single Sonnet call producing 4 fields:
- `characterRevelation.writerPortrait`
- `entanglements[]` (cap 3, foundational/supporting only)
- `emotionalTopography.arcTrajectory`
- `momentEarnednessMap.moments[].mechanisms[]`
- (optional) `connectionGraphSummary` if topology prose can't be templated cleanly — but disposition table currently has this as DET; lean DET unless parity gate disagrees

Hard cap: 3K output tokens, no iteration, validator-per-field.

### 5. L3.5 schema additions (parallel-safe)
Per absorption plan locked decision #5 + #6:
- `AnalysisPassOutput.contradictionFlags[]` — cross-lens disagreement detection (zero new API call; schema addition to existing L3.5 prompt)
- `AnalysisPassOutput.essayStrengthSignatures[]` — migrated from L3.75
- L3.5 system prompt extended to instruct cross-lens contradiction scan

### 6. L4b ImprovementManifest extension
Per absorption plan locked decision #7:
- L4b prompt absorbs `pairedImprovement` payload (technique + directive + architecturalReason + demonstrationSketch + expectedImpact)
- Update [`L4/PLAN.md`](../L4/PLAN.md) with the schema extension
- Cost-neutral on the swap (~+$0.03–0.05 L4b output, –$0.04 L3.75 shrink)

### 7. Single bundled verification dump regen (~$1.70)
**Bundle these signals into one verification run**:
- R1 lint reduction (65 → ≤5 expected)
- R2 ratchet (46 → 0 expected, renderer fix shipped 465ab62)
- R3 ratchet (215 → <30 expected, renderer fix shipped 465ab62)
- R4 reduction (12 → reduced, renderer dedup shipped 465ab62)
- R6 JSON persistence (file should exist alongside markdown)
- Composition layer snapshot parity outputs vs. live L3.75 outputs (this run is the cross-check)

If composition parity passes, lens prompts are ready, residue call is drafted, and L3.5/L4b schemas are extended → this is the same run that validates the new shape end-to-end.

### 8. L3.75 retirement PR (single coordinated PR)
Once 1–7 land:
- Add `compositionLayer.ts` to runtime
- Wire lens emissions to write canonical profile fields directly
- Wire residue call (Pass 3) to produce 4 fields
- Wire L3.5 contradictionFlags + essayStrengthSignatures
- Wire L4b ImprovementManifest pairedImprovement
- Delete `holisticSynthesis.ts` (~2,500 lines)
- Delete iteration orchestration in `analysisOrchestrator.ts` (~200 lines)
- Delete `holisticMutator.ts` synthesis-specific functions
- Delete UnderstandingProse (UI absorbs rendering from structured fields)
- Migrate ~6 consumer reads (per absorption plan)
- Tag the pre-delete commit for one-shot rollback

### 9. Post-launch telemetry course-correction (per absorption plan locked decision #13)
Triggers for prompt re-tuning (NOT re-introducing L3.75):
- contradictionFlags rate <5% or >30%
- strengthSignatures count outside 4–10 range
- Portrait UX regression signal
- DET parity drift on a new fixture (composition rule reads thin) → reclassify field, refactor

---

## What we're NOT doing this iteration (deferred)

These items appeared in audit findings or earlier plans but are explicitly out of scope for L3.75 retirement:

| Deferred item | Reason | Where it lives |
|---|---|---|
| **R5 — Tiered output (student / counselor / debug)** | Needs canonical profile JSON. R6 (already shipped) enables this; tiered renderer is a separate PR after L3.75 retirement. | New future PR |
| **R4 architectural Findings cross-reference by ID** | Would consolidate ~250 lines of duplicated rationale prose. Architectural change requiring all sections to use `[F#]` references instead of re-emitting prose. | Backlog, post-retirement |
| **Tier 5.1 L4 caching restructure** | RAG owns final shape long-term. Defer until 03 RAG design returns + lands. | RAG track |
| **L5 surface composer redesign** | Phase 4d in master plan. Independent of L3.75 retirement. | MASTER_INTEGRATION_PLAN Phase 4d |
| **L6 phase-aware coaching update** | Phase 6.5 in master plan. Independent. | MASTER_INTEGRATION_PLAN Phase 6.5 |
| **Phase-aware lens dispatch** | Sweep-based optimization. Documented in absorption plan as a future option if a single lens underperforms on unusual essays. | Backlog |

---

## Risks and what we're holding for

### Risk: cost-recovery 01-changeset never lands
The 01 changeset is `awaiting-integration` on D5 gate. If 02/03 designs delay further, the changeset accumulates. The R1 fix shipped May 6 is independent — it's not part of the changeset and doesn't need D5.

**Mitigation**: this iteration is also independent of D5. The L3.75 retirement track unblocks when 02/03 designs return AND when composition layer + lens prompts + residue call are drafted — none of which require 01 to ship first.

### Risk: composition layer snapshot parity fails on a field
A DET-classified field reads thin compared to L3.75's LLM output.

**Mitigation**: the parity gate is zero-API-cost. Reclassify the failed field to LENS or RESIDUE in the disposition table before any verification run. Document the reclassification reasoning in `FIELD_DISPOSITION_TABLE.md`.

### Risk: lens prompts overrun output cap
Each lens emits its dimension's canonical profile fields directly. If voice lens needs to emit voiceIdentity + voiceMap + craft prose all in one 3–4K cap, attention budget may strain.

**Mitigation**: documented fallback in absorption plan locked decision #10 — split a single lens into two calls (e.g., spatial-only + narrative-distillation for Voice) before reverting to L3.75-style synthesis. ~$0.06 → $0.12 voice cost on split is acceptable.

### Risk: SignatureMove + writerPortrait emit duplicative synthesis
SignatureMove (MICRO) and writerPortrait (RESIDUE) both produce essay-level singular claims. The Crochet audit already showed signatureMove + strengthSignatures[0] duplication.

**Mitigation**: residue call prompt explicitly instructs writerPortrait to NOT name the signature move (it lives in its own field). The two calls run in parallel; their outputs go to different profile fields. UI / dump renderer renders signatureMove first, writerPortrait second, so duplication if it occurs is visible in audit and triggers prompt re-tuning per locked decision #13.

### Risk: cost-budget discipline (per `feedback_cost_budget.md`)
"Don't run another test until enough calibration is bundled." The iteration plan respects this — composition layer + lens prompts + residue call + L3.5 schema + L4b extension all need to land before the single $1.70 verification run that validates everything together.

---

## Living-state map

For tracking what's where during this iteration:

| Artifact | Path | Status | Updated |
|---|---|---|---|
| R1 prompt fix | `src/services/essayIntelligence/analysis/holisticSynthesis.ts` + `crystallizer.ts` | ✅ Committed `f181f84` | 2026-05-06 |
| Field disposition table | `docs/pipeline-evolution/04-pipeline-architecture/L3-75/FIELD_DISPOSITION_TABLE.md` | ✅ Drafted, decisions resolved, uncommitted | 2026-05-07 |
| Iteration synthesis (this doc) | `docs/pipeline-evolution/04-pipeline-architecture/L3-75/ITERATION_SYNTHESIS_2026_05.md` | ✅ Drafted, uncommitted | 2026-05-07 |
| Composition layer module | `src/services/essayIntelligence/analysis/compositionLayer.ts` | ⬜ Not yet implemented | — |
| Composition layer tests | `tests/unit/composition-layer.test.ts` | ⬜ Not yet implemented | — |
| Lens prompts | TBD per `L3/PLAN.md` | ⬜ Not drafted | — |
| Residue call prompt | TBD per `L3/PLAN.md` | ⬜ Not drafted | — |
| L3.5 schema extension | `src/services/essayIntelligence/analysis/analysisPass.ts` | ⬜ Not extended | — |
| L4b ImprovementManifest extension | `src/services/essayIntelligence/analysis/crystallizer.ts` | ⬜ Not extended | — |

Update this table whenever an artifact's status changes. When the L3.75 retirement PR ships, this entire iteration synthesis doc gets folded into a post-mortem and archived alongside `L3_75_REDESIGN__SUPERSEDED.md`.

---

## Cross-references

**Within this directory**:
- [`L3_ABSORBS_L3_75.md`](./L3_ABSORBS_L3_75.md) — locked architectural direction
- [`FIELD_DISPOSITION_TABLE.md`](./FIELD_DISPOSITION_TABLE.md) — per-field dispositions + composition layer spec
- [`L3_75_REDESIGN__SUPERSEDED.md`](./L3_75_REDESIGN__SUPERSEDED.md) — superseded; reusable §3 inheritance map + §7 discipline directives + §11 fixture-05 stress test

**Within architecture track (`04-pipeline-architecture/`)**:
- [`MASTER_INTEGRATION_PLAN.md`](../MASTER_INTEGRATION_PLAN.md) — locked v2; Phase 4a absorbs this iteration's work
- [`L3/PLAN.md`](../L3/PLAN.md) — Sweep + lens architecture; lens prompts implement LENS rows
- [`L4/PLAN.md`](../L4/PLAN.md) — L4b absorbs pairedImprovement (locked decision #7)
- [`INTEGRATED_BUILD_SEQUENCE.md`](../INTEGRATED_BUILD_SEQUENCE.md) — executable spine; Phase 4a deliverables D-4a.* extend to include composition layer

**Cross-track**:
- [`../01-cost-recovery/PLAN.md`](../../01-cost-recovery/PLAN.md) — bridge changeset; ships first under current architecture; D5 gate
- [`../02-conversator-ground-truth/PLAN.md`](../../02-conversator-ground-truth/PLAN.md) — design returned; lens-direct injection compatibility check
- [`../03-intelligent-rag/PLAN.md`](../../03-intelligent-rag/PLAN.md) — design returned; research-block lens injection compatibility check

**Index / state**:
- [`../../00-index/CURRENT_STATE.md`](../../00-index/CURRENT_STATE.md) — workstream status tracker (needs update to reflect this iteration's work)
- [`../../00-index/INTEGRATION_MAP.md`](../../00-index/INTEGRATION_MAP.md) — cross-workstream dependency map

**Codebase artifacts**:
- `src/services/essayIntelligence/analysis/holisticSynthesis.ts` — to be deleted in retirement PR
- `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` — L3 walk; already 1-indexed input
- `src/services/essayIntelligence/analysis/analysisPass.ts` — L3.5; absorbs contradictionFlags + essayStrengthSignatures
- `src/services/essayIntelligence/analysis/crystallizer.ts` — L4; absorbs pairedImprovement, R1 convention block already added
- `src/services/essayIntelligence/profileTypes.ts` — type definitions; receives the cuts from absorption plan
- `tests/output/full-profile-14-harvard-2028-crochet.json` — persisted profile JSON for snapshot parity (per R6 / commit `465ab62`)
- `tests/output/full-profile-06-harvard-2028-three-days-before-a-plane.md` + .json — second snapshot parity fixture
