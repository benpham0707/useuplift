# Phase 2 Foundation Ground State — Read-Into-Readiness Doc

**Date:** 2026-04-30
**Branch:** `feat/integrated-pipeline-build`
**HEAD:** `3103dd5` (Phase 1 closed)
**Purpose:** Catalogue the actual state of every Phase 0 + Phase 1 deliverable that Phase 2 will read from or extend, at the file:line level, so Phase 2's prompts and aggregator are designed against the real foundation rather than a remembered version of it.
**Scope:** Read-only. This doc is not an audit — D-1.17 already verified contracts. This is a *seam map* for Phase 2's integrators.

---

## §1 — The Phase 2 spine and where it plugs in

Phase 2 (D-2.1–D-2.14) builds the SpecificsNeed aggregator + queue extension. The work decomposes into:

| Phase 2 deliverable | Plugs into existing file | At seam | Type of change |
|---|---|---|---|
| D-2.1 — QuestionQueueManager extension | `src/services/essayIntelligence/analysis/questionQueueManager.ts` | New methods on existing class | Service extension |
| D-2.2 — L3 walk prompt extension | `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts` (`SYSTEM_PROMPT_TEMPLATE` at line 186) | Prompt body addition + output schema field | Prompt revision |
| D-2.3 — L3.5 analysis prompt extension | `src/services/essayIntelligence/analysis/analysisPass.ts` (system prompt builder) | Prompt body addition + output schema field | Prompt revision |
| D-2.4 — L3.75 holistic prompt extension | `src/services/essayIntelligence/analysis/holisticSynthesis.ts` (4 prompts: PHASE_A line 328, PHASE_B line 524, META line 741, CURATION line 810) | Prompt body addition across 1+ phases + output schema | Prompt revision |
| D-2.5 — L4 northStar prompt extension | `src/services/essayIntelligence/analysis/crystallizer.ts` (`buildSystemPromptL4aNorthStar` at line 360) | Prompt body addition + emit on `confidence === 'hypothesis'` | Prompt revision |
| D-2.6 — FindingStore stuck-hypothesis emission | **NEW SERVICE NEEDED** — see §3 | (no existing seam) | New service |
| D-2.7 — `specificsNeedAggregator.ts` | New file at `src/services/essayIntelligence/analysis/specificsNeedAggregator.ts` | n/a | New file |
| D-2.8 — Aggregator integration | `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` | Between Phase 5 (L4) and Phase 6 (L5) — see §2 | Service extension |

The full code dependency graph is in `L5_IMPLEMENTATION_PLAN.md` §1; this doc names the actual file:line points where each deliverable lands.

---

## §2 — The orchestrator integration site (D-2.8)

`analysisOrchestrator.ts` runs through 6 phases. Phase 6 (L5 deepAnnotation) reads `priorAnnotationsForL5` built by `priorAnnotationsBuilder` at line 1184–1191. The aggregator integration goes BEFORE Phase 6, AFTER L4 + L3.5 + L3.75 + L3 walk have all populated their respective profile slots and emitted their `specificsNeedEmissions[]` contributions.

**Recommended insertion point:** end of Phase 5 (after L4 crystallizer + delta synthesis at lines 1090–1156), before the Phase 6 priorAnnotations call at line 1184. The aggregator:

1. Reads emissions from each layer's last-iteration output stored on the profile (L3 walk emissions on `paragraph.understanding.specificsNeedEmissions[]`, L3.5 on `paragraph.analysis.specificsNeedEmissions[]`, L3.75 on `essayUnderstanding.holistic.specificsNeedEmissions[]`, L4 on `northStar.specificsNeedEmissions[]`, FindingStore via the new stuck-hypothesis service from §3).
2. Deduplicates against the existing open queue questions (by `(anchorParagraph, expectedAnswerShape, framingSeed-similarity)`).
3. Calls `questionQueueManager.addQuestion()` for each new emission.
4. Increments `iterationsSurvived` on existing queue questions whose new emission matches.

