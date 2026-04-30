# L5 Consumption Audit

> **Step 1 deliverable, revised against the experience target and iteration design.** Every upstream field that the pipeline produces before L5 (and every field L5 itself produces), classified by whether it ends up in something the student sees, hears, or feels — directly or via a downstream layer that itself satisfies that test.
>
> **[NOTE — L3.75 absorption applies (Phase 0 D-0.18 R-2 supersession). Per [`L3-75/L3_ABSORBS_L3_75.md`](../L3-75/L3_ABSORBS_L3_75.md) (APPROVED 2026-04-25), the L3.75 layer is being retired. Specific re-mappings within this doc:]**
>
> - **Cost convention table** (in the rows below): the row `L3.75 (holisticSynthesis) Sonnet ~$0.10` is superseded. Post-absorption: `L3 Pass 2 lenses 4× Sonnet ~$0.06–$0.10 each (parallel) + L3 Pass 3 1× Sonnet ~$0.08`. Net L3 cost ≤ ~$0.40 (vs prior ~$0.50 L3+L3.75 combined).
> - **Rows 49–110 ("L3.75 fields")**: every row's producer / layer-of-origin re-maps per the lens-ownership table at [`cross-cutting/L5_AND_MASTER_RECONCILIATION.md`](../cross-cutting/L5_AND_MASTER_RECONCILIATION.md) §R-2. Field shapes do NOT change; layer-of-origin does. Voice fields → Voice lens; thematic fields → Meaning lens; narrative / pacing / emotional-progression fields → Story lens; admissions / character signals → Admissions lens; cross-dimension fields (writerPortrait, entanglements, arcTrajectory, momentEarnednessMap.mechanisms) → L3 Pass 3.
> - **Row 95** (`characterRevelation.blindSpots[]`): verdict CHANGES from `rewire` to **`cut`** per L3-75/L3_ABSORBS Decision A (2026-04-25). `admissionsPositioning.redFlags[]` (with required `fix` field) is the canonical home. blindSpots[] is removed entirely; consumers reading it migrate to redFlags.
>
> **Revision pass (this version).** The original 250-row table below stands. Three additions appended at the end (§A1, §A2, §A3):
> - **§A1 — Carry-forward classification.** Every audit row is mapped to its carry-forward default (`carry` / `carry-with-validity-test` / `re-derive` / `re-derive-each-iter` / `static-asset` / `bookkeeping`) sourced from `L5_ITERATION_LOOP_DESIGN.md` §3 (the 40-row inventory).
> - **§A2 — Proposed-consumer rewire to experience-target surfaces.** Original audit rows referenced redesign-doc primitives (T1 prompt slot, T2 deferred drawer, etc.). The experience target redefined surfaces (lede, focus surface with Move 6 multiplicity, voice anchor as standing surface, deferred surface re-cast as "not this revision," connection map as standing read, iteration response, Conversator panel). This addendum maps the relevant rewires from primitives to surfaces.
> - **§A3 — New rows for the six new state types.** IterationLedger / IterationRecord / TaughtMove / CarryForwardDecision / DigContext / GroundTruthFact / StoryFragment / IntentSignal — all `keep` (new state, all consumed).
>
> **Yardstick stance.** This is the field-level yardstick the build phase measures against per-row. Verdicts (keep / rewire / cut) plus the new carry-forward classification plus the experience-target surface mapping form the contract each affected build deliverable honors.

## Verdict legend

- **keep** — currently consumed by a path that reaches the student (manifest → UI, or by a downstream layer whose own output reaches the student); the redesign preserves the wiring.
- **rewire** — produced today but either not consumed at L5 or consumed only weakly; the redesign assigns it a specific student-visible surface (citation resolver, Tier 1 prompt slot, Tier 2 synthesis input, qualitative-summary lede, focus-mode card, deferred drawer, score accordion, UI chip).
- **cut** — produced today with zero student-reaching consumer (telemetry-only, dead code, or upstream production with no downstream read), and the redesign assigns no surface. Cutting saves either output tokens, code-rot risk, or both.

## Cost convention

Per-essay layer costs estimated from `deepAnnotationService.ts` model usage and the redesign doc §1.5 / §9. Field-level cost is the field's slice of its layer's call output; for static assets, $0.

| Layer | Model | Approx call cost / essay | Notes |
|---|---|---|---|
| L1 (firstImpressions) | Haiku | ~$0.02 | One Haiku call |
| L2 (structuralCartographer) | Sonnet | ~$0.04 | One Sonnet call |
| L2.5 (scoutPass) | Haiku | ~$0.02 | One Haiku call |
| L3 (sequentialDeepWalk) | Sonnet × paragraphs | ~$0.30 (5-para essay) | Per-paragraph |
| L3.75 (holisticSynthesis) | Sonnet | ~$0.10 | One large call, 10 sections |
| L3.5 (analysisPass) | Sonnet × paragraphs | ~$0.08 | Per-paragraph |
| improvementPhase (phaseAssessment) | Sonnet | ~$0.025 | One call |
| L4 (northStar + scoreMatrix + coachingMap + coherence) | Sonnet | ~$0.15 aggregate | L4a + L4b |
| L5 today | Sonnet × paragraphs + cross-para Sonnet | ~$0.10–$0.50 | Per redesign §1.5 |
| Findings | — | $0 marginal | Side-effect of L3/L3.5/L3.75 |
| Corpus / taxonomies / rubrics | — | $0 (static) | At-rest; retrieval glue is Haiku |

Symbols in cost column: `[H]` Haiku, `[S]` Sonnet, `[★]` heavy slice within its layer's output, `[D]` deterministic / $0.

## Audit table

