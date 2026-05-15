# Current State — Essay Intelligence Pipeline

> Single source of truth. Updated whenever any work item changes status. Read this first in every session.
>
> **This is a current-status descendant of [`UNIFIED_PLAN_HOLD_2026_05_10.md`](./UNIFIED_PLAN_HOLD_2026_05_10.md)** — the planning rationale lives there. This doc captures *what's live now* and *what's queued next*.

**Last updated**: 2026-05-14 (L5 Top-N ranker landed).
**Branch**: `fix/warm-edit-completedalllayers`.
**HEAD**: post-Phase-0a + L5 ranker (Top-N capability shipped as Phase 5 prerequisite).

---

## Executive snapshot

| Item | State |
|---|---|
| **Cost (Crochet baseline)** | $1.69 per cold-start (per `tests/output/full-profile-14-harvard-2028-crochet.md` self-report) |
| **Cost target (v2, locked D1)** | $0.85 cold-start / ~$1.20 lifecycle (1 cold + 3 focused) |
| **Annotation density (locked 2026-05-12)** | **20-30 L5Annotation per essay**, with ~250-375 tokens per annotation (depth > breadth). Carry-forward via `priorAnnotations` builder handles iteration N≥2 progression — NOT a per-call density backfill. |
| **Active execution plan** | 8-phase unified — Phase 0a/0b/1 shipped; Phase 2 next |
| **Test baseline** | 688 passed / 5 skipped (was 680/5; +8 for student-doc markdown projection) |
| **Workstreams** | 04 active. 01 dissolved-into-04. 02 + 03 superseded by L5 doc-set. |

## Locked design decisions (binding constraints for all phases)

| # | Decision | Rationale |
|---|---|---|
| **L1** | $0.85 cold-start cost target (never silently relaxed) | D1 + cost-budget memory |
| **L2** | Drop Cut C + S3 R1 from Phase 1 (sunk-cost into Phase 7 retirement) | D2 |
| **L3** | findingPromotion wired (Phase 0a.3); findingMaturityRefresh deferred to post-Phase-6 | D3 + cost-discipline call |
| **L4** | Phase 8 flag activation order: Focus Mode → AI Risk → Corpus Retrieval → Voice Profile → deep-dive | D5 |
| **L5** | **20-30 L5Annotation per essay; quality over quantity** | Locked 2026-05-12. Equal L5 budget invested in depth not breadth — 20-30 deep annotations (~375 tokens each, full teaching frame) beat 60 thin ones. Carry-forward infrastructure handles iter N≥2 cumulative coverage; not a density backfill. |
| **L6** | Promote UNIFIED_PLAN_HOLD to replace CURRENT_STATE (this doc IS that) | D6 |

## Quality-first protocol (added 2026-05-12)

In addition to the existing 3-gate review protocol (design round → adversarial review → implementation → adversarial diff review → verification gate), every code change classifies under one of three categories with explicit downstream-impact assessment:

