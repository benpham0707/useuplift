# 04 — Pipeline Architecture (Master Integration Workspace)

> The horizontal home for the integrated **L1 → L6** iteration plan. Every layer's redesign or integration plan lives here, alongside cross-cutting architecture, the master integration plan, and the foundation-phase consolidation artifacts that gate build-phase entry.
>
> **Last updated**: 2026-04-26
> **Status**: **Foundation phase complete. Build phase open.** Tue signed off 2026-04-26 on TQ-1 through TQ-4 per `cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`. The next chat opens against `INTEGRATED_BUILD_EXECUTION_HANDOFF.md` and begins Phase 0 D-0.1.

---

## Build-phase entry condition

The integrated build phase opens against this workspace under the following conditions, all met as of 2026-04-26:

1. ✅ Foundation phase F0–F7 complete. All artifacts committed.
2. ✅ Tue's TQ-1 — Q1 redirection adjudication: **Resolution A** (retirement is correct; no mandated redirection fraction).
3. ✅ Tue's TQ-2 — Cost cap: **$10 hard cap, stage-gated**. Hard halt at $9. Mid-build escalation if a touchpoint genuinely needs more headroom; do not silently expand.
4. ✅ Tue's TQ-3 — Branch name: **`feat/integrated-pipeline-build`** (branched from `feat/wave-3a-phase-3b-3c`).
5. ✅ Tue's TQ-4 — Q4 / Q-A / Q-B reaffirmed.

The new build chat opens against **`INTEGRATED_BUILD_EXECUTION_HANDOFF.md`** as its system prompt. The build chat reads the workspace cover-to-cover, then begins **D-0.1** (IterationLedger + TaughtMove + CarryForwardDecision + IterationRecord types) per `INTEGRATED_BUILD_SEQUENCE.md` §2.

---

## Why this workspace exists

The cost-recovery workstream (`01-cost-recovery/`) ships one PR. That's tactical.

The pipeline iteration is multi-layer, multi-PR, multi-month. It needs its own home where:
- L3 redesign is tracked as a workstream, not assumed to exist.
- L3.75 retirement plan lives next to its upstream (L3) and downstream (L3.5, L4, L5) dependencies, not buried under cost-recovery.
- L4 (NorthStar/Crystallizer/Manifest) iteration is named and tracked.
- L5 redesign — the deepest-specced workstream — has a directory instead of being scattered.
- L6 coaching after the upstream changes has somewhere to live.
- 02 (Conversator) and 03 (RAG) integration into specific layers is documented at the layer level.
- The foundation-phase consolidation that reconciled all the above into one coherent plan has cross-cutting artifacts that ground the build phase.

---

## Canonical reading order

For the build session opening against this workspace, read in this order:

