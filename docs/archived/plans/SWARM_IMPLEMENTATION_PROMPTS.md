# 4-Swarm Implementation Prompts — Writing System Improvements

> **Usage**: Copy-paste ONE swarm prompt per Claude Code chat. Run Phase 1 swarms (D + B) in parallel. Run Phase 2 (A) after B completes. Run Phase 3 (C) after A completes.
>
> **Each prompt is self-contained** — includes cross-swarm context, codebase architecture, agent decomposition, and quality gates.

---

# ════════════════════════════════════════════════════════
# SWARM D: ACTIVITY SCORING CALIBRATION (Phase 1)
# ════════════════════════════════════════════════════════

## Mission

Fix 10 identified calibration issues in the activity workshop scoring pipeline. This is activity-workshop-only — no essay scoring changes. The pipeline already has 522 passing tests and a mature 8-layer architecture. Your job is surgical calibration tuning, not architectural changes.

## Cross-Swarm Context

- **Swarm B** (running in parallel): Building 7 deterministic narrative analyzers in `src/workshop/scoring/narrativeAnalyzers.ts` and `src/workshop/dimensions/`. These are essay-focused and will NOT touch activity scoring. No coordination needed.
- **Swarm A** (runs after B): Will build a brainstorming/story discovery system in `src/services/brainstorming/`. It will consume calibrated activity scores when weighting story seeds by activity importance. Your scoring changes must NOT break the `ScoringOrchestratorResult` interface.
- **Swarm C** (runs last): Will optimize essay analysis token usage. Does not touch activity scoring.

## Current Architecture (CRITICAL — Read Before Writing Any Code)

The activity scoring pipeline lives in `src/services/portfolioStrategy/services/activityWorkshop/scoring/` (69 files, 770KB). It follows an **8-layer decomposed pipeline**:

```
Layer 0: Story Context (Haiku) — existing, well-scoped
Layer 1: Feature Extraction (Haiku) — extract facts, don't judge
         File: featureExtractor.ts (28KB)
Layer 2: Tier Classification (pure code) — 6-tier deterministic bands
         File: tierClassifier.ts (33KB)
Layer 3: Rule Scoring (pure code) — component scores from extracted features
         Files: descriptionRuleScorer.ts, activityRuleScorer.ts
Layer 4: Expertise Signaling (pure code, $0) — 14+ domain files, ~145 signals
         Directory: expertiseSignaling/ (176KB total)
Layer 5: Impressiveness Calibration (pure code, $0) — 12 domain files, 5-level ladders
         Directory: impressivenessCalibration/ (162KB total)
Layer 6: Nuance Calibration (Sonnet) — LLM-powered score adjustment within tier bounds
         File: nuanceCalibrationService.ts (30KB)
Layer 7: Portfolio Calibration (pure code) — cross-activity consistency
         File: portfolioCalibrator.ts (27KB)
Layer 8: Portfolio Scoring (Sonnet, always fresh) — holistic assessment
         File: portfolioScoringService.ts (28KB)
```

**Orchestrator**: `scoringOrchestrator.ts` (61KB) — parallelizes extraction/descriptions, sequences rule scoring.

**Teaching**: `activityTeachingLayerService.ts` (54KB) — Sonnet-powered, reads from scoring results. Has 3 sophistication tiers (foundational/intermediate/advanced) via `teachingSophisticationRouter.ts`.

**Knowledge bases**:
- `knowledge/categoryRegistry.ts` — unified category profiles
- `knowledge/recognitionIndex.ts` — O(1) award/competition lookup
- `achievementIntelligence.ts` (172KB) — 500+ benchmarks across 18 categories
- `comparisonBenchmarksLibrary.ts` (38KB) — pre-researched activity comparisons

**Existing tests**: 522 passing (279 tier + 59 calibration + 80 rule + 73 description + 31 E2E) in:
- `tests/test-hybrid-scoring-calibration.ts`
- Tests embedded in scoring files

**Tier bands** (non-overlapping, from `tierClassifier.ts`):
- Tier 1 (Elite): 8.5-10.0
- Tier 2 (Strong): 7.0-8.4
- Tier 3 (Solid): 5.5-6.9
- Tier 4 (Moderate): 4.0-5.4
- Tier 5 (Developing): 2.5-3.9
- Tier 6 (Minimal): 1.0-2.4

## The 10 Calibration Issues (with Fix Strategies)

### Issue 1: ML Research Assistant = Same Tier as Tutoring
**Root cause**: Tier classification under-weights research indicators (co-authored paper, 50K records, NLP pipeline, university setting).
**Fix location**: `tierClassifier.ts` — research indicators should push toward Tier 1-2; `impressivenessCalibration/` research domain should have higher floor.
**Expected**: Research ≥ Tier 2 (7.0+), Tutoring = Tier 3-4 (4.0-6.9).

### Issue 2: CS Club President Title Inflation
**Root cause**: "President" title alone triggers high leadership signals without evidence of impact/scale.
**Fix location**: `expertiseSignaling/` already has leadership inflation traps — verify they're properly weighted in `descriptionRuleScorer.ts`. The rule scorer should discount title-only signals when no impact evidence exists.
**Expected**: "CS Club President" without impact evidence = Tier 3-4, not Tier 1-2.

### Issue 3: Selective Context Ignored
**Root cause**: Nuance calibration doesn't factor in the selectivity of the context (university research lab vs school club).
**Fix location**: `nuanceCalibrationService.ts` — add selectivity multiplier. `impressivenessCalibration/` domain files have selectivity context that should feed into nuance prompts.
**Expected**: Same activity at MIT lab scores higher than same activity at school.

### Issue 4: Research Description Score Inflated
**Root cause**: Description scoring gives high marks for technical vocabulary regardless of whether it communicates value to an AO.
**Fix location**: `descriptionScoringService.ts` (47KB) — add calibration examples showing that technical jargon without outcome/impact shouldn't score 9+.
**Expected**: "Used Python/pandas for data analysis" without outcome ≤ 7/10.

### Issue 5: Portfolio Coherence Score Inconsistency
**Root cause**: Three different numbers (60/100, 82/100, 5/10) for the same activities — different scales, different scoring paths.
**Fix location**: `portfolioScoringService.ts` and `portfolioCalibrator.ts` — normalize to a single 0-100 scale consistently. Ensure portfolio score is ALWAYS derived from the same calculation path.
**Expected**: Same input always produces same score on same scale.

### Issue 6: Leadership Title Inflation
**Root cause**: Titles ("Founder", "President", "Captain") receive outsized scoring weight without evidence of actual leadership activities.
**Fix location**: `expertiseSignaling/` domains — check that leadership title signals are gated on evidence (did they describe leading, not just holding the title?). `descriptionRuleScorer.ts` — title-only bonus should be capped.
**Expected**: "President of Chess Club" with no described leadership actions = moderate score, not high.

### Issue 7: "Founded" Verb Over-Weighted
**Root cause**: The verb "founded" triggers high initiative signals regardless of scale (founding a small club ≠ founding a nonprofit serving 500+).
**Fix location**: `descriptionRuleScorer.ts` — "founded" should be scale-aware. Check `expertiseSignaling/` for existing verb hierarchy data. The rule scorer should cross-reference "founded" with scale indicators (membership count, people served, revenue, etc.).
**Expected**: "Founded a book club with 5 friends" scores significantly lower than "Founded a nonprofit serving 500+ families."

### Issue 8: Hours/Week as Impressiveness Proxy
**Root cause**: 20hr/wk at a grocery store scores similarly to 20hr/wk in a research lab because hours are treated as a blanket commitment signal.
**Fix location**: `featureExtractor.ts` or `activityRuleScorer.ts` — hours/week should be context-weighted. High hours in a paid job = expected (moderate signal). High hours in voluntary/intellectual work = strong signal.
**Expected**: 20hr/wk retail ≠ 20hr/wk lab in scoring.

### Issue 9: Mid-Tier Clustering (4-6 Activities)
**Root cause**: Activities scoring 4.0-6.0 cluster too tightly — insufficient discrimination between meaningfully different activities.
**Fix location**: `tierClassifier.ts` — Tiers 3-4 (4.0-6.9) need finer sub-discrimination. Consider splitting the 4.0-6.9 range into 3 sub-bands instead of 2. Also check `nuanceCalibrationService.ts` — the LLM calibration may be compressing mid-range scores.
**Expected**: Mid-tier spread ≥ 1.5 points across activities of genuinely different quality.

### Issue 10: Quantification Bonus Applied Equally
**Root cause**: Any number gets a quantification bonus regardless of significance ("89% retention" vs "8 students").
**Fix location**: `descriptionRuleScorer.ts` — quantification bonus should scale with significance. A percentage (retention, improvement, growth rate) is more impressive than a small count. Large absolute numbers are more impressive than small ones.
**Expected**: "89% retention rate" > "helped 8 students" in quantification scoring.

## Agent Decomposition (3 Agents)

