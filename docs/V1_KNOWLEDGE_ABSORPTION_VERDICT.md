# V1 Knowledge Absorption Verdict

> **Authoritative execution doc.** Reconciles `docs/V1_KNOWLEDGE_INHERITANCE_AUDIT.md` with the four adversarial reviews (`/tmp/review-adversarial.md`, `/tmp/review-gaps.md`, `/tmp/review-feasibility.md`, `/tmp/review-impact.md`) and independent source verification. Supersedes the original audit's Section 6 port plan. Execute from this doc.

---

## Section 1 — Reconciled Executive Summary

### Top five corrections the reviewers forced on the original audit

1. **V1's coaching layer already absorbs six of the nine "unabsorbed" knowledge libraries.** Adversarial review (`/tmp/review-adversarial.md:5, 147-148`) identified that `src/services/essayIntelligence/coaching/coachingKnowledgeBase.ts:27-66, 330, 352` lazy-imports `CORE_WRITING_PRINCIPLES`, `TYPE_SPECIFIC_PRINCIPLES`, `PERFORMATIVE_INDICATORS`, `TYPE_WEIGHT_CONFIGS`, `PIQ_ISSUE_PATTERNS`, and `ALL_ISSUE_PATTERNS` into runtime prompt blocks via `assembleKnowledgeBlock()`. **Source verified.** The original audit's Section 4 rows 1, 4, 12, and the Section 5 claim that "V1 imports only ONE item from any of voiceProfile/authenticity/storyMining/rag" materially overstate the absorption gap for L6. Bucket C shrinks; several Bucket-C "not absorbed" ports collapse to Bucket B "absorbed but thinner" once the coaching layer is counted.

2. **"19 iterations of workshop validation" is an aspirational source-file comment, not a git-log calibration trail.** Adversarial review (`/tmp/review-adversarial.md:15, 54, 139`): the phrase lives as a header comment in `src/services/piq/weights/dimensionWeights.ts:5-9`. `git log --oneline -- src/services/piq/weights/dimensionWeights.ts` shows two commits, neither labelled calibration. The baseline-weights sum check at `:49-51` has a silent failure path (empty if-block). The original audit's Section 3 claim ("PIQ 13-Dim Rubric … 19 iterations of workshop validation") carried weight-of-evidence authority it does not earn. Every port downstream of this claim (Port 4, Port 10) must be re-justified on content merits, not calibration provenance.

3. **PIQ `issuePatterns.ts` customChecks are dead code — the R&D regex pipeline was never wired.** Adversarial review (`/tmp/review-adversarial.md:14`): `src/services/piq/issuePatterns.ts:17-52` defines `triggerConditions.customCheck: 'check_hook_type_basic'` and similar identifier strings. A repo-wide grep confirms these strings appear only in `issuePatterns.ts` and its type file. No consumer implements the callbacks. The pattern-library value is the **pattern IDs + fix strategies + severity metadata as prompt content**, not a calibrated regex detection engine. This kills the "R&D patterns are battle-tested runtime signals" premise implicit in Port 1.

4. **The 500+ phrase cliché library is consumed by literal regex matching and violates LLM-first Rule 4.** Adversarial review (`/tmp/review-adversarial.md:41-42`): `src/services/commonAppWorkshop/services/semanticClicheAnalyzer.ts:1081-1215` `patternBasedAnalysis` uses `.includes(phrase.toLowerCase())` at lines 1090, 1103, 1116, 1141, 1159. `feedback_llm-first-design.md` Rule 4 explicitly prohibits "regex lists or keyword detection to enforce quality." The original audit's Port 3 recommendation to port 500+ phrases into L1 + L3.5 + L3.75 directly violates the doctrine the audit itself cites in Section 7.

5. **Two entire cognitive systems V1 does not import at all were invisible to the original scope.** Gap review (`/tmp/review-gaps.md:7-19, 25-76, 193-274`): `src/core/rubrics/v1.0.0.ts` (587 lines — source verified) is an 11-dimension rubric with anchor_0 / anchor_5 / anchor_10 anchor sentences, `RUBRIC_INTERACTION_RULES`, adaptive category weights, a Quiet Excellence bonus, and an NQI-gain-based fix ranker; `src/core/analysis/engine.ts` (496 lines — source verified) orchestrates it. `grep "core/rubrics\|core/analysis\|RUBRIC_INTERACTION_RULES\|calculateNQI"` across `src/services/essayIntelligence/` returns **zero files** — source verified. Separately, `src/services/orchestrator/holisticAnalyzer.ts` (204 lines) carries the Spine/Spike/Lift/Blind-Spots/Archetype admissions-officer framework V1's L3.75 does not have. Plus `docs/WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS.md` 5 P0 findings (fabricated-metrics integrity crisis; learned-helplessness rewrites; 2-3 focus-area cap; score-centric UX; ~70% of scoring prompts lack few-shot calibration) and PLAN2's ~20 deep-dive prompt spec are real cognitive assets outside the original scope.

### Reconciled three-bucket distribution

Of the 42 rows in the original audit's Section 4 table (rows 1-42; rows 43-57 are V1-native and out of scope):

| Bucket | Original audit count | Reconciled count | Delta | Reason |
|---|---|---|---|---|
| A — Absorbed & Equivalent | 4 (rows 24, 29, 35, 41) | 8 | +4 | Rows 1, 8, 10 (principles/performative/PIQ-weights via coachingKnowledgeBase), row 12 (PIQ patterns via `getIssuePatternBlock`), row 16 (PIQ vulnerability/word-economy/prompt-metadata blocks already native in V1 coaching) move from B/C → A at the coaching-layer integration level. |
| B — Absorbed but Thinner | 17 | 14 | -3 | Rows that moved to A are no longer "thinner" — they are "absorbed at a single layer, not duplicated across analysis." |
| C — Not Absorbed | 17 (including runtime imports) | 13 | -4 | Runtime imports (rows 37, 38, 39, 40) stay in C. Rows 11 (PIQ prompt-specific weights) and 31 (PS2 institutional weights) stay in C. |
| Deferred (academic / activity-only) | 4 | 4 | 0 | Unchanged. |

Plus **40 gap-hunter additions** triaged in Section 7 below.

### The TRUE Wave-1 backlog

Six ports, not nineteen. Impact review (`/tmp/review-impact.md:186-197`) and feasibility review (`/tmp/review-feasibility.md:200-227`) converge on the same Pareto frontier with minor ordering differences. Executing order:

1. **Port 7 — PIQ Coaching Guardrails** (LAND AS-IS; 16-24 hrs; feasibility agrees — the cleanest port in the P0 set)
2. **Port 9 — voiceProfileService import** (LAND AS-IS; 24-40 hrs; the only port that addresses a cross-essay persistence gap LLM reasoning cannot close)
3. **Port 4 — PIQ 13-Dim Rubric (gated on `essayType==='piq'`)** (LAND AS-IS with anti-clustering extension; 40-56 hrs)
4. **Port 1-RESHAPED — PIQ 41-Pattern Issue Library via new `patternMatches[]` seam** (40-60 hrs; depends on type seam)
5. **Port 2-RESHAPED — SymptomDiagnoser 29-type as `symptomType` on weaknesses + Port 2b L5 role-router** (40-56 hrs; depends on Port 1 seam)
6. **Port 8-RESHAPED — PS2 4-Tier Authenticity + brutal calibration guards at L3.5 (NOT L3.75)** (24-40 hrs)

Fillers shipped between Wave-1 ports if engineer-time is uneven: **Port 3-RESHAPED** (L3.5-only cliché calibration anchors; no L1/L3.75 injection) and **Port 10-RESHAPED** (aiRiskScorer via ProfileIndex signal, not L1 mutation).