| # | Source | Field | Defined at | Cost | Current consumer | Proposed consumer | Verdict | Rationale |
|---|---|---|---|---|---|---|---|---|
| | **L1 — descriptive annotator** | | | | | | | |
| 1 | L1 | `ParagraphFirstImpression` (container) | profileTypes.ts:3531 | [H] $0.02 | analysisOrchestrator → L2/L2.5/L3 input | T0 ledger context (small) | keep | Cheap descriptive frame consumed by every downstream layer; cutting would force re-deriving in L3 prompt. |
| 2 | L1 | `apparentPurpose` | profileTypes.ts:3535 | [H] | structuralCartographer.ts:140 | unchanged | keep | L2 reads as input to architectural roles. |
| 3 | L1 | `emotionalRegister` | profileTypes.ts:3536 | [H] | structuralCartographer.ts:140 (L2 ctx) | unchanged | keep | Feeds L2 + L3.75 emotionalTopography. |
| 4 | L1 | `voiceObservation` | profileTypes.ts:3537 | [H] | structuralCartographer.ts:140 (L2 ctx) | unchanged | keep | Feeds L3.75 voiceIdentity baseline. |
| 5 | L1 | `craftNotices[]` | profileTypes.ts:3538 | [H] | structuralCartographer.ts:146 | unchanged | keep | Feeds L3 walk and L3.75 craftAssessment. |
| 6 | L1 | `tags[]` (paragraph topic tags) | profileTypes.ts:3539 | [H] | ProfileIndex.topicTags + profileRouter | unchanged | keep | Routing signal; cheap to keep. |
| 7 | L1 | `sentences[]` (per-sentence purpose / function / toneShift / elements / tags) | profileTypes.ts:3541–3550 | [H] [★] | scoutPass.ts toneContext build | unchanged | keep | L2.5 reads tone shifts; cheap descriptive frame. |
| 8 | L1 | `ProfileIndex.essayLength` | profileTypes.ts:1920 | [D] | budget allocation | unchanged | keep | Deterministic; drives token budget math. |
| 9 | L1 | `ProfileIndex.confidenceLevel` | profileTypes.ts:1922 | [D] | profileRouter context selection | unchanged | keep | Needed for routing fidelity. |
| 10 | L1 | `ProfileIndex.topicTags[]` | profileTypes.ts:1925 | [D] | coaching planner | unchanged | keep | Routing only. |
| 11 | L1 | `ProfileIndex.paragraphDigest[]` (role / tags / themes / sentenceCount / connectionCount / priority) | profileTypes.ts:1928–1938 | [D] | profileRouter overview | unchanged | keep | Compact scannable summary; tiny. |
| | **L2 — structural cartographer** | | | | | | | |
| 12 | L2 | `StructuralCartography` (container) | profileTypes.ts:3565 | [S] $0.04 | sequentialDeepWalk.buildParagraphWalkContext | unchanged | keep | L3 walk depends on it. |
| 13 | L2 | `paragraphRoles[]` (role + narrativeFunction + strengthContribution + weaknessFlag) | types.ts:129–135 | [S] | L3 walk context | T0 ledger feeds T2 ranking ("load-bearing" weighting) | keep | Already drives walk; redesign adds Tier 2 weighting use. |
| 14 | L2 | `arcType` | types.ts:138 | [S] | essayUnderstanding synthesis, northStar | unchanged | keep | Feeds L3.75 narrativeStrategy.arcType + L4 northStar. |
| 15 | L2 | `arcConfidence` | types.ts:139 | [S] | L3.75 weighting | unchanged | keep | Calibration signal at L3.75. |
| 16 | L2 | `arcVerification` | types.ts:141 | [S] | L3.75 context | unchanged | keep | Same. |
| 17 | L2 | `transitions[]` | types.ts:144–149 | [S] | L3.75 narrativeStrategy | unchanged | keep | Used by L3.75. |
| 18 | L2 | `centralTheme` | types.ts:152 | [S] | L3.75 thematicArchitecture | unchanged | keep | Seeds L3.75 thesis. |
| 19 | L2 | `themeProgression` | types.ts:153 | [S] | L3.75 thematic synthesis | unchanged | keep | Same. |
| 20 | L2 | `thematicGaps[]` | types.ts:154 | [S] | coaching identification | T2 synthesis (focus-item candidates) | rewire | Already produced; redesign elevates as Tier 2 ranking input + deferred-item evidence. |
| 21 | L2 | `pacingNotes` | types.ts:157 | [S] | L3.75 narrativeStrategy.pacing | unchanged | keep | Used at L3.75. |
| 22 | L2 | `flatSpots[]` | types.ts:158 | [S] | improvement prioritization | T2 synthesis ranking input | rewire | Currently informal input to coaching map; redesign formalises as Tier 2 ranking signal. |
| | **L2.5 — connection scout** | | | | | | | |
| 23 | L2.5 | `ConnectionScoutOutput` (container) | profileTypes.ts:3570 | [H] $0.02 | sequentialDeepWalk per-paragraph investigation | unchanged | keep | Cheap forward-looking leads for L3. |
| 24 | L2.5 | `repeatedElements[]` (element + occurrences + potentialSignificance) | profileTypes.ts:3571–3574 | [H] | L3 walk investigations | unchanged | keep | Feeds L3 connection discovery. |
| 25 | L2.5 | `tonalShifts[]` | profileTypes.ts:3576–3580 | [H] | L3 tonal-shift investigation | unchanged | keep | Feeds L3 emotional arc. |
| 26 | L2.5 | `structuralEchoes[]` | profileTypes.ts:3582–3585 | [H] | L3 structural pattern investigation | unchanged | keep | Feeds L3 + L3.75. |
| | **L3 — sequential deep walk** | | | | | | | |
| 27 | L3 | `UnderstandingWalkOutput` (container) | profileTypes.ts:3595 | [S] $0.30 | analysisOrchestrator applies to profile | unchanged | keep | The walk is the spine; everything depends on it. |
| 28 | L3 | `paragraphUnderstanding.role` | profileTypes.ts:788 | [S] | profile.paragraphs[].understanding | unchanged | keep | L3.75 + L5 read. |
| 29 | L3 | `paragraphUnderstanding.function` | profileTypes.ts:790 | [S] | profile.paragraphs[].understanding | unchanged | keep | Same. |
| 30 | L3 | `paragraphUnderstanding.narrativeContribution` | profileTypes.ts:792 | [S] | northStar.throughLineMap construction | unchanged | keep | Drives L4. |
| 31 | L3 | `paragraphUnderstanding.emotionalRegister` | profileTypes.ts:794–799 | [S] | L3.75 emotionalTopography | unchanged | keep | Used at L3.75. |
| 32 | L3 | `paragraphUnderstanding.craftProfile` | profileTypes.ts:802–806 | [S] | L3.75 craftAssessment | unchanged | keep | Same. |
| 33 | L3 | `sentenceUnderstandings[].observedFunctions[]` (ObservationEntry) | profileTypes.ts:588 | [S] [★] | deepDiveRunner, profileRouter, coaching planner | unchanged | keep | Load-bearing on every later layer. |
| 34 | L3 | `sentenceUnderstandings[].inferredIntents[]` | profileTypes.ts:594 | [S] | no L5 consumer; L6 coaching reads | unchanged | keep | L6 owns intent reconciliation; do not pull into L5. |
| 35 | L3 | `sentenceUnderstandings[].narrativeContributions[]` | profileTypes.ts:599 | [S] | northStar throughLineMap | unchanged | keep | Drives L4. |
| 36 | L3 | `sentenceUnderstandings[].rhetoricalFunctions[]` | profileTypes.ts:602 | [S] | coaching granularity | T0 ledger + T1 paragraph context | keep | Surfaces in coaching prose; cheap. |
| 37 | L3 | `sentenceUnderstandings[].paragraphContribution` | profileTypes.ts:605 | [S] | deepDiveRunner context | unchanged | keep | Used by deep dive. |
| 38 | L3 | `sentenceUnderstandings[].craft` (rhythm + techniques + voiceAlignment) | profileTypes.ts:608 | [S] | craftAssessment, deepAnnotationService.ts:1373–1376 | unchanged (drop deprecated `voiceAlignment` sub-field) | rewire | Keep techniques (W1.4 cited use); drop deprecated voiceAlignment per profileTypes.ts:680. |
| 39 | L3 | `sentenceUnderstandings[].significantChoices[]` | profileTypes.ts:614–617 | [S] | deepAnnotationService.ts:1378–1380 | unchanged | keep | W1.5 — already feeds L5 polish/distinction targets. |
| 40 | L3 | `sentenceUnderstandings[].connectionRefs[]` | profileTypes.ts:620 | [S] | connection graph traversal | unchanged | keep | Routing IDs. |
| 41 | L3 | `sentenceUnderstandings[].tags[]` | profileTypes.ts:626 | [S] | profileRouter | unchanged | keep | Routing. |
| 42 | L3 | `sentenceUnderstandings[].primaryFunction` (Phase 0 legacy) | profileTypes.ts:630 | [S] | backward-compat only | cut | cut | Phase 0 leftover; superseded by `observedFunctions`. Saves ~10 tokens × every sentence. |
| 43 | L3 | `sentenceUnderstandings[].significance` ('pivotal' / 'contributing' / 'transitional') | profileTypes.ts:633 | [S] | improvement prioritization | T2 synthesis ranking input | keep | Tier 2 reads as ranking signal. |
| 44 | L3 | `holisticEvolution` (centralThesis + thesisConfidence + voiceSignature + arcMomentum) | profileTypes.ts:3616–3621 | [S] | L3.75 receives between walks | unchanged | keep | Per redesign §2 italics: scope to re-analysis delta cues only — already that. |
| 45 | L3 | `priorSentenceUpdates[]` (back-prop) | profileTypes.ts:3630–3639 | [S] | sentenceMutator (replaces arrays) | unchanged | keep | Supersession mechanic; load-bearing. |
| 46 | L3 | `newConnections[]` (endpoints + description + significance + strengthCategory + directionality) | profileTypes.ts:3646–3654 | [S] | profile.connections | unchanged | keep | Feeds L3.75 + L4 + L5. |
| 47 | L3 | `newFindings[]` | profileTypes.ts:3661–3673 | [S] | FindingStore, coaching | T0 ledger as `[F-#]` citation kind | rewire | §2 italics: promote to first-class citation handle at L5. |
| 48 | L3 | `findingEvolutions[]` | profileTypes.ts:3679–3684 | [S] | FindingStore maturity | unchanged | keep | Bookkeeping (Rule 6). |
| | **L3.75 — holistic synthesis (10 sections, single Sonnet ~$0.10)** | | | | | | | |
| 49 | L3.75 | `voiceIdentity.signature` | profileTypes.ts:876 | [S] | profileRouter:657, deepAnnotationService.ts:1100 | T2 lede + qualitative summary | keep | Already L5 input; Tier 2 promotes into lede. |
| 50 | L3.75 | `voiceIdentity.register` (legacy single-word) | profileTypes.ts:879 | [S] | profileRouter, coachingService | unchanged | keep | Legacy form still read; safe. |
| 51 | L3.75 | `voiceIdentity.distinctivePatterns[]` | profileTypes.ts:881 | [S] | profileRouter:1223, readinessScoring | T1 prompt — voice anchor | rewire | §2 italics: expose as "voice anchor" UI element. |
| 52 | L3.75 | `voiceIdentity.evolution` | profileTypes.ts:883 | [S] | profileRouter | unchanged | keep | Used. |
| 53 | L3.75 | `voiceIdentity.authenticVsPerformed[]` | profileTypes.ts:888 | [S] | no consumer found | T1 prompt + T3 authenticity guard | rewire | Currently dead; redesign §8.3 (voice profile composition) and §3.4 (authenticityFlag). |
| 54 | L3.75 | `voiceIdentity.primaryRegister` (compound descriptor) | profileTypes.ts:904 | [S] | coaching, L4 stakes, audit renderer | T0 ledger key for VOICE_ARCHETYPE_COMPATIBILITY | keep | Already wired; redesign uses for matrix lookup. |
| 55 | L3.75 | `voiceIdentity.authenticity` | profileTypes.ts:914 | [S] | coachingPlanner | T1 voice profile slot | keep | Used today. |
| 56 | L3.75 | `voiceIdentity.registerShifts[]` | profileTypes.ts:928 | [S] | coaching feedback | T2 synthesis input | keep | Used; Tier 2 sees. |
| 57 | L3.75 | `voiceIdentity.voiceMarkers[]` | profileTypes.ts:941 | [S] | coaching protect-on-revision | T2 → `protectedStrengths` analogue | keep | Already feeds protect logic. |
| 58 | L3.75 | `voiceIdentity.voiceWeaknesses[]` | profileTypes.ts:949 | [S] | coaching stakes verbatim | T2 focus-item candidate | keep | Already L5-adjacent. |
| 59 | L3.75 | `voiceMap.register` (baseline + observations) | profileTypes.ts:970 | [S] | profileRouter:768 | unchanged | keep | Used by router. |
| 60 | L3.75 | `voiceMap.vocabularyFingerprint` | profileTypes.ts:972 | [S] | no consumer found | T1 prompt — voice anchor | rewire | Redesign treats voice as cited UI surface; otherwise dead production. |
| 61 | L3.75 | `voiceMap.sentenceRhythm` | profileTypes.ts:974 | [S] | no consumer found | T1 prompt — voice anchor | rewire | Same. |
| 62 | L3.75 | `voiceMap.perspectiveDistance` | profileTypes.ts:976 | [S] | no consumer found | T1 prompt — voice anchor | rewire | Same. |
| 63 | L3.75 | `voiceMap.tonalDisposition` | profileTypes.ts:978 | [S] | no consumer found | T1 prompt — voice anchor | rewire | Same. |
| 64 | L3.75 | `voiceMap.stabilityRegions[]` | profileTypes.ts:981 | [S] | no consumer found | T1 prompt — voice anchor | rewire | Same. |
| 65 | L3.75 | `voiceMap.shifts[]` (with intentionality) | profileTypes.ts:987 | [S] | no consumer found | T2 focus-item candidate (intentionality flag) | rewire | High-signal field currently unused; redesign elevates. |
| 66 | L3.75 | `emotionalTopography.arcTrajectory` | profileTypes.ts:1099 | [S] | readinessScoring, profileRouter | T2 lede candidate | keep | Used. |
| 67 | L3.75 | `emotionalTopography.peakMoments[]` | profileTypes.ts:1101 | [S] | deepAnnotationService.ts:1707 | unchanged | keep | Already L5 input. |
| 68 | L3.75 | `emotionalTopography.undertones[]` | profileTypes.ts:1107 | [S] | no consumer found | T1 prompt | rewire | Redesign feeds Tier 1 emotional context. |
| 69 | L3.75 | `emotionalTopography.emotionalProgression[]` | profileTypes.ts:1109 | [S] | no consumer found | T1 prompt | rewire | Same. |
| 70 | L3.75 | `emotionalTopography.showVsTell[]` | profileTypes.ts:1115 | [S] | phaseAssessment.ts:284 | unchanged | keep | Drives phase. |
| 71 | L3.75 | `emotionalTopography.authenticityAssessment` | profileTypes.ts:1122 | [S] | no consumer found | T3 authenticity guard input | rewire | Pairs with `voiceIdentity.authenticVsPerformed`; T3 reads. |
| 72 | L3.75 | `momentEarnednessMap.moments[]` | profileTypes.ts:1140 | [S] [★] | no consumer found except deepAnnotationService.ts:1298 | T2 focus-item candidate (earnedness as ranking) | rewire | Whole section near-dead today; redesign promotes earnedness as a top-3 candidate signal. |
| 73 | L3.75 | `momentEarnednessMap.moments[].mechanisms[]` | profileTypes.ts:1165 | [S] | no consumer found | T1 prompt | rewire | Mechanism prose feeds Tier 1 teaching. |
| 74 | L3.75 | `momentEarnednessMap.moments[].gaps[]` | profileTypes.ts:1170 | [S] | no consumer found | T2 focus-item diagnosis | rewire | High-value: explicit "what's missing to earn this" — exactly the focus-item shape. |
| 75 | L3.75 | `momentEarnednessMap.structuralObservation` | profileTypes.ts:1146 | [S] | no consumer found | T2 lede candidate | rewire | Essay-level summary natural for qualitative summary. |
| 76 | L3.75 | `thematicArchitecture.centralThesis` | profileTypes.ts:1193 | [S] | phaseAssessment, deepAnnotationService.ts:1530 | unchanged | keep | Used. |
| 77 | L3.75 | `thematicArchitecture.thesisConfidence` | profileTypes.ts:1195 | [S] | phaseAssessment.ts:221 | unchanged | keep | Used. |
| 78 | L3.75 | `thematicArchitecture.thesisEvolution` | profileTypes.ts:1197 | [S] | no consumer found | T2 reanalysisDelta | rewire | Redesign §3.1 `reanalysisDelta` reads thesis evolution. |
| 79 | L3.75 | `thematicArchitecture.threads[]` | profileTypes.ts:1199 | [S] | phaseAssessment.ts:225 | unchanged | keep | Used. |
| 80 | L3.75 | `thematicArchitecture.subtext` | profileTypes.ts:1206 | [S] | no consumer found | T1 prompt | rewire | Subtext is teachable; Tier 1 should see. |
| 81 | L3.75 | `thematicArchitecture.contradictions[]` (productive tensions) | profileTypes.ts:1208 | [S] | no consumer found | T2 synthesis input (NOT to confuse with coherenceReport contradictions) | rewire | Productive tensions are coaching gold; T2 ranking input. |
| 82 | L3.75 | `narrativeStrategy.primaryStrategy` | profileTypes.ts:1216 | [S] | phaseAssessment.ts:240, deepAnnotationService.ts | unchanged | keep | Used. |
| 83 | L3.75 | `narrativeStrategy.strategyRationale` | profileTypes.ts:1218 | [S] | no consumer found | T1 prompt | rewire | Why-prose for the strategy; T1 should see. |
| 84 | L3.75 | `narrativeStrategy.pivotPoints[]` | profileTypes.ts:1220 | [S] | phaseAssessment.ts:243 | unchanged | keep | Used. |
| 85 | L3.75 | `narrativeStrategy.pacingAnalysis` | profileTypes.ts:1225 | [S] | no consumer found | T1 prompt | rewire | Pacing teaching is on-brand for craft phase. |
| 86 | L3.75 | `narrativeStrategy.structuralChoices[]` | profileTypes.ts:1227 | [S] | no consumer found | T1 prompt | rewire | Same. |
| 87 | L3.75 | `narrativeStrategy.arcType` | profileTypes.ts:1229 | [S] | phaseAssessment.ts:239 | unchanged | keep | Used. |
| 88 | L3.75 | `narrativeStrategy.arcMomentum` | profileTypes.ts:1231 | [S] | phaseAssessment.ts:241 | unchanged | keep | Used. |
| 89 | L3.75 | `narrativeStrategy.turningPoint` | profileTypes.ts:1234 | [S] | L4 northStar, readinessScoring | unchanged | keep | Used. |
| 90 | L3.75 | `characterRevelation.writerPortrait` | profileTypes.ts:1242 | [S] | deepAnnotationService coaching use | unchanged | keep | Used. |
| 91 | L3.75 | `characterRevelation.essayOnlyPortrait` | profileTypes.ts:1245 | [S] | no consumer found | cut (or T1 if pre-coaching baseline desired) | cut | Was meant to differentiate from Conversator-enriched portrait; Conversator seam still in flight, no current use — safe to cut now and re-add if M8 needs it. |
| 92 | L3.75 | `characterRevelation.valuesRevealed[]` | profileTypes.ts:1247 | [S] | phaseAssessment.ts:262 | unchanged | keep | Used. |
| 93 | L3.75 | `characterRevelation.growthArc` | profileTypes.ts:1249 | [S] | phaseAssessment.ts:265 | unchanged | keep | Used. |
| 94 | L3.75 | `characterRevelation.intellectualFingerprint` | profileTypes.ts:1251 | [S] | no consumer found | T1 prompt | rewire | Distinctive prose; voice-anchor adjacent. |
| 95 | L3.75 | `characterRevelation.blindSpots[]` | profileTypes.ts:1253 | [S] | no consumer found | T2 deferred drawer | rewire | Genuine teachable weaknesses; deferred surface fits. |
| 96 | L3.75 | `characterRevelation.revealedQualities[]` | profileTypes.ts:1257 | [S] | admissionsPositioning, portfolioStrategy | unchanged | keep | Used. |
| 97 | L3.75 | `craftAssessment.strengthSignatures[]` | profileTypes.ts:1265 | [S] | phaseAssessment.ts:252 | T2 → protectedStrengths surface | keep | Used; Tier 2 protects them. |
| 98 | L3.75 | `craftAssessment.growthEdges[]` (with `pairedImprovement`) | profileTypes.ts:1271 | [S] | orchestrator harvests into ImprovementCandidateStore | T2 ranked focus candidate | keep | Already first-class candidate stream. |
| 99 | L3.75 | `craftAssessment.imageSystem` | profileTypes.ts:1298 | [S] | no consumer found | T1 prompt (Polish/Distinction) | rewire | Phase-specific; Tier 1 sees in polish/distinction. |
| 100 | L3.75 | `craftAssessment.sentencePatterns` | profileTypes.ts:1300 | [S] | no consumer found | T1 prompt (Polish/Distinction) | rewire | Same. |
| 101 | L3.75 | `craftAssessment.wordPatterns` | profileTypes.ts:1302 | [S] | no consumer found | T1 prompt (Polish/Distinction) | rewire | Same. |
| 102 | L3.75 | `entanglements[]` (CrossDimensionEntanglement) | profileTypes.ts:1315 | [S] | L4 distinctivenessSignature.entanglementRefs | T2 synthesis (cross-dimension teaching seeds) | keep | Already feeds L4; Tier 2 reads via L4. |
| 103 | L3.75 | `admissionsPositioning.tellabilitySummary` | profileTypes.ts:1337 | [S] | deepAnnotationService.ts | T2 lede candidate | keep | Used. |
| 104 | L3.75 | `admissionsPositioning.distinctivenessFactors[]` | profileTypes.ts:1339 | [S] | phaseAssessment.ts:273 | unchanged | keep | Used. |
| 105 | L3.75 | `admissionsPositioning.institutionalFit` | profileTypes.ts:1341 | [S] | no consumer found | SCHOOL_FIT_VECTORS lookup at T0 (when target school known) | rewire | Redesign §2 / §5: school-fit on-demand. |
| 106 | L3.75 | `admissionsPositioning.redFlags[]` | profileTypes.ts:1343 | [S] | phaseAssessment.ts:276 | T2 synthesis input | keep | Used. |
| 107 | L3.75 | `admissionsPositioning.memorability` | profileTypes.ts:1345 | [S] | no consumer found | T2 lede candidate | rewire | Memorability prose feeds qualitative summary. |
| 108 | L3.75 | `admissionsPositioning.portfolioPosition` | profileTypes.ts:1347 | [S] | no consumer found | cut | cut | Portfolio strategy is a separate service; L5 has no surface. |
| 109 | L3.75 | `admissionsPositioning.aoTakeaway` | profileTypes.ts:1349 | [S] | deepAnnotationService.ts | unchanged | keep | Used. |
| 110 | L3.75 | `admissionsPositioning.archetypeContext` | profileTypes.ts:1351 | [S] | deepAnnotationService.ts:177–180 | T0 ledger ARCHETYPE citation kind | keep | Drives L5 stakes today; redesign promotes to citation. |
| | **L3.5 — analysis pass** | | | | | | | |
| 111 | L3.5 | `paragraphs[].analysis.effectiveness` | profileTypes.ts:816 | [S] $0.08 | deepAnnotationService.ts:1316, phaseAssessment | unchanged | keep | Score input. |
| 112 | L3.5 | `paragraphs[].analysis.verdict` | profileTypes.ts:818 | [S] | deepAnnotationService.ts:1317, profileRouter:973 | unchanged | keep | Used. |
| 113 | L3.5 | `paragraphs[].analysis.strengthSignatures[]` | profileTypes.ts:820 | [S] | deepAnnotationService.ts:1318 | T2 protect input | keep | Used. |
| 114 | L3.5 | `paragraphs[].analysis.growthEdges[]` | profileTypes.ts:825 | [S] | deepAnnotationService.ts:1319 | T2 focus candidate | keep | Used. |
| 115 | L3.5 | `sentenceAnalyses[].effectiveness` | profileTypes.ts:695 | [S] | phaseAssessment.ts:182, deepAnnotationService.ts:1355 | unchanged | keep | Used. |
| 116 | L3.5 | `sentenceAnalyses[].effectivenessReasoning` | profileTypes.ts:697 | [S] | no consumer found | cut | cut | Internal reasoning prose; not routed downstream. Cuts ~30 tokens × every sentence. |
| 117 | L3.5 | `sentenceAnalyses[].strengths[]` (ObservationEntry) | profileTypes.ts:699 | [S] | deepAnnotationService annotation gen | unchanged | keep | Used. |
| 118 | L3.5 | `sentenceAnalyses[].weaknesses[]` | profileTypes.ts:701 | [S] | deepAnnotationService.ts:1358 | unchanged | keep | Used. |
| 119 | L3.5 | `sentenceAnalyses[].isStrength` | profileTypes.ts:703 | [S] | phaseAssessment.ts:186 | unchanged | keep | Used. |
| 120 | L3.5 | `sentenceAnalyses[].isProblem` | profileTypes.ts:705 | [S] | phaseAssessment.ts:185, deepAnnotationService.ts:1357 | unchanged | keep | Used. |
| 121 | L3.5 | `sentenceAnalyses[].priorityForImprovement` | profileTypes.ts:707 | [S] | deepAnnotationService.ts:1357 | unchanged | keep | Used. |
| 122 | L3.5 | `sentenceAnalyses[].confidence.level` | profileTypes.ts:3788 | [S] | L5 routing (informal) | T1 prompt — soften framing on low | keep | Redesign §2 italics — route on confidence. |
| 123 | L3.5 | `sentenceAnalyses[].confidence.reasoning` | profileTypes.ts:3786 | [S] | no consumer found | cut | cut | Per redesign §3.7 / Production Diet — drop prose, keep enum. Heavy slice (10–40 tokens × every sentence). |
| 124 | L3.5 | `sentenceAnalyses[].confidence.sensitivityNote` | profileTypes.ts:3793 | [S] | no consumer found | cut | cut | Same; cognitive forcing function but unread. |
| 125 | L3.5 | `sentenceAnalyses[].improvementCandidate` | profileTypes.ts:720 | [S] | orchestrator → ImprovementCandidateStore → manifest | unchanged | keep | Manifest lineage. |
| 126 | L3.5 | `sentenceAnalyses[].patternMatches[]` (KnowledgePatternMatch, Wave-1b) | profileTypes.ts:730 | [S] | no consumer found | T0 ledger PATTERN citation kind | rewire | §5.1c — resolver hydrates patternId at L5 (today resolved at L3.5 only for validation). |
| 127 | L3.5 | `sentenceAnalyses[].symptomType` | profileTypes.ts:739 | [S] | no consumer found | T0 ledger PATTERN citation handle | rewire | §2 italics — promote to `[P-#]` citation. |
| 128 | L3.5 | `sentenceAnalyses[].symptomTypeOpen` | profileTypes.ts:740 | [S] | no consumer found | T1 prompt (LLM-first escape hatch only) | rewire | Keep as escape hatch but route to Tier 1 prompt; otherwise dead. |
| 129 | L3.5 | `sentenceAnalyses[].piqDimensions[]` (Port A3) | profileTypes.ts:758 | [S] | L4 crystallizer, L5 coaching | unchanged | keep | Used. |
| 130 | L3.5 | `sentenceAnalyses[].piqDimensionsOpen` | profileTypes.ts:759 | [S] | no consumer found | cut | cut | Escape-hatch with no resolution path; saves output budget. |
| 131 | L3.5 | `paragraphPatternMatches[]` | profileTypes.ts:1846 | [S] | no consumer found | T0 ledger PATTERN citation kind (paragraph-scope) | rewire | Same shape as sentence-level patternMatches; rewire together. |
| 132 | L3.5 | `calibrationReflection` | profileTypes.ts:1849 | [S] | deepAnnotationService.ts (diagnostics only) | cut | cut | Anti-clustering reflection prose; doesn't reach student or routing. |
| 133 | L3.5 | `comparativeNotes` | profileTypes.ts:1851 | [S] | no consumer found | cut | cut | Anchor comparison prose; not surfaced. |
| 134 | L3.5 | `essayAuthenticityTier` (Port B3, anchor paragraph only) | profileTypes.ts:3862 | [S] | no consumer found | T2 → `qualitativeSummary.authenticityTier` (§3.2) | rewire | Redesign explicitly surfaces. |
| 135 | L3.5 | `narrativeQualityIndex` | profileTypes.ts:3870 | [S] | no consumer found | T2 → score accordion `bandAnchor` | rewire | Redesign §3.5 score reframing. |
| 136 | L3.5 | `holisticAnalysisEvolution` | profileTypes.ts:3873 | [S] | profileManager → L3.75 context | unchanged | keep | Feeds L3.75. |
| | **improvementPhase (phase classifier)** | | | | | | | |
| 137 | improvementPhase | `level` | profileTypes.ts:1859 | [S] $0.025 | deepAnnotationService.ts:494 (PHASE_GUIDANCE) | unchanged | keep | Drives L5 prompt + Tier 2 ranking weights. |
| 138 | improvementPhase | `reasoning` | profileTypes.ts:1861 | [S] | diagnostic only | cut | cut | Not routed to surface; cuts output token budget. |
| 139 | improvementPhase | `focusAreas[]` | profileTypes.ts:1863 | [S] | L5 prompt zoom | unchanged | keep | Used. |
| 140 | improvementPhase | `deferredAreas[]` | profileTypes.ts:1865 | [S] | L5 phase guidance exclusion | T2 → `deferred[]` overflow | keep | Already drives deferral; redesign formalises. |
| 141 | improvementPhase | `readinessAssessment` | profileTypes.ts:1868 | [S] | coaching display | T2 lede candidate | keep | Used. |
| 142 | improvementPhase | `dimensionPhases[]` (per-dimension level + reasoning + coachingApproach) | profileTypes.ts:1882–1886 | [S] | L5 dimension routing | T2 → per-dimension surface filter | keep | §2 italics: use for per-dimension surfacing. |
| 143 | improvementPhase | `dimensionPhases[].reasoning` | profileTypes.ts:1885 | [S] | diagnostic only | cut | cut | Same as `reasoning` — not surfaced. |
| 144 | improvementPhase | `coachingLens` (2–4 sentence directive) | profileTypes.ts:1890 | [S] | deepAnnotationService.ts (direct injection) | unchanged | keep | Load-bearing prompt block. |
| 145 | improvementPhase | `nearBoundary` | profileTypes.ts:1906 | [S] | no consumer found | T2 → qualifies coaching prose ("close to architecture") | rewire | §2 italics + §6.2. |
| 146 | improvementPhase | `transition.priorLevel` | profileTypes.ts:1897 | [S] | deepAnnotationService.ts | unchanged | keep | Used. |
| 147 | improvementPhase | `transition.isGenuineShift` | profileTypes.ts:1898 | [S] | deepAnnotationService.ts | unchanged | keep | Used. |
| 148 | improvementPhase | `transition.transitionReasoning` | profileTypes.ts:1899 | [S] | diagnostic only | cut | cut | Internal reasoning; not surfaced. |
| | **L4 — North Star** | | | | | | | |
| 149 | L4 | `northStar.activeScale` | profileTypes.ts:1378 | [S] $0.05 | profileRouter.ts:1040–1044 | unchanged | keep | Routing. |
| 150 | L4 | `northStar.throughLineMap` (centralElement + journey[]) | profileTypes.ts:1386, 1427–1439 | [S] | L5 holistic context (profileRouter) | unchanged | keep | Load-bearing. |
| 151 | L4 | `northStar.structuralRolesMap[].weight` | profileTypes.ts:1455 | [S] | L5 feedback annotations | T2 → ranking weight ("load_bearing" boost) | keep | Already drives L5; redesign formalises ranking. |
| 152 | L4 | `northStar.trajectory.plausiblePaths[]` | profileTypes.ts:1469–1475 | [S] | portfolio strategy | T2 deferred drawer (path options) | keep | Mostly portfolio; coaching can cite. |
| 153 | L4 | `northStar.distinctivenessSignature.articulation` | profileTypes.ts:1488 | [S] | L5 holistic context | T2 lede + Distinction-phase content | keep | §2 italics: drives Distinction. |
| 154 | L4 | `northStar.distinctivenessSignature.nonInterchangeableFactors[]` | profileTypes.ts:1492 | [S] | L5 holistic context | T1 prompt + T2 lede | keep | Already used; redesign elevates. |
| 155 | L4 | `northStar.intentBridge.systemReading` | profileTypes.ts:1502 | [S] | L5 holistic context, L6 coaching | unchanged | keep | Used. |
| 156 | L4 | `northStar.intentBridge.alignments[]` | profileTypes.ts:1504–1508 | [S] | L6 coaching (alignments fuel) | unchanged | keep | L6 owns. |
| 157 | L4 | `northStar.confidence` | profileTypes.ts:1415 | [S] | L5 / L6 | unchanged | keep | Routing. |
| 158 | L4 | `northStar.lastUpdatedBy` | profileTypes.ts:1417 | [D] | audit trail only | unchanged | keep | Bookkeeping (Rule 6). |
| 159 | L4 | `northStar.evolution` | profileTypes.ts:1419 | [S] | L5 stability context, re-analysis briefing | T2 reanalysisDelta | keep | Used. |
| | **L4 — Score Matrix + Coaching Map** | | | | | | | |
| 160 | L4 | `scoreMatrix.paragraphs[].scores.{effectiveness,structural,voice,emotional,thematic}` | profileTypes.ts:2497 + paragraphScoreEntry | [S] | L5 feedback annotations | T2 score accordion `trajectory` | keep | §3.5 score reframing reads numbers. |
| 161 | L4 | `scoreMatrix.paragraphs[].verdict` | (paragraphScoreEntry) | [S] | L5 feedback annotations | T2 score accordion | keep | Same. |
| 162 | L4 | `scoreMatrix.paragraphs[].priorityForImprovement` | (paragraphScoreEntry) | [S] | L4b consolidation, L5 prioritization | T2 ranking input | keep | Already used. |
| 163 | L4 | `scoreMatrix.crossParagraphPatterns[]` | profileTypes.ts:2499 | [S] | deepAnnotationService.ts:529–534 | T2 synthesis input | keep | Already injected (post Phase 6a). |
| 164 | L4 | `coachingMap.transformativeInsight.insight` | profileTypes.ts:2605 | [S] | deepAnnotationService.ts:518–523 | T2 → `qualitativeSummary.lede` (when present) | keep | §2 italics: the lede of the qualitative summary. |
| 165 | L4 | `coachingMap.transformativeInsight.evidenceLocations[]` | profileTypes.ts:2606 | [S] | L5 grounding | unchanged | keep | Used. |
| 166 | L4 | `coachingMap.transformativeInsight.whyThisTransforms` | profileTypes.ts:2607 | [S] | L5 coaching frame | unchanged | keep | Used. |
| 167 | L4 | `coachingMap.transformativeInsight.requiresStudentAwareness` | profileTypes.ts:2608 | [S] | L5 annotation routing | unchanged | keep | Used. |
| 168 | L4 | `coachingMap.priorities[]` (priority + target + architecturalReason + unlocksNext + expectedImpact + consolidatedFrom) | profileTypes.ts:2611–2634 | [S] [★] | L5 + L6 strategy | T2 → ranked source for top-3 | keep | §2 italics: the ranked source for Focus Mode. |
| 169 | L4 | `coachingMap.priorities[].unlocksNext` | profileTypes.ts:2615 | [S] | L6 coaching sequence (NOT L5 today) | T2 deferred drawer "promotion path" | rewire | Surfacing in deferred drawer makes the unlock pattern visible. |
| 170 | L4 | `coachingMap.priorities[].consolidatedFrom[]` | profileTypes.ts:2633 | [S] | L5 annotation citations | T0 ledger lineage refs | keep | Already cited. |
| 171 | L4 | `coachingMap.protectedStrengths[]` | profileTypes.ts:2636–2640 | [S] | L5 + L6 | T2 → `FocusItem.protectedBy[]` refs | keep | §2 italics: drives "do not damage" guards. |
| 172 | L4 | `coachingMap.emergentPatterns[]` (≤3, ≤20 words) | profileTypes.ts:2654 | [S] | deepAnnotationService.ts:518–523 | T2 synthesis input | keep | Already used (post 6a). |
| 173 | L4 | `coachingMap.scoreTensions[]` (≤3, ≤15 words) | profileTypes.ts:2663 | [S] | deepAnnotationService.ts:518–523 | T2 synthesis input | keep | Same. |
| | **L4 — Coherence Report** | | | | | | | |
| 174 | L4 | `coherenceReport.contradictions[]` (CoherenceIssue) | profileTypes.ts:2552 | [S] | contradictionConsumer.ts | T2 (flag for L6, not for L5 to resolve) | keep | §2 italics: flag for L6 investigation. |
| 175 | L4 | `coherenceReport.contradictions[].severity` | profileTypes.ts:2525 | [S] | contradictionConsumer routing | unchanged | keep | Routing. |
| 176 | L4 | `coherenceReport.contradictions[].routingCategory` | profileTypes.ts:2535 | [S] | growth cycle | unchanged | keep | Routing. |
| 177 | L4 | `coherenceReport.isCoherent` | profileTypes.ts:2554 | [S] | re-analysis decision | unchanged | keep | Used. |
| 178 | L4 | `coherenceReport.northStarAssessment` (adversarial Haiku) | profileTypes.ts:2562 | [H] $0.005 | optional validator | unchanged | keep | Cheap; helps catch L4 collapse. |
| | **Findings (FindingStore)** | | | | | | | |
| 179 | Finding | `id` | profileTypes.ts:3455 | [D] | all layers query by ID | T0 ledger `[F-#]` citation | keep | Citation handle. |
| 180 | Finding | `claim` | profileTypes.ts:3458 | [S] | L5 + L6 | T0 → student-facing teaching | keep | The claim is the teaching. |
| 181 | Finding | `scope` (type + paragraph + sentences + paragraphs + textEvidence) | profileTypes.ts:3461 | [S] | L5 filtering | unchanged | keep | Used. |
| 182 | Finding | `maturity` | profileTypes.ts:3464 | [S] | L5 filtering, L6 | T0 filter (`maturity='hypothesis'` → hide from student) | keep | §2 italics + §5.1d. |
| 183 | Finding | `maturityReasoning` | profileTypes.ts:3471 | [S] | backward-compat | cut | cut | Replaced by lineage[]; saves output. |
| 184 | Finding | `coachingValue` | profileTypes.ts:3474 | [S] | L5 filtering, L6 priority | T0 → ranking weight | keep | Routing tag. |
| 185 | Finding | `dimensions[]` | profileTypes.ts:3477 | [S] | L5 routing | unchanged | keep | Routing. |
| 186 | Finding | `buildsOn[]` | profileTypes.ts:3480 | [S] | growth cycle, L6 | T0 → "this builds on F2" provenance for citations | rewire | §2 italics: pre-compute provenance. |
| 187 | Finding | `relatedTo[]` | profileTypes.ts:3483 | [S] | growth cycle weaving | T0 → lateral citation chain | rewire | Same. |
| 188 | Finding | `supersededBy` | profileTypes.ts:3486 | [S] | active-only filter | T0 hide superseded from student-facing | keep | Already filters; cite policy. |
| 189 | Finding | `supersessionReason` | profileTypes.ts:3492 | [S] | audit trail | cut | cut | Lineage[] carries this; redundant. |
| 190 | Finding | `source` (walk / deep_dive / ...) | profileTypes.ts:3495 | [D] | lineage tracking, L5 provenance | unchanged | keep | Bookkeeping. |
| 191 | Finding | `deepeningPotential` | profileTypes.ts:3502 | [S] | growth cycle, deep-dive dispatch | unchanged | keep | Used. |
| 192 | Finding | `raisesQuestions[]` | profileTypes.ts:3505 | [S] | L3.75 curation | T1 coaching question seed | rewire | Coaching delivery's `question` can pull from this. |
| 193 | Finding | `evidence[]` (text + location + present/absent) | profileTypes.ts:3508 | [S] | L5 + L6 | T2 → `FocusItem.evidence` | keep | Already used. |
| 194 | Finding | `lineage[]` (append-only) | profileTypes.ts:3514 | [D] | audit trail, validator | unchanged | keep | Bookkeeping (Rule 6). |
| 195 | Finding | `createdAt` / `lastUpdated` | profileTypes.ts:3517–3520 | [D] | ordering, audit | unchanged | keep | Bookkeeping. |
| | **Profile Router (`l5_feedback_annotations` rule)** | | | | | | | |
| 196 | profileRouter | rule existence | profileRouter.ts:53 / 1000–1074 | [D] | L5 service entry | unchanged | keep | The routing contract. |
| 197 | profileRouter | `included: profileIndex` (~100T) | profileRouter.ts:1011–1016 | [D] | L5 foundation | unchanged | keep | Cheap; routing-essential. |
| 198 | profileRouter | `included: holisticFull` (~2000T) | profileRouter.ts:1019–1036 | [D] | L5 holistic frame | T2 synthesis input (synthesis owns ranking) | keep | Tier 2 reads holistic synthesis to rank. |
| 199 | profileRouter | `included: northStar` (~500T) | profileRouter.ts:1039–1044 | [D] | L5 structural reference | unchanged | keep | Same. |
| 200 | profileRouter | `included: paragraph_P*_full` (~3000T, all paragraphs) | profileRouter.ts:1047–1063 | [D] | L5 sentence annotation | unchanged | keep | Required for per-paragraph calls. |
| 201 | profileRouter | `included: connections` (~300T) | profileRouter.ts:1066–1071 | [D] | L5 relational context | unchanged | keep | Required for cross-para references. |
| | **Corpus + taxonomies + rubrics** | | | | | | | |
| 202 | corpus | `TOP_TIER_CRAFT_MOVES` (190 entries: id, displayName, mechanism, sourceEssays, compatibleRegisters, transferability) | corpus/topTierCraftMoves.ts:21 | [D] | corpus/retrieval.ts; L3.5 retrieval glue | T0 → `[MOVE-#]` resolver | rewire | §5.1a — hydrate to displayName + sourceEssays + excerpts. |
| 203 | corpus | `MOVE_EXCERPTS` (53 entries, anchorLevel-tagged) | corpus/moveExcerpts.ts:21 | [D] | corpus/retrieval.ts | T0 → calibration few-shot retrieval (`anchorLevel ≥ 9` filter) | rewire | §5.1a — surface actual quoted sentence + essayId + paragraph. Today never reaches L5 prompt. |
| 204 | corpus | `ESSAY_ARCHETYPES` (14: 10 attested + 4 Hopkins-PROVISIONAL) | corpus/essayArchetypes.ts:21 | [D] | corpusRetrievalBlocks.retrievePhaseArchetypes | T0 → `[ARCHETYPE-#]` citation kind | rewire | §5 — inject when phase=architecture and archetype context applies. |
| 205 | corpus | `ESSAY_ARCHETYPES.loadBearingMoveIds` | essayArchetypes.ts | [D] | structural validation | T0 ledger | rewire | Move-validation through archetype lens. |
| 206 | corpus | `ESSAY_ARCHETYPES.voiceRequirements` | essayArchetypes.ts | [D] | VOICE_ARCHETYPE_COMPATIBILITY index | unchanged | keep | Used. |
| 207 | corpus | `ESSAY_ARCHETYPES.schoolFitStrength` (210 mappings) | essayArchetypes.ts | [D] | future L6 ranking | T0 SCHOOL_FIT integration | rewire | Wire to SCHOOL_FIT_VECTORS retrieval when school named. |
| 208 | corpus | `ANTI_ARCHETYPES` (11: id + description + failureMode + corpusAlternativeArchetypeId + transplantPath) | corpus/antiArchetypes.ts:15 | [D] | claudeRetrieval.retrieveAntiPatterns (L3.5 only) | T0 → `[AP-#]` citation kind with transplant path | rewire | §1.8 + §5.1b — the gap the brief identified. Today telemetry-tagged, never resolved into student teaching. |
| 209 | corpus | `VOICE_ARCHETYPE_COMPATIBILITY` (98 cells: fit + rationale, with PROVISIONAL marker) | corpus/voiceArchetypeCompatibility.ts:32–193 | [D] | corpusRetrievalBlocks (voice filtering) | T0 ledger lookup; cited soft refusal of forbidden cells | rewire | §1.8 + §5.2 — never consulted at L5 today. |
| 210 | corpus | `CORPUS_LIMITS` (18 conditions: cannotTeachWhen + detectionGuidance) | corpus/corpusLimits.ts:15–166 | [D] | analysis-side gating | T0 → injected condition + detectionGuidance into Tier 1 prompt | rewire | §5.2 — soft refusal, not hard gate. |
| 211 | corpus | `READER_BIAS_GUARDS` (14: appliesTo includes 'L5' for 8/14 per redesign — agent says 12/14, **needs verification**) | corpus/readerBiasGuards.ts:16 | [D] | patternCatalogBlock.ts (L3.5 prompt) | T1 prompt + T3 Haiku self-check | rewire | §5.2 — corrective instructions injected; soft flag, not delete. |
| 212 | corpus | `DELIBERATE_ABSENCES` (16) | corpus/deliberateAbsences.ts:14 | [D] | (referenced; verify consumer) | T1 prompt — what NOT to do | rewire | Pairs with bias guards as cited evidence. |
| 213 | corpus | `CONTEXTUAL_VALIDITY_PATTERNS` (21) | corpus/contextualValidity.ts:16 | [D] | (referenced; verify consumer) | T1 prompt — reframe "cliché" as context-dependent | rewire | §2 — never retrieved at L5 today. |
| 214 | corpus | `MOVE_DEPENDENCIES` (6 hardRequires + 15 total with enables-mirror) | corpus/moveDependencies.ts:42 | [D] | (move-sequencing validation) | T0 → gate co-suggested moves | rewire | §2 — gate co-suggestions. |
| 215 | corpus | `SCHOOL_FIT_VECTORS` (95 records / 15 schools, ~120 archetype affinity mappings) | corpus/schoolFitVectors.ts:25 | [D] | (future L6 ranking) | T0 → on-demand when target school named in session | rewire | §1.8 / §2 — never fires today. |
| 216 | corpus | `corpusRetrievalBlocks.retrieveAnchorMoves` (Haiku retrieval glue) | analysis/corpusRetrievalBlocks.ts | [H] ~$0.005 | analysis-pass injection | T0 ledger consumes telemetry only; resolver is pure | keep | Glue stays; resolver replaces post-retrieval consumption. |
| 217 | corpus | `claudeRetrieval` corpus prompt-cache | corpus/claudeRetrieval.ts | [H] amortized | L3.5 retrieval pipeline | unchanged | keep | Existing cache. |
| 218 | taxonomy | `ISSUE_PATTERN_INDEX` (40 PIQ + 35 Common App = 75; id + namespace + severity + oneLineTrigger) | taxonomies/issuePatternIndex.ts | [D] | patternCatalogBlock.ts (L3.5 catalog injection) | T0 → patternId resolver hydrates from `src/services/piq/issuePatterns.ts` (full template) | rewire | §5.1c — the architectural shift: resolution moves from L3.5 (validation) to L5 (hydration with teachingTemplate). |
| 219 | piq | full fix-strategy template | src/services/piq/issuePatterns.ts | [D] | (read at L3.5 for validation only) | T0 ledger — paired with patternId for student teaching | rewire | The redesign brief specifically called out reading this file first; pairing closes the gap. |
| 220 | rubric | `PIQ_RUBRIC_DIMENSIONS` (13) + `PRIMARY_DIMENSIONS_BY_PIQ` | rubrics/piqRubric.ts:26, 49–55 | [D] | L3.5 PIQ_MODE prompt | unchanged | keep | Used. |
| 221 | rubric | `ESSAY_AUTHENTICITY_TIERS` (4 tiers: distinctive / authentic / emerging / manufactured) + definitions | rubrics/authenticityTiers.ts:59, 77–132 | [D] | L3.5 PS2_AUTHENTICITY block | T2 → `qualitativeSummary.authenticityTier` | rewire | §2 — surface tier to UI. |
| | **L5 outputs today (deepAnnotationService → L5Annotation + L5AnnotationResult)** | | | | | | | |
| 222 | L5 | `L5Annotation.id` | deepAnnotationService.ts:132 | [S] | l5ManifestMerger.ts:153 | unchanged | keep | Provenance. |
| 223 | L5 | `L5Annotation.location.{paragraphIndex,sentenceIndex,spanText}` | deepAnnotationService.ts:135–140 | [S] | l5ManifestMerger.ts:96–98 + UI highlight | unchanged | keep | Anchor. |
| 224 | L5 | `L5Annotation.type` (strength / growth / structural / teaching) | deepAnnotationService.ts:147 | [S] | l5ManifestMerger.ts | unchanged | keep | Routing taxonomy. |
| 225 | L5 | `L5Annotation.teachingIntent` | deepAnnotationService.ts:153 | [S] | no consumer | cut | cut | Telemetry-only; LLM-first non-enum free-text but never read. Saves output. |
| 226 | L5 | `L5Annotation.teachingMode` | deepAnnotationService.ts:164 | [S] | l5ManifestMerger.ts:59, 62 | unchanged | keep | Mode routing. |
| 227 | L5 | `L5Annotation.content` | deepAnnotationService.ts:167 | [S] | analysisOrchestrator.ts:860 (diag log) | T2 → `FocusItem.diagnosis` (renamed) | keep | The diagnosis prose. |
| 228 | L5 | `L5Annotation.teachingRationale` | deepAnnotationService.ts:170 | [S] | no consumer | cut | cut | Telemetry-only; redundant with rankRationale at Tier 2. |
| 229 | L5 | `L5Annotation.northStarConnection` | deepAnnotationService.ts:173 | [S] | groundingQuality diagnostic only | unchanged (read by T2 lede) | keep | Load-bearing teaching field. |
| 230 | L5 | `L5Annotation.stakes` | deepAnnotationService.ts:187 | [S] | l5ManifestMerger.ts:135–139 → ImprovementEntry.stakes | unchanged | keep | Manifest-bound. |
| 231 | L5 | `L5Annotation.priority` (1–5) | deepAnnotationService.ts:193 | [S] | l5ManifestMerger.ts:62 | T2 ranking input | keep | Becomes ranking input rather than direct top-N. |
| 232 | L5 | `L5Annotation.phase` | deepAnnotationService.ts:196 | [S] | no consumer | cut | cut | Container.phase covers it; per-annotation duplication is dead. |
| 233 | L5 | `L5Annotation.rewriteExample` | deepAnnotationService.ts:209 | [S] | l5ManifestMerger.ts:106–116 → essaySpecificDemo + demonstration | unchanged + add `inlineCommand` + `authenticityFlag` + `fabricationGuard` | keep | Core rewrite delivery; redesign §3.2 extends. |
| 234 | L5 | `L5Annotation.wordEconomyCut` | deepAnnotationService.ts:221 | [S] | l5ManifestMerger.ts:143–146 → ImprovementEntry.wordEconomyCut | unchanged | keep | Manifest-bound. |
| 235 | L5 | `L5Annotation.antiPatternExample` | deepAnnotationService.ts:236 | [S] | UI display, coaching | unchanged | keep | UI-bound. |
| 236 | L5 | `L5Annotation.transferablePrinciple` | deepAnnotationService.ts:252 | [S] | l5ManifestMerger.ts:122–126 → ImprovementEntry.technique | unchanged + cite `[MOVE-#]` | keep | Already wired; redesign cites against corpus. |
| 237 | L5 | `L5Annotation.confidence` | deepAnnotationService.ts:255 | [S] | no consumer | cut | cut | Per redesign §3.7 — confidence as enum lives on input (L3.5), not L5 output. |
| 238 | L5 | `L5Annotation.crossParagraphRefs` | deepAnnotationService.ts:262 | [S] | no consumer | cut | cut | Telemetry-only; cross-para call's output container handles refs. |
| 239 | L5 | `L5Annotation.capacityBuildingNote` | deepAnnotationService.ts:269 | [S] | no consumer | cut | cut | Telemetry-only. |
| 240 | L5 | `L5Annotation.groundingQuality` | deepAnnotationService.ts:276 | [D] | console.warn at :660–668 only | cut | cut | §1.7 explicit cut: "diagnostic only, coaching never reads it." |
| 241 | L5 | `L5AnnotationResult.paragraphAnnotations[]` | deepAnnotationService.ts:295 | [S] | l5ManifestMerger.ts:87–90 | unchanged + projected to T2 input | keep | Manifest spine. |
| 242 | L5 | `L5AnnotationResult.essayLevelAnnotations[]` | deepAnnotationService.ts:296 | [S] | l5ManifestMerger.ts:92–98 | unchanged | keep | Manifest spine. |
| 243 | L5 | `L5AnnotationResult.crossParagraphAnnotations[]` | deepAnnotationService.ts:298 | [S] | analysisOrchestrator.ts:860 (diag log only — NOT merged into manifest) | T2 absorbs (redesign §4 replaces this Sonnet call) | rewire | §4.1 / §13 M3 — Tier 2 synthesis subsumes. The cross-para Sonnet call (~$0.01/essay) ends. |
| 244 | L5 | `L5AnnotationResult.phase` | deepAnnotationService.ts:299 | [S] | analysisOrchestrator.ts:861 (log) | unchanged | keep | Output bookkeeping. |
| 245 | L5 | `L5AnnotationResult.annotationCount` | deepAnnotationService.ts:300 | [D] | analysisOrchestrator.ts:859 (log) | unchanged | keep | Bookkeeping. |
| 246 | L5 | `L5AnnotationResult.densityDiagnostics[]` | deepAnnotationService.ts:302 | [S] | console.log :762–765 only | cut | cut | §1.7 explicit cut: "logged, no downstream consumer." |
| 247 | L5 | `L5AnnotationResult.cost` / `tokenUsage` / `timingMs` | deepAnnotationService.ts:303–310 | [D] | analysisOrchestrator.ts cost tracking | unchanged | keep | Bookkeeping (Rule 6). |
| | **L5 dead-code paths (no LLM cost; code-rot risk)** | | | | | | | |
| 248 | L5 | `buildSharedContext()` legacy method (151 lines) | deepAnnotationService.ts:1097–1247 | [D] | none — superseded by `analysisContextBuilder.buildSharedDigest('l5')` + Phase 6a augmentations | cut | cut | Already on Phase 6b deletion queue. Confirmed unwired by the consumption agent's grep. |
| 249 | L5 | unwired `priorAnnotations` in live path | analysisOrchestrator.ts:850 (passes `undefined` outside re-analysis) | [D] | re-analysis only | wire into live path (M0 hygiene per §13) | rewire | §1.7 — the wire exists but is fed `undefined`. |
| 250 | L5 | cross-paragraph synthesis call | deepAnnotationService.ts:728–753 (caller) + 2205–2320 (impl) | [S] ~$0.01 | output → diagnostic log only | cut once T2 synthesis ships | cut | Step 3: Tier 2 synthesis absorbs the responsibility (§4.1). Net cost recovery offsets ~half of T2's $0.018. |

