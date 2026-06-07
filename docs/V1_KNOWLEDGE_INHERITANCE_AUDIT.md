# V1 Knowledge Inheritance Audit

> Authoritative three-bucket mapping: which R&D cognitive knowledge Essay Intelligence V1 absorbed equivalently, which it absorbed thinner, and which it did not absorb at all.
>
> Scope: `src/services/essayIntelligence/` (V1) vs the R&D workshops that preceded it (`commonAppWorkshop/`, `piq/`, `piqWorkshop/`, `narrativeWorkshop/`, `portfolioStrategy/services/activityWorkshop/`, `portfolio/stage2_dimensions/`, `portfolioStrategy/services/academicWorkshop/`), plus the shared runtime utilities (`voiceProfile/`, `authenticity/`, `storyMining/`, `rag/`, `inlineEditor/`, `lib/llm/`).
>
> Every load-bearing claim below is grounded in a `file:line` citation and, where the content is prompt or taxonomy text, a verbatim quote. Paraphrases are used only for summary headers.

---

## Section 1 — Executive Summary

### Cognitive-asset headcount

| Workshop | Cognitive assets found | R&D time embodied |
|---|---|---|
| Common App (`commonAppWorkshop/`) | 28 major assets (6 universal writing principles + 14 type-specific profiles + 500+-pattern cliché taxonomy + 7-pattern performative indicators + 9 essay-element detectors + 28-pattern issue detection + 13-college tailoring rubric + Haiku diagnosis prompts + anti-bias calibration + semantic cliché analyzer) | 8–12 months |
| PIQ (`piq/` + `piqWorkshop/`) | 38+ assets (13-dim rubric + 41 issue patterns across 9 categories + 8 prompt-specific weight calibrations + 20 teaching examples + coaching guardrails + word economy framework + 3-tier quality standards + voice/experience fingerprint + manufactured-phrase library + AI-phrase library) | 8–12 weeks |
| Narrative (`narrativeWorkshop/`) | 4 assets (VoiceFingerprint analyzer with 5 dimensions + ExperienceFingerprint analyzer with 6 uniqueness vectors + 4 anti-convergence flags + divergence requirements + quality anchors + SymptomDiagnoser with 29 narrative weakness types + Workshop teaching layer) | 4–8 weeks |
| Activity (`activityWorkshop/`) | 5 assets (5-dim description scoring rubric + authenticity voice dimension + 7-category feature extraction + tier/leadership/commitment scoring + 4-stage teaching architecture) | 6–10 weeks |
| Portfolio Stage 2 (`portfolio/stage2_dimensions/`) | 1 asset (4-tier authenticity voice analyzer calibrated to UCLA 30% / Berkeley 20% weights) | 2–3 weeks |
| Academic Advisor (`academicWorkshop/`) | 4 assets (conversational capability types + identity generation A+→F + enriched report context assembly + genuine interest detection) | 4–6 weeks |
| **Total** | **~80 cognitive assets** | **~12 months cumulative** |

### Three-bucket distribution for V1 (rough counts, see Section 4 for row-by-row detail)

| Bucket | Count | % of R&D assets |
|---|---|---|
| **A — Absorbed Equivalent (V1 matches R&D depth)** | 9 | ~11% |
| **B — Absorbed but Thinner (V1 gestures at it, lacks calibration/taxonomy/examples)** | 24 | ~30% |
| **C — Not Absorbed (V1 has no surface for it)** | 47 | ~59% |

V1's architecture is ambitious and elegant (separated understanding/analysis/feedback passes, phase-aware zoom, novelty-driven growth, mechanism quality standard, anchored scoring calibration). But the audit confirms the suspected problem: **V1 was stocked with thinner cognitive content than R&D had already proven.** Most of V1's prompts rely on general-purpose adjectival guidance ("specific", "architectural", "earned") where R&D had literal phrase libraries, per-dimension calibrated score bands, issue-pattern libraries with fix strategies, and type-specific weighted rubrics.

### Top 10 highest-leverage unabsorbed assets (P0 ports)

These are the largest deltas between "V1 claims to judge X" and "V1 actually has the content to judge X well". Fixing these is the difference between "V1 produces evaluations that feel intelligent" and "V1 produces evaluations that feel calibrated to the admissions reality."

1. **PIQ 41-pattern Issue Library with fix strategies and +point impact estimates** (`src/services/piq/issuePatterns.ts:17-1201`) — 41 patterns across 9 categories, each with triggerConditions, problemTemplate, whyMattersTemplate, fixStrategies with `estimatedImpact: '+2-3 points in Vulnerability'`. V1's analysisPass emits free-text weaknesses with no pattern library, no dimension-bound fix strategies, no cross-essay impact calibration. **Port to L3.5 `analysisPass.ts:500-520` (improvementCandidate emission) and L5 `deepAnnotationService.ts`**.
2. **Common App 500+-phrase Cliché Reference Library** (`src/services/commonAppWorkshop/services/semanticClicheAnalyzer.ts:177-620+`) — 15+ categories (AI-convergence phrases, essay-cliche-phrases, opening-cliches, conclusion-cliches, performed-vulnerability, trauma-dumping-indicators, self-congratulatory, service-cliches, false-closure, privilege-cliches, manufactured-epiphany, oversimplified-growth, emotional-flatness, savior-complex, confidence-without-evidence, essay-speak-formality, thesaurus-syndrome, weak-verb-patterns, melodramatic-phrases). V1 has a 46-word banned list in L1 (`firstImpressions.ts:75`) and a 40-phrase list in `inlineEditor/commandPrompts.ts:57-130` — both are SUBSETS and miss most of the categorical taxonomy. **Port to L3.5 analysis prompts, L3.75 `holisticSynthesis.ts` MECHANISM QUALITY STANDARD, and the L1 banned-word list.**
3. **PIQ 13-Dimension Rubric + 8 prompt-specific weight calibrations** (`src/services/piq/rubric.ts:30-416` + `src/services/piq/weights/dimensionWeights.ts`) — vulnerability_authenticity weighted 12–15% depending on PIQ prompt; Creative PIQ gives craft_language 13%; Challenge PIQ gives vulnerability 15% + context 14%. Calibration source: "UC official guidance, 19 exemplar essays, admissions officer interviews, 19 iterations of workshop validation". V1 has 5 generic score-matrix dimensions (effectiveness/structural/voice/emotional/thematic, `crystallizer.ts:273-284`) with NO prompt-type calibration. **Port as context module consumed by L3.5 and L4 when essayType is PIQ.**
4. **Common App 14-type Weight Matrix + Type-Specific Success Principles** (`src/services/commonAppWorkshop/rubrics/typeWeightMatrices.ts` + `src/services/commonAppWorkshop/rubrics/writingPrinciples.ts`) — each of 14 essay types (common-app, why-school, why-major, diversity, community, creative, academic-interest, extracurricular, leadership, challenge, identity, future-goals, intellectual-curiosity, short-answer) has unique weights across the 12 rubric dimensions + 5–7 diverse excellence paths + type-specific pitfalls. V1's L4 uses ACTIVE_DIMENSIONS variation by scale (supplement/piq/personal_statement, `crystallizer.ts:160-170`) but inside each scale the prompt is type-agnostic. **Port to L3.75 Phase B prompt and L4 crystallizer prompt.**
5. **Narrative SymptomDiagnoser — 29-type weakness taxonomy** (`src/services/narrativeWorkshop/analyzers/symptomDiagnoser.ts:29-177`) — includes 14 opening-specific types (`dictionary_definition_opening`, `childhood_opening_cliche`, `famous_quote_opening`, `rhetorical_question_flat`, `thesis_statement_opening`, `melodramatic_opening`, `generic_scene_setting`, `weak_opening`, `generic_opening`) and 14 ending-specific types (`abrupt_ending`, `anticlimactic_ending`, `summary_conclusion`, `preachy_ending`, `excited_to_attend_ending`, `sudden_pivot_ending`, `false_resolution_ending`, `career_announcement_ending`, `overexplained_ending`, `repetitive_ending`, `abstract_ending`, `academic_ending`), each with a "WHY IT FAILS" admissions-psychology explanation. V1's L2 has "BANNED ROLE LABELS" (`structuralCartographer.ts:107-108`) and L3.5 has "cliched openings … belong at 35-50" (`analysisPass.ts:452`) but NO enumerated taxonomy of opening/ending failure modes. **Port to L3.5 (analysisPass) and L5 (deepAnnotationService) prompt blocks keyed on `paragraphRole === 'opening'|'closing'`.**
6. **Portfolio Stage 2 PIQ 4-Tier Authenticity Rubric with institutional weight calibration** (`src/services/portfolio/stage2_dimensions/authenticityVoiceAnalyzer.ts:82-250`) — DISTINCTIVE (9.0-10.0, top 1-5%, narrative quality 80-100) → AUTHENTIC (7.0-8.9, top 10-20%, NQI 70-79) → EMERGING (4.0-6.9, top 30-50%, NQI 60-69) → MANUFACTURED (1.0-3.9, bottom 50%, NQI <60), weighted UCLA 30% / Berkeley 20%. Embeds "10,000 applications test" and "brutal calibration guards" (`authenticityVoiceAnalyzer.ts:222-248`). V1 has generic anchor scores (38/52/72/88) in `analysisPass.ts:369-382` but NO tier-band taxonomy or institutional context. **Port to L3.75 `admissionsPositioning.archetypeContext.poolDensity` calibration and L3.5 tier classification.**
7. **PIQ Manufactured Vulnerability + Voice Anti-Pattern Phrase Libraries** (`src/services/piq/issuePatterns.ts:139-197, 539-690`) — regex-detectable literal trigger phrases: `vulnerability (is|can be) a strength`, `asking for help (isn't|is not) (a|) weakness`, `failure (is|can be) an opportunity`, `growth (comes|happens) from (discomfort|struggle)`, `this (taught|showed|helped|allowed) me`, `through this (experience|opportunity)`, `i (came to|learned to) (realize|understand)`, `delve into`, `it is important to note`, `furthermore`, `moreover`, `plethora`, `myriad`, `multifaceted`, `paradigm`, `utilize`, `endeavor`, `facilitate`. Each pattern has fix strategies with impact estimates. V1 has partial overlap in L1 banned-words + inlineEditor banned terms but no active pattern-matching + impact-estimated fixes. **Port to L3.5 improvementCandidate emission logic and L6 coaching guardrails.**
8. **Narrative ExperienceFingerprint — 6 uniqueness vectors + 4 anti-convergence flags + divergence requirements** (`src/services/narrativeWorkshop/analyzers/experienceFingerprintAnalyzer.ts:27-185`) — `unusualCircumstance`, `unexpectedEmotion`, `contraryInsight`, `specificSensoryAnchor`, `uniqueRelationship`, `culturalSpecificity`; flags `followsTypicalArc`, `hasGenericInsight`, `hasManufacturedBeat`, `hasCrowdPleaser`; outputs `mustInclude`/`mustAvoid`/`uniqueAngle`/`authenticTension`/`qualityAnchors`. V1's L3.75 `characterRevelation.writerPortrait` (`holisticSynthesis.ts:524-529`) is narratively adjacent but lacks the enumerated divergence schema that downstream code can consume. **Port to L3.75 Phase B `characterRevelation` + new `distinctivenessSignature` substructure consumed by L4 `crystallizer.ts:247-258`.**
9. **Common App 6 Core Writing Principles with reader-effect / misconceptions / positive+undermining signals** (`src/services/commonAppWorkshop/rubrics/writingPrinciples.ts:41-300+`) — Specificity Creates Trust / Voice Reveals Character / Show Action Not Just Reflection / Tension Creates Engagement / Insight Reveals Depth / Structure Serves Meaning, each with 8–9 valid_approaches, 5 positive_signals, 5 undermining_signals, 4 misconceptions. V1's prompts reference "specificity", "voice", "show vs tell" as adjectives but never embed the reader-effect framing or the misconception antidotes. **Port as a shared module injected into L3.5's rubric and L5's teaching-mode prompts.**
10. **PIQ Coaching Guardrails (`src/services/piqWorkshop/piqChatService.ts:61-417`)** — explicit good/bad sensory pairs (`"bleach and citrus" (simple, evocative)` vs `"olfactory tapestry of industrial cleaning agents"`), Voice Fingerprint preservation ("Do NOT suggest flowery embellishments that violate their authentic style"), Quality Anchor Protection ("never 'improve' sentences that already work. Celebrate them."), 5-step coaching structure, Word Economy Framework with explicit math ("You're at 342. Adding dialogue costs 20. Cut X (9). Net +5, at 347"), 3-tier quality standards (Stanford/Harvard 85-100 vs UCLA/Berkeley 70-84 vs Competitive 40-69). V1's `coaching/coachingService.ts` (5475 lines) has its own coaching architecture but lacks these embedded exemplar pairs. **Port to V1 `coaching/coachingService.ts` and `coaching/promptBlocks.ts`.**

### Top 5 shared runtime utilities V1 silently bypasses

V1 imports **only ONE item** from any of voiceProfile/authenticity/storyMining/rag: the `StudentVoiceProfile` TYPE (`src/services/essayIntelligence/types.ts:21`). It imports zero service classes. Meanwhile V1 has 251 occurrences of `voice.?signature|voiceObservation|voiceIdentity|voiceMap` across 27 files — it reinvents voice analysis from scratch in every layer.

| Shared Utility | V1 Verdict | Where V1 Reinvents |
|---|---|---|
| `src/services/voiceProfile/voiceProfileService.ts` (386 lines) | ❌ Silently bypasses | L1 `firstImpressions.ts` field `voiceObservation`; L3.75 `holisticSynthesis.ts:289-363` whole `voiceMap` subsection (5 dimensions + stability regions + shifts + intentionality); L3.75 `voiceIdentity.signature`/`register`/`distinctivePatterns`/`evolution`/`authenticVsPerformed`. |
| `src/services/voiceProfile/styleConsistencyService.ts` (494 lines) | ❌ Silently bypasses | L3.75 `voiceMap.stabilityRegions` (`holisticSynthesis.ts:357-362`) reinvents style-consistency detection; L3.75 `voiceMap.shifts` reinvents drift detection. |
| `src/services/authenticity/aiRiskScorer.ts` (451 lines) | ❌ Silently bypasses | L1 banned-word list (`firstImpressions.ts:75`) partially duplicates; L3.75 `voiceIdentity.authenticVsPerformed` (`holisticSynthesis.ts:294-300`) attempts the same assessment without the shared scorer's calibrated thresholds. |
| `src/services/storyMining/storyMiningService.ts` (857 lines) | ❌ Silently bypasses | L3 walk `significantChoices` (`sequentialDeepWalk.ts:351-357`) extracts story fragments ad-hoc; L3.75 `momentEarnednessMap` reinvents moment detection. |
| `src/services/rag/ragService.ts` (509 lines) + `embeddingService.ts` (168 lines) | ❌ Silently bypasses | V1 has no RAG integration anywhere. The `inlineEditor` uses RAG via `commandPrompts.ts:151-170` (accepts `ragContext` parameter) but V1 analysis layers do not. |

See Section 5 for per-layer verdict table.

---

## Section 2 — R&D Knowledge Catalog (inventory)

Each asset below is labeled with Type — either **[RUNTIME]** (stateless cross-system service; one canonical implementation; V1 should import) or **[COGNITIVE]** (taxonomy/prompt/rubric content; V1 must absorb into its own prompts, not import at runtime).

### 2A. Common App Workshop (`src/services/commonAppWorkshop/`)

