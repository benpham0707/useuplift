# Master Integration Plan — L1 → L6 Pipeline Iteration

> The horizontal view. What every layer becomes after the integrated iteration lands, how the layers compose, what depends on what, and how this all ships.
>
> **Status**: `draft v1` — first consolidation 2026-04-26. Layer plans below link to authoritative docs.
> **Last updated**: 2026-04-26.

---

## North star

The integrated pipeline produces:

1. **Premium-grade understanding** ($500/hr admissions consultant level) at cost ≤$2.00/essay.
2. **Zero fabrication** in writer-facing surfaces — every rewrite, every coaching turn, every annotation grounded in either student ground truth (Conversator) or corpus exemplars (RAG).
3. **Selective iteration** — re-analysis is incremental, carry-forward is selective, cost compounds down across rounds (round 1 ≈ $2.00; round 5 ≈ $0.30).
4. **Single ownership per concern** — every field has one writer, every layer has one job; redundancy and theatre eliminated.

---

## The integrated pipeline shape (target state)

```
Essay text (+ optional ExperienceProfile from Conversator)
    │
    ▼
L1   (Haiku, ~$0.005)            Brief impressions
L2   (Sonnet, ~$0.05)            Structural cartography
L2.5 (Sonnet, ~$0.03)            Connection scout
    │
    ▼
L3 PASS 1 — Sweep                One Sonnet call
                                 sentenceUnderstanding, paragraph roles,
                                 connection graph, archetype, lensDispatch
L3 PASS 2 — Lens deep reads      2-4 parallel Sonnet calls (per dispatch)
                                 Story / Meaning / Voice / Admissions
                                 Each lens emits canonical holistic profile
                                 fields DIRECTLY (per L3.75 retirement)
                                 (Conversator + RAG inject at lens user
                                  prompts via cached blocks)
L3 PASS 3 — Cross-dimension      One Sonnet call, ~$0.08
                                 writerPortrait, entanglements,
                                 emotionalTopography.arcTrajectory,
                                 momentEarnednessMap.mechanisms
    │
    ▼
L3.5 — Judgment                  Per-paragraph + essay-level scoring
                                 contradictionFlags[]               (NEW)
                                 essay-level strengthSignatures[]   (NEW, migrated from L3.75)
                                 (RAG retrieves anti-archetypes + move-fits)
    │
    ▼
L4a NorthStar                    Architecture of meaning crystallization
L4a ScoreMatrix                  Rubric scoring with corpus anchoring
L4b Manifest                     Improvement priorities
                                 pairedImprovement payload          (NEW, migrated from L3.75)
    │
    ▼
L5 — Annotation + Rewrite        Per-paragraph + cross-paragraph feedback
                                 (Selective carry-forward across iterations)
                                 (Conversator ground-truth substrate prevents fabrication)
                                 (RAG corpus citations anchor teaching)
                                 7 teaching moves; non-repetition contract;
                                 divergent-path multiplicity
    │
    ▼
L6 — Coaching                    Phase-aware conversational layer
                                 (Reads finalized profile; surfaces
                                  next steps, answers questions)
```

**No L3.75. No iter_1. No Meta. No Curation. No UnderstandingProse.** The deletion is the cleanest part.

---

## Per-layer status snapshot