## Totals

- **Rows total:** 250
- **keep:** 162 (~65%)
- **rewire:** 67 (~27%)
- **cut:** 21 (~8%)

## Notes on completeness and verification debt

1. **READER_BIAS_GUARDS layer count:** redesign doc says 8 of 14 guards have `appliesTo` includes `'L5'`; the corpus inventory agent counted 12 of 14 ("guards span L3–L6"). Resolver implementation must verify directly against `corpus/readerBiasGuards.ts:21–109` before wiring. Tracked as row 211 verification debt.
2. **DELIBERATE_ABSENCES (16) and CONTEXTUAL_VALIDITY_PATTERNS (21) consumers:** corpus inventory flagged these as referenced but did not produce a definitive consumer file. Before cutting or rewiring, grep `import .* deliberateAbsences` and `import .* contextualValidity` to confirm scope.
3. **paragraphScoreEntry sub-fields (rows 160–162):** the L4 inventory agent could not pin exact line numbers for `scores.{effectiveness,structural,voice,emotional,thematic}` because `ParagraphScoreEntry` is defined in a separate type — likely under `crystallizer.ts` or a sibling. Resolver implementation verifies before any cut.
4. **L3.5 `essayAuthenticityTier` and `narrativeQualityIndex`** are emitted only on the **anchor paragraph** (Port B3); rows 134–135 reflect that gating. T2 synthesis input must be aware that other paragraphs return `null`.
5. **Hopkins-PROVISIONAL voice×archetype cells:** the resolver must surface the PROVISIONAL marker in citation prose per redesign §5.4. Corpus inventory confirmed the markers at voiceArchetypeCompatibility.ts:85–99. Open Tue question Q5 covers the citation policy.
6. **`scoreMatrix.coachingMap` location:** inventory agent confirmed populated by L4b (not L4a) at orchestrator level. Cost band split: L4a ≈ $0.10, L4b ≈ $0.05.
7. **Confidence-prose cuts (rows 123–124):** redesign §3.7 conditions the cut on "if not routed downstream." `effectivenessReasoning` (row 116) and confidence prose share the same conditional logic. The audit assigns `cut` proposals; the actual cuts happen in Step 3 only after a confirmation grep against the live codebase shows zero reads.
8. **Dead-code path cuts (rows 248–250):** all three are cleanup, not behavior changes. Row 250 (cross-paragraph synthesis call) cuts only AFTER M3 (Tier 2 synthesis) ships and shadow validates. Today: keep until cut-over.