Expected scorecard lift: 24-34 points on analysis-depth / teaching-precision / authenticity axes (impact review `:197`), of which ~15-20 are measurable on the current 20-capability scorecard (#3, #6, #8, #14, #15, #16, #17); the rest move axes the current scorecard does not enumerate.

### Architectural pre-requisites (must land BEFORE ports 1, 2, 10)

Detailed in Section 4:
- Type seam: `SentenceAnalysis.patternMatches[]` + `AnalysisPassOutput.paragraphPatternMatches[]` + `SentenceAnalysis.symptomType`
- Type seam: `ProfileIndex.aiRiskSignal`
- Infrastructure: `SYSTEM_PROMPT_VERSION` constant threaded into cache keys
- CI lint: FORBIDDEN-VOCABULARY check on `firstImpressions.ts`, `sequentialDeepWalk.ts`, `holisticSynthesis.ts` so future ports cannot regress the descriptive contracts
- Every closed enum added to V1 output schemas must carry an `open: string | null` escape hatch per LLM-first Rule 3.

### Biggest surprise finding

The adversarial review's discovery that **the coaching layer is V1's real knowledge-inheritance seam, not the analysis layer.** `coachingKnowledgeBase.ts` already implements lazy-load + severity-filter + essayType-gated injection of 6 R&D libraries in a Rule-5-compliant ("soft guidance over hard blocklists") shape. The systematic fix for most Bucket-B rows is **deepen coaching-layer injection (e.g., raise the PIQ pattern severity filter from critical-only-5 to critical+major-10, add Common App patterns when `essayType==='supplement'`, expose `patternId` so L6 can cross-reference L3.5 output)** — which is 2-3 days of work, not the 2-4 week P0 workshop the original audit implied. The analysis-layer ports are still justified for coverage V1 cannot get at L6 (patternId cross-session stability; symptomType routing into L5 rewriteExamples), but the "silent bypass" framing was wrong.

---

## Section 2 — Per-Asset Verdict Matrix

| # | Asset | Source file:line | Bucket | Adversarial verdict | Feasibility verdict | Impact rank | FINAL VERDICT | Reasoning |
|---|---|---|---|---|---|---|---|---|
| 1 | 6 Core Writing Principles | `writingPrinciples.ts:41-300+` | B→A (L6) | Absorbed at L6 already | — | Low | ENHANCE V1-NATIVE | `coachingKnowledgeBase.ts:79-92` renders `reader_effect` per principle. Augmentation shape in Section 6: lift L6 filter from 6 principles to all 6 + add a shorter-form L3.5 block that echoes the principle name only (no reader-effect inflation) via Port 12. |
| 2 | 500+ phrase Cliché Reference Library | `semanticClicheAnalyzer.ts:1080-1500` | B | REJECT | RESHAPE — L3.5 only | Rank 3 | PARTIALLY ABSORB (L3.5 only, ~10 phrases as anchor examples) | Source uses `.includes()` regex matching (Rule 4 violation). L3.75 Mechanism Quality Standard at `holisticSynthesis.ts:447-455` already demonstrates semantic cliché detection. Do NOT port the 500-item list anywhere. Extend L3.5 anchored examples (`analysisPass.ts:367-383`) with 3-5 additional cliché anchors ("delve into," "tapestry," "sparked my passion") as new SCORE-38/52 examples. Skip L1 (descriptive contract) and L3.75 (Mechanism Quality Standard is already doing the work). |
| 3 | 28 Issue Detection Patterns w/ IDs | `issueDetectionPatterns.ts:65-1579` | B (L6) / C (analysis) | See Port 1 | — | — | ABSORB RESHAPED | Already injected at L6 via `getIssuePatternBlock('common_app'\|'supplement')`. Analysis-layer absorption is Port 1 reshape below. |
| 4 | 14-type Weight Matrix | `typeWeightMatrices.ts` | B→A (L6) | See Port 5 | RESHAPE — weights L4, principles L3.5 | — | PARTIALLY ABSORB | `TYPE_WEIGHT_CONFIGS` already consumed at L6 via `getTypeWeightBlock()` at `coachingKnowledgeBase.ts:141-170`. For L3.5/L4: adopt only the `TYPE_SPECIFIC_PRINCIPLES` reader-effect blurbs at L3.5 calibrationReflection (cheap ≤400 tokens); do NOT port the 14-type weight matrix to L4 — per adversarial review `/tmp/review-adversarial.md:69-70` the numbers are hand-tuned without a validation fingerprint and collapse to Rule 1 violation. |
| 5 | 13-College Institutional Tailoring | 13 data files | B | — | LAND AS-IS (file exists) | Rank 10 | DEFER (wave-2) | Defer until Port 8's institutional weight signal is measured in production. Overlay without a scoring-layer signal is decorative. |
| 6 | Anti-Bias Calibration | `antiBiasCalibration.ts` | B | — | — | — | DEFER | V1 anti-clustering + tier classification cover most of the surface. Port specific topic-bias and name-drop-bias rules only if a regression test documents a failure. |
| 7 | Essay Element Detection 9 types | `essayElementDetector.ts` | C | — | BLOCKED — requires L2 output extension | Rank 13 | DEFER (wave-2, blocked on L2 extension) | Add to L2 `structuralCartographer.ts` as `elementType[]` field, not a new L2.7 layer. Only pursue after Port 2 lands — symptomType routing may obviate the element taxonomy. |
| 8 | 7 Performative Indicators | Unverified at time of audit; gap review confirms at `COMMON_APP_WORKSHOP_WRITING_ANALYSIS.md:180-186` | B→A (L6) | — | — | — | ENHANCE V1-NATIVE | Already injected at L6 via `getPerformativeIndicatorsBlock()` at `coachingKnowledgeBase.ts:178-191` (top 4 rendered). Augmentation: render all 7 indicators instead of top-4 slice if token budget allows. |
| 9 | Haiku Diagnosis Stage 0 prompts | `stage0Service.ts` | B | — | — | — | REJECT — LLM-PRODUCIBLE | V1 L1 `firstImpressions.ts` already runs Haiku diagnosis. Content difference is marginal. |
| 10 | PIQ 13-Dim Rubric | `piq/rubric.ts:30-416` | C | REJECT | LAND AS-IS (gated on essayType) | Rank 4 | ABSORB AS-IS | Adversarial rejected on Rule 1 grounds; feasibility landed it AS-IS gated on `essayType==='piq'`. I side with feasibility: the rubric dimensions are PIQ-domain-specific signal Sonnet cannot easily infer, and gating on essayType makes the port zero-impact on non-PIQ paths. Must extend anti-clustering protocol dimension-wise, per feasibility `:74`. |
| 11 | PIQ 8 Prompt-Specific Weight Calibrations | `piq/weights/dimensionWeights.ts` | C | REJECT | LAND AS-IS (under Port 4) | — | PARTIALLY ABSORB | Port only the PRIMARY_DIMENSIONS list per PIQ prompt (prose-level "for PIQ 5 Challenge, emphasize vulnerability + context") — NOT the decimal weight table. Adversarial review `/tmp/review-adversarial.md:53-57` correctly notes: 2-3 percentage-point weight swings are not calibrated and Sonnet zero-shot reasoning from prompt text out-performs them. Reshape = prose guidance block keyed on detected PIQ prompt, inside the Port 4 rubric injection. |
| 12 | PIQ 41-Pattern Issue Library | `piq/issuePatterns.ts:17-1201` | B→A (L6) partially; C at analysis | REJECT for L3.5 | RESHAPE — needs `patternMatches[]` seam | **Rank 1** | ABSORB RESHAPED (via new type seam) | L6 already renders top-5-critical via `getIssuePatternBlock('piq')`. For L3.5: add `patternMatches?: Array<{patternId, evidence, confidence, open: string \| null}>` on `SentenceAnalysis` and `paragraphPatternMatches` on `AnalysisPassOutput` — NOT `improvementCandidate.patternId` per feasibility `:16`. Ship only pattern-ID + one-line trigger in prompt (~60 tokens/pattern × top-15 = ~900 tokens); resolve full templates server-side. `patternId` must be namespaced (`piq:hook-weak-generic`). |
| 13 | Manufactured Vulnerability phrases | `issuePatterns.ts:168-197` | B | — | — | — | ENHANCE V1-NATIVE | Fold into Port 12 (PIQ pattern library includes these); L3.75 Mechanism Quality Standard gets 2 additional anchor examples ("vulnerability is a strength," "asking for help isn't weakness" — kept as negative exemplars, not a library). |
| 14 | Essay-Speak + AI-Pattern regex libraries | `issuePatterns.ts:541-665` | B | — | — | — | REJECT — CONTRACT VIOLATION | Regex-driven pattern matching; Rule 4 violation. Subsumed by Port 12's pattern-ID approach (the content flows through prompt as ID triggers, not runtime regex). |
| 15 | PIQ Teaching Examples (20 of 80) | `piq/teachingExamples.ts` | C | — | — | — | NEEDS NEW SOURCE (wave-2 after RAG) | 80 examples is a corpus, not prompt content. Wire via Port 16 (RAG retrieval keyed on symptomType/patternId) once the retrieval layer ships. Don't inline. |
| 16 | PIQ Chat Coaching Guardrails (5-step, GOOD/BAD sensory pairs, UC Values) | `piqWorkshop/piqChatService.ts:61-417` | B | STANDS | LAND AS-IS | **Rank 2** | ABSORB AS-IS | Best port in the P0 set. Negative-exemplar anchor pattern ("bleach and citrus" vs "olfactory tapestry") matches V1's existing L3.5 anchored-score pattern. Soft Guidance (Rule 5). |
| 17 | Word Economy Framework with math | `piqChatService.ts:169-200` | B→A (L6) | — | LAND AS-IS | Rank 9 | ENHANCE V1-NATIVE | `coachingKnowledgeBase.ts:285-314` already renders `getPIQWordEconomyBlock()` with tiered strategy + cut priority hierarchy + bad-cut/good-cut examples. Augmentation: consume `coaching/lengthCalibrator.ts` (already exists) and thread the math into L5 ACTION-mode rewrites. |
| 18 | 3-Tier Quality Standards | `piqChatService.ts:240-261` | B | — | — | — | REJECT — CONTEXT MISMATCH | V1's 5-tier (`analysisPass.ts:454-464`) is equivalent-or-better. Adding PIQ's 3-tier creates dual-taxonomy drift (feasibility `:133`). |
| 19 | PIQ Voice + Experience Fingerprint | `piqChatContext.ts:105-147` | B | — | — | — | DEFER | Voice handled by Port 9 (persisted voiceProfileService). Experience Fingerprint handled by Port 6 reshape. |
| 20 | Narrative VoiceFingerprint analyzer | `voiceFingerprintAnalyzer.ts` | B | — | — | — | REJECT — LLM-PRODUCIBLE | V1's voiceMap + voiceIdentity + voice dimensions in L3.75 subsume this. The "AVOID generic labels" forcing function is worth porting as 1 prompt line — not a port, a prompt edit (wave-2 polish). |
| 21 | ExperienceFingerprint — 6 vectors + 4 flags + qualityAnchors + divergenceRequirements | `experienceFingerprintAnalyzer.ts:27-185` | C | RESHAPE | RESHAPE — split across 4 layers | Rank 12 | PARTIALLY ABSORB | Ship ONLY `qualityAnchors: [{sentence, whyItWorks, preservationPriority}]` onto L3.5's existing `strengthSignatures` field (`analysisPass.ts:561`). This addresses a real V1 infrastructure gap (L6 coaching has no "do not touch" signal). Skip the 6 uniqueness vectors (closed-taxonomy risk; L3.75 descriptive substrate via `distinctivenessFactors` already covers), the 4 antiPatternFlags (move to L3.5 `paragraphPatternMatches` under Port 12 if needed), and `divergenceRequirements` (prescriptive; belongs in L5/L6, wait for consumer). Do NOT touch L3.75 per feasibility `:100-107`. |
| 22 | SymptomDiagnoser 29-type taxonomy | `symptomDiagnoser.ts:29-177` | C | RESHAPE | RESHAPE — Port 2a + Port 2b | Rank 2 | ABSORB RESHAPED (2a: enum on weaknesses; 2b: L5 role-branched router) | Per adversarial `:30-34`: the 29-type "taxonomy" is an LLM prompt, and the "WHY IT FAILS" research citations (Harry Bauld, 8-second attention window, peak-end rule) are the real cognitive content. Port 2a: add `weaknesses[].symptomType?: SymptomType` with an `open: string \| null` escape hatch on the inline schema. Port 2b: L5 `deepAnnotationService.ts` gains paragraphRole-branched prompt composition (9 opening archetypes / 14 closing archetypes fire only when `paragraphRole='opening'\|'closing'`). Split into two PRs. |
| 23 | missing_elements schema | `symptomDiagnoser.ts:148-162` | C | PROMOTE (adversarial `:156-157`) | — | — | ABSORB AS-IS | Positive schema (what's missing: sensory_details/concrete_objects/micro_moment/emotional_truth) — LLM-first compatible. Fold into L5 ACTION-mode content template. |
| 24 | Workshop 3-Layer Teaching | `narrativeWorkshop/stage2-5/` | A | — | — | — | REJECT — V1 EQUIVALENT | V1's AWARENESS/CONSEQUENCE/CONNECTION/ACTION is a cleaner articulation. |
| 25 | Activity 5-Dim Scoring Rubric | `stage1ContextAwareAnalysisService.ts` | C | — | — | — | DEFER (activity-essay only) | Not relevant to core essay pipeline. |
| 26 | Activity Authenticity Voice | `activityWorkshop/scoring/` | B | — | — | — | REJECT — V1 EQUIVALENT | L3.75 voiceMap covers. |
| 27 | Activity 7-Cat Feature Extraction | `activityWorkshop/` | C | — | — | — | DEFER (activity only) | — |
| 28 | Activity Scoring Types | `activityWorkshop/types.ts` | C | — | — | — | DEFER (activity only) | — |
| 29 | Activity 4-Stage Teaching | `stage0-3 services` | A | — | — | — | REJECT — V1 EQUIVALENT | — |
| 30 | PS2 4-Tier Authenticity Rubric | `authenticityVoiceAnalyzer.ts:82-250` | B | RESHAPE | RESHAPE — L3.5 only | Rank 5 | ABSORB RESHAPED | Port tier + NQI to L3.5 as new essay-level field `essayAuthenticityTier` (feasibility `:131-134`). Do NOT touch L3.75 — `narrativeQualityIndex: 0-100` is a score and violates the descriptive contract. Port the "Red Flags for Grade Inflation" + "10,000 applications test" framing into L3.5 `calibrationReflection` prompt per adversarial `:105-106` — these are Anti-Clustering-Protocol-style calibration guards, exactly L3.5's calibrated lane. |
| 31 | PS2 Institutional Weight Calibration (UCLA 30% / Berkeley 20%) | `authenticityVoiceAnalyzer.ts:82-97` | C | REJECT (unless institution-scoped) | RESHAPE — L6 only | — | PARTIALLY ABSORB (L6 overlay only, institution-gated) | Port only when `targetInstitution === 'UCLA' \| 'Berkeley'` into L6 coaching overlay. Not runtime scoring. Adversarial `:104`. |
| 32 | PS2 brutal calibration guards + 10,000 applications test | `authenticityVoiceAnalyzer.ts:222-248` | B | — | LAND (inside Port 8 retarget) | — | ABSORB AS-IS (inside Port 8 retarget) | Folded into Port 30 above. |
| 33 | Academic Conversational Capability | `conversational/` | C | — | — | — | DEFER (academic, not essay) | — |
| 34 | Academic Identity Generation | `deepAcademicReport/` | C | — | — | — | DEFER (academic, not essay) | — |
| 35 | Academic Context Assembly | `deepAcademicReport/contextAssembly/` | A | — | — | — | REJECT — V1 EQUIVALENT | `analysisContextBuilder.ts`. |
| 36 | Academic Genuine Interest Detection | `conversational/` | C | — | — | — | DEFER (academic, not essay) | — |
| 37 | voiceProfile runtime | `voiceProfile/*` | C | STANDS | LAND AS-IS | Rank 6 | ABSORB AS INFRASTRUCTURE | Import `voiceProfileService.getProfileForUser(userId) → StudentVoiceProfile \| null` into L3.75. Frame as "PRIOR OBSERVATION" not "DESIRED VOICE" per feasibility `:146`. Persistence write must be non-blocking. |
| 38 | aiRiskScorer runtime | `authenticity/aiRiskScorer.ts` | C | REJECT (adversarial) | RESHAPE — ProfileIndex seam | Rank 7 | ABSORB RESHAPED (as ProfileIndex signal) | Conflict: adversarial rejects as Rule-4 antipattern + known ESL false positives; feasibility reshapes to `ProfileIndex.aiRiskSignal` consumed by L3.75. Arbitration: feasibility wins, because (a) L3.75 already does `authenticVsPerformed` — the aiRiskScore as a *prior with an explicit framing* ("diagnostic prior, not ground truth" per feasibility `:161`) helps calibrate the existing Sonnet call rather than replacing it, and (b) ESL false positives are mitigated by the prior-not-label framing. Ship behind `ENABLE_AI_RISK_SIGNAL` flag with 2-week A/B on ESL-subset essays before default-on. |
| 39 | storyMining runtime | `storyMining/storyMiningService.ts` | C | — | RESHAPE | Rank 14 | DEFER (wave-2) | Primary consumer is pre-draft brainstorming (already handled). Analysis-layer consumer is marginal; ship only if moment-earnedness regression is measured. |
| 40 | rag runtime | `rag/ragService.ts` | C | — | BLOCKED on namespace | Rank 8 | NEEDS NEW SOURCE (wave-2) | Depends on Port 1 (patternId = retrieval key) + Port 2a (symptomType = retrieval key). Seed the corpus per `/tmp/review-gaps.md:92-93` (500+ fragments from Common App + PIQ + Activity) as a wave-2 data migration. |
| 41 | InlineEditor 15 command prompts | `commandPrompts.ts:176-620` | A | — | — | — | ENHANCE V1-NATIVE | Consumed downstream. Wave-2 structural port: L5 `deepAnnotationService.ts` dispatches one of the 15 commands per improvementCandidate (`/tmp/review-gaps.md:93-94`). |
| 42 | InlineEditor BANNED_TERMS | `commandPrompts.ts:57-130` | B | — | — | — | ENHANCE V1-NATIVE | L1 banned list + inlineEditor BANNED_TERMS have ~15% overlap (original audit Non-obvious Finding 1 `:884-887`). Keep the split — do NOT merge. |

### Rows 43-57 — V1-native wins (preservation checklist)

Every Wave-1 port must pass the non-erasure checks for these 15 V1-native capabilities. See Section 8.

### Gap-hunter additions (rows 58+) — see Section 7 for full triage

Top-level summary:
- **Promote to Wave-1 (new P0)**: 5 Critical Findings from WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS (fabricated-metrics guard, coaching-mode default, 2-3-item Focus Mode, de-emphasize scores, 5-shot calibration examples on every scoring prompt). These are cheap prompt-level changes with documented research backing.
- **Wave-2**: 11-dim rubric anchor_0/5/10 (Port from `src/core/rubrics/v1.0.0.ts:137-500`), RUBRIC_INTERACTION_RULES, HolisticAnalyzer Spine/Spike/Lift, 6-Arc taxonomy, 10-Beat decomposition, Specificity Gradient / Scene-Summary / Show-Tell signals, Hook-Tier / Ending-Tier classification, Committee Room Test / memorabilityAnalyzer, Subtext Analysis, Emotional Journey Typing.
- **Needs research**: Edit-Response Learning, Essay DNA Comparative Engine, Metacognitive Coaching, Strategy Fit Analyzer.
- **Reject**: 2 new dimensions (Memorability, Agency) proposed in R4 — premature before Wave-1 validates existing rubric. Over-porting risk.

---

## Section 3 — The TRUE Wave-1 Backlog

Ordered by ship sequence (after prerequisites). Every port must pass the Section 8 V1-native preservation checklist in PR review.

### Wave-1a — Ship independently (no type-seam dependency)

#### Port A1 — PIQ Coaching Guardrails → L6 (was Port 7)
**Status: shipped in #20** (commit `fc42171`, merged to main as `4a6f3fb`). Block slot `A1_COACHING_GUARDRAILS@v1.0.0` (prescriptive). 5 content blocks extracted from `piqChatService.ts:61-417` and threaded into L6 via `promptBlocks.piqGuardrailsBlock`, +243 LOC.
- **Target V1 file:line**: `src/services/essayIntelligence/coaching/promptBlocks.ts` (add 4-5 new blocks); `coaching/coachingService.ts` to thread them into the Sonnet deepening prompt.
- **CORRECTED port shape**: verbatim port of `GOOD_BAD_SENSORY_PAIRS`, `VOICE_FINGERPRINT_PRESERVATION`, `QUALITY_ANCHOR_PROTECTION`, `FIVE_STEP_COACHING_STRUCTURE`, `UC_VALUES` blocks from `piqWorkshop/piqChatService.ts:61-417`. Each block tagged with `phase: ImprovementPhase[]` so the Coaching Planner can filter. Render as examples inside existing coaching blocks, not as separate taxonomy.
- **User-visible dimension**: Coaching quality; prevents coach from over-correcting already-good sentences (Quality Anchor Protection); Voice Fingerprint Preservation prevents flowery push onto terse writers.
- **Failure-case essay archetype**: Student PIQ 1 draft with "bleach and citrus filled the air" — V1 today might suggest embellishment. Ported: QAP fires, coach says "this line is working — preserve it, expand around it."
- **Size**: 16-24 hrs (2-3 days).
- **Dependencies**: None.
- **Measurement plan**: 30 coaching turns, blind A/B. Target: ported wins 65%+. Sensory-pair anchoring test: does the ported coach avoid over-correcting quality anchors? (acceptance: 90%+).
- **Rollback**: Remove the 4-5 new block imports from `coachingService.ts`. No schema change.

#### Port A2 — voiceProfileService import → L3.75 (was Port 9)
**Status: shipped in #21** (commit `68f55ef`, merged to main as `15f4e21`). Block slot `A2_VOICE_PRIOR@v1.0.0` (descriptive — lint-scanned, 0 violations). Injected into L3.75 **user prompt** (not system prompt) — preserves shared-cache hotness; per-user prior fragmentation is unavoidable either way. New `priorVoiceBlock.ts` (+143) + orchestrator fire-and-forget persistence (+102) + test (+207). 31/31 smoke assertions.
- **Target V1 file:line**: `src/services/essayIntelligence/analysis/holisticSynthesis.ts:242-472` (Phase A preamble); new import in `analysisOrchestrator.ts`.
- **CORRECTED port shape**: resolve `voiceProfileService.getProfileForUser(userId)` → `StudentVoiceProfile | null` before L3.75 call. Inject as "PRIOR OBSERVATION (from earlier essays): register = {{primary}}, sentence-length-variety = {{variety}}, signature phrases = [...]. This essay may deviate — that is context, not a constraint." Post-L3.75: persist derived voiceIdentity/voiceMap back via non-blocking write.
- **User-visible dimension**: Cross-essay voice consistency (scorecard #3, 3/5 → 4/5); drift detection fires when essay #3 is written in a deliberately different voice.
- **Failure-case essay archetype**: Student writes Common App in authentic jumpy present-tense voice; PIQ #3 V1 today flags the same voice as "informal / drift" because essay #1 voice isn't persisted.
- **Size**: 24-40 hrs (3-5 days + migration).
- **Dependencies**: None — `voiceProfileService` already exists. Verify the service returns `open` / freeform fields rather than closed enums per feasibility `:146`.
- **Measurement plan**: 3-essay journey for 5 test students; metrics (a) voice-dimension stability ≥80% run-to-run when writing is consistent, (b) drift detection fires ≥80% when essay #3 deliberately differs, (c) L3.75 references priorVoiceProfile in ≥50% of essays-after-#1.
- **Rollback**: Feature flag `ENABLE_VOICE_PROFILE_IMPORT`. Pre-analysis import skip becomes a no-op.

#### Port A3 — PIQ 13-Dim Rubric (gated on essayType) → L3.5 + L4 (was Port 4)
**Status: shipped in #22** (commit `7055cda`, merged to main as `467313e`). Block slot `A3_PIQ_RUBRIC@v1.0.0` (evaluative — lint-exempt). New `rubrics/piqRubric.ts` re-exports PIQ_RUBRIC_DIMENSIONS + derives `PRIMARY_DIMENSIONS_BY_PIQ` from `emphasis==='high'` entries. `SentenceAnalysis` + `AnalysisPassOutput.sentenceAnalyses[]` + `ParagraphScoreEntry` gain `piqDimensions` + `piqDimensionsOpen` (OpenEnum escape hatch per Rule 3). Anti-clustering extended dimension-wise. Decimal weight tables NOT ported per §5 rejection. 55/55 smoke assertions.
- **Target V1 file:line**: new `src/services/essayIntelligence/rubrics/piqRubric.ts`; `analysis/analysisPass.ts` prompt-composition branch; `analysis/crystallizer.ts:273-284` ScoreMatrix.
- **CORRECTED port shape**: conditional on `essayType === 'piq'`. Per-sentence schema gains optional `piqDimensions?: Record<PIQRubricDimension, number> | null` with `open: string | null` escape hatch. PRIMARY_DIMENSIONS (prose) per PIQ prompt shipped in Port A3 scope; decimal weight overrides NOT shipped (rejected per adversarial review). Anti-clustering protocol at `analysisPass.ts:448-466` extended to enforce dimension-wise differentiation across 13 dims.
- **User-visible dimension**: PIQ essays finally score differently per prompt — Challenge PIQ weights vulnerability-authenticity, Leadership PIQ weights role-clarity.
- **Failure-case essay archetype**: UC PIQ 5 "challenge" scoring identically to PIQ 1 "leadership" in V1 today.
- **Size**: 40-56 hrs (1 week).
- **Dependencies**: None. Requires `essayType` + `piqPromptType` discriminator to reach L3.5 (verify `ProfileIndex` has `piqPromptType`; if not, add to seam Wave-1b).
- **Measurement plan**: 16 PIQ essays (2 per prompt 1-8). Metrics (a) per-prompt top-3-weakness differentiation ≥50%, (b) human blind eval: ported coaching sounds "this is specifically a Challenge PIQ" at 70%+.
- **Rollback**: `essayType !== 'piq'` bypasses entirely; feature-flag toggle on PIQ path.

### Wave-1b — Architectural pre-requisites (must land before Wave-1c)

See Section 4 for details. Ship as one bundled PR.

### Wave-1c — Ports dependent on type seams

#### Port B1 — PIQ 41-pattern + Common App 28-pattern Issue Library via `patternMatches[]` seam (was Port 1 RESHAPED)
- **Target V1 file:line**: `src/services/essayIntelligence/analysis/analysisPass.ts:499-545` (weaknesses + new patternMatches field in the output schema + the "KNOWN PATTERN CATALOG" prompt block); new `src/services/essayIntelligence/taxonomies/issuePatternIndex.ts`.
- **CORRECTED port shape** (per feasibility `:22-35`):
  - New `taxonomies/issuePatternIndex.ts` exports `PATTERN_INDEX: Map<string, PatternSummary>` where `PatternSummary = { id, dimension, severity, oneLineTrigger, sourceEssayTypes }`. No fix templates in this file.
  - New type fields in `profileManager/types.ts`:
    ```ts
    interface SentenceAnalysis {
      // ... existing
      patternMatches?: Array<{
        patternId: string;         // e.g. "piq:hook-weak-generic"
        evidence: string;          // quoted span from sentence
        confidence: number;        // 0..1
        open: string | null;       // escape hatch per LLM-first Rule 3
      }>;
    }
    interface AnalysisPassOutput {
      // ... existing
      paragraphPatternMatches?: Array<{
        patternId: string;
        scope: 'sentence' | 'paragraph' | 'essay';
        evidence: string;
      }>;
    }
    ```
  - L3.5 prompt gains a "KNOWN PATTERN CATALOG (reference only — emit ID + cite text; say `open` if none fit)" block ~900 tokens (15 IDs × ~60 tokens each, filtered by essayType).
  - Full pattern templates (problemTemplate, whyMattersTemplate, fixStrategies) attached server-side at L5 via `patternId` lookup — NOT in the L3.5 prompt.
  - `improvementCandidate` schema UNCHANGED. Pattern diagnosis flows through patternMatches; only truly localized single-sentence patterns also emit an improvementCandidate.
- **User-visible dimension**: Repeatable diagnoses ("PATTERN PIQ-VUL-03 manufactured-vulnerability") instead of freeform "this feels generic." Cross-session: student sees same patternId across two essays and recognizes the repeated failure mode.
- **Failure-case essay archetype**: PIQ 5 with "failure is an opportunity" + "through this challenge I came to realize." V1 today: both flagged as freeform generic. Ported: both flagged as `piq:vulnerability-manufactured-insight-template` with fix strategy via L5 server-side lookup.
- **Size**: 40-60 hrs (3-5 days engineering + 1-2 days tests).
- **Dependencies**: Wave-1b type seams. Pattern-ID namespacing (`piq:*`, `common_app:*`). No conflict with Port A1.
- **Measurement plan**: 10-essay regression. Targets: (a) ≥60% of weaknesses carry a patternId (vs freeform), (b) ≥80% patternId stability run-to-run on unchanged text, (c) human blind eval: patternId diagnosis wins 70%+ vs freeform.
- **Rollback**: `ENABLE_PATTERN_LIBRARY` flag skips prompt block and output field stays empty. L3.5 degrades to freeform weaknesses[] — identical to pre-port behavior.

#### Port B2 — SymptomDiagnoser 29-type as `symptomType` on weaknesses + L5 role-router (was Port 2 SPLIT)

**Port B2a — symptomType enum on weaknesses:**
- **Target V1 file:line**: `src/services/essayIntelligence/analysis/analysisPass.ts:537-539`.
- **CORRECTED port shape**: extend `weaknesses: ObservationEntry[]` with `symptomType?: SymptomType | null` where SymptomType is a TS string-literal union. The 29 types render as one-line definitions in the L3.5 prompt (~900 tokens cached). "WHY IT FAILS" rationales + Harry Bauld / peak-end-rule citations ported as L5-layer lookup content, not in the L3.5 prompt. `open: string | null` escape hatch required.
- **User-visible dimension**: Opening and ending analysis quality. Named archetypes for the two highest-leverage paragraphs.
- **Failure-case essay archetype**: "Webster's dictionary defines resilience as..." — V1 today "generic" effectiveness 35. Ported: `symptomType: dictionary_definition_opening` + AO reaction citation; L5 generates scene-opening rewrite.
- **Size**: 24-32 hrs.
- **Dependencies**: Port B1 (shares prompt catalog formatting conventions; patternMatches + symptomType must be cleanly disambiguated in the prompt — patternMatches = R&D library match; symptomType = cross-dimensional failure taxonomy).

**Port B2b — L5 role-branched prompt router:**
- **Target V1 file:line**: `src/services/essayIntelligence/analysis/deepAnnotationService.ts:807-952`.
- **CORRECTED port shape**: `deepAnnotationService.ts` gets a prompt-block composition function that branches on `paragraphRole: 'opening' | 'closing' | 'body' | ...` → inject the 9 opening archetypes (only when opening) or 14 closing archetypes (only when closing). This is a structural change, not a single prompt edit — feasibility `:45-46` is correct that the Section-6 audit hand-waved this.
- **Size**: 16-24 hrs.
- **Dependencies**: Port B2a landed; `ParagraphUnderstanding.role` reaching L5 (already does via profile propagation).

Total Port B2: 40-56 hrs.

- **Measurement plan (both sub-ports)**: 20 essays split weak-opening/strong-opening. (a) Weak-opening detection ≥85% (vs baseline ~50%), (b) specific-archetype-naming ≥70%, (c) strong-opening false-positive ≤10%, (d) L5 rewrite quality blind eval: archetype-referenced rewrites more actionable 70%+.
- **Rollback**: `ENABLE_SYMPTOM_TAXONOMY` skips both sub-ports.

#### Port B3 — PS2 4-Tier Authenticity + Brutal Calibration Guards → L3.5 only (was Port 8 RESHAPED)
- **Target V1 file:line**: `src/services/essayIntelligence/analysis/analysisPass.ts:458-466` (inter-essay calibration block) + new essay-level field `essayAuthenticityTier` on `AnalysisPassOutput`.
- **CORRECTED port shape**: Do NOT touch `holisticSynthesis.ts:572-576` — `narrativeQualityIndex: 0-100` is a score and violates L3.75 descriptive contract. Add new field `essayAuthenticityTier: 'distinctive'|'authentic'|'emerging'|'manufactured' | null` + `narrativeQualityIndex: number | null` on `AnalysisPassOutput`. Inject PS2 "Red Flags for Grade Inflation" DONT's and the "10,000 applications test" into L3.5 `calibrationReflection` prompt as Anti-Clustering-Protocol-style calibration guards. Institutional weight calibration (UCLA 30% / Berkeley 20%) moves to L6 coaching overlay, institution-gated (Port 5 / Row 31 above).
- **User-visible dimension**: Admissions realism. poolDensity distributes bimodally instead of clustering at "moderate."
- **Failure-case essay archetype**: UCLA-targeted sports-injury-comeback. V1 today: "poolDensity: common, engage intentionally." Ported: "authenticityTier: manufactured; NQI: 52; specific red flags: AUTHENTIC_ARC_FORMULA trigger."
- **Size**: 24-40 hrs (3-5 days).
- **Dependencies**: None. Can ship in parallel with B1/B2 (feasibility `:222`).
- **Measurement plan**: 20 essays. (a) poolDensity distribution becomes bimodal vs monomodal cluster, (b) Spearman ρ ≥ 0.6 between ported tier and human reviewer tier, (c) UCLA/Berkeley-directed coaching references institutional weighting ≥80% (deferred to Port 5 Row 31 L6 overlay).
- **Rollback**: `ENABLE_PS2_AUTHENTICITY_TIER` — new fields emit null; L3.5 calibration reflection reverts to prior prompt.

### Filler ports (ship between Wave-1 as engineer-time allows)

#### Port F1 — Cliché Library Anchor Extension at L3.5 only (was Port 3 RESHAPED)
- **Target V1 file:line**: `src/services/essayIntelligence/analysis/analysisPass.ts:367-383` (anchored examples); new `essayIntelligence/taxonomies/clicheLibrary.ts` (data only, not injected whole).
- **CORRECTED port shape**: create `clicheLibrary.ts` re-exporting the CLICHE_REFERENCE categories for downstream consumers (L5 ACTION-mode rewrites may cite the library). In L3.5, add 3-5 additional anchor examples to the SCORE 38 / SCORE 52 band ("delve into," "tapestry," "sparked my passion" as SCORE 38; stock-metaphor + "profound impact" as SCORE 52). Optionally: L1 gains descriptive marker `notablePhrases[].matchesWellKnownCorpus: 'opening_cliche' | 'ai_convergence' | 'essay_cliche' | null` — purely observational, no evaluation. No port to L3.75 (Mechanism Quality Standard already handles).
- **Size**: 16-24 hrs.
- **Dependencies**: None.
- **Measurement plan**: 30 essays. Baseline 86-phrase coverage ~15%; ported (via LLM semantic match guided by anchors) target ~80% true-positive with ≤5% false-positive in-context.
- **Rollback**: Keep current L3.5 anchors; library file remains for future consumers.

#### Port F2 — aiRiskScorer via ProfileIndex signal (was Port 10 RESHAPED)
- **Target V1 file:line**: `src/services/essayIntelligence/profileManager/types.ts` (add `ProfileIndex.aiRiskSignal`); `holisticSynthesis.ts:425-431` (INTENTIONALITY CALIBRATION block extended with "if aiRiskScore > 0.6, default intentionality to 'unintentional' absent strong textual evidence").
- **CORRECTED port shape**: aiRiskScorer runs once per essay at analysis start → writes `ProfileIndex.aiRiskSignal: { score: number, notes: string }`. L3.75 READS the signal — does not mutate it. L1 stays untouched (contract violation risk).
- **Size**: 16-24 hrs.
- **Dependencies**: Wave-1b seam (`ProfileIndex.aiRiskSignal`). Verify aiRiskScorer return shape.
- **Measurement plan**: 20 essays (10 known-human, 10 AI-assisted detectable). (a) authenticVsPerformed agreement with aiRiskScorer label pre/post. (b) ESL-subset false-positive ≤ 5%. (c) Bimodal distribution of authenticVsPerformed after port.
- **Rollback**: `ENABLE_AI_RISK_SIGNAL` — if ESL false-positive rate exceeds threshold, flip off.

### Promoted-from-gap-hunter Wave-1 ports

#### Port G1 — Fabricated-Metrics Anti-Fabrication Guard across all generative prompts
- **Target V1 file:line**: L5 `deepAnnotationService.ts:807-952`; L6 `coaching/promptBlocks.ts`; L5 ACTION-mode rewriteExample emission.
- **CORRECTED port shape**: Repository-wide enforcement that **any numeric detail (percentages, headcounts, dollar amounts, specific durations) in LLM-generated example text MUST be wrapped in `[brackets]` unless the value is literally present in the student's essay.** Pattern matches the existing inlineEditor `[X]` convention (`commandPrompts.ts:195-197`). Add as a FINAL CHECK self-audit line in every prompt that emits example prose.
- **Rationale**: `/tmp/review-gaps.md:199-201` → "A student submitting fabricated statistics on a college application is an integrity violation that could result in rescission." Safety + legal priority P0.
- **Size**: 8-16 hrs.
- **Dependencies**: None.
- **Measurement plan**: Audit 100 generated rewrites pre/post port. Post-port: 0% unbracketed fabricated metrics. Regression test fixture with a weak essay whose rewrite would naturally want to fabricate metrics; asserts brackets present.
- **Rollback**: Comment out the FINAL CHECK lines. Low risk.

#### Port G2 — Focus Mode (2-3 focus areas max per session) at L5
- **Target V1 file:line**: `src/services/essayIntelligence/improvements/improvementCandidateStore.ts`; L5 `deepAnnotationService.ts`.
- **CORRECTED port shape**: At L5 finalization, cap annotations surfaced to the student to top 2-3 by ROI (priority × improvement-phase alignment). Full emission remains in the store (preserves Rule 2 — never discard paid LLM output) but the UI layer only reads the top 2-3. Add `visible: boolean` flag on emitted annotation.
- **Rationale**: `/tmp/review-gaps.md:207-209` → "Beyond 2-3 focus areas per session, implementation rates drop to near-zero." Sommers 1982 + cognitive load theory + writing center consensus.
- **Size**: 16-24 hrs.
- **Dependencies**: None. Respects Rule 2 (infrastructure, not discard).
- **Measurement plan**: Session-level engagement metric: student acts on focused-mode annotation at rate ≥ X% vs current rate. Requires UX instrumentation.
- **Rollback**: `ENABLE_FOCUS_MODE` — show all annotations (current behavior).

#### Port G3 — Few-Shot Calibration Examples on every scoring prompt
- **Target V1 file:line**: Audit every V1 scoring prompt (L3.5 `analysisPass.ts`, L4 `crystallizer.ts` ScoreMatrix, L3.75 assessments with numeric output). Ensure each has 3-5 weak/strong pairs with score + rationale, matching the quality bar of `analysisPass.ts:367-383`.
- **Rationale**: `/tmp/review-gaps.md:217` → "~70% of prompts lack calibration examples. The description scoring service has 5 calibration examples and is the best prompt in the codebase."
- **Size**: 24-40 hrs (prompt authoring is the critical path).
- **Dependencies**: None. Reuse the V1-native anchored-example pattern — this is V1's own win applied consistently.
- **Measurement plan**: Score distribution variance test. Pre-port: mid-band compression (55-75 cluster). Post-port: meaningful 30-95 range.
- **Rollback**: Revert prompt changes. Each prompt ships with its own flag.

### Sequencing summary

```
Wave-1a (parallel, no seam deps):   Port A1 (2-3d) | Port A2 (3-5d) | Port A3 (1w) | Port G1 (1-2d) | Port G2 (2-3d) | Port G3 (3-5d)
Wave-1b (type seams):                Type seam PR (1-2d)
Wave-1c (after Wave-1b):             Port B1 (3-5d) → Port B2a (2-3d) → Port B2b (2-3d)
                                     Port B3 (3-5d) in parallel with B1/B2
Fillers:                             Port F1 (2-3d) | Port F2 (2-3d) — ship as engineer-time allows
```

Critical gates between waves: (a) CI FORBIDDEN-VOCABULARY lint on L1/L3/L3.75 prompts passes, (b) anti-clustering + novelty-driven-growth regression suite passes, (c) L3.5 cache-hit rate on unchanged-essay reruns ≥95%, (d) Focused Analysis mode handles new type seams without crashing.

---

## Section 4 — Architectural Pre-requisites

These must land BEFORE Ports B1, B2, F2.

### Pre-req 1 — Type seams on `SentenceAnalysis` and `AnalysisPassOutput`

- **What**: Add optional fields per the interface snippets in Port B1 and Port B2 above. Every new enum field carries an `open: string | null` escape hatch.
- **Where**: `src/services/essayIntelligence/profileManager/types.ts` (main types file); wire through analysis/analysisPass output parser; update profile mutators that consume `SentenceAnalysis`.
- **Why**: Without `patternMatches[]` and `paragraphPatternMatches[]`, Port B1 would be forced through the wrong channel (`improvementCandidate.patternId`) and regress V1's sentence-scope-vs-architectural-scope separation (feasibility `:16`). Without `symptomType`, Port B2 has nowhere to land its enum.
- **Size**: 8-16 hrs.

### Pre-req 2 — `ProfileIndex.aiRiskSignal`

- **What**: Add `aiRiskSignal: { score: number, notes: string, confidence: number } | null` to `ProfileIndex`.
- **Where**: `profileManager/types.ts` + `profileManager/index.ts` (or wherever ProfileIndex is computed).
- **Why**: Port F2's aiRiskScorer signal must live at essay level, not L1-output level (feasibility `:157-158`).
- **Size**: 4-8 hrs.

### Pre-req 3 — `SYSTEM_PROMPT_VERSION` cache-key threading

- **What**: Introduce a `SYSTEM_PROMPT_VERSION = 'v1.3.0'` constant. Thread it into the cache-key on every `callClaudeWithRetry` call that uses prompt caching. Bump on any system-prompt edit.
- **Where**: `src/lib/llm/claude.ts` (cache-key builder) + every call-site in V1 that uses cached system prompts (L3, L3.5, L3.75, L4, L5 — start from `grep "cache_control" src/services/essayIntelligence/`).
- **Why**: Ports B1, B2, B3, F1, G3 all edit cached system prompts. Without an explicit version key, a deploy invalidates the cache across all in-flight essays in flight, causing a cost spike and silent prompt drift. Feasibility `:181`.
- **Size**: 8-16 hrs.

### Pre-req 4 — CI FORBIDDEN-VOCABULARY lint

- **What**: A test in `tests/test-descriptive-contract-lint.ts` that reads `firstImpressions.ts`, `sequentialDeepWalk.ts`, `holisticSynthesis.ts` and greps the PROMPT STRING CONSTANTS for the existing FORBIDDEN VOCABULARY list (`effective, strong, weak, compelling, clichéd, ...`). Fails CI if any evaluative word appears in the prompt text outside the FORBIDDEN list declaration itself.
- **Where**: `tests/` + `.github/workflows/` hook.
- **Why**: Multiple P0 ports (3, 5, 6, 8) as originally written would have injected evaluative/prescriptive content into L1/L3/L3.75 prompts (feasibility `:191-193`). A lint catches any future regression mechanically.
- **Size**: 8-12 hrs.

### Pre-req 5 — `open: string | null` convention in JSON schemas for closed-enum emissions

- **What**: A V1-wide convention: any output schema field that constrains LLM output to an enumerated set (symptomType, patternId, essayAuthenticityTier, mode, etc.) MUST also expose an `open: string | null` companion field where the model can emit a free-text classification when the enum doesn't fit. Document in `profileManager/types.ts` header; add a schema-validator test.
- **Where**: `profileManager/types.ts`; `tests/test-open-escape-hatch.ts`.
- **Why**: LLM-first Rule 3 ("No Closed Taxonomies for LLM Perception"). Ports B1, B2, A3, B3 all add enums. Without escape hatches, V1 drifts toward closed-taxonomy ceiling (feasibility `:187-189`).
- **Size**: 4-8 hrs.

### Pre-req 6 (optional but recommended) — `piqPromptType` discriminator on `ProfileIndex`

- **What**: If `ProfileIndex` does not already carry `piqPromptType: 'PIQ_1'|'PIQ_2'|...|'PIQ_8' | null`, add it. Populated by essayOrchestrator at analysis start via `detectPIQType()` (already implemented in `piq/prompts/promptMetadata.ts`).
- **Where**: `profileManager/types.ts`; `analysisOrchestrator.ts`.
- **Why**: Port A3 requires it; Port 11 (PIQ prompt-specific weights) requires it. Without this, the port injects wrong weights for 7 of 8 PIQs (adversarial `:57`).
- **Size**: 4-8 hrs.

**Total Wave-1b budget**: 32-60 hrs across all 6 pre-reqs. Ship as a single bundled PR.

### Pre-req 7 (added during Wave-1a execution) — Block-versioned composable prompts (Wave-1b.5)

**Status: shipped in #19** (commit `56f6fae`, merged to main as `2574795`). A mid-flight architectural extension that dissolved two open decisions from the Wave-1a plan (A2 user-vs-system-prompt tradeoff; parallel vs serial A1/A2/A3 ship order) by making SYSTEM_PROMPT_VERSION block-level instead of file-level.

- **What**: `src/lib/llm/promptBlockVersions.ts` exports `PROMPT_BLOCK_VERSIONS` manifest with pre-claimed slots for all 11 Wave-1 ports (A1/A2/A3, B1/B2/B3, F1/F2, G1/G2/G3), each independently versioned. `PROMPT_BLOCK_DECLARATIONS` maps each slot to a contract level (descriptive | evaluative | prescriptive). `withPromptBlockVersion(body, blockId)` wraps content with `<!-- BLOCK:ID@vX.Y.Z -->` markers for Anthropic-cache-key divergence on bump.
- **Extends**: `tests/test-descriptive-contract-lint.ts` scans `// @prompt-block <ID>` tagged template literals anywhere under `src/`. Descriptive-level blocks get the forbidden-vocab scan regardless of file location; evaluative/prescriptive blocks are exempt. Unknown block IDs fail the lint.
- **Why**: 11 of 11 Wave-1 ports author new prompt blocks. Without this seam, each port would either serialize behind a single global `SYSTEM_PROMPT_VERSION` bump OR skip lint coverage. With it, each port claims its own slot + authors its body under a `// @prompt-block <ID>` tag + ships independently. Seam investment (~1d) recouped by the third parallel port.
- **Tests**: new `tests/test-prompt-block-versions.ts` with 73 assertions; `SYSTEM_PROMPT_VERSION` bumped v1.3.0 → v1.4.0.

This seam is now a load-bearing dependency for every subsequent Wave-1 port — Wave-1c and fillers must claim their manifest slots, tag their bodies, and rely on per-block cache-key divergence rather than forcing a global SYSTEM_PROMPT_VERSION bump per port.

---

## Section 5 — Ports Rejected with Reasoning

### Row 2 — 500+ phrase Cliché Library ported as whole-list to any layer

**Evidence**: `semanticClicheAnalyzer.ts:1080-1215` uses literal `.includes(phrase.toLowerCase())` regex matching at 5+ call-sites; this is the Rule 4 antipattern V1 was deliberately built to avoid. L3.5 anchored examples + L3.75 Mechanism Quality Standard already do the job semantically. Injecting 500 phrases into any prompt creates Anchor-Bias Cliché Blindness (Sonnet flags patterned phrases and misses novel clichés) and blows cache economics (prompt inflates from ~4K to ~15K tokens). Adversarial `:41-46`.

**What would change the verdict**: If a measurement study showed V1's L3.5 false-negative rate on R&D-library phrases exceeds 40% on a held-out set, the REJECTION would be revisited. Initial test in Port F1 (anchor-only extension) should give us this signal.

### Row 4 (at L4 weight matrix) + Row 11 (decimal weight tables)

**Evidence**: Adversarial `:50-59, 139`. `dimensionWeights.ts:49-51` has a silent-failure baseline-weights sum check (empty if-block). Git log shows 2 commits, none labelled calibration. "19 iterations" is a header-comment aspirational claim. The 2-3 percentage-point prompt-specific deltas (e.g., PIQ 1 role_clarity 0.07→0.09) are within noise. Sonnet zero-shot out-performs via prompt-text reasoning. Rule 1 violation: decimal tables pre-determine what the LLM produces.

**What would change the verdict**: A head-to-head study showing Sonnet with prompt-only guidance under-differentiates PIQ prompts vs Sonnet with the weight table injected. Specifically: L3.5 runs on 16 PIQ essays (2 per prompt); compare top-3-dimension selection between prompt-only and weight-table conditions. If weight-table condition shows ≥20% stronger prompt-specific differentiation, revisit.

### Row 9 — Haiku Diagnosis Stage 0 prompts

**Evidence**: V1's L1 `firstImpressions.ts` is already Haiku-based diagnosis in the same shape. Marginal content difference. LLM-producible at inference.

**What would change the verdict**: A side-by-side study showing R&D Stage 0 catches diagnostic signals V1 L1 misses on ≥20% of essays. Unlikely given architectural parity.

### Row 14 — Essay-Speak + AI-Pattern regex libraries

**Evidence**: Explicit Rule 4 violation. Regex libraries don't generalize; the replacement mechanism is pattern-ID + semantic matching via Port B1 (the IDs flow through prompt, not runtime regex).

**What would change the verdict**: Nothing — the regex approach is architecturally wrong for V1. The *content* of the regex libraries (which phrases) is absorbed at Port B1 as pattern metadata.

### Row 18 — PIQ 3-Tier Quality Standards

**Evidence**: V1's 5-tier WEAK/MEDIOCRE/COMPETENT/STRONG/EXCEPTIONAL (`analysisPass.ts:454-464`) is strictly more expressive than R&D's 3-tier Stanford/UCLA/Competitive. Porting both creates dual-taxonomy drift (feasibility `:133`).

**What would change the verdict**: The Stanford/UCLA/Competitive tier is an **institutional-positioning** signal, not a quality signal. If wave-2 Port 5 (Row 31) needs per-institution positioning, the 3 tiers become the natural L6 coaching overlay for targetInstitution — but absorbed there, not at L3.5.

### Row 20 — Narrative VoiceFingerprint analyzer

**Evidence**: V1's voiceMap + voiceIdentity + 5 VoiceDimensions + 9 TonalQualities is deeper than R&D's fingerprint. The "AVOID generic labels" forcing function is a 1-line prompt edit, not a port.

**What would change the verdict**: Nothing port-worthy.

### Row 24, 26, 29, 35 — V1 equivalents

Already equivalent or better in V1. No port needed.

### Row 32 — 2 new dimensions (Memorability, Agency) from R4

**Evidence**: `/tmp/review-gaps.md:184-189`. Proposes rebuilding the rubric dimension set. Premature before Wave-1 validates the existing rubric. Over-porting risk.

**What would change the verdict**: If Wave-1's measurement on scorecard-dim #6 (rubric-based critique) comes in flat or negative after 6 ports, revisit whether the rubric structure itself needs restructuring. Until then, add dimensions at the prompt level (e.g., L3.5 can score "memorability" as a per-sentence attribute without a full rubric restructure).

### Row 38 — voiceProfile's `personality` block (humor, directness, emotionalOpenness)

**Evidence**: Gap review `:85-90`. Real gap. But wave-2 because it's an extension of Port A2 (voiceProfile already ported; this is just adding a sub-structure). Defer until A2 is in production and the personality block has concrete coaching consumers (Port 7 QAP/VFP).

**What would change the verdict**: After Port A2 ships, measure whether the voiceIdentity output includes personality dimensions when A2 injects prior voice. If those dimensions consistently show as "unknown," promote this port to wave-2 P1.

---

## Section 6 — Ports Enhanced, Not Absorbed

### E1 — Row 1 (CORE_WRITING_PRINCIPLES)

**What's there** (verified): `coachingKnowledgeBase.ts:79-92` `getCorePrinciplesBlock()` renders all 6 principles with full `reader_effect` text, injected into the coaching craft reference block via `assembleKnowledgeBlock()` at line 388.

**What's missing**: L3.5 and L5 analysis prompts never see these principles. A student scored on a Common App essay gets the principles at coaching time but not at scoring time, leading to coaching that references principles the score didn't reflect.

**Targeted augmentation**: Wave-2. Add a minimal 1-line-per-principle block (`reader_effect` first sentence only, ≤200 tokens) to L3.5 `calibrationReflection` prompt, gated on `essayType === 'common_app' | 'supplement'`. Do NOT inject the full 1172-line principle content (inflation risk). L5 gets the same minimal block. Verify no FORBIDDEN VOCABULARY leak.

### E2 — Row 4 (TYPE_SPECIFIC_PRINCIPLES) + Row 8 (PERFORMATIVE_INDICATORS) + Row 12 (PIQ_ISSUE_PATTERNS) + Row 17 (PIQ word economy) + Row 8-L6 (PIQ vulnerability)

**What's there** (verified):
- `getTypeSpecificBlock()` `:102-133` renders `reader_question` + 4 `success_principles` + 3 `type_pitfalls` per essayType
- `getTypeWeightBlock()` `:141-170` renders `critical_dimensions` + `excellence_requirements` + `word_range`
- `getPerformativeIndicatorsBlock()` `:178-191` renders top-4 indicators with `recognition_cues` + `antidote`
- `getIssuePatternBlock('piq')` `:327-372` renders top-5-critical PIQ patterns with keyword triggers + fix technique (100-char fix description)
- `getVulnerabilityCoachingBlock()` `:260-277` renders the 5-level vulnerability classification with per-level fixes
- `getPIQWordEconomyBlock()` `:285-314` renders tiered strategy + cut priority + bad-cut/good-cut examples

**What's missing**:
- Top-5-critical filter on PIQ patterns is conservative; many critical+major patterns never reach the coach
- 4-of-7 performative indicators is conservative; token budget allows all 7
- TypeSpecificBlock maps `piq` → `[]` (no type injection for PIQ at the type-principle level because PIQ has its own system); Common App and activity descriptions fall through to generic why_us
- No cross-reference between L3.5 patternId output (once Port B1 ships) and L6 coaching retrieval — currently coach does its own pattern lookup independently

**Targeted augmentation**:
1. Raise PIQ pattern severity filter from `filter(critical).slice(0,5)` to `filter(critical || major).slice(0,10)`. Token budget: ~2K additional, within cache.
2. Render all 7 performative indicators (drop `.slice(0,4)` at line 183).
3. After Port B1: thread `patternMatches[]` from L3.5 output into L6's `BlockContext`; `getIssuePatternBlock()` gains a branch that uses the already-detected patternIds rather than injecting all patterns.

### E3 — Row 42 (InlineEditor BANNED_TERMS)

**What's there**: `BANNED_COACH_TERMS` array at `coachingKnowledgeBase.ts:196-201` (15 terms) + `getBannedTermsBlock()` at `:207-209`.

**What's missing**: This is a shorter list than inlineEditor's 40-phrase BANNED_TERMS. The 15% overlap finding (original audit `:884-887`) is confirmed — L1's 46-word list + coaching's 15-word list + inlineEditor's 40-phrase list are three independent lists.

**Targeted augmentation**: Consolidate the 3 lists into one `taxonomies/bannedTerms.ts` with `category: 'l1_output_vocabulary' | 'coach_output' | 'student_essay_cliche'` keys. Each layer imports the subset it needs. Maintain the split per Non-obvious Finding 1 — do not merge categories.

---

## Section 7 — Gap-Hunter Additions Triage

40 items from `/tmp/review-gaps.md`. Gap-review numbering preserved where possible.

### Promote to Wave-1 (P0, already in Section 3)

- **#14 (Fabricated Metrics guard)** → Port G1
- **#15 (Coaching Mode default)** → subsumed by Port A1 + ships as L6 config default alongside
- **#16 (Focus Mode 2-3 items)** → Port G2
- **#18 (Few-Shot calibration on every scoring prompt)** → Port G3
- **#37 (LLM-first design rules as prompt-file headers)** → this is meta, not a port — add to PR review checklist (Section 8)

### Promote to Wave-2 (P1 backlog)

- **#1 (11-dim rubric anchor_0/5/10 + warning_signs + evaluator_prompts per dim)** — Port the anchor sentences from `src/core/rubrics/v1.0.0.ts:137-500` as shared module consumed by L3.5 (as calibration anchors) + L4 (as tier-band definitions). Do NOT port the 11 dimensions as the V1 scoring schema — V1's 5-dim ScoreMatrix is deliberately collapsed. This is cognitive-content port, not architecture change.
- **#2 (RUBRIC_INTERACTION_RULES)** — Port the 5 verbatim rules into L3.75 Phase B prompt as constraint block (voice_redeems_metrics, arc_amplifies_impact, reflection_converts_logistics, specificity_controls_credibility, community_informs_leadership). Rules are evaluative → they belong in L3.5 / L4 / L5, NOT L3.75 (contract). Reshape target: L3.5 calibrationReflection.
- **#3 (NQI-gain-based fix ranker)** — Adopt the marginal-gain ranking algorithm for L5 `improvements/improvementCandidateStore.ts` prioritization. Replaces V1's free-text ordering with a quantitative rank. Compatible with Port G2 (Focus Mode top-2-3).
- **#5 (HolisticAnalyzer Spine/Spike/Lift/Blind-Spots/Archetype)** — Wave-2. L3.75 holisticSynthesis Phase B gains these as sub-structures IF descriptively framed. `archetypeContext` already exists; Spine/Spike/Lift are adjacent. Evaluate L3.75 contract risk carefully.
- **#6 (PIQ-prompt-type routing)** — subsumed by Port A3 once pre-req 6 (`piqPromptType` discriminator) lands.
- **#10 (Semantic Cliché 4-level architecture)** — Fold into Port F1 L3.5 anchor extension. The 4-level organizing principle (Topic / Arc / Language / Tell-Don't-Show) is prompt structure for where to look for clichés, not a taxonomy.
- **#12 (6-Arc Taxonomy)** + **#13 (10-Beat decomposition)** — Wave-2. Add to L2 `structuralCartographer.ts` as closed-for-routing enums (Rule 3 permits enums for routing). Detection signals ported verbatim from R1.
- **#17 (De-emphasize scores in teaching contexts)** — Presentation-layer change in `presentation/renderAnalysisForStudent.ts`. Trivial port (4-8 hrs).
- **#19 (Hook Tier 1/2/3 + Ending Tier 1/2/3)** — Wave-2. L3.5 analysis of opening/closing paragraphs classifies per tier. Subsumed partly by Port B2 (symptomType covers opening archetypes at a finer grain); the tier overlay is additional.
- **#20 (AO-priority dimensions: Tellability, New Information, Personality/Humor, Reader Engagement Velocity, AI Detection Risk)** — Wave-2. These are measurable signals. Add to L3.75 holistic output as descriptive fields ("does this essay reveal new information?") NOT as scores.
- **#21 (7 Analysis Capabilities: Specificity Gradient / Scene-Summary / Show-Tell / Narrative Arc / Emotional Journey / Info Density / Tension Curve)** — Wave-2. 1-3 (Specificity Gradient, Scene/Summary, Show/Tell) are P1 per gap review; ship as deterministic signals under new `essayIntelligence/signals/` directory. 4-7 are P2.
- **#24 (Committee Room Test / memorabilityAnalyzer)** — Wave-2. New L3.75 field `memorabilityAssessment: { hookStrength, oneSentenceSummary, committeeQuote }`. Descriptive framing only.
- **#26 (Subtext / Ghost Story)** — Wave-2. L3.75 Phase B gains a "gap between stated thesis and emotional content" descriptive section.
- **#27 (Emotional Intelligence Calibration at L6)** — Wave-2. L6 coaching modulation: warm-before-critique for vulnerable, challenge-to-reveal for guarded. ~20 lines of prompt.
- **#29 (Over-Explanation Score)** — Wave-2. Deterministic signal (I-learned-that after scenes; insight-to-action > 2:1; sequential qualifications). Under new signals/.
- **#33 (20 specialized deep-dive prompts from PLAN2)** — Wave-2. Audit V1's existing `deepDivePromptLibrary.ts` (1008 lines — verified) line-by-line against PLAN2:700-1077 list; port missing prompts verbatim. Priority on `ao_reading_simulation`, `distinctiveness_test`, `intent_text_gap`, `form_content_alignment` — these are the highest-leverage missing prompts.
- **#34 (6-Level Understanding Hierarchy as evaluation criterion)** — Not a port but a meta-criterion. Add to PR review: every prompt rewrite should ask "does this push understanding beyond L2-3 toward L5-6?"
- **#39 (RAG content seeding — 500+ fragments from R&D)** — Wave-2. Data migration, not prompt port. Depends on Port B1 + B2 landing (patternId / symptomType are the retrieval keys).
- **#40 (Tests-as-prompts migration)** — Wave-2. Systematic pass across 12+ calibration test files; migrate encoded criteria into the corresponding V1 prompts. High mechanical leverage.

### Needs Research (can't verdict without more data)

- **#4 (Authenticity → voice adjustment ladder)** — `src/core/analysis/engine.ts:384-414` specifies an explicit numerical ladder (auth≥8 → voice+1.5, ≥6.5 → +0.5, ≥5 → 0, ≥3 → -0.5, <3 → -2.0). Research question: is this ladder calibrated, or was it hand-tuned like the PIQ weights? Check git log and any associated test fixtures before porting. If uncalibrated, reshape as prose in L3.5 ("if you detect authenticity concerns, let that floor voice-integrity scoring").
- **#7 (15 unified/features/ LLM analyzers)** — Research question: what does each analyzer's prompt content add that V1's consolidated L3.5 analysisPass doesn't already cover? Mine each `*_llm.ts` file for unique cognitive content; promote found gaps to wave-2 backlog. Defer blanket verdict.
- **#22 (Cognitive Load-Aware Feedback Rationing with Kluger & DeNisi citation)** — Overlaps Port G2. Research question: does the 38% feedback-harms statistic come with a bound on WHICH feedback harms? The citation is real; the operationalization specifics (feedback budget formula) need empirical calibration for Uplift's cohort.
- **#23 (Edit-Response Learning)** — Requires a new database schema (`feedback_effectiveness` table with `acted_on | ignored | backfired | introduced_new_issue` labels). P2. Design before commit.
- **#25 (Developmental Stage Adaptation: discovery/shaping/refining/polishing → annotation distribution)** — V1 has `ImprovementPhase` (Foundation → Architecture → Craft → Polish → Distinction) which is adjacent but distinct. Research question: does Uplift's phase model map cleanly to R4's draft-stage taxonomy? Resolve taxonomy reconciliation before porting.
- **#28 (Metacognitive Coaching — cross-session patterns)** — New service + `student_patterns` table. P2. Design before commit.
- **#30 (Strategy Fit Analyzer)** — Requires `applicationContext` input (activities, awards, targetSchoolTier). V1 has no such input channel. P2 infrastructure port before content port.
- **#31 (Essay DNA Comparative Engine)** — R4 Section 5 ~200-line design. P2 research + architecture design needed before any port.
- **#35 (Question Queue completeness)** — V1 has `questionQueueManager.ts`. Research: does it implement all 10 fields from PLAN2 (id, question, dimension, scope, priority, expectedYield, status, answer, answeredBy, spawnedQuestions, raisedDuring)? Does it persist across runs? Does the dispatch algorithm implement the diminishing-returns gate? Audit before verdict.
- **#36 (Dispatch algorithm with diminishing-returns gate)** — Same research question as #35.

### Reject

- **#9 (6 Emotional Registers as closed taxonomy)** — Closed-enum risk. L3.75 voiceIdentity already emits register descriptively. If porting, must be routing-only with `open` escape hatch.
- **#11 (Strategy / Pattern / Signal self-registering registries)** — Registry pattern is appealing but ships registry-cost without registry-payoff until ≥3 consumers exist. Revisit after Wave-1 ships patternMatches[] and if adding a second consumer (L5 / L6) justifies the registry machinery. Current verdict: defer to wave-3.
- **#32 (2 new dimensions Memorability + Agency)** — see Section 5 reject above.
- **#38 (voiceProfile personality block)** — see Section 5 (defer pending A2 measurement).

### Meta-item (no port, apply in reviews)

- **#37 (LLM-first design rules)** — Apply as PR review criterion, not port. See Section 8.

---

## Section 8 — What V1 Got Right (Preserve)

Rows 43-57 of the original audit. Every Wave-1 PR must pass the non-erasure test for each of these 15 V1-native wins. Checklist for PR reviewers:

### V1-native wins (verbatim from original audit Section 7)

1. **Separation of understanding / analysis / feedback passes** (`sequentialDeepWalk.ts`, `analysisPass.ts`, `deepAnnotationService.ts` — 3 separate calls, 3 separate FORBIDDEN VOCABULARY lists)
2. **Novelty-Driven Growth** (`sequentialDeepWalk.ts:236-242`)
3. **Observation Economy "competent English teacher" test** (`sequentialDeepWalk.ts:244-247`)
4. **L3 Back-Propagation** (`sequentialDeepWalk.ts:269-280`)
5. **Mechanism Quality Standard** (`holisticSynthesis.ts:447-455`)
6. **Intentionality Calibration by Essay Quality** (`holisticSynthesis.ts:425-431`)
7. **"Lunch with" Character Portrait framing** (`holisticSynthesis.ts:524-529`)
8. **Anchored Score Examples 38/52/72/88/78** (`analysisPass.ts:367-383`)
9. **Anti-Clustering + 5-tier Inter-Essay Calibration + Compression Check** (`analysisPass.ts:448-466`)
10. **Admissions Resonance / Revelation Density Weighting** (`analysisPass.ts:411-414`)
11. **North Star as Emergent Property** (`crystallizer.ts:205-208`)
12. **Through-Line as MEANING Transformation** (`crystallizer.ts:212-217`)
13. **Distinctiveness-of-Execution framing** (`crystallizer.ts:247-252`)
14. **Teaching Modes AWARENESS/CONSEQUENCE/CONNECTION/ACTION + cognitive-flow ordering + ACTION-requires-rewriteExample fail-fast** (`deepAnnotationService.ts:147-151, 876-881`)
15. **Phase-Aware Zoom** (`deepAnnotationService.ts:11`)
16. **Supersession Rarity Default** (`sequentialDeepWalk.ts:307-309`)

### PR review checklist (per port)

Every PR that touches a V1 prompt, type, or routing path must include evidence that:

- [ ] **FORBIDDEN VOCABULARY unchanged or expanded** in L1/L3/L3.75 files (CI lint passes per pre-req 4)
- [ ] **New output enums carry `open: string | null` escape hatch** (per pre-req 5)
- [ ] **Closed taxonomies are routing-only**, not LLM-assignment constraints (LLM can still emit freeform via `open` alongside)
- [ ] **No LLM output is discarded / trimmed to a quota** (Rule 2)
- [ ] **No regex is added to enforce quality** (Rule 4) — regex for routing / detection that the LLM then interprets is OK
- [ ] **Anchored Score Examples at L3.5 unchanged** — if new anchors added, old anchors preserved
- [ ] **Novelty-Driven Growth language at L3 unchanged** — no prompt edit forces uniform-depth output per paragraph
- [ ] **Mechanism Quality Standard at L3.75 unchanged** — no dilution via larger cliché library injection
- [ ] **Teaching mode default not shifted to ACTION** — AWARENESS/CONSEQUENCE still available as first options
- [ ] **Phase-Aware Zoom respected** — any new annotation emission filters by ImprovementPhase
- [ ] **No dimension collapse at L4 ScoreMatrix** — if new dimensions added, existing 5 dims retained
- [ ] **Cache-friendly prompt size** — L3.5 system prompt post-port ≤8K tokens; L3.75 ≤10K tokens
- [ ] **Cache key version bumped** — SYSTEM_PROMPT_VERSION incremented on every cached-prompt edit
- [ ] **Fabricated-metrics guard present** in any new generative prompt (Port G1)
- [ ] **Regression suite passes** — novelty-growth test, anti-clustering test, mechanism-quality test each emit non-null signal on a known-mediocre test essay

A PR that fails any box is blocked until fixed. The lint + regression suite catches most mechanically.

---

## Section 9 — Open Questions & Next Instrumentation

### Q1 — Do R&D phrase libraries still hold in 2026?

R&D libraries were built in 2024. LLM-convergence phrasing drifts quarterly. Concrete study needed:
- Pull 100 2026 student essays from production logs.
- Measure R&D 500-phrase library hit rate vs current Sonnet freeform cliché detection.
- Hypothesis: >30% of 2026 clichés do not appear in the 2024 library.
- Operational answer: quarterly refresh via logged cliché detections.

### Q2 — Does cross-essay voice persistence match student expectations?

Port A2 persists voice across essays. But students may value *voice exploration* over consistency — writing a scientific essay in one register and a personal statement in another is a legitimate choice. If V1's drift-detection fires on every register shift, we pathologize a feature.
- Post-A2 instrumentation: track drift-detection → student-acceptance rate on coaching turns that reference prior voice.
- Threshold: if <60% of drift flags are accepted by students, the persistence framing needs to shift from "consistency" to "option."

### Q3 — Per-port regression risk against V1-native wins

Section 8 checklist is mechanical. What's NOT mechanical:
- Does Novelty-Driven Growth curve (P1 rich → P5 focused) still hold after Port B1 (pattern library at L3.5)? Measure observation count per paragraph pre/post.
- Does Anti-Clustering Protocol still produce 20-point cross-paragraph range after Port A3 (13-dim PIQ)? Measure score range pre/post on PIQ essays.
- Does Mechanism Quality Standard still flag "fingers danced" correctly after Port F1 (cliché anchor extension)? Regression fixture required.

Each of these needs a frozen fixture essay + a diff on the V1 output schema before/after each port. Add to `tests/test-v1-native-regression.ts` before Wave-1 ships.

### Q4 — 20-capability scorecard current state vs projected post-Wave-1

From `docs/analysis/SUCCESS_CRITERIA_AND_VALIDATION.md:455-482` and impact review `:197`:

| Capability (0-5) | Current est. | Post-Wave-1 projection | Port contributing |
|---|---|---|---|
| #3 Cross-essay voice consistency | 3 | 4 | Port A2 |
| #6 Rubric-based critique | 4 | 5 | Port A3, B1, B2, B3 |
| #7 Teaching-backed exemplars | 4 | 4 | (no lift until RAG wave-2) |
| #8 Teaching-backed-by-examples | 4 | 5 | Port B1, B2, B3 |
| #14 Style-preserving rewrites | 3 | 4 | Port A2, Port A1 (QAP) |
| #15 AI detection | 4 | 4-5 | Port F2 (conditional) |
| #16 Anti-cliché | 5 (self-report) | 5 (measured) | Port F1 |
| #17 Paragraph-level coaching | 4 | 5 | Port A1 |

Projected aggregate: ~80/100 current → ~92/100 post-Wave-1 on the measurable axes; plus 5-10 additional points on axes the current scorecard does not enumerate (longitudinal patternId consistency, opening/ending archetype quality, admissions realism). These need to be added to the scorecard itself as part of Wave-1 wrap-up.

### Q5 — Unresolved arbitrations

- **Port F2 (aiRiskScorer)**: adversarial rejects as Rule-4 antipattern; feasibility reshapes as ProfileIndex signal. Arbitrated in favor of feasibility (Section 2 row 38 reasoning), but the ESL false-positive concern is real. Ship behind flag; require 2-week A/B on ESL-subset essays before default-on.
- **Port B2 splitting**: feasibility splits into B2a (symptomType enum) + B2b (L5 role-router). Adversarial treats as one unit. Operational verdict: ship B2a first, measure, ship B2b second. If B2a alone delivers the quality lift, B2b may not be necessary.
- **Port 31 (institutional weight calibration)**: adversarial rejects as UC-specific; feasibility reshapes as L6 overlay. Arbitrated as L6-overlay, institution-gated. Wave-2 (after Port B3 measurement).

### Q6 — Can aiRiskScorer bias ESL / non-native speakers?

Known issue with statistical AI detectors. Before shipping Port F2 default-on:
- Curate 20 essays from ESL-identified students (via Clerk profile metadata if available).
- Measure aiRiskScorer false-positive rate on this subset.
- Required threshold: ≤10% false positive for default-on. Otherwise flag-only, opt-in.

### Q7 — Should the 5 Critical Findings from WRITING_SYSTEM_DEEP_RESEARCH_SYNTHESIS ship in Wave-1?

I promoted them (G1, G2, G3) to Wave-1. Rationale: G1 is a safety issue; G2 is cheap and cognitively-load-supported; G3 extends a proven V1 win (anchored examples). But the research synthesis itself is a 8-agent meta-study; the individual P0 findings cite admissions-psychology research (Kluger & DeNisi, Sommers 1982, Butler & Nisan 1986). Question: has any of this been empirically validated against Uplift's cohort?
- Operational answer: ship G1 (no risk), ship G2 with UX instrumentation (measure implementation rate pre/post), ship G3 with the pre/post scoring-distribution measurement.

---

## Closing Note

This doc supersedes the ported-forward plan in `docs/V1_KNOWLEDGE_INHERITANCE_AUDIT.md` Section 6. That document remains the authoritative inventory (Sections 1-5 and 7). Execute Wave-1 from the sequencing in Section 3 above. Any port not listed in Sections 3 or 7 Wave-2 Promote is on hold until Wave-1 measurement validates the injection patterns.

The original audit's instinct to ship was right. Its scope (19 ports across 3 waves) was over-aggressive. The Pareto-6 + 3 promoted gap-hunter ports + 6 type-seam pre-reqs is the executable 3-4 week plan. Everything else is wave-2 or later.

*End of verdict.*