**CA-1. 6 Core Writing Principles Framework** — [COGNITIVE]
- Source: `src/services/commonAppWorkshop/rubrics/writingPrinciples.ts:41-1172`
- What it is: 6 universal principles (Specificity Creates Trust, Voice Reveals Character, Show Action Not Just Reflection, Tension Creates Engagement, Insight Reveals Depth, Structure Serves Meaning) + 14 type-specific principles, each with reader_effect, valid_approaches (8-9 per principle), positive_signals (5), undermining_signals (5), misconceptions (4).
- Load-bearing content (verbatim, `writingPrinciples.ts:41-88`):
  > **PRINCIPLE 1: SPECIFICITY CREATES TRUST**
  > reader_effect: "When a writer uses specific details, the reader's brain shifts from 'evaluating' to 'experiencing.' Specificity signals: 'This person was actually there. This actually happened. I can trust what they're telling me.' Vague language triggers skepticism: 'Are they making this up? Exaggerating? Hiding something?'"
  > valid_approaches: [Numbers and metrics ('47 students', '3:47 AM'); Sensory details that only someone present would notice ('the hum of the fluorescent lights'); Proper nouns; Precise emotional language ('not sad - hollow, like someone had scooped out my insides'); Dialogue that sounds like actual speech; Micro-moments that unfold in real time; Technical or field-specific vocabulary used naturally; Before/after contrasts with concrete markers; Objects or artifacts that anchor abstract ideas]
  > misconceptions: [WRONG: Specificity means adding numbers everywhere; WRONG: Every paragraph needs statistics; WRONG: Name-dropping professors = specificity; RIGHT: Specificity means making the reader BELIEVE you, whatever form that takes]
- Evidence of depth: The reader_effect framing is admissions-psychology-grounded pedagogy, not "use more specific words." The misconception antidotes are written to prevent false positives (LLM graders reward numbers over genuine specificity).
- Rebuild estimate: 2–3 weeks of R&D-quality writing + admissions-reader interviews.

**CA-2. Semantic Cliché Taxonomy (500+ phrase library across 15+ categories)** — [COGNITIVE]
- Source: `src/services/commonAppWorkshop/services/semanticClicheAnalyzer.ts:177-620+`
- What it is: literal phrase library for pattern-based detection of overused essay language, organized by category.
- Load-bearing content (verbatim, selected categories):
  - `ai_convergence_phrases` (`:202-207`): `tapestry, journey, myriad, invaluable, transformative, resonate, navigate, sparked, ignited, profound, multifaceted, intertwined, testament to, harbored, fostered, cultivated, instilled, honed`
  - `essay_cliche_phrases` (`:210-235`): `little did I know, this experience taught me, I am forever changed, it opened my eyes, I realized that, sparked my passion, transformative experience, profound impact, I learned the importance of, ever since I was a child, for as long as I can remember, I discovered my true passion, it was a turning point, I found my voice, I discovered who I really am, at the end of the day, dare to fail gloriously, think outside the box, passion is my driving force, I grew as a person, it made me who I am today, I gained a new perspective, this opened my eyes to`
  - `performed_vulnerability` (`:330-341`): `shedding a single tear, heart pounding, butterflies in my stomach, time stood still, my heart sank, tears streaming down my face, my heart skipped a beat, felt like an eternity, words cannot describe, beyond words`
  - `trauma_dumping_indicators` (`:344-353`): `I still struggle with, I'm still healing from, I'll never get over, The pain is still fresh, haunts me to this day, I can't forget, still have nightmares about, the trauma of`
  - `self_congratulatory` / savior complex (`:356-473`): `I single-handedly, I was the first to, Without me, they would have, I saved, I changed their lives, They were so grateful, because of my efforts, I was able to transform, I brought hope to, I made a real difference, I taught them, I showed them how, without my help, I was their role model, I inspired them to`
  - `service_cliches` (`:370-380`): `I went there to help them but they ended up helping me, opened my eyes to poverty, made me grateful for what I have, those less fortunate, gave back to the community, truly humbling experience, put my problems in perspective, realize how privileged I am, changed my worldview`
  - `false_closure` (`:383-393`): `I learned that, That was when I realized, The most important lesson, I now know that, This experience taught me that, From this, I understood, I came to realize, This taught me the value of, Most importantly, I learned`
  - `manufactured_epiphany` (`:415-426`): `in that moment, I realized, suddenly, it clicked, that's when it hit me, everything changed in an instant, I had an epiphany, the light bulb went off, I finally understood, it dawned on me, suddenly everything made sense, in a flash of clarity`
  - `thesaurus_syndrome` (`:521-542`): `insouciantly, perspicacious, pulchritudinous, magnanimous, effervescent, quintessential, unprecedented, dichotomy, paradigm, juxtaposition, plethora, myriad, ameliorate, exemplify, elucidate, promulgate, conundrum, infinitesimally, sanguine, sagacious`
  - `essay_speak_formality` (`:497-518`): `in today's society, throughout history, it is important to note that, one must consider, it can be argued that, studies have shown, research indicates, it is widely known, this demonstrates that, the significance of this, furthermore, moreover, nevertheless, in conclusion, to summarize, as evidenced by, it is evident that, henceforth, aforementioned, subsequently`
  - `melodramatic_phrases` (`:569-590`): `forever changed my life, will never forget, changed everything, the most important moment, the best day of my life, the worst day of my life, my whole world, completely transformed, life-altering, earth-shattering, mind-blowing, once in a lifetime, most incredible experience, nothing could prepare me, beyond my wildest dreams, words cannot express`
- Evidence of depth: organized by psychological failure mode (performed vulnerability vs trauma dumping vs savior complex vs false closure vs manufactured epiphany), not alphabetically. Each category has an admissions-reader rationale.
- Rebuild estimate: 4–6 months of reading essays + admissions-reader interviews + iteration.