| Layer | Plan | Status | Authoritative doc |
|---|---|---|---|
| L1 | (no redesign) | stable | — |
| L2 | (no redesign) | stable | — |
| L2.5 | (no redesign) | stable | — |
| **L3** | Redesign — Sweep + 4 parallel lenses + Pass 3 | `draft` (workstream tracked here as of 2026-04-26) | [`L3/PLAN.md`](./L3/PLAN.md) |
| **L3.75** | Retirement — work absorbed into L3 + L3.5 + L4b | `planned` (Tue approved 2026-04-25) | [`L3-75/L3_ABSORBS_L3_75.md`](./L3-75/L3_ABSORBS_L3_75.md) |
| **L3.5** | Extension — absorbs contradictionFlags + essay-level strengthSignatures | `draft` | [`L3-5/PLAN.md`](./L3-5/PLAN.md) |
| **L4** | Extension — L4b absorbs pairedImprovement; NorthStar concept already designed | `draft` (NorthStar concept stable; L4b extension pending) | [`L4/PLAN.md`](./L4/PLAN.md), [`L4/ESSAY_NORTH_STAR_DESIGN.md`](./L4/ESSAY_NORTH_STAR_DESIGN.md) |
| **L5** | Deep redesign — 7 teaching moves, non-repetition, selective carry-forward, no fabrication | `awaiting build` (8 governing docs locked; implementation plan exists) | [`L5/L5_REDESIGN_INDEX.md`](./L5/L5_REDESIGN_INDEX.md) |
| **L6** | Light extension — phase-aware coaching against new profile shape | `draft` | [`L6/PLAN.md`](./L6/PLAN.md) |

External integrations:
| Workstream | Design | Injects into |
|---|---|---|
| 02 Conversator | [`02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md`](../02-conversator-ground-truth/CONVERSATOR_ANALYSIS_GROUND_TRUTH_DESIGN.md) | L3 lens user prompts, L5 rewrite paths, voice profile import |
| 03 RAG | [`03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md`](../03-intelligent-rag/INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md) | L3 lens user prompts (archetype context), L3.5 (move-fits + anti-archetypes), L5 (move citations + corpus exemplars) |

---

## Sequencing — what ships in what order

The integrated iteration is six PRs over an estimated 4–8 weeks.

| Order | PR | Scope | Preconditions | Approx duration |
|---|---|---|---|---|
| 1 | **Cost-recovery changeset** (`01-cost-recovery/PLAN.md`) | Phase A–E under current architecture; preserves L3.75 | D5 integration gate (which depends on 02/03 designs returning ✅ DONE) | 1 PR, 1 verification run |
| 2 | **L3 redesign + L3.75 retirement (combined)** | Sweep + 4 lens schemas + Pass 3 + delete `holisticSynthesis.ts` + consumer renames | Cost-recovery PR verified; lens prompt skeletons drafted; L3.5 prompt extension ready | 1 large PR |
| 3 | **L3.5 extension** | contradictionFlags + essay-level strengthSignatures + RAG corpus citations | L3 redesign landed | 1 PR |
| 4 | **L4 extension** | L4b absorbs pairedImprovement; NorthStar prompt update against new profile shape | L3.5 extension landed | 1 PR |
| 5 | **L5 deep redesign** | Per `L5_IMPLEMENTATION_PLAN.md` (75–90 deliverables, 6 build phases) | L4 landed; Conversator ExperienceProfile schema integrated; RAG retrieval at L5 wired | 1 large PR |
| 6 | **L6 coaching update** | Reads new profile shape, surfaces post-pivot fields cleanly | L5 landed | 1 PR |

PRs 2–6 ship in sequence. Each verifies on a single fixture (project standard per D5).

---

## Dependency graph (what blocks what)

```
                    ┌─────────────────────────────────────┐
                    │  Cost-recovery changeset (01)       │
                    │  D5 integration gate (open)         │
                    └────────────────┬────────────────────┘
                                     │ verifies
                                     ▼
   ┌─────────────────────────────────────────────────────────┐
   │  L3 redesign + L3.75 retirement (PR2)                   │
   │  • Sweep + 4 lens schemas                               │
   │  • Pass 3 cross-dimension synthesis                     │
   │  • Lens prompts emit canonical profile fields            │
   │  • Delete holisticSynthesis.ts + iteration/Meta/etc     │
   │  • Conversator + RAG inject at lens prompts             │
   └─────────────────┬───────────────────┬──────────────┬────┘
                     │                   │              │
                     ▼                   ▼              ▼
           ┌─────────────────┐  ┌───────────────┐  ┌──────────┐
           │ L3.5 extension  │  │ Conversator   │  │ RAG      │
           │ (PR3)           │  │ schema land   │  │ flag flip│
           │ contradictionFl │  │ ExperienceProf│  │ per-layer│
           │ essay strengths │  │ + voice prior │  │          │
           │ + RAG citations │  └─┬─────────────┘  └─┬────────┘
           └────────┬────────┘    │                  │
                    ▼             │                  │
           ┌─────────────────┐    │                  │
           │ L4 extension    │    │                  │
           │ (PR4)           │    │                  │
           │ L4b pairedImprv │    │                  │
           │ NS profile shape│    │                  │
           └────────┬────────┘    │                  │
                    │             │                  │
                    ▼             ▼                  ▼
           ┌─────────────────────────────────────────────────┐
           │ L5 deep redesign (PR5)                          │
           │ 7 teaching moves, non-repetition, carry-forward │
           │ Conversator ground truth substrate              │
           │ RAG move citations                              │
           │ Selective iteration                             │
           └────────────────────┬────────────────────────────┘
                                ▼
                       ┌─────────────────┐
                       │ L6 update (PR6) │
                       │ phase-aware     │
                       │ coaching        │
                       └─────────────────┘
```

