# FORGE_DEBATES.md — Compressed Record: Agent Designs, Verification, Synthesis

**Date**: 2026-03-18
**Pipeline**: Analyst -> Agent A (Direct) + Agent B (Rethink) -> Reality Checker (this doc)
**Scope**: 13 gaps in Essay Intelligence + Activity Workshop + PIQ systems

---

## GAP-1: Response Intensity (Coaching Length Control)

### Agent A Design
Use PREVIOUS turn's sidecar `responseIntensity` to set current turn's `maxTokens`. Add `lastResponseIntensity` to `CoachingSessionMemory`. Dynamic: full=2200, brief=1200, minimal=600.

### Agent B Design
Pre-Sonnet keyword heuristics (`estimateResponseIntensity()`) -- detect confirmations, short messages, prior-turn length. Dynamic: full=2200, brief=800, minimal=300.

### Verification Findings
- **V1.1**: The sidecar already outputs `responseIntensity` (line 310, coachingService.ts: `responseIntensity: 'full' | 'brief' | 'minimal'`). Agent A's claim is correct.
- **V1.2**: Stage 1.5 (`runStage1_5CognitiveAssessment`, line 2357) already produces a `responseIntensity` field (line 2393: `"responseIntensity": "<full|brief|minimal>"`). This is a SEPARATE signal from the sidecar -- Stage 1.5 is a Haiku call that runs BEFORE Stage 3.
- **V1.3**: `maxTokens` is currently hardcoded at 2200 (line 1487). Both agents correctly identify this.
- **V1.4**: Agent B's keyword heuristics violate the LLM-first principle from `feedback_llm-first-design.md`. Stage 1.5 already does this via LLM.
- **V1.5**: `CoachingSessionMemory` (line 2108) has no `lastResponseIntensity` field. Agent A's addition is feasible.

### Decision: HYBRID (A's wiring + Stage 1.5 signal)
Agent A's approach of using the PREVIOUS sidecar to inform the NEXT turn is sound, but Stage 1.5 already produces a responseIntensity. Use Stage 1.5's intensity (already LLM-assessed, already runs before Stage 3) as the PRIMARY signal for maxTokens. Store the PREVIOUS turn's sidecar intensity in session memory as a consistency check. No keyword heuristics needed.

---

## GAP-2: Learning Style Accumulation

### Agent A Design
Add `learningStyleUpdate` field to sidecar schema. Push into `style.observations` when non-null. Zero new LLM calls.

### Agent B Design
Derive from sidecar cognitive states and session events every 3 turns. Analyze confusion->breakthrough cycles, depth vs breadth preference. Cap at 8 observations.

### Verification Findings
- **V2.1**: `learningStyleUpdate` already exists in the pattern detection Haiku call (line 2202, 2231). It's a field on the pattern detection output, NOT on the sidecar.
- **V2.2**: The sidecar (line 305-315) does NOT currently have `learningStyleUpdate`. Agent A proposes adding it there, which is redundant with the existing pattern detection field.
- **V2.3**: `LearningStyleObservations` (line 2154) has a cap-less `observations` array. Agent B's cap at 8 is sensible.
- **V2.4**: The existing pattern detection already runs every 3+ turns (line 67-68: `PATTERN_DETECTION_MIN_TURNS = 3`). It already produces `learningStyleUpdate`.