1. **`INTEGRATED_BUILD_EXECUTION_HANDOFF.md`** — the build session's system prompt. Read this first. There is no other.
2. **`MASTER_INTEGRATION_PLAN.md`** — horizontal master view (v2 — substantially revised in F4).
3. **`cross-cutting/MASTER_PLAN_READING_NOTES.md`** — per-doc reading notes from F0.
4. **`cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md`** — file:line audit of 35 components from F1.
5. **`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`** — 14 reconciliation issues from F2 (R-1 through R-14, R-1 closed by Tue's TQ-1).
6. **`cross-cutting/INTEGRATION_CONTRACTS.md`** — 47 seams from F3.
7. **`cross-cutting/CONSOLIDATION_FINAL_REVIEW.md`** — Tue's sign-off (F7) with TQ-1 through TQ-4 outcomes.
8. **`cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md`** — April baseline (reference).
9. **`cross-cutting/RE_ANALYSIS_LIFECYCLE_DESIGN.md`** — re-analysis lifecycle (will be revised at Phase 4 sub-phase 4e per F2 R-2 + R-4).
10. **Per-layer PLANs**: `L3/PLAN.md`, `L3-75/L3_ABSORBS_L3_75.md` (authoritative), `L3-5/PLAN.md`, `L4/PLAN.md`, `L4/ESSAY_NORTH_STAR_DESIGN.md`, `L6/PLAN.md`.
11. **L5 docs in canonical order** per `L5/L5_REDESIGN_INDEX.md`: EXPERIENCE_TARGET → ITERATION_LOOP_DESIGN → E2E_INTEGRITY_AUDIT → CONSUMPTION_AUDIT → FEEDBACK_REDESIGN.
12. **`L5/L5_IMPLEMENTATION_PLAN.md`** — the L5-only build plan (extended by INTEGRATED_BUILD_SEQUENCE.md).
13. **`INTEGRATED_BUILD_SEQUENCE.md`** — the executable spine (~168 deliverables across Phase 0–6.5). What the build executes against.

Reading time: ~12–18 hours of focused reading. Do it before D-0.1.

The legacy `L5/L5_BUILD_HANDOFF_PROMPT.md` is **superseded** by the integrated build handoff — preserved for reference only.

---

## Directory map

```
04-pipeline-architecture/
├── README.md                                        ← this file
├── INTEGRATED_BUILD_EXECUTION_HANDOFF.md            ← BUILD SESSION'S SYSTEM PROMPT
├── INTEGRATED_BUILD_SEQUENCE.md                     ← executable spine, ~168 deliverables
├── INTEGRATED_BUILD_HANDOFF_PROMPT.md               ← earlier draft (preserved; F6 produced; superseded by EXECUTION_HANDOFF)
├── MASTER_INTEGRATION_PLAN.md                       ← horizontal master view (v2)
├── MASTER_INTEGRATION_PLAN__draft_v1_archive.md     ← v1 archived for traceability
├── MASTER_PLAN_CONSOLIDATION_HANDOFF.md             ← original consolidation prompt (foundation phase entry)
├── L3/                                               ← Sweep + 4 lens deep reads + Pass 3
│   └── PLAN.md
├── L3-75/                                            ← absorption decision (retirement of L3.75 layer)
│   ├── L3_ABSORBS_L3_75.md                          ← authoritative
│   ├── L3_75_REDESIGN__SUPERSEDED.md                ← reference (yesterday's design, superseded)
│   └── README.md
├── L3-5/                                             ← analysisPass + new responsibilities (contradictionFlags + essay-level strengthSignatures)
│   └── PLAN.md
├── L4/                                               ← NorthStar + Crystallizer + Manifest; absorbs pairedImprovement
│   ├── PLAN.md
│   └── ESSAY_NORTH_STAR_DESIGN.md
├── L5/                                               ← deep redesign (5 governing docs + implementation plan + 1 superseded handoff)
│   ├── L5_REDESIGN_INDEX.md                         ← entry point for L5
│   ├── L5_EXPERIENCE_TARGET.md
│   ├── L5_ITERATION_LOOP_DESIGN.md
│   ├── L5_E2E_INTEGRITY_AUDIT.md
│   ├── L5_CONSUMPTION_AUDIT.md
│   ├── L5_FEEDBACK_REDESIGN.md                      ← original redesign with 7 SUPERSEDED markers
│   ├── L5_IMPLEMENTATION_PLAN.md                    ← L5-only plan (extended by INTEGRATED_BUILD_SEQUENCE)
│   └── L5_BUILD_HANDOFF_PROMPT.md                   ← SUPERSEDED 2026-04-26
├── L6/                                               ← coaching light update (4 read-site migrations)
│   └── PLAN.md
└── cross-cutting/
    ├── PIPELINE_ARCHITECTURE_AUDIT.md               ← Apr 2026 baseline (reference)
    ├── RE_ANALYSIS_LIFECYCLE_DESIGN.md              ← incremental update / focused-mode (will be revised at build Phase 4e)
    ├── MASTER_PLAN_READING_NOTES.md                 ← F0 deliverable
    ├── IMPLEMENTATION_STATUS_MATRIX.md              ← F1 deliverable
    ├── L5_AND_MASTER_RECONCILIATION.md              ← F2 deliverable (14 reconciliation issues)
    ├── INTEGRATION_CONTRACTS.md                     ← F3 deliverable (47 seams)
    └── CONSOLIDATION_FINAL_REVIEW.md                ← F7 deliverable (Tue's sign-off)
```

---

## Foundation phase artifacts (F0–F7)

| Phase | Artifact | Purpose |
|---|---|---|
| F0 | `cross-cutting/MASTER_PLAN_READING_NOTES.md` | Per-doc reading notes; 8 cross-cutting reconciliation themes |
| F1 | `cross-cutting/IMPLEMENTATION_STATUS_MATRIX.md` | File:line audit of 35 components: 13 functional / 7 partial / 9 only-planned |
| F2 | `cross-cutting/L5_AND_MASTER_RECONCILIATION.md` | 14 reconciliation issues; 13 resolved by consolidation; R-1 escalated to Tue (now closed Resolution A) |
| F3 | `cross-cutting/INTEGRATION_CONTRACTS.md` | 47 seams: 24 functional / 4 partial / 19 only-planned |
| F4 | `MASTER_INTEGRATION_PLAN.md` v2 | Canonical horizontal master view (draft v1 archived) |
| F5 | `INTEGRATED_BUILD_SEQUENCE.md` | ~168 deliverables across Phase 0–6.5 |
| F6 | `INTEGRATED_BUILD_HANDOFF_PROMPT.md` (earlier draft) + `INTEGRATED_BUILD_EXECUTION_HANDOFF.md` (final) | Build-phase handoff |
| F7 | `cross-cutting/CONSOLIDATION_FINAL_REVIEW.md` | Tue's sign-off; TQ-1 through TQ-4 outcomes |

---

## Relationship to other workstreams

- **`01-cost-recovery/`**: ships a tactical PR under current architecture. Its Phase B convergence-prompt fix and Phase D cache structure feed into this workspace's L3 plan.
- **`02-conversator-ground-truth/`**: design returned 2026-04-24 (`CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md`). Defines `ExperienceProfile` injecting at L3 lens prompts + L5 rewrite paths.
- **`03-intelligent-rag/`**: design returned 2026-04-24 (`INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`). Defines per-layer corpus retrieval. This workspace's L3, L3.5, L5 plans integrate with that design. Phase 4 sub-phase 4e wires the 8 missing corpus types.

The workstreams meet here: 02 + 03 designs INJECT INTO the layer plans owned by this workspace.

---

> **Build phase opens against `INTEGRATED_BUILD_EXECUTION_HANDOFF.md`. The next chat begins D-0.1.**