**CA-3. Issue Detection Patterns (28 patterns)** — [COGNITIVE]
- Source: `src/services/commonAppWorkshop/rubrics/issueDetectionPatterns.ts:1-1579`
- What it is: 28 labeled patterns with id + name + detection schema.
- Verbatim IDs (`:65-893`): `SWAP_TEST_FAIL, GENERIC_ORIGIN_STORY, ESSAY_SPEAK_HEAVY, VULNERABILITY_DUMP, NO_NUMBERS, AI_PATTERNS, STATED_NOT_SHOWN, ONE_SIDED_FIT, VAGUE_DIVERSITY, CAREER_ONLY, VAGUE_COMMUNITY, TRAUMA_WITHOUT_AGENCY, GENERIC_LESSONS, REPEATED_THEMES, DEFENSIVE_OR_APOLOGETIC, BRAGGING_WITHOUT_VULNERABILITY, UNREALISTIC_GOALS, JUST_DESCRIBING, MAKING_EXCUSES, PASSIVE_PARTICIPATION, RESUME_LISTING, WEAK_OPENING, NO_DIALOGUE, …`
- Load-bearing example (verbatim, `issueDetectionPatterns.ts:65-102`):
  > id: 'SWAP_TEST_FAIL'
  > name: 'College Name Swap Test Failure'
  > (fires when the essay's "why this school" claims could be made about any other peer institution)
- Evidence of depth: each has admissions-reader rationale ("SWAP_TEST_FAIL" is the industry standard for detecting copy-paste why-school essays).
- Rebuild: 4–6 weeks.

**CA-4. 14-type Weight Matrix + Type-Specific Success Principles** — [COGNITIVE]
- Source: `src/services/commonAppWorkshop/rubrics/typeWeightMatrices.ts:1-571`, `src/services/commonAppWorkshop/rubrics/writingPrinciples.ts` (type-specific section)
- What it is: 14 essay types × 12-dimension rubric weights; each type has 5-7 diverse excellence paths + type-specific pitfalls.
- Evidence of depth: Creative PIQs weight craft_language_quality 13%, while Challenge PIQs weight vulnerability_authenticity 15%. These are NOT symmetric.
- Rebuild: 4–6 weeks.

**CA-5. 13-College Institutional Tailoring Rubric** — [COGNITIVE]
- Source: `src/services/commonAppWorkshop/rubrics/collegeTailoringRubric.ts:1-658`; + per-college data files (`src/services/commonAppWorkshop/data/brown.ts, caltech.ts, cmu.ts, cornell.ts, dartmouth.ts, harvard.ts, mit.ts, northwestern.ts, nyu.ts, stanford.ts, uchicago.ts, upenn.ts, usc.ts`).
- Evidence of depth: per-institution programs, overlooked resources, value alignment signals. Each data file is several hundred lines.
- Rebuild: 3–6 months (requires college-by-college research).

**CA-6. Anti-Bias Calibration System** — [COGNITIVE]
- Source: `src/services/commonAppWorkshop/rubrics/antiBiasCalibration.ts:1-420`
- What it is: explicit correction factors for known scoring biases (e.g., LLMs over-reward program name-drops even when not genuinely integrated; under-reward unconventional structures).
- Rebuild: 2–3 weeks + calibration testing.

**CA-7. Essay Element Detection (9 structural elements)** — [COGNITIVE]
- Source: `src/services/commonAppWorkshop/services/essayElementDetector.ts:1-881`
- What it is: detection of 9 structural elements (opening hook, evidence section, reflection moment, dialogue, sensory grounding, transition fulcrum, thematic thread, stakes anchor, closing image), each with signal patterns.
- Rebuild: 2–3 weeks.

**CA-8. Performative Indicators Framework (7 patterns)** — [COGNITIVE]
- Source: cataloger identified but I could not locate the 7-pattern file during verification. Likely embedded in `src/services/commonAppWorkshop/services/` — possibly `redFlagMatcher.ts`, `greenFlagAmplifier.ts`, or `clicheIssueIntegration.ts`. Treat this asset as claimed but unverified-by-synthesizer.
- Rebuild: ≈ 2 weeks.

**CA-9. Haiku Diagnosis Prompts + Multi-Stage Orchestration (Stage 0 – Stage 3)** — [RUNTIME + COGNITIVE]
- Source: `src/services/commonAppWorkshop/services/stage0Service.ts`, `stage0MultiStageService.ts`, `stage0ConditionalService.ts`, `stage1ATeachingService.ts`, `stage1BDiagnosisService.ts`, `stage1ConsolidatedService.ts`, `stage2Service.ts`, `stage2BatchService.ts`, `stage3Service.ts`, `stage3ConsolidatedService.ts`, `haikuDiagnosisService.ts`.
- Infrastructure runtime (orchestration) + cognitive (embedded prompts).
- Rebuild: 6–10 weeks.

### 2B. PIQ (`src/services/piq/` + `src/services/piqWorkshop/`)

**PIQ-1. 13-Dimension Rubric with 4-tier grouping** — [COGNITIVE]
- Source: `src/services/piq/rubric.ts:30-416`
- Verbatim tier structure:
  - Tier 1 "critical_foundations" (45% baseline): opening_hook_quality, vulnerability_authenticity, specificity_evidence, voice_integrity, narrative_arc_stakes
  - Tier 2 "impact_growth" (30%): transformative_impact, role_clarity_ownership, initiative_leadership, context_circumstances
  - Tier 3 "depth_meaning" (15%): reflection_insight, identity_self_discovery
  - Tier 4 "polish_positioning" (10%): craft_language_quality, fit_trajectory
- Verbatim per-dimension whatWeEvaluate (example `vulnerability_authenticity`, `rubric.ts:59-66`):
  > Level of vulnerability (1-5 scale: surface → raw emotional honesty); Physical/sensory symptoms of emotion (hands shaking, threw up, couldn't sleep); Specific failures and how you handled them; Transformation credibility (earned through struggle vs imposed epiphany); Defense mechanisms and self-awareness shown; Authenticity markers vs manufactured phrases ("I learned...", "This taught me...")
- Evidence of depth: includes "Level of vulnerability (1-5 scale)" referring to a calibrated psychological model — not just "be vulnerable."
- Rebuild: 3–4 weeks.

**PIQ-2. 8 Prompt-Specific Weight Calibrations** — [COGNITIVE]
- Source: `src/services/piq/weights/dimensionWeights.ts` (referenced from `rubric.ts:14`)
- Calibration source (verbatim from `/tmp/audit-piq.md` quoting the source): "UC official guidance, 19 exemplar essays, admissions officer interviews, 19 iterations of workshop validation"
- Rebuild: 2–3 weeks.

**PIQ-3. 41-Pattern Issue Library across 9 Categories** — [COGNITIVE]
- Source: `src/services/piq/issuePatterns.ts:1-1201`
- Verbatim pattern structure (example, `issuePatterns.ts:18-52`):
  > id: 'hook-weak-generic', dimension: 'opening_hook_quality', severity: 'critical'
  > triggerConditions: { scoreThreshold: 6, keywordPatterns: [`^As (president|captain|leader|member) of`, `^I (have always|always|never) been`, `^Throughout my (life|time|experience)`, `^(Many|Some) people`], customCheck: 'check_hook_type_basic' }
  > problemTemplate: "Your opening starts with a generic statement that doesn't create immediate intrigue or tension. Phrases like 'As president of...' or 'I have always...' are common essay openings that don't grab attention."
  > whyMattersTemplate: "Admissions officers read hundreds of PIQs. Generic openings cause readers to skim rather than engage. You have 3-5 seconds to hook them - a generic opening wastes that critical moment."
  > fixStrategies: [
  >   { technique: 'Start Mid-Action (In Medias Res)', description: 'Drop the reader into a specific, tense moment...', estimatedImpact: '+2-3 points in Opening Hook' },
  >   { technique: 'Physical Vulnerability First', description: 'Open with a physical symptom of emotion...', estimatedImpact: '+2-4 points in Opening Hook + Vulnerability' },
  >   { technique: 'Sensory Immersion', description: 'Start with vivid sensory details...', estimatedImpact: '+1-2 points in Opening Hook' }
  > ]
- Verbatim manufactured vulnerability pattern (`issuePatterns.ts:168-197`):
  > keywordPatterns: [`vulnerability (is|can be) a strength`, `asking for help (isn't|is not) (a|) weakness`, `failure (is|can be) an opportunity`, `growth (comes|happens) from (discomfort|struggle)`]
  > problemTemplate: "You're using phrases that TALK ABOUT vulnerability rather than SHOWING it…"
  > fixStrategies: "Delete the Lesson, Show the Moment: Cut the manufactured phrase entirely. Instead, show the specific moment when you asked for help or admitted you were wrong. Let readers infer the lesson. estimatedImpact: '+2-3 points in Vulnerability + Voice'"
- Verbatim essay-speak anti-pattern (`issuePatterns.ts:541-569`):
  > keywordPatterns: [`this (taught|showed|helped|allowed) me`, `through this (experience|opportunity)`, `i (came to|learned to) (realize|understand)`, `from this (experience|I learned)`, `this (experience|opportunity) (allowed|enabled|helped)`]
  > whyMattersTemplate: "Essay-speak makes you sound like everyone else. Admissions officers read thousands of essays with identical phrasing. Your authentic voice is your competitive advantage — essay-speak erases it."
- Verbatim AI pattern (`issuePatterns.ts:633-665`):
  > keywordPatterns: [`delve into`, `it is important to note`, `in conclusion`, `in summary`, `furthermore`, `moreover`, `it should be noted`]
  > whyMatters: "Admissions officers are trained to spot AI writing. Even if you wrote it yourself, AI-like phrasing raises red flags and makes them question authenticity of your entire application."
  > fixStrategies: [{ technique: 'Delete Formal Transitions', description: 'Cut "furthermore," "moreover," "in conclusion" entirely. Your essay should flow naturally without formal transitions.', estimatedImpact: '+2-3 points in Voice' }]
- Rebuild: 4–5 weeks.

**PIQ-4. Teaching Examples Corpus (20 of 80 planned)** — [COGNITIVE]
- Source: `src/services/piq/teachingExamples.ts:1-507`
- Structure per example: weakExample (15-30 words) + strongExample (30-70 words) + principle + diffHighlights.
- Coverage: Hook, Vulnerability, Specificity, Arc. MISSING: Voice, Reflection, Identity, Craft, Coherence.
- Rebuild: 3–4 weeks for the remaining 60 examples.

**PIQ-5. Chat Coaching Guardrails** — [COGNITIVE]
- Source: `src/services/piqWorkshop/piqChatService.ts:61-417`
- Verbatim (from `/tmp/audit-piq.md`, confirmed by file location):
  > **Sensory pairs (GOOD vs BAD):**
  > ✅ GOOD sensory: "bleach and citrus" (simple, evocative)
  > ❌ BAD purple prose: "olfactory tapestry of industrial cleaning agents"
  > ✅ GOOD emotion: "my stomach dropped"
  > ❌ BAD drama: "time stood still as my soul trembled"
  > **Voice Fingerprint preservation:** "Do NOT suggest flowery embellishments that violate their authentic style."
  > **Quality Anchor Protection:** "never 'improve' sentences that already work. Celebrate them."
  > **5-step coaching structure:** (1) Start with what you see (2) Celebrate quality (3) Tell the story of what's missing with metaphors/patterns/examples (4) Give ONE focused direction (5) End with options and discovery questions.
  > **UC Values:** Authenticity > Polish, Specificity > Vagueness, Growth > Achievement, Action > Reflection.
- Rebuild: 2–3 weeks.

**PIQ-6. Word Economy Framework** — [COGNITIVE]
- Source: `src/services/piqWorkshop/piqChatService.ts:169-200`
- Verbatim: "<300: suggest additions freely; 300-340: mention 'room for X words'; 340-350: PAIR additions with cuts; >350: ONLY cuts until under limit. Always show math ('You're at 342. Adding dialogue costs 20. Cut X (9). Net +5, at 347'). Prioritized cuts: generic statements, redundant transitions, throat-clearing, stated outcomes before showing, adjective stacking, weak intensifiers."
- Rebuild: 1 week.

**PIQ-7. 3-Tier Quality Standards** — [COGNITIVE]
- Source: `src/services/piqWorkshop/piqChatService.ts:240-261`
- Verbatim: "85-100 (Stanford/Harvard tier): extended metaphor woven naturally, physical vulnerability + named emotions, quoted dialogue with confrontation, community transformation with metrics, universal philosophical insight earned. 70-84 (UCLA/Berkeley tier): clear narrative arc, vulnerability present, dialogue exists, impact quantified, reflection connects to future. 40-69 (Competitive tier): specific story, active voice, concrete details, shows growth through action."
- Rebuild: 1–2 weeks.

**PIQ-8. Voice Fingerprint + Experience Fingerprint (PIQ context)** — [COGNITIVE]
- Source: `src/services/piqWorkshop/piqChatContext.ts:105-147`
- Voice dimensions: sentence structure, vocabulary, pacing, tone.
- Experience anti-pattern flags: `followsTypicalArc`, `hasGenericInsight`, `hasManufacturedBeat`, `hasCrowdPleaser`.
- Divergence requirements: `mustInclude`, `mustAvoid`, `uniqueAngle`, `authenticTension`.
- Rebuild: 1–2 weeks.

### 2C. Narrative Workshop (`src/services/narrativeWorkshop/`)

**NW-1. VoiceFingerprint Analyzer** — [RUNTIME]
- Source: `src/services/narrativeWorkshop/analyzers/voiceFingerprintAnalyzer.ts:1-100`
- Captures: tone, cadence, vocabulary, markers, sampleSentences.
- Verbatim system prompt excerpt (`voiceFingerprintAnalyzer.ts:16-33`):
  > You are an expert writing coach specializing in voice analysis for elite college admissions. Your task is to analyze the 'Voice Fingerprint' of a student's essay. We need to capture their unique style so that any edits we suggest sound exactly like them.
  > 1. tone: string describing the emotional quality (e.g., 'Earnest, self-deprecating', 'Analytical and precise', 'Warm and nostalgic', 'Fast-paced and energetic'). AVOID generic labels like 'Formal' or 'Informal'. Be specific to the writer's character.
  > 2. cadence: string describing the rhythm and flow (e.g., 'Short, punchy sentences', 'Long, flowing complex sentences', 'Varied rhythm with staccato emphasis').
  > 3. vocabulary: string describing word choice level (e.g., 'Simple, conversational', 'Sophisticated and academic', 'Rich with sensory details', 'Uses technical jargon naturally').
  > 4. markers: string[] array of specific stylistic habits… Examples: 'Uses dashes often', 'Starts sentences with And/But', 'Uses rhetorical questions', 'Uses specific proper nouns', 'Uses humor/irony', 'Uses dialogue fragments'.
  > 5. sampleSentences: string[] array of 3 exact sentences from the text that BEST exemplify this voice. These will be used as 'style transfer' references. Pick the most distinct, flavorful sentences.
- Rebuild: 1 week.

**NW-2. ExperienceFingerprint Analyzer** — [COGNITIVE]
- Source: `src/services/narrativeWorkshop/analyzers/experienceFingerprintAnalyzer.ts:1-466`
- Schema (verbatim, `experienceFingerprintAnalyzer.ts:27-92`):
  - 6 uniqueness vectors: `unusualCircumstance { description, whyItMatters, specificDetail }`, `unexpectedEmotion { emotion, trigger, counterExpectation }`, `contraryInsight { insight, againstWhat, whyAuthentic }`, `specificSensoryAnchor { sensory, context, emotionalWeight }`, `uniqueRelationship { person, dynamic, unexpectedAspect }`, `culturalSpecificity { element, connection, universalBridge }`
  - 4 anti-pattern flags: `followsTypicalArc`, `hasGenericInsight`, `hasManufacturedBeat`, `hasCrowdPleaser` (each boolean + warnings array)
  - `divergenceRequirements { mustInclude, mustAvoid, uniqueAngle, authenticTension }`
  - `qualityAnchors [{ sentence, whyItWorks, preservationPriority: 'critical'|'high'|'medium' }]`
- Verbatim anti-convergence flag examples (`experienceFingerprintAnalyzer.ts:147-170`):
  > followsTypicalArc: TRUE if story follows setup → struggle → triumph → lesson. EXAMPLES: 'I struggled but persevered and won', 'I failed, learned, and succeeded', Any arc that ends with neat resolution
  > hasGenericInsight: TRUE if the lesson could appear in any essay. EXAMPLES: 'I learned hard work pays off', 'The journey matters more than the destination', 'Failure is a stepping stone to success', 'I discovered the importance of teamwork'
  > hasCrowdPleaser: TRUE if insight is designed to make readers nod, not think. EXAMPLES: Any conclusion most people would agree with, Safe observations about hard work/passion/growth, Anything that avoids uncomfortable truths
- Rebuild: 2–3 weeks.

**NW-3. SymptomDiagnoser (29 narrative weakness types)** — [COGNITIVE]
- Source: `src/services/narrativeWorkshop/analyzers/symptomDiagnoser.ts:29-177`
- Verbatim 29 types:
  > GENERAL (6): abstract_language, passive_agency, cliche_metaphor, telling_not_showing, generic_pacing, weak_verb
  > OPENING-SPECIFIC (9): dictionary_definition_opening, childhood_opening_cliche, famous_quote_opening, rhetorical_question_flat, thesis_statement_opening, melodramatic_opening, generic_scene_setting, weak_opening, generic_opening
  > ENDING-SPECIFIC (14): weak_ending, abrupt_ending, anticlimactic_ending, summary_conclusion, preachy_ending, generic_ending, excited_to_attend_ending, sudden_pivot_ending, false_resolution_ending, career_announcement_ending, overexplained_ending, repetitive_ending, abstract_ending, academic_ending
- Verbatim "WHY IT FAILS" examples (`symptomDiagnoser.ts:80-147`):
  > 8. childhood_opening_cliche: Variations of 'Ever since I was young,' 'From an early age,' 'Throughout my life,' 'Since I was a child.' WHY IT FAILS: THE most common cliché. AOs want CURRENT interests (that's why rec letters are from 11th/12th grade teachers). Childhood memories are vague and general.
  > 9. famous_quote_opening: Opening with quotes from famous figures (Gandhi, Einstein, Obama). WHY IT FAILS: Displaces the student's voice. Only 4.6% of successful essays use this. Personal dialogue works; famous quotes don't.
  > 14. weak_opening: WHY IT FAILS: AOs read 30-50 essays daily. First paragraph must grab attention. Research shows 8-second attention window (~17 words).
  > 16. weak_ending: WHY IT FAILS: Peak-end rule shows endings disproportionately shape how AOs remember essays. 85% of essays get neutral 'check marks.'
  > 18. anticlimactic_ending: WHY IT FAILS: Best endings combine surprise with inevitability (Aristotle). Anticlimactic endings create disappointment, waste built tension.
  > 22. excited_to_attend_ending: 'I can't wait to attend [University]!' WHY IT FAILS: 'College lust' signals insecurity. Admission isn't the story's climax; your growth is.
  > 26. overexplained_ending: WHY IT FAILS: 'Leave space for the reader.' Best endings suggest rather than state. Trust reader intelligence.
  > 27. repetitive_ending: WHY IT FAILS: Harry Bauld: 'Remember where you came from, without repeating what you've already said.'
  > 29. academic_ending: WHY IT FAILS: Wrong register. Personal essays need narrative conclusions, not argumentative wrap-ups.
- + `missing_elements` schema (`:148-162`): sensory_details / concrete_objects / micro_moment / emotional_truth — each diagnosis identifies WHAT IS MISSING that would make the passage brilliant.
- Rebuild: 4–6 weeks (requires admissions-reader/expert synthesis — the "Harry Bauld," "8-second attention window," "peak-end rule" citations reflect deep research, not invention).

**NW-4. Workshop Item Teaching Layer (3-layer framework)** — [COGNITIVE]
- Source: `src/services/narrativeWorkshop/stage2_deepDive/`, `stage3_grammarStyle/`, `stage4_synthesis/`, `stage5_sentenceLevel/`
- Structure: Diagnostic → Prescriptive → Application. Each workshop stage runs this sequence.
- Rebuild: 2–3 weeks.

### 2D. Activity Workshop (`src/services/portfolioStrategy/services/activityWorkshop/`)

**AW-1. 5-Dimension Description Scoring Rubric** — [COGNITIVE]
- Weights (per /tmp/audit-nap.md and activityWorkshop docs): Role Ownership 25%, Impact 25%, Differentiation 20%, Action Precision 15%, Quantification 15%.
- Source: `src/services/portfolioStrategy/services/activityWorkshop/stages/stage1ContextAwareAnalysisService.ts` (scoring logic at `:762-841` references these dimensions at runtime).
- Rebuild: 3–4 weeks.

**AW-2. Authenticity Voice Dimension** — [COGNITIVE]
- Source: `src/services/portfolioStrategy/services/activityWorkshop/scoring/` + `authenticityAnalyzer` modules
- Rebuild: 1–2 weeks.

**AW-3. 7-Category Feature Extraction** — [COGNITIVE]
- Verbs / Numbers / Role signals / Impact signals / Differentiation / Efficiency / Authenticity.
- Rebuild: 2 weeks.

**AW-4. Activity Scoring Types (tier, leadership, community character, commitment)** — [COGNITIVE]
- Source: `src/services/portfolioStrategy/services/activityWorkshop/types.ts` + stage scoring.
- Rebuild: 2–3 weeks.

**AW-5. 4-Stage Teaching Architecture (Stage 0 → 3)** — [RUNTIME + COGNITIVE]
- Source: `stage0StoryDetectionService.ts` (Haiku), `stage1ContextAwareAnalysisService.ts` (Sonnet), `stage2ConditionalTeachingService.ts` (Sonnet), `stage3PortfolioSynthesisService.ts` (Haiku).
- Rebuild: 4–6 weeks.

### 2E. Portfolio Stage 2 (`src/services/portfolio/stage2_dimensions/`)

**PS2-1. 4-Tier Authenticity Voice Analyzer with institutional weights** — [COGNITIVE]
- Source: `src/services/portfolio/stage2_dimensions/authenticityVoiceAnalyzer.ts:1-624`
- Verbatim tier structure (`authenticityVoiceAnalyzer.ts:136-190`):
  > Tier 1 DISTINCTIVE (9.0-10.0) — Top 1-5%: Reader can 'hear' the student's voice clearly; Stories are specific, vivid, sensory-rich; Shows vulnerability and genuine growth; Unique perspective that only this student could write; Memorable — reader would recognize student from essay alone. Narrative Quality Index: 80-100. Why Rare: <5% of applicants have truly distinctive, memorable voices.
  > Tier 2 AUTHENTIC (7.0-8.9) — Top 10-20%: Clear personality comes through; Real stories with specific details; Shows genuine passion (not manufactured); Addresses prompts directly with depth; Consistent voice across PIQs. NQI 70-79.
  > Tier 3 EMERGING (4.0-6.9) — Top 30-50%: Answers prompts but lacks depth; Some specific details, some generic language; Resume rehash in places. NQI 60-69.
  > Tier 4 MANUFACTURED (1.0-3.9) — Bottom 50%: Generic, could be anyone; 'College essay voice'; No specific stories; Robotic, formulaic, or AI-generated feel; Resume list format rather than narrative.
- Verbatim brutal calibration guards (`authenticityVoiceAnalyzer.ts:222-248`):
  > Reality Anchors: Most PIQs are forgettable; 'Adversity essays' are overdone; Over-editing kills voice — polished ≠ authentic; Short form is hard — 350 words requires precision; Adults often ruin voice.
  > Red Flags for Grade Inflation: DON'T give Tier 1 without genuinely memorable, distinctive voice; DON'T reward beautiful writing that's generic; DON'T ignore resume-rehash format; DON'T overlook manufactured adversity; DON'T inflate based on topic importance.
  > DO credit genuine specificity and vulnerability; DO value unique perspectives; DO recognize authentic voice even with imperfect grammar; DO reward risk-taking; DO check consistency across PIQs.
  > The '10,000 Applications' Test: Imagine you're a UC reader who has read 10,000 applications: Does this voice stand out? Will you remember this student tomorrow? Have you read this story 500 times before?
- Institutional weights (`authenticityVoiceAnalyzer.ts:82-97`): UCLA 30% (THE MOST CRITICAL DIMENSION), Berkeley 20%, General UC 20%.
- Rebuild: 2–3 weeks.

### 2F. Academic Advisor (`src/services/portfolioStrategy/services/academicWorkshop/capability/`)

**AA-1. Conversational Capability Types** — [COGNITIVE]
- Source: `conversational/` types — capture effort, difficulty, enjoyment, engagement, intrinsic interest per course.
- Rebuild: 2 weeks.

**AA-2. Identity Generation System (A+ → F)** — [COGNITIVE]
- Source: `deepAcademicReport/` orchestrator — Uplift rating + tier positioning + narrative identity combining GPA/rigor/major alignment/trajectory.
- Rebuild: 3–4 weeks.

**AA-3. Enriched Report Context Assembly** — [RUNTIME]
- Source: `deepAcademicReport/contextAssembly/` — routes data to forIdentity/forChallenges/forRoadmap/forResearch generators.
- Rebuild: 1–2 weeks.

**AA-4. Genuine Interest Detection** — [COGNITIVE]
- Intrinsic vs extrinsic motivation, self-disclosure authenticity. Per cataloger, no verbatim prompt was pulled; treat as claimed.
- Rebuild: 2 weeks.

### 2G. Shared Runtime Utilities — cataloged from scratch

**SU-1. `voiceProfile/voiceProfileService.ts` (386 lines)** — [RUNTIME]
- Exported: class `VoiceProfileService` with methods to derive, persist, and retrieve a StudentVoiceProfile from essay text. Types in `voiceProfile/types.ts` define StudentVoiceProfile.
- Consumers: `src/http/routes.ts`, `src/services/inlineEditor/inlineEditorService.ts`, `src/services/enhancedWorkshop/writingEnhancementOrchestrator.ts`, `src/services/commonAppWorkshop/services/batchGenerationService.ts`.
- **V1 consumption: ONE type import** (`src/services/essayIntelligence/types.ts:21` imports `StudentVoiceProfile` as type only). V1 does NOT call the service. Instead V1 reinvents voice analysis inside L1, L3, L3.75, L4 — 251 voice-related occurrences across 27 V1 files.
- Duplicate logic in V1:
  - L1 `firstImpressions.ts` produces `voiceObservation` per paragraph
  - L3.75 `holisticSynthesis.ts:289-363` produces voiceIdentity + voiceMap (5 dims) + stabilityRegions + shifts — completely parallel to voiceProfileService's capability
  - `profileManager/mutators/voiceMapMutator.ts` — writes voice data to the profile without ever consulting voiceProfileService

**SU-2. `voiceProfile/styleConsistencyService.ts` (494 lines)** — [RUNTIME]
- Consumers: bundled with voiceProfile exports, used by enhancedWorkshop.
- V1 consumption: ❌ Silently bypasses. V1's L3.75 `voiceMap.shifts` (`holisticSynthesis.ts:338-356`) and `stabilityRegions` (`:357-362`) reinvent style-drift detection.

**SU-3. `authenticity/aiRiskScorer.ts` (451 lines)** — [RUNTIME]
- Scores AI-generation risk with calibrated thresholds.
- Consumers: `src/services/authenticity/index.ts` → surfaced via the authenticity barrel.
- V1 consumption: ❌ Silently bypasses. V1 handles AI-risk judgments via:
  - L1 banned-word list (`firstImpressions.ts:75`) — 46 words, mostly evaluative adjectives, NOT an AI-risk detector
  - L3.75 `voiceIdentity.authenticVsPerformed` (`holisticSynthesis.ts:294-300`) — performs a qualitative assessment without the calibrated thresholds
- This is a P0 gap: V1 can produce an authenticVsPerformed assessment but has no mechanism-quality floor, no phrase-library, no drift-from-demographic-baseline signal that aiRiskScorer provides.

**SU-4. `storyMining/storyMiningService.ts` (857 lines)** — [RUNTIME]
- Extracts story fragments, moments, and inflection points from long essays.
- Consumers: `src/http/routes.ts`, `src/services/enhancedWorkshop/writingEnhancementOrchestrator.ts`, `src/services/commonAppWorkshop/services/batchGenerationService.ts`.
- V1 consumption: ❌ Silently bypasses. V1's L3 walk `significantChoices` (`sequentialDeepWalk.ts:351-357`) and L3.75 `momentEarnednessMap` (`holisticSynthesis.ts:392-410`) reinvent moment/story extraction per analysis call.

**SU-5. `rag/ragService.ts` (509 lines) + `rag/embeddingService.ts` (168 lines) + `rag/ragSeeder.ts`** — [RUNTIME]
- Retrieves relevant exemplar essay fragments via embedding similarity.
- Consumers: `src/services/inlineEditor/inlineEditorService.ts`, `src/services/commonAppWorkshop/services/batchGenerationService.ts`, `src/http/enhancedWorkshopRoutes.ts`.
- V1 consumption: ❌ Silently bypasses. V1's analysis layers have no RAG integration. (InlineEditor DOES use RAG via `commandPrompts.ts:151-170` — which is downstream of V1 and uses RAG correctly.)

**SU-6. `inlineEditor/commandPrompts.ts` (717 lines) — 15 built-in editing commands** — [COGNITIVE + RUNTIME]
- The prompt library IS the cognitive asset. Each command has a ~150-250 token `detailedPrompt` instruction block with before/after examples and anti-fabrication guardrails.
- Verbatim 15 command IDs and one-sentence descriptions (`commandPrompts.ts:176-620`):
  1. `make_concrete`: "Replace vague, abstract language with specific, concrete details. Add names, numbers, places, sensory details." (Haiku)
  2. `show_dont_tell`: "Convert telling (stating emotions/lessons) to showing (scenes, dialogue, actions, sensory details). Instead of 'I was nervous', show physical symptoms." (Haiku)
  3. `clarify_learning`: "Deepen the reflection. Move from surface-level 'I learned...' to specific, surprising insight. What did you understand that you didn't before?" (Haiku)
  4. `add_stakes`: "Raise the stakes. What was at risk? What would happen if things went wrong? Add consequence and tension." (Haiku)
  5. `strengthen_voice`: "Make this sound more like the student's authentic voice. Adjust formality, energy, and word choice to match their natural register." (Haiku)
  6. `cut_filler`: "Remove unnecessary words, redundant phrases, and filler. Every word should earn its place. Target 15-25% word count reduction." (Haiku)
  7. `add_evidence`: "Add specific metrics, numbers, results, or proof. Replace vague claims with quantified impact." (Haiku)
  8. `deepen_vulnerability`: "Move past surface-level emotion to specific, honest vulnerability. Name the exact fear, failure, or confusion. Show physical/emotional symptoms." (Sonnet)
  9. `connect_to_theme`: "Link this passage to the essay's central theme or argument. Create an echo or callback that strengthens coherence." (Sonnet)
  10. `fix_hook`: "Strengthen the opening. Start with action, a surprising detail, dialogue, or a specific sensory moment instead of a generic statement." (Haiku)
  11. `sharpen_ending`: "Strengthen the conclusion. Create resonance by echoing the opening, landing on a specific image, or crystallizing the insight." (Haiku)
  12. `expand_moment`: "Slow down time on this moment. Add sensory detail, internal thought, physical sensation. Make the reader feel present." (Haiku)
  13. `compress`: "Say the same thing in fewer words. Preserve meaning and voice while cutting 20%+ of word count. Prefer active voice and strong verbs." (Haiku)
  14. `add_dialogue`: "Convert summary into a scene with quoted dialogue. Use dialogue tags that reveal character. Show the interaction." (Haiku)
  15. `remove_cliche`: "Replace clichéd language with fresh, specific alternatives. Find the image or phrase that only THIS student would use." (Haiku)
- Verbatim `deepen_vulnerability` detailed prompt (`commandPrompts.ts:373-398`):
  > **WHAT TO LOOK FOR:** Surface-level emotion labels: 'it was hard', 'I struggled', 'I felt lost', 'I was overwhelmed'; Performed vulnerability: 'I'm not afraid to admit', 'to be vulnerable for a moment', 'in the spirit of authenticity'; Generic hardship: 'I faced many challenges', 'it wasn't easy', 'there were obstacles'; Lesson-first framing: 'I learned that vulnerability is strength' (thesis statement, not vulnerability)
  > **HOW TO DEEPEN:** Name the EXACT fear, not the category: 'I was afraid' → 'I was afraid that if I asked for help, Mrs. Chen would realize I'd been pretending to understand derivatives for three weeks'; ALWAYS include a physical body response: tight chest, stomach dropping, throat closing, hands trembling, sweat on palms, breath catching, going numb, jaw clenching, ache behind the eyes; Move from summary to a single granular instant
  > BEFORE: 'I felt like I didn't belong.' AFTER: 'My stomach dropped every time I walked into that room. I'd count the ceiling tiles rather than look for an empty seat — twenty-three tiles, every day, twenty-three.'
  > BEFORE: 'I had no idea what I was getting into.' AFTER: 'My chest went tight the first time I stood in front of them. I didn't know what I was doing, and I was afraid they could tell.'
  > ANTI-FABRICATION: Only deepen emotions ALREADY PRESENT in the student's text. Never add trauma, hardship, mental health struggles, or negative experiences the student did not express.
  > OUTPUT GUIDANCE: Both alternatives MUST include at least one physical/somatic vulnerability marker — body sensations like stomach, chest, throat, breath, trembling, sweat, numb, ache, tight, hollow, dizzy, or froze. Emotional labels alone ('I was scared') do NOT count as vulnerability — name the body's response.
- Verbatim `fix_hook` detailed prompt critical constraint (`commandPrompts.ts:456-458`):
  > CRITICAL CONSTRAINT: The FIRST SENTENCE of both alternatives MUST be 15 words or fewer. Count the words — if it exceeds 15, split it or cut it down. Short punch first, context after.
- Verbatim shared BANNED_TERMS_LIST (`commandPrompts.ts:57-130`) — 40 phrases aggregated from semanticClicheAnalyzer + PIQ issuePatterns + activity expertSystemPrompts.
- Rebuild estimate: 4–6 weeks of R&D-quality prompt engineering + iteration.
- **This IS cognitive knowledge.** Treat the 15 prompts as the canonical inventory of teach-oriented mechanism prescriptions.

**SU-7. `lib/llm/claude.ts` (~600 lines) + `lib/llm/unified.ts`** — [RUNTIME]
- Exports: `callClaudeWithRetry`, `calculateCost`, `classifyError`, `ClaudeResponse`, `LayerError`, `getAnthropicClient`.
- V1 consumption: ✅ All V1 layers import `callClaudeWithRetry`, `calculateCost` from here. This is the one shared utility V1 uses correctly.

---

## Section 3 — V1 Current State Catalog

Below, each layer is cataloged with model, cache strategy, verbatim system-prompt excerpt, verbatim user-prompt template excerpt (where relevant), taxonomies/rubrics referenced, forcing functions, output schema, and a thin/rich/placeholder observation.

### L1 — First Impressions
- Source: `src/services/essayIntelligence/analysis/firstImpressions.ts`
- Model: `claude-haiku-4-5-20251001`, temp 0.2, parallel-per-paragraph, `cacheSystemPrompt: true` (`firstImpressions.ts:544-553`).
- Verbatim system prompt (`firstImpressions.ts:70-145`):
  > You are a literary cataloger — your job is to DESCRIBE what you observe in a paragraph of a college application essay, the way a naturalist describes what they see in a forest. You do NOT judge quality. You do NOT evaluate effectiveness. You NOTICE and RECORD.
  > BANNED WORDS (never use these or synonyms): effective, ineffective, strong, weak, powerful, powerless, compelling, uncompelling, excellent, poor, good, bad, impressive, disappointing, clumsy, awkward, graceful, elegant, successful, unsuccessful, masterful, amateurish, sophisticated, simplistic, well-crafted, poorly-crafted, beautiful, ugly, brilliant, dull, vivid, flat, dynamic, static, engaging, boring, captivating, tedious, resonant, hollow, authentic, inauthentic, convincing, unconvincing, natural, forced, polished, rough, refined, crude
  > FRAME CONSTRAINT: Every observation must be completable with 'I notice that...' NOT 'I think this is...'
  > CORRECT: 'The sentence uses present tense to describe a past event' / 'The narrator shifts from first person to second person mid-paragraph'
  > WRONG: 'The present tense effectively creates immediacy' / 'The word choice is powerful here'
  > …
  > FIELD-SPECIFIC EXAMPLES (correct vs incorrect): apparentPurpose: CORRECT: 'This paragraph introduces a physical setting through sensory details — the sound of a cash register, the smell of leather — and places the narrator inside a specific location.' WRONG: 'This paragraph effectively establishes the scene and draws the reader in with vivid sensory language.'
  > FINAL CHECK: Before outputting, scan your JSON for ANY word from the banned list or ANY evaluative framing. If found, rephrase as pure description.
- Verbatim user prompt (`firstImpressions.ts:160-173`):
  > FULL ESSAY ({totalParagraphs} paragraphs — you are observing paragraph {i+1}, marked with >>>): {markedEssay}
  > TARGET PARAGRAPH {i+1}: {paragraphText}
  > Produce the observation JSON for the target paragraph. Remember: describe WHAT IS, never HOW WELL.
- Taxonomies/rubrics referenced: 46-word banned-word list (inline). No external taxonomy.
- Forcing functions: (1) banned-word list (46 words); (2) "I notice that..." frame constraint; (3) FINAL CHECK self-audit.
- Output schema: `ParagraphFirstImpression` from `profileTypes.ts:20-60`.
- Observation: **Rich** for its purpose (descriptive-only extraction) but intentionally narrow. Misses most R&D cliché/AI categories (see Section 4).

### L2 — Structural Cartographer
- Source: `src/services/essayIntelligence/analysis/structuralCartographer.ts`
- Model: Sonnet, temp 0.3, single call, cached system prompt.
- Verbatim system prompt excerpt (`structuralCartographer.ts:63-117`):
  > You are an expert structural architect for college application essays. You specialize in understanding how essays are BUILT — not what they say, but how each piece serves the whole.
  > CRITICAL DISTINCTION: You identify ARCHITECTURAL ROLES, not topics.
  > BAD: 'role': 'describes the college visit' (topic label)
  > GOOD: 'role': 'frame of risk — establishes the stakes that the rest of the essay tests' (architectural role)
  > BAD: 'weaknessFlag': 'could be more specific'
  > GOOD: 'weaknessFlag': 'carries the essay's only concrete scene but compresses it into 2 sentences — the architecture needs this to breathe'
  > …
  > BANNED ROLE LABELS (too generic — always use essay-specific structural metaphors instead): 'introduction', 'body paragraph', 'development', 'conclusion', 'provides context', 'establishes', 'discusses', 'explores', 'transitions', 'wraps up', 'summarizes'
  > …
  > RULES: paragraphRoles MUST have exactly one entry per paragraph, in index order; arcType must match one of the six allowed values exactly; Theme must be framed as a TENSION or QUESTION, not a topic word
- Taxonomies referenced: 6 narrative arcs (`NarrativeArcType`: man_in_hole, cinderella, icarus, quest, rags_to_riches, ambiguous) imported from `workshop/scoring/narrativeAnalyzerTypes`. 4 transition qualities. 11-item banned label list.
- Forcing functions: architectural-role-not-topic-labels; theme-as-tension mandate; banned generic labels.
- Output schema: `StructuralCartography` (`types.ts`).
- Observation: **Rich architecture, thin taxonomy of failure modes** — no enumeration of weakness archetypes like SymptomDiagnoser provides.

### L2.5 — Scout Pass (Connection Scout)
- Source: `src/services/essayIntelligence/analysis/scoutPass.ts`
- Model: Haiku, temp 0.2, single call, cached system prompt.
- Verbatim system prompt (`scoutPass.ts:64-120`):
  > You are a connection scout — a literary metal detector. Your job is to FIND potential cross-paragraph patterns, not to explain them. You beep when you detect something; someone else digs it up.
  > 1. REPEATED ELEMENTS: Report WHAT recurs and WHERE. GOOD: "'diamond' appears in P1S2 ('grandmother's diamond ring') and P3S4 ('diamond-shaped scar')" BAD: 'The diamond creates thematic resonance between heritage and pain' ← Do NOT claim significance.
  > 2. TONAL SHIFTS: Report FROM what TO what and WHERE. GOOD: 'P2 ends with a matter-of-fact tone (\"I closed the door\"); P3 opens with urgency (\"My hands wouldn\'t stop shaking\")' BAD: 'The tonal shift effectively creates dramatic tension'
  > 3. STRUCTURAL ECHOES: Parallel constructions, mirrored sentence structures, repeated syntactic patterns.
  > CONSTRAINT: If you catch yourself writing 'creates,' 'establishes,' 'reinforces,' 'underscores,' 'demonstrates,' or 'contributes to' — STOP. You are overstepping.
  > …
  > COMPLETENESS RULES: Maximum 15 repeated elements, 10 tonal shifts, 8 structural echoes.
- Taxonomies referenced: none.
- Observation: **Thin** — potentialSignificance guidance is vague ("describe the FACTUAL RELATIONSHIP between the two occurrences"). Missing: a taxonomy of echo-types, reader-effect framing.

### L3 — Sequential Deep Walk (the CORE)
- Source: `src/services/essayIntelligence/analysis/sequentialDeepWalk.ts`
- Model: Sonnet, temp (WALK_TEMPERATURE), paragraph-by-paragraph, cached system prompt (`:626-632`).
- Verbatim system-prompt critical excerpts (`sequentialDeepWalk.ts:177-498`):
  > You are a Literature PhD who has read 10,000 college application essays and can articulate what a casual reader feels but cannot name.
  > === YOUR SOLE JOB: UNDERSTANDING (NOT EVALUATION) === You describe WHAT the essay IS and HOW it works. You NEVER evaluate how WELL anything works.
  > FORBIDDEN VOCABULARY: effective, effectively, strong, strongly, weak, weakly, compelling, powerful, poor, excellent, impressive, beautiful, clumsy, awkward, masterful, skillful, skillfully, brilliant, mediocre, lackluster, flawed, successful, unsuccessful, well-crafted, poorly, fails to, succeeds in, nicely, appropriately
  > === DEPTH OF UNDERSTANDING — WHAT EXPERT READING LOOKS LIKE === SURFACE (insufficient): 'This sentence uses concrete imagery to ground the reader.' STRUCTURAL (getting closer): 'This sentence's concrete sensory registers — leather texture, fluorescent light, counter temperature — construct a world organized around physical transactions.' ARCHITECTURAL (what we need): 'The specific sensory registers chosen (leather, fluorescent light, cold counter) construct a world organized around physical transactions — establishing that this narrator understands value through what can be touched, weighed, and appraised. When the grandmother's story arrives in P3 as pure oral narrative, it disrupts this sensory framework: memory cannot be held under a jeweler's loupe. The clash between P1's epistemology (value = measurable) and P3's epistemology (value = inherited story) IS the essay's central tension, and it starts here in the choice of which senses to activate.'
  > === EVIDENCE GROUNDING (STRUCTURAL REQUIREMENT) === Every observation MUST cite specific text — quote the actual words. If you cannot quote specific words for an observation, the observation is too abstract. Rewrite it with evidence or delete it.
  > === NOVELTY-DRIVEN GROWTH === For paragraph 1, everything is new — produce rich, detailed understanding. For later paragraphs, ask: 'What does THIS paragraph reveal that wasn't already understood?' Natural novelty curve: P1 should produce the richest output (everything is new). P5 should produce focused output (only what P5 contributes that earlier paragraphs didn't). This is not a bug — it means earlier paragraphs were thoroughly understood.
  > === OBSERVATION ECONOMY === Every observation must pass this test: 'Would a competent English teacher already know this?' If YES — do NOT produce the observation. If NO — produce it with evidence.
  > === BACK-PROPAGATION === When this paragraph reveals something new about an EARLIER sentence's role, update its primaryFunction and/or significance via priorSentenceUpdates.
  > === FINDINGS (MANDATORY — EVERY PARAGRAPH PRODUCES FINDINGS) === TRANSITIONAL: 1 finding. CONTRIBUTING: 2-3 findings. PIVOTAL: 3-5 findings. MATURITY: hypothesis → developing → confirmed → deepened. SUPERSESSION IS RARE: prefer 'deepened' or 'confirmed' over 'superseded'.
  > === IMPROVEMENT CANDIDATE EMISSION (the one prescriptive field in L3) === EMIT a candidate ONLY when ALL are true: (1) Your understanding revealed that [the sentence] is attempting something it cannot fully accomplish with its current wording; (2) You can name a SPECIFIC, localized change; (3) The fix lives in THIS sentence. EMIT null for the majority of sentences. Target: 20-40% of sentences in a weak essay, 5-15% in a strong essay.
- Taxonomies referenced:
  - `TECHNIQUE_VOCABULARY_PROMPT_BLOCK` imported from `analysis/techniqueVocabulary.ts` (injected via `{TECHNIQUE_VOCABULARY_PROMPT_BLOCK}` placeholder)
  - Rhythm enum: `short_punch, medium_flow, long_build, fragment, staccato, anaphora_series, parallel_build, subordinate_delay` (`sequentialDeepWalk.ts:348`)
  - Techniques enum: `anaphora, imagery, juxtaposition, concrete_detail, metaphor, personification, alliteration, parallel_structure, fragment, polysyndeton, asyndeton, chiasmus, synesthesia` (`:349`)
  - Significance enum: `pivotal | contributing | transitional`
  - Finding maturity enum: `hypothesis | developing | confirmed | deepened | superseded`
  - Coaching value enum: `critical | high | medium | contextual | diagnostic`
- Forcing functions: three-level depth (Surface → Structural → Architectural); STRUCTURAL-ONLY patterns-to-push-past checklist; evidence grounding; novelty-driven growth; observation economy ("competent English teacher" test); back-propagation; mandatory findings; supersession rarity.
- Observation: **Rich** forcing-function architecture. Missing: L3 has no paragraph-role-typed prompt hints (e.g., "if this is the opening, check these 9 opening-failure archetypes"). That R&D content is in narrativeWorkshop's SymptomDiagnoser.

### L3.75 — Holistic Synthesis
- Source: `src/services/essayIntelligence/analysis/holisticSynthesis.ts`
- Model: Sonnet, temp 0.4, two phases (A+B), cached system prompts.
- Shared preamble verbatim (`holisticSynthesis.ts:246-276`):
  > You are an expert essay holistic synthesizer. … YOUR unique advantage: you see EVERYTHING simultaneously.
  > === CRITICAL CONSTRAINT — Understanding Only (Anti-Contamination) ===
  > FORBIDDEN VOCABULARY: Evaluative judgments: 'weak', 'strong', 'effective', 'ineffective', 'successful', 'fails', 'impressive', 'lacking'; Prescriptive language: 'should', 'needs to', 'must improve', 'could be better', 'would benefit from'; Comparative quality: 'excellent', 'poor', 'mediocre', 'masterful', 'sophisticated', 'clumsy', 'awkward'; Score-adjacent: 'high-quality', 'low-quality', 'well-crafted', 'poorly executed'
  > Use DESCRIPTIVE language only. This separation is structural: L3.75 builds the understanding substrate. L3.5 evaluates it. L5 prescribes action.
- MECHANISM QUALITY STANDARD verbatim (`holisticSynthesis.ts:447-455`):
  > A mechanism only counts if it creates a SPECIFIC sensory or emotional experience in the reader. Stock phrasing and dead metaphors do NOT count as mechanisms even if they technically contain sensory or emotional language:
  > COUNTS as sensory_grounding: 'slid the ring across the glass counter' — you see the action, hear the glass, feel the weight
  > DOES NOT COUNT: 'fingers danced across the piano keys' — dead metaphor, evokes no specific sensory experience
  > COUNTS as emotional_setup: 'her laugh filled the kitchen every Sunday'
  > DOES NOT COUNT: 'I was captivated by the power' — tells an emotion without grounding it
  > COUNTS as intellectual_scaffolding: 'spent hours swapping B-flat for B-natural, listening for the mood shift'
  > DOES NOT COUNT: 'I spent hours experimenting with chord progressions' — summary of a process with no specific detail
  > If a claimed mechanism is stock language, a cliché, or a summary that doesn't create a specific experience for the reader, it is NOT a mechanism — it is a GAP.
- INTENTIONALITY CALIBRATION BY ESSAY QUALITY (`holisticSynthesis.ts:425-431`):
  > STRONG essay (most sentences specific, voiced, architectural): voice shifts are likely intentional.
  > FUNCTIONAL essay (competent but generic, some cliches): voice shifts are likely UNINTENTIONAL or AMBIGUOUS. Default to 'ambiguous' unless you find STRONG textual evidence.
  > DEVELOPING essay (vague, telling-heavy): voice shifts are almost certainly unintentional. Default to 'unintentional.'
  > WRONG for a mediocre essay: 'intentional (0.75) — The shift from sensory to abstract vocabulary enacts the paragraph's epistemological argument.' (A 17-year-old writing a mediocre essay is not enacting an epistemological argument.)
- characterRevelation.writerPortrait framing (`holisticSynthesis.ts:524-529`):
  > WHO WOULD YOU WANT TO HAVE LUNCH WITH after reading this? Describe the PERSON — their energy, what they'd talk about, how they see the world. NOT their essay topics or writing ability.
  > RIGHT: 'Someone who notices small things others miss — the kind of person who'd stop mid-sentence because they saw something out the window that reminded them of their grandmother's kitchen. Probably argues with their friends about whether something counts as art. Almost certainly has strong opinions about food.'
- 10 holistic sections (Phase A 4 + Phase B 6): voiceIdentity, voiceMap (with 5 VoiceDimensions + stabilityRegions + shifts + intentionality), emotionalTopography, momentEarnednessMap, thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment (with craftPatterns.pairedImprovement prescriptive carve-out), admissionsPositioning (with archetypeContext), entanglements.
- Taxonomies referenced:
  - 5 VoiceDimensions: `register, vocabulary, rhythm, perspective, tonal_disposition`
  - 9 TonalQualities: `humor, irony, earnestness, irreverence, solemnity, self_awareness, detachment, tenderness, defiance`
  - 7 mechanism types: `sensory_grounding, emotional_setup, stakes_establishment, character_revelation, thematic_preparation, intellectual_scaffolding, comedic_subversive_setup`
  - 4 momentTypes: `emotional | intellectual | humorous | subversive`
  - 4 thread strengths: `dominant | supporting | hinted | dropped`
  - 4 intentionality assessments: `intentional | unintentional | ambiguous`
  - 3 expectedImpact: `transformative | significant | incremental`
  - `archetypeContext.poolDensity`: `saturated | common | moderate | uncommon | rare`
- Observation: **Rich** forcing functions (Mechanism Quality Standard, intentionality calibration, the "lunch with" framing), **rich schema**, but: (1) `admissionsPositioning.distinctivenessFactors` and `archetypeContext.differentiator` are freeform prose — no enumerated archetype library for poolDensity calibration; (2) `characterRevelation.writerPortrait` has no enumerated anti-convergence checklist like NW-2 ExperienceFingerprint provides.

### L3.5 — Analysis Pass
- Source: `src/services/essayIntelligence/analysis/analysisPass.ts`
- Model: Sonnet, temp (ANALYSIS_TEMPERATURE), anchor + parallel, cached system prompt.
- Verbatim system prompt scoring calibration (`analysisPass.ts:356-466`):
  > LLMs default to inflated scores. You MUST resist this. Use these concrete anchors:
  > 96-100 MASTERFUL (Extremely rare, 0-1 per essay)
  > 86-95 EXCEPTIONAL (Rare, 1-2 per essay)
  > 76-85 GENUINELY STRONG (Several per strong essay)
  > 55-75 FUNCTIONAL (MOST sentences in a decent essay)
  > 40-54 WEAK BUT FUNCTIONAL (Several per developing essay)
  > Below 40 PROBLEMATIC (Rare in submitted work)
  > SCORE 38: 'From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound.' WHY 38: 'Fingers danced' is stock phrasing found in thousands of essays. 'Captivated by the power to create worlds' is unearned grandiosity — no sensory detail, no specific memory, no physical grounding. Any applicant could write this sentence without having touched a piano.
  > SCORE 52: 'I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood.' WHY 52: 'Hours experimenting' gestures at real practice but provides no sensory or temporal specifics.
  > SCORE 72: 'Most Wednesdays smelled like bleach and citrus.' WHY 72: Specific day (not 'every day'), specific sensory registers (smell, not sight), grounds the reader physically. The double scent detail suggests genuine memory.
  > SCORE 88: 'I wanted to disappear. For three weeks afterward, I couldn't pick up my violin without my stomach clenching.' WHY 88: 'Wanted to disappear' is emotionally honest without melodrama. 'Three weeks' is precise and devastating. 'Stomach clenching' is a physical, involuntary response that proves the emotion rather than asserting it.
  > SCORE 78 (admissions resonance): 'That semester my GPA dropped from a 3.8 to a 2.4, and I told no one.' WHY 78: Craft is PLAIN — no imagery, no metaphor. But admissions resonance is exceptional: the specific numbers (3.8 → 2.4) prove this is real. 'I told no one' reveals isolation, shame, and the gap between public persona and private struggle. High revelation density compensates for modest craft.
  > …
  > ## PRE-SCORING CALIBRATION (mandatory before scoring any sentence)
  > Anti-clustering rules: If your scores cluster in the 75-90 range with no differentiation, you have FAILED. The strongest and weakest sentences in this paragraph MUST differ by at least 20 points. A mediocre essay's sentences should average 50-65, NOT 70-80. Reserve 70+ for sentences that genuinely earn it. Use the FULL range. Cliched openings, unearned claims, and template language belong at 35-50.
  > Inter-essay calibration tier table: WEAK (35-45 avg, 25-60 range, Mostly telling, vague, unearned); MEDIOCRE (45-55 avg, 30-70 range, Some functional craft but nothing distinctive); COMPETENT (55-65 avg, 40-80 range); STRONG (65-75 avg, 45-90 range); EXCEPTIONAL (75-85 avg, 55-95 range, Would make an AO pause, re-read, and remember).
  > COMPRESSION CHECK: If most of your sentence scores fall in the 55-75 band regardless of essay quality, you are COMPRESSING.
- Taxonomies referenced: 5 quality tiers (WEAK/MEDIOCRE/COMPETENT/STRONG/EXCEPTIONAL). TECHNIQUE_VOCABULARY_PROMPT_BLOCK.
- Forcing functions: anchored score calibration (38/52/72/88); forced ranking; admissions resonance + revelation density weighting; anti-clustering (20-point minimum range); inter-essay tier classification; mandatory calibrationReflection referencing actual text; confidence assessment with sensitivityNote.
- Observation: **Rich** scoring architecture. Missing: dimension-bound rubrics. L3.5 scores each sentence on one-dimensional `effectiveness` (0-100) plus the 4 L4 matrix dimensions. It has no equivalent of PIQ's 13-dimension rubric or Common App's 12-dimension type-weighted matrix. The 5 anchored examples are good but cover only 5 specific craft failure modes, not the 41-pattern PIQ library or 28-pattern Common App library.

### L4 — Crystallizer
- Source: `src/services/essayIntelligence/analysis/crystallizer.ts`
- Model: Sonnet, 2 sequential calls (L4a-NorthStar + L4a-ScoreMatrix).
- Verbatim key prompt (`crystallizer.ts:201-252`):
  > You are the Crystallizer — a literary-architectural analyst who reads a complete essay profile and produces the structural core of the crystallization.
  > ESSAY NORTH STAR — the architecture of meaning. NOT a summary. A summary is lossy compression — everything in it exists more deeply elsewhere. The North Star is an EMERGENT PROPERTY — an interpretive synthesis that transcends any individual profile section. Think of a conductor studying a symphony score: the conductor doesn't need the notes (sentence understanding) or tuning assessment (analysis). The conductor needs the interpretive vision — the first movement's theme reappears inverted in the fourth, and that inversion IS the emotional argument.
  > THROUGH-LINE MAP: Trace the central element's MEANING transformation — not its physical appearances. BAD: 'The diamond appears in P1, P3, and P5.' GOOD: 'The diamond's signification transforms: P1 establishes it as commodity (pawnshop appraisal), P3 reframes it as inheritance (grandmother's ring), P5 claims it as identity marker (refusal to sell = refusal to reduce self to market value).'
  > STRUCTURAL ROLES MAP: What each section IS in the architecture of meaning — structural necessity, not topic. BAD: 'P1 introduces the topic. P2 provides background.' GOOD: 'P1 frames the economic lens that makes P3's emotional stakes calculable, P2 populates the world the lens examines, P3 is the fulcrum where market-value logic encounters irreducible personal value.' Ask: 'If I removed this section, what architectural load would be unsupported?'
  > DISTINCTIVENESS SIGNATURE: What makes this essay NON-INTERCHANGEABLE. If your signature could describe any essay about [topic], it's not specific enough. BAD: 'This essay uniquely combines personal narrative with thematic depth.' GOOD: 'Uses pawnshop economics to dramatize the gap between market value and inherited value — the specific structural choice of opening with an appraisal makes the grandmother's ring both literally and figuratively priceable, which is what gives the refusal-to-sell its force.' The distinctiveness must be specific to THIS essay's EXECUTION, not its topic.
  > ANTI-CLUSTERING PROTOCOL (W3.3 — mandatory): FORCED RANKING; WITHIN-PARAGRAPH RANGE must span at least 15 points; CROSS-PARAGRAPH RANGE must be at least 20 points; FULL-RANGE ANCHORS: 90+: among the best; 70-89: genuinely strong; 50-69: functional; 30-49: weak; Below 30: actively problematic. If all paragraphs cluster in the 70-85 range for any dimension, you have FAILED.
- Taxonomies referenced: 3 ACTIVE_DIMENSIONS per scale (supplement / piq / personal_statement); 8 narrativeMoves (`introduction | development | submersion | resurfacing | transformation | resolution | complication | echo`); 4 weight types (`load_bearing | supporting | transitional | decorative`); 3 textSupport levels (`strong | moderate | speculative`); 6 elementTypes (`image | question | tension | metaphor | relationship | idea`); 4 confidence states (`hypothesis | emerging | full | student_confirmed`).
- Forcing functions: North Star as emergent property (not summary); through-line as MEANING transformation; structural-necessity test ("what breaks if removed?"); distinctiveness-of-execution not distinctiveness-of-topic; 5-dimension anti-clustering with forced ranking.
- Observation: **Rich** architecture. Missing: no archetype library for distinctiveness-signature calibration, no institutional-fit taxonomy.

### L5 — Deep Annotation
- Source: `src/services/essayIntelligence/analysis/deepAnnotationService.ts`
- Model: Sonnet, parallel per paragraph.
- Verbatim teaching-mode definitions (`deepAnnotationService.ts:146-151, 847-852`):
  > AWARENESS: 'Notice this...' — draws attention to a pattern the student likely hasn't seen. No fix suggested. Goal: build perception.
  > CONSEQUENCE: 'This matters because...' — explains the architectural consequence of a local choice. Goal: build structural thinking.
  > CONNECTION: 'This relates to...' — links this moment to another part of the essay. Goal: build architectural vision.
  > ACTION: 'Try this...' — specific, structurally-grounded rewrite. Goal: provide a concrete next step.
  > Select the mode that serves each specific teaching moment. Don't default to ACTION for everything — awareness and consequence build deeper learning than instructions.
  > Order annotations for cognitive flow: AWARENESS → CONSEQUENCE → CONNECTION → ACTION.
  > ACTION MODE REQUIRES A REWRITE — NO ESCAPE HATCH. (`:876-881`) There is no 'change to consequence mode' downgrade path. If you cannot produce a rewrite, the annotation should have been emitted with teachingMode='consequence' from the OUTSET.
- Phase-aware zoom (referenced `deepAnnotationService.ts:11`): Foundation → Architecture → Craft → Polish → Distinction.
- Forcing functions: teaching-mode selection (resist ACTION bias); ACTION requires rewriteExample (fail-fast at parser); cognitive-flow ordering; phase-aware filtering.
- Observation: **Rich architecture** for teaching-mode routing. Missing: no enumerated library of AWARENESS targets (e.g., "if you see essay-speak, AWARENESS annotation is the first teaching mode") keyed on the R&D taxonomies.

### L6 — Coaching
- Source: `src/services/essayIntelligence/coaching/coachingService.ts` (5475 lines)
- Model: Haiku (insight extraction, message-type classification) + Sonnet (response + deepening).
- Stage 4 verdicts (`coachingService.ts:337`): `confirmed | superseded | tensioned | none`.
- Forcing functions: 20 technique routes; 5 anti-convergence patterns; Stage 4 verdict; finding supersession/confirmation.
- Taxonomies referenced: 5 anti-convergence matchers (`coachingService.ts:233-248`).
- Observation: **Rich orchestration, thin teaching library**. Missing: the R&D coaching guardrails (PIQ GOOD/BAD sensory pairs, "NEVER 'improve' sentences that already work," 5-step coaching structure, explicit math for word-economy cuts).

### Deep Dive Library
- Source: `src/services/essayIntelligence/analysis/deepDivePromptLibrary.ts` (1008 lines)
- ~20 investigation templates covering voice authenticity, emotion earning, theme threads, narrative strategy, character values, etc.
- Observation: **Thin** — high-level briefs that do not duplicate narrativeWorkshop's ExperienceFingerprint, SymptomDiagnoser, or PIQ issue patterns.

### Profile Manager
- Source: `src/services/essayIntelligence/profileManager/` (~15 core types + mutators + router + finding store)
- Types: `EssayProfile, ParagraphProfile, SentenceUnderstanding, EssayNorthStar, HolisticSynthesisOutput, Finding, ConnectionGraph, ImprovementPhase, AnalysisPassOutput, ParagraphScoreMatrix, CoherenceReport, ProfileIndex, ReadinessState, RunningUnderstanding`.
- Observation: **Rich infrastructure**, no cognitive content. This is where V1 should IMPORT shared services rather than re-fetching.

---

## Section 4 — Three-Bucket Mapping (authoritative gap analysis)

> Legend — **Depth Delta**: 0 (equivalent), 1-3 (minor thinning), 4-7 (significant thinning), 8-10 (effectively missing). **Port Priority**: P0 (ship-blocker for $500/hr quality), P1 (high leverage), P2 (polish), defer.

| # | R&D Asset | Source | V1 Equivalent | V1 Location | Bucket | Depth Δ | Port Priority |
|---|---|---|---|---|---|---|---|
| 1 | 6 Core Writing Principles (CA-1) | `writingPrinciples.ts:41-300+` | L3.5 scoring + L5 teaching prompts reference "specificity/voice/show-vs-tell" as adjectives | `analysisPass.ts:356-466`, `deepAnnotationService.ts:807-952` | **B** | 6 | P1 |
| 2 | 500+ phrase Cliché Reference Library (CA-2) | `semanticClicheAnalyzer.ts:177-620+` | L1 46-word banned list + inlineEditor 40-phrase BANNED_TERMS | `firstImpressions.ts:75`, `inlineEditor/commandPrompts.ts:57-130` | **B** | 7 | **P0** |
| 3 | 28 Issue Detection Patterns w/ IDs (CA-3) | `issueDetectionPatterns.ts:65-1579` | L3.5 freeform `weaknesses[]` array (no pattern library) | `analysisPass.ts:537-539` | **C** | 9 | **P0** |
| 4 | 14-type Weight Matrix (CA-4) | `typeWeightMatrices.ts`, `writingPrinciples.ts` (type-specific) | L4 ACTIVE_DIMENSIONS (3 scales only) | `crystallizer.ts:160-170` | **B** | 7 | **P0** |
| 5 | 13-College Institutional Tailoring (CA-5) | `collegeTailoringRubric.ts`, 13 data files | `coaching/collegeOverlay.ts` (thin) | `coaching/collegeOverlay.ts:1-242` | **B** | 6 | P1 |
| 6 | Anti-Bias Calibration (CA-6) | `antiBiasCalibration.ts:1-420` | L3.5 anti-clustering + tier classification | `analysisPass.ts:448-466` | **B** | 4 | P1 |
| 7 | Essay Element Detection, 9 structural (CA-7) | `essayElementDetector.ts:1-881` | L2 paragraph roles (architectural, not element-typed) | `structuralCartographer.ts:80-106` | **C** | 7 | P1 |
| 8 | Performative Indicators 7 patterns (CA-8) | Unverified, likely in `commonAppWorkshop/services/` | None | — | **C** | 8 | P1 |
| 9 | Haiku Diagnosis Stage 0 prompts (CA-9) | `stage0Service.ts`, `haikuDiagnosisService.ts` | L1 first impressions | `firstImpressions.ts` | **B** | 3 | P2 |
| 10 | PIQ 13-Dim Rubric (PIQ-1) | `piq/rubric.ts:30-416` | L4 5-dim ScoreMatrix + L3.5 single-dim effectiveness | `crystallizer.ts:273-284`, `analysisPass.ts` | **B** | 7 | **P0** |
| 11 | PIQ 8 Prompt-Specific Weight Calibrations (PIQ-2) | `piq/weights/dimensionWeights.ts` | None | — | **C** | 9 | **P0** |
| 12 | PIQ 41-Pattern Issue Library (PIQ-3) | `piq/issuePatterns.ts:17-1201` | L3.5 improvementCandidate freeform emission | `analysisPass.ts:499-520` | **C** | 9 | **P0** |
| 13 | Manufactured Vulnerability phrases (PIQ-3) | `issuePatterns.ts:168-197` | L3.75 Mechanism Quality Standard gestures at concept | `holisticSynthesis.ts:447-455` | **B** | 5 | **P0** |
| 14 | Essay-Speak + AI-Pattern regex libraries (PIQ-3) | `issuePatterns.ts:541-665` | L1 banned words + inlineEditor BANNED_TERMS | `firstImpressions.ts:75`, `commandPrompts.ts:57-130` | **B** | 4 | P1 |
| 15 | PIQ Teaching Examples (20 of 80) (PIQ-4) | `piq/teachingExamples.ts` | L5 rewriteExample requirement but no corpus | `deepAnnotationService.ts:876-881` | **C** | 8 | P1 |
| 16 | PIQ Chat Coaching Guardrails (PIQ-5) | `piqWorkshop/piqChatService.ts:61-417` | V1 coachingService has its own architecture | `coaching/coachingService.ts` | **B** | 7 | **P0** |
| 17 | Word Economy Framework with math (PIQ-6) | `piqChatService.ts:169-200` | `coaching/lengthCalibrator.ts` exists | `coaching/lengthCalibrator.ts:1-162` | **B** | 5 | P1 |
| 18 | 3-Tier Quality Standards (PIQ-7) | `piqChatService.ts:240-261` | L3.5 tier classification (5-tier) | `analysisPass.ts:458-466` | **B** | 2 | P2 |
| 19 | PIQ Voice + Experience Fingerprint (PIQ-8) | `piqChatContext.ts:105-147` | L3.75 voiceMap + voiceIdentity | `holisticSynthesis.ts:289-363` | **B** | 4 | P1 |
| 20 | Narrative VoiceFingerprint analyzer (NW-1) | `voiceFingerprintAnalyzer.ts:1-100` | L3.75 voiceMap reinvents from scratch | `holisticSynthesis.ts:289-363`, `voiceProfile/voiceProfileService.ts` | **B** | 3 | P1 |
| 21 | ExperienceFingerprint — 6 vectors + 4 flags (NW-2) | `experienceFingerprintAnalyzer.ts:27-185` | L3.75 characterRevelation writerPortrait (prose only) | `holisticSynthesis.ts:524-535` | **C** | 8 | **P0** |
| 22 | SymptomDiagnoser 29-type taxonomy (NW-3) | `symptomDiagnoser.ts:29-177` | None — L3.5 freeform weaknesses | `analysisPass.ts:537-539` | **C** | 10 | **P0** |
| 23 | NW-3 missing_elements schema | `symptomDiagnoser.ts:148-162` | None | — | **C** | 9 | P1 |
| 24 | Workshop 3-Layer Teaching (NW-4) | `narrativeWorkshop/stage2-5/` | L5 teaching modes AWARENESS/CONSEQUENCE/CONNECTION/ACTION | `deepAnnotationService.ts:147-151` | **A** | 0 | — |
| 25 | Activity 5-Dim Scoring Rubric (AW-1) | `stage1ContextAwareAnalysisService.ts` | L4 5-dim ScoreMatrix has 4 general dims — NO role-ownership/action-precision/quantification | `crystallizer.ts:273-284` | **C** | 8 | P1 (activity-essay only) |
| 26 | Activity Authenticity Voice (AW-2) | `activityWorkshop/scoring/` | L3.75 voiceMap | `holisticSynthesis.ts` | **B** | 5 | P2 |
| 27 | Activity 7-Cat Feature Extraction (AW-3) | `activityWorkshop/` | None | — | **C** | 7 | P2 (activity only) |
| 28 | Activity Scoring Types (tier/leadership/commitment) (AW-4) | `activityWorkshop/types.ts` | None | — | **C** | 9 | P2 (activity only) |
| 29 | Activity 4-Stage Teaching (AW-5) | `stage0-3 services` | V1 analysis pipeline (L1-L6) | `analysisOrchestrator.ts` | **A** | 0 | — |
| 30 | Portfolio Stage 2 — 4-Tier Authenticity Rubric (PS2-1) | `authenticityVoiceAnalyzer.ts:82-250` | L3.75 archetypeContext.poolDensity (enum only, no tier depth) | `holisticSynthesis.ts:572-576` | **B** | 6 | **P0** |
| 31 | PS2 Institutional Weight Calibration (UCLA 30% / Berkeley 20%) | `authenticityVoiceAnalyzer.ts:82-97` | None | — | **C** | 9 | P1 |
| 32 | PS2 "10,000 applications test" + brutal calibration guards | `authenticityVoiceAnalyzer.ts:222-248` | L3.5 "10,000 essays today" framing (weaker) | `analysisPass.ts:362` | **B** | 6 | P1 |
| 33 | Academic Conversational Capability Types (AA-1) | `conversational/` | V1 unrelated (essay-only scope) | — | **C** | — | defer |
| 34 | Academic Identity Generation A+→F (AA-2) | `deepAcademicReport/` | V1 unrelated | — | **C** | — | defer |
| 35 | Academic Context Assembly (AA-3) | `deepAcademicReport/contextAssembly/` | V1 has analysisContextBuilder | `analysisContextBuilder.ts` | **A** | 0 | — |
| 36 | Academic Genuine Interest Detection (AA-4) | `conversational/` | V1 unrelated | — | **C** | — | defer |
| 37 | voiceProfile runtime (SU-1, SU-2) | `voiceProfile/*` | Type imported only; service NOT used | V1 imports type at `types.ts:21`; duplicate logic in `holisticSynthesis.ts:289-363`, `firstImpressions.ts`, `voiceMapMutator.ts` | **C** (runtime) | — | **P0 (IMPORT)** |
| 38 | aiRiskScorer runtime (SU-3) | `authenticity/aiRiskScorer.ts` | Not imported; L3.75 authenticVsPerformed | `holisticSynthesis.ts:294-300` | **C** (runtime) | — | **P0 (IMPORT)** |
| 39 | storyMining runtime (SU-4) | `storyMining/storyMiningService.ts` | Not imported | — | **C** (runtime) | — | P1 (IMPORT) |
| 40 | rag runtime (SU-5) | `rag/ragService.ts`, `embeddingService.ts` | Not imported in V1 analysis layers | — | **C** (runtime) | P1 (IMPORT) |
| 41 | InlineEditor 15 command prompts (SU-6) | `commandPrompts.ts:176-620` | InlineEditor uses them (consumer of V1) | `inlineEditor/inlineEditorService.ts` | **A** (downstream of V1) | 0 | — |
| 42 | InlineEditor BANNED_TERMS list (SU-6) | `commandPrompts.ts:57-130` | L1 46-word banned list | `firstImpressions.ts:75` | **B** | 3 | P1 |
| 43 | L3 Three-Level Depth framework | `sequentialDeepWalk.ts:186-225` | — | — | (V1-native) | — | — |
| 44 | L3 Novelty-Driven Growth | `sequentialDeepWalk.ts:236-242` | — | — | (V1-native) | — | — |
| 45 | L3 Observation Economy ("competent English teacher" test) | `sequentialDeepWalk.ts:243-267` | — | — | (V1-native) | — | — |
| 46 | L3 Back-Propagation | `sequentialDeepWalk.ts:269-280` | — | — | (V1-native) | — | — |
| 47 | L3.75 Mechanism Quality Standard | `holisticSynthesis.ts:447-455` | — | — | (V1-native) | — | — |
| 48 | L3.75 Intentionality Calibration by Essay Quality | `holisticSynthesis.ts:425-431` | — | — | (V1-native) | — | — |
| 49 | L3.75 "lunch with" Character Portrait framing | `holisticSynthesis.ts:524-529` | — | — | (V1-native) | — | — |
| 50 | L3.5 Anchored Score Examples (38/52/72/88/78) | `analysisPass.ts:367-383` | — | — | (V1-native) | — | — |
| 51 | L3.5 Anti-Clustering + 5-tier Inter-Essay Calibration | `analysisPass.ts:448-466` | — | — | (V1-native) | — | — |
| 52 | L3.5 Admissions Resonance / Revelation Density Weighting | `analysisPass.ts:411-414` | — | — | (V1-native) | — | — |
| 53 | L4 North Star as Emergent Property | `crystallizer.ts:205-208` | — | — | (V1-native) | — | — |
| 54 | L4 Through-Line as MEANING Transformation | `crystallizer.ts:212-217` | — | — | (V1-native) | — | — |
| 55 | L4 Distinctiveness-of-Execution framing | `crystallizer.ts:247-252` | — | — | (V1-native) | — | — |
| 56 | L5 Teaching Modes AWARENESS/CONSEQUENCE/CONNECTION/ACTION | `deepAnnotationService.ts:147-151` | — | — | (V1-native) | — | — |
| 57 | L5 Phase-Aware Zoom | `deepAnnotationService.ts:11` | — | — | (V1-native) | — | — |

Rows 43–57 are V1-native contributions (detailed in Section 7).

### Bucket A — Absorbed & Equivalent (V1 matches R&D depth)

- **Row 24** (Narrative Workshop 3-Layer Teaching) ≈ L5 teaching modes. V1's AWARENESS → CONSEQUENCE → CONNECTION → ACTION is a cleaner articulation of the same Diagnostic → Prescriptive → Application idea.
- **Row 29** (Activity 4-Stage Teaching Architecture) ≈ V1 analysis pipeline L1–L6. Same shape: fast triage → deep analysis → teaching → synthesis.
- **Row 35** (Academic Context Assembly) ≈ `analysisContextBuilder.ts`.
- **Row 41** (InlineEditor 15 commands) — consumed downstream of V1; V1 should not re-implement.
- V1-native rows (43-57) — V1 actually added capabilities that no R&D workshop had (novelty-driven growth with compound understanding, anchored score examples, mechanism quality standard, anti-clustering protocol, teaching modes).

### Bucket B — Absorbed but Thinner

*V1 gestures at the concept in prompts but lacks the calibration depth, phrase libraries, or impact-estimated fix strategies that R&D had shipped.*

- **Row 1** (6 Core Writing Principles) — V1 mentions "specificity" and "voice" but has no reader-effect framing and no misconceptions-to-avoid. **Fix: inject `writingPrinciples.ts` rendered content into L3.5 and L5 system prompts.**
- **Row 2** (500+ cliché library) — V1 has 46+40 = ~86 banned phrases; R&D has 500+ organized into 15 categories with admissions-psychology rationale. **Fix: L1 banned list + L3.5 improvementCandidate trigger lists + L3.75 MECHANISM QUALITY expansion.**
- **Row 4** (14-type weight matrix) — V1 has 3 scales; R&D has 14 types with per-dimension weights. **Fix: extend L3.75 + L4 with `essayType → typeWeights` module.**
- **Row 5** (13-college institutional tailoring) — V1 `collegeOverlay` is a stub.
- **Row 6** (Anti-Bias Calibration) — V1 anti-clustering protocol addresses a subset but not biased-by-topic or biased-by-name-drop issues.
- **Row 10** (PIQ 13-Dim Rubric) — V1 has 5-dim ScoreMatrix. V1's `effectiveness` dim conflates vulnerability_authenticity + voice_integrity + narrative_arc_stakes + reflection_insight + all others.
- **Row 13** (Manufactured Vulnerability phrases) — V1 Mechanism Quality Standard gestures toward the concept ("fingers danced … DOES NOT COUNT") but has 3 examples vs R&D's ~20 regex-detectable trigger phrases with fix strategies.
- **Row 14** (Essay-Speak + AI-Pattern libraries) — V1 has partial overlap (46 + 40 words); R&D has regex-detectable libraries with per-pattern whyMattersTemplates.
- **Row 16** (PIQ Coaching Guardrails) — V1 coachingService is rich architecturally but lacks the good/bad sensory pairs, Quality Anchor Protection, 5-step structure, UC Values hierarchy.
- **Row 17** (Word Economy Framework) — V1 `lengthCalibrator.ts` exists; compare against R&D's explicit math-showing requirement.
- **Row 18** (3-Tier Quality Standards) — V1 has 5-tier ≥ R&D 3-tier. Equivalent or better.
- **Row 19** (PIQ Voice + Experience Fingerprint) — V1 L3.75 voiceMap > PIQ voice (deeper 5-dim breakdown). But V1 has no equivalent of Experience Fingerprint's 6 uniqueness vectors.
- **Row 20** (Voice Fingerprint analyzer) — V1 reinvents without the "AVOID generic labels like 'Formal'" forcing function or the sampleSentences-for-style-transfer output.
- **Row 26** (Activity Authenticity Voice) — V1 voiceMap handles general case.
- **Row 30** (PS2 4-Tier Authenticity Rubric) — V1 archetypeContext.poolDensity is a 5-value enum (`saturated|common|moderate|uncommon|rare`) but has no tier descriptions, percentile estimates, or NQI mapping.
- **Row 32** (PS2 brutal calibration guards) — V1 has "10,000 essays today" (analysisPass:362) but not "Red Flags for Grade Inflation" DONT's or the 5 reality anchors.
- **Row 42** (InlineEditor BANNED_TERMS) — subset of cliché library.

### Bucket C — Not Absorbed

*V1 has no surface for this capability; it's either missing entirely or present only as freeform prose fields the model fills ad hoc.*

- **Row 3** (28 Issue Detection Patterns w/ IDs) — V1's L3.5 emits freeform `weaknesses[]`. No pattern IDs, no cross-analysis-call aggregation by pattern ID, no "this essay has 3 instances of SWAP_TEST_FAIL" visibility. **Fix: add patternId field + per-pattern detection hints to L3.5.**
- **Row 7** (9 Essay Elements) — V1 has paragraph-level architectural roles, not element-level.
- **Row 8** (7 Performative Indicators) — not present.
- **Row 11** (PIQ 8 Prompt-Specific Weights) — not present. V1 cannot say "this is a Challenge PIQ so vulnerability_authenticity gets 15% weight."
- **Row 12** (PIQ 41-Pattern Library) — biggest gap. V1 has no issue-pattern taxonomy whatsoever.
- **Row 15** (PIQ Teaching Examples corpus) — V1 demands rewriteExample for ACTION mode but has no library to ground the demonstrations.
- **Row 21** (ExperienceFingerprint) — V1 characterRevelation.writerPortrait is prose; no `mustInclude/mustAvoid/uniqueAngle/authenticTension/qualityAnchors` structured output that downstream layers can consume.
- **Row 22** (SymptomDiagnoser 29-type taxonomy) — **single biggest unabsorbed asset.** V1 has no enumeration of opening failure modes (9 types) or ending failure modes (14 types), each with admissions-research-grounded "WHY IT FAILS". Port is highest-impact.
- **Row 23** (missing_elements schema — sensory_details/concrete_objects/micro_moment/emotional_truth) — useful structured feedback schema; V1 L3.5 has none.
- **Row 25, 27, 28** (Activity workshop 5-Dim Rubric + features + scoring types) — defer unless essay-type is activity.
- **Row 31** (Institutional weight calibration UCLA 30% / Berkeley 20%) — V1 has no essay→institution weighting.
- **Rows 37-40** (Shared runtime services not imported).

---

## Section 5 — Runtime Infrastructure Consumption Audit

| Utility | L1 | L2 | L2.5 | L3 | L3.75 | L3.5 | L4 | L5 | L6 | DeepDive | ProfileMgr |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `voiceProfile/voiceProfileService` | ❌ | ➖ | ➖ | ❌ | ❌ | ❌ | ➖ | ❌ | ❌ | ❌ | ❌ |
| `voiceProfile/styleConsistencyService` | ➖ | ➖ | ❌ | ❌ | ❌ | ➖ | ➖ | ❌ | ➖ | ➖ | ❌ |
| `authenticity/aiRiskScorer` | ❌ (dup: banned-word list) | ➖ | ➖ | ➖ | ❌ (dup: authenticVsPerformed) | ➖ | ➖ | ➖ | ❌ | ➖ | ❌ |
| `storyMining/storyMiningService` | ➖ | ➖ | ❌ (dup: repeatedElements detection) | ❌ (dup: significantChoices) | ❌ (dup: momentEarnednessMap) | ➖ | ➖ | ➖ | ❌ | ❌ | ❌ |
| `rag/ragService` | ➖ | ➖ | ➖ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ➖ |
| `rag/embeddingService` | ➖ | ➖ | ➖ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ➖ |
| `rag/ragSeeder` | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |
| `lib/llm/claude` (callClaudeWithRetry, calculateCost) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ➖ |
| `lib/llm/unified` | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |
| `inlineEditor/commandPrompts` | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |

*Legend: ✅ imports; ⚠️ partial import; ❌ silently bypasses (duplicate logic present); ➖ N/A for this layer's purpose.*

### Duplicate-logic evidence

- **voice analysis duplicated**: `essayIntelligence/types.ts:21` imports `StudentVoiceProfile` type ONLY; no service call. 251 voice-related occurrences across 27 V1 files (e.g., `profileManager/mutators/voiceMapMutator.ts:27 occurrences`; `holisticSynthesis.ts:33 occurrences`; `analysisPass.ts:15 occurrences`).
- **AI-risk scoring duplicated**: L1 banned-word list `firstImpressions.ts:75` (46 words) partially duplicates `aiRiskScorer.ts`'s logic. L3.75 `authenticVsPerformed` (`holisticSynthesis.ts:294-300`) performs unrelated but overlapping assessment.
- **Story extraction duplicated**: L3 `significantChoices` (`sequentialDeepWalk.ts:351-357`), L3.75 `momentEarnednessMap` (`holisticSynthesis.ts:392-410`), L2.5 `repeatedElements` (`scoutPass.ts:88-99`) each extract story/moment fragments independently.
- **RAG integration absent from V1**: `ragService.ts:1-509` is only consumed by `inlineEditor`, `enhancedWorkshop`, `commonAppWorkshop/batchGenerationService`, and `http/enhancedWorkshopRoutes`. V1's analysis and coaching layers send zero queries to RAG despite having clear use cases (exemplar lookup for L5 rewriteExamples; pattern lookup for L3.5 improvementCandidate suggestions).

---

## Section 6 — Ported-Forward Plan (actionable Wave 1 backlog)

### Wave 1 P0 Ports (ship-blockers for $500/hr quality)

#### Port 1 — PIQ 41-Pattern Issue Library → L3.5 improvementCandidate emission
- **Target files**: `src/services/essayIntelligence/analysis/analysisPass.ts:499-520` (improvementCandidate section) + new `src/services/essayIntelligence/coaching/issuePatternLibrary.ts`.
- **Port shape**: new module that re-exports PIQ's 41 patterns (+ Common App's 28) keyed by dimension. L3.5 prompt gains a "KNOWN PATTERNS" section that lists triggers, templates, and impact estimates. L3.5 output schema adds `improvementCandidate.patternId: string | null`.
- **Size**: 3–5 days (integration + prompt edits + test against existing essays).
- **Dependencies**: none.