## What this audit does NOT do

- It does not implement any cuts. All cuts are proposals. Step 3 executes them after Tue signs off on the verdict column.
- It does not redesign upstream production. If a "no consumer" row gets `rewire` to a Tier 1 or Tier 2 surface, that means the field stays produced and starts being read; if it gets `cut`, the upstream prompt that produces it should also drop the field. The Step 3 implementation handles both sides of each row's cut, but the audit is single-sided here.
- It does not number-quantify the per-essay cost recovery from cuts beyond the rough estimate in the report-back. A precise number requires running an instrumented L5 call and measuring per-field output token shares — not in scope for Step 1.

---

## §A1 — Carry-forward classification (sourced from `L5_ITERATION_LOOP_DESIGN.md` §3)

Every audit row gets a carry-forward default. Categories:

- **`carry`** — unconditionally carry forward unless explicit invalidation; cost-to-re-derive is meaningful.
- **`carry-with-validity-test`** — carry forward by default; an explicit validity test (paragraph diff, anchor check, register-shift detector, etc.) determines invalidation per iteration.
- **`re-derive`** — re-derive when the relevant trigger fires (paragraph touched, structural reorder, etc.).
- **`re-derive-each-iter`** — always re-derive every iteration regardless of edit (cheap or load-bearing for current state).
- **`static-asset`** — corpus / taxonomy / rubric; never produced fresh; always read from disk.
- **`bookkeeping`** — system state with no LLM cost (id, timestamps, lineage); always carry, always read.