---

## Cross-layer commitments (the contracts)

These are agreements that span layers; they live in `shared/CONTRACTS.md` and get updated as PRs land.

### Profile schema (post-integration)
- Lens emissions own canonical holistic-profile fields.
- Pass 3 owns 4 cross-dimension fields.
- L3.5 essay-level owns `strengthSignatures[]` and `contradictionFlags[]`.
- L4b ImprovementManifest owns `pairedImprovement` payload.
- `characterRevelation.blindSpots[]` cut entirely; `admissionsPositioning.redFlags[]` is the single home.

### Cache block ordering (per layer's user prompt)
```
[essay_text + L1 + L2 + scout_header (cached)]
[ExperienceProfile (cached, if 02 wired)]
[research_block (cached, if 03 wired)]
[per-paragraph or per-lens specific content (uncached)]
```
Order is invariant across all layers. New cached blocks must extend in this order, not insert in the middle.

### Discipline directives (every prompt)
- Descriptive only. No "weak", "strong", "effective" vocabulary.
- Every claim cites paragraph or sentence number.
- Inheritance discipline: never re-derive what an upstream layer already produced.
- Non-repetition (L5 specifically): no two pieces of guidance carry the same teaching weight.
- No fallbacks (L5, L6): single owner, visible failure, no canned defaults.

### Cost discipline
- Per-essay round 1 cost ≤ $2.00.
- Round 5 (focused re-analysis) ≤ $0.30 via selective carry-forward.
- Test runs on single fixture (fixture 05 default); multi-fixture only if regression class detected.

---

## Open questions across layers (require Tue input)

| # | Question | Affects | Recommendation |
|---|---|---|---|
| Q1 | Does L3 redesign workstream get its own "owner" outside the cost-recovery chat, or does Cost continue to drive? | L3, L3-75 | Cost continues to drive through PR2 since no other team has surfaced |
| Q2 | Should the L5 redesign ship before or after L4 extension? L5 plan was drafted assuming current L4; if L4 changes shape, L5 may need re-grounding | L4, L5 | After L4 extension. Less re-work. |
| Q3 | RAG flag flip sequence — which layer flips first? | L3, L3.5, L5 | RAG team's call per their architecture doc. Most likely L5 first (per their L5 ranking) |
| Q4 | When does the L6 update fire? Each upstream PR could trigger a small L6 patch, or one big L6 update at the end | L6 | One big update at the end. L6 reads the finalized profile; pre-finalization patches are noise |

---

## What this plan does NOT cover (out of scope)

- Annotation V2 UI work (separate `ANNOTATION_V2_BUILD_PLAN.md` in `docs/`).
- Workshop integration (`commonAppWorkshop`, `narrativeWorkshop` etc.) beyond what L5/L6 touches.
- Conversator internals (lives in workstream 02).
- Corpus/taxonomy data work (lives in workstream 03).
- Frontend rendering (EssayPortrait gets a small UI update under L3.75 retirement; nothing else here).

These are tracked elsewhere or out of band. This workspace is the L1–L6 pipeline iteration only.