#### Port 2 — SymptomDiagnoser 29-type Taxonomy → L3.5 + L5
- **Target files**: `analysisPass.ts:537-539` (weaknesses field) + `deepAnnotationService.ts:807-952` (teaching-mode prompt).
- **Port shape**: introduce `weaknesses[].symptomType: SymptomType | null` field; L3.5 prompt gains the full 29-type enumeration + per-type WHY IT FAILS rationale; L5 prompt gains role-typed branches ("if paragraph role is opening, check these 9 opening archetypes").
- **Size**: 5–7 days.
- **Dependencies**: Port 1 landed (patternId conventions).

#### Port 3 — 500+ phrase Cliché Reference Library → L1 + L3.5 + L3.75
- **Target files**: `firstImpressions.ts:75` (expand banned-word list); `analysisPass.ts:367-383` (add cliché detection to anchored examples); `holisticSynthesis.ts:447-455` (extend Mechanism Quality Standard with category-specific gap examples).
- **Port shape**: extract `commonAppWorkshop/services/semanticClicheAnalyzer.ts` CLICHE_REFERENCE into a shared `essayIntelligence/taxonomies/clicheLibrary.ts` module. Each layer renders the relevant subset into its prompt.
- **Size**: 3–4 days.
- **Dependencies**: none.