| Audit rows | Layer | Default | Validity test | Source row in iteration design §3 |
|---|---|---|---|---|
| 1–11 | L1 (per-paragraph descriptive + ProfileIndex) | `carry-with-validity-test` (per-paragraph) | Paragraph text changed at sentence level → re-run Haiku on that paragraph; ProfileIndex always re-derived | Inventory row #1 (per-paragraph), #2 (ProfileIndex) |
| 12–22 | L2 (StructuralCartography) | `carry-with-validity-test` | `selectAnalysisMode()` rule 3 (reorder) OR significance=transformative on >2 paragraphs | Inventory row #3 |
| 23–26 | L2.5 (ConnectionScoutOutput) | `re-derive` | Any non-trivial paragraph edit | Inventory row #4 |
| 27–32 | L3 (paragraphUnderstanding container + sub-fields) for **unchanged** paragraphs | `carry` | Paragraph diff = none | Inventory row #5 |
| 33–43 | L3 (sentenceUnderstandings + sub-fields) for changed paragraphs | `re-derive` (with prior understanding as input context) | Paragraph diff ≥ minor | Inventory row #6 |
| 44 | L3 `holisticEvolution` snapshot | `re-derive-each-iter` (propagates through walk's running-state) | Always | Inventory row #7 |
| 45 | L3 `priorSentenceUpdates[]` (back-prop) | `bookkeeping` (supersession + lineage append-only) | — | Inventory row #8 |
| 46 | L3 `newConnections[]` | `carry-with-validity-test` (per-connection) | Either endpoint paragraph changed | Inventory row #9 |
| 47–48 | L3 `newFindings[]` + `findingEvolutions[]` | routes through Finding lifecycle (see rows 33–34 of inventory) | per-finding evidence anchor | Inventory rows #10, #34 |
| 49–58 | L3.75 `voiceIdentity` (signature + sub-fields) | `carry` | Haiku register-shift detector flags drift on changed paragraphs | Inventory row #11 |
| 59–65 | L3.75 `voiceMap` (register / vocabulary / rhythm / perspective / tone / stability / shifts) | `carry` for stable dimensions; `carry-with-validity-test` for shifts (per-shift anchor paragraph) | Per-shift anchor paragraph touched | Inventory row #12 |
| 66–71 | L3.75 `emotionalTopography` | `carry-with-validity-test` (peak-moment edits) | Peak-moment anchor paragraph touched | Inventory row #13 |
| 72–75 | L3.75 `momentEarnednessMap` | `re-derive` if any moment-anchor paragraph touched | Anchor change | Inventory row #14 |
| 76–81 | L3.75 `thematicArchitecture` | `re-derive` on structural edits OR thesis-anchor edits | Reorder OR thesis-anchor change | Inventory row #15 |
| 82–89 | L3.75 `narrativeStrategy` | `re-derive` on reorder OR pivot/turning-point edits | Reorder OR pivot edit | Inventory row #16 |
| 90–96 | L3.75 `characterRevelation` | `carry` (slow-changing) | Substantial revelation-bearing edit (LLM judges) | Inventory row #17 |
| 97–101 | L3.75 `craftAssessment` | `re-derive` in polish/distinction phase OR craft-pattern paragraph edit | Phase + edit conjunction | Inventory row #18 |
| 102 | L3.75 `entanglements[]` | `re-derive` on multi-paragraph edits | ≥2 paragraphs | (extension of inventory rows; see iteration design §4.5) |
| 103–110 | L3.75 `admissionsPositioning` | `carry` with refresh on substantial repositioning | Significance ≥ transformative | Inventory row #19 |
| 111–114 | L3.5 `paragraphAnalysis` for **unchanged** paragraphs | `carry` | Paragraph diff = none | Inventory row #20 |
| 115–124 | L3.5 `sentenceAnalyses` for **changed** paragraphs | `re-derive` | Paragraph touched | Inventory row #21 |
| 125–130 | L3.5 `improvementCandidate`, `patternMatches`, `symptomType`, `symptomTypeOpen`, `piqDimensions`, `piqDimensionsOpen` | bundled with sentence-level analysis | (per row 21) | Inventory row #21 |
| 131–135 | L3.5 paragraph-scope (`paragraphPatternMatches`, `calibrationReflection`, `comparativeNotes`, `essayAuthenticityTier`, `narrativeQualityIndex`) | bundled with paragraph re-derivation | Per row 21 | Inventory row #21 |
| 136 | L3.5 `holisticAnalysisEvolution` | `re-derive-each-iter` (feeds L3.75) | Always | Inventory row #21 |
| 137–148 | improvementPhase (level + sub-fields + dimensionPhases + transition) | `re-derive-each-iter` | Always (the phase is a lens, not a derivation) | Inventory row #23 |
| 149–159 | L4 `northStar` (activeScale + throughLineMap + structuralRolesMap + trajectory + distinctivenessSignature + intentBridge + confidence + evolution) | `carry` unless arc/turning-point edit OR reorder | structural reorder OR turningPoint paragraph edit OR arcMomentum-bearing edit | Inventory row #24 |
| 160–163 | L4 `scoreMatrix` per-paragraph + crossParagraphPatterns | `carry` unchanged paragraphs; `re-derive` changed; crossParagraphPatterns `re-derive` on multi-paragraph edits | Per-paragraph diff | Inventory rows #25, #26 |
| 164–173 | L4 `coachingMap` (transformativeInsight + priorities + protectedStrengths + emergentPatterns + scoreTensions) | `re-derive-each-iter` (consolidates current state for L5) | Always | Inventory row #27 |
| 174–178 | L4 `coherenceReport` (contradictions + isCoherent + northStarAssessment) | `re-derive-each-iter` (cheap, Haiku adversarial) | Always | Inventory row #28 |
| 179–195 | Findings (id + claim + scope + maturity + dimensions + buildsOn + relatedTo + supersededBy + supersessionReason + source + deepeningPotential + raisesQuestions + evidence + lineage + timestamps) | `carry-with-validity-test` (anchor-in-changed-paragraph triggers Haiku validity check; maturity transitions per LLM judgment) | Anchor in changed paragraph OR `StalenessEffect.target = 'finding'` | Inventory rows #33, #34 |
| 196–201 | Profile router rule + included slices | `bookkeeping` (deterministic routing) | — | (no inventory row; pure routing) |
| 202–221 | Corpus + taxonomies + rubrics | `static-asset` | — | Inventory row #37 (corpus telemetry persists) |
| 222–247 | L5 outputs (L5Annotation fields + L5AnnotationResult container + per-paragraph annotations + cross-paragraph) | output of step 16; persisted as taughtMoves derivative each iteration | (per L5 generation) | Inventory rows #29, #30, #31, #32 |
| 248–250 | L5 dead-code paths | `cut` once Tier 2 synthesis subsumes (per cut verdicts already assigned) | — | (cleanup) |

**Carry-forward implications for build:**

- Rows with `carry` or `carry-with-validity-test` are eligible for the iteration loop's selective-carry-forward optimization. Their re-derive cost (visible in the audit's "cost" column) is the savings the iteration loop captures when carry-forward holds.
- Rows with `re-derive-each-iter` always pay full cost; the iteration loop does not optimize them. Most are cheap (Haiku) or load-bearing (improvementPhase, coachingMap, coherenceReport).
- Rows with `static-asset` are loaded once and cached; corpus retrieval glue (Haiku) amortizes via prompt-cache.
- Rows with `bookkeeping` are append-only or deterministic; never paid for in LLM cost.