### Decision: REFINED (fix the existing wiring)
Neither agent realized the `learningStyleUpdate` already exists in pattern detection. The real gap is that pattern detection only runs every 3+ turns. Solution: add `learningStyleUpdate` to the sidecar (as Agent A proposes) for turn-by-turn accumulation. Cap observations at 8 with oldest-tentative eviction (Agent B's insight). This is NOT a new feature -- it's completing an existing one.

---

## GAP-3: Phase Detector (Narrative Essay Calibration)

### Agent A Design
Add narrative strategy context to `buildHolisticDigest()`. Add ~150 tokens of narrative arc detection (chronological, reflective, montage, bracket, lyrical) and flag that thesis may be implicit.

### Agent B Design
Remove thesis confidence as primary signal for narrative essays. Detect narrative strategy from profile, reframe thesis as "emergent theme."

### Verification Findings
- **V3.1**: `buildHolisticDigest()` (line 192-267) already includes `thematicArchitecture.thesisConfidence` (line 198-200) and `narrativeStrategy.arcMomentum` (line 217). It does NOT include `narrativeStrategy.arcType` (line 808) or `narrativeStrategy.primaryStrategy` (line 795).
- **V3.2**: `NarrativeStrategy.arcType` is a free string field (line 808: `arcType: string`). It already captures the narrative arc type. The data EXISTS in the profile; `buildHolisticDigest()` just doesn't surface it.
- **V3.3**: The phase system prompt (line 88-147) mentions "thesis is unclear or absent" in foundation phase definition but has no narrative-aware calibration. Agent B's concern is valid.

### Decision: HYBRID (A's data surfacing + B's reframe)
Surface `narrativeStrategy.arcType` and `primaryStrategy` in `buildHolisticDigest()` (Agent A's approach -- the data is already there). Add a narrative calibration note to the phase system prompt: "For narrative essays, 'thesis' manifests as an emergent theme or revelation. A narrative essay at Architecture phase may have a powerful through-line but no stated thesis -- this is by design, not a weakness" (Agent B's insight). ~80 extra tokens in the system prompt.

---

## GAP-4: AO First Read Simulation

### Agent A Design
NEW Haiku call (~$0.003) parallel with L1. Produces AOFirstRead: hookMoment, committeeOneLiner, distinctivenessSignal, putDownRisk, gutReaction. New file `aoFirstRead.ts`.

### Agent B Design
NO new call. Add `aoGutReaction` field to existing L3.75 Phase B output. "YOU ARE THE AO. It's 4pm. You've read 29 essays today." ~50 extra output tokens.

### Verification Findings
- **V4.1**: L3.75 (holisticSynthesis.ts) already produces `admissionsPositioning` (line 515-523) with `tellabilitySummary`, `distinctivenessFactors`, `redFlags`, `memorability`, `portfolioPosition`, `aoTakeaway`. These overlap significantly with Agent A's proposed fields.
- **V4.2**: L3.75 is Phase A + Phase B, called AFTER the full walk. Adding an AO gut reaction HERE means it benefits from complete understanding -- but it's NOT a "first read" simulation anymore. The AO first read is valuable BECAUSE it captures the naive reaction.
- **V4.3**: L1 (firstImpressions) is Haiku and runs first. A parallel Haiku call would add ~1-2 seconds but $0.003. The question is whether a naive AO read provides signal that the deep L3.75 admissions analysis cannot replicate.
- **V4.4**: The unique value of an AO first read is the "4pm, 29th essay" framing -- attention fatigue, gut reaction. L3.75 sees the essay with deep understanding and cannot simulate NOT knowing what it already knows. This is a genuine distinct signal.

### Decision: AGENT A (new Haiku call, parallel with L1)
The AO first read provides a signal that L3.75 fundamentally cannot -- the naive gut reaction under attention fatigue. L3.75's `admissionsPositioning` is deep and complete but lacks the raw "would I keep reading after paragraph 1?" signal. A Haiku call parallel with L1 adds negligible cost ($0.003) and zero latency (parallel). The new file is justified.

---

## GAP-5: Person Portrait (Human Behind the Essay)

### Agent A Design
Modify L3.75 `writerPortrait` prompt with BAD/GOOD examples. "Not as a writer, as a human being." ~80 extra tokens.

### Agent B Design
Reframe prompt question: "who would you want to have lunch with after reading this?" with WRONG/RIGHT examples. Same zero-cost approach, different framing.

### Verification Findings
- **V5.1**: `writerPortrait` prompt (line 487): `"<who is this writer -- the person behind the words, not the essay>"`. The prompt already distinguishes person from essay. Both agents' improvements are refinements.
- **V5.2**: The existing prompt produces serviceable but generic portraits. The issue is quality of output, not missing infrastructure.
- **V5.3**: Agent B's "lunch" framing is more vivid and likely to produce better LLM output than Agent A's abstract "as a human being" directive.

### Decision: AGENT B (lunch framing)
Agent B's "who would you want to have lunch with?" framing is more concrete and will generate more distinctive portraits. Add WRONG/RIGHT examples per Agent A's suggestion but use Agent B's prompt question.

---

## GAP-6: Strategic Thread (Persistent Coaching Direction)

### Agent A Design
Add `strategicPriority` to `CoachingSessionMemory`. Computed from `focusAreas[0]` at turn 2. Inject as persistent directive. Track `studentAcknowledged` and resolution.

### Agent B Design
Replace `nextFocus` (topic) with `strategicQuestion` (curiosity). "Does the student hear the voice shift between P2 and P3?" Natural infiltration into responses. Add `questionStaleness` counter for gentle escalation at 4+ turns.

### Verification Findings
- **V6.1**: `CoachingSessionMemory` already has `nextFocus` (line 2146): "What the session should focus on next -- LLM-assessed after each turn." Agent B proposes replacing this; Agent A adds a parallel field.
- **V6.2**: `nextFocus` is already injected into the session arc section (line 1444, 1450): `SUGGESTED NEXT FOCUS: ${sessionMemory.nextFocus}`. It's a label ("voice consistency"), not a question.
- **V6.3**: Agent B's observation is sharp: a topic label ("voice") is less generative than a question ("Does the student hear the voice shift between P2 and P3?"). Questions naturally infiltrate responses better than directives.
- **V6.4**: Agent A's `studentAcknowledged` tracking adds complexity for moderate value. Agent B's staleness counter is simpler and equally effective.

### Decision: AGENT B (strategic question + staleness)
Replace `nextFocus` string with `strategicQuestion` string. The question framing is more generative and natural for the LLM to work with. Add a `questionStaleness` counter (incremented each turn the question remains unchanged, reset when updated). At 4+ staleness, the pattern detection prompt includes a gentle escalation note. No separate `studentAcknowledged` tracking needed -- if the student engages the question, pattern detection will naturally update it.

---

## GAP-7: Emotional Cues (Activity Workshop)

### Agent A Design
Change "DON'T ASK ABOUT" to "DON'T INITIATE QUESTIONS ABOUT" + add "WHEN STUDENT VOLUNTEERS EMOTIONAL CONTEXT" section. Add `mentioned_passion` follow-up template + passion marker detection.

### Agent B Design
Don't remove the ban -- reframe emotion as EVIDENCE OF STAKES. "Terrified = stakes were real and high." Emotion-to-description translation table in the prompt.

### Verification Findings
- **V7.1**: The current prompt (line 574-578) bans: "What was hardest/most challenging?", "What obstacles/barriers did you face?", "How did you feel?". These bans exist in `dynamicConversationEngine.ts`, not `questionGenerator.ts`.
- **V7.2**: The `FOLLOW_UP_TEMPLATES` (line 279-306) have categories: `mentioned_number`, `mentioned_challenge`, `mentioned_person`, `mentioned_achievement`, `vague_response`, `short_response`. No `mentioned_passion` or `mentioned_emotion` templates.
- **V7.3**: Agent A's change to "DON'T INITIATE QUESTIONS" is a subtle but important distinction -- it allows leveraging emotional context students volunteer.
- **V7.4**: Agent B's emotion-to-description translation table is the real innovation. "Terrified" -> "the stakes were high enough that you felt personal risk" converts emotion into admissions-relevant evidence.

### Decision: HYBRID (A's softened ban + B's translation table)
Change "DON'T ASK ABOUT" to "DON'T INITIATE QUESTIONS ABOUT" (Agent A). Add Agent B's emotion-to-description translation table as a prompt section: when a student volunteers emotional context, translate it into evidence of stakes/commitment for the description. Add `mentioned_emotion` to `FOLLOW_UP_TEMPLATES` that triggers the translation behavior.

---

## GAP-8: Scoring Bias (Admissions Relevance in Craft Scores)

### Agent A Design
Add 2 admissions dimensions (admissions resonance, revelation density) to 6 existing craft criteria. Add GPA-drop calibration example (score 78). "When craft and admissions conflict, admissions carries MORE weight."

### Agent B Design
SCORING MODIFIER: +5 to +15 effectiveness boost for admissions-rich sentences. Applied AFTER craft scoring. Add `admissionsRelevance` and `admissionsRelevanceNote` to SentenceAnalysis.

### Verification Findings
- **V8.1**: The current 6 evaluation criteria (line 358-364): specificity vs vagueness, show vs tell, voice authenticity, structural contribution, earned emotional moments, memorable craft. These are pure craft criteria.
- **V8.2**: Agent A proposes adding criteria to the evaluation method, which means the LLM considers admissions IN PARALLEL with craft during scoring. This is architecturally cleaner.
- **V8.3**: Agent B's post-hoc modifier (+5 to +15 after craft scoring) introduces a two-pass problem: the LLM scores craft, then the system adjusts. This violates LLM-first design (system overriding LLM judgment with arithmetic).
- **V8.4**: `SentenceAnalysis` (line 406-421) has: effectiveness, effectivenessReasoning, strengths, weaknesses, isStrength, isProblem, priorityForImprovement. Agent B's `admissionsRelevance` field addition would require LLM schema change + analysis prompt change anyway.
- **V8.5**: The calibration examples (line 315-337) are craft-focused. Agent A's GPA-drop example (score 78: "My GPA dropped from 3.9 to 2.1 the semester my parents divorced") adds admissions calibration context.

### Decision: AGENT A (integrated criteria, not post-hoc modifier)
Agent B's scoring modifier violates LLM-first design by having the system arithmetically adjust LLM scores. Agent A's approach -- adding admissions criteria to the evaluation method so the LLM considers admissions natively during scoring -- is architecturally correct. Add an admissions calibration example and the "admissions carries MORE weight" directive to the scoring prompt. No new fields on SentenceAnalysis needed -- the LLM simply considers admissions as part of its holistic effectiveness judgment.

---

## GAP-9: False Precision (Score Presentation)

### Agent A Design
Keep 0-100 internal, present 5 effectiveness bands (masterful/strong/functional/developing/problematic) at user-facing layer. `toEffectivenessBand()` utility.

### Agent B Design
Keep 0-100 + add confidence intervals derived from existing `confidence` field. Display tiers with range. `deriveDisplayTier()` function.

### Verification Findings
- **V9.1**: `SentenceAnalysisConfidence` (line 2667) already has `level: 'high' | 'moderate' | 'low'` and `reasoning`. This data already exists for confidence-aware display.
- **V9.2**: The confidence field is optional (`confidence?: SentenceAnalysisConfidence`, line 2697). Not all sentences will have it.
- **V9.3**: Agent A's bands map directly to the existing calibration table (line 315-322): 96-100=masterful, 86-95=exceptional, 76-85=strong, 55-75=functional, 40-54=developing, <40=problematic. This is a straightforward presentation layer change.
- **V9.4**: Agent B's confidence intervals add complexity (displaying "72 +/- 8") that may confuse students more than help. The bands are simpler and sufficient.

### Decision: AGENT A (effectiveness bands)
Bands are simpler, sufficient, and map directly to the existing calibration table. The confidence data remains available internally for coaching decisions. A `toEffectivenessBand()` utility is a small, self-contained addition. Agent B's intervals add display complexity without proportional UX benefit.

---

## GAP-10: Essay Archetype Classification

### Agent A Design
Add `archetypeContext` (archetype name, `poolDensity`, differentiator) to `AdmissionsPositioning`. ~80 extra tokens in L3.75 schema.

### Agent B Design
Add `archetypeClassification` + `archetypeFrequency` to L3.75 + inject archetype calibration note into L3.5 scoring prompt ("common archetype + generic execution = score 10-15 points lower").

### Verification Findings
- **V10.1**: `AdmissionsPositioning` (line 890-905) has `distinctivenessFactors`, `memorability`, `portfolioPosition`. These partially cover archetype analysis but never NAME the archetype.
- **V10.2**: Agent B's scoring penalty ("common archetype + generic execution = 10-15 points lower") is a deterministic rule injected into an LLM prompt -- it's guidance, not a hard rule, so it's acceptable within LLM-first design.
- **V10.3**: Agent A adds archetype to the profile (accessible to coaching). Agent B injects it into scoring (affects scores). Both are needed -- archetype should be known AND should influence scoring.

### Decision: HYBRID (A's profile field + B's scoring calibration)
Add `archetypeContext` to `AdmissionsPositioning` (Agent A) so coaching can reference it. Also inject archetype-aware calibration into L3.5 scoring prompt (Agent B) so scores reflect archetype saturation. The archetype is produced by L3.75, consumed by L3.5 scoring and L6 coaching.

---

## GAP-11: School/Competition Context (Activity Workshop)

### Agent A Design
Add `context.schoolEnvironment` and `context.competitionLevel` templates. Add `mentioned_first` and `mentioned_competition` follow-up templates with regex detection.

### Agent B Design
Frame as "building your case" not "collecting data." Questions like "how big was the team you were leading?" feel like advocacy. Add context-trigger when leadership/competitive signals appear.

### Verification Findings
- **V11.1**: The question templates (line 45-274) cover scale, recognition, artifacts, story, meaning, impact, connections. No templates for school size, competition selectivity, or comparative context.
- **V11.2**: Agent A's regex detection violates LLM-first design principles. The LLM (via dynamicConversationEngine) already detects and follows up on context clues.
- **V11.3**: Agent B's "building your case" framing aligns with the existing workshop philosophy: "WORKSHOPPING MODE (not just data collection!)" (line 557).
- **V11.4**: The real gap is that the LLM doesn't know to ask about competitive context (school size, selectivity, field competitiveness) because no template suggests it.

### Decision: HYBRID (A's new templates + B's framing)
Add new question templates for school/competitive context (Agent A's contribution) but frame them as advocacy rather than data collection (Agent B's insight). No regex detection -- let the LLM's dynamicConversationEngine handle context detection naturally (it already does this for other categories). Add templates like: `facts.context.schoolSize`, `facts.context.competitionLevel`, `facts.context.fieldSelectivity`.

---

## GAP-12: PIQ Portfolio Synthesis

### Agent A Design
New Haiku call (~$0.004) for portfolio synthesis. New `PIQPortfolioSynthesis` type. Called after 2nd PIQ.

### Agent B Design
NO separate call. Inject prior PIQ summaries as `portfolioContext` into each subsequent PIQ's analysis prompt. Incremental portfolio awareness.

### Verification Findings
- **V12.1**: PIQ types (`src/services/piq/types.ts`) have no cross-PIQ awareness. Each PIQ is analyzed in complete isolation.
- **V12.2**: `PIQWorkshopResult` has `overallScore`, `dimensions`, `topIssues`, `quickSummary`. The `quickSummary` is a one-line diagnosis -- good material for injection into subsequent PIQ prompts.
- **V12.3**: Agent B's approach (inject prior PIQ summaries into subsequent analysis) is simpler and provides portfolio awareness WITHOUT a separate call. The key insight is that students benefit most from portfolio awareness DURING analysis, not as a separate post-hoc synthesis.
- **V12.4**: Agent A's separate synthesis call produces a standalone artifact but adds cost and a new code path. The value of the standalone artifact is questionable -- students care about "how should my next PIQ be different?" not "here's a synthesis document."

### Decision: AGENT B (embedded portfolio context)
Injecting prior PIQ summaries into subsequent PIQ analysis is simpler, cheaper (zero new calls), and more actionable -- the analysis itself becomes portfolio-aware. Add a `portfolioContext` parameter to the PIQ analysis prompt that includes `quickSummary` and `topIssues` from prior PIQs, plus a directive: "This student has already written about X in their other PIQs. This PIQ should reveal DIFFERENT dimensions."

---

## GAP-13: Cross-Module Bridge

### Agent A Design
New `StudentCrossModuleContext` type. Each module populates its section after analysis. Inject ~100-200 tokens into downstream prompts.

### Agent B Design
Prose narrative bridge (`studentNarrativeBridge.ts`). Pure deterministic text assembly from available module outputs, ~80 lines. No LLM call. Decoupled -- modules don't need to know each other's types.

### Verification Findings
- **V13.1**: There is no cross-module context sharing currently. Activity workshop, essay intelligence, PIQ, and academic advisor operate in complete isolation.
- **V13.2**: Agent A's typed approach requires each module to know about a shared type. This creates coupling -- if the type changes, all modules need updating.
- **V13.3**: Agent B's prose bridge approach is more robust: read available outputs, assemble a narrative string, inject it. Modules produce strings; the bridge consumes strings. No type coupling.
- **V13.4**: The bridge file (~80 lines) is justified because it encapsulates the assembly logic in one place rather than scattering it across modules.

### Decision: AGENT B (prose narrative bridge)
The decoupled prose bridge is architecturally cleaner. Modules produce their outputs; the bridge reads whatever is available and assembles a prose context string. No shared types needed. Each module's prompt gets an optional `studentContext` string -- if the bridge has data, it's injected. If not, it's omitted. Maximum decoupling, minimum complexity.

---

## VERIFICATION SUMMARY

| Gap | Decision | New Files | New LLM Calls | Prompt Changes | Type Changes |
|-----|----------|-----------|----------------|----------------|--------------|
| 1 | Hybrid (A+1.5) | 0 | 0 | 0 | 1 field on CoachingSessionMemory |
| 2 | Refined | 0 | 0 | 1 sidecar line | 0 |
| 3 | Hybrid (A+B) | 0 | 0 | 2 (digest + system) | 0 |
| 4 | Agent A | 1 | 1 Haiku | 0 | 1 new interface |
| 5 | Agent B | 0 | 0 | 1 (~80 tokens) | 0 |
| 6 | Agent B | 0 | 0 | 1 | 2 fields on CoachingSessionMemory |
| 7 | Hybrid (A+B) | 0 | 0 | 2 | 0 |
| 8 | Agent A | 0 | 0 | 1 (~200 tokens) | 0 |
| 9 | Agent A | 0 | 0 | 0 | 1 utility function |
| 10 | Hybrid (A+B) | 0 | 0 | 2 | 1 field on AdmissionsPositioning |
| 11 | Hybrid (A+B) | 0 | 0 | 1 | 0 |
| 12 | Agent B | 0 | 0 | 1 | 0 |
| 13 | Agent B | 1 | 0 | 0 | 0 |
| **TOTAL** | | **2 new files** | **1 new Haiku call** | **12 prompt changes** | **~6 type additions** |

---

## META-OBSERVATIONS

1. **Agent A consistently overestimated infrastructure needed.** Many proposed "new fields" or "new calls" turned out to already exist in slightly different forms. The codebase is richer than Agent A's audit suggested.

2. **Agent B consistently provided better prompt engineering.** The "lunch" framing (GAP-5), "strategic question" reframe (GAP-6), "emotion as evidence of stakes" (GAP-7), and "building your case" advocacy framing (GAP-11) are all more generative than Agent A's more mechanical approaches.

3. **Agent A was right about separate calls when domain separation matters.** GAP-4 (AO first read) genuinely needs a separate call because the naive gut reaction cannot be simulated after deep understanding.

4. **Agent B violated LLM-first design in GAP-8.** The post-hoc scoring modifier was the one clear case where Agent B's approach was architecturally wrong.

5. **Both agents missed existing infrastructure in GAP-2.** The `learningStyleUpdate` field already exists in pattern detection. This is a wiring completion, not a new feature.
