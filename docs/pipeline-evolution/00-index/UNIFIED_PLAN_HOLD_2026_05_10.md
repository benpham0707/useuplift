# Unified Optimization Plan — HOLD

> **STATUS:** `hold` — synthesis of multi-session findings, awaiting Tue's decisions before any execution.
>
> **AUDIENCE:** Tue + future sessions resuming this work. Replaces stale `CURRENT_STATE.md` as the actionable source until that doc is regenerated.
>
> **SOURCE:** Synthesized from prior cut audit (2026-05-07) + S4 integration-debt scan + S5 stale-doc audit + S6 L3.75-retirement integration audit (2026-05-09–10) + parallel session's `FIELD_DISPOSITION_TABLE.md` + `ITERATION_SYNTHESIS_2026_05.md`.
>
> **VERIFIED AT:** Branch `fix/warm-edit-completedalllayers`, HEAD `f181f84` (May 6 21:20).
>
> **Last updated:** 2026-05-10.

---

## 1. Executive summary

1. **The system can reach $0.70-$0.85 cold-start cost ($1.00-$1.15 lifecycle at 4 reviews) without sacrificing quality.** That's 50-58% recovery from today's $1.69 baseline. At $3 charge → 62-67% margin per essay; at $5 → 77-80%.
2. **Most "dead code" is actually integration debt or flag-gated capability** — built complete but never wired or never enabled in production. This includes 8 modules totaling ~2,000 lines + 5 unflipped feature flags.
3. **The single highest-leverage fix is wiring `findingPromotion.ts` (514 lines, currently zero callers).** It's $0 marginal cost. Without it, FindingStore is sparse entering L4 → downstream layers re-narrate findings instead of citing → multiple S3 architectural-redundancy findings exist BECAUSE of this missing wire.
4. **The parallel session's L3.75 retirement plan and our cost-recovery work are compatible**, with two specific drops needed: **Cut C** (fold understanding_prose) and **S3 R1** (Phase A+B fusion) should be dropped from Bundle 1 because retirement deletes those layers in ~6 weeks.
5. **`renderAnalysisForStudent.ts` (369 lines, unused) IS structurally identical to the parallel session's proposed `compositionLayer.ts`.** Merge instead of building both — saves 1-2 weeks.
6. **Planning docs are 14 days stale.** ~80 commits shipped between 2026-04-26 (last doc update) and HEAD f181f84. Matrix says 13 functional / 9 only-planned; reality is 22 functional / 5 only-planned. `CURRENT_STATE.md` should be regenerated, not patched.
7. **5 dormant capability flags exist but are never set in production:** `ENABLE_AI_RISK_SIGNAL`, `ENABLE_VOICE_PROFILE_IMPORT`, `ENABLE_FOCUS_MODE`, `ENABLE_CORPUS_RETRIEVAL_L35` (master) + 5 per-layer flags. All read in code, only set in test files. **The largest dormant capability surface in the system, and ALL of them depend on findingPromotion being wired first to be properly evaluable.**
8. **The deep-dive growth loop is intentionally commented out** at `analysisOrchestrator.ts:1906-1912` for cost reasons. Not dead code — explicit "to re-enable, uncomment" annotation. Keep it as planned-deferred capability.

---

## 2. Verified current state — what's actually shipped vs what docs claim

Per S5 audit. Matrix `CURRENT_STATE.md` and `IMPLEMENTATION_STATUS_MATRIX.md` are 14 days behind code.