---

## §A2 — Proposed-consumer rewire to experience-target surfaces

The original audit's `proposed consumer` column referenced redesign-doc primitives (T1 prompt slot, T2 synthesis input, T2 deferred drawer, T0 ledger). The experience target redefined the surfaces. This addendum maps the rewires from primitives to surfaces. Read together with the original audit's `proposed consumer` column; this is the *what the student-facing surface actually is* layer.

| Original audit "proposed consumer" | Experience-target surface | Doc reference |
|---|---|---|
| T1 prompt — voice anchor | **Voice anchor** (standing surface, §5.6) | `L5_EXPERIENCE_TARGET.md` §5.6 |
| T1 prompt (general — reading strategy, phase context) | Tier 1 per-paragraph annotation prompt; outputs feed the **focus surface** (§5.3) | §5.3 |
| T2 → ranked source for top-3 | **Focus surface** (essay-sized, redundancy-forbidden — NOT top-3 capped) | §5.3 + §7.1 |
| T2 → `qualitativeSummary.lede` | **The lede** (its own surface, 1–2 sentences) | §5.1 |
| T2 → score accordion `bandAnchor` / `trajectory` | **Score accordion** (collapsed by default) | §5.7 |
| T2 → `FocusItem.evidence` | Citation chips inside focus card | §5.3 |
| T2 → `FocusItem.protectedBy[]` refs | "Do not damage" guards inside focus card | §5.3 |
| T2 reanalysisDelta | **Progress strip** (iteration-only) | §5.2 |
| T2 deferred drawer | **Deferred surface — re-cast as "not this revision"** | §5.8 |
| T2 → cross-iteration synthesis | Iteration response surface lede on iteration ≥ 3; previously cited `TaughtMove.deepenedBy[]` + `supersededBy` chain (per `L5_ITERATION_LOOP_DESIGN.md` §9.2 priority 3 promotion). [D-1.6.6 closure 2026-04-30] those fields were removed from TaughtMove (zero producer/consumer in Phase 1); when this surface lands, the producer + consumer must co-land alongside a re-introduction of the chain fields. | §5.9 |
| T0 ledger MOVE/AP/PATTERN/F citation | Citation chips across all surfaces (lede, focus card, voice anchor) | §3.3 (citation principle) |
| T0 ledger SCHOOL_FIT lookup | School-fit reframing in lede + focus surface | §5.1, §5.3 |
| T0 ledger → "different shape" surface | **Architectural multiplicity drawer** (Move 6 second tier) | §5.5 |
| T1 voice profile slot | Inputs to voice anchor surface composition | §5.6 |
| T2 focus-item candidate (multiplicity paths) | **Move 6 multiplicity** inside focus card (lateral options); architectural options route to §5.5 drawer | §2 (Move 6) + §5.3 |
| T2 lede candidate / focus candidate (admissions context) | Lede lines on memorability / tellability / archetype context | §5.1 |
| T1 prompt (subtext / structural choices / pacing) | Tier 1 inputs to focus surface composition | §5.3 |
| T3 authenticity guard input | Authenticity flag on rewriteExample inside focus card | §5.3 |