#### Port 4 — PIQ 13-Dim Rubric + 8 Prompt-Specific Weights → L3.5 + L4 when essayType === PIQ
- **Target files**: `analysisPass.ts` (sentence-level effectiveness upgraded to 13 dims when PIQ); `crystallizer.ts:273-284` (ScoreMatrix adds PIQ-specific dimensions).
- **Port shape**: new `essayIntelligence/rubrics/piqRubric.ts` re-exporting PIQ_RUBRIC_DIMENSIONS + baseline/prompt-specific weights. L3.5 prompt gains "PIQ_MODE: if essayType is PIQ_1-PIQ_8, use these 13 dimensions with these weights". Analysis output schema per-sentence gains optional `piqDimensions?: Record<PIQRubricDimension, number>`.
- **Size**: 1 week.
- **Dependencies**: none.

#### Port 5 — 14-type Common App Weight Matrix + Success Principles → L3.75 + L4
- **Target files**: `holisticSynthesis.ts` Phase B prompt (add type-specific success-principles block); `crystallizer.ts:160-170` (extend ACTIVE_DIMENSIONS to include essayType gating).
- **Port shape**: new `essayIntelligence/rubrics/commonAppRubrics.ts`. Inject `TYPE_SPECIFIC_PRINCIPLES[essayType]` into L3.75 Phase B and `TYPE_WEIGHTS[essayType]` into L4 crystallizer.
- **Size**: 1 week.
- **Dependencies**: Port 4 (same rubric-injection pattern).