**Failure surface:** any malformed emission → throw with layer + index context (per L5_E2E_INTEGRITY_AUDIT.md §3.6: "we do *not* silently drop the entry"). Halt-on-error orchestration policy from D-1.12 already in force at this site.

**Telemetry:** emit `phase5_aggregator_run` step event with `{ emissionsByLayer: { l3, l3_5, l3_75, l4, finding_store }, deduplicated, addedToQueue, surviveCountIncremented }`.

---

## §3 — D-2.6 scope expansion: FindingStore stuck-hypothesis path

**Critical foundation finding:** there is NO existing finding-maturity-refresh service in the codebase. Verified by grepping every variant of `maturity.*refresh|haiku.*finding|stuck.*hypothesis|Finding.*hypothesis.*iter` across `src/`. The only finding-related Haiku/promotion path is `findingPromotion.ts` (514 lines) which promotes L3.5 analysis output into `Finding` objects — it is NOT a maturity-refresh path.

**Implication for D-2.6:** the spec's literal instruction was "extend the existing maturity-refresh Haiku call's prompt OR add a small separate Haiku call (decide based on prompt complexity; default extend)." Since the maturity-refresh call doesn't exist, **D-2.6 must build it**. This is a scope expansion from "extend a prompt" to "build a new service + prompt." Estimated effort: 6–8h instead of the spec's 4–5h.

**Recommended shape:** a new file `src/services/essayIntelligence/findings/findingMaturityRefresh.ts` that:
1. Reads `findingStore.getActive()`, filters to `maturity === 'hypothesis'` AND `iterationsAlive ≥ 2` (computed from `lineage[].timestamp` — earliest entry vs current iteration).
2. Per-finding: runs a Haiku call asking *"can this hypothesis be advanced from re-reading the text alone, or does it need student input? If the latter, what would you ask?"*
3. Outputs: `{ findingId, advanceableFromText: boolean, specificsNeedEmission?: { whyAsked, expectedAnswerShape, framingSeed, populates } }`.
4. Cost target: ~$0.005 per finding × ~3-5 stuck findings per iteration = ~$0.015–$0.025/iteration.

This service is invoked by the aggregator integration in §2. **Surfacing as scope expansion for Tue's ratification before D-2.6 lands.**

---

## §4 — The 5 layer prompts Phase 2 extends — current state catalogue

### §4.1 — L3 walk (`sequentialDeepWalk.ts:186`)

**System prompt:** ~500 lines. Single, coherent, deeply-revised. Key principles already encoded:

- **"Literature PhD who has read 10,000 essays"** — counselor-tier reader identity established in line 1.
- **Understanding-only contract** — "FORBIDDEN VOCABULARY" rule (line 192) banning evaluative words. Carved out at `improvementCandidate` field only (line 448–465). This is the **structural anti-contamination** Phase 2 prompts must preserve.
- **SURFACE → STRUCTURAL → ARCHITECTURAL** depth ladder (lines 197–234) with concrete upgrade examples. Phase 2's specifics-need emissions live at the *architectural* tier — they exist *because* re-reading the text alone won't reveal what the architectural read needs.
- **Evidence grounding as cognitive forcing function** (lines 236–243): "Every observation MUST cite specific text — quote the actual words." Findings already inherit this. **Phase 2's emissions don't need to repeat this — they cite the finding which carries the evidence (per Tue's 2026-04-30 correction: span-citation is finding-level, not emission-level).**
- **Novelty-driven growth** (lines 245–250): "P5 should produce focused output (only what P5 contributes that earlier paragraphs didn't)" — anti-repetition by construction.
- **Observation Economy test** (lines 252–256): "Would a competent English teacher already know this? If YES — do NOT produce." This is the "earn its spot" rule already in production.
- **Findings as primary unit** (lines 303–318) with maturity assessed honestly. **D-2.6's emission flows from the finding's `deepeningPotential` + `raisesQuestions` fields, both already in the schema.**

**D-2.2 extension shape:** add ~30–50 lines naming the specifics-need contract. Output schema gains `specificsNeedEmissions: SpecificsNeedEmission[]` at the top level (or per-finding, decided by D-2.2 round-1 draft). Emit only when:
- A finding's `deepeningPotential` cannot be advanced by re-reading the text alone, AND
- The student's lived experience would resolve it.

**Anti-pattern to avoid:** baking a hard rule like "every finding with deepeningPotential != null must emit." That would re-introduce the closed-taxonomy / formulaic-emission antipattern. The emission is a *judgment* the LLM makes, not a *consequence* of a checkbox.

### §4.2 — L3.5 analysis (`analysisPass.ts`)

**System prompts:** Multi-prompt — anchor + parallel paragraph calls, plus essay-level mode. F1 cliché anchor extension (lines 124–140) provides SCORE-band calibration.

**Key state:**
- L3.5 is the **first evaluative layer** (line 5: "All prior layers (L1-L3.75) were purely descriptive. L3.5 makes parallel Sonnet calls per paragraph, evaluating HOW WELL each sentence and paragraph work").
- The forbidden-vocab lint does NOT apply to L3.5 (it's evaluative territory).
- Anchor-paragraph-first calibration (anchor selected by `selectAnchorParagraph` at line 193) → parallel non-anchor scoring with anchor as reference.
- Each `sentenceAnalysis` carries `confidence: { level: 'high' | 'medium' | 'low', reasoning, sensitivityNote? }`.

**D-2.3 extension shape:** emit specifics-need on `sentenceAnalyses[].confidence === 'low'` AND `sensitivityNote` names student-side. The emission asks for the lived-experience anchor that would resolve the confidence ambiguity. Output schema gains `specificsNeedEmissions: SpecificsNeedEmission[]` per paragraph analysis.

**Per-Tue's-correction discipline:** the prompt extension teaches the LLM the *disposition* — "when a sentence's effectiveness depends on a lived-experience anchor not in text, an emission is the honest representation." It does NOT enforce "low confidence → must emit" as a hard rule. Many low-confidence sentences will resolve from re-reading; only the ones that *truly* need student input emit.

### §4.3 — L3.75 holistic (`holisticSynthesis.ts`)

**System prompts:** **FOUR separate Sonnet calls** in the comprehensive path:
- **PHASE_A** (line 328): voiceIdentity + voiceMap + emotionalTopography + momentEarnednessMap + entanglements.
- **PHASE_B** (line 524): thematicArchitecture + narrativeStrategy + characterRevelation + craftAssessment + admissionsPositioning.
- **META** (line 741): walk validation + reading strategy + convergence.
- **CURATION** (line 810): question queue curation.

**SHARED_PREAMBLE** (line 292) establishes Understanding-only framing for both A and B with FORBIDDEN VOCABULARY — same pattern as L3.

**D-2.4 extension shape:** the spec names 4 contributors (`momentEarnednessMap.gaps`, `intentBridge.alignments` mismatches, `voiceIdentity.authenticVsPerformed` flagged "performed", `admissionsPositioning.redFlags`). These straddle PHASE_A (momentEarnedness, voiceIdentity) and PHASE_B (intentBridge — wait, intentBridge is L4 not L3.75 — see §4.4 — and admissionsPositioning).

**Distribution decision needed at D-2.4 round-1:** emissions emit per phase → Phase A's extension covers voice/earned-ness emissions, Phase B's extension covers admissions/redFlags emissions. The CURATION phase merges into the queue in iteration-cycle synthesis. The META phase's reading-strategy discovery is ALREADY the LLM-first carrier for "read this essay on its own terms" (the flexibility-of-purpose principle from Tue's 2026-04-30 directive — see PHASE_2_PROMPT_BENCHMARK.md when written).

**Length-budget caution:** Phase A + B prompts are already 8K + 10K max-tokens. Output schema additions must NOT push token usage past these limits. Recommendation: emissions go in a separate top-level `specificsNeedEmissions[]` array, kept short (1-2 sentences each).

### §4.4 — L4 northStar (`crystallizer.ts:360`)

**System prompt:** `buildSystemPromptL4aNorthStar` — "You are the Crystallizer — a literary-architectural analyst." Strong prompt with:
- **NOT a summary** framing (line 369): "A summary is lossy compression — everything in it exists more deeply elsewhere."
- **EMERGENT PROPERTY** framing (line 370): the conductor metaphor. The northStar is the interpretive synthesis.
- **Active dimensions by essay type** (line 372): `supplement | piq | personal_statement` — closed enum here is appropriate (it's a system routing scale, not a perception taxonomy — Rule 6 territory).
- **BAD vs GOOD examples** for distinctiveness (lines 411–414).
- **Confidence ladder**: `hypothesis | emerging | full | student_confirmed` (line 432).

**D-2.5 extension shape:** emit specifics-need when `confidence === 'hypothesis'` on key fields (throughLineMap.transformation, distinctivenessSignature.articulation, intentBridge.alignments). The emission is what the student would need to confirm to lock the hypothesis into 'emerging' or 'full'.

**Note:** `intentBridge` is L4 territory but only active for `personal_statement` essays (line 421). Most PIQ essays won't have intentBridge emissions.

### §4.5 — FindingStore stuck-hypothesis (NEW SERVICE, see §3)

The service operates over `findingStore.getActive()` filtered to `maturity === 'hypothesis'` AND `iterationsAlive ≥ 2`. Iteration-alive count is computed from `lineage[]` timestamps + `IterationLedger.iterations[]` chronology.

**D-2.6 extension shape:** the new finding-maturity-refresh service runs a Haiku call per stuck finding. Prompt asks: *"Given this finding's claim and evidence, can re-reading the essay text advance it from hypothesis to confirmed/deepened? If not, what would you ask the student to resolve the gap?"*

Output: per-finding `{ advanceableFromText: boolean, specificsNeedEmission?: SpecificsNeedEmission }`. Emissions feed the aggregator (D-2.7).

---

## §5 — The QuestionQueueManager seams (D-2.1)

`questionQueueManager.ts` is 225 lines. The class:
- Holds `questions: UnderstandingQuestion[]`.
- Existing methods: `getAll()`, `getOpenQuestions()`, `getStaleQuestions()`, `getById()`, `mergeCuratedOutput()`, `resolve()`, `spawnChild()`, `addQuestion()`, `advanceIteration()`, `openCount`, `resolvedCount`.
- Existing status transitions: `open → resolved` (via `resolve()` or `mergeCuratedOutput`'s resolved bucket), `open → filtered` (via `mergeCuratedOutput`'s filtered bucket), `filtered → open` (via re-curation, line 125–128).

**Missing for Phase 2:**
- `markAskedToStudent(id, conversatorMessageId)` — `open → asked_to_student`.
- `markStudentAnswered(id, structuredAnswer)` — `asked_to_student → student_answered`.
- `markStudentDeclined(id, reason)` — `asked_to_student → student_declined`.
- `getOpenAnalysisGapQuestions(): UnderstandingQuestion[]` — filter `getOpenQuestions()` to `source === 'analysis_specifics_gap'`.
- Illegal-transition validation (e.g., `resolved → asked_to_student` should throw).

**Pre-existing types ready:**
- `UnderstandingQuestionSource` includes `'analysis_specifics_gap'` (profileTypes.ts:5686–5692) — D-0.2 work landed.
- `UnderstandingQuestionStatus` includes `'asked_to_student' | 'student_answered' | 'student_declined'` (profileTypes.ts:5703–5709) — D-0.2 work landed.
- `DigContext` interface fully defined (profileTypes.ts:5736–5774) — `whyAsked`, `expectedAnswerShape`, `consumers`, `populates`, `framingSeed`, plus the populated `askedAt`, `conversatorMessageId`, `studentAnswerRaw`, `structuredAnswer`, `extractionPending`.
- `UnderstandingQuestion.dig?: DigContext` field declared (profileTypes.ts:4503).

**D-2.1 effort:** ~3–4h as spec'd. Pure code, no prompt revision needed.

---

## §6 — The IterationLedger / TaughtMove / priorAnnotations spine (Phase 1, ready)

D-1.17 audit verified all 18 Phase 1 deliverables landed honestly. Phase 2 reads from this foundation:

| Field | Producer | Phase 2 read site |
|---|---|---|
| `IterationLedger.currentIteration` | analysisOrchestrator entry (D-1.10) | All Phase 2 layers (for emission keying) |
| `IterationLedger.iterations[]` | orchestrator end (D-1.10) | FindingStore stuck-hypothesis path (compute `iterationsAlive` against earliest finding lineage timestamp) |
| `IterationLedger.taughtMoves[]` | L5 end (D-1.2) | priorAnnotationsBuilder reads in Phase 6; Phase 2 doesn't directly read |
| `IterationLedger.recentDecisions[]` | orchestrator decision points (D-1.11) | Aggregator may consume for prioritization heuristics (optional) |
| `priorAnnotations` Map | priorAnnotationsBuilder (D-1.6/7/8) | Phase 6 L5 — Phase 2 doesn't touch |
| `landing.status` on TaughtMove | landingDetector (D-1.3/1.6.5) | Cross-iteration synthesis Phase 4; Phase 2 doesn't directly consume |

**No drift to fix here.** Phase 2 reads cleanly from the Phase 1 spine.

---

## §7 — Halt-on-error orchestration policy (D-1.12, in force)

D-1.12 closures landed at HEAD `1eedc6c`:
- Commit A: 5 CRITICAL closures.
- Commit B: focusedAnalyzer escalation-ladder honesty (8 silent catches → structured failure flags).
- Commit C: analysisOrchestrator HIGH violations (safeCheckpoint + Phase 5.5/5.75 telemetry + direct-push fallback halt).

**Phase 2's halt-on-error inheritance:**
- Aggregator throw on malformed emission → halts iteration (per L5_E2E_INTEGRITY_AUDIT.md §3.6).
- D-2.6's new finding-maturity-refresh service must follow the same pattern: per-finding Haiku failure → throw with finding ID + iteration context.
- Telemetry events for every aggregator + maturity-refresh step.

The `phase1-failure-injection.ts` test (553 lines, 5 layers, 11 sub-cases) covers builder + detector boundaries. **MED-1 from D-1.17 audit:** orchestrator-side catches were closed by code-review (D-1.12), not by failure-injection tests. Item 13 of the deferred-items closure pass adds those orchestrator-driven sub-cases.

---

## §8 — Mock-LLM testing pattern (D-0.11 + D-1.15.x conventions)

`tests/integration/phase1-iteration-ledger.ts` (1397 lines) holds 5 D-1.15 scenarios using `vi.mock` at the layer boundary (`detectLanding`). Each scenario uses 5 nested describe blocks (mock surface, priorAnnotations Map, D-1.6.5 landing write-back, iter-2 ledger commit, iter-2 essay structure) per Tue's diagnosability directive.

**Phase 2 mock-LLM pattern (D-2.12):** same boundary-level mock approach. The aggregator is pure deterministic (no LLM calls) — testing it is straightforward. The per-layer prompt extensions (D-2.2 through D-2.6) are tested via mock fixtures that include `specificsNeedEmissions[]` in the mocked output, asserting the aggregator picks them up.

**Multi-essay diversity** — fixtures use 3 admitted essays from `elite-examples-2025.ts` (harvard-mites-2029, ucla-cancer-awareness-2029, ucb-cell-tower-2029). Phase 2 fixtures should follow the same rule: don't bias toward a single essay genre.

---

## §9 — Cost discipline state (D-1.18 closed, $0.51 / $9 cap)

Cumulative spend through Phase 1: $0.5110. Spend headroom: $8.49 vs $9 hard cap.

**Phase 2 budget (D-2.14):** ≤$2.00 cumulative through end of Phase 2. New spend allowance: ~$1.49.

**Phase 2 paid-call points:**
- D-2.9 mid-build sanity check: $0.50–$1.00 (1 essay first; iterate on prompt; only run a second time if Tue ratifies).
- D-2.6's stuck-hypothesis Haiku calls during D-2.9: ~$0.025 per iteration × 1 fixture × 1 run = ~$0.025.
- Buffer remaining for unexpected re-runs: ~$0.45.

**Pre-spend ratification gate (per `feedback_cost_budget.md`):** D-2.9 run plan goes to Tue BEFORE spending, with the exact fixture + expected token counts + cost estimate. No tangent runs.

---

## §10 — Disposition of the 7 OPEN deferred items

| # | Item | Current state | Disposition |
|---|---|---|---|
| 1 | paragraph-merge edit shape | OPEN | New D-1.15 scenario (Track C-5) |
| 2 | paragraph-split edit shape | OPEN | New D-1.15 scenario (Track C-5) |
| 3 | transformative pure-rewrite | OPEN | New D-1.15 scenario (Track C-5) |
| 5 | iter-2 IterationRecord synthesis fidelity | OPEN | End-to-end test (Track C-4) |
| 6 | brief→editScope translation | OPEN | Pure-code integration test (Track C-3) |
| 11 | 2 vitest skipped tests | **CLOSED** (legitimate CI-verified placeholders, inline rationale at `tests/integration/phase0-types-migrations.test.ts:60–66` and `:338–345`) | No code change |
| 13 | orchestrator-side failure-injection coverage | OPEN | Extend `phase1-failure-injection.ts` (Track C-6) |

Plus LOW-1 (D-1.10 REVISIT bracket): **already closed inline at `L5_IMPLEMENTATION_PLAN.md:619`** — the REVISIT was replaced with a closure annotation showing "REVISIT closed." The phase-1 audit captured a stale state.

**Net work remaining for Track C:** items 1, 2, 3, 5, 6, 13 (~12–15h, all zero-API). After completion, the foundation is genuinely ready for Phase 2's standards.

---

## §11 — Verdict

The Phase 0 + Phase 1 foundation is **structurally sound**:
- Types are clean (IterationLedger / TaughtMove / DigContext / UnderstandingQuestion all extended cleanly per D-0.1 / D-0.2).
- The 5 layer prompts that Phase 2 extends are individually high-quality and embody Understanding-vs-Analysis separation, evidence grounding, and Observation Economy.
- The orchestrator integration site is well-defined (between Phase 5 and Phase 6 of `analysisOrchestrator.ts`).
- The QuestionQueueManager has the API surface Phase 2 extends; the type extensions are in place.
- Halt-on-error policy is in force; mock-LLM testing pattern is established.

**One scope expansion required:** D-2.6 builds a new finding-maturity-refresh service (no existing service exists). Surfacing for Tue's ratification before D-2.6 lands.

**Six items of mechanical closure work remain** before D-2.1 starts. None block Phase 2 conceptually; they ensure the foundation bears the standards Tue set ("the system 500/hr counselors would build for themselves").

---

## §12 — Connection to PHASE_2_PROMPT_BENCHMARK.md

This ground-state doc is the *what we're building on*. The benchmark doc is the *how we frame what we build*. The benchmark inherits from this doc:

- **Existing prompt patterns to extend cleanly** (L3's Understanding-only framing; L3.75's SHARED_PREAMBLE; L4's NOT-a-summary framing; L3.5's anchor-then-parallel calibration).
- **Existing prompt antipatterns to NOT introduce** (no closed taxonomies; no banned-word regex; no character-count minimums; no per-emission anchor enforcement — anchor is finding-level per Tue's 2026-04-30 correction).
- **The three-principle stack** (tailored-not-generic; flexibility-of-purpose; best-of-its-kind) translated into per-layer extension instructions.
- **The two-test swap pattern** at prompt review (could-this-feedback-appear-on-a-different-essay? + could-this-feedback-appear-on-an-essay-with-different-purpose?).

Benchmark doc lands after Track C completes.

---

> **End of foundation ground state.** Next: Track C closure (6 deliverables, ~12–15h, zero API), then Track D benchmark, then Phase 2 D-2.1 begins under per-prompt Tue-ratification discipline.