**Surface composition principle.** The Tier 1 / Tier 2 LLM calls produce *structured outputs*; the surface composer (build deliverable D-4.6) maps those outputs to experience-target surfaces. The audit's per-row mapping above tells the surface composer where each upstream field's contribution lands.

---

## §A3 — New rows for IterationLedger and Conversator state types

The four documents (experience target, iteration design, E2E audit, this audit) added six new state types on `EssayProfile`. Each is `keep` — newly-introduced state, all consumed E2E.

| # | Source | Field | Defined at (target) | Cost | Current consumer | Proposed consumer | Carry-forward default | Verdict | Rationale |
|---|---|---|---|---|---|---|---|---|---|
| 251 | IterationLedger | `currentIteration: number` | new on `EssayProfile.iterationLedger` (Phase 0 deliverable) | [D] | n/a (new) | analysisOrchestrator (mode select), priorAnnotations builder, surface composer | `bookkeeping` (incremented at iter start) | keep | Drives the entire loop. |
| 252 | IterationLedger | `iterations: IterationRecord[]` | same | [D] | n/a (new) | calibration dashboard, cost-trajectory analysis, post-launch tuning | `bookkeeping` (append-only) | keep | Audit + telemetry source. |
| 253 | IterationLedger | `taughtMoves: TaughtMove[]` | same | [D] | n/a (new) | priorAnnotations builder, landing detector, cross-iteration synthesis | `bookkeeping` (append-only with D-1.15.0 carve-out: `landing` field one-shot `undefined → populated` only; see `L5_IMPLEMENTATION_PLAN.md` §D-1.14) | keep | The non-repetition spine. |
| 254 | IterationLedger | `recentDecisions: CarryForwardDecision[]` | same | [D] | n/a (new) | iteration audit, post-mortem on regressions | `bookkeeping` (pruned to last 5 iterations) | keep | Carry-forward audit trail. |
| 255 | IterationRecord | `iteration`, `triggeredBy`, `editScope`, `carryForwardSummary`, `costBreakdown`, `comprehensiveBaselineCost`, `carryForwardSavings`, `budgetRedirectedTo`, `rationale`, `startedAt`, `finishedAt` | same | [D] | n/a (new) | as above | `bookkeeping` | keep | Per-iteration audit record. |
| 256 | TaughtMove | `id`, `annotationId`, `findingId?`, `location`, `taughtAtIteration`, `teachingMode`, `contentSummary`, `stakesSnapshot?`, `landing` | same | [D] | n/a (new) | priorAnnotations builder reads `landing` (D-1.6.5 wires the producer); Conversator continuous-chat handler reads when student asks "have we worked on this before?" | `bookkeeping` (append-only with D-1.15.0 carve-out: `landing` field one-shot `undefined → populated` permitted; populated→mutated and populated→undefined forbidden) | keep | The cross-iteration narrative + landing carrier. (D-1.6.6 closure 2026-04-30: `deepenedBy[]` and `supersededBy?` removed — were declared but had zero producer/consumer; will be re-added when a producer + consumer co-land in a future deliverable.) |
| 257 | TaughtMove.landing | `status`, `detectedAtIteration`, `confidence`, `reasoning`, `signalsUsed[]` | same | [S] (Sonnet landing detector ~$0.0019/move; spec amendment 2026-04-29 — was Haiku, now Sonnet per Tue's 2026-04-27 model policy) | n/a (new) | landing detector outputs; Conversator reads reasoning when student asks "why is this back" | computed each iteration on prior iteration's moves | keep | Landing-detection record + calibration data source. |
| 258 | CarryForwardDecision | `iteration`, `itemKey`, `decision`, `rationale`, `costSavedIfCarry`, `costSpentIfRederive`, `arbitrationMechanism` | same | [D] | n/a (new) | iteration audit, calibration | `bookkeeping` | keep | Per-decision audit record. |
| 259 | UnderstandingQuestion | new source `'analysis_specifics_gap'` (extension to existing source enum) | extension to `profileTypes.ts:4273` | [D] (extension) | existing queue + new analysis_specifics_gap path | SpecificsNeed aggregator emits with this source | `bookkeeping` | keep | Marks dig-eligible queue questions. |
| 260 | UnderstandingQuestion | new statuses `'asked_to_student'`, `'student_answered'`, `'student_declined'` | extension to `profileTypes.ts:4275` | [D] (extension) | n/a (new) | Conversator dig-firing handler sets `'asked_to_student'`; answer extractor sets `'student_answered'` | `bookkeeping` | keep | Lifecycle states for student-side dig. |
| 261 | UnderstandingQuestion | `dig?: DigContext` sub-object | extension to type | [D] (small storage per question) | n/a (new) | Conversator handlers; analysis layer specifics-need emitters set `dig.framingSeed`; answer extractor sets `dig.structuredAnswer` | `bookkeeping` (per-question state) | keep | Dig-question-specific state. |
| 262 | DigContext | `whyAsked`, `expectedAnswerShape`, `consumers[]`, `populates[]`, `framingSeed`, `askedAt?`, `conversatorMessageId?`, `studentAnswerRaw?`, `structuredAnswer?`, `extractionPending?` | same | [D] (small per-question) | n/a (new) | Conversator dig-firing reads `framingSeed` + `whyAsked`; analysis layers consult `populates[]` to know what to fill from the answer | `bookkeeping` | keep | Dig wiring spine. |
| 263 | GroundTruthFact | `id`, `claim`, `evidence[]`, `confidence`, `sourceTurn?`, `appliesTo?`, `capturedAt`, `digQuestionId?` | new on `EssayProfile.groundTruthFacts` | [D] | n/a (new) | L1/L3/L3.5/L5 prompts (cached block); L5 fabrication-guard at Tier 3; iteration loop's selective carry-forward | `carry` (durable; supersede only on student correction) | keep | Verified factual claims for fabrication prevention + grounding. |
| 264 | StoryFragment | `id`, `fragment`, `arc?`, `sensoryAnchors?`, `emotionalThread?`, `potentialAnchorParagraphs[]`, `capturedAt`, `digQuestionId?` | new on `EssayProfile.storyFragments` | [D] | n/a (new) | L3.75 momentEarnednessMap synthesis prompt; L5 Move 6 multiplicity paths | `carry` (durable; floating-anchor flag if span dropped from essay) | keep | Raw narrative material the student has shared; expands multiplicity. |
| 265 | IntentSignal | `id`, `intent`, `appliesTo`, `alignmentWithSystemRead`, `capturedAt`, `digQuestionId?` | new on `EssayProfile.intentSignals` | [D] | n/a (new) | L4 northStar.intentBridge; L5 framing | `carry` (durable; may shift across iterations as student matures) | keep | Student-stated intent for system-read alignment. |
| 266 | EssayProfile root | `iterationLedger: IterationLedger` | new field | [D] | n/a | step 3 (session init), step 28 (iteration commit), and downstream readers above | `carry` (whole structure persists) | keep | The container. |
| 267 | EssayProfile root | `groundTruthFacts: GroundTruthFact[]`, `storyFragments: StoryFragment[]`, `intentSignals: IntentSignal[]` | new fields | [D] | n/a | as above | `carry` | keep | Conversator-captured durable inputs. |
| 268 | EssayProfile root | `conversatorSessionLog: ConversatorSessionEntry[]` | new field | [D] | n/a | Conversator continuous-chat handler context loader; chat persistence (`essay_chat_conversations` table) | `carry` (capped to last 50 turns inline; full log in DB) | keep | Chat session history. |
| 269 | DB schema | `essay_chat_conversations` table | new (modeled on `activity_chat_conversations`) | [D] | n/a | Conversator persistence | `carry` (durable across sessions) | keep | Chat history persistence. |
| 270 | DB schema | `essay_ground_truth` table | new | [D] | n/a | Conversator answer persistence + analysis-layer consumption | `carry` | keep | Ground-truth records persistence. |

**Total revised: 270 rows. Verdict bucket update:**

- **keep:** 162 + 20 (new) = 182 (~67%)
- **rewire:** 67 (~25%)
- **cut:** 21 (~8%)

The 20 new `keep` rows are all newly-introduced state with explicit consumers in the build phase. None are speculative; each is referenced by a build deliverable.

---

## §A4 — How the build phase reads this audit

When a build phase deliverable lands, it cites the audit rows it touches. Specifically:

- **Phase 0 (types + migrations)** lands rows 251–270 (the schema additions).
- **Phase 1 (dead-wire fix + iteration ledger)** activates rows 251–258 (IterationLedger + TaughtMove + CarryForwardDecision + IterationRecord) and the priorAnnotations builder consumes row 253 (taughtMoves).
- **Phase 2 (SpecificsNeed aggregator + queue extension)** activates rows 259–262 (UnderstandingQuestion source + status + DigContext extensions) and the per-layer emission contributors consume the audit's existing rows for their own outputs (e.g., L3.5 patternMatches at row 126, L3.75 momentEarnednessMap.gaps at row 74).
- **Phase 3 (Conversator)** activates rows 263–270 (GroundTruthFact + StoryFragment + IntentSignal + DB schema). Continuous chat reads the existing focus-surface rows.
- **Phase 4 (L3.75 targeted-refresh + Tier 2 synthesis + surface composer)** consumes the rewires in §A2 (every rewire from a redesign-doc primitive to an experience-target surface lands here).
- **Phase 5 (UI surfaces)** renders the surfaces named in §A2 against the data shapes in §A3 and the original audit's existing rows.

The audit is the per-row contract. The implementation plan's deliverable contracts cite audit rows by number (e.g., "this deliverable consumes audit rows 49, 51, 53, 60–65 for the voice anchor surface").