#### Port 6 — ExperienceFingerprint 6 vectors + 4 flags → L3.75 Phase B characterRevelation extension
- **Target files**: `holisticSynthesis.ts:524-535` (characterRevelation block).
- **Port shape**: extend characterRevelation schema with:
  ```
  uniquenessVectors: {
    unusualCircumstance: { description, whyItMatters, specificDetail } | null,
    unexpectedEmotion: { emotion, trigger, counterExpectation } | null,
    contraryInsight: { insight, againstWhat, whyAuthentic } | null,
    specificSensoryAnchor: { sensory, context, emotionalWeight } | null,
    uniqueRelationship: { person, dynamic, unexpectedAspect } | null,
    culturalSpecificity: { element, connection, universalBridge } | null
  },
  antiPatternFlags: { followsTypicalArc, hasGenericInsight, hasManufacturedBeat, hasCrowdPleaser, warnings },
  divergenceRequirements: { mustInclude, mustAvoid, uniqueAngle, authenticTension },
  qualityAnchors: [{ sentence, whyItWorks, preservationPriority }]
  ```
  L4 `distinctivenessSignature.nonInterchangeableFactors` now reads from `divergenceRequirements.uniqueAngle`. L6 coaching reads `qualityAnchors` for Quality Anchor Protection.