| Component | Matrix claim | Verified status at f181f84 |
|---|---|---|
| Workstream 04 | `draft` | **Phase 0 + Phase 1 closed; Phase 2 mid-flight** |
| Workstream 01 cost-recovery | `awaiting-integration` | **Effectively dissolved** — cache fixes shipped piecemeal |
| Workstream 02 conversator design | "not yet returned" | **Returned via `L5_E2E_INTEGRITY_AUDIT.md §4`** |
| Workstream 03 RAG design | "not yet returned" | **Returned via `L5_FEEDBACK_REDESIGN.md §2/§5`; 3/11 corpus types wired** |
| L3 architecture | Sweep + 4 Lens + Pass 3 | **Pivoted to Option 5 essay-level walk** (commit `d3209c9`); Sweep+Lens plan is **abandoned** |
| `essay_chat_conversations` table | only-planned | **Shipped** (commit `84c8210`) |
| `essay_ground_truth` table | only-planned | **Shipped** (commit `caf45f0`) |
| `priorAnnotations` builder + wire | dead-wire at line 850 | **Wired** at `analysisOrchestrator.ts:1299-1300` |
| `specificsNeedAggregator` | only-planned | **Shipped** + wired at orchestrator `:1264-1268` |
| `iterationLedger` commit | only-planned | **Shipped** (D-1.10) |
| `taughtMoveBuilder` | only-planned | **Shipped** (D-1.11) |
| `landingDetector` | only-planned | **Shipped** (D-1.5) |
| `contradictionFlags` (L3.5) | only-planned | **Type landed** at `profileTypes.ts:4200`; producer code not yet emitting |
| `essayStrengthSignatures` (L3.5) | only-planned | **Type landed** at `profileTypes.ts:4225`; producer code not yet emitting |
| AO First Read failure swallow | "swallowed as non-fatal" | **F-2 closure 2026-04-29 added structured telemetry** at orchestrator `:478-516` |
| `findingPromotion.ts` | shipped | **VERIFIED ORPHAN** — 514 lines, zero callers (S5 was wrong; S6 + my grep both confirm) |
| `findingMaturityRefresh.ts` | shipped | **VERIFIED ORPHAN** — 318 lines, zero callers |
| `holisticSynthesis.ts` size | "~3,650 lines" | **3,573 lines** (40% larger than retirement docs claim of "~2,500") |
| F1 audit (L4 holisticFull always-priority) | flagged | **Still unresolved** at `profileRouter.ts:783, 809` |
| L6 migration | only-planned | **Partial in flight** — `coachingService.ts:4016-4017` reads both `redFlags` + `blindSpots` |

