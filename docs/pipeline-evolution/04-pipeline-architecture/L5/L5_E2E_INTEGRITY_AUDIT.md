# L5 End-to-End Integrity Audit

> **Step 1.6 deliverable.** Walk the entire student flow end-to-end, name every step, name the owner / inputs / outputs / failure surface for each. Specify the Conversator as an analysis-driven targeted inquiry agent. Specify the analysis-driven specifics-need signal. Apply the no-fallback stance across all four redesign documents. List every coverage gap that gates the build phase.
>
> **Stance — load-bearing, applies to every recommendation below.** We do not build fallbacks. We build a system that **works** and **knows when it fails**. Every "X if Y fails" line in the prior docs is either deleted (replaced with "Y works; if not, telemetry surfaces Z; we fix Y") or recognized as legitimate independent architecture (e.g., comprehensive-mode escalation is *not* a fallback — it's a routing decision for change-types that warrant full re-derivation). Parallel mechanisms covering each other are a smell; single owners with visible failures are the design.
>
> **Confirmed user decisions, locked in.**
> - Q1 (redirection fraction): **RETIRED per Tue's R-1 Resolution A (2026-04-26)**. No mandated redirection fraction. Saved budget is genuine savings; extra spend is triggered by the escalation ladder (`L5_ITERATION_LOOP_DESIGN.md` §6.4 + §9), never scheduled. ~~20% (iteration design default).~~
> - Q4 (landing-detector confidence floor): **0.7** (iteration design default).
> - Q-A (Conversator availability): **continuous chat surface, always available; analysis-initiated dig questions fire at specific moments — after first feedback, between iterations, when the student is stuck**.
> - Q-B (specifics dig origination): **analysis-driven (B1)**. The analysis layers produce a structured signal naming exactly what specifics they need; the Conversator is the targeted inquiry agent that asks for those specifics, captures the answer, structures it, and feeds it back. The Conversator's flexibility lives in *how* to ask, *when* to fire, *how to handle nuance and clarification*, *how to translate answers into structured input* — not in deciding what to ask.
>
> **[NOTE — L3.75 absorption applies (Phase 0 D-0.18 R-2 supersession). Per [`L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md) (APPROVED 2026-04-25), the L3.75 layer is being retired and its work absorbed into L3 lenses (Voice / Meaning / Story / Admissions) + L3 Pass 3 + L3.5 (contradictionFlags, essayStrengthSignatures) + L4b (pairedImprovement). The fields referenced below still exist; their layer-of-origin changes. Specifically: §1.3 step 11 ("L3.75 holistic synthesis runs in targeted-refresh mode") re-maps to "L3 Pass 2 — affected lens(es) re-run; Pass 3 re-runs if cross-dimension fields invalidated; lens-targeted invalidation flags computed by editUnderstandingService; NO fallback to per-section calls within a single call". §3.2 SpecificsNeed contributors split the L3.75 row into Voice / Meaning / Story / Admissions lens contributors + Pass 3 contributors per [`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`](../cross-cutting/L5_AND_MASTER_RECONCILIATION.md) §R-2 + §R-7. §6.2 no-fallback diff applied to iteration design's L3.75 references re-maps the same way.]**

---

## 1. The student flow, end to end

Every step the student traverses from session-open to session-exit. Numbered for cross-reference in §2's ownership table. Each step is either currently **built**, **partial**, or **unbuilt**.

### 1.1 Session bootstrap

1. **Student opens the essay editor** with an essay (new or returning).
2. **Profile load** — if returning, the prior `EssayProfile` (including the `iterationLedger`, `findings`, `taughtMoves`, conversator session log, and any `groundTruthFacts`) is loaded from persistence.
3. **Session state initialization** — `iterationLedger.currentIteration` is incremented if this is a new iteration of the same essay; the `recentDecisions` rolling window prunes per design.
4. **Continuous chat surface mounts** — the Conversator UI surface is available from the moment the editor renders; the student can ask anything at any time. (Per Q-A.)

### 1.2 Analysis trigger

5. **Student submits the essay** (first pass) or **submits an edited version** (iteration). The `editUnderstandingService` runs on iteration ≥ 2 to produce the `ReanalysisBrief` + diff.
6. **Mode selection** — `focusedAnalyzer.selectAnalysisMode()` decides between `comprehensive` and `focused` per the existing 7-rule decision tree at `focusedAnalyzer.ts:705–783`. (Note: per the iteration design's no-fallback stance, "comprehensive mode" is a *routing decision for change-types that warrant full re-derivation* — structural reorder, transformative edits across >2 paragraphs — *not* a fallback for cases the focused mode "can't handle". The mode selector either picks the right mode or it fails visibly via the iteration ledger's cost-vs-baseline tracking.)

### 1.3 Pipeline execution (analysis layers)

7. **L1 firstImpressions** runs on changed paragraphs (Haiku). On unchanged paragraphs, the carry-forward L1 stands.
8. **L2 structural cartography** runs only on structural change; otherwise carries (Sonnet, single call).
9. **L2.5 connection scout** runs on any non-trivial paragraph edit (Haiku).
10. **L3 sequential deep walk** runs per changed paragraph with prior `paragraphUnderstanding` as input context (Sonnet × N). Unchanged paragraphs carry their understanding directly. The walk's running-state propagates fresh `holisticEvolution` snapshots through unchanged paragraphs without re-walking them.
11. **L3.75 holistic synthesis** runs in **targeted-refresh mode**: receives carry-forward synthesis + per-section invalidation flags + diff. Single Sonnet call with section masks; only flagged sections regenerate. (Per iteration design §4.5; per Tue's no-fallback stance, this is the design — there is no per-section-call alternative. If the prompt fails to selectively regenerate, that's a prompt bug we fix; we do not maintain a parallel per-section path.)
12. **L3.5 analysis pass** runs on changed paragraphs. Unchanged paragraphs' analyses carry. The `confidence` triple comes with paragraph re-derivation.
13. **improvementPhase assessment** runs every iteration (Sonnet, ~$0.025). Receives prior phase as input context so transition fields populate.
14. **L4 north star + score matrix + coaching map + coherence** runs per the iteration design's per-component policy (§4.8–4.9).
15. **FindingStore maturity refresh** — Haiku validity checks on findings whose evidence anchors are in changed paragraphs. Maturity transitions (`developing → confirmed`, `confirmed → deepened`, or supersession) per LLM judgment.
16. **L5 deepAnnotation** runs with `priorAnnotations` populated from `taughtMoves` (the dead-wire fix). On changed paragraphs: full re-derivation. On unchanged paragraphs: re-emit only if a Finding affecting that paragraph matured OR coachingMap priorities reshuffled OR a higher-rank prior annotation was marked `unaddressed`.
17. **Cross-paragraph synthesis** — replaced by the L5 redesign's Tier 2 synthesis pass. Re-derives on multi-paragraph edits or priority reshuffle; skips otherwise.

### 1.4 SpecificsNeed signal aggregation (NEW — analysis-driven dig source)

18. **Each layer that produced a low-confidence read or a gap signal contributes to the `specificsNeedQueue`.** Specifically:
    - L3 walk: every `Finding` it added with non-null `deepeningPotential` and non-empty `raisesQuestions[]` whose answers can only come from the student (per LLM judgment baked into the walk prompt).
    - L3.5 analysis: every sentence with `confidence.level === 'low'` whose `confidence.sensitivityNote` names something the student would know.
    - L3.75 holistic: every `momentEarnednessMap.moments[].gaps[]` entry; every `intentBridge.alignments[]` with mismatch; every `voiceIdentity.authenticVsPerformed[]` flagged "performed" without strong evidence; every `admissionsPositioning.redFlags[]` that needs context; every section the synthesis explicitly couldn't ground.
    - L4 northStar: every field where `confidence === 'hypothesis'` and the student has the answer.
    - Findings store: every `Finding` with `maturity === 'hypothesis'` that has been alive ≥ 2 iterations without confirmation.
19. **The `specificsNeedQueue` is materialized as `UnderstandingQuestion` entries with the new source `'analysis_specifics_gap'`.** The existing `QuestionQueueManager` is extended (not replaced) to handle this source. The queue is persistent across iterations and survives session restarts.

### 1.5 Surface composition (post-analysis, pre-render)

20. **The L5 surfaces (per `L5_EXPERIENCE_TARGET.md` §5)** are composed: the lede, the progress strip (iteration ≥ 2), the focus surface (multiplicity-bearing focus items per Move 6), the connection map, the voice anchor, the score accordion (collapsed), the deferred surface, the iteration response (iteration ≥ 2).
21. **The Conversator's question-asking decision** — at the surface composition phase, the Conversator service reads `specificsNeedQueue` (open questions), the current `iterationLedger`, the student's session state, and decides whether to fire a dig question now. **Timing rules** (per Q-A): always fire after first feedback IF queue is non-empty and a 'high' or 'critical' priority question exists; fire between iterations IF the iteration's findings have new `'analysis_specifics_gap'` source questions; fire when the student appears stuck (no edits + no chat for X minutes after reading focus). Otherwise, the queue waits.

### 1.6 Render

22. **Surfaces render to the student.** The lede leads. The focus surface shows. The continuous chat panel is open with the student's prior session log visible.
23. **If a dig question was queued** (per step 21), the Conversator surfaces it as a chat message, framed without leading. Example: "I noticed you described your father's hands stopping in P3 — what specifically were you noticing about them in that moment?" Not "tell me three sensory details" (leading) and not "P3 needs more detail" (un-grounded coaching).

### 1.7 Student engagement loop

24. **The student reads, picks a focus point, and engages.** Per the experience target's journey: they may read-and-move-on, pick a path from Move 6 multiplicity, ask the Conversator a question of their own, or attempt a rewrite.
25. **Continuous chat handles whatever the student asks** — clarifications, "what if I tried [their idea]?", "why does this matter?", "what would [different framing] look like?". The Conversator's continuous-chat handler is *separate from* the dig-question surfacing logic but draws from the same model — both ground responses in citations, in the focus surface state, in the analysis output, in the prior session.
26. **If the student answers a dig question**, the Conversator captures the answer, structures it (per §6 below), persists it as durable state on the profile, and marks the queue question as `student_answered`. The student doesn't see this — they just get a natural acknowledgment in the chat ("got it; that's helpful — I'll come back to it").
27. **If the student rewrites and submits**, we return to step 5 (new iteration triggered).

### 1.8 Iteration boundary

28. **Iteration N completes** — the L5 result is persisted, the `taughtMoves` ledger appends the iteration's annotations, the landing detector queues to run on the *next* iteration, the `iterationLedger.iterations[]` records the cost breakdown and redirected budget. The continuous chat session log persists. The `specificsNeedQueue` retains open questions; resolved and student-answered questions update their status.
29. **Student exits** (closes editor, navigates away). All session state — iteration ledger, taught moves, queue, conversator session log, ground-truth facts — persists. On return, the next iteration picks up from this state.

---

## 2. Per-step ownership, inputs, outputs, failure surface

The integrity audit's central artifact. Each step from §1 gets four columns: **Owner** (which service/layer is the single source of truth for this step), **Inputs** (what the step depends on; gaps flagged with ⚠), **Outputs** (what the step produces; consumers named), **Failure surface** (when this step fails, how does the system know — no fallback, only visibility).

| # | Step | Owner | Inputs | Outputs | Failure surface |
|---|---|---|---|---|---|
| 1 | Student opens editor | client (`AnnotationV2*` page) | route param: essayId | UI mounted | route 404 if essayId invalid; UI loading-state error |
| 2 | Profile load | `essayProfileManager.ts` | essayId, userId | EssayProfile (full, including new IterationLedger, taughtMoves, conversator log, groundTruthFacts) | DB error → fail-fast, surface to UI; missing profile → trigger first-pass flow |
| 3 | Session state init | `essayProfileManager.ts` + `iterationLedger` updater | EssayProfile loaded | currentIteration incremented; recentDecisions pruned | If iterationLedger missing on a returning profile, treat as iteration=1 with reasoning logged; do NOT silently invent a ledger |
| 4 | Continuous chat surface mounts | `ChatPanel.tsx` (existing) + new `EssayConversatorPanel` (TBD) | EssayProfile, conversator session log | UI mounted, prior log visible | Mount error → degraded chat panel, single-line error in panel rather than missing surface |
| 5 | Submission triggers analysis | `analysisOrchestrator.ts` (entry) or `reanalysisOrchestrator.ts` (iter ≥ 2) | essay text, prior profile (iter ≥ 2) | Triggers pipeline run | Submit endpoint failure → user sees error in editor; no silent retry that masks the failure |
| 6 | Mode selection | `focusedAnalyzer.selectAnalysisMode()` | diff, profile state, current iteration | mode: 'focused' \| 'comprehensive' + reasoning | Decision logged to ledger; if mode-selector throws, fail-fast (no default to comprehensive) |
| 7 | L1 firstImpressions | `firstImpressions.ts` | changed paragraph text + paragraph index | `ParagraphFirstImpression` per changed paragraph | Haiku call failure → fail-fast; iteration aborts and surfaces error rather than running downstream against incomplete L1 |
| 8 | L2 cartography | `structuralCartographer.ts` | full essay text + L1 outputs | `StructuralCartography` (carry on no structural change) | Sonnet call failure → fail-fast; if carrying, validate the carried object's schema before proceeding |
| 9 | L2.5 scout | `scoutPass.ts` | full essay text + L1 + L2 | `ConnectionScoutOutput` | Haiku call failure → fail-fast; the scout is the cheapest step, retrying on transient is fine but not silent fallback to "no scout" |
| 10 | L3 walk | `sequentialDeepWalk.ts` | per-changed-paragraph text + prior `paragraphUnderstanding` (carry-forward as context) + L1/L2/L2.5 outputs + connection store | Per-paragraph `UnderstandingWalkOutput` (paragraphUnderstanding, sentenceUnderstandings, holisticEvolution, newConnections, **newFindings with deepeningPotential + raisesQuestions**) | Sonnet failure on any paragraph → fail-fast for that paragraph; iteration aborts with explicit "walk failed on P{n}" rather than continuing with partial walk |
| 11 | L3.75 holistic synthesis (targeted-refresh) | `holisticSynthesis.ts` (extended) | carry-forward synthesis + per-section invalidation flags from edit-understanding service + diff + L3 walk output | Updated synthesis with only flagged sections changed; **gaps[], redFlags[], alignments mismatches contribute to specificsNeedQueue** | Sonnet output validation: every section-mask contract must hold. Bias signal: an unflagged section came back changed = prompt bug, surfaced via diff-against-carry-forward telemetry. NO fallback to per-section calls. |
| 12 | L3.5 analysis pass | `analysisPass.ts` | per-changed-paragraph + L3 walk + carry-forward analysis (unchanged paragraphs) | Per-paragraph `paragraphAnalysis` (effectiveness, verdict, sentenceAnalyses with confidence triple, patternMatches, symptomType); **low-confidence sentence analyses contribute to specificsNeedQueue** | Sonnet failure → fail-fast |
| 13 | improvementPhase assessment | `phaseAssessment.ts` | full updated profile + prior phase | Phase + dimensionPhases + transition state | Sonnet failure → fail-fast |
| 14 | L4 (NS+SM+CM+Coherence) | crystallizer / scoreMatrixAnchors / coherenceConsumer | full profile incl. L3.75 + L3.5 + L2 cartography + improvementPhase | northStar (carry unless invalidated), scoreMatrix (per-paragraph), coachingMap (always re-derive), coherenceReport; **`northStar.confidence === 'hypothesis'` fields contribute to specificsNeedQueue** | Sonnet failure → fail-fast |
| 15 | FindingStore maturity refresh | `findingStore.ts` + `findingPromotion.ts` | findings + diff + new walk output | Updated maturity per finding; supersession set where applicable; **findings stuck at `hypothesis` ≥ 2 iterations contribute to specificsNeedQueue** | Haiku validity check failure on a finding → mark validation `pending`; surface count of pending validations; do NOT default to "claim still holds" (that's a fallback) |
| 16 | L5 deepAnnotation | `deepAnnotationService.ts` | full profile + reanalysisBrief + **priorAnnotations Map (the dead-wire fix, fed from taughtMoves)** + corpus retrieval (when flag on) + improvementPhase coachingLens + carry-forward priorAnnotations | `L5AnnotationResult` (per redesign doc + `L5_EXPERIENCE_TARGET.md` Move 6 multiplicity per focus item) | Sonnet failure → fail-fast per paragraph; orchestrator surfaces "L5 failed on P{n}" |
| 17 | Tier 2 synthesis pass | new `l5TierTwoSynthesizer.ts` (TBD per L5 redesign §4) | all paragraph annotations + L4 coachingMap + corpus ledger + carry-forward state | qualitativeSummary lede; focus surface (sized by essay, redundancy-forbidden); deferred items; **cross-iteration synthesis if iter ≥ 3 with ≥ 2 prior moves landed** | Sonnet failure → fail-fast |
| 18 | SpecificsNeed aggregation | new `specificsNeedAggregator.ts` (TBD) | outputs from steps 10, 12, 14, 11, 15 | `specificsNeedQueue` (open questions, newly added or surfaced) | Aggregator is deterministic; failure mode is missing input from an upstream layer (caught by per-layer fail-fast at step level) |
| 19 | Queue persistence | extended `QuestionQueueManager` | new specifics-need entries from step 18 | UnderstandingQuestion entries persisted; status: `'open'` with new source `'analysis_specifics_gap'` | DB persistence failure → fail-fast |
| 20 | Surface composition | new `l5SurfaceComposer.ts` (TBD) | L5AnnotationResult + Tier 2 output + carry-forward state + iterationLedger + focus + groundTruthFacts | Composed surfaces ready for render | Composition is deterministic post-analysis; failure mode is missing required input (caught upstream) |
| 21 | Conversator dig-question decision | new `essayConversator.ts` (TBD) | specificsNeedQueue (open) + iterationLedger + chat session log + current student state (idle/active) | Decision: `{ fire: bool, questionId?: string, framing?: string }` | LLM call to compose question framing → fail-fast with reason; question stays in queue |
| 22 | Surface render | client UI | composed surfaces | UI rendered | Render error → component-level error boundary surfaces in UI |
| 23 | Dig question surfaced in chat | new `essayConversator.ts` + `ChatPanel` | dig question + framing | Chat message added to log, queue question status `'asked_to_student'`, persisted | Chat persistence failure → fail-fast |
| 24 | Student reads, picks focus, may engage | client | rendered surfaces | student input (focus selection, chat message, edit, rewrite attempt) | UX-level error handling per component |
| 25 | Continuous chat handler | new `essayConversator.ts` (separate handler from dig) | student message + full session context (essay profile, focus state, prior session log, citations) | Conversator response (Sonnet for substantive, Haiku for clarification) | LLM call failure → fail-fast with student-visible "I had trouble responding" + retry button; NO silent fallback to canned responses |
| 26 | Student answers a dig question | new `essayConversator.ts` answer-handler | student message + queued question id | Structured answer (per §6); GroundTruthFact / StoryFragment / IntentSignal record persisted; queue question status `'student_answered'` with `dig.structuredAnswer` populated | LLM extraction failure → mark answer `extraction_pending`; surface to next iteration's analysis with the raw answer text + extraction failure flag, do NOT silently drop the answer |
| 27 | Student submits rewrite → triggers iteration | client + analysisOrchestrator | edited essay text | New iteration triggered (return to step 5) | Submit endpoint failure → student-visible error |
| 28 | Iteration N completes | analysisOrchestrator | full pipeline output + landing detector queue + cost ledger | Persisted profile with new iterationLedger.iterations[N], appended taughtMoves[], updated queue, updated groundTruthFacts | Persistence failure → fail-fast; iteration result NOT considered committed until persistence succeeds |
| 29 | Student exits | client | session state | Profile state persisted; session marked inactive | Persistence failure → fail-fast on close; UI warns "your changes may not be saved" |

### 2.1 Ownership map (services and what they own)

Existing services that own at least one E2E step:

- `essayProfileManager.ts` — steps 2, 3, 28, 29 (profile state lifecycle).
- `analysisOrchestrator.ts` — steps 5, 6, 28 (pipeline orchestration entry).
- `reanalysisOrchestrator.ts` — step 5 on iteration ≥ 2.
- `focusedAnalyzer.ts` — step 6 (mode selection), and the escalation ladder used internally.
- `editUnderstandingService.ts` — step 5 (diff + StalenessEffect).
- `firstImpressions.ts`, `structuralCartographer.ts`, `scoutPass.ts`, `sequentialDeepWalk.ts`, `holisticSynthesis.ts`, `analysisPass.ts`, `phaseAssessment.ts` — steps 7–13 (pipeline layers).
- `crystallizer.ts`, `scoreMatrixAnchors.ts` (and equivalents), `contradictionConsumer.ts` — step 14 (L4).
- `findingStore.ts`, `findingPromotion.ts`, `findingContextBuilder.ts` — step 15.
- `deepAnnotationService.ts` — step 16.
- `questionQueueManager.ts` (existing), `growthEngine.ts`, `deepDiveRunner.ts` — partial coverage of dig infrastructure (used today for L3.75 internal curation, not yet wired to Conversator).
- `chatPersistenceService.ts` (activity workshop precedent) — pattern for step 23, 26, 28 chat persistence on essay-side.
- `coachingService.ts`, `coachingPlanner.ts` — partial coverage; not wired to Conversator-as-asker.

### 2.2 Steps without an existing owner (build-phase scope)

Six steps have no current owner and require new services:

1. **Step 17** — Tier 2 synthesis pass. New file: `analysis/l5TierTwoSynthesizer.ts`.
2. **Step 18** — SpecificsNeed aggregation. New file: `analysis/specificsNeedAggregator.ts`.
3. **Step 20** — Surface composition. New file: `analysis/l5SurfaceComposer.ts`.
4. **Step 21** — Conversator dig-question decision. New file: `conversator/essayConversator.ts` (with a new directory).
5. **Step 25** — Continuous chat handler. Same Conversator service, separate handler method.
6. **Step 26** — Dig answer extraction. Same Conversator service, separate handler method.

Plus extensions to existing services:

- `questionQueueManager.ts` extended with new source `'analysis_specifics_gap'`, new status `'asked_to_student' | 'student_answered' | 'student_declined'`, and `dig: DigContext | null` sub-object on questions.
- `holisticSynthesis.ts` extended with the targeted-refresh prompt variant + section-mask handling.
- `analysisOrchestrator.ts` extended at line 850 with the priorAnnotations builder (the dead-wire fix), at the orchestrator end with iterationLedger commit, with the SpecificsNeed aggregator call between L4 and L5 surface composition.
- `findingStore.ts` extended with the maturity-refresh path that emits specifics-need signals on hypothesis-stuck findings.
- `profileTypes.ts` extended with `IterationLedger`, `TaughtMove`, `CarryForwardDecision`, `DigContext`, `GroundTruthFact`, `StoryFragment`, `IntentSignal` (new types from this audit + the iteration design).

### 2.3 Coverage status

29 steps total. **Built (10):** 1, 2, 5, 6, 7–14 (analysis layers), 16 (L5 generation, but with dead `priorAnnotations`), 22 (UI), 27, 28 (basic persistence). **Partial (8):** 3 (iterationLedger missing from profile), 4 (no essay-side chat panel yet, activity-side precedent only), 15 (FindingStore maturity exists but no specifics-need emission), 18 (some signals exist as findings; no aggregator), 19 (queue exists but lacks dig-source extensions), 23 (chat persistence pattern exists, not on essay side), 24 (UI exists, dig surfacing missing), 29 (persistence works for current profile, doesn't include new state). **Unbuilt (11):** 17, 20, 21, 25, 26, plus the extensions to existing services.

This is the build-phase scope. None of it is small; all of it is grounded in existing patterns or extensions to working primitives.

---

## 3. The SpecificsNeed signal — extension of UnderstandingQuestion

Per Q-B (analysis-driven dig), every layer that produces an analysis output contributes to a structured **specifics-need signal**. We do *not* build a new queue; we extend `UnderstandingQuestion` and `QuestionQueueManager`.

### 3.1 Type extensions (additions to `profileTypes.ts:4261`)

```ts
// Extend UnderstandingQuestion.source
export type UnderstandingQuestionSource =
  | 'walk'
  | 'synthesis'
  | 'deep_dive'
  | 'coaching'
  | 'maturity_gap'
  | 'analysis_specifics_gap';   // NEW — answer requires student input, not text re-investigation

// Extend UnderstandingQuestion.status
export type UnderstandingQuestionStatus =
  | 'open'
  | 'resolved'
  | 'filtered'
  | 'asked_to_student'           // NEW — Conversator surfaced it; awaiting answer
  | 'student_answered'           // NEW — student answered; structured answer attached
  | 'student_declined';          // NEW — student declined to answer; deferred

// New sub-object on questions of source 'analysis_specifics_gap'
export interface DigContext {
  /** Why this dig matters — the analysis layer's reasoning */
  whyAsked: string;
  /** What the analysis layer expects to learn */
  expectedAnswerShape: 'scalar' | 'short_phrase' | 'specific_memory' | 'list' | 'narrative';
  /** What downstream layer(s) will consume the structured answer */
  consumers: Array<'l3' | 'l3_5' | 'l3_75' | 'l4' | 'l5' | 'finding_maturity'>;
  /** What field(s) the structured answer populates */
  populates: string[];           // e.g., ['groundTruthFacts.factsByLocation', 'finding.evidence']
  /** Conversator-facing seed — a non-leading way to phrase the question */
  framingSeed: string;
  /** When asked (ISO timestamp) */
  askedAt?: string;
  /** Conversator chat message ID that surfaced the question */
  conversatorMessageId?: string;
  /** Raw student answer text */
  studentAnswerRaw?: string;
  /** Structured answer extracted by Conversator */
  structuredAnswer?: GroundTruthFact | StoryFragment | IntentSignal | null;
  /** If extraction failed, raw answer + failure reason */
  extractionPending?: {
    rawAnswer: string;
    failureReason: string;
  };
}

// Add to UnderstandingQuestion:
//   dig?: DigContext;                  // populated only on source = 'analysis_specifics_gap'
```

### 3.2 Per-layer contributors

The analysis layers populate specifics-need entries during their existing prompts. Each contributor below is an LLM-judged signal (per LLM-first Rule 1) — the layer prompt is extended to instruct the LLM: *"if a paragraph (or finding, or section) cannot be fully grounded against the essay text alone, and the student's lived experience would resolve it, emit a specifics-need entry naming what you'd ask."*

| Layer | Contributor | Trigger | `expectedAnswerShape` | Consumers | Populates |
|---|---|---|---|---|---|
| L3 walk | `newFindings[]` with `deepeningPotential != null` AND `raisesQuestions[]` non-empty | Walk identifies a finding whose claim can't be deepened from re-reading | `specific_memory` or `narrative` | `finding_maturity`, `l3_75`, `l5` | `finding.evidence[]`, `groundTruthFacts.byLocation` |
| L3.5 analysis | `sentenceAnalyses[].confidence === 'low'` AND `sensitivityNote` names student-side | Sentence's effectiveness depends on a lived-experience anchor not in text | `short_phrase` or `specific_memory` | `l3_5`, `l5` | `groundTruthFacts.byLocation`, `intentSignals.bySentence` |
| L3.75 holistic | `momentEarnednessMap.moments[].gaps[]` | Moment isn't earned; the gaps name what's missing | `specific_memory` or `narrative` | `l3_75`, `l5` | `momentEarnednessMap.moments[].mechanisms` (added), `storyFragments.byMoment` |
| L3.75 holistic | `intentBridge.alignments[]` with mismatch | System read diverges from inferred student intent | `short_phrase` or `narrative` | `l3_75`, `l4`, `l5` | `intentBridge.alignments[]` resolution, `intentSignals.essayLevel` |
| L3.75 holistic | `voiceIdentity.authenticVsPerformed[]` flagged "performed" | Voice flagged performed but evidence is thin | `short_phrase` | `l3_75`, `l5` | `voiceIdentity.authenticVsPerformed[]` confirmation/refutation |
| L3.75 holistic | `admissionsPositioning.redFlags[]` | Red flag identified but its severity depends on context the essay doesn't show | `short_phrase` or `narrative` | `l3_75`, `l4`, `l5` | `admissionsPositioning.redFlags[]` resolution |
| L4 northStar | `confidence === 'hypothesis'` on key fields | northStar is uncertain; student confirmation would lock it | `short_phrase` | `l4`, `l5` | `northStar.confidence`, `northStar.intentBridge` |
| FindingStore | `Finding.maturity === 'hypothesis'` AND `iterationsAlive ≥ 2` | Hypothesis isn't maturing on text alone | `short_phrase` or `specific_memory` | `finding_maturity`, `l3_75`, `l5` | `finding.evidence[]`, finding maturity transition |

The per-layer prompts get a small extension naming the contributor pattern. The aggregator at step 18 collects all emissions, deduplicates against existing open queue questions (by anchor + shape), and merges into `QuestionQueueManager` via the existing `addQuestion` path.

### 3.3 Prioritization

Existing `priority: 'critical' | 'high' | 'medium' | 'low'` (LLM-assigned) carries. The Conversator's dig-decision step (21) reads queue questions in priority order, with `iterationsSurvived` as secondary sort (existing `getOpenQuestions()` logic at `questionQueueManager.ts:38–54`).

### 3.4 Retire conditions

A specifics-need question retires when:
- **`student_answered`**: structured answer captured; downstream consumers populated.
- **`student_declined`**: student declined to answer (e.g., "I don't know" or "skip"); question moves to deferred.
- **`resolved` via re-analysis**: the next iteration's analysis grounds the gap from text alone (e.g., the student's edit added the missing context). Caught by re-detection failure: if the underlying signal that emitted the question is no longer emitted by the corresponding layer in the next iteration, the question can be retired with `resolution: "resolved by edit"`. The combiner LLM in the landing-detector path (iteration design §5.2) handles this signal alongside taught-move landing.
- **`filtered`**: the question turned out not to matter (LLM-judged in queue curation).

### 3.5 Queue persistence

`UnderstandingQuestion[]` already persists on `EssayProfile.questionQueue` per the existing type at profileTypes.ts:2360. The new `dig` sub-object adds storage; storage cost is small (~1KB per question with answer; ~100KB at 100 questions).

### 3.6 Failure surface

- **A layer emits a malformed specifics-need entry** (missing required field): aggregator at step 18 fails-fast on schema validation. The failure surfaces to telemetry as "layer X emitted invalid specifics-need entry"; the iteration completes without that signal but with a visible flag. We do *not* silently drop the entry.
- **The queue has questions but the Conversator's dig-decision step never fires them**: telemetry surfaces "queue has N high-priority open questions; M iterations elapsed without firing." Diagnostic.
- **A question is asked, never answered, and the iteration ends**: question stays `'asked_to_student'`; `iterationsSurvived` increments per existing logic; auto-promoted to `'high'` at 3+ iterations. If the question stays `'asked_to_student'` for 5+ iterations, the queue manager surfaces "question stuck pending" — the Conversator reads this signal and decides whether to re-ask differently or filter.

---

## 4. The Conversator — full design as targeted inquiry agent

A new service at `src/services/essayIntelligence/conversator/`. Three responsibilities, three handlers, one shared session-context loader.

### 4.1 Service shape

```
src/services/essayIntelligence/conversator/
  essayConversator.ts          (entry; dispatch by event type)
  digQuestionComposer.ts       (LLM call: turn DigContext.framingSeed into student-facing question, no leading)
  digAnswerExtractor.ts        (LLM call: structure the student's raw answer into GroundTruthFact / StoryFragment / IntentSignal)
  continuousChatHandler.ts     (LLM call: respond to student-initiated chat with grounded responses)
  conversatorTimingPolicy.ts   (pure logic: when to fire dig questions)
  types.ts                     (ConversatorEvent, ConversatorResponse, etc.)
  conversatorPersistence.ts    (modeled on chatPersistenceService.ts; persists session log)
  prompts/                     (the four prompt templates)
```

### 4.2 Three responsibilities

**(a) Dig-question firing** — at composition phase (step 21) or post-render (step 23 with the question already chosen). Reads `specificsNeedQueue` open questions of source `'analysis_specifics_gap'`, applies timing policy (§4.3), picks the highest-priority appropriate question, composes the framing (LLM, Sonnet, with non-leading rules), surfaces it as a chat message, marks queue question `'asked_to_student'`. Single Sonnet call ~$0.005–$0.01 per question. **No fallback to a canned question** — if the LLM fails to compose, the question stays open and the failure surfaces. We do *not* ship "tell me more about P3" as a backup.

**(b) Continuous chat handling** — when student initiates a message (step 25). The handler reads the message, reads the full session context (essay profile, focus surface state, prior session log, citations), routes between Haiku (clarifications, confirmations) and Sonnet (substantive engagement, "what if I tried X", new context the student offers). Responses are **grounded** — citations from the focus surface, principle names, mechanic structure. **No fallback to canned responses** — if both Haiku and Sonnet fail, the student sees "I had trouble responding" with a retry button; we do not ship a "I'm not sure I understood" placeholder that masks the failure.

**(c) Dig-answer extraction** — when student answers a dig question (step 26). Identifies the answer in the chat thread (the student's message immediately after a `'asked_to_student'` question, or via explicit reply-to-message), runs an LLM extraction against the queued question's `expectedAnswerShape`, populates `dig.structuredAnswer`. **If extraction fails** (the student's answer is too vague, off-topic, or shaped differently than expected), we do *not* fall back to keeping the raw text only and pretending the structured answer landed — we mark `extractionPending` with the failure reason, and the next iteration's analysis layers see both the raw text and the failure flag. The Conversator can then do a *clarification turn* — a follow-up LLM-composed question asking the student for more specifics — but that's a deliberate explicit move, not a silent retry.

### 4.3 Timing policy (`conversatorTimingPolicy.ts`)

Pure logic; no LLM. Reads queue + session state + iteration ledger + student activity:

```
fireDigQuestion(state) {
  if iterationLedger.currentIteration === 1 AND step === 'post_first_render':
    return queue.getOpenAnswerableQuestions().sort by priority ['critical', 'high'][0]

  if state.iterationJustCompleted AND queue has new specifics-need entries
     created this iteration with priority >= 'high':
    return that question

  if state.studentIdleMinutes >= 3 AND state.lastChatMessageMinutes >= 3
     AND state.lastEditMinutes >= 3 AND queue has 'high' priority open:
    return that question

  // Otherwise wait. Queue persists.
  return null
}
```

The timing rules are deliberately conservative — better to wait than to interrupt. The "stuck" detection uses idle time rather than active feature detection (no need to track every keystroke). The **continuous chat** is always available regardless of timing — the student initiates whenever they want; timing only governs Conversator-initiated dig questions.

### 4.4 Question composition rules (`digQuestionComposer.ts`)

The framing seed comes from the analysis layer (e.g., the L3 walk's `raisesQuestions[]` already produces a question — but possibly leading or essay-context-naked). The composer's Sonnet prompt:

```
You are turning an analysis question into a student-facing chat question.

Original analysis-side question (may be leading or technical):
  "{framingSeed}"

Why this matters (analysis-side):
  "{whyAsked}"

The student's essay context:
  Paragraph: {paragraphText}
  Surrounding paragraphs: {neighboringParagraphs}

Compose a chat question that:
- Anchors to a specific moment in the essay text (cite a phrase or sentence the student wrote).
- Asks for {expectedAnswerShape}.
- Does NOT lead — does not suggest the answer, does not name the answer's category, does not signal what "the right answer" looks like.
- Sounds like a curious reader, not a system asking for input.
- Is one or two sentences max.

Output: { framing: string, reasoning: string }
```

Examples of right-shape vs wrong-shape:

**Right** (anchored, non-leading, asks for specific memory): "I noticed you wrote 'his hands stopped' in P3 — what specifically were you noticing about them in that moment?"

**Wrong (leading)**: "What three sensory details did you notice about your father's hands?"
**Wrong (un-anchored)**: "Tell me about your father."
**Wrong (un-grounded coaching prompt)**: "P3 needs more sensory detail."
**Wrong (canned)**: "Can you tell me more about that?"

The right-shape examples are the prompt's few-shot. The wrong-shape examples are the prompt's anti-examples (per LLM-first Rule 4 — quality at the prompt, not at regex post-hoc).

### 4.5 Answer extraction (`digAnswerExtractor.ts`)

The extractor's Sonnet prompt receives:

- The original dig question (with its `expectedAnswerShape` and `populates` fields).
- The student's raw answer text.
- The chat message thread for context (the question, the answer, any clarifying turns).

It produces a structured object matching the expected shape:

```ts
type ExtractedAnswer =
  | { shape: 'scalar'; value: number | string; }
  | { shape: 'short_phrase'; phrase: string; }
  | { shape: 'specific_memory'; memory: { what: string; when?: string; sensoryDetails?: string[]; emotionalRegister?: string; }; }
  | { shape: 'list'; items: string[]; }
  | { shape: 'narrative'; arc: string; sensoryAnchors?: string[]; emotionalThread?: string; };
```

The structured answer feeds into one or more of three durable stores:

```ts
interface GroundTruthFact {
  id: string;
  claim: string;                                  // "5 people on the team, not 50"
  evidence: string[];                             // student's raw statements
  confidence: 'high' | 'medium' | 'low';
  sourceTurn?: string;                            // chat message ID
  /** Where in the essay this fact applies */
  appliesTo?: { paragraph: number; sentence?: number; spanText?: string };
  /** When captured */
  capturedAt: string;
  /** Which dig question this answered */
  digQuestionId?: string;
}

interface StoryFragment {
  id: string;
  fragment: string;                               // raw narrative the student shared
  arc?: string;                                   // student's own framing of it
  sensoryAnchors?: string[];                      // sensory details the student named
  emotionalThread?: string;                       // emotional register
  /** Where this could ground in the essay (LLM-suggested, not student-asserted) */
  potentialAnchorParagraphs: number[];
  capturedAt: string;
  digQuestionId?: string;
}

interface IntentSignal {
  id: string;
  /** What the student says they're trying to do at this point */
  intent: string;
  /** Where the intent applies */
  appliesTo: { paragraph?: number; sentence?: number; essayLevel?: boolean };
  /** Did the system's read align with the stated intent? */
  alignmentWithSystemRead: 'aligned' | 'partial' | 'mismatch';
  capturedAt: string;
  digQuestionId?: string;
}
```

**The store is durable carry-forward** — these records survive iterations; the iteration loop's selective carry-forward treats them as first-class durable state (like Findings). Iteration N+1's analysis layers read them as input.

### 4.6 Persistence shape

Modeled on `activityWorkshop/chat/chatPersistenceService.ts`:

- **Table: `essay_chat_conversations`** — one row per (essayId, profileId), JSONB `conversation_state` field, capped to 50 turns (vs activity's 20; essays warrant longer dialogue history). Schema mirrors activity-side.
- **Table: `essay_ground_truth`** — one row per `GroundTruthFact / StoryFragment / IntentSignal`, with foreign key to essay profile and `digQuestionId` reference.
- **Profile state** — `conversator_session_log` field on EssayProfile with the most recent session's compact log; full log lives in `essay_chat_conversations`.

### 4.7 The continuous-chat handler

Distinct from dig-firing because the student's message can be *anything*:

- A clarifying question about the focus surface → Haiku response with citation.
- A "what if I tried X?" → Sonnet response engaging with X on its own terms; may surface multiplicity options.
- A question about the lede or voice anchor → Sonnet response anchored to the relevant surface.
- A frustration ("this doesn't make sense to me") → Sonnet response that invites the student to name what specifically isn't landing, then engages with that.
- A correction ("actually, that's wrong — it was 5 people, not 50") → captured as a *spontaneous* `GroundTruthFact` even though no dig question prompted it; the Conversator persists the fact and acknowledges it.

The continuous handler reads the same session context the dig handler does, plus the focus surface state, plus the iterationLedger. The router (Haiku vs Sonnet, ~$0.0003 vs ~$0.005 per turn) is its own small Haiku call: "Is this clarification, substantive engagement, or correction-of-fact?"

### 4.8 Failure surface (Conversator-wide)

Every Conversator LLM call has a single visible failure mode: the call failed; surface to the student honestly with a retry option; do not ship a placeholder response that masks the failure. The session log records every failed call; telemetry surfaces failure rates per handler. There is no "Haiku fallback when Sonnet fails" or "canned response when both fail" — those are exactly the fallbacks Tue ruled out.

---

## 5. The Conversator-to-analysis feedback loop

How structured answers from the Conversator become inputs to the next iteration's analysis. This is the seam that makes the dig-and-deepen loop architecturally complete.

### 5.1 Persistence and surfacing

After step 26 (answer extracted), the structured record persists as `GroundTruthFact[]`, `StoryFragment[]`, or `IntentSignal[]` on the profile, plus the queue question's `dig.structuredAnswer` is populated.

### 5.2 Consumption by next iteration

The iteration design's selective carry-forward already specifies that the iteration ledger and findings persist across iterations. The new ground-truth records get the same treatment:

- **`GroundTruthFact[]`** — passed to the L1/L3/L3.5/L5 prompt blocks as a separate cached block ("the student's verified ground truth, as captured during the prior session"). The L5 prompt at deepAnnotationService.ts:1402–1416 already has a precedent (the `addressedByEdit` block); we add a `groundTruthFacts` block parallel to it.
- **`StoryFragment[]`** — passed to L3.75's `momentEarnednessMap` synthesis prompt, where the gaps that triggered the dig now have the student's narrative material to ground against. Also passed to L5 as material for Move 6 multiplicity paths (an exemplar-adjacent option: "the moment you described to us — see [story fragment] — could anchor P3 here, like this:").
- **`IntentSignal[]`** — passed to L4 northStar's intentBridge, where the alignments it computed against system-only inferences now have explicit student-stated intents to align against. Also affects coaching map's framing of what the student is "trying to do."

### 5.3 Carry-forward policy for ground-truth records

- **Default: carry indefinitely.** Ground-truth facts are durable signals; they don't decay between iterations.
- **Invalidation**: only on explicit student correction (e.g., "actually, what I told you before was wrong — it was 5, not 7"). The new fact supersedes the old via the same mechanism findings use (`supersededBy` link on the older fact).
- **Quality test**: on each carry-forward, if the fact's `appliesTo.spanText` no longer appears in the essay (the student edited it out), the fact's `appliesTo` is marked `'paragraph_dropped'`; the fact remains durable but its anchor shows as floating until the student re-anchors it elsewhere or it's deemed obsolete.

### 5.4 Failure surface

- **Ground truth captured but never consumed** (e.g., a fact for P3 is captured but the next iteration's L3 walk doesn't see it because the prompt block isn't wired): telemetry surfaces "ground truth fact #X captured but not consumed by any layer in iteration N+1." Diagnostic.
- **A consumer reads ground truth that was captured in a prior session but is now stale** (e.g., the student edited the relevant span away): handled by §5.3 quality test; the consumer sees the floating-anchor flag and treats it accordingly. No silent staleness.
- **Conversator captures a fact that contradicts the essay** (essay says 50, ground truth says 5): the fact persists; L5 fabrication-guard runs at Tier 3 (per L5 redesign §8.2) and flags the conflict to the student, who decides which is right. We do *not* silently rewrite the essay.

---

## 6. The no-fallback diff — what changes across the prior docs

The user's stance: no fallbacks; system works or fails visibly. Applied to every prior doc.

### 6.1 In `L5_FEEDBACK_REDESIGN.md`

| Location | Current line | After no-fallback stance |
|---|---|---|
| §3.4 (citation kinds) — "If a focus item has no resolvable citation in the ledger, you may still surface it but you must mark it `corpusUnanchored: true`. The system never deletes such items; the UI dims them." | Allows ungrounded focus items with UI dimming as graceful degradation. | **Deleted.** Per `L5_EXPERIENCE_TARGET.md` §7.4 (already overrides this), citation is the system's discipline. If a focus item can't be cited, the system writes its prose more carefully — it does not surface a dimmed UI affordance. The "corpusUnanchored" flag is removed from the schema. |
| §5.2 (corpus limits) — "the LLM may still teach the move; if it does, the system marks the focus item `corpusLimitFlagged: true` and the UI surfaces a 'the corpus suggests this approach has constraints' affordance." | Allows the LLM to override corpus limits and have the UI absorb the violation. | **Reframed.** Corpus limits are cited evidence injected into the prompt; the LLM weighs them. If the LLM still teaches the move *with reasoning that engages the limit*, fine — that's LLM judgment, not a bypass. The `corpusLimitFlagged` UI affordance is deleted; the engagement appears in the focus item's prose. |
| §5.2 (bias guards) — "Output gets routed back to Tier 2 for a single rewrite cycle if any guard triggers; otherwise emit." | Two-pass safety net (Tier 2 retry on bias-guard fail). | **Reframed.** The bias guard's `correctiveInstruction` is injected into the Tier 1 prompt as evidence; the Sonnet weighs it during generation. The Haiku post-gen check is *diagnostic telemetry only* (does the output engage the guard?), not a re-run trigger. If it flags ≥30% of focus items, that's a prompt failure to surface, not to silently retry around. |
| §11.6 (reader-bias self-check) — "If the second run still fails, the focus item ships with a `biasGuardFlagged: true` marker; the UI surfaces a quiet caveat. We never delete LLM output for failing a heuristic check." | UI caveat as the visible safety net. | **Deleted.** The UI caveat is removed; the bias-guard engagement appears in the focus item's prose, written carefully. If the LLM's prose ignores the corrective instruction, the prompt is wrong; we fix it. |
| §11.7 (cost spike) — "we tighten as needed via prompt revision, not via output truncation" | Already the right stance. | Keep. |
| §13 M0 — wire `priorAnnotations` in the live re-analysis path | Was framed as "M0 hygiene." | **Reframed as a build-phase first deliverable**, gated by the design's broader integrity (per §8 of this audit). The wire is fed from `taughtMoves`, not just connected to undefined-fix. |

### 6.2 In `L5_ITERATION_LOOP_DESIGN.md`

| Section | Item | After no-fallback stance |
|---|---|---|
| §4.5 (L3.75 targeted refresh) | "Two L3.75 prompt variants: targeted refresh (iteration default) and full regen (used for first-pass and comprehensive-mode escalation)" | **Reframed.** Two prompts because they answer two different problems (full first-pass vs targeted refresh). The targeted-refresh prompt is *not a fallback to per-section calls when the LLM contaminates unflagged sections* — that fallback is removed. If the prompt fails to honor section masks, that's a prompt bug we fix. |
| §5.3 (asymmetric tolerance) | "Default behavior on `partially_addressed`: acknowledge the progress, deepen rather than repeat." | Keep — this is correct asymmetric design, not a fallback. The `partially_addressed` state is a real intermediate, not a graceful degradation of `addressed`. |
| §5.1 (Signal C) | "This signal is **noisy** and should be a *tiebreaker*, not a primary input. (If the Conversator seam isn't yet wired, the field is `null` and the combiner uses A+B only.)" | **Reframed.** Signal C is part of the system. It's noisy because chat behavior naturally is, not because it's a fallback. The "if not yet wired" framing is removed — the Conversator is part of the build's E2E coverage, not a Wave-2 nice-to-have. Signal C uses the chat session log; if the log is empty for a particular question, the combiner LLM weighs A+B without C, which is normal — not a fallback. |
| §6.3 (arbitration) | "For the few cases where the test is ambiguous … the **arbitration is an LLM judgment**." | Keep — LLM-first per Rule 1. |
| §10 F1 mitigation | "(b) Every Nth iteration (e.g., every 5th), force a full L3.75 voice-section refresh as a backstop." | **Deleted.** The voice register-shift detector runs every iteration on changed paragraphs. If it misses register shifts, that's a detector calibration bug — surfaced via downstream landing detection on voice-tagged moves coming back `unaddressed`. We fix the detector; we do not add a periodic backstop. The remaining mitigations (a) and (c) become the design. |
| §10 F4 mitigation | "(a) `editUnderstandingService` LLM authority; (b) coherenceReport contradictions catch; (c) Finding maturity refresh catches anchor-touched claims." | **Reframed.** Single owner: `editUnderstandingService` makes the cascade-scope call. Layers (b) and (c) are *not parallel safety nets* — they are independent signals that each contribute to landing detection / re-analysis. If `editUnderstandingService` makes the wrong call (cascade-scope under-estimated), the failure surfaces visibly through downstream contradiction detection or finding-maturity drift, telemetry surfaces it, we fix the editUnderstandingService prompt. |
| §10 F8 mitigation | "(b) The IterationLedger records actual spend; if observed vs. expected drift >25% over 5 iterations, the orchestrator alerts and re-calibrates." | Keep — this is monitoring, not fallback. |
| §11 Q2 (Conversator timeline) | "Wave-2 enhancement" | **Decision changed:** Conversator is part of the E2E build, not Wave-2. Updated per Tue's stance. Q2 is closed. |
| §11 Q3 (voice backstop interval) | Q3 asks about the interval | **Question retired** along with the backstop. The detector either works or gets fixed. |

### 6.3 In `L5_CONSUMPTION_AUDIT.md`

| Row | Item | After no-fallback stance |
|---|---|---|
| Row 240 (groundingQuality) | "cut — diagnostic only, coaching never reads it" | Keep cut — it was a diagnostic, never load-bearing. |
| Row 248 (`buildSharedContext` dead code) | Already on Phase 6b deletion queue. | Keep cut — dead code, not fallback. |
| Row 250 (cross-paragraph synthesis) | "cut — Tier 2 synthesis subsumes" | Keep cut. The replacement is a deliberate architecture (Tier 2), not a fallback. |
| New rows | The audit gains rows for IterationLedger / TaughtMove / DigContext / GroundTruthFact / StoryFragment / IntentSignal — all `keep` (new state, all consumed). | Add per §7 of this audit. |

### 6.4 In `L5_EXPERIENCE_TARGET.md`

The experience target's principles already aligned with the no-fallback stance (non-negotiable #8 — zero leak of internal state — implies no UI fallbacks for system failures). Two updates:

- **§5.10 (Conversator seam)** — currently says "leaves the L6 design out of scope." **Updated:** the Conversator design is in `L5_E2E_INTEGRITY_AUDIT.md` §4. The experience target's contract on the Conversator: it is the medium for the seven teaching moves (especially Move 5 connection, Move 6 multiplicity exploration, Move 7 contribution clarification), it surfaces dig questions analysis layers ask for, it captures answers as durable carry-forward.
- **§6 (selective carry-forward placeholder)** — replace with the carry-forward summary referencing `L5_ITERATION_LOOP_DESIGN.md` and the fact that ground-truth records are durable carry-forward (see §5.3 of this audit).

---

## 7. Coverage gap list (build phase scope)

Every step where ownership, inputs, outputs, or failure surface is undefined OR depends on infrastructure not yet built. Each item below is a build-phase deliverable.

### 7.1 New types on EssayProfile (`profileTypes.ts` extensions)

1. `IterationLedger` (per iteration design §7.1).
2. `TaughtMove` (per iteration design §7.1).
3. `CarryForwardDecision` (per iteration design §7.1).
4. `DigContext` sub-object on `UnderstandingQuestion` (per §3.1 of this audit).
5. `UnderstandingQuestionSource` extended with `'analysis_specifics_gap'`.
6. `UnderstandingQuestionStatus` extended with three new states.
7. `GroundTruthFact`, `StoryFragment`, `IntentSignal` (per §4.5 of this audit).
8. `EssayProfile` root extensions: `iterationLedger: IterationLedger`, `taughtMoves: TaughtMove[]`, `groundTruthFacts: GroundTruthFact[]`, `storyFragments: StoryFragment[]`, `intentSignals: IntentSignal[]`, `conversatorSessionLog: ConversatorSessionEntry[]`.

### 7.2 New services

9. `analysis/l5TierTwoSynthesizer.ts` (Tier 2 synthesis pass).
10. `analysis/specificsNeedAggregator.ts` (collects per-layer signals into queue).
11. `analysis/l5SurfaceComposer.ts` (composes the experience target's surfaces).
12. `conversator/essayConversator.ts` + sub-files (full Conversator service per §4 of this audit).
13. `conversator/conversatorPersistence.ts` (modeled on activity-side precedent).

### 7.3 Extensions to existing services

14. `analysisOrchestrator.ts:850` priorAnnotations builder fed from taughtMoves (the dead-wire fix).
15. `analysisOrchestrator.ts` end: iterationLedger commit, specifics-need aggregator call, surface composer call.
16. `holisticSynthesis.ts`: targeted-refresh prompt variant + section-mask handling.
17. `findingStore.ts`: maturity-refresh path that emits specifics-need signals.
18. `questionQueueManager.ts`: handle new source `'analysis_specifics_gap'` and new statuses.
19. Each layer's prompt: extension instructing it to emit specifics-need entries when the LLM judges the gap requires student input.

### 7.4 Database

20. New table: `essay_chat_conversations` (per §4.6, modeled on `activity_chat_conversations`).
21. New table: `essay_ground_truth` (per §4.6).
22. Migrations to add the new fields to the EssayProfile JSONB.

### 7.5 UI

23. New `EssayConversatorPanel` component (the continuous chat surface).
24. Surface components for the experience target's ten surfaces (lede, focus surface with multiplicity, connection map, voice anchor, etc.) — partially covered by the existing `annotation-v2-engine` work but not yet specified against the experience target.

### 7.6 Test fixtures

25. End-to-end fixture: an essay where the analysis layers emit at least one specifics-need entry per layer; the Conversator dig-fires; the student answers; the next iteration's analysis consumes the structured answer.
26. Failure-surface fixture: every step has a fail-fast path tested. Specifically: L3.75 targeted-refresh prompt-bug detection (an unflagged section comes back changed); priorAnnotations builder index-remapping on structural reorder (F7); ground-truth-fact contradicting the essay (Tier 3 fabrication guard).

### 7.7 Telemetry and observability

27. Every step's failure surface needs a telemetry hook. Today's pipeline has token tracking; it needs failure-mode tracking per step (which step failed, with what reason, in which iteration). This is the visibility that replaces every removed fallback.

### 7.8 Open architectural calls (not gaps, but decisions)

28. Should `EssayConversatorPanel` mount in every essay editor view, or only in a dedicated "feedback" mode? Per Q-A, continuous chat is always available — so the answer is the editor view, but UX layout calls remain.
29. The continuous chat handler's Haiku-vs-Sonnet router (per §4.7) is its own small Haiku call. Cost is small (~$0.0003/turn). Confirm acceptable. No fallback if the router fails — fail-fast.

---

## 8. Build-phase ordering with E2E coverage as gate

The user's stance: don't consolidate prematurely; check we have E2E coverage. Build phase order:

### Phase 0 — type and schema foundations (1–2 days, no LLM cost)

- [Item 1–8] Add the new types to `profileTypes.ts`.
- [Item 18, 5–6] Extend `UnderstandingQuestion` source + status, add `DigContext`.
- [Item 20–22] Migrations for the new tables and the new EssayProfile fields.
- [Item 27] Telemetry hook scaffolding.

Outcome: schema-level support for everything that follows. Nothing user-facing yet.

### Phase 1 — the dead-wire fix and iteration ledger (3–5 days)

- [Item 14] `priorAnnotations` builder fed from `taughtMoves`. Requires `taughtMoves[]` to populate, so this phase also includes the `taughtMoves` append after every L5 call.
- [Item 15] Iteration ledger commit at orchestrator end.
- Landing detector for taught moves (per iteration design §5).

Outcome: the iteration loop's center starts working. Iteration N's L5 reads what iteration N-1 taught with landing status. **Visible improvement: no more verbatim repetition across iterations.**

### Phase 2 — specifics-need aggregator and the queue extension (3–4 days)

- [Item 19] Extend each layer's prompt to emit specifics-need entries.
- [Item 10] `specificsNeedAggregator.ts`.
- [Item 18] Queue extension to handle new source + statuses.
- [Item 17] FindingStore maturity emission path.

Outcome: the queue accumulates real specifics-need entries from every layer. Not yet surfaced — the Conversator isn't wired.

### Phase 3 — Conversator (5–7 days)

- [Item 12] `essayConversator.ts` + sub-files.
- [Item 13] Conversator persistence.
- [Item 23] `EssayConversatorPanel` UI component.
- All four prompts (dig composer, dig answer extractor, continuous chat handler, router).

Outcome: the continuous chat surface is live. Dig questions fire per timing policy. Answers are captured and structured. Ground-truth / story-fragments / intent-signals persist.

### Phase 4 — L3.75 targeted-refresh + Tier 2 synthesis + surface composer (5–7 days)

- [Item 16] L3.75 targeted-refresh prompt and section-mask handling.
- [Item 9] `l5TierTwoSynthesizer.ts`.
- [Item 11] `l5SurfaceComposer.ts`.

Outcome: full experience-target surfaces composed. Cost optimization from §4.5 of iteration design lands. Net cost per essay should hold or beat baseline despite added Conversator and Tier 2.

### Phase 5 — UI surfaces (5–8 days, frontend)

- [Item 24] Surface components matching the experience target.
- Mode toggles, multiplicity rendering, connection map visualization.

Outcome: end-to-end experience target visible to the student.

### Phase 6 — calibration and shadow A/B (per L5 redesign §13 M6/M7)

- 14-essay calibration A/B (per cost-budget memory: must ask Tue for explicit approval, ~$6.30 over the $5/run cap).
- Shadow on 5% production traffic for 7 days.
- Flip the flag.

Outcome: the redesign is live.

### What gates each phase

- **Phase 0 → 1**: types stable, migrations applied, telemetry surfacing.
- **Phase 1 → 2**: dead-wire fix proven E2E on at least one essay; ledger commits idempotent across iterations.
- **Phase 2 → 3**: queue accumulates and surfaces in telemetry; per-layer emission validated.
- **Phase 3 → 4**: dig question E2E demo: question fires, student answers in chat, structured answer captured, persisted.
- **Phase 4 → 5**: full surface composition E2E with targeted-refresh L3.75 honoring section masks.
- **Phase 5 → 6**: experience target's eight non-negotiables verified on dogfood essays.

---

## 9. Open questions for Tue (after sign-off, before phase-1 build)

Real product / architectural calls left after the no-fallback stance and Q-A/Q-B decisions. Not blocking the audit's sign-off, but blocking specific phases.

### Q1. Conversator panel UI placement.

The `EssayConversatorPanel` is always-available per Q-A. Three placements: (a) right rail of the editor view (always visible); (b) bottom drawer that defaults open; (c) floating widget the student can dock or detach. Each affects how often the student engages with the chat. **Decision needed before Phase 5.**

### Q2. Dig question first-fire timing.

Per §4.3, dig fires "after first feedback IF queue is non-empty AND a high/critical priority question exists." Open: should the system wait until the student finishes reading the focus surface before firing? Or fire immediately on render, while the student is orienting? **Decision needed before Phase 3.**

### Q3. Continuous chat router cost.

§4.7 specifies a Haiku router (~$0.0003/turn) for Haiku-vs-Sonnet decisions. Alternative: skip the router, always use Sonnet (~$0.005/turn for what would have been Haiku-class clarifications). Net delta per session: depends on chat volume. The router is the right architecture but adds a small dependency and a small failure surface. **Decision needed before Phase 3.**

### Q4. Ground-truth-fact contradicts essay — UI affordance.

Per §5.4, when ground truth contradicts the essay, the L5 fabrication-guard flags the conflict to the student who decides which is right. Open: how to surface this — inline in the focus surface ("you told us X; the essay says Y; which is right?"), in the chat ("I noticed a conflict — can you confirm?"), or both? Inline is more visible; chat is more conversational. **Decision needed before Phase 5.**

### Q5. Specifics-need queue size cap.

The queue is persistent and `iterationsSurvived` is tracked. Long-running essay sessions could accumulate hundreds of specifics-need entries. Open: cap the open queue at 50 active questions (filtering older `medium`/`low` ones to `filtered` status), or trust the auto-promotion + LLM curation? **Decision needed before Phase 2.**

### Q6. Conversator session log storage horizon.

Active session log lives in `essay_chat_conversations.conversation_state` (capped at 50 turns per §4.6). Long-term: do we keep the full history, or only the last N turns + a summary? **Decision needed before Phase 3.**

### Q7. The "stuck student" idle threshold.

§4.3 specifies 3 minutes as the "stuck" idle threshold for firing dig questions. Reasonable starting point; open whether to tune up (less interruption) or down (more proactive). **Decision needed before Phase 3, easy to tune post-launch.**

### Q8. Should the Conversator's continuous-chat handler be allowed to call into the analysis pipeline?

Example: student asks "what would my essay look like in archetype X?" The handler could either answer from the existing analysis output (cheap, grounded only in what we already know) or trigger a small focused-analysis call to re-read the essay through that archetype lens (expensive, more grounded). **Decision needed before Phase 3.**

---

## 10. What this audit does NOT do

- It does not write code. Phase 0 implementation is the build-phase first deliverable.
- It does not consolidate the four documents (experience target, iteration design, audit, this E2E integrity audit). The consolidation is a separate pass after the no-fallback diff is applied to the three prior docs and the open questions in §9 are closed.
- It does not specify the L5 prompt extensions in detail (the per-layer specifics-need emission instructions). Those live in the implementation phase, against the prompt examples in this audit's §3 and §4.
- It does not decide the redirection-fraction or confidence-floor calibration tunings post-launch. Those are post-launch with iterationLedger telemetry as the data source.

---

## 11. Closing principle

The system has a single discipline: **work, or fail visibly**. The Conversator asks for what the analysis layers need; the analysis layers consume what the Conversator brings back; the iteration loop carries forward what was effective and re-derives what wasn't; every step has one owner, one input contract, one output contract, one failure surface. There are no parallel mechanisms covering each other, no UI affordances dimming what the system couldn't ground, no canned fallbacks masking call failures, no graceful degradation paths that turn bugs into invisible drift.

When something doesn't work, the failure surfaces — to telemetry, to the student honestly when the student is affected, to the next iteration's analysis as a flag. We see the failure, we diagnose the cause, we fix the source. That's how we get the system right.