- **Size**: 1–2 weeks (schema change + prompt + mutator + router update).
- **Dependencies**: none; this is additive.

#### Port 7 — PIQ Coaching Guardrails → L6 coachingService + `coaching/promptBlocks.ts`
- **Target files**: `coaching/promptBlocks.ts` (add 4 new blocks: GOOD_BAD_SENSORY_PAIRS, VOICE_FINGERPRINT_PRESERVATION, QUALITY_ANCHOR_PROTECTION, FIVE_STEP_COACHING_STRUCTURE, UC_VALUES).
- **Port shape**: each block is a verbatim port of the R&D content, cached into the prompt-caching tier.
- **Size**: 2–3 days.
- **Dependencies**: none.

#### Port 8 — PS2 4-Tier Authenticity Rubric + Institutional Weights → L3.75 archetypeContext + L3.5 tier classification
- **Target files**: `holisticSynthesis.ts:572-576` (archetypeContext) + `analysisPass.ts:458-466` (inter-essay calibration).
- **Port shape**: extend archetypeContext with `authenticityTier: 'distinctive'|'authentic'|'emerging'|'manufactured'`, `narrativeQualityIndex: 0-100`, `institutionalWeightSignal: 'ucla_pii_critical'|'berkeley_pii_valued'|'general'`. Inject PS2 "brutal calibration guards" + "10,000 applications test" into L3.5 calibrationReflection prompt.
- **Size**: 3–5 days.
- **Dependencies**: none.