**Headline correction to the matrix:** ~22 functional / 8 partial / 1 only-typed / 5 only-planned (vs matrix's 13 / 7 / 0 / 9).

---

## 3. Complete waste/opportunity inventory

### 🟢 GENUINELY DEAD — verified safe to delete (~7,250 LOC, $0 cost change)

| Item | Lines | Evidence |
|---|---|---|
| `versioning/` subsystem | 817 | Zero external callers; only `index.ts:274,281` re-exports |
| `contextBuilder.ts` + `essayUnderstandingService.ts` + 4 helpers | ~3,800 | Pre-Phase-1; replaced by `analysisOrchestrator` + `sequentialDeepWalk` + `analysisContextBuilder` |
| Legacy `corpus/` files | ~2,297 | Production imports only `claudeRetrieval` + `corpusTypes` |
| `effectivenessBands.ts`, `rhetoricalDeviceTaxonomy.ts` | ~350 | File orphans; types exist in `profileTypes.ts` |
| `voiceAlignment`, `codeSwitching` schema fields | trivial | `@deprecated` with "Writers no longer set it" |
| `archetypes/archetypeTypes.ts` | 138 | Round 7c never built; `archetypeLibrary.ts` + `archetypeDistance.ts` never existed in any branch |
| Stale `essayLevelL3Walk.ts:36` PROTOTYPE comment | 1 | Wired at orchestrator `:85, 690` since commit `d3209c9` |

### 🟠 INTEGRATION DEBT — built but unwired (~1,800 LOC, completion unlocks downstream capability)

| Item | Lines | Wire target | $ impact if wired | Priority |
|---|---|---|---|---|
| **`findingPromotion.ts`** | 514 | After L3.5 phase in orchestrator | **$0 marginal** (pure in-memory promoter) | **CRITICAL — every other capability below depends on populated FindingStore** |
| `findingMaturityRefresh.ts` | 318 | After FindingStore populated | small (1 Sonnet call per pass) | After findingPromotion |
| `dumpLint.ts` production-check | 50 (wiring) | L4→render boundary | $0 | LOW (quality gate) |
| `presentation/renderAnalysisForStudent.ts` | 369 | Production render path | $0 | **CRITICAL — IS the composition layer prototype** |

### 🟡 FLAG-GATED CAPABILITY — wired but never enabled in production (5 flags, S4's biggest find)

All read in production code, only set to `'true'` in test files. **All depend on findingPromotion being wired first to be properly evaluable** — they read from FindingStore which is currently sparse.

| Flag | Dormant capability | $ impact if enabled | Quality impact |
|---|---|---|---|
| `ENABLE_AI_RISK_SIGNAL` | `aiRiskSignalBlock.ts` — AI-detection risk lens for L3.75 voice synthesis | +$0.005-0.02 per analysis (Haiku) | Calibration-blocked per orchestrator `:3157` ("elevated false-positive") |
| `ENABLE_VOICE_PROFILE_IMPORT` | Cross-essay voice profile loaded into L3.75 prompt | TBD | Continuity across essays for same student |
| `ENABLE_FOCUS_MODE` | `preCallEnrichment` reranks improvement candidates before L5 deep-annotation | ~$0 (re-rank, no new call) | Surgical L5 budget targeting |
| `ENABLE_CORPUS_RETRIEVAL_L35` (master) | `corpusRetrievalBlocks.ts` — corpus moves/archetypes/limits in 5 layer prompts | +$0.02-0.10 per analysis per gated layer | **Largest dormant capability surface** — connects pipeline to research corpus |
| `ENABLE_CORPUS_RETRIEVAL_L3 / _L375 / _L4 / _L5 / _L6` | Per-layer A/B switches (planned but never started) | as above | Per-layer quality enablement |

### 🟣 INTENTIONALLY DEFERRED — commented-out call sites (cost cuts)

| Item | Lines | Status |
|---|---|---|
| Deep-dive growth loop (`deepDiveRunner` + `deepDivePromptLibrary` + 3 `growthEngine` exports) | ~1,000 | **Commented out** at `analysisOrchestrator.ts:1906-1912` for cost reasons. Annotation: "to re-enable, uncomment." |

### 🔵 PLANNED FUTURE WORK — don't touch in isolation

| Item | Lines | Status |
|---|---|---|
| `runningUnderstandingManager.ts` | 474 | Phase E2 deletion target alongside L3.75 absorption |
| `holisticSynthesis.ts` | 3,573 | L3.75 absorption "Kill list" target |
| `conversator/types.ts` | 60 | D-0.4 types built; service is Phase 3 |
| `conversatorSessionLog` field | trivial | For Phase 3 service |

### 🔴 BROKEN WIRING — fix in retirement plan

| Item | Status | Fix path |
|---|---|---|
| L4 three-call cache defeat | Documented at `crystallizer.ts:2148-2157` (C2 rollback) | S3 R2 (collapse to one composite call) |
| F1 audit finding (`holisticFull` always-priority) | `profileRouter.ts:783, 809` | Phase 4/L4 work |
| L6 migration (4 read-site migrations) | `coachingService.ts` partial | Not on bundle plans yet |

### 🟦 RENDER-SIDE WASTE — UX-only, $0 cost

| Item | Lines off dump | Status |
|---|---|---|
| Profile Index, Metadata, sentence stubs, connections, etc. (R1-R9 from prior cut audit) | ~1,300 | Not yet shipped |

---

## 4. The unified 8-phase ship sequence

Phases 0a, 0b, 0c can ship in week 1 with **zero risk and zero API cost**. Subsequent phases compound.

### Phase 0a — Free wins (1 week, $0 cost change, NO risk)

```
Code hygiene — pure cleanup, no behavior change:
  Delete versioning/ subsystem (~817 lines)
  Delete contextBuilder.ts + helpers (~3,800 lines)
  Delete legacy corpus/ files (~2,297 lines)
  Delete effectivenessBands.ts + rhetoricalDeviceTaxonomy.ts (~350 lines)
  Delete archetypes/archetypeTypes.ts (~138 lines, abandoned Round 7c)
  Drop @deprecated voiceAlignment + codeSwitching fields
  Update stale PROTOTYPE comment in essayLevelL3Walk.ts:36

Integration debt fixes — wire what's built, delete what's stranded:
  Wire findingPromotion.ts after L3.5 phase  (CRITICAL — unlocks downstream)
  Wire findingMaturityRefresh.ts after FindingStore populates
  Promote dumpLint.ts to production check at L4→render boundary
```

After Phase 0a:
- Lines deleted: ~7,250
- $/run: $1.69 (unchanged — code hygiene only)
- **FindingStore is now populated end-to-end** → ALL flag-gated capabilities can be evaluated

### Phase 0b — Stale doc cleanup (1-2 days, $0)

Per S5 recommendation. NOT just patching — full regeneration.

```
Regenerate docs/pipeline-evolution/00-index/CURRENT_STATE.md from git log + verification
Update IMPLEMENTATION_STATUS_MATRIX.md with corrected 22/8/1/5 counts
Mark L3/PLAN.md as superseded (Sweep+Lens architecture abandoned)
Mark workstream 01 PLAN.md as dissolved-into-04
Update L5_REDESIGN_INDEX.md priorAnnotations row (wire is live)
```

### Phase 1 — Bridge cost cuts (1 week)

**DROP Cut C and S3 R1** — they reshape L3.75 internals being deleted by retirement.

```
Cut A — drop reread_P3 sub-call            $0.107 saved
Cut B — drop L4-haiku coherence routing    $0.075 saved
Cut D — L1 output cap                      $0.030 saved
Cut E — connection scout cap               $0.020 saved
Cut F — L2 per-sentence tag trim           $0.015 saved
Cut G — L3.5 trim                          $0.025 saved (audit-first against locked decisions #5/#6)
+ Render-side R1-R9 (~1,300 lines off dump, $0)
+ Phase A1 cost-ledger split (telemetry foundation for measuring all subsequent phases)
```

**Cost: $1.69 → $1.42** (vs $1.40 with all cuts; $0.02 less because Cut C dropped — recovered 10x by retirement)

### Phase 2 — Assembler convergence (1 week, $0 cost)

```
Wire renderAnalysisForStudent.ts to production render path
Specify shared assembler/composition contract (for Phase 4 merger)
```

**Cost: $1.42** (output quality up; cost unchanged)

### Phase 3 — L4 collapse (1 week, parallel with Phase 4)

```
S3 R2 — collapse L4 three calls (NorthStar / ScoreMatrix / L4b) to one composite call
Resolves the C2 cache-defeat issue in crystallizer.ts:2148-2157
```

**Cost: $1.42 → ~$1.20** ($0.22 saved)

### Phase 4 — Composition layer + parity gate (1 week, $0)

```
Build compositionLayer.ts per FIELD_DISPOSITION_TABLE module spec
  → MERGE with renderAnalysisForStudent.ts infrastructure (don't duplicate)
  → 16 pure functions, calibration block, unit tests
Run parity gate against persisted Crochet + Three Days JSON dumps
  → Already on disk (per R6 / commit 465ab62)
  → Diff against existing L3.75 outputs
  → Reclassify "worse" fields from DET to LENS/RESIDUE
```

**Cost: $1.20** (no LLM change; validation step)

### Phase 5 — Lens + residue prompts (~2 weeks, depends on 02+03 design returns)

```
L3 lens prompts (Voice / Story / Meaning / Admissions)
Residue call prompt (4 fields: writerPortrait, entanglements, arcTrajectory, mechanisms)
L3.5 schema additions (contradictionFlags + essayStrengthSignatures emissions)
L4b ImprovementManifest extension (pairedImprovement)
F1 fix: profileRouter holisticFull demotion
```

### Phase 6 — Single bundled verification regen (~$1.70 spend, 1 day)

ONE Crochet dump regen exercising all of: composition + lenses + residue + L3.5 schema + L4b + R1/R2/R3/R4/R6 ratchets + S3 R2 + Phase 0a deletes.

**Per cost-budget memory: bundle calibration before verification.**

### Phase 7 — L3.75 retirement PR (1 week, MEDIUM-HIGH risk)

```
Wire compositionLayer + lenses + residue + L3.5/L4b extensions
Delete holisticSynthesis.ts (3,573 lines — NOT 2,500 as docs claim)
Migrate ~6 consumer reads
Tag pre-delete commit for one-shot rollback
```

**Cost: $1.20 → $0.85** ($0.35 saved by L3.75 retirement)

### Phase 8 — Activation phase (NEW — driven by S4 findings)

After findingPromotion is wired (Phase 0a), the dormant flags become evaluable. Phase 8 is a sequence of A/B activations:

```
Sequenced flag activations (each with quality + $ measurement):
  1. ENABLE_FOCUS_MODE     ($0 cost, surgical L5 targeting)
  2. ENABLE_AI_RISK_SIGNAL (~$0.01, calibration-dependent)
  3. ENABLE_CORPUS_RETRIEVAL_L35 + per-layer (~$0.02-0.10/layer, biggest dormant capability)
  4. ENABLE_VOICE_PROFILE_IMPORT (TBD, cross-essay continuity)
  5. Decision: re-enable deep-dive chain or keep commented out?

Plus optional further cost cuts:
  S3 R5 findingRef enforcement (trivial post-retirement)
  Sonnet voice overlay on assembler
  Tier 5.3 essay-text shared cache across layers
```

**End state: $0.70-$0.85 cold-start with full quality envelope evaluated.**

---

## 5. Cost ladder — final unified

```
$1.69  Today (Crochet baseline, May 10)
$1.69  + Phase 0a (code hygiene, $0 cost change)
$1.69  + Phase 0b (doc regen, $0 cost change)
$1.42  + Phase 1 (bridge cuts, drop C + S3 R1)
$1.42  + Phase 2 (assembler wired, $0 cost change)
$1.20  + Phase 3 (L4 collapse, S3 R2)
$1.20  + Phase 4 (composition layer parity, $0)
$1.20  + Phase 5 (lens + residue + L3.5/L4b, $0 until Phase 6)
       — Phase 6: single ~$1.70 verification regen —
$0.85  + Phase 7 (L3.75 retirement)
$0.70  + Phase 8 selective (cuts + activations balanced for quality)
```

**Lifecycle (cold-start + 3 focused at $0.10 each):**
- Today: ~$1.99 lifecycle, 34% margin at $3 charge
- After Phase 1: ~$1.72 lifecycle, 43% margin
- After Phase 7: ~$1.15 lifecycle, 62% margin
- After Phase 8: ~$1.00 lifecycle, 67% margin

---

## 6. Decision points — Tue's input required

Listed by impact-on-plan order:

### D1: Adopt $0.85 cold-start as official v2 cost target?

- **Recommend YES.** $1.50 was the prior target; with retirement plan now visible, $0.85 is achievable and gives 62%+ margin at $3 charge.
- Alternative: keep $1.50 formal, $0.85 stretch goal (more conservative).

### D2: Drop Cut C + S3 R1 from Bundle 1?

- **Recommend YES.** Both reshape L3.75 internals being deleted in ~6 weeks. Sunk-cost edits of 1-2 days that get thrown away.
- Cost: lose $0.05-$0.17 of interim savings (recovered 10x by retirement).

### D3: Wire findingPromotion as Phase 0a (highest leverage)?

- **Recommend YES.** $0 marginal cost. Unlocks proper evaluation of ALL flag-gated capabilities (Phase 8). Enables L4 to cite findings instead of re-narrate.

### D4: Re-enable deep-dive chain or keep commented out?

- Currently commented out at `orchestrator:1906-1912` for cost reasons (~$0.05-$0.15 per analysis if re-enabled).
- Re-enables AFTER findingPromotion populates findings (otherwise no maturity to mature).
- **Recommend: defer to Phase 8** — measure with FindingStore properly populated, then decide.

### D5: Activation sequence for the 5 unset flags?

- Recommended order in Phase 8 above (Focus Mode → AI Risk → Corpus Retrieval → Voice Profile).
- All depend on findingPromotion wiring to be properly evaluable.
- Each can be A/B'd independently after findingPromotion lands.

### D6: Where should this unified plan document live long-term?

- Currently at `docs/pipeline-evolution/00-index/UNIFIED_PLAN_HOLD_2026_05_10.md` (this file)
- Options:
  - (a) Promote to replace `CURRENT_STATE.md` after iteration
  - (b) Keep as separate ITERATION_SYNTHESIS-style doc alongside the L3.75 one
  - (c) Promote to `04-pipeline-architecture/MASTER_INTEGRATION_PLAN_v2.md`
- **Recommend (a)** — S5 said `CURRENT_STATE.md` should be regenerated; this IS the regeneration content.

---

## 7. Living-state map (update as artifacts move)

| Artifact | State | Owner |
|---|---|---|
| This document | `hold` — awaiting D1-D6 decisions | Tue |
| `presentation/renderAnalysisForStudent.ts` | `unwired prototype, identified as composition layer base` | Phase 2 + 4 |
| `findingPromotion.ts` | `verified orphan, queued for Phase 0a wire` | Phase 0a |
| `findingMaturityRefresh.ts` | `verified orphan, queued for Phase 0a wire` | Phase 0a |
| `dumpLint.ts` | `verified test-only, queued for production-check promotion` | Phase 0a |
| 5 unset feature flags | `dormant capability, queued for Phase 8 activation A/B` | Phase 8 |
| Deep-dive chain | `intentionally commented out, decision deferred to Phase 8` | Phase 8 |
| `archetypes/archetypeTypes.ts` | `abandoned scaffolding, queued for Phase 0a delete` | Phase 0a |
| `versioning/` subsystem | `verified dead, queued for Phase 0a delete` | Phase 0a |
| `holisticSynthesis.ts` (3,573 lines) | `live, queued for Phase 7 deletion` | Phase 7 |
| `runningUnderstandingManager.ts` | `Phase E2 deletion target, queued for Phase 7` | Phase 7 |
| `L3/PLAN.md` Sweep+Lens | `architecturally obsolete, queued for Phase 0b supersession mark` | Phase 0b |
| `CURRENT_STATE.md` | `14 days stale, queued for Phase 0b regeneration` | Phase 0b |
| `IMPLEMENTATION_STATUS_MATRIX.md` | `9 components miscounted, queued for Phase 0b correction` | Phase 0b |

---

## 8. Cross-references

### Source documents synthesized
- Prior cut audit (2026-05-07) — `tests/output/full-profile-AUDIT.md`
- S4 integration-debt scan (in subagent transcripts)
- S5 stale-doc audit (in subagent transcripts)
- S6 L3.75-retirement integration (in subagent transcripts)
- Parallel session: `docs/pipeline-evolution/04-pipeline-architecture/L3-75/FIELD_DISPOSITION_TABLE.md`
- Parallel session: `docs/pipeline-evolution/04-pipeline-architecture/L3-75/ITERATION_SYNTHESIS_2026_05.md`

### Key roadmap docs (verified status per S5)
- `docs/pipeline-evolution/00-index/CURRENT_STATE.md` — 14 days stale, needs regeneration (Phase 0b)
- `docs/pipeline-evolution/00-index/IMPLEMENTATION_STATUS_MATRIX.md` — 9 components miscounted
- `docs/pipeline-evolution/04-pipeline-architecture/L3/PLAN.md` — architecturally obsolete (Sweep+Lens replaced)
- `docs/pipeline-evolution/04-pipeline-architecture/L3-75/L3_ABSORBS_L3_75.md` — superseded by ITERATION_SYNTHESIS_2026_05
- `docs/pipeline-evolution/04-pipeline-architecture/cross-cutting/PIPELINE_ARCHITECTURE_AUDIT.md` — F1 still unresolved at HEAD

### Key code paths (verified at f181f84)
- `src/services/essayIntelligence/analysis/findingPromotion.ts` — orphan, Phase 0a target
- `src/services/essayIntelligence/findings/findingMaturityRefresh.ts` — orphan, Phase 0a target
- `src/services/essayIntelligence/profileManager/dumpLint.ts` — test-only, Phase 0a promotion target
- `src/services/essayIntelligence/presentation/renderAnalysisForStudent.ts` — unused prototype, Phase 2 + 4 base
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts:1906-1912` — commented-out deep-dive
- `src/services/essayIntelligence/analysis/aiRiskSignalBlock.ts` — flag-gated capability
- `src/services/essayIntelligence/analysis/corpusRetrievalBlocks.ts` — flag-gated capability
- `src/services/essayIntelligence/profileManager/profileRouter.ts:783, 809` — F1 unresolved
- `src/services/essayIntelligence/coaching/coachingService.ts:4016-4017` — L6 partial migration

### Memory updates (already saved)
- `feedback_cost_budget.md` — updated with $1.50 → $0.85 target evolution + cost-only-down rule
- `pitfalls_integration_debt.md` — diagnostic signature for finding more integration debt
- `pitfalls.md` — `cumulative_usd` ledger pitfall + L4 caching state

---

## 9. Open questions

1. The 5 dormant flags' calibration debt — when does each become safe to enable? `ENABLE_AI_RISK_SIGNAL` explicitly blocked by "elevated false-positive" per orchestrator `:3157`. Are the others calibration-blocked or just-not-yet-tried?
2. Phase 5 depends on workstream 02 + 03 design returns — those returned per S5, but is the data ready to consume into lens/residue prompts?
3. The deep-dive cost cut — what's the original ROI calculation that drove the comment-out? Worth re-evaluating with a populated FindingStore.
4. S5's recommendation to regenerate `CURRENT_STATE.md` from `git log` — this document IS that regeneration content. Should we promote it to that path, or keep as separate iteration synthesis?

---

## 10. Status

- ✅ All 4 deepdive audits complete (prior cut audit + S4 + S5 + S6)
- ✅ Memory updated (cost-budget rule, integration-debt pattern, ledger pitfall)
- ⏸️ This document on HOLD — awaiting D1-D6 decisions
- ⏸️ All implementation paused until decisions resolve

**Nothing is committed. Nothing is being executed. This document exists to enable Tue's iteration/redirection before any code or doc changes.**
