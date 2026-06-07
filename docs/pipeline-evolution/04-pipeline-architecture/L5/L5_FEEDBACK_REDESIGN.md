# L5 Feedback Layer — Redesign

> **Plan only.** No code. No commits. The output of this document is the contract that the build phase will execute against.
>
> **[NOTE — L3.75 absorption applies (Phase 0 D-0.18 R-2 supersession). Per [`L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md) (APPROVED 2026-04-25), the L3.75 layer is being retired and its work absorbed into L3 lenses (Voice / Meaning / Story / Admissions) + L3 Pass 3 + L3.5 (contradictionFlags, essayStrengthSignatures) + L4b (pairedImprovement). References below to "L3.75 fields" — voiceIdentity, voiceMap, thematicArchitecture, narrativeStrategy, admissionsPositioning, characterRevelation, craftAssessment.* sub-fields, momentEarnednessMap, entanglements, emotionalTopography — still exist; their layer-of-origin changes. Specifically: §1.2 input contract treats voice / theme / narrative / craft fields as L3 lens emissions; §2 signal inventory rows that cite L3.75 are re-attributed per the lens-ownership table; §11.2 failure mode "L3.75 partial output" maps to "an L3 lens output missing or Pass 3 missing" with single-owner-with-visible-failure semantics. See the per-mechanism re-mapping table at [`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`](../cross-cutting/L5_AND_MASTER_RECONCILIATION.md) §R-2.]**

## Prologue: a correction to the brief

The redesign brief opened with: *"L5 is the weakest link — a 159-line manifest merger that ignores the depth of upstream layers."* That premise is **incorrect on the headline claim**, and the correction reshapes the entire redesign mandate.

The 159-line file (`src/services/essayIntelligence/analysis/l5ManifestMerger.ts`) is **post-L5 plumbing**, not L5. It merges already-generated L5 output into the `ImprovementManifest` so the coaching layer (L6) can read essay-specific rewrites instead of research-DB boilerplate. It is one short, well-bounded function.

The actual L5 generator is `src/services/essayIntelligence/analysis/deepAnnotationService.ts` (2,340 lines, `wc -l` confirmed). It already does most of what the brief assumed it didn't:

| Brief assumed missing | Today's reality (file:line) |
|---|---|
| Phase awareness | `PHASE_GUIDANCE` record at deepAnnotationService.ts:82–117, soft-guidance LLM-first, all five phases (`foundation` → `distinction`). |
| Corpus attribution / `[MOVE-#]` resolution | Corpus retrieval wired behind feature flag `ENABLE_CORPUS_RETRIEVAL_L5` at deepAnnotationService.ts:548–562. Telemetry persisted (`corpusTelemetryPersistence.ts`). Fabrication scan at deepAnnotationService.ts:807–823. |
| Sentence-level evidence binding | `L5Annotation.location` (paragraphIndex + sentenceIndex + spanText) validated against paragraph text at deepAnnotationService.ts:1988–2012. |
| North Star transformation | Mandated by system prompt; `northStarConnection` field on every annotation; grounding diagnostic at deepAnnotationService.ts:644–668. |
| Stakes / AO framing | `L5Annotation.stakes` (Scope 1 GAP-5) at deepAnnotationService.ts:187, target 70–90% coverage on non-pure-strength annotations. |
| ACTION-mode rewrites | `rewriteExample` REQUIRED for ACTION mode, validated at deepAnnotationService.ts:1966–1985. |
| Cross-paragraph synthesis | Dedicated cross-paragraph LLM call at deepAnnotationService.ts:728–753. |
| Prompt caching | 3-block cache split (system+phase, shared context+corpus, per-paragraph) at deepAnnotationService.ts:1830–1850. |
| Re-analysis brief integration | `reanalysisBrief` + `priorAnnotations` injected at deepAnnotationService.ts:537, 588. |
| Profile router integration | Dedicated `l5_feedback_annotations` routing rule with 8K budget at profileRouter.ts:1000–1074, the **largest** budget of any rule. |

Treating L5 as "broken" or "underspecified" would have us replace strong existing behavior. The genuine redesign mandate is narrower and sharper, and this document re-frames it accordingly:

> L5 today is a **phase-aware, evidence-bound, North-Star-grounded annotator** that emits ephemeral feedback with optional corpus retrieval. What it lacks is **(a) explicit citation resolution from upstream attribution into student-readable teaching, (b) a coaching-mode output shape distinct from the rewrite-mode shape it always emits today, (c) ruthless top-N ranking and surfacing, (d) qualitative score reframing, (e) student-facing exposure of the corpus assets that already sit in L3.5's prompt context, and (f) a few small but consequential signal pipings (`[AP-#]` resolution, `patternId` resolution, voice×archetype refusal, corpus-limit silencing).** The 159-line merger is fine. The merger is not the problem; L5's output contract is.

Everything below is grounded against that corrected premise.

---

## 1. Current-state forensic

### 1.1 The two L5 surfaces

Two files form the L5 surface today:

1. **`deepAnnotationService.ts` (2,340 lines)** — the generator. Phase 6 of the orchestrator (analysisOrchestrator.ts:14, 844–853). Produces `L5AnnotationResult`. Ephemeral by design — never persisted to the profile.
2. **`l5ManifestMerger.ts` (159 lines)** — the plumbing. Runs immediately after the manifest is built (analysisOrchestrator.ts:71, 920). Merges `rewriteExample`, `transferablePrinciple`, `stakes`, `wordEconomyCut` into matching `ImprovementEntry` items. Non-destructive (every merge is null-gated, l5ManifestMerger.ts:31–34).

### 1.2 Input contract (today)

L5 reads the **complete `EssayProfile`** (Understanding + Analysis + North Star populated). The profile router rule `l5_feedback_annotations` (profileRouter.ts:1000–1074) explicitly returns *no filtering* — full holistic, full North Star, every paragraph's understanding and analysis, every connection, all priority `'always'`. 8K budget.

Specifically, L5 consumes (line citations are profileTypes.ts unless noted):

- `essay.understanding`, `paragraphs[].understanding` (sentence-level walk output)
- `voiceIdentity`, `voiceMap`, `emotionalTopography`, `momentEarnednessMap`, `thematicArchitecture`, `narrativeStrategy`, `characterRevelation`, `craftAssessment`, `entanglements`, `admissionsPositioning` (the L3.75 ten-section synthesis at types ~875–1500)
- `northStar` (1376) — `throughLineMap`, `structuralRolesMap`, `trajectory`, `distinctivenessSignature`, `intentBridge`, `confidence`
- `scoreMatrix.coachingMap` (2602) — `transformativeInsight`, `priorities[]`, `protectedStrengths`, `emergentPatterns`, `scoreTensions` (NOW LIVE post-Phase 6a; previously dead-coded via `buildSharedContext()` at deepAnnotationService.ts:1097–1250 — kept as dead code, slated for Phase 6b deletion)
- `scoreMatrix.crossParagraphPatterns` (2499)
- `paragraphs[].analysis` per-sentence effectiveness, strengths, weaknesses, `priorityForImprovement`, `confidence` (3804–3814)
- `improvementPhase` with `coachingLens` (1858, 1890) — the 2–4-sentence directive that injects directly into L5/L6 prompts
- Optional re-analysis: `reanalysisBrief`, `priorAnnotations`, `contradictionFlags`
- Optional growth: `growthReadingStrategy`, `candidateStoreForL5` (Phase 6a candidate lineage)
- Optional findings: `FindingStore` via `findingContextBuilder` (deepAnnotationService.ts:1830)
- Optional corpus: anchor moves retrieved if `ENABLE_CORPUS_RETRIEVAL_L5=true` (deepAnnotationService.ts:548–562)

### 1.3 Output contract (today)

`L5AnnotationResult` (deepAnnotationService.ts:294–311):

```ts
{
  paragraphAnnotations: ParagraphAnnotations[];      // grouped per paragraph
  essayLevelAnnotations: L5Annotation[];             // foundation/distinction phases
  crossParagraphAnnotations: L5Annotation[];         // span-multiple patterns (separate LLM call)
  phase: ImprovementPhaseLevel;
  annotationCount: number;
  densityDiagnostics: AnnotationDensityDiagnostic[];
  cost: number;
  tokenUsage: { inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens };
  timingMs: number;
}
```

Each `L5Annotation` (deepAnnotationService.ts:130–277) carries 22 fields. The load-bearing ones the manifest merger reads:

- `location.{paragraphIndex,sentenceIndex,spanText}` — anchor + text-span validated against paragraph
- `type` — routing taxonomy: `strength | growth | structural | teaching`
- `teachingMode` — LLM-selected per annotation: `awareness | consequence | connection | action`
- `teachingIntent` — free-text intent (NOT enum-constrained; LLM-first compliant)
- `content`, `teachingRationale`, `northStarConnection`
- `stakes` — AO-framed phenomenological impact (Scope 1 GAP-5)
- `priority: 1–5` — LLM-assigned coaching value
- `phase: ImprovementPhaseLevel` — natural belonging
- `rewriteExample` — REQUIRED for ACTION mode (Scope 1 GAP-6 hardened)
- `wordEconomyCut`, `antiPatternExample`, `transferablePrinciple` (post-call match), `confidence`, `crossParagraphRefs`, `capacityBuildingNote`, `groundingQuality` (diagnostic only)

The merger then funnels four of these into `ImprovementEntry`:

| L5 field | Manifest field | Guard |
|---|---|---|
| `rewriteExample` | `essaySpecificDemo` | always fill if present |
| `rewriteExample` | `demonstration` (legacy) | null-check |
| `transferablePrinciple` | `technique` | null-check |
| `stakes` | `stakes` | thin-stakes check (empty or `Evidence:` prefix) |
| `wordEconomyCut` | `wordEconomyCut` | null-check |

### 1.4 Generation architecture (today)

- **3-block prompt cache** (deepAnnotationService.ts:1830–1850):
  - Block 1 (cached, system+phase): system prompt + PHASE_GUIDANCE + reading strategy
  - Block 2 (cached across paragraphs, shared): smart digest (~1.8K tokens) + coachingMap + cross-paragraph patterns + reanalysisBrief + contradiction flags + corpus moves (if flag on)
  - Block 3 (not cached, per-paragraph): paragraph text + role + analysis summary + finding context + pre-call enrichment
- **Parallel paragraph calls** in batches of 2 (deepAnnotationService.ts:566–594, `L5_BATCH_SIZE=2`); `Promise.allSettled` with fail-fast (deepAnnotationService.ts:606–642)
- **Cross-paragraph synthesis call** after per-paragraph (deepAnnotationService.ts:728–753) — separate Sonnet call to identify span-multiple patterns
- **Post-call deterministic passes** (zero LLM cost):
  - Multi-signal `transferablePrinciple` matching (deepAnnotationService.ts:670–710)
  - `groundingQuality` diagnostic (deepAnnotationService.ts:644–668; non-destructive)
  - Corpus attribution detection + fabrication scan (deepAnnotationService.ts:807–823)
- **Density diagnostics** (deepAnnotationService.ts:755–782): logged, not persisted, no consumer

### 1.5 Cost (today)

Per the orchestrator's measured spend and the 3-block cache:
- Per-paragraph: ~500–700 input tokens (cache reads) + ~300–400 output tokens ≈ **$0.015–0.025**
- Cross-paragraph synthesis: ~$0.01
- Total per essay: **$0.10 (foundation/architecture) → $0.25–0.50 (craft/polish/distinction)**
- Caching saves ~$0.05–0.10 on a 10-paragraph essay

### 1.6 Wider loop

- **Before L5**: L1 → L2 + L2.5 → L3 → L3.75 → L3.5 → L4. North Star + score matrix + coaching map + improvement phase all populated.
- **After L5**: manifest build → `mergeL5IntoManifest` (analysisOrchestrator.ts:920) → `researchEnrichment.ts` fills remaining null fields with research-DB boilerplate → checkpoint persist → return.
- **L6 (Conversator) consumption**: L6 reads `manifest.items[]` — the **merged** manifest, not raw `L5AnnotationResult`. L5 output is ephemeral; only the manifest persists. (Verified: `profile.improvementManifest = manifest` at orchestrator:939; `l5Result` returned in result, not stored.)
- **UI**: components in `src/components/annotation-v2/` and `src/components/annotation-v2-engine/` render projected `Annotation` types. Most fields come from `ImprovementEntry`; `essaySpecificDemo`, `stakes`, `technique` are the high-value paths into the UI.
- **Re-analysis**: focusedAnalyzer re-runs L5 fresh against the updated profile with `reanalysisBrief` + (eventually) `priorAnnotations` (today wired only when explicitly threaded; `analysisOrchestrator.ts:850` passes `undefined`).

### 1.7 Load-bearing vs accidental

**Load-bearing — must be preserved by any redesign (with consumer):**

| Behavior | Why | Consumer |
|---|---|---|
| 3-block prompt cache | ~30–40% cost reduction on multi-paragraph essays | All paragraph calls |
| Parallel batched paragraph calls | 5-paragraph essay completes in ~15–20s | UX latency |
| Fail-fast on parse errors | No silent degradation, no fake annotations shipped | Orchestrator catch + telemetry |
| ACTION-mode `rewriteExample` REQUIRED | No "sorry I can't" annotations leak through | Manifest merger, UI |
| `northStarConnection` mandated + grounding diagnostic | The differentiator that makes feedback structural, not cosmetic | Coaching framing |
| Post-call `transferablePrinciple` matching | Multi-signal, deterministic, free | Manifest `technique` field |
| Non-destructive merger | Idempotent across multi-session coaching | Manifest |
| Cross-paragraph synthesis call | Catches patterns no single paragraph can see | Top-priority annotations |
| Corpus moves injected once per essay | Cached across all paragraph calls | Token economics |
| Ephemerality (no profile write) | Avoids stale annotations leaking into future runs | Re-analysis correctness |

**Accidental — discardable:**

- `groundingQuality` field on every annotation (diagnostic; coaching never reads it)
- `densityDiagnostics` array (logged, no downstream consumer)
- Dead code path `buildSharedContext()` at deepAnnotationService.ts:1097–1250 (Phase 6a fix bypassed it; Phase 6b deletes it)
- Unwired `priorAnnotations` in live path (orchestrator:850 passes `undefined` outside re-analysis)

### 1.8 What L5 is *not* doing today (the real gap surface)

Confirmed by grep + read of deepAnnotationService.ts and the corpus retrieval glue:

| Missing capability | Upstream signal exists at | L5 emission today |
|---|---|---|
| `[AP-#]` resolution into student-facing teaching | `corpusRetrievalBlocks.ts:469–476` emits anti-pattern blocks into L3.5 | No `[AP-#]` scanning in L5 corpus detection (only `[MOVE-#]` at deepAnnotationService.ts:807–823). No anti-pattern context injected into L5 prompt. |
| `patternId` resolution into student teaching | L3.5 emits `patternId` validated against `PATTERN_INDEX` (analysisPass.ts:1619–1630), 75 patterns in `taxonomies/issuePatternIndex.ts` | L5 has no resolver; the `PATTERN_INDEX` lookup happens at L3.5 for validation only. |
| Coaching mode (questions + principles + corpus exemplars, student writes) vs rewrite mode (current) | None — feature does not exist | All annotations are rewrite-shaped. ACTION mode forces `rewriteExample`. |
| Top-N Focus-Mode ranking and surfacing | Ranking implicit in `priority` 1–5 + `priorityForImprovement` + L4 `coachingMap.priorities[]` | Nothing surfaces "the top three; the rest are deferred." UI / L6 see flat list. |
| Qualitative score reframing | Score matrix at L4 + per-sentence effectiveness | UI shows numeric scores; no system-emitted qualitative narrative ("your opening hooks much harder now") tied to score deltas. |
| Calibration few-shot retrieval ("band 70 looks like X; band 80 looks like Y") | `moveExcerpts.ts` has 53 anchored excerpts, anchorLevel-tagged; calibration corpus exists at `tests/calibration/top-tier-reference/ratings/` | No retrieval trigger from L5; `MOVE_EXCERPTS` not consulted from L5. |
| Voice × archetype refusal as cited evidence | `voiceArchetypeCompatibility.ts` 98-cell matrix with `forbidden`/`risky`/`reachable`/`native` and `rationale` | Not consulted at L5. |
| Corpus limits silencing | `corpusLimits.ts` 18 conditions (verified, not 53) with `cannotTeachWhen` + `detectionGuidance` | Not consulted at L5. |
| Reader-bias self-check | `readerBiasGuards.ts` 14 guards (verified) with `correctiveInstruction` and `appliesTo: PipelineLayer[]` including `'L5'` | Not consulted at L5. |
| School-fit framing on demand | `schoolFitVectors.ts` 95 records / 15 schools | Never retrieved at L5. |
| Inline-editor command shape (`replace-phrase`, etc.) | `WRITING_IMPROVEMENT_ROADMAP.md:701–721` defines the contract | L5 emits prose `rewriteExample`; no command format. |
| Voice profile injection | `WRITING_IMPROVEMENT_ROADMAP.md:88–206` voice profile | Not threaded into L5 prompt. |
| Story mining seeds | `WRITING_IMPROVEMENT_ROADMAP.md:231–310` story seeds | Not threaded. |
| Authenticity post-check | `WRITING_IMPROVEMENT_ROADMAP.md:824–866` AIRiskScorer (Haiku, ~50ms) | Not run on L5 output. |
| Conversator ground-truth conflict surfacing | Conversator side in flight | Seam unspecified; L5 cannot detect "essay says 50, ground truth is 5." |

These are the redesign's actual scope.

---

## 2. Signal inventory (what L5 could consume)

The full inventory is in the upstream-investigation report and totals 80+ rows. Compressed table; **bold = must be consumed by new L5; italic = currently dropped or underused**.

| Source | Field | Defined at | Consumed today | Verdict |
|---|---|---|---|---|
| L3 walk | `walkOutputs[].sentenceUnderstandings[]` | profileTypes.ts:3606 | yes (via shared digest) | keep |
| L3 walk | `walkOutputs[].newConnections` | profileTypes.ts:~3646 | yes | keep |
| L3 walk | *`walkOutputs[].newFindings` (W1.3)* | profileTypes.ts:3661 | partial | **promote to citation handle [F-#]** |
| L3 walk | `holisticEvolution` | profileTypes.ts:139 | partial | use only for re-analysis delta cues |
| L3.75 | `voiceIdentity`, `voiceMap` | ~875, ~968 | yes | **expose to UI as "voice anchor"** |
| L3.75 | `emotionalTopography`, `momentEarnednessMap` | ~1100, ~1150 | yes | keep |
| L3.75 | `thematicArchitecture`, `narrativeStrategy`, `characterRevelation` | ~1200, ~1280, ~1350 | yes | keep |
| L3.75 | `craftAssessment` | ~1400 | yes | **drives Polish/Distinction phase content** |
| L3.75 | `entanglements` | ~1450 | yes | **promote: cross-dimension teaching seeds** |
| L3.75 | `admissionsPositioning.archetypeContext` | ~1500 | yes (drives `stakes`) | keep |
| L3.5 | `paragraphAnalyses[].sentenceAnalyses[].effectiveness` | profileTypes.ts:3806 | yes | keep |
| L3.5 | *`sentenceAnalyses[].confidence` (level/reasoning/sensitivity)* | profileTypes.ts:3814 | partial | **route on confidence: low → soften framing** |
| L3.5 | `sentenceAnalyses[].improvementCandidate` | profileTypes.ts:3820 | yes (manifest) | keep |
| L3.5 | *`sentenceAnalyses[].patternMatches[]` (Wave-1b)* | profileTypes.ts:3822 | partial | **resolve patternId → student teaching at L5** |
| L3.5 | *`sentenceAnalyses[].symptomType`* | profileTypes.ts:3824 | partial | **promote to citation [P-#]** |
| L3.5 | `paragraphEffectiveness`, `paragraphVerdict` | profileTypes.ts:3836–7 | yes | keep |
| L3.5 | `improvementPhase.coachingLens` | profileTypes.ts:1890 | yes (direct injection) | keep |
| L3.5 | `improvementPhase.dimensionPhases[]` | profileTypes.ts:1882 | partial | **use for per-dimension surfacing** |
| L3.5 | `improvementPhase.nearBoundary` | profileTypes.ts:1906 | partial | **qualify coaching prose ("close to architecture")** |
| L3.5 telemetry | `corpusTelemetry.attribution` (`[MOVE-#]`, `[AP-#]`) | analysisPass.ts:1973–1985 | partial (MOVE only) | **resolve both server-side at L5** |
| L4 | `northStar.structuralRolesMap[].weight` | profileTypes.ts:1392 | yes | keep |
| L4 | `northStar.distinctivenessSignature` | profileTypes.ts:1405 | yes | **drives Distinction-phase content** |
| L4 | `scoreMatrix.coachingMap.transformativeInsight` | profileTypes.ts:2604 | yes | **promote: the lede of the qualitative summary** |
| L4 | `scoreMatrix.coachingMap.priorities[]` | profileTypes.ts:2611 | yes | **the ranked source for top-N Focus Mode** |
| L4 | `scoreMatrix.coachingMap.protectedStrengths[]` | profileTypes.ts:2636 | yes | **drives "do not damage" coaching guards** |
| L4 | `coherenceReport.contradictions[]` | profileTypes.ts:2552 | partial | **flag for L6 investigation, not for L5 to resolve** |
| Findings | `Finding.coachingValue: 'critical'\|'high'\|'medium'\|...` | profileTypes.ts:3369 | yes (routing) | keep |
| Findings | `Finding.maturity: 'hypothesis'\|...\|'superseded'` | profileTypes.ts:3356 | yes | **filter ungrounded hypotheses out of student-facing surface** |
| Findings | `Finding.buildsOn[]` / `relatedTo[]` | profileTypes.ts:3480, 3483 | yes | **pre-compute "this builds on F2" provenance for citations** |
| Profile router | `l5_feedback_annotations` rule | profileRouter.ts:1000–1074 | yes | **extend with adaptive overlays for mode/phase** |
| Corpus | `TOP_TIER_CRAFT_MOVES` (190) | `corpus/topTierCraftMoves.ts` | partial (retrieval only) | **resolve `[MOVE-#]` to displayName + sourceEssays + excerpts** |
| Corpus | `MOVE_EXCERPTS` (53, anchorLevel-tagged) | `corpus/moveExcerpts.ts` | not at L5 | **calibration few-shot retrieval target** |
| Corpus | `ESSAY_ARCHETYPES` (14) | `corpus/essayArchetypes.ts` | partial (L4) | **inject when phase=architecture and archetype context applies** |
| Corpus | `VOICE_ARCHETYPE_COMPATIBILITY` (98 cells) | `corpus/voiceArchetypeCompatibility.ts` | not at L5 | **cited evidence for archetype suggestions; soft-gate** |
| Corpus | `ANTI_ARCHETYPES` (11) | `corpus/antiArchetypes.ts` | partial | **`[AP-#]` resolution → transplant path teaching** |
| Corpus | `CORPUS_LIMITS` (18) | `corpus/corpusLimits.ts` | partial | **soft refusal of teaching outside corpus span** |
| Corpus | `READER_BIAS_GUARDS` (14, `appliesTo` includes `'L5'`) | `corpus/readerBiasGuards.ts` | partial | **inject corrective instructions; cited self-check** |
| Corpus | `MOVE_DEPENDENCIES` (12) | `corpus/moveDependencies.ts` | partial | **gate co-suggested moves** |
| Corpus | `SCHOOL_FIT_VECTORS` (95 / 15) | `corpus/schoolFitVectors.ts` | not at L5 | **on-demand only when student names target school** |
| Corpus | `CONTEXTUAL_VALIDITY_PATTERNS` (21) | `corpus/contextualValidity.ts` | not at L5 | **reframe "cliché" suggestions as context-dependent** |
| Taxonomy | `issuePatternIndex.ts` (40 PIQ + 35 CommonApp = 75) | `taxonomies/issuePatternIndex.ts` | yes (validation at L3.5) | **resolve patternId → fix-strategy template at L5** |
| Rubric | `piqRubric.ts` (13 dims) | `rubrics/piqRubric.ts` | yes (L3.5) | keep |
| Rubric | `authenticityTiers.ts` (4 tiers) | `rubrics/authenticityTiers.ts` | yes (L3.5) | **surface tier into qualitative summary** |
| Profile | `profile.index.improvementPhase` | profileTypes.ts:1858 | yes | keep |
| Conversator | `groundTruthFacts` (proposed seam) | (in flight) | no | **wire as separate input contract; L5 must not amplify mismatch** |

This is the input map for §3 onward.

---

## 3. The output contract

The new L5 emits a single, layered output that the UI projects onto three rendering surfaces (annotation gutter, focus-mode card, expandable detail). Coaching and rewrite are **two views of one body**, selected at render time, generated together.

### 3.1 Top-level type sketch

```ts
interface L5FeedbackOutput {
  // Layered surfaces, all populated, UI selects view.
  surfaces: {
    qualitativeSummary: QualitativeProgressSummary;   // P3 fix: leads UX
    focusMode: FocusItem[];                           // P2 fix: top-3 only
    deferred: DeferredItem[];                         // hidden in expandable, NEVER deleted
    annotations: AnnotatedSentence[];                 // gutter pins (raw L5Annotation projection)
    crossEssay: CrossEssayAnnotation[];               // multi-paragraph patterns
  };

  // Mode-specific bodies, both populated when applicable.
  modes: {
    coaching: CoachingDelivery | null;                // P1 fix: questions + principles + exemplars
    rewrite: RewriteDelivery | null;                  // existing path, better-cited
  };

  // Phase awareness.
  phase: ImprovementPhaseLevel;
  phaseRationale: string;                             // from improvementPhase.coachingLens
  nearBoundary: boolean;

  // Citation provenance & corpus accounting.
  citations: CitationLedger;
  corpusAccounting: CorpusAccounting;                 // for telemetry; not user-facing

  // Conversator seam.
  groundTruthConflicts: GroundTruthConflict[];        // empty array if seam not yet wired

  // Bookkeeping.
  generatedAt: string;
  cost: number;
  tokenUsage: { inputTokens; outputTokens; cacheReadTokens; cacheWriteTokens };
  timingMs: number;
  schemaVersion: 'L5-v2';
  reanalysisDelta: ReanalysisDelta | null;            // P3 fix: "your opening hooks much harder now"
}
```

### 3.2 The five surfaces

> **[SUPERSEDED — see `L5_EXPERIENCE_TARGET.md` §5 (the ten surfaces) and §7.1 (top-3 cap is wrong)].** This section's "five surfaces" framing and the `QualitativeProgressSummary` shape below are partially superseded. The experience target redefines the surface set to ten (lede, progress strip, focus surface with Move 6 multiplicity, connection map, voice anchor, score accordion, deferred surface, iteration response, Conversator panel, conversator-grounded chat) and rejects the hard top-3 focus-item cap. The schema below is preserved as historical context; the build implements the experience target's surfaces.

**`QualitativeProgressSummary`** — leads the UI. Reframes scores as narrative.
```ts
interface QualitativeProgressSummary {
  lede: string;                                       // 1–2 sentences. NOT a score. From L4.coachingMap.transformativeInsight when present, else LLM-synth.
  achievementsThisRevision: ProgressLine[];           // only if reanalysisBrief; else []
  remainingGap: string;                               // qualitative direction of travel ("voice is reaching a plain register; one more pass on imagery economy will lock it")
  scoreSection: ScoreCollapsible;                     // accordion; CONTAINS the numbers, but secondary
  authenticityTier: AuthenticityTier;                 // surfaced from L3.5 rubric
}

interface ProgressLine {
  what: string;                                       // "Your opening lands the reader inside scene"
  why: string;                                        // "this is what AOs respond to — Sarika does it in [MOVE-12]"
  evidence: SentenceCitation;                         // sentence index + spanText
  citation: CitationRef[];                            // optional [MOVE-#] / [F-#]
}
```

**`FocusItem[]`** — exactly 1–3 items. Hard cap is operational (Rule 6 of LLM-first), not analytical: ranking is LLM-driven. Everything that doesn't make the cut goes to `deferred`, **not** deleted.
```ts
interface FocusItem {
  id: string;
  rank: 1 | 2 | 3;                                    // exactly three; LLM ranks
  rankRationale: string;                              // "why this matters most right now"
  diagnosis: string;                                  // what is happening
  principle: string;                                  // the named craft principle (transferablePrinciple resolved against MOVE corpus)
  evidence: SentenceCitation;
  stakes: string;                                     // AO-framed (existing L5 stakes field, well-grounded)
  northStarConnection: string;                        // existing field
  citations: CitationRef[];
  // The two delivery shapes; both populated. Render time picks one.
  coaching: FocusCoaching;
  rewrite: FocusRewrite;
  protectedBy?: string[];                             // protectedStrengths refs, prevents over-correction
  dimensionPhase?: DimensionPhaseHint;                // from improvementPhase.dimensionPhases[]
  source: 'l4_coaching_map' | 'l3_5_finding' | 'l3_observation' | 'l5_synthesis';
}

interface FocusCoaching {
  question: string;                                   // open question student answers
  exemplars: ExemplarCitation[];                      // 2–3 from MOVE_EXCERPTS, anchorLevel ≥ 9
  scaffolding: string;                                // 1–2 sentences of light scaffold; never the rewrite
  expectedShape: string | null;                       // "after writing, you should be in scene by sentence 2"
}

interface FocusRewrite {
  rewriteExample: string;                             // existing field; ground-truth-validated (P0 seam)
  rewriteRationale: string;
  inlineCommand: InlineEditCommand | null;            // shape compatible with /api/inline-edit (Roadmap:701–721)
  authenticityFlag: 'green' | 'yellow' | 'red';       // post-gen heuristic, Roadmap:824–866
  fabricationGuard: BracketedPlaceholder[] | null;    // any factual claim becomes [X] until ground-truthed
}
```

**`DeferredItem[]`** — the "we also noticed" surface. Same shape as `FocusItem` minus rewrite/coaching delivery (just diagnosis + principle + evidence + citations). Stored in full so they can be promoted into focus on the next revision.

**`AnnotatedSentence[]`** — the gutter projection of `L5Annotation` (existing). Not a redesign target; current shape is fine.

**`CrossEssayAnnotation[]`** — projection of cross-paragraph synthesis call.

### 3.3 Citations

```ts
type CitationRef =
  | { kind: 'MOVE'; id: string; displayName: string; sourceEssay: string; sourceParagraph: number; excerpt: string | null; anchorLevel: number }
  | { kind: 'AP'; id: string; description: string; transplantArchetypeId: string; transplantPath: string }
  | { kind: 'PATTERN'; id: string; namespace: 'piq' | 'common_app' | 'supplement'; severity: 'critical' | 'major' | 'minor'; teachingTemplate: string }
  | { kind: 'ARCHETYPE'; id: string; name: string; loadBearingMoveIds: string[] }
  | { kind: 'BIAS_GUARD'; id: string; correctiveInstruction: string }
  | { kind: 'F'; id: string; claim: string; maturity: FindingMaturity; coachingValue: FindingCoachingValue }
  | { kind: 'EXEMPLAR'; moveId: string; essayId: string; paragraph: number; quoted: string; anchorLevel: number }
  | { kind: 'PHASE_LENS'; level: ImprovementPhaseLevel; coachingLens: string };

interface CitationLedger {
  refs: CitationRef[];                                // canonical list; FocusItem.citations references by id
  fabricated: { kind: string; id: string; whereCited: string }[];  // kept for telemetry, never user-facing
}
```

### 3.4 Mode bodies

```ts
interface CoachingDelivery {
  modeReason: 'student_toggle' | 'system_default_new_user' | 'rewrite_rejection_pattern' | 'phase_foundation';
  openingFrame: string;                               // 1–2 sentences situating the work
  questions: CoachingQuestion[];                      // ranked; per FocusItem
  callToWrite: string;                                // "now you write it"
  exemplarsCited: ExemplarCitation[];
}

interface RewriteDelivery {
  modeReason: 'student_toggle' | 'lower_order_concern' | 'system_default_returning_user';
  rewrites: PerFocusRewrite[];
  inlineCommands: InlineEditCommand[];                // for inline editor consumption
}
```

### 3.5 Score reframing

```ts
interface ScoreCollapsible {
  trajectory: { dimension: string; previous: number | null; current: number; movement: 'up' | 'down' | 'flat' | 'first_pass' }[];
  bandAnchors: { dimension: string; band: '60-70' | '70-80' | '80-90' | '90+'; exemplar: ExemplarCitation }[];
  raw: ParagraphScoreMatrix;                          // unmodified L4 output, expandable
}
```

P4 fix lives here: every `band` has a calibration anchor pulled from `MOVE_EXCERPTS` filtered by `(dimension, band)`, cached.

### 3.6 What L5 does *not* emit

> **[SUPERSEDED in part — see `L5_EXPERIENCE_TARGET.md` §7.4 and `L5_E2E_INTEGRITY_AUDIT.md` §6.1].** The `corpusUnanchored: true` UI dimming affordance referenced here and at §3.2's `FocusItem` is removed under the no-fallback stance. When citation is thin, the system writes its prose more carefully — it does not surface a UI dimming affordance that leaks internal state. The remaining items below (numeric verdicts in accordion, citation-required focus items, cited soft refusals) stand.

- Numeric quality verdicts as the lede. Numbers go in the accordion.
- Open-ended free-text feedback without citation. Every focus item has at least one of: `MOVE`, `AP`, `PATTERN`, `F`.
- Hard refusals. Voice×archetype `forbidden`, corpus limits, and bias-guard violations are emitted as **cited soft refusals**: "the corpus suggests this archetype isn't a fit for your voice register because [rationale]; here's an alternative." The LLM weighs the evidence; the system does not gate the LLM.

### 3.7 Determinism vs LLM judgment per field

- **LLM-generated**: lede, rankRationale, diagnosis, principle (one-line), question, scaffolding, rewriteExample, rewriteRationale, openingFrame
- **Deterministic resolution** (no LLM): `CitationRef.kind=MOVE/AP/PATTERN/ARCHETYPE/BIAS_GUARD` hydration from corpus assets; `ScoreCollapsible.bandAnchors` lookup from precomputed index; inlineCommand structural extraction from rewriteExample
- **Hybrid**: ranking (LLM owns rank assignment + rationale; system owns the cap-at-3 cut and `deferred` overflow); authenticityFlag (Haiku heuristic from Roadmap:824–866; system thresholds the band)
- **System-only**: cost/token bookkeeping, schemaVersion, fabricated-citation accounting, scoreCollapsible.trajectory math, fabricationGuard placeholder substitution

The split is deliberate. Closed taxonomies (the four `kind`s in CitationRef) are routing tags, not ceilings on LLM perception — the LLM's prose framing in `diagnosis`/`principle`/`question` is unconstrained. Operational caps (3 focus items, 2,500-token budget per call, 20 ms heuristic checks) are resource limits, not analytical judgments. Defends LLM-first Rules 1, 3, 5, 6.

---

## 4. Generation architecture

Three plausible shapes — single Sonnet, multi-call composition, resolver+generator split — were evaluated against cost, cache hit potential, coherence, LLM-first compliance, complexity, and Conversator composability. The winner is **resolver + tiered generator**.

### 4.1 Decision: resolver + tiered generator

The pipeline:

```
[Phase 4 inputs] ─┐
                  │
  Tier 0 (deterministic): Citation resolver
   ─ resolve [MOVE-#], [AP-#], patternId, F# from upstream → CitationLedger
   ─ pull voice×archetype refusal hints, corpus limits, bias guards relevant to phase
   ─ pull MOVE_EXCERPTS calibration anchors keyed by (dimension, band) the L4 score matrix produced
   ─ no LLM cost; <50 ms; result is cached on essay hash
                  │
  Tier 1 (LLM, parallel-paragraph, 3-block cached): existing per-paragraph annotator
   ─ keeps current deepAnnotationService.ts machinery
   ─ extended prompt: receives resolved ledger + bias-guard corrective instructions
   ─ extended output: now also emits FocusCoaching alongside FocusRewrite for any annotation that becomes a FocusItem candidate
   ─ same cost profile as today
                  │
  Tier 2 (LLM, single Sonnet call): the synthesis pass
   ─ reads all paragraph annotations + L4 coachingMap + ledger
   ─ produces: qualitativeSummary, focusMode (top-3 with rank rationale), deferred overflow
   ─ ~1,800 input tokens (cached: ledger + coachingMap; not cached: annotations) + ~1,200 output
   ─ replaces the cross-paragraph synthesis call; absorbs its responsibility
                  │
  Tier 3 (Haiku, optional): post-generation heuristic guards
   ─ AIRiskScorer (~50 ms) on every rewriteExample
   ─ semantic quality check on focusMode rank rationale (Haiku, ~$0.0005)
   ─ runs in parallel with persistence
                  │
[L5FeedbackOutput] → manifest merger (existing) + persistence + UI
```

### 4.2 Why this shape

- **Coherence preserved**: the synthesis pass at Tier 2 sees the full per-paragraph output and the resolved ledger in one prompt. It owns ranking and qualitative framing, which are the cross-cutting decisions.
- **Cost-controlled**: Tier 0 is free; Tier 1 keeps the existing 3-block cache and adds zero new LLM calls (the prompt grows by ~300–500 tokens of resolved ledger, all cached); Tier 2 is one Sonnet call replacing the existing cross-paragraph call (net delta: ~+$0.005 per essay); Tier 3 is Haiku (~$0.001).
- **Cache-friendly**: Tier 0 result is cached on `(essayHash, profileVersion)`; the resolved ledger is the bulk of the prompt growth and never recomputed within a session. Tier 1 cache is unchanged. Tier 2 caches its system prompt + ledger across the synthesis call (one shot, but cached for next-essay calls in the same session).
- **LLM-first compliant**: Resolver does no judgment — it hydrates corpus refs into structured payloads. Tiered generator owns all judgment. No regex quality enforcement (Rule 4); no closed taxonomy on LLM perception (Rule 3); soft guidance throughout (Rule 5); operational caps only (Rule 6).
- **Conversator-composable**: Tier 0 is the natural injection point for `groundTruthFacts`. The ledger is built per-paragraph; the Conversator's facts (e.g., "team size = 5, not 50") are injected as a `groundTruthFacts` slice on the prompt and as a post-Tier-1 validator (any `rewriteExample` referencing a number gets the number replaced with `[X]` if not in `groundTruthFacts`).
- **Migration-friendly**: Tier 1 is the existing L5; we don't rebuild it. We extend its prompt and output schema. The redesign is **largely additive**, which makes shadow-mode A/B tractable (§10).

### 4.3 What was rejected and why

- **Single Sonnet call consuming everything** — fails on token budget (full profile + 14-essay calibration corpus + 14 bias guards + voice×archetype matrix would blow past 30K input tokens), fails on cache (hard to split blocks for cross-essay caching), and concentrates risk.
- **Phase-conditioned dispatch** with separate L5 sub-paths per phase — five paths to maintain, large duplication. Phase belongs as a routing tag inside one architecture, which is what we have already.
- **Pure resolver split with no synthesis** (just hydrate ledger; ship per-paragraph annotations as-is) — loses Focus Mode and qualitative summary, which are the P2/P3 fixes.

### 4.4 Concrete prompts (sketch)

**Tier 1 system prompt extension** (added to existing PHASE_GUIDANCE block):
```
You have access to a resolved Citation Ledger of corpus moves, anti-archetypes, issue
patterns, and findings relevant to this paragraph. Treat these as cited evidence: you
may reference them in your annotations using [MOVE-id], [AP-id], [PATTERN-id], [F-id].
Reader-bias guards listed apply to your output — use them as corrective evidence the
LLM weighs, not as filters that the system enforces.

For every annotation that you mark priority 1–2, populate BOTH the rewriteExample
(existing field) AND a coachingDelivery sub-object: a question that elicits the
student's own rewrite, an exemplar citation from the ledger, and a 1–2-sentence
scaffold. The coaching path is the default for new students; the rewrite path is the
default for returning students or lower-order concerns. We render one of them at a
time but you generate both so the cost is paid once.
```

**Tier 2 synthesis prompt** (sketch):
```
You see all paragraph-level annotations, the L4 coaching map (priorities,
transformative insight, protected strengths), and the citation ledger.

Output:
1. A qualitative progress lede (1–2 sentences) that names the essay's most important
   movement this revision (or, if first pass, its most important strength). Anchor
   to a specific moment in the essay; cite the ledger.
2. The TOP THREE focus items, ranked. For each, write a rank rationale: why this
   matters most right now, given the phase, the protected strengths (do not damage
   them), and the dependency chain (some moves require others to land first; the
   ledger surfaces these).
3. Everything else you saw goes in `deferred` — you keep the diagnoses, you skip the
   coaching/rewrite delivery for those.
4. If a focus item has no resolvable citation in the ledger, you may still surface
   it but you must mark it `corpusUnanchored: true`. The system never deletes such
   items; the UI dims them.
```

### 4.5 Concrete budgets

Per essay, all-in:

| Tier | Mechanism | Tokens (in / out) | Cost |
|---|---|---|---|
| 0 | Resolver | 0 / 0 | $0 |
| 1 | 5 paragraph calls × Sonnet | 600 / 400 each (cached prefix) | $0.10 |
| 1 | 1 cross-para call (REPLACED — see Tier 2) | — | — |
| 2 | Synthesis Sonnet | 1,800 / 1,200 | $0.018 |
| 3 | AIRiskScorer (heuristic) | 0 / 0 | $0 |
| 3 | Haiku quality check (rank rationale) | 800 / 200 | $0.0005 |
| **Total** | | | **~$0.12 (foundation) → ~$0.45 (polish)** |

Versus today's $0.10–$0.50: net delta ≈ **+$0.02 per essay** for the new capabilities. Cushion against the $5/run cap is preserved.

---

## 5. Citation resolution layer

Citation resolution is the work the parallel RAG design punted on (`INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md:177` — *"Today this layer is the largest gap; propose extending l5ManifestMerger.ts to consume telemetry attribution"*). This redesign does the work.

### 5.1 The four resolvers

All four are pure functions over corpus + upstream output. Zero LLM cost. <50 ms total on the 5-paragraph hot path.

**(a) `resolveMOVE(refs: string[], corpusTelemetry, paragraphIndex)`**
- Input: `[MOVE-3]`, `[MOVE-12]` references the LLM emitted at L3.5 (`corpusTelemetry.attribution`).
- Lookup: in-memory map `moveById` from `corpus/claudeRetrieval.ts:76`. O(1).
- Hydrate: pull `displayName`, `mechanism`, `compatibleRegisters`, `transferability`, `sourceEssays[]` from `TOP_TIER_CRAFT_MOVES`.
- Pull top excerpt: filter `MOVE_EXCERPTS` by `moveId`, prefer `anchorLevel ≥ 9`, return one excerpt with quote + essayId + paragraph.
- Output: `CitationRef.kind='MOVE'`. Confidence: 1 if move ID exists, else `null` (logged to fabricated ledger).

**(b) `resolveAP(refs: string[], corpusTelemetry)`**
- Same pattern, against `ANTI_ARCHETYPES` (11 entries).
- Pull `description`, `failureMode`, `corpusAlternativeArchetypeId`, `transplantPath`.
- The transplant path is the teaching: "your draft shows mission-trip-epiphany; the corpus addresses this by transplanting to strategic-balance-plain-prose — drop the trip, find the local spontaneity-counter-trait."
- This is the gap the brief identified; resolver closes it cleanly.

**(c) `resolvePATTERN(refs: string[], essayType: 'piq'|'common_app'|'supplement')`**
- Input: `patternId`s from L3.5's `sentenceAnalyses[].patternMatches[]` and `symptomType`.
- L3.5 currently validates against `PATTERN_INDEX` (analysisPass.ts:1619–1630) but the **full fix-strategy template** lives in `src/services/piq/issuePatterns.ts` (40 PIQ + 35 CommonApp templates).
- Resolver: dual lookup — taxonomy entry (id, namespace, severity, oneLineTrigger) from `taxonomies/issuePatternIndex.ts`, plus the full template from `piq/issuePatterns.ts`.
- Output: `CitationRef.kind='PATTERN'` with `teachingTemplate` populated.
- Critical architectural shift: today, patternId resolves at L3.5 ingestion, which loses the citation handle by the time L5 runs. Resolver moves resolution to L5. L3.5 keeps validation (rejects fabricated pattern ids); L5 owns hydration.

**(d) `resolveF(findingIds: string[], findingStore)`**
- Input: finding IDs the LLM may emit in annotations (today findings are referenced via prose; resolver promotes them to first-class citations).
- Lookup: `FindingStore.get(id)`.
- Pull: `claim`, `maturity`, `coachingValue`, `evidence`, `buildsOn`, `relatedTo`, `supersededBy`.
- **Filter**: any finding with `maturity='hypothesis'` or `supersededBy != null` is dropped from student-facing surface. They remain in the ledger for telemetry.

### 5.2 Soft guidance, not refusal

> **[SUPERSEDED in part — see `L5_E2E_INTEGRITY_AUDIT.md` §6.1].** The `corpusLimitFlagged: true` UI affordance and the Tier 2 retry-on-bias-guard-fail mechanism described in this section are removed under the no-fallback stance. Corpus limits, voice×archetype rationales, and bias-guard corrective instructions are still injected into the Tier 1 prompt as cited evidence (the LLM weighs them). The Haiku post-generation bias-guard check is downgraded to **diagnostic telemetry only** — no Tier 2 re-run, no UI flag, no `biasGuardFlagged` marker. If the LLM's prose ignores the corrective instruction, the prompt is wrong; we fix the prompt rather than running parallel safety mechanisms.

Per LLM-first Rule 5, the corpus assets that look like rails (corpus limits, voice×archetype `forbidden`, bias guards) are **cited evidence**, not filters:

- **Corpus limits (18 conditions, `corpus/corpusLimits.ts`)**: when a target archetype/move's `cannotTeachWhen` condition matches the essay (LLM-judged via Tier 1 prompt: "the ledger lists this archetype's cannotTeachWhen conditions; assess against the draft"), the resolver injects the condition + `detectionGuidance` into the prompt. The LLM may still teach the move; if it does, the system marks the focus item `corpusLimitFlagged: true` and the UI surfaces a "the corpus suggests this approach has constraints — see [explanation]" affordance.
- **Voice×archetype matrix (98 cells, `corpus/voiceArchetypeCompatibility.ts`)**: resolver pulls `fit` + `rationale` for the current voice register × any archetype the LLM might suggest. `forbidden` cells are surfaced with an explicit corrective instruction ("PROVISIONAL Hopkins-pending entry; rationale: …"). The LLM weighs.
- **Reader-bias guards (14, `corpus/readerBiasGuards.ts`, `appliesTo` includes `'L5'` for 8/14 entries)**: resolver injects every applicable guard's `correctiveInstruction` into the Tier 1 prompt. After Tier 2, a Haiku self-check (~$0.0003) reads the focus items and asks: "do any of these focus items violate one of these 14 guards?" Result is a soft flag, not a delete. Output gets routed back to Tier 2 for a single rewrite cycle if any guard triggers; otherwise emit.

### 5.3 Resolution cost

| Resolver | Cost | When run |
|---|---|---|
| `resolveMOVE` | <5 ms | Always |
| `resolveAP` | <2 ms | Always |
| `resolvePATTERN` | <10 ms | Always |
| `resolveF` | <5 ms | Always |
| Voice×archetype lookup | <2 ms | Always |
| Corpus-limits scan | <5 ms | Always (small set) |
| Bias-guard injection | <2 ms | Always |
| **Aggregate** | **<35 ms total** | Per essay |

All of this is server-side, deterministic, cache-on-essay-hash. The 1,177-correlation `derivedCorrelations.json` (666 KB) is **not** loaded at L5 today and remains out of scope: it is a pre-computation source, not a runtime asset.

### 5.4 Failure modes

- **Move ID resolves to nothing**: LLM hallucinated. Logged to fabricated ledger; UI hides the citation; the focus item itself remains (the LLM's diagnosis may still be valid; we just lost the corpus anchor).
- **Pattern ID exists in taxonomy but no template in `piq/issuePatterns.ts`**: emit pattern with `teachingTemplate=null` and `corpusUnanchored=true`; UI dims.
- **Voice×archetype lookup hits a `PROVISIONAL` Hopkins-pending entry**: `rationale` carries the PROVISIONAL marker; Tier 1 prompt instructs the LLM to acknowledge provisional status in any citation.

---

## 6. Mode and phase architecture

### 6.1 Coaching vs rewrite — both generated, one rendered

> **[SUPERSEDED — see `L5_EXPERIENCE_TARGET.md` §7.2].** The coaching-mode-vs-rewrite-mode toggle is rejected. Every focus point in the experience target carries **both** the principle/mechanics/diagnostic *and* multiple rewrite paths (Move 6 multiplicity); the student is not "in coaching mode" or "in rewrite mode" — they have access to both at every focus point. The "default mode" decision and Q1 in §14 dissolve. This section's prompt instructions are partially preserved (the requirement that both delivery shapes are emitted at Tier 1) but the mode-selection logic and the chat-layer aggregation of `preferredMode` are removed.

The P1 fix from `WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md:38–54` says: default new users to coaching, fallback to rewrite on explicit toggle or for lower-order concerns.

**Generation**: Tier 1 always emits both. The cost is paid once; the choice is rendering. `FocusItem.coaching` and `FocusItem.rewrite` are siblings in the schema (§3.2). The Tier 1 prompt is extended to require both for priority-1/2 annotations. For priority 3+, only the rewrite is required (these are the lower-order concerns — grammar, word choice — where coaching adds friction without educational gain).

**Mode selection (system inference + student override)**:

| Signal | Mode |
|---|---|
| Student explicit toggle | wins always |
| First-time user | coaching |
| Returning user with ≥3 prior rewrite acceptances | rewrite |
| Returning user with ≥3 prior rewrite rejections | coaching, with banner "looks like you prefer to write your own — switching to coaching" |
| Phase = foundation | coaching (foundational structure benefits from inquiry) |
| Phase = polish/distinction with low-order rewriteExample | rewrite |

The signal aggregation lives **outside L5** — in the chat/session layer that wraps L5. L5 receives a `preferredMode` parameter and passes it through; the actual rendering and toggle are session-state concerns.

### 6.2 Phase awareness — filter, not limiter

The existing PHASE_GUIDANCE record (deepAnnotationService.ts:82–117) is preserved. The redesign extends two things:

- **Phase-conditioned ranking weights at Tier 2**: foundation phase weights structural items higher in the top-3 cut; polish phase weights craft items higher. The weights are LLM-judged via prompt instruction, not deterministic formula. (Rule 1: tracking, not pre-determining.)
- **`nearBoundary` qualifier in coaching prose**: when `improvementPhase.nearBoundary === true`, the qualitative summary lede explicitly names the boundary ("you're moving from architecture to craft — the structure is starting to hold; the next pass focuses on sentence-level execution").

**Phase concrete examples (same essay, two phases):**

*Foundation phase output:*
- Lede: "The opening tries to land in scene but the reader doesn't yet know what's at stake."
- Focus 1: thesis clarity (cited: `[F-3]`, `[MOVE-grammatical-subject-displacement]`)
- Focus 2: arc landing
- Focus 3: voice register consistency
- Score accordion: collapsed

*Polish phase output (same essay, hypothetically promoted):*
- Lede: "Your voice has reached a plain register that does its work; the next pass is word-level precision."
- Focus 1: imagery economy in P2 (cited: `[MOVE-precise-image-replaces-abstraction]`, exemplar: Sondheim P3)
- Focus 2: a single passive verb in P4 carrying load it shouldn't
- Focus 3: a final-paragraph cliché flagged via `[PATTERN-piq:resolution-too-tidy]`
- Score accordion: collapsed; band anchors visible

**Phase classifier disagreement across consecutive runs (Foundation → Architecture → Foundation)**: handled at the orchestrator (existing `phase.transition.isGenuineShift` signal). L5 receives the new phase and operates on it. If the orchestrator detects oscillation, it logs telemetry; L5 does not attempt to reconcile or smooth.

---

## 7. Prioritization and ranking

P2 — feedback overload — is solved here. Today the pipeline produces dozens of observations (L3.5 sentence weaknesses + L3.75 entanglements + L4 prioritized improvements + L5 paragraph annotations). The new L5 surfaces three.

### 7.1 Where ranking lives

Ranking is **LLM-judged at Tier 2** (the synthesis pass) with deterministic inputs:

- L4 `coachingMap.priorities[]` — already an LLM-ranked list with architectural reasoning (profileTypes.ts:2611). The Tier 2 prompt receives this verbatim as the strongest prior.
- L3.5 `priorityForImprovement` (1–5) — sentence-level urgency.
- Per-annotation `priority` (1–5) — already LLM-assigned at Tier 1.
- `Finding.coachingValue` (`critical | high | medium | contextual | diagnostic`) — already a routing tag.
- Phase-conditioned weights — see §6.2.

The Tier 2 prompt instructs: *"Synthesize across these signals. Pick three. The choice is your judgment, but it must satisfy the cap. Provide a one-sentence rank rationale per item that names which signal dominated. Everything else goes to deferred — keep their diagnoses, drop their delivery."*

### 7.2 Why three and not five

> **[SUPERSEDED — see `L5_EXPERIENCE_TARGET.md` §7.1].** The hard top-3 focus-item cap is rejected. The number of focus items is determined by the essay, not by a fixed cap. A clean polish-phase essay may surface 1–2 genuine focus items; a structurally unfinished foundation-phase essay may surface 4–7 substantive ones. The operational constraint that *is* binding is the non-repetition contract (§3 of the experience target) — the set is naturally small because redundancy is forbidden, not because the system arbitrarily stops at three. The cognitive-load research the section cites points at the student's experience, not at a system cap; cognitive load is solved by the focus surface's design (one card at a time, student-paced) and the deferred surface's framing ("not this revision," not "ranked lower").

The synthesis doc's research citation: *"Beyond 2–3 focus areas per session, implementation rates drop to near-zero (Sommers 1982, cognitive load theory, writing center consensus)."* Three is the operational cap. Three respects Rule 6 (operational limit, not analytical).

### 7.3 What's deferred surface

The deferred array shows up in the UI as an expandable "we also noticed" section, with diagnoses + citations but **no coaching/rewrite delivery**. Promoting a deferred item to focus on the next revision is a legitimate flow (re-analysis with explicit student request); the deferred item already carries enough state to be promoted.

This satisfies LLM-first Rule 2 — *never discard paid LLM output*. We pay for all annotations in Tier 1; we re-rank them at Tier 2; we surface three; the rest persist in the output, the UI, and the telemetry.

### 7.4 Mode-conditioned ranking

Coaching mode and rewrite mode see slightly different focus orderings. Coaching mode's top-3 weight items where `coachingValue=critical|high` and where the corpus has at least one high-anchor exemplar (`anchorLevel ≥ 9`). Rewrite mode's top-3 weight items where `wordEconomyCut` or `rewriteExample` quality is high — i.e., where the rewrite itself is actionable. The LLM judges; the prompt names the weighting. Same essay, different rendering, two coherent top-3s.

---

## 8. Composition with Conversator ground truth

The Conversator side is in flight. The seam can be specified now with three guarantees:

### 8.1 Input shape

The new L5 receives a `groundTruthFacts` slice on the input (today: undefined; tomorrow: populated by the chat-persistence service):

```ts
interface GroundTruthFacts {
  facts: GroundTruthFact[];                         // structured claims with provenance
  unverifiedClaims: UnverifiedClaim[];              // claims the essay makes that the Conversator hasn't verified
  authenticityFingerprint: AuthenticityFingerprint;
}
interface GroundTruthFact { claim: string; evidence: string[]; confidence: 'high'|'medium'|'low'; sourceTurn?: string; }
interface UnverifiedClaim { claim: string; sentenceIndex: SentenceCitation; numericValue?: number | null; }
```

### 8.2 Where it lands in L5

Two seams:

**(a) Tier 1 prompt injection** — the resolver's `groundTruthFacts.facts` slice is added to the shared (cached) prompt block. The LLM is instructed: *"the following facts are the student's verified ground truth; if your annotation references factual content that contradicts them, you must rewrite the annotation to align with the facts or use bracketed placeholders."*

**(b) Tier 3 fabrication-guard validator** — runs after Tier 1 and Tier 2. Scans every `rewriteExample` and `lede` for numeric/factual claims. For each:
- If the claim matches a `GroundTruthFact`: pass.
- If the claim doesn't appear in `groundTruthFacts` and the original essay sentence didn't contain it either: replace with `[X]` placeholder. (Today's inline editor anti-fabrication uses the same mechanic per the Roadmap; we re-use the pattern.)
- If the claim contradicts a `GroundTruthFact` (essay says 50, ground truth says 5): emit a `GroundTruthConflict` entry; the focus item containing it is dropped to deferred with a UI affordance "this claim conflicts with what you told us — which is right?"

L5 **does not detect fabrication**. P0 lives in the Conversator channel. L5's job is to **not amplify fabrication** — and to surface conflicts the Conversator already knows about. The seam is clean.

### 8.3 Story-mining and voice-profile composition

These are sibling Conversator outputs (Roadmap:88–310). Same input shape: pass through to Tier 1 prompt as cached blocks. Voice profile injects into the system prompt; story mining seeds become `groundTruthFacts`-adjacent material the LLM may reference in coaching exemplars ("remember the moment you described to us during chat where […]").

When the Conversator side ships, no L5 architecture change is needed beyond wiring the slice. Today's slice is `null`; the schema is forward-compatible.

---

## 9. Cost and caching

### 9.1 Per-call budget vs research budget

The RAG architecture design's L5 budget (`INTELLIGENT_RAG_ARCHITECTURE_DESIGN.md:151`): *"Budget: 2,500 — 1,500 few-shot, 600 voice×archetype refusal, 400 corpus limits"* — that's the **research-injection** budget per L5 call. Total token budget is larger (8K profileRouter L5 rule + research budget). Concrete numbers per the architecture in §4:

| Block | Tokens (in) | Tokens (out) | Cached? | Cost |
|---|---|---|---|---|
| Tier 1 system + phase | ~600 | — | yes | $0 (cached read) |
| Tier 1 shared (digest + coachingMap + ledger + corpus moves) | ~2,500 | — | yes (across paragraphs) | $0 (cached read) |
| Tier 1 per-paragraph | ~600 | ~400 | no | $0.020/para |
| Tier 2 synthesis | ~1,800 | ~1,200 | partial (system + ledger cached) | $0.018 |
| Tier 3 Haiku quality check | ~800 | ~200 | yes (system) | $0.0005 |

Five-paragraph essay total: **~$0.12** (foundation/architecture density) → **~$0.45** (polish/distinction). Net delta vs today: **+$0.02**.

### 9.2 Cache strategy

| Block | Stable across | Invalidation |
|---|---|---|
| Tier 0 ledger | (essayHash, profileVersion) | Profile version bump (re-analysis with structural change) |
| Tier 1 system + phase | (essayType, phase) | Phase change |
| Tier 1 corpus moves | (essayHash, voiceRegister) | Voice register reclassification |
| Tier 1 shared digest | (profileVersion) | Any profile mutation |
| Tier 2 system + ledger | (profileVersion) | Profile version bump |
| Tier 3 Haiku system | global | Bias-guards file change |

For focused-mode re-analysis (V2 design): when an edit affects only paragraphs P1, P3, the Tier 0 ledger may still be valid (resolver only re-runs if upstream attribution changed). Tier 1 re-runs only on changed paragraphs. Tier 2 always re-runs (it's a synthesis call). Tier 3 always re-runs.

### 9.3 Anti-pattern resolution and patternId resolution: server-side

Per Rule 6 (operational, not analytical), both resolutions live server-side, no LLM. This is cheap and correct: resolver hydrates IDs to records; the LLM doesn't choose between candidates because the IDs were already chosen at upstream layers.

### 9.4 P95 latency target

Today's L5: ~15–20 s for a 5-paragraph essay (parallel batched). The new architecture adds Tier 2 (sequential after Tier 1) — **net +3–5 s**. Tier 3 runs in parallel with persistence so doesn't block. **Target P95: 25 s** for a 5-paragraph polish-phase essay; P50: 18 s.

If P95 exceeds 30 s, the Tier 2 prompt is the candidate to compress: drop the per-paragraph annotation prose from its input (keep only IDs + diagnoses) and trade some coherence for latency.

### 9.5 $5/run hard cap accounting

Single-essay pipeline cost: ~$0.45 worst case. A typical test run is 14 calibration essays × 0.45 ≈ **$6.30**. **This is over the $5 cap and must be approved before the calibration A/B runs.** The redesign doc flags this explicitly: an A/B against the 14-essay calibration corpus needs a per-essay budget of ≤ $0.357, achieved by running calibration in two halves (7 essays × 0.45 ≈ $3.15, comfortable). Mile-marker M5 (§13) makes this explicit.

---

## 10. Migration strategy

Per `feedback_architecture_migrations.md`: audit legacy signals, preserve what works, keep legacy as dead code until E2E validates new path ≥ old path.

### 10.1 Audit baseline

§1 above is the audit baseline. The 22 fields on `L5Annotation`, the 4 fields on `ImprovementEntry` that the merger fills, the 3-block cache, parallel batching, fail-fast on parse, ACTION-mode rewrite enforcement — all preserved. The new shape is **largely additive**: surfaces, modes, citations, top-N ranking, qualitative summary all live above the existing per-paragraph annotator.

### 10.2 Shadow mode

Both L5 paths run in parallel for the validation window:

```
analysisOrchestrator
   ├─► L5_v1 (existing deepAnnotationService) → existing L5AnnotationResult
   │       └─► l5ManifestMerger (existing) → ImprovementManifest
   │
   └─► L5_v2 (new tiered architecture, behind feature flag L5_V2_ENABLED)
           └─► L5FeedbackOutput (new shape)
           └─► l5_v2_to_manifest (new adapter that emits the same ImprovementManifest fields)
```

Both write to the profile (the v2 path writes to a separate `profile.l5_v2_telemetry` slot during shadow). UI continues to read v1's manifest. Comparison runs offline.

### 10.3 Gates for promotion

Before flipping the flag and deleting v1:

1. **Shadow A/B on the 14-essay calibration corpus** — produce v1 and v2 outputs; compare against expert reviewer's labeled top-3 per essay; v2 must match or beat v1 on:
   - Citation rate (% of focus items with at least one resolvable corpus or finding citation)
   - Top-3 agreement with reviewer (set overlap)
   - Phase-appropriate framing (Foundation outputs avoid Distinction-level polish notes)
2. **Production shadow on 5% of real essays for 7 days** — measure cost delta, latency, error rate. Must be within +$0.05 / +5 s P95 / equal-or-lower error.
3. **Coaching mode acceptance rate** — A/B coaching vs rewrite for new-user cohort; must show no worse engagement (deferred items expansion rate, time-on-essay, return rate).
4. **Manifest parity** — every field that v1 fills in `ImprovementEntry`, v2 also fills (essaySpecificDemo, demonstration, technique, stakes, wordEconomyCut). Verified per essay.

### 10.4 Test fixtures

`tests/output/checkpoint3/` is the golden fixture set. New fixtures needed:

- **Coaching-mode fixture**: same essay, two snapshots (rewrite-mode output, coaching-mode output) — proves both surfaces are populated and renderable.
- **Citation-resolution fixture**: an essay where L3.5 emits known `[MOVE-#]`, `[AP-#]`, `patternId` references; assert L5 ledger hydrates them to expected records.
- **Top-3 cap fixture**: an essay with 12+ paragraph-level annotations; assert exactly 3 focus items, 9+ deferred items, no annotations dropped.
- **Phase-appropriate fixture**: same essay run at foundation phase vs polish phase; assert structurally-different focus items.
- **Ground-truth conflict fixture**: an essay claiming "led 50" with a `GroundTruthFact` of "led 5"; assert a `GroundTruthConflict` is emitted and the affected focus item is deferred.
- **Voice×archetype provisional fixture**: a Hopkins-PROVISIONAL pairing surfaces in suggestions; assert PROVISIONAL marker carried through to citation.

### 10.5 Legacy as dead code

`l5ManifestMerger.ts` survives unchanged through the validation window. The new `l5_v2_to_manifest` adapter is a sibling, not a replacement — both write to the manifest in shadow. Once v2 is promoted, `l5ManifestMerger.ts` and the legacy `deepAnnotationService.ts` paths are tagged `@deprecated` and kept for one more release cycle, then deleted. The `buildSharedContext()` dead code at deepAnnotationService.ts:1097–1250 is already on the Phase 6b deletion queue and goes with this rev.

---

## 11. Failure modes

For each component, the question: **how does it break?**

### 11.1 Citation resolution against a stale corpus

- **Symptom**: post-Harvard-10-v2 update, a previously-valid `[MOVE-#]` no longer resolves.
- **Behavior**: `resolveMOVE` returns null for that ID; logged to fabricated ledger; UI hides the citation; the focus item itself remains. The LLM's diagnosis isn't invalidated by a missing exemplar.
- **Detection**: a daily cron asserts `resolveMOVE` succeeds for every move ID emitted in the last 7 days of telemetry; failures alert on Slack.

### 11.2 Upstream signal missing or malformed

- **Symptom**: L3.5 truncated; L3.75 hit Phase B truncation cap (a known precondition flagged in the brief, not redesign-resolved).
- **Behavior**: Tier 0 resolver runs on whatever is present. Tier 1 prompt is missing some shared blocks but the per-paragraph block is intact. Tier 2 receives partial input; the synthesis prompt explicitly handles `partialUpstream: true` by emitting a `surfaces.qualitativeSummary.lede` that names the limitation ("we have a partial read of this essay; the focus items below are best-effort").
- **No degraded-fallback fake data.** If Tier 1 throws, we fail-fast (existing behavior). If only L3.75 partial, we proceed.

### 11.3 Coaching mode generates suggestions the LLM can't ground

- **Symptom**: Tier 1 emits a coachingDelivery for a focus item but no `[MOVE-#]` resolves into an exemplar for the question.
- **Behavior**: Tier 2 marks the item `corpusUnanchored: true`; coaching delivery is allowed (the question + scaffolding are still actionable) but the UI dims the exemplar slot. Telemetry counts unanchored coaching items as a quality signal.

### 11.4 Conversator ground-truth conflict ambiguous

- **Symptom**: essay says "I led the team"; ground-truth says "I co-led with two others". Numeric? No. Substantive conflict? Maybe.
- **Behavior**: Tier 3 validator runs only on numeric/factual claims (regex-tight: numbers, named-entity dates, named-entity sizes). Substantive claim conflicts that don't match this regex are *not* resolved by L5 — they're flagged in `groundTruthConflicts` with `severity: 'unverified'` and surfaced in the UI as a gentle prompt ("you mentioned during chat that you co-led — should the essay reflect this?").
- **L5 never silently rewrites** a substantive claim it can't verify is wrong.

### 11.5 Phase classifier oscillation

- **Symptom**: Foundation → Architecture → Foundation across three consecutive analyses.
- **Behavior**: L5 trusts each run's phase. The orchestrator owns oscillation detection; if `phase.transition.isGenuineShift === false` for two consecutive runs in the same phase, telemetry flags it. L5 does not override.

### 11.6 Reader-bias self-check flags the LLM's draft

> **[SUPERSEDED — see `L5_E2E_INTEGRITY_AUDIT.md` §6.1].** The Tier 2 retry-on-bias-guard-fail and the `biasGuardFlagged: true` UI caveat are removed under the no-fallback stance. The Haiku post-generation bias-guard check is downgraded to **diagnostic telemetry only**. If the rate exceeds threshold, that's a Tier 1 prompt failure to surface and fix at the source — not a parallel safety mechanism running around it.

- **Symptom**: Tier 3 Haiku check says focus item 2 violates `over-rewarding-literary-prose-over-plain`.
- **Behavior**: Tier 2 re-runs **once** with the corrective instruction surfaced as cited evidence ("the reader-bias guard 'X' applies to your previous focus 2 — adjust"). If the second run still fails, the focus item ships with a `biasGuardFlagged: true` marker; the UI surfaces a quiet caveat. We never delete LLM output for failing a heuristic check (Rule 4 + Rule 2).

### 11.7 Cost spike

- **Symptom**: Tier 2 synthesis call returns 5K output tokens instead of 1.2K (LLM verbosity drift).
- **Behavior**: token-budget telemetry alerts at 1.5× expected. The Tier 2 prompt has a literal output-length instruction; we tighten as needed via prompt revision, not via output truncation (Rule 2 — never truncate paid output).

### 11.8 Manifest merger contract drift

- **Symptom**: v2 emits a focus item that doesn't map cleanly to any `ImprovementEntry` (no matching paragraph index).
- **Behavior**: the v2-to-manifest adapter creates a synthetic entry with `paragraph: -1` (essay-level) and pulls fields from the focus item. v1 merger semantics are preserved (essay-level annotations match `paragraph === -1`); v2 inherits the same convention.

---

## 12. Measurement

The new L5 must be empirically better than the old. Concrete metrics, with the source signal:

| Metric | Definition | Source | Target |
|---|---|---|---|
| **Citation rate** | % of focus items with ≥1 resolved citation | `L5FeedbackOutput.surfaces.focusMode[].citations` | ≥ 90% |
| **Fabrication rate** | % of cited refs that fail to resolve | `L5FeedbackOutput.citations.fabricated` | ≤ 2% |
| **Top-3 reviewer agreement** | Set overlap between v2 top-3 and expert reviewer's top-3 on labeled fixtures | Manual labeling on 14-essay calibration corpus | ≥ 0.7 Jaccard |
| **Phase appropriateness** | Foundation outputs that emit ≥1 polish-only annotation (negative metric) | Post-hoc classifier | ≤ 5% |
| **Coaching adoption** | % of new-user sessions where a coaching question elicits a student rewrite | Session telemetry | track; no a-priori target |
| **Coaching → rewrite transition** | After a coaching exchange, % of students whose subsequent draft moves toward the principle | Diff against re-analysis | track |
| **Score-collapsed-by-default rate** | % of sessions where students never expand the score accordion | UI telemetry | high is good |
| **Deferred → focus promotion rate** | % of deferred items promoted on next revision | Re-analysis telemetry | track |
| **Cost per essay (P50, P95)** | Tier 0 + Tier 1 + Tier 2 + Tier 3 sum | `L5FeedbackOutput.cost` | P50 ≤ $0.20, P95 ≤ $0.55 |
| **Latency P95** | Tier 0 → output written | wall clock | ≤ 25 s |
| **Reader-bias flag rate** | Tier 3 flags per essay | Tier 3 telemetry | ≤ 0.3 / essay (more = prompt drift) |
| **Authenticity flag rate** (rewrite mode) | Heuristic AI-risk flags ≥ 70 | Tier 3 telemetry | ≤ 5% of rewrites |

### 12.1 A/B harness against the 14-essay calibration corpus

Per the cost analysis in §9.5, **the 14-essay run costs ~$6.30 — over the $5 cap. Approval required.** The harness:

- Two halves (7 essays each, ~$3.15 each) — first half tags v1+v2 outputs; second half independently re-runs after any prompt-tuning iteration.
- Comparison rubric: a markdown grid emitted by an offline script (no LLM cost in scoring beyond the Haiku quality check):
  - Side-by-side focus items
  - Reviewer-labeled top-3 (manual; one-time labeling, ~4 hr human effort)
  - Citation rate, fabrication rate
  - Phase-appropriateness flag
  - Cost / latency

The harness deliverable is a CSV per A/B run + a one-page summary. Mile-marker M6 produces it.

### 12.2 Production shadow

5% traffic for 7 days post-A/B, with the same metrics aggregated daily. The Stop button: if v2 cost exceeds v1 by > 30% or P95 latency by > 50%, kill shadow and re-tune.

---

## 13. The implementation sequence

Eight mile markers, ordered by ROI × independence. Each is independently shippable and rollback-safe (feature-flagged).

### M0 — Audit + remove dead code (1 day, no risk)
- Delete `buildSharedContext()` (deepAnnotationService.ts:1097–1250). Phase 6b cleanup.
- Wire `priorAnnotations` in the live re-analysis path (today: orchestrator:850 passes `undefined`).
- Outcome: clean baseline before adding anything.

### M1 — Citation resolver (2–3 days, no LLM cost) — *foundation; unblocks M2, M3*
- Implement `resolveMOVE`, `resolveAP`, `resolvePATTERN`, `resolveF` as pure functions.
- Unit tests against fixtures: known IDs in, expected hydration out.
- Bias-guard injection helper (read 14 guards, filter by `appliesTo` includes `'L5'`).
- Voice×archetype lookup helper.
- Corpus-limits scan helper.
- Surface: a single `buildL5Ledger(corpusTelemetry, profile)` function returning `CitationLedger`.
- Outcome: ledger fully exercised by tests; not yet wired into L5.

### M2 — Tier 1 prompt extension (2–3 days, ~+300 tokens of cached prompt) — *requires M1*
- Extend deepAnnotationService.ts shared prompt block to accept and surface the ledger.
- Extend annotation output schema: every priority-1/2 annotation gets a `coachingDelivery` sub-object alongside `rewriteExample`.
- Behind flag `L5_LEDGER_ENABLED`. Off by default.
- Calibration fixture run on 7 essays; assert ledger references appear in annotations and resolve.
- Outcome: per-paragraph annotations now carry citations and dual delivery; v1 surface unchanged.

### M3 — Tier 2 synthesis pass (3–4 days, +$0.018/essay) — *requires M2*
- Implement Tier 2 Sonnet call replacing the existing cross-paragraph synthesis call.
- Produces qualitativeSummary, focusMode (top-3), deferred.
- Behind flag `L5_SYNTHESIS_ENABLED`. Both old cross-para call and new Tier 2 run in shadow during validation.
- Output written to `profile.l5_v2_telemetry`.
- Outcome: full v2 output shape produced; not yet rendered.

### M4 — Manifest adapter (1–2 days, no risk) — *requires M3*
- `l5_v2_to_manifest` adapter: maps `L5FeedbackOutput.surfaces.focusMode[*]` and `surfaces.annotations[*]` into `ImprovementEntry[]`. Preserves existing manifest contract field-for-field.
- Behind flag `L5_V2_TO_MANIFEST`. Off; v1 merger remains live.
- Outcome: flag-on means v2 drives the manifest; flag-off means v1 does. Easy A/B.

### M5 — UI rendering (3–5 days; frontend) — *requires M4 (or shadow)*
- New components for: qualitative summary lede, focus-mode card (with mode toggle), deferred drawer, score accordion.
- Coaching mode toggle in session settings.
- Citation chip rendering: pulls from `CitationLedger.refs`.
- Outcome: end-to-end student-facing experience is renderable behind flag.

### M6 — Shadow A/B against 14-essay calibration corpus (2 days; needs Tue's $6.30 approval) — *requires M3*
- Run v1 and v2 on 14 essays in two halves of 7.
- Manual reviewer labels top-3 per essay (~4 hr human effort).
- Generate comparison CSV + summary.
- Outcome: empirical answer to "is v2 better?"; gates production shadow.

### M7 — Production shadow + flip (1 day to flip; 7 days to monitor) — *requires M6 green*
- 5% production traffic, 7 days.
- Daily metrics review.
- Flip flag for 100% if metrics hold.
- Outcome: v2 is the live L5; v1 deprecated.

### M8 — Conversator seam wiring (when Conversator side ships)
- Wire `groundTruthFacts` slice into Tier 0 resolver and Tier 1 prompt.
- Tier 3 fabrication-guard validator reads the slice.
- Outcome: P0 (fabricated metrics) closes, with the seam clean.

**Blocked by external work**: M8 is blocked by Conversator ground-truth wiring; M5 is partially blocked on annotation-v2-engine availability if the new components aren't already in the existing engine; M6 is blocked on Tue's $6.30 calibration-run approval (over the $5 cap).

---

## 14. Open questions for Tue

These are real product/architecture calls. Each has multiple defensible answers.

### Q1. Default mode for new users — coaching or rewrite?
The synthesis doc recommends coaching as default. But coaching mode generates more friction; if the cohort skews toward students who want fast iteration over learning, the default may hurt more than help. **Decision needed**: do we A/B the default itself in M7's production shadow? Or commit to coaching-default per the research and only let students opt out?

### Q2. Who owns mode-determination signal aggregation — L5 or the chat layer?
This doc proposes the chat layer aggregates and passes `preferredMode` to L5. Alternative: L5 reads `profile.userPreferences` directly. The first is cleaner but requires the chat layer to track rewrite-rejection counts. **Decision needed**: who is the source of truth for "this user has rejected 3 rewrites in a row"?

### Q3. How aggressively should `corpusUnanchored: true` items be dimmed?
Today's bias is to teach what matters whether or not the corpus has an exemplar (Rule 1: tracking, not pre-determining). The UI dimming is the soft form. **Decision needed**: do we go further — allow a setting that hides corpus-unanchored items entirely for power users? Or always show them with a "no exemplar" badge?

### Q4. Should the deferred drawer expose all deferred items or a curated subset?
A polish-phase essay may produce 20+ deferred items. Exposing all could re-create the feedback-overload problem we're solving. **Decision needed**: do we cap deferred at 7 (operational), keep all of them but cluster by dimension, or trust the UI to handle pagination?

### Q5. PROVISIONAL Hopkins-pending voice×archetype cells — should L5 cite them?
The matrix has explicit PROVISIONAL markers on Hopkins-pending cells. LLM-first says cite as evidence with the marker visible. But surfacing PROVISIONAL to students may erode trust ("the system is unsure"). **Decision needed**: cite with marker, cite without marker, or skip provisional cells in student-facing output (keep them in telemetry-only)?

### Q6. Score accordion — collapsed by default for everyone, or only new users?
P3 fix is "scores secondary, not absent." Collapsed-by-default for all users is the cleanest take. **Decision needed**: do power users / returning users get scores expanded by default? (Their relationship to scores is more nuanced.)

### Q7. Calibration A/B budget approval ($6.30, over the $5 cap)
The 14-essay A/B exceeds the cap. **Decision needed**: approve $6.30 for M6, or run only 7 essays at $3.15 (loses statistical power)?

### Q8. What's the contract for "this content conflicts with what you told us"?
For substantive (non-numeric) Conversator conflicts, this doc proposes a UI affordance, not a rewrite. **Decision needed**: should the LLM see substantive conflicts in Tier 1 (so it can avoid amplifying), or only Tier 3 (so it surfaces them post-generation)? The first risks the LLM being timid; the second risks generating then immediately deferring a focus item.

---

## Top-3 architectural risks (with mitigations)

**Risk 1 — Tier 2 synthesis fails to converge on a clean top-3 across phases.** If the Sonnet at Tier 2 over-weights any single signal (always picks L4 priorities; or always picks paragraph-priority annotations), the top-3 becomes monotonic and we lose the redesign's value. *Mitigation*: M6 reviewer-labeled comparison surfaces this directly. The Tier 2 prompt has explicit instruction to balance signals; if M6 shows monotonicity, tighten the prompt with named weighting by signal source. Worst case: revert M3 flag, ship M1+M2 only (citations + dual delivery without ranking change); this is still significant value.

**Risk 2 — Coaching mode generates questions students treat as homework, not coaching.** If the coaching delivery feels like an assignment, students will toggle back to rewrite, defeating P1. *Mitigation*: M5 includes session telemetry that measures "coaching question → student answer" as a primary KPI. M7's production shadow is the gate. If acceptance < 30%, we tune the tone (the synthesis doc has prose examples of good coaching that we anchor against) before flipping.

**Risk 3 — Citation resolution reveals upstream attribution is noisier than expected.** Today's `corpusTelemetry.attribution` is partially exercised; we don't know its real-world fabrication rate at scale. If the rate is high (>10%), the new L5 surfaces empty citation slots regularly, eroding the redesign's perceived specificity. *Mitigation*: M1 ships the resolver standalone; before M2 wires it in, we run the resolver against 30 days of historical telemetry and measure baseline fabrication. If high, the answer is upstream (L3.5 prompt tightening) before downstream (L5 redesign).

## Top-3 highest-ROI first mile markers

1. **M1 — Citation resolver.** Two-day spike, no LLM cost, pure deterministic code, unblocks every other mile marker. Even shipped alone (in advance of M2), it gives us the visibility to run Risk 3's measurement. **First.**
2. **M3 — Tier 2 synthesis pass.** This is where Focus Mode (P2 fix) and qualitative summary (P3 fix) actually land. M2 is necessary plumbing for M3 to be cited; M3 is necessary for the user-visible payoff. The biggest single delta in student-facing experience.
3. **M6 — Shadow A/B against the 14-essay corpus.** The empirical gate. Without M6, we cannot defensibly flip M7. The labeling work (~4 hr human effort) is the only non-engineering cost.

M0/M4/M5/M8 matter but are derivative — M0 is hygiene, M4 is plumbing, M5 is downstream, M8 is gated by another team. M1 + M3 + M6 is the spine.