### Agent 1: `calibrator`
**Role**: Fix tier classification thresholds, nuance calibration prompts, and impressiveness calibration data.
**Files owned**:
- `scoring/tierClassifier.ts` — Adjust tier boundary logic, add sub-discrimination for mid-tiers
- `scoring/nuanceCalibrationService.ts` — Add few-shot calibration examples to the Sonnet prompt (this is the #1 prompt engineering gap — currently lacks calibration examples)
- `scoring/impressivenessCalibration/` domain files — Adjust selectivity multipliers, research domain floors

**Specific deliverables**:
1. Add 5+ calibration examples to nuance calibration Sonnet prompt showing: Research > Tutoring, Scale matters for "founded", Selectivity context matters
2. Adjust Tier 3-4 boundary logic to create wider spread in mid-range
3. Add selectivity multiplier to impressiveness calibration
4. Ensure Research indicators push toward Tier 1-2 minimum

### Agent 2: `rule-fixer`
**Role**: Fix rule scoring weights, description scoring calibration, and feature extraction context-awareness.
**Files owned**:
- `scoring/descriptionRuleScorer.ts` — Fix verb weighting (founded/scale-aware), title inflation caps, quantification significance scaling
- `scoring/activityRuleScorer.ts` — Fix hours/week context-weighting
- `scoring/descriptionScoringService.ts` — Add calibration examples showing jargon-without-outcome shouldn't score 9+
- `scoring/expertiseSignaling/` — Verify leadership inflation traps are properly connected to rule scorer

**Specific deliverables**:
1. Make "founded" score scale-aware (cross-reference with membership/people/revenue signals)
2. Cap title-only bonus (title without described leadership actions)
3. Make hours/week context-dependent (paid vs voluntary vs intellectual)
4. Scale quantification bonus by significance (percentages > small absolute numbers)
5. Add 3-5 calibration examples to description scoring prompt

### Agent 3: `test-writer`
**Role**: Expand calibration test suite to cover all 10 issues, ensuring each has a concrete passing criterion.
**Files owned**:
- `tests/test-hybrid-scoring-calibration.ts` — Extend with new cases
- NEW: `tests/test-scoring-calibration-edge-cases.ts` — Dedicated edge case tests

**Specific deliverables**:
1. Test case per calibration issue (10 minimum)
2. Research vs Grocery: Research scores ≥ 2.0 points higher in EVERY run
3. Title inflation: "CS Club President" (no impact) < "CS Club Member" (with demonstrated project)
4. Mid-tier spread: 5 mid-tier activities must have ≥ 1.5 point spread
5. Founded scaling: "Founded book club (5 friends)" ≤ 5.5, "Founded nonprofit (500+ families)" ≥ 7.5
6. Hours context: 20hr/wk retail scores lower than 20hr/wk research lab
7. Quantification: "89% retention rate" quantification bonus > "8 students" bonus
8. Regression: All 522 existing tests still pass

## Quality Gate

- [ ] All 522 existing tests pass
- [ ] 10 new calibration test cases pass
- [ ] Research > Grocery in every meaningful dimension
- [ ] Mid-tier spread ≥ 1.5 points across genuinely different activities
- [ ] `npx tsc --noEmit` clean
- [ ] No changes to `ScoringOrchestratorResult` interface (Swarm A depends on it)

## Anti-Patterns to Avoid

- Do NOT restructure the 8-layer pipeline — it's well-designed, just needs calibration tuning
- Do NOT add new LLM calls — fixes should be in existing prompts or pure code
- Do NOT modify the teaching layer — only scoring layers
- Do NOT change tier band boundaries without updating all downstream code that references them
- Do NOT delete existing expertiseSignaling or impressivenessCalibration data — extend it

---

# ════════════════════════════════════════════════════════
# SWARM B: NARRATIVE STRUCTURE ANALYSIS (Phase 1)
# ════════════════════════════════════════════════════════

## Mission

Build 7 deterministic narrative analysis capabilities (~2,000 lines of mostly pure code) that detect essay structure, pacing, and narrative quality. These feed into both the annotation pipeline (essay feedback) and the future brainstorming system (intended vs actual structure tracking). This is the foundation that Swarm A depends on.

## Cross-Swarm Context

- **Swarm D** (running in parallel): Fixing activity scoring calibration in `scoring/` files. No overlap with your work — you're in essay analysis, they're in activity scoring.
- **Swarm A** (runs after you): Will build a brainstorming system that uses your narrative analyzers for "intended vs actual structure" comparison. They will import: `runNarrativeAnalysis()`, `NarrativeArcType`, `StructurePlan`, `NarrativeAnalysisResult`, `EmotionalJourneyAnalysis`. Export clean types and a unified entry point.
- **Swarm C** (runs last): Will optimize essay analysis token usage. Your analyzers are deterministic and won't need token optimization, but Swarm C will include your analysis results in the annotation pipeline's Sonnet prompt.

## Current Architecture (CRITICAL — Read Before Writing Any Code)

### Feature Extractor (REUSE THIS)
`src/workshop/scoring/featureExtractor.ts` (1,941 lines) already provides:

**Utilities you MUST reuse** (don't reimplement):
- `splitSentences(text)` — Returns string[] of sentences
- `splitParagraphs(text)` — Returns string[] of paragraphs
- `splitWords(text)` — Returns string[] of words
- `countSetMatches(text, wordSet)` — Count matches against a word set
- `detectOpeningScene(firstSentence, firstParagraph)` — Boolean scene detection
- `estimateClauseDepth(sentence)` — Syntactic complexity estimate

**Word sets you MUST reuse** (don't redeclare):
- `SENSORY_WORDS` — 20+ words (bright, whisper, rough, etc.)
- `EMOTION_WORDS` — 40+ words (afraid, grateful, joyful, etc.)
- `VULNERABILITY_MARKERS` — 15+ (afraid, failed, shame, etc.)
- `ACHIEVEMENT_MARKERS` — 12+ (won, award, founded, etc.)
- `REFLECTION_MARKERS` — 8+ (realized, understood, learned, etc.)
- `GROWTH_LANGUAGE` — 12+ (grew, evolved, transformed, etc.)
- `CURIOSITY_MARKERS` — 12+ (wondered, fascinated, researched, etc.)
- `CLICHES` — 15+ (since i was young, made me who i am, etc.)
- `FILLER_PHRASES` — 15+ (in order to, the fact that, etc.)
- `PASSIVE_PATTERN` — Regex for passive voice

**Existing features** already extracted (in `ExtractedFeatures` interface):
- wordCount, uniqueWordCount, avgWordLength, vocabularyRichness
- avgSentenceLength, sentenceLengthVariance, shortSentenceRatio, longSentenceRatio
- paragraphCount, avgParagraphLength
- hasOpeningScene, hasDialogue, dialogueCount, hasQuestions, questionCount
- sensoryDetailCount, emotionWordCount, vulnerabilityMarkerCount
- passiveVoiceRatio, sentenceVarietyScore, formalityScore
- transitionWordCount, paragraphTransitionQuality
- claimCount, evidenceCount, counterpointCount, rhetoricalDeviceCount

### Dimension Registration Pattern
`src/workshop/dimensions/*.dim.ts` — Each dimension self-registers:
```typescript
import { dimensionRegistry } from '../shared/dimensionRegistry';

const manifest: DimensionManifest = {
  id: 'my_dimension',
  displayName: 'My Dimension',
  weight: 0.08,
  scoringTier: 'heuristic',  // No LLM needed for deterministic analyzers
  heuristicScore: (features: ExtractedFeatures) => { ... },
  shouldTriggerLLM: (h) => false,  // Deterministic = never triggers LLM
  buildLLMPrompt: () => '',
  parseLLMResponse: () => NOOP_LLM_RESULT,
  fuseScores: (h, l) => fuseByConfidence(ID, h, l),
};
dimensionRegistry.register(manifest);
```

Existing dimensions: 13 registered (narrative_craft, structural_coherence, emotional_resonance, word_economy, opening_hook, closing_impact, authenticity_specificity, thematic_depth, growth_transformation, intellectual_vitality, originality_voice, tonal_sophistication, argument_rhetorical). Total weights sum to ~1.0.

### Existing Narrative-Adjacent Code
- `src/workshop/dimensions/narrative-craft.dim.ts` — Has partial scene detection, sensory density, dialogue scoring. Does NOT have scene/summary ratio, show/tell phrase detection, or arc typing.
- `src/workshop/commands/map-emotional-arc.cmd.ts` — LLM-powered diagnostic (Sonnet). Produces human-readable emotional arc map. Your deterministic emotional journey analyzer should COMPLEMENT this, not replace it.
- `src/core/analysis/features/informationTheoreticAnalyzer.ts` — Has Shannon entropy, compression ratio, information density per window. Reuse this for Info Density analyzer.

### Annotation Pipeline Integration Points
- `src/pipeline/promptBuilder.ts` — Assembles Sonnet prompt for annotations. Narrative analysis summaries should be injected here as additional context.
- `src/pipeline/scoreDeriver.ts` — Derives per-dimension scores. New narrative dimensions' heuristic scores flow through here automatically via dimension registration.
- `src/pipeline/types.ts` — Core types. May need extending with narrative analysis types.

## File Structure (Follow Existing Patterns)

```
src/workshop/scoring/
  narrativeAnalyzers.ts          (NEW, ~1,600 lines — all 7 analyzer functions)
  narrativeAnalyzerTypes.ts      (NEW, ~400 lines — all interfaces + shared types)

src/workshop/dimensions/
  narrative-structure.dim.ts     (NEW, ~150 lines — wraps specificity + scene/summary + show/tell)
  narrative-dynamics.dim.ts      (NEW, ~150 lines — wraps arc + journey + tension + density)

src/pipeline/
  promptBuilder.ts               (MODIFY — inject narrative analysis summary into Sonnet prompt)

src/workshop/scoring/
  index.ts                       (MODIFY — export runNarrativeAnalysis and types)

tests/
  test-narrative-analyzers.ts    (NEW, ~500 lines — unit tests per analyzer)
```

**IMPORTANT**: Do NOT create a `narrativeAnalyzers/` directory. Keep analyzers in a single file with clearly separated functions. This matches the codebase pattern where related logic lives in one file (see `featureExtractor.ts` at 1,941 lines).

## The 7 Analyzers — Detailed Specs

### Analyzer 1: Specificity Gradient (90% code, ~300 lines)

**Purpose**: Score each paragraph on concrete-vs-abstract scale. Find vague sections that need specific details.

**Algorithm**:
1. For each paragraph:
   - Count sensory words (reuse `SENSORY_WORDS`)
   - Detect named entities (proper nouns via capitalization heuristic)
   - Count numbers/quantities (regex: `/\b\d+[\d,.]*\b/`)
   - Detect specific locations (capitalized multi-word phrases)
   - Count generic phrases ("the situation", "what happened", "things", "stuff")
   - Calculate ratio: (sensory + entities + quantities) / totalWords
2. Score 0-100 per paragraph
3. Flag paragraphs below threshold (< 30) as "needs specificity"

**Interface**:
```typescript
interface SpecificityGradient {
  paragraphScores: Array<{
    index: number;
    score: number;              // 0-100
    level: 'highly_concrete' | 'concrete' | 'moderate' | 'abstract' | 'highly_abstract';
    signals: {
      sensoryWords: number;
      namedEntities: string[];
      quantities: string[];
      specificLocations: string[];
      genericPhrases: string[];
    };
  }>;
  overallScore: number;         // Average
  weakestParagraph: number;     // Index of most abstract paragraph
  strongestParagraph: number;   // Index of most concrete paragraph
}
```

### Analyzer 2: Scene vs Summary Ratio (85% code, ~280 lines)

**Purpose**: Classify each paragraph as scene (showing action in real-time) vs summary (telling about events). Target 60-70% scene for personal statements.

**Algorithm**:
1. Per sentence classification:
   - **Scene signals**: Past tense action verbs ("grabbed", "ran", "said"), temporal anchors ("at that moment", "suddenly"), spatial anchors ("in the kitchen", "on the field"), dialogue markers (quotation marks), sensory details
   - **Summary signals**: Copula verbs ("was", "is", "became", "seemed"), abstract language ("I learned", "I realized", "It was important"), reflection markers (reuse `REFLECTION_MARKERS`), generic temporal ("For years", "Eventually", "Over time")
   - Score each sentence: scene_signals - summary_signals
2. Per paragraph: majority vote of sentences → scene/summary/mixed
3. Calculate ratio: scene_paragraphs / total_paragraphs
4. Flag if ratio < 0.5 or > 0.85 (too much of either)

**Interface**:
```typescript
interface SceneVsSummaryAnalysis {
  sceneRatio: number;           // 0-1
  summaryRatio: number;         // 0-1
  idealRange: { min: number; max: number }; // 0.6-0.7 for personal statements
  isInRange: boolean;
  paragraphs: Array<{
    index: number;
    classification: 'scene' | 'summary' | 'mixed';
    confidence: number;         // 0-1
    sceneSignalCount: number;
    summarySignalCount: number;
  }>;
  longestSummaryStretch: number; // Consecutive summary paragraphs
  recommendation?: string;      // e.g., "Consider showing paragraph 3 as a scene"
}
```

### Analyzer 3: Show vs Tell Detection (80% code, ~320 lines)

**Purpose**: Find "I was happy" patterns and flag them as tell-not-show opportunities.

**Algorithm**:
1. Build tell-patterns regex list:
   - `I (was|felt|am|became|grew) [EMOTION_WORD]` — "I was nervous"
   - `It was [abstract adjective]` — "It was amazing"
   - `I (knew|realized|understood) that` — Often summary, not scene
   - `[Subject] made me feel [emotion]` — "That experience made me feel grateful"
2. Build show-indicators:
   - Sensory details in same sentence (SENSORY_WORDS)
   - Action verbs (past tense, non-copula)
   - Dialogue
   - Physical reactions ("my hands trembled", "my heart raced")
   - Concrete consequences ("I scored 95%", "the audience stood up")
3. Per sentence: classify as showing (≥2 show-indicators) or telling (matches tell-pattern, <2 show-indicators)
4. Aggregate per paragraph
5. Return top 5 "tell" opportunities with the specific emotion word found

**Interface**:
```typescript
interface ShowVsTellAnalysis {
  overallShowRatio: number;     // 0-1
  paragraphs: Array<{
    index: number;
    showCount: number;
    tellCount: number;
    showRatio: number;
  }>;
  tellOpportunities: Array<{    // Top 5 most impactful
    sentenceText: string;
    paragraphIndex: number;
    emotionWord: string;        // The "told" emotion (e.g., "happy", "nervous")
    tellPattern: string;        // Which pattern matched
    suggestion: string;         // e.g., "Instead of 'I was nervous', show physical signs of nervousness"
  }>;
  showExemplars: Array<{        // Best showing sentences (for positive reinforcement)
    sentenceText: string;
    paragraphIndex: number;
    showSignals: string[];      // What makes it good showing
  }>;
}
```

### Analyzer 4: Narrative Arc Heuristic (70% code, ~400 lines)

**Purpose**: Detect which narrative arc pattern the essay follows (Man-in-Hole, Cinderella, Icarus, Quest, or ambiguous).

**Arc Patterns** (from Reagan et al. 2016 + admissions research):
- **Man-in-Hole** (most common in essays): Setup → Fall/Problem → Struggle → Rise/Resolution
  - Markers: Early achievement/normalcy → vulnerability/failure → effort/persistence → growth/success
- **Cinderella** (transformation): Constraint → Discovery → Agency → Triumph
  - Markers: limitation/restriction → opportunity/realization → action/building → achievement
- **Icarus** (cautionary/humbling): Success → Overconfidence → Fall → Reflection
  - Markers: achievement/pride → assumption/complacency → failure/consequence → wisdom
- **Quest** (exploration): Curiosity → Journey → Challenges → Discovery
  - Markers: wonder/question → research/exploration → obstacles → insight/understanding
- **Rags-to-Riches** (pure ascent): Humble beginning → Effort → Recognition
  - Markers: constraint/poverty → hard work/dedication → achievement/recognition

**Algorithm**:
1. Divide essay into 4 quarters (by paragraph count)
2. For each quarter, score emotional valence:
   - Positive signals: ACHIEVEMENT_MARKERS, GROWTH_LANGUAGE, sensory words (positive)
   - Negative signals: VULNERABILITY_MARKERS, failure language, conflict language
   - Neutral: CURIOSITY_MARKERS, REFLECTION_MARKERS
   - Score = (positive - negative) / total_signals, normalized to -1 to +1
3. Map the 4-quarter trajectory to arc patterns:
   - Man-in-Hole: [+, -, -, +] or [0, -, 0, +]
   - Cinderella: [-, -, +, +] or [-, 0, +, +]
   - Icarus: [+, +, -, 0] or [+, +, -, -]
   - Quest: [0, 0, -, +] or [0, +, -, +]
   - Rags-to-Riches: [-, -, +, +] rising pattern
4. Confidence = how closely the trajectory matches the expected pattern (cosine similarity)
5. If no pattern matches above 0.5 confidence → "ambiguous"

**Interface**:
```typescript
type NarrativeArcType = 'man_in_hole' | 'cinderella' | 'icarus' | 'quest' | 'rags_to_riches' | 'ambiguous';

interface NarrativeArcAnalysis {
  detectedArc: NarrativeArcType;
  confidence: number;           // 0-1
  quarterValences: [number, number, number, number]; // -1 to +1 per quarter
  acts: Array<{
    quarterIndex: number;
    paragraphRange: [number, number]; // Start/end paragraph indices
    emotionalValence: number;   // -1 to +1
    dominantSignals: string[];  // Top 3 signal types in this quarter
    keyMoments: string[];       // Strongest signal sentences
  }>;
  alternativeArcs: Array<{     // Other possible interpretations
    arc: NarrativeArcType;
    confidence: number;
  }>;
  structuralNotes: {
    hasSetup: boolean;
    hasConflict: boolean;
    hasClimaxOrTurningPoint: boolean;
    hasResolution: boolean;
    hasDenouement: boolean;
  };
}
```

### Analyzer 5: Emotional Journey Typing (70% code, ~220 lines)

**Purpose**: Map the emotional trajectory paragraph by paragraph. Detect monotone emotions (boring) vs varied journey (engaging).

**Emotion Taxonomy** (map EMOTION_WORDS to these canonical categories):
- joy/happiness, sadness/loss, fear/anxiety, anger/frustration, surprise/wonder, disgust/shame, trust/connection, anticipation/excitement, pride/accomplishment, vulnerability/exposure, determination/resolve, confusion/uncertainty

**Algorithm**:
1. For each paragraph:
   - Extract all emotion words (from EMOTION_WORDS + VULNERABILITY_MARKERS)
   - Map each to canonical emotion category
   - Count by category → dominant emotion(s)
   - Score emotional intensity (emotion_word_count / total_word_count)
2. Track transitions between paragraphs:
   - Same emotion → monotone signal
   - Different emotion → variety signal
   - Intensity change → engagement signal
3. Score trajectory:
   - Count unique emotions across essay
   - Count transitions (emotion A → emotion B)
   - Detect monotone stretches (≥3 paragraphs, same dominant emotion)
   - Detect emotional variety score (unique emotions / paragraphs)
4. Evaluate: isEngaging (variety + transitions + intensity changes) vs isMonotone (same emotion throughout)

**Interface**:
```typescript
type EmotionalCategory = 'joy' | 'sadness' | 'fear' | 'anger' | 'surprise' | 'trust' | 'anticipation' | 'pride' | 'vulnerability' | 'determination' | 'confusion' | 'shame';

interface EmotionalJourneyAnalysis {
  paragraphs: Array<{
    index: number;
    dominantEmotions: EmotionalCategory[]; // Top 1-2
    emotionWordCount: number;
    intensity: number;          // 0-1 (emotion density)
    emotionWords: Array<{ word: string; category: EmotionalCategory }>;
  }>;
  trajectory: {
    pattern: 'monotone' | 'ascending_variety' | 'valley_peak' | 'oscillating' | 'building';
    uniqueEmotionCount: number;
    transitions: Array<{ from: EmotionalCategory; to: EmotionalCategory; atParagraph: number }>;
    monotoneStretches: Array<{ emotion: EmotionalCategory; startParagraph: number; length: number }>;
    varietyScore: number;       // 0-1 (higher = more emotional variety)
  };
  evaluation: {
    isEngaging: boolean;        // Variety + movement
    isAuthentic: boolean;       // Has vulnerability + isn't all triumph
    strongestMoment: { paragraph: number; emotion: EmotionalCategory; intensity: number };
    weakestMoment: { paragraph: number; reason: string };
  };
}
```

### Analyzer 6: Information Density per Paragraph (95% code, ~160 lines)

**Purpose**: Find the most redundant paragraph. Measure information-to-word ratio.

**Algorithm** (leverage `informationTheoreticAnalyzer.ts` patterns):
1. For each paragraph:
   - Type-token ratio (unique words / total words)
   - Detect repeated phrases (2-gram and 3-gram repetition across paragraphs)
   - Count novel concepts (words/phrases not seen in prior paragraphs)
   - Calculate entropy (word diversity via Shannon entropy)
2. Score each paragraph: novelConcepts * entropy / wordCount → density score
3. Flag lowest-density paragraph as "most redundant"
4. Flag paragraphs that repeat 2+ phrases from earlier paragraphs

**Interface**:
```typescript
interface InformationDensityAnalysis {
  paragraphs: Array<{
    index: number;
    densityScore: number;       // 0-100 (higher = more information-dense)
    typeTokenRatio: number;
    novelConceptCount: number;
    repeatedPhrases: string[];  // Phrases also found in earlier paragraphs
    entropy: number;
    level: 'high_density' | 'moderate' | 'low_density' | 'redundant';
  }>;
  mostRedundantParagraph: number;     // Index
  mostInformativeParagraph: number;   // Index
  overallDensityScore: number;        // Average
  redundancyFlags: Array<{
    paragraphIndex: number;
    repeatedFrom: number;       // Which earlier paragraph it repeats
    repeatedPhrase: string;
  }>;
}
```

### Analyzer 7: Tension Curve Mapping (75% code, ~300 lines)

**Purpose**: Map where reader interest rises and falls. Identify flat spots.

**Tension Sources** (per paragraph):
- Vulnerability present (+2)
- Conflict/problem described (+2)
- Stakes mentioned ("if I didn't...", "everything depended on...") (+2)
- Unanswered question (+1)
- Action/pacing (short sentences, dialogue) (+1)
- Sensory immersion (+1)
- Penalties: abstract summary (-1), cliche (-1), repeated information (-1)

**Algorithm**:
1. For each paragraph, sum tension signals → raw tension score
2. Normalize to 1-10 scale
3. Calculate slope between consecutive paragraphs (rising/flat/falling)
4. Identify flat spots: ≥2 consecutive paragraphs at tension ≤ 3
5. Identify peak: highest tension paragraph
6. Compare against ideal pattern:
   - Hook (para 0): tension ≥ 5
   - Rising action (para 1-N/2): generally rising
   - Climax (para N/2-N*0.7): peak tension
   - Resolution (final paras): can drop but should end ≥ 4
7. Report gaps between actual and ideal

**Interface**:
```typescript
interface TensionCurveAnalysis {
  paragraphs: Array<{
    index: number;
    tensionLevel: number;       // 1-10
    trend: 'rising' | 'flat' | 'falling';
    sources: {
      vulnerability: number;
      conflict: number;
      stakes: number;
      questions: number;
      pacing: number;
      immersion: number;
    };
    penalties: {
      abstractSummary: number;
      cliche: number;
      repetition: number;
    };
  }>;
  curve: {
    peakParagraph: number;
    peakTension: number;
    flatSpots: Array<{ startParagraph: number; endParagraph: number; avgTension: number }>;
    hookStrength: number;       // Tension of paragraph 0
    closingStrength: number;    // Tension of final paragraph
  };
  evaluation: {
    overallEngagement: 'high' | 'good' | 'moderate' | 'low';
    hasStrongHook: boolean;
    hasClimacticPeak: boolean;
    hasSatisfyingClose: boolean;
    flatSpotCount: number;
    suggestions: string[];      // e.g., "Paragraphs 3-4 are flat — add stakes or conflict"
  };
}
```

### Unified Entry Point

```typescript
interface NarrativeAnalysisResult {
  specificity: SpecificityGradient;
  sceneVsSummary: SceneVsSummaryAnalysis;
  showVsTell: ShowVsTellAnalysis;
  narrativeArc: NarrativeArcAnalysis;
  emotionalJourney: EmotionalJourneyAnalysis;
  informationDensity: InformationDensityAnalysis;
  tensionCurve: TensionCurveAnalysis;
  // Aggregate scores for quick access
  overallNarrativeScore: number;  // 0-100, weighted combination
  topIssues: Array<{ analyzer: string; issue: string; severity: 'critical' | 'important' | 'minor' }>;
}

// Run all 7 analyzers in parallel (they're independent)
export async function runNarrativeAnalysis(
  text: string,
  features: ExtractedFeatures,  // Reuse existing feature extraction
  metadata?: { essayType?: string; targetWordCount?: number }
): Promise<NarrativeAnalysisResult>;
```

## Agent Decomposition (4 Agents)

### Agent 1: `content-analyzers`
**Role**: Build Specificity Gradient + Information Density analyzers (both per-paragraph content analysis).
**Files owned**:
- `src/workshop/scoring/narrativeAnalyzers.ts` — `analyzeSpecificityGradient()` and `analyzeInformationDensity()` functions
- Parts of `src/workshop/scoring/narrativeAnalyzerTypes.ts` — `SpecificityGradient` and `InformationDensityAnalysis` interfaces

### Agent 2: `classification-analyzers`
**Role**: Build Scene/Summary + Show/Tell analyzers (both sentence-level classification).
**Files owned**:
- `src/workshop/scoring/narrativeAnalyzers.ts` — `analyzeSceneVsSummary()` and `analyzeShowVsTell()` functions
- Parts of `src/workshop/scoring/narrativeAnalyzerTypes.ts` — `SceneVsSummaryAnalysis` and `ShowVsTellAnalysis` interfaces

### Agent 3: `arc-analyzers`
**Role**: Build Narrative Arc + Emotional Journey + Tension Curve analyzers (all essay-level trajectory analysis).
**Files owned**:
- `src/workshop/scoring/narrativeAnalyzers.ts` — `analyzeNarrativeArc()`, `analyzeEmotionalJourney()`, and `analyzeTensionCurve()` functions
- Parts of `src/workshop/scoring/narrativeAnalyzerTypes.ts` — `NarrativeArcAnalysis`, `EmotionalJourneyAnalysis`, `TensionCurveAnalysis`, `NarrativeArcType`, `EmotionalCategory` types

### Agent 4: `integration-wiring`
**Role**: Create dimension wrappers, wire into annotation pipeline, create unified entry point, write tests.
**Files owned**:
- `src/workshop/dimensions/narrative-structure.dim.ts` (NEW) — Register dimension wrapping specificity + scene/summary + show/tell
- `src/workshop/dimensions/narrative-dynamics.dim.ts` (NEW) — Register dimension wrapping arc + journey + tension + density
- `src/workshop/scoring/index.ts` (MODIFY) — Export `runNarrativeAnalysis` and all types
- `src/pipeline/promptBuilder.ts` (MODIFY) — Inject narrative analysis summary into annotation Sonnet prompt
- `tests/test-narrative-analyzers.ts` (NEW)
- Top-level of `src/workshop/scoring/narrativeAnalyzerTypes.ts` — `NarrativeAnalysisResult` interface and `runNarrativeAnalysis` function signature

**Specific integration tasks**:
1. In `promptBuilder.ts`, add a `buildNarrativeAnalysisSummary(result: NarrativeAnalysisResult): string` function that produces a ~200-token summary for the Sonnet annotation prompt
2. In dimension wrappers, aggregate analyzer scores into heuristic dimension scores
3. Adjust existing dimension weights so 13 + 2 new dimensions still sum to ~1.0 (reduce existing weights proportionally)
4. Write 3+ test essays through the analyzers and verify reasonable results

## Quality Gate

- [ ] Each analyzer has unit tests with at least 2 known essays (one narrative-heavy, one essay-style)
- [ ] Specificity gradient produces paragraph-level scores matching manual inspection within ±20%
- [ ] Scene/summary ratio correctly identifies scene vs summary in 5+ test passages
- [ ] Show/Tell detector finds "I was [emotion]" patterns and suggests showing alternatives
- [ ] Arc detector identifies correct pattern for classic Man-in-Hole and Quest essays
- [ ] Emotional journey detects monotone vs varied emotional arcs
- [ ] Tension curve identifies flat spots in intentionally flat test passages
- [ ] All analyzers complete in < 100ms per essay (they're deterministic — no LLM)
- [ ] `runNarrativeAnalysis()` exported cleanly from `src/workshop/scoring/index.ts`
- [ ] `NarrativeArcType`, `NarrativeAnalysisResult`, `EmotionalJourneyAnalysis` types exported
- [ ] Annotation pipeline's Sonnet prompt includes narrative analysis summary
- [ ] 2 new dimensions registered and weighted
- [ ] `npx tsc --noEmit` clean
- [ ] All existing 13 dimension tests still pass

## Anti-Patterns to Avoid

- Do NOT use any LLM calls in the 7 analyzers — they must be pure deterministic code
- Do NOT create a `narrativeAnalyzers/` directory — use single file `narrativeAnalyzers.ts`
- Do NOT redeclare word sets that exist in `featureExtractor.ts` — import and reuse them
- Do NOT modify existing dimension files — only add new dimensions
- Do NOT produce natural language feedback in analyzers — return structured data only (the annotation pipeline handles feedback generation)
- Do NOT return suggestions that reference specific editing commands — that coupling belongs in the annotation pipeline's prompt builder

---

# ════════════════════════════════════════════════════════
# SWARM A: BRAINSTORMING / STORY DISCOVERY (Phase 2)
# ════════════════════════════════════════════════════════

## Mission

Build a conversational brainstorming system that helps students go from "I don't know what to write about" to "I have a compelling story plan with clear structure." This is the **HIGHEST PRIORITY** feature. It produces a StoryProfile that feeds context to ALL downstream services (annotation pipeline, inline editor, enhancement orchestrator), replacing fabricated context with genuine student-provided details.

This system should feel like talking to a wise, empathetic writing counselor — not filling out a form.

## Cross-Swarm Context

- **Swarm B** (completed before you): Built 7 narrative analyzers at `src/workshop/scoring/narrativeAnalyzers.ts`. Import and use: `runNarrativeAnalysis()`, `NarrativeArcType`, `NarrativeAnalysisResult`, `EmotionalJourneyAnalysis`. Types at `src/workshop/scoring/narrativeAnalyzerTypes.ts`.
- **Swarm D** (completed before you): Calibrated activity scoring. Scores from `ScoringOrchestratorResult` are reliable — use calibrated scores when weighting story seeds by activity importance.
- **Swarm C** (runs after you): Will optimize token usage. Design your LLM calls with cacheable system prompts (static persona/role at top, dynamic context below).

## Existing Systems to Build On (CRITICAL — Read Before Writing Code)

### Activity Chat (PRIMARY TEMPLATE)
`src/services/portfolioStrategy/services/activityWorkshop/chat/` (9 files, 235KB)

**Proven patterns to reuse**:
1. **ConversationState** — Full state tracking with phase, turns, extracted info, dynamics
2. **7-phase flow**: opening → fact_gathering → story_exploration → meaning_reflection → impact_assessment → connection_mapping → synthesis → complete
3. **5 adaptive modes** with effectiveness tracking: standard, rescue_storytelling, recap_confirmation, targeted_completion, emotional_validation
4. **Response extraction** (Sonnet) — Parses natural language into structured data with confidence scores
5. **Deduplication** — Word overlap >70% = duplicate. Scalar fields keep highest confidence.
6. **Contradiction detection** — Flags inconsistencies for clarification
7. **Re-planning after EVERY turn** — Questions regenerated from current state

**Key types to study**:
```typescript
ConversationState, ConversationPhase, ConversationTrigger,
ConversationDynamics, ConversationMode, AskedQuestion,
ExtractedInformation, ConversationTurn
```

### Story Mining (SEED GENERATOR)
`src/services/storyMining/` (3 files, 32KB)

**3-pass pipeline**: Haiku (extract moments) → Haiku (cluster + score) → Sonnet (rank for prompts)
- Input: Array of activities
- Output: `StorySeed[]` with distinctiveness, reflection depth, emotional core, narrative angles, suggested register
- Cost: ~$0.015 per session
- Methods: `mineStories()`, `deepenSeed()`, `rankForPrompt()`

**Limitation**: One-shot API, no conversation. Good as a helper called during story_discovery phase.

### Voice Profile
`src/services/voiceProfile/` (5 files, 36KB)

Captures: register (primary/secondary), linguistics (sentence length, vocabulary, formality, signature words), personality (energy, humor, directness, emotional openness), authenticPhrases, preservationWarnings.

**Use in brainstorming**: Match question style to student's register. If `quiet_intensity` → slower, reflective questions. If `energetic_enthusiasm` → faster, excited prompts.

### Session Context
`src/services/sessionContext/` — Tracks document state, edit history, last analysis.

### Enhanced Workshop
`src/services/enhancedWorkshop/` — The enhancement orchestrator re-plans after every edit. Use the same pattern: re-plan questions after every brainstorming turn.

## Conversation Philosophy (THIS IS CRITICAL)

The brainstorming conversation is NOT an extraction exercise. It's a **guided discovery** where the student uncovers their own story.

**Principles**:
1. **Start wide, narrow gradually** — First turns explore broadly ("Tell me about something you're proud of"), later turns drill deep ("What were you feeling right before you made that decision?")
2. **Mirror and validate before probing** — After each response, acknowledge what the student said ("It sounds like that was a turning point for you") before asking the next question
3. **Questions should spark reflection, not extract data** — Bad: "What was the outcome?" Good: "Looking back, what surprised you most about how that turned out?"
4. **Offer observations, not just questions** — "The way you describe that moment — there's real tension between wanting to help and feeling overwhelmed. That tension could be the heart of a powerful essay."
5. **Never judge their stories** — "I don't have anything interesting" is extremely common. Every student has compelling stories; the system's job is to find them.
6. **Track what they want to showcase** — The student's intent matters. If they want to show leadership, help them find a story that shows it. Don't redirect to a "better" story they don't connect with.
7. **Consider the AO's perspective** — Would this story be memorable? Could an AO retell it in 30 seconds? Does it reveal something the rest of the application doesn't?

**Example conversation flow**:
```
System: "Let's find your story. Every great essay starts with a moment —
        not a topic, but a specific moment when something shifted for you.
        It could be big or small. What's a moment from the last few years
        that you still think about?"

Student: "Maybe when I started tutoring? I help younger kids with math."

System: "Tutoring — that's a great starting point. I'm curious though:
        was there a specific moment during tutoring that stuck with you?
        Maybe a time when something clicked for a student, or when you
        realized something about yourself?"

Student: "There was this one kid, Marcus. He kept saying he was stupid
         and would never get math. But after a few weeks he solved a
         problem on his own and his face just lit up."

System: "That's a powerful moment — Marcus's face lighting up. I can feel
        the pride in how you describe it. Here's what makes this interesting
        as an essay moment: it's not just about tutoring, it's about believing
        in someone when they've given up on themselves. An AO reading this
        would learn that you see potential in people others have written off.

        Let me ask: what were YOU feeling in that moment? Not about Marcus,
        but about you — what did it make you realize about yourself?"
```

## Brainstorming Conversation Phases (7 phases)

### Phase 1: `welcome` (1-2 turns)
**Goal**: Establish rapport, learn what essay type they're working on, what prompt they're responding to.
**Exit condition**: Essay type + prompt identified.
**Question style**: Warm, low-pressure. "What essay are you working on?"

### Phase 2: `story_discovery` (3-6 turns)
**Goal**: Surface 3-5 candidate stories/moments. Use story mining if activities exist.
**Exit condition**: ≥3 distinct story seeds identified.
**Question style**: Open-ended, exploratory. "Tell me about a moment that changed how you see [X]."
**If student has activities**: Call `storyMiningService.mineStories()` to generate seeds, then explore them conversationally.
**If student has no activities**: Pure conversation — ask about pivotal moments, challenges overcome, passions pursued.

### Phase 3: `tellability` (2-3 turns)
**Goal**: Evaluate each candidate story for tellability (can an AO retell it in 30 seconds?), uniqueness, and depth potential.
**Exit condition**: Top 1-2 stories identified with tellability reasoning.
**Question style**: Evaluative but supportive. "If I had to describe your essay to someone in one sentence, what would I say?"
**Scoring**: Per-seed tellability score (0-10). A tellable story has: a clear protagonist action, stakes, a surprising element or insight, and emotional resonance.

### Phase 4: `deep_dive` (3-5 turns)
**Goal**: Explore the top story deeply — emotions, sensory details, meaning, what was at stake.
**Exit condition**: Rich emotional/sensory profile of the chosen story.
**Question style**: Deep, specific. "Walk me through exactly what happened. What did you see? What did you hear? What were you thinking?"

### Phase 5: `structure_plan` (2-3 turns)
**Goal**: Collaboratively design the narrative arc. Use Swarm B's narrative analysis types.
**Exit condition**: Agreed-upon structure with opening strategy, arc type, and key moments mapped.
**Question style**: Collaborative. "Here are three ways you could open this essay. Which feels most like you?"
**Uses**: `NarrativeArcType` from Swarm B to suggest arc patterns that fit the story.

### Phase 6: `differentiation` (1-2 turns)
**Goal**: Portfolio check — does this story add something new vs other essays?
**Exit condition**: Confirmed unique contribution identified.
**Question style**: Strategic. "Your activities show leadership. Does this essay show a DIFFERENT side of you?"
**Uses**: Existing essay analyses (from annotation pipeline) to check thematic overlap.

### Phase 7: `draft_bridge` (1 turn)
**Goal**: Generate the StoryProfile and present it to the student for review.
**Exit condition**: Student confirms the profile looks right.
**Output**: Full `StoryProfile` object persisted and displayed.

## Phase Transitions

```typescript
interface PhaseTransitionRules {
  welcome: {
    exitWhen: 'essay_type_identified AND prompt_identified';
    maxTurns: 3;
    autoAdvanceAfter: 2;  // Move on even without explicit prompt
  };
  story_discovery: {
    exitWhen: 'seed_count >= 3 OR (seed_count >= 1 AND student_signals_preference)';
    maxTurns: 8;
    autoAdvanceAfter: 6;
  };
  tellability: {
    exitWhen: 'top_seeds_scored AND student_confirms_preference';
    maxTurns: 4;
    autoAdvanceAfter: 3;
  };
  deep_dive: {
    exitWhen: 'emotional_profile_complete AND sensory_details >= 3 AND meaning_identified';
    maxTurns: 6;
    autoAdvanceAfter: 5;
  };
  structure_plan: {
    exitWhen: 'arc_selected AND opening_strategy_chosen AND key_moments_mapped';
    maxTurns: 4;
    autoAdvanceAfter: 3;
  };
  differentiation: {
    exitWhen: 'unique_contribution_confirmed';
    maxTurns: 3;
    autoAdvanceAfter: 2;
  };
  draft_bridge: {
    exitWhen: 'profile_displayed AND student_confirms';
    maxTurns: 2;
    autoAdvanceAfter: 1;
  };
}
```

## Adaptive Modes (5 brainstorming-specific)

```typescript
type BrainstormingMode =
  | 'open_exploration'     // Wide-net discovery, multiple story threads
  | 'moment_deepening'     // Drill into a specific moment (sensory, emotional)
  | 'angle_exploration'    // Multiple framings of the same story
  | 'rescue_reluctance'    // When student says "I don't have anything interesting"
  | 'portfolio_redirect';  // When chosen story overlaps with other essays

// Mode selection logic:
// - Default: open_exploration
// - After student shares a strong moment: moment_deepening
// - After top story identified: angle_exploration
// - If 2+ turns with sparse responses: rescue_reluctance
// - If portfolio overlap detected: portfolio_redirect
```

## StoryProfile Output (feeds downstream)

```typescript
interface StoryProfile {
  id: string;
  userId: string;
  essayType: string;            // 'common_app_1', 'piq_prompt_2', etc.
  prompt: string;               // Full essay prompt text
  createdAt: string;
  updatedAt: string;

  chosenStory: {
    seeds: StorySeed[];         // All discovered seeds (from story mining or conversation)
    selectedSeed: StorySeed;    // The chosen one
    tellabilityScore: number;   // 0-10
    tellabilitySummary: string; // "AO could say: This student believed in a struggling kid when nobody else would."
    emotionalCore: string;      // "The tension between patience and frustration"
    keyMoments: Array<{
      description: string;
      sensoryDetails: string[];
      emotion: string;
      role: 'setup' | 'conflict' | 'turning_point' | 'resolution' | 'reflection';
    }>;
    meaningAndInsight: string;  // What the student learned/realized
    stakesDescription: string;  // What was at risk
  };

  intendedStructure: {
    arcType: NarrativeArcType;  // From Swarm B types
    openingStrategy: 'in_media_res' | 'dialogue' | 'sensory_image' | 'bold_statement' | 'specific_moment';
    structureOutline: Array<{
      section: string;          // "Opening scene", "Flashback", "Turning point", etc.
      paragraphEstimate: number;
      content: string;          // What this section covers
      emotionalTarget: string;  // What the reader should feel
    }>;
    closingStrategy: 'full_circle' | 'reframing' | 'quiet_reflection' | 'forward_looking' | 'concrete_image';
  };

  portfolioContext: {
    themesAlreadyCovered: string[];    // From other essays
    uniqueContribution: string;        // What THIS essay adds
    differentiationScore: number;      // 0-10
    otherEssaySummaries: Array<{ essayType: string; theme: string }>;
  };

  voiceGuidance: {
    suggestedRegister: string;         // From voice profile or discovered in conversation
    authenticPhrases: string[];        // Exact phrases the student used that sound genuine
    avoidPhrases: string[];            // Cliches or inauthentic patterns detected
  };

  draftGuidance: {
    openingSuggestions: string[];      // 2-3 specific opening lines/approaches
    toneNotes: string;                 // "Start anxious, build to determined, end with quiet pride"
    avoidList: string[];               // Topics/angles already saturated in portfolio
    showNotTellOpportunities: string[];// Specific moments to SHOW
    detailsToInclude: string[];        // Specific sensory/emotional details from conversation
  };

  // Metadata
  conversationTurnCount: number;
  discoveredSeedCount: number;
  brainstormDuration: string;         // ISO duration
}
```

## Database Migration

```sql
-- Migration: 20260303000002_add_brainstorming.sql

-- Brainstorming sessions
CREATE TABLE brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,          -- Clerk user ID
  essay_type VARCHAR(50) NOT NULL,
  prompt_text TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, paused, complete
  current_phase VARCHAR(30) NOT NULL DEFAULT 'welcome',
  story_profile JSONB,           -- Final StoryProfile (populated on complete)
  conversation_state JSONB,      -- Full BrainstormConversationState
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Brainstorming conversation turns
CREATE TABLE brainstorm_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  phase VARCHAR(30) NOT NULL,
  system_message TEXT NOT NULL,   -- What we asked/said
  student_response TEXT,          -- What they replied (null for system-only turns)
  extracted_moments JSONB,        -- Moments/seeds extracted from this turn
  mode VARCHAR(30),               -- Which adaptive mode was active
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Story seeds (discovered during brainstorming)
CREATE TABLE brainstorm_seeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  moment TEXT NOT NULL,
  emotional_core TEXT,
  distinctiveness_score INTEGER,  -- 1-10
  tellability_score INTEGER,      -- 1-10
  reflection_depth INTEGER,       -- 1-10
  suggested_register VARCHAR(30),
  narrative_angles TEXT[],
  source_activity_ids UUID[],
  selected BOOLEAN DEFAULT FALSE, -- Was this the chosen seed?
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS policies
ALTER TABLE brainstorm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_seeds ENABLE ROW LEVEL SECURITY;

CREATE POLICY brainstorm_sessions_user ON brainstorm_sessions FOR ALL USING (user_id = auth.uid()::TEXT);
CREATE POLICY brainstorm_turns_user ON brainstorm_turns FOR ALL USING (
  session_id IN (SELECT id FROM brainstorm_sessions WHERE user_id = auth.uid()::TEXT)
);
CREATE POLICY brainstorm_seeds_user ON brainstorm_seeds FOR ALL USING (
  session_id IN (SELECT id FROM brainstorm_sessions WHERE user_id = auth.uid()::TEXT)
);

-- Indexes
CREATE INDEX idx_brainstorm_sessions_user ON brainstorm_sessions(user_id);
CREATE INDEX idx_brainstorm_turns_session ON brainstorm_turns(session_id, turn_number);
CREATE INDEX idx_brainstorm_seeds_session ON brainstorm_seeds(session_id);
```

## API Routes

```typescript
// src/http/brainstormRoutes.ts

// Start a new brainstorming session
POST /api/brainstorm/start
  Body: { essayType: string; promptText?: string; }
  Response: { sessionId: string; openingMessage: string; phase: string; }

// Send a student response and get next system message
POST /api/brainstorm/:sessionId/respond
  Body: { response: string; }
  Response: {
    systemMessage: string;
    phase: string;
    phaseProgress: number;     // 0-1
    discoveredSeeds?: StorySeed[];  // When seeds are found
    phaseTransition?: string;  // If phase changed
  }

// Get discovered story seeds (can be called at any point)
GET /api/brainstorm/:sessionId/seeds
  Response: { seeds: StorySeed[]; selectedSeed?: StorySeed; }

// Explore/deepen a specific seed
POST /api/brainstorm/:sessionId/seeds/:seedId/explore
  Body: { action: 'deepen' | 'reframe' | 'select'; }
  Response: { updatedSeed: StorySeed; systemMessage: string; }

// Get the final story profile (after draft_bridge phase)
GET /api/brainstorm/:sessionId/profile
  Response: { profile: StoryProfile; }

// Get conversation history
GET /api/brainstorm/:sessionId/history
  Response: { turns: BrainstormTurn[]; currentPhase: string; }

// Pause/resume session
POST /api/brainstorm/:sessionId/pause
POST /api/brainstorm/:sessionId/resume
```

## File Structure

```
src/services/brainstorming/
  types.ts                        (NEW, ~400 lines — all interfaces)
  brainstormingService.ts         (NEW, ~300 lines — facade/orchestrator)
  conversationEngine.ts           (NEW, ~600 lines — phase management, turn processing)
  questionGenerator.ts            (NEW, ~400 lines — phase-aware question generation)
  responseProcessor.ts            (NEW, ~300 lines — extract moments/info from responses)
  tellabilityScorer.ts            (NEW, ~200 lines — score seeds for AO retellability)
  portfolioAwareness.ts           (NEW, ~250 lines — cross-essay theme checking)
  storyProfileBuilder.ts          (NEW, ~250 lines — assemble final StoryProfile)
  prompts.ts                      (NEW, ~500 lines — all LLM prompts)
  index.ts                        (NEW — barrel export)

src/http/
  brainstormRoutes.ts             (NEW, ~200 lines — Express routes)

supabase/migrations/
  20260303000002_add_brainstorming.sql  (NEW — DB migration)

tests/
  test-brainstorming-e2e.ts       (NEW, ~300 lines — full conversation E2E)
```

## Agent Decomposition (5 Agents)

### Agent 1: `types-and-infrastructure`
**Role**: Types, interfaces, DB migration, API routes, barrel exports.
**Files owned**:
- `src/services/brainstorming/types.ts`
- `src/services/brainstorming/index.ts`
- `src/http/brainstormRoutes.ts`
- `supabase/migrations/20260303000002_add_brainstorming.sql`

**Key decisions**: Read `StoryProfile` interface above carefully. Read `BrainstormConversationState` from activity chat for reference. Ensure all types are exported cleanly.

### Agent 2: `conversation-engine`
**Role**: Core conversation engine — phase management, turn processing, state transitions, adaptive modes.
**Files owned**:
- `src/services/brainstorming/conversationEngine.ts`
- `src/services/brainstorming/questionGenerator.ts`
- `src/services/brainstorming/responseProcessor.ts`

**Key reference**: Study `src/services/portfolioStrategy/services/activityWorkshop/chat/dynamicConversationEngine.ts` (53KB) and `conversationManager.ts` (26KB) for proven patterns. Reuse: phase transition logic, mode effectiveness tracking, response extraction with confidence scoring, deduplication, contradiction detection.

**Critical**: Questions must be reflective and generative, NOT extractive. See conversation philosophy above. The response processor extracts moments (not profile fields) — a moment is a specific instant with emotions, sensory details, and meaning.

### Agent 3: `story-intelligence`
**Role**: Story mining integration, tellability scoring, portfolio awareness.
**Files owned**:
- `src/services/brainstorming/tellabilityScorer.ts`
- `src/services/brainstorming/portfolioAwareness.ts`

**Tellability scoring criteria** (0-10):
- Clear protagonist action (the student DID something, not just experienced something): 0-2 points
- Stakes (something was at risk, something could have gone differently): 0-2 points
- Surprising element or non-obvious insight: 0-2 points
- Emotional resonance (reader feels something): 0-2 points
- Retellability (can be summarized in 1-2 sentences without losing impact): 0-2 points

**Portfolio awareness**: Read existing essay analyses from the annotation pipeline (if available). Check for thematic overlap. Flag if student's chosen story covers the same ground as another essay.

**Story mining integration**: When student has entered activities, call `storyMiningService.mineStories()` during `story_discovery` phase to generate initial seeds. When student has no activities, rely entirely on conversational discovery.

### Agent 4: `prompts-and-profile`
**Role**: All LLM prompts, StoryProfile builder, draft bridge.
**Files owned**:
- `src/services/brainstorming/prompts.ts`
- `src/services/brainstorming/storyProfileBuilder.ts`

**Prompt design rules**:
1. System prompts should be cacheable (static persona/role at top, dynamic context appended)
2. Use Haiku for quick extraction/classification, Sonnet for nuanced question generation and profile synthesis
3. Include anti-fabrication guard: "All details in the profile must come from the student's own words. Use [brackets] for anything the student hasn't explicitly confirmed."
4. Include voice awareness: If voice profile available, adapt question tone to match student's register

**StoryProfile builder**: Assembles the full profile from conversation state, extracted moments, tellability scores, portfolio context, and structural decisions. This is the bridge between brainstorming and all downstream services.

### Agent 5: `orchestrator-and-tests`
**Role**: The BrainstormingService facade, wire to routes, E2E tests.
**Files owned**:
- `src/services/brainstorming/brainstormingService.ts`
- `tests/test-brainstorming-e2e.ts`

**BrainstormingService** is the public API:
```typescript
class BrainstormingService {
  async startSession(userId: string, essayType: string, promptText?: string): Promise<{ sessionId: string; openingMessage: string }>;
  async processResponse(sessionId: string, response: string): Promise<BrainstormingTurnResult>;
  async getSeeds(sessionId: string): Promise<StorySeed[]>;
  async exploreSeed(sessionId: string, seedId: string, action: 'deepen' | 'reframe' | 'select'): Promise<{ seed: StorySeed; message: string }>;
  async getProfile(sessionId: string): Promise<StoryProfile>;
  async getHistory(sessionId: string): Promise<BrainstormTurn[]>;
  async pauseSession(sessionId: string): Promise<void>;
  async resumeSession(sessionId: string): Promise<{ message: string; phase: string }>;
}
```

**E2E test**: Simulate a full conversation from welcome through draft_bridge. Verify:
1. Phase transitions happen at expected points
2. Seeds are discovered and scored
3. Tellability scorer produces discriminating scores (top seed ≥ 2 points above weakest)
4. StoryProfile is complete and well-formed
5. Portfolio awareness correctly identifies overlap when given mock essay analyses

## Quality Gate

- [ ] Full conversation E2E from welcome to draft_bridge completes successfully
- [ ] Tellability scorer produces discriminating scores (top seed ≥ 2 points above weakest)
- [ ] StoryProfile contains all required fields with non-empty values
- [ ] Portfolio awareness correctly identifies thematic overlap
- [ ] All 7 brainstorming phases transition correctly
- [ ] Adaptive modes activate appropriately (rescue_reluctance after sparse responses)
- [ ] Story mining integration works when activities exist
- [ ] Pure conversational discovery works when no activities exist
- [ ] All prompts use cacheable system prompt pattern
- [ ] DB migration applies cleanly
- [ ] Routes respond correctly (200s for valid requests, 400s for invalid)
- [ ] `npx tsc --noEmit` clean

## Anti-Patterns to Avoid

- Do NOT make the conversation feel like a form — questions should be reflective, not extractive
- Do NOT require activities to exist — brainstorming must work from pure conversation
- Do NOT fabricate details in the StoryProfile — everything must come from student's words
- Do NOT skip tellability scoring — it's the key differentiator from competitors
- Do NOT modify activity chat code — build new service, reference patterns
- Do NOT make StoryProfile optional downstream — it should become the primary context source when available
- Do NOT use only Sonnet — use Haiku for extraction/classification, Sonnet for question generation and synthesis

---

# ════════════════════════════════════════════════════════
# SWARM C: ARCHITECTURE OPTIMIZATION (Phase 3)
# ════════════════════════════════════════════════════════

## Mission

Reduce redundant token usage across the essay analysis pipeline by migrating to the annotation pipeline, consolidating API call patterns, and adding prompt caching where missing. Target: ≥60% token reduction and ≥40% cost reduction for a standard essay analysis.

**Key insight**: The annotation pipeline (`src/pipeline/`) already solves the core problem — single Sonnet call producing all dimension scores. The main work is migrating remaining code paths to use it and cleaning up legacy patterns.

## Cross-Swarm Context

- **Swarm B** (completed): Added 7 deterministic narrative analyzers at `src/workshop/scoring/narrativeAnalyzers.ts`. These are pure code (no LLM), so no token optimization needed. But the annotation pipeline's `promptBuilder.ts` now includes narrative analysis summaries — account for this added context when measuring token usage.
- **Swarm A** (completed): Added brainstorming service at `src/services/brainstorming/`. This service has its own LLM calls (Haiku for extraction, Sonnet for question generation). Include these in your caching strategy. The StoryProfile it produces should be available as context to the annotation pipeline.
- **Swarm D** (completed): Calibrated activity scoring. Activity scoring pipeline is separate and should NOT be modified.

## Current Architecture (CRITICAL — Understand Both Paths)

### OLD PATH (16 Separate Analyzers — LEGACY)
`src/services/unified/features/` — 16 `*_llm.ts` files, each:
- Uses `callClaude()` wrapper (good)
- Has its own system prompt (~600 tokens, cached via `cacheSystemPrompt: true`)
- Sends the **FULL ESSAY TEXT** as user prompt (~1,000-2,000 tokens)
- Returns dimension-specific JSON (~150 tokens output)
- Uses Sonnet 4.5

**Token cost per essay**: ~32,000 input tokens (essay × 16) + ~9,600 system prompt tokens + ~2,400 output tokens = **~44,000 total tokens, ~$0.13-$0.15**

16 dimensions: craftAnalyzer, vulnerabilityAnalyzer, initiativeLeadershipAnalyzer, communityImpactAnalyzer, thematicCoherenceAnalyzer, specificityAnalyzer, contextCircumstancesAnalyzer, intellectualVitalityAnalyzer, fitTrajectoryAnalyzer, voiceStyleAnalyzer, narrativeArcAnalyzer, roleClarityAnalyzer, identityAnalyzer, personalGrowthAnalyzer, roleOwnershipAnalyzer, openingHookAnalyzer.

Orchestrated via `hybridScoringPipeline.ts` with sliding window concurrency (default: 4).

### NEW PATH (Annotation Pipeline — TARGET)
`src/pipeline/` — Single Sonnet call:
- Phase 1-2: Resolve essay profile + extract features (deterministic, <50ms)
- Phase 3: Single Sonnet call with cached system prompt (~3,500 tokens) + essay + features (~2,000 tokens) → annotations (~1,800 tokens output)
- Phase 4: Derive per-dimension scores from annotations + heuristics

**Token cost per essay**: ~7,300 tokens total (first call), ~3,800 tokens (cached calls) = **~$0.02-$0.03**

Routes already defined in `src/http/annotationRoutes.ts`:
- POST `/analyze`, POST `/deep-dive`, POST `/reanalyze`, POST `/batch-activities`

### DIRECT SDK CALLS (14 Files Bypassing callClaude())
Files using `new Anthropic()` directly instead of `callClaude()` wrapper:
1. `src/services/commonAppWorkshop/stage1ConsolidatedService.ts`
2. `src/services/commonAppWorkshop/batchGenerationService.ts`
3. `src/services/commonAppWorkshop/stage0MultiStageService.ts`
4. `src/services/commonAppWorkshop/techniqueSuggestionRouter.ts`
5. `src/services/commonAppWorkshop/typeAwareScoringService.ts`
6. `src/services/commonAppWorkshop/typeSpecificSuggestionService.ts`
7. `src/services/commonAppWorkshop/stage0Service.ts`
8. `src/services/commonAppWorkshop/stage3ConsolidatedService.ts`
9. `src/services/commonAppWorkshop/stage1BDiagnosisService.ts`
10. `src/services/commonAppWorkshop/stage1ATeachingService.ts`
11. `src/services/commonAppWorkshop/haikuDiagnosisService.ts`
12. `src/services/commonAppWorkshop/cacheOptimizationService.ts`
13. `src/services/narrativeWorkshop/` (multiple files)
14. `src/services/piq/` (some files)

**What they miss**: Retry logic, structured error handling, cost tracking, timeout management.

### PROMPT CACHING STATUS
- Annotation pipeline: ✅ System prompt cached
- Unified analyzers: ✅ System prompts cached (but 16 separate cached prompts)
- Common App services: ❌ No caching (direct SDK calls)
- Portfolio analyzers: ❌ No caching on 6 calls
- Enhanced workshop: ✅ Uses callClaude with caching
- Activity scoring: ✅ Caching on nuance calibration + portfolio scoring

## Optimization Strategy

### Priority 1: Migrate Essay Analysis to Annotation Pipeline
The annotation pipeline is complete and production-ready. The main task is:
1. Identify which routes/services still use the old 16-analyzer path
2. Create an adapter that maps annotation pipeline output to the old interface (for backward compatibility)
3. Switch routes to use annotation pipeline
4. Keep old analyzers as fallback only (if annotation pipeline fails)

### Priority 2: Consolidate callClaude() Usage
Migrate all 14 direct `new Anthropic()` calls to use the `callClaude()` wrapper from `src/lib/llm/claude.ts`. This gives:
- Automatic retry on 429/5xx with exponential backoff
- Structured error handling (`ClaudeAPIError`)
- Cost tracking via `calculateCost()`
- Timeout management
- JSON parsing with fallbacks

### Priority 3: Add Prompt Caching Where Missing
For services that already use `callClaude()` but don't pass `cacheSystemPrompt: true`:
- Portfolio analyzers (6 calls)
- Any Common App services after migration to callClaude()
- Any narrative workshop services after migration

### Priority 4: Parallelize Sequential Calls
Where services make sequential LLM calls that could run concurrently:
- Narrative workshop deep-dive analyzers (currently sequential → ~15s, could be ~4s parallel)
- Common App Stage 1A + 1B (currently sequential → ~6s, could be ~3s parallel)

## Agent Decomposition (3 Agents)

### Agent 1: `pipeline-migrator`
**Role**: Migrate remaining essay analysis routes from old 16-analyzer path to annotation pipeline.
**Files owned**:
- `src/services/unified/index.ts` (MODIFY — add annotation pipeline adapter)
- `src/services/unified/annotationPipelineAdapter.ts` (NEW — maps annotation output to old interface)
- Routes that call old analyzers (MODIFY — switch to annotation pipeline)

**Approach**:
1. Read `src/pipeline/types.ts` to understand annotation pipeline output format
2. Read old analyzer output formats from `src/services/unified/features/` types
3. Create adapter that maps `AnnotatedAnalysisResult` → old format
4. Find all routes that call `hybridScoringPipeline` or individual analyzers
5. Switch them to use annotation pipeline with adapter
6. Keep old path as fallback (try annotation pipeline → if fails → fall back to old path)

**Backward compatibility is critical**: Downstream code expects specific interfaces. The adapter must produce identical output shapes.

### Agent 2: `wrapper-consolidator`
**Role**: Migrate all direct `new Anthropic()` calls to `callClaude()` wrapper. Add prompt caching where missing.
**Files owned**:
- All 14 files listed in "Direct SDK Calls" section above
- Any additional files discovered during exploration

**Approach per file**:
1. Find `new Anthropic()` instantiation
2. Replace with `callClaude()` or `callClaudeWithRetry()` from `src/lib/llm/claude.ts`
3. Map existing parameters to callClaude interface:
   - `model` → `model`
   - `system` → `systemPrompt`
   - `messages[0].content` → `userPrompt`
   - `max_tokens` → `maxTokens`
   - Add `cacheSystemPrompt: true` if system prompt is static
   - Add `jsonMode: true` if expecting JSON output
4. Update error handling to use `ClaudeAPIError` pattern
5. Preserve existing functionality exactly — this is a refactor, not a feature change

**IMPORTANT**: Some files may have good reasons for direct SDK usage (e.g., streaming, special parameters). Investigate before blindly converting. If a file uses streaming, keep the direct SDK call but add retry logic manually.

### Agent 3: `performance-optimizer`
**Role**: Parallelize sequential calls, measure token savings, create cost comparison tests.
**Files owned**:
- `src/services/narrativeWorkshop/` (MODIFY — parallelize deep-dive analyzers)
- `src/services/commonAppWorkshop/` (MODIFY — parallelize Stage 1A + 1B where possible)
- `tests/test-token-optimization.ts` (NEW — cost comparison tests)

**Approach**:
1. Identify all sequential LLM call chains that could be parallel
2. Use `Promise.all()` or `batchCallClaude()` for independent calls
3. Measure token usage before/after optimization
4. Create a cost comparison test that runs the same essay through old and new paths and reports:
   - Total input tokens (old vs new)
   - Total output tokens (old vs new)
   - Total cost (old vs new)
   - Latency (old vs new)
   - Score equivalence (within ±0.3 per dimension)

**Cost comparison test structure**:
```typescript
// Test with 3 sample essays of different lengths/types
const testEssays = [
  { text: '...', type: 'common_app_1', expectedWordCount: 650 },
  { text: '...', type: 'piq_prompt_1', expectedWordCount: 350 },
  { text: '...', type: 'narrative_supplement', expectedWordCount: 250 },
];

for (const essay of testEssays) {
  const oldResult = await oldPathAnalyze(essay);
  const newResult = await annotationPipelineAnalyze(essay);

  // Compare scores (within ±0.3)
  // Compare token usage (new should be ≥60% less)
  // Compare cost (new should be ≥40% less)
  // Compare latency (new should be ≥25% faster)
}
```

## Quality Gate

- [ ] Same essay produces equivalent scores (within ±0.3 per dimension) through old and new paths
- [ ] Token usage reduced ≥ 60% for a standard essay analysis (old path → annotation pipeline)
- [ ] Cost reduced ≥ 40% for a standard essay analysis
- [ ] All 14 direct SDK calls migrated to callClaude() (or documented why they can't be)
- [ ] Prompt caching enabled on all eligible system prompts
- [ ] Latency reduced ≥ 25% on parallelized call chains
- [ ] No functionality regression — all existing routes return identical response shapes
- [ ] Old 16-analyzer path retained as fallback (not deleted)
- [ ] Cost comparison test demonstrates savings
- [ ] `npx tsc --noEmit` clean
- [ ] All existing tests pass

## Anti-Patterns to Avoid

- Do NOT delete the old 16-analyzer path — keep as fallback
- Do NOT change response interfaces — use adapters for backward compatibility
- Do NOT merge prompts into one mega-prompt — Tue explicitly wants separate focused prompts
- Do NOT optimize the activity scoring pipeline — that's Swarm D's territory and already optimized
- Do NOT convert streaming calls to non-streaming — if a service streams, keep streaming
- Do NOT skip the cost comparison test — this is how we prove the optimization worked
- Do NOT touch the brainstorming service's LLM calls — they were just built by Swarm A

---

# ════════════════════════════════════════════════════════
# EXECUTION SUMMARY
# ════════════════════════════════════════════════════════

## Execution Order

```
PHASE 1 (parallel):
  ├─ Chat 1: Swarm D (Scoring Calibration) — 3 agents, ~500-800 lines changed
  └─ Chat 2: Swarm B (Narrative Analysis) — 4 agents, ~2,500 lines new

PHASE 2 (after B completes):
  └─ Chat 3: Swarm A (Brainstorming) — 5 agents, ~3,500 lines new + migration

PHASE 3 (after A completes):
  └─ Chat 4: Swarm C (Architecture Optimization) — 3 agents, ~1,000 lines changed
```

## Post-All-Swarms Integration Verification

After all 4 swarms complete, run these integration checks:

1. **Scoring calibration**: `npx tsx tests/test-hybrid-scoring-calibration.ts` + new edge case tests — Research > Grocery, mid-tier spread ≥ 1.5
2. **Narrative analysis**: Run `runNarrativeAnalysis()` on 3 sample essays — verify arc detection, scene/summary ratio, show/tell detection
3. **Brainstorming E2E**: Run `npx tsx tests/test-brainstorming-e2e.ts` — full conversation flow from welcome to StoryProfile
4. **Token optimization**: Run cost comparison test — verify ≥60% token reduction, ≥40% cost reduction
5. **StoryProfile → Annotation Pipeline**: Create a brainstorming session, get StoryProfile, then run annotation pipeline with StoryProfile as context — verify richer annotations
6. **Full pipeline**: Activity scoring → Story mining → Brainstorming → Essay writing → Annotation pipeline → Score derivation — verify all data flows correctly
7. **Type check**: `npx tsc --noEmit` on entire codebase — must be clean

## What to Paste in Each Chat

| Chat | Phase | Paste |
|------|-------|-------|
| Chat 1 | 1 | Swarm D prompt above (from `════ SWARM D ════` to end of section) |
| Chat 2 | 1 (parallel) | Swarm B prompt above |
| Chat 3 | 2 | Swarm A prompt above + "Swarm B exported: `runNarrativeAnalysis()`, `NarrativeArcType`, `NarrativeAnalysisResult`, `EmotionalJourneyAnalysis` from `src/workshop/scoring/narrativeAnalyzerTypes.ts`" + any deviations from plan |
| Chat 4 | 3 | Swarm C prompt above + "Swarm A added brainstorming at `src/services/brainstorming/` with LLM calls in `prompts.ts`" + any deviations from plan |

For Chats 3 and 4, add a brief note about what actually shipped in prior swarms (any interface name changes, file path changes, or architectural deviations from the plan).