#### Port 9 — IMPORT voiceProfile/voiceProfileService into L3.75
- **Target files**: `holisticSynthesis.ts:242-472` (Phase A preamble).
- **Port shape**: before L3.75 Phase A call, resolve the student's prior `StudentVoiceProfile` if it exists. Inject it into the Phase A prompt as "ESTABLISHED VOICE PROFILE". After L3.75 completes, persist the derived voiceIdentity/voiceMap back via `voiceProfileService.updateProfile(userId, essayId, ...)`. Unifies voice data across inlineEditor + analysis.
- **Size**: 3–5 days + migration of existing profile data.
- **Dependencies**: none; voiceProfileService already exists.

#### Port 10 — IMPORT authenticity/aiRiskScorer into L1 + L3.75
- **Target files**: L1 post-processing of each paragraph's output; L3.75 Phase A authenticVsPerformed.
- **Port shape**: run aiRiskScorer over the essay text; inject the risk signal into L3.75 voiceIdentity.authenticVsPerformed as calibration ("aiRiskScore=0.73 → this essay shows elevated AI-phrasing density; evaluate authenticVsPerformed with this prior").
- **Size**: 2–3 days.
- **Dependencies**: none.

### Wave 2 P1 Ports

- **Port 11**: Common App 13-college institutional tailoring → `coaching/collegeOverlay.ts`.
- **Port 12**: Writing Principles reader-effect framing → L3.5 + L5 prompt preambles.
- **Port 13**: Essay Element Detection 9 types → new L2.7 layer or L2 output field.
- **Port 14**: Word Economy Framework with math → `coaching/lengthCalibrator.ts` enhancement.
- **Port 15**: IMPORT storyMining into L3.75 momentEarnednessMap + L3 significantChoices.
- **Port 16**: IMPORT rag into L5 rewriteExample emission (retrieve exemplar rewrites by symptomType).

### Wave 3 P2 Ports (polish)

- **Port 17**: Activity 5-Dim scoring for activity-essay branch.
- **Port 18**: Teaching Examples corpus (complete remaining 60 PIQ examples + equivalent Common App corpus).
- **Port 19**: NW-1 Voice Fingerprint "sampleSentences" output for style-transfer in inlineEditor.

---

## Section 7 — What V1 Did Better Than R&D

V1's architecture is genuinely superior to R&D in several places. These wins must not be erased during porting.

1. **Separation of understanding / analysis / feedback passes**. R&D workshops commingled description, judgment, and prescription in single prompts (see PIQ's `rubric.ts` + `issuePatterns.ts` co-driving a single scoring call). V1 enforces L3 UNDERSTANDING-ONLY, L3.5 ANALYSIS-ONLY, L5 FEEDBACK-ONLY — three separate API calls, three separate system prompts, three separate FORBIDDEN VOCABULARY lists. Structural anti-contamination that R&D's prompts try to achieve through self-policing, V1 achieves through architecture.

2. **Novelty-Driven Growth (L3, `sequentialDeepWalk.ts:236-242`)**. R&D analyzers produce uniform-depth output per paragraph. V1 L3's "What does THIS paragraph reveal that wasn't already understood?" enforces a natural novelty curve — P1 rich, P5 focused. This means later paragraphs aren't forced to fabricate insights; thinness in P5 is a signal that P1-P4 were thoroughly understood.

3. **Observation Economy — "Would a competent English teacher already know this?" test (`sequentialDeepWalk.ts:244-247`)**. R&D had no explicit filter against trivial observations. V1's test is a cognitive forcing function that prevents padding.

4. **Mechanism Quality Standard (L3.75, `holisticSynthesis.ts:447-455`)**. R&D prompts talk about "sensory grounding" as a goal but do not distinguish stock-phrasing-that-contains-sensory-words (doesn't count) from genuine-sensory-experience (counts). V1's "'fingers danced across the piano keys' — dead metaphor, DOES NOT COUNT" is a calibration insight R&D never formalized.

5. **Intentionality Calibration by Essay Quality (L3.75, `holisticSynthesis.ts:425-431`)**. R&D prompts implicitly treated voice shifts as intentional when describing strong essays. V1 explicitly requires: "A 17-year-old writing a mediocre essay is not enacting an epistemological argument. Default to 'ambiguous'." This prevents Sonnet's tendency to over-interpret novice drift as craft.

6. **Anchored Score Examples (L3.5, `analysisPass.ts:367-383`)**. The 5 concrete examples (38/52/72/88/78) with full rationale are calibration prior-seeds more specific than any of R&D's rubric text. SCORE 78's admissions-resonance carve-out ("'That semester my GPA dropped from a 3.8 to a 2.4, and I told no one.' — plain craft but high revelation density compensates") articulates a scoring principle R&D had implicitly but never anchored.

7. **Anti-Clustering Protocol + Compression Check (L3.5, `analysisPass.ts:448-466`)**. Forced 20-point cross-paragraph range + 5-tier inter-essay calibration table + "if most scores fall in 55-75 regardless of essay quality, you are COMPRESSING" is the cleanest anti-compression guard in the codebase.

8. **North Star as Emergent Property (L4, `crystallizer.ts:205-208`)**. "NOT a summary. A summary is lossy compression. The North Star is an EMERGENT PROPERTY — an interpretive synthesis that transcends any individual profile section. Think of a conductor studying a symphony score." R&D crystallization stages tended to produce summaries; V1's conductor metaphor is a better mental model.

9. **Through-Line as MEANING Transformation, not Physical Appearance (L4, `crystallizer.ts:212-217`)**. "The connection graph already tracks WHERE things appear. The through-line traces HOW MEANING CHANGES." This separation — appearances in connectionGraph, meaning transformation in throughLineMap — is cleaner than R&D, which collapsed both.

10. **Teaching Modes AWARENESS → CONSEQUENCE → CONNECTION → ACTION with cognitive-flow ordering (L5, `deepAnnotationService.ts:147-151`)**. R&D workshops defaulted to prescriptive action. V1's articulation that awareness/consequence build deeper learning than instructions, plus the fail-fast requirement that ACTION mode requires a rewriteExample, is genuinely pedagogical.

11. **Phase-Aware Zoom (L5, `deepAnnotationService.ts:11`)**. Foundation → Architecture → Craft → Polish → Distinction phase progression means feedback zooms to the current phase. R&D workshops gave all feedback simultaneously.

12. **Supersession Rarity Default (L3, `sequentialDeepWalk.ts:307-309`)**. "SUPERSESSION IS RARE. Prefer 'deepened' or 'confirmed' over 'superseded'. A finding should only be superseded when its claim is WRONG — not when a later paragraph adds nuance." R&D had no finding-lifecycle model; V1's finding maturity ladder (hypothesis → developing → confirmed → deepened → superseded) handles knowledge accumulation cleanly.

**Do not port R&D content in ways that break these V1 wins.** Specifically: never let a ported cognitive asset re-introduce evaluative language into L1/L3/L3.75; never let a ported rubric re-collapse understanding + evaluation; never let a ported teaching library default to ACTION mode.

---

## Section 8 — Risks & Non-Obvious Findings

### Risk 1 — R&D assets whose depth depends on context V1 can't reproduce

- **Common App 14-type + 13-college combinatorics**. The R&D system had 14 essay types × 13 colleges = 182 specialized contexts, each with hand-written calibration. V1's single analysis pipeline cannot literally replicate this. Port the dimensional weights (14-type matrix) and principles, but treat per-college institutional tailoring as a coaching-layer overlay, not a scoring-layer branch.
- **PIQ 8 prompt-specific weights**. Only applicable when essayType is one of UC PIQ 1-8. Port as a conditional rubric override keyed on `essayType && isUCPIQ`.
- **Activity workshop scoring**. Description scoring (25/25/20/15/15) is specifically for activity-list entries, not narrative essays. Do not port into L3.5 general sentence scoring.

### Risk 2 — R&D prompts with known failure modes V1 should explicitly avoid inheriting

- **Over-specific detail fabrication from inlineEditor**. `commandPrompts.ts:195-197` already documents the ANTI-FABRICATION guard with `[brackets]` convention. When porting R&D prompts (especially PIQ issuePatterns' `estimatedImpact: +2-3 points`), inherit this guard — do NOT let L3.5 claim "adding dialogue here will raise effectiveness by 8 points" without calibration.
- **R&D "resume rehash" heuristic double-counts with admissions resonance**. PS2 flags "Resume rehash in places" as Tier 3 (`authenticityVoiceAnalyzer.ts:175`) while L3.5's admissions resonance (`analysisPass.ts:382`) rewards GPA-drop specificity. Porting the resume-rehash signal into V1 must not downweight the very specificity that admissions-resonance upweights. Reconcile by restricting the resume-rehash flag to dimension=authenticity, not dimension=specificity.
- **narrativeWorkshop opening-cliché library conflates "Ever since I was young" (P1-specific) with "Ever since I was young" appearing mid-essay (legitimate backstory)**. Port with position-awareness: `dictionary_definition_opening` should only fire at paragraphRole='opening'.

### Risk 3 — Places V1 deliberately diverged from R&D and was right to do so

- **V1 does NOT have a `resume_rehash` flag at sentence level**. It routes this through `admissionsPositioning.redFlags` at the essay level, where it belongs. R&D PS2 put it at the dimension level, which produced false positives on honest specificity.
- **V1 does NOT have a `customCheck: 'check_passive_voice_ratio'` regex path**. R&D PIQ has `'voice-passive'` (`issuePatterns.ts:573-601`) with regex + ratio threshold. V1 wisely delegates passive-voice assessment to Sonnet's qualitative voice analysis — R&D's regex path has known false positives in dialogue and historical-present narration.
- **V1's FORBIDDEN VOCABULARY enforcement is structural (FORBIDDEN list + FINAL CHECK self-audit) rather than post-hoc validation**. R&D's equivalent relied on reviewer-side flags. V1's is cheaper and catches more cases at generation time.
- **V1 does NOT inherit Common App's `writingPrinciples.ts` at full verbose length**. This is actually a correctness choice: injecting 1172 lines of principles into every L3.5 call would exceed cache-friendly prompt sizes. Port the principles as a RAG-retrieved subset per-dimension rather than inline.

### Non-obvious finding 1 — V1's banned-word list at L1 and inlineEditor's BANNED_TERMS have only ~15% overlap.
- L1 `firstImpressions.ts:75` lists 46 evaluative *adjectives* (effective, strong, weak, compelling…).
- inlineEditor `commandPrompts.ts:57-130` lists 40 *cliché phrases* (delve into, tapestry, sparked my passion…).
- These are complementary not redundant — one polices evaluation-contamination, the other polices essay-content-cliché. When porting the PIQ 41-pattern library, do NOT merge these lists; maintain the split.

### Non-obvious finding 2 — V1's `voiceMap.intentionality` schema already implements what Voice Drift detection in `voiceProfile/voiceDriftTypes.ts` provides, but without persistence.
V1 computes voice shifts per-essay but never persists them; voiceProfileService persists them per-student. This means a student's voice evolution across essays is invisible to V1 analysis. Porting `voiceProfileService` import (Port 9) unlocks cross-essay learning.

### Non-obvious finding 3 — inlineEditor IS V1's single best-integrated consumer.
It demonstrates the target architecture: command prompt + voice profile + RAG context → rich Haiku/Sonnet call. Every L5 rewriteExample should follow this exact shape. The fact that inlineEditor routes to Sonnet for `deepen_vulnerability` and `connect_to_theme` but Haiku for the other 13 commands is also a calibration insight V1's L5 should adopt (not every annotation rewrite needs Sonnet).

### Non-obvious finding 4 — V1 has no archetype library for pool-density calibration.
L3.75's `archetypeContext.archetype` field is prose ("sports injury comeback", "immigrant identity through food") and `poolDensity` is a 5-value enum (`saturated | common | moderate | uncommon | rare`). But V1 has no enumerated archetype library saying "here are the 30 archetypes that score 'saturated' in a typical 500-application pool." Without this library, Sonnet's poolDensity is a guess. Common App's `common_topics` (`semanticClicheAnalyzer.ts:179-189`) has the starting seed for this library. **This is a sneaky-high-value port** — combining CA-2 common_topics + CA-3 SWAP_TEST_FAIL + PS2 "10,000 applications test" creates a calibration anchor for poolDensity assignment that V1 currently lacks.

### Non-obvious finding 5 — The biggest R&D assets V1 unaware-of-existing are stored in `rubrics/` directories V1's imports never reach.
`grep "from.*rubrics"` inside `src/services/essayIntelligence/` returns 0 results. The reason V1 is thin on taxonomy is partly mechanical — V1 never imports from any `rubrics/` folder. Adding imports from `piq/rubric.ts`, `piq/issuePatterns.ts`, `commonAppWorkshop/rubrics/writingPrinciples.ts`, `commonAppWorkshop/rubrics/issueDetectionPatterns.ts` is the path of least resistance to 80% of the P0 ports above.

---

*End of audit.*