1. **Verified-dead-code** (zero static + dynamic grep'd consumers + audit doc): safe to ship.
2. **Integration-debt wire** (adds capability that was built but unwired): quality UPGRADE; document the unlock.
3. **Quality bet** (trims surface area downstream consumes): for each downstream consumer, trace contribution to L5Annotation density / depth. If the bet involves a guess without measurement, EITHER surface to Tue OR add measurement criterion for Phase 6 verification regen.

Phase 6 verification regen quality checks:
- ≥20 annotations per essay, ≤30 (target band)
- Diverse `teachingMode` mix (≥3 of 4 modes per essay)
- ≥1 action-mode annotation per paragraph with `rewriteExample` populated
- Avg per-annotation token count ≥250 (depth proxy)

---

## Phase progress (8-phase unified plan)

| Phase | Scope | Status |
|---|---|---|
| **0a** Code hygiene + integration-debt | 9 commits, ~7,800 LOC code deleted + 2 huge JSONs + `findingPromotion` wired + `dumpLint` warn-only check wired | **complete** |
| **0b** Doc regeneration | This doc rewrite + matrix update + 4 supersession marks + L5 index priorAnnotations row | **in progress (this commit)** |
| **1** Bridge cost cuts | Cuts A/B/D/E/F/G + render R1-R9 + Phase A1 cost-ledger split. **Cut C and S3 R1 dropped per D2** (reshape L3.75 internals being deleted in Phase 7). Projected $1.69 → $1.42 | not started |
| **2** Assembler convergence | Wire `presentation/renderAnalysisForStudent.ts` to production render path; spec composition contract for Phase 4 merger. $0 cost. **SHIPPED 2026-05-14** — `tests/dump-full-profile.ts` now invokes the renderer alongside the analytical dump, writes `<essay>-student.json` + `<essay>-student.md` per regen. Composition contract: `04-pipeline-architecture/L3-75/COMPOSITION_CONTRACT.md`. Open call: L5-surface persistence on profile (option 1 recommended). | shipped |
| **3** L4 collapse | S3 R2 — collapse `crystallizer.ts` 3 sub-calls (NorthStar/ScoreMatrix/L4b) into 1 composite call; resolves C2 cache-defeat. $1.42 → ~$1.20. | not started |
| **4** Composition layer + parity gate | Build `compositionLayer.ts` per `L3-75/FIELD_DISPOSITION_TABLE.md` (16 pure functions, calibration block by EssayType); MERGE with `renderAnalysisForStudent.ts`. Snapshot parity gate against persisted Crochet + Three Days dumps. $0 cost. | not started |
| **5** Lens + residue prompts | L3 lens prompts (Voice/Story/Meaning/Admissions); residue call (4 fields); L3.5 schema additions (contradictionFlags + essayStrengthSignatures); L4b ImprovementManifest extension; F1 fix (`profileRouter.ts:783, 809`). $0 dry-run. **L5 Top-N ranker prerequisite SHIPPED 2026-05-14** — `rankAndSurfaceAnnotations()` at `deepAnnotationService.ts`, surfaces 20-30 from full pool, ≥3 mode diversity floor, per-paragraph ACTION+rewrite floor; design at `04-pipeline-architecture/L5/L5_TOPN_RANKER_DESIGN.md`. | not started (ranker landed early) |
| **6** Bundled verification regen | ONE Crochet dump regen (~$1.20 estimated). REQUIRES TUE APPROVAL per cost-budget. Quality review checkpoint. | not started |
| **7** L3.75 retirement PR | Delete `holisticSynthesis.ts` (3,573 lines); migrate ~6 consumer reads; tag rollback commit. $1.20 → $0.85. | not started |
| **8** Activation phase | Per D5: Focus Mode → AI Risk → Corpus Retrieval (master) → Voice Profile → deep-dive decision. Per-flag A/B with quality + $ measurement. | not started |

Cost ladder: $1.69 → ($1.42 after 1) → ($1.20 after 3) → ($0.85 after 7) → ($0.70 after 8 selective).

---

## Phase 0a delta (what landed since unified plan was written)

Commits `a9e2022` → `9f2a0c8`. Verified clean (tsc + vitest 670/5):

```
9f2a0c8 phase 0a.4 — dumpLint warn-only wire at dump-render boundary
9fa1e95 phase 0a.3 — findingPromotion wired post-L3.5 (iter===1 gated)
dafc29c phase 0a.1 — stale PROTOTYPE comment in essayLevelL3Walk.ts
be321dc phase 0a.1 — drop voiceAlignment field
962f7fb phase 0a.1 — archetypeTypes.ts + empty archetypes/ dir
e74f925 phase 0a.1 — effectivenessBands + rhetoricalDeviceTaxonomy
494001d phase 0a.1 — corpus subsystem + barrel + 5 dead tests
7b7ab96 phase 0a.1 — 6 legacy understanding modules + 3 orphan interfaces
a9e2022 phase 0a.1 — versioning/ subsystem + test
```

**Deferred items surfaced during Phase 0a (carry into later phases):**
- `codeSwitching` field drop on `VoiceMap` — has live consumers in `voiceMapMutator`, `intraDomainValidation`, `holisticSynthesis` ingestion. Defer to **Phase 7** (dies naturally with `holisticSynthesis.ts` deletion).
- `findingMaturityRefresh.ts` wire — adds Sonnet call surface; Phase 5.55 already reads stuck findings as input. Defer to **post-Phase-6** decision after measuring findingPromotion's downstream effect on Phase 5.55 emission rate (cost-discipline call).
- `focusedAnalyzer` warm-edit promotion wire — focusedAnalyzer's synthetic `AnalysisPassOutput` hardcodes `evidence: ''`, promoter's evidence guard skips → zero useful findings + paragraph-verdict noise. Defer to **Phase 8** with focusedAnalyzer-side change to emit real evidence text.
- Untracked `corpus/external/` subdir (~200 files, never committed) — outside delete scope; left alone.

---

## Workstream status

### Workstream 04 — Pipeline Architecture (PRIMARY, since 2026-04-26)

The integrated L1→L6 home for the multi-layer redesign. **Active.** Authoritative plan: [`UNIFIED_PLAN_HOLD_2026_05_10.md`](./UNIFIED_PLAN_HOLD_2026_05_10.md).

Shipped per Phase 0–2 build cycles (verified at `[2026-05-10]`):
- L3 Option 5 essay-level walk (`analysis/essayLevelL3Walk.ts`, wired at orchestrator `:85, :690`)
- iterationLedger commit + landingDetector + taughtMoveBuilder
- priorAnnotations builder + wire (orchestrator `:1299-1300`)
- specificsNeedAggregator + integration (orchestrator `:1264-1268`)
- AO First Read structured-telemetry surface (orchestrator `:478-516`)
- L3.5 contradictionFlags + essayStrengthSignatures TYPES landed at `profileTypes.ts:4200, 4225` (producer code unbuilt)
- essay_chat_conversations + essay_ground_truth tables (commits `84c8210`, `caf45f0`)
- F-2 closure (AO failure structured telemetry)
- findingPromotion WIRE (Phase 0a.3, this iteration)

Per-layer plans:
- **L3** — original Sweep+Lens+Pass3 plan **superseded** 2026-05-10. New direction = Option 5 essay-level walk (already shipped) + `L3-75/FIELD_DISPOSITION_TABLE.md` for L3.75 absorption.
- **L3.75** — `L3-75/FIELD_DISPOSITION_TABLE.md` + `L3-75/ITERATION_SYNTHESIS_2026_05.md` are the build spec. Phase 7 retirement target: delete `holisticSynthesis.ts` (3,573 lines, NOT 2,500 as some docs claimed).
- **L3.5** — types extended; producer code Phase 4 sub-phase 4b.
- **L4** — collapse to 1 composite Sonnet call (Phase 3); `L4/PLAN.md` extension absorbs `pairedImprovement`.
- **L5** — `L5_REDESIGN_INDEX.md` is the canonical reading-order map. priorAnnotations wire is LIVE.
- **L6** — coachingService partial migration in flight at `coachingService.ts:4016-4017`.

### Workstream 01 — Cost Recovery — DISSOLVED 2026-05-10

Cache fixes shipped piecemeal; the consolidated changeset never materialized as a single PR. The architectural pivot was absorbed into Workstream 04. Current cost target ($0.85 cold-start) is substantially tighter than this workstream's original $2.00 ceiling. See [`../01-cost-recovery/PLAN.md`](../01-cost-recovery/PLAN.md) (banner-marked dissolved).

### Workstream 02 — Conversator Ground Truth — SUPERSEDED 2026-05-10

Design returned via [`../04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md`](../04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md) §3, §4 (Conversator-as-targeted-inquiry-agent). Conversator integration is now Phase 3 of the integrated build. essay_chat_conversations + essay_ground_truth tables shipped. Service layer (`src/services/essayIntelligence/conversator/`) still **only-planned** — Phase 3 D-3.1 onward.

### Workstream 03 — Intelligent RAG — SUPERSEDED 2026-05-10

Design returned via [`../04-pipeline-architecture/L5/L5_FEEDBACK_REDESIGN.md`](../04-pipeline-architecture/L5/L5_FEEDBACK_REDESIGN.md) §2, §5. **3 of 11 corpus types wired** (`CraftMove`, `EssayArchetype`, `VoiceRegister` via `analysis/corpusRetrievalBlocks.ts:46`). Remaining 8 types land via Phase 8 corpus-retrieval activation (5 unset `ENABLE_CORPUS_RETRIEVAL_*` flags are the operational gates).

---

## Dormant capability surface (Phase 8 candidates)

5 feature flags read in production code but never set in production env. All depend on `findingPromotion` wire (now shipped) to be properly evaluable:

| Flag | Module | Cost if enabled | Status |
|---|---|---|---|
| `ENABLE_FOCUS_MODE` | `analysis/preCallEnrichment.ts` (gated at `deepAnnotationService.ts:795`) | $0 marginal (re-rank, no new call) | Phase 8.1 — first activation per Tue's emphasis |
| `ENABLE_AI_RISK_SIGNAL` | `analysis/aiRiskSignalBlock.ts` | +$0.005-0.02 (Haiku) | Phase 8.2 — calibration-blocked per orchestrator `:3157` |
| `ENABLE_CORPUS_RETRIEVAL_L35` (master) + 4 per-layer | `analysis/corpusRetrievalBlocks.ts` | +$0.02-0.10 per layer | Phase 8.3 — biggest dormant capability |
| `ENABLE_VOICE_PROFILE_IMPORT` | L3.75 voice synthesis input | TBD | Phase 8.4 — cross-essay continuity |

Plus: deep-dive growth loop intentionally commented out at `analysisOrchestrator.ts:1906-1912` (cost reasons). Re-enable decision deferred to Phase 8.5 with populated FindingStore.

---

## Critical-path open items

1. **Phase 6 verification regen** — single bundled $~1.20 spend pending Tue approval. Bundle cost-cut measurements + parity-gate validation + Tier 1 deliverable quality review.
2. **`L3-75/FIELD_DISPOSITION_TABLE.md` + `compositionLayer.ts`** — implementation spec ready; pure-function module + 16 unit tests + per-essayType calibration block. Phase 4 deliverable.
3. **Lens prompts + residue call prompt** — Phase 5; depends on 02+03 design returns (now both confirmed via L5 doc-set).
4. **F1 audit `holisticFull` always-priority** — `profileRouter.ts:783, 809` still unresolved. Phase 5 fix.
5. **L6 read-site migrations** — `coachingService.ts:4016-4017` reads both `redFlags` + `blindSpots`. Phase 6.5 cleanup.

---

## Cost / spend discipline

Per [`memory/feedback_cost_budget.md`](../../../memory/feedback_cost_budget.md):
- **$5 hard cap on testing across the entire 8-phase execution.**
- Any single API call >$0.10 needs explicit per-call approval.
- Cost target $0.85 is **never to be relaxed silently**. If math doesn't reach it with available levers, flag the architectural gap.
- Bundle calibration into ONE verification regen (Phase 6).
- Net cost delta on every code change: zero or negative. No tangent dumps.

Today's per-essay cost: **$1.69 Crochet baseline**. Distance to target: $0.84 of LLM-side cuts needed (recoverable per the 8-phase ladder).

---

## Cross-references

- **Planning rationale**: [`UNIFIED_PLAN_HOLD_2026_05_10.md`](./UNIFIED_PLAN_HOLD_2026_05_10.md)
- **Execution contract**: [`UNIFIED_EXECUTION_HANDOFF_2026_05_10.md`](./UNIFIED_EXECUTION_HANDOFF_2026_05_10.md)
- **Component status detail**: [`../04-pipeline-architecture/cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md`](../04-pipeline-architecture/cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md)
- **L3.75 retirement build spec**: [`../04-pipeline-architecture/L3-75/FIELD_DISPOSITION_TABLE.md`](../04-pipeline-architecture/L3-75/FIELD_DISPOSITION_TABLE.md)
- **L3.75 iteration synthesis**: [`../04-pipeline-architecture/L3-75/ITERATION_SYNTHESIS_2026_05.md`](../04-pipeline-architecture/L3-75/ITERATION_SYNTHESIS_2026_05.md)
- **Cost budget rule**: [`memory/feedback_cost_budget.md`](../../../memory/feedback_cost_budget.md)
- **Integration-debt pattern**: [`memory/pitfalls_integration_debt.md`](../../../memory/pitfalls_integration_debt.md)
- **LLM-first design rules**: [`memory/feedback_llm-first-design.md`](../../../memory/feedback_llm-first-design.md)

---

## How to use this document

- Read this first in every session.
- For *what to do next*: read the unified plan + handoff.
- For *what's true now* about a specific component: this doc → IMPLEMENTATION_STATUS_MATRIX → grep current code at HEAD.
- When code state changes, update this doc. When in doubt, the code at HEAD wins.
