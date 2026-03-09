# Annotation Pipeline Deep Research — Round 3 Synthesis

> 10-agent verification/deepening swarm. This document synthesizes implementation-ready findings.
> Previous rounds: R1 (gap analysis + concept design), R2 (architecture refinement → Master Plan).
> This round: Code-level verification, complete algorithms, word lists, and implementation ordering.

---

## Table of Contents

1. [Plan Validation Report](#1-plan-validation-report)
2. [Prompt Engineering Enhancements](#2-prompt-engineering-enhancements)
3. [Per-Dimension Score Calibration](#3-per-dimension-score-calibration)
4. [Craft Feature Extraction](#4-craft-feature-extraction)
5. [Essay Structure Decomposition](#5-essay-structure-decomposition)
6. [Theme & Insight Analysis](#6-theme--insight-analysis)
7. [Character & Voice Analysis](#7-character--voice-analysis)
8. [Registry Architecture](#8-registry-architecture)
9. [Performance Engineering](#9-performance-engineering)
10. [Implementation Wave Map](#10-implementation-wave-map)

---

## 1. Plan Validation Report

**Agent: plan-validator** | Verified all 16 files against master plan

### Confirmed Correct

All file paths, types, and integration points match the master plan:

- **8 pipeline files** exist with expected interfaces (`AnnotationPipeline.analyze()`, `PromptBuilder.buildPrompt()`, `ScoreDeriver.deriveScores()`, etc.)
- **13 dimension files** registered with weights summing to 1.00
- **7 essay profiles** with expected `dimensionWeightOverrides`, `antiPatterns`, `teachingTone`
- **All "new file" paths** verified non-conflicting (no existing files at those locations)
- **`callClaude()`** signature matches: `{ systemPrompt, userPrompt, model, maxTokens, cacheSystemPrompt }`
- **`ExtractedFeatures`** has 36 fields — `CraftFeatures` will be additive, no conflicts

### Critical Corrections

1. **`buildSummary()` already exists** in `annotationPipeline.ts` (lines 259-307). Plan's `summaryGenerator.ts` is a refactor extraction, not new logic. Implementation should move existing code, not rewrite.

2. **`callClaudeWithRetry()` already exists** in `claude.ts` (line 591) with exponential backoff. Plan's Phase 1A retry logic should use this, NOT reimplement backoff.

3. **`reanalysisService.ts` already does paragraph diffing** (partially). Plan's `paragraphDiffEngine.ts` should enhance existing code, not replace it.

4. **Grammar dimension weight rebalancing** needs explicit math: adding 0.04 weight requires reducing 13 existing dimensions by ~0.003 each. Specific strategy TBD.

5. **`hybridScoringPipeline` is exported but NOT used** by annotation pipeline (intentional — annotation pipeline uses `scoreDeriver` directly).

6. **`macroStrategies.ts` exists** in workshop orchestrator — naming differentiation needed from plan's `strategyRegistry.ts`.

---

## 2. Prompt Engineering Enhancements

**Agent: prompt-engineer** | 4 enhancements designed for `promptBuilder.ts`

### Enhancement 1: Few-Shot Examples (~195 tokens)

**Insertion point:** New method `buildFewShotExamples()` called after `buildSeverityDefinitions()` in static/cacheable section.

**Strength example** — personal statement sensory opening:
```json
{
  "span": { "text": "The moment I lifted the hood, the smell hit me — motor oil, rust, and something my grandfather used to call 'potential.'", "startOffset": 0, "endOffset": 119, "paragraphIndex": 0 },
  "dimensionId": "sensory_detail",
  "severity": "strength",
  "isStrength": true,
  "insight": "This opening earns immediate attention. The unexpected pivot from smell to inherited language ('potential') layers sensory grounding with emotional resonance in one sentence.",
  "suggestion": "This kind of sensory-plus-meaning construction is your strongest tool. Return to it in the closing to create structural echoes.",
  "confidence": 0.92
}
```

**Critical issue example** — activity description tech name-drop:
```json
{
  "span": { "text": "used Python and pandas to analyze the data and made a dashboard", "startOffset": 2, "endOffset": 64, "paragraphIndex": 0 },
  "dimensionId": "specificity",
  "severity": "critical",
  "isStrength": false,
  "insight": "Tool names without context read as filler. Admissions officers ask: what data, what problem, what happened because of your dashboard?",
  "suggestion": "Replace with scale and outcome: 'analyzed 4 years of cafeteria purchase data for 1,200 students, and the dashboard I built led the district to cut food waste by 23%.'",
  "rewriteExample": "Analyzed 4 years of district cafeteria data (1,200 students) to identify peak waste windows; built a scheduling dashboard that reduced food waste 23% in the first semester.",
  "confidence": 0.95
}
```

### Enhancement 2: Response Schema Change

**BREAKING CHANGE:** Response changes from bare JSON array to structured object:

```json
{
  "annotations": [...],
  "structure": {
    "arc": "linear|in_medias_res|circular|montage|zoom_lens|braided",
    "beats": [{"type":"hook","paragraph":0,"quality":"strong"}]
  },
  "contentAnalysis": {
    "showDontTellRatio": 0.65,
    "insightDepth": "observation|connection|revelation",
    "themeOriginality": "cliche_topic|fresh_treatment|wholly_original",
    "characterRevelationPeak": "none|stated_trait|demonstrated_behavior|moment_of_choice|transformation_shown"
  }
}
```

**Parser change required:** `annotationPipeline.ts` `parseAnnotations()` must extract `.annotations` from object instead of treating whole response as array.

### Enhancement 3: Word-Count-Aware Annotation Scaling

```typescript
private resolveAnnotationCount(text: string, config: AnnotationPipelineConfig): { min: number; max: number } {
  const wordCount = text.split(/\s+/).length;
  if (wordCount <= 200) return { min: 4, max: 6 };   // Activity descriptions
  if (wordCount <= 400) return { min: 6, max: 8 };   // PIQ
  if (wordCount <= 650) return { min: 8, max: 12 };  // Personal statement
  return { min: 10, max: 14 };                        // Long form
}
```

### Enhancement 4: Token Budget

- Static additions (few-shot + schema change): ~385 tokens
- Output overhead (structure + contentAnalysis): ~90 tokens
- **Total overhead: ~475 tokens** (within budget)

---

## 3. Per-Dimension Score Calibration

**Agent: score-calibrator** | Read all 13 dimension files, classified each by heuristic confidence

### Dimension Calibration Profiles

| Dimension | Heuristic Confidence | Recommended H/A Weights | Rationale |
|---|---|---|---|
| `word_economy_craft` | STRONG (0.8) | **0.6 / 0.4** | Filler, passive voice, cliché directly measurable |
| `opening_hook_engagement` | STRONG (0.75-0.9) | **0.6 / 0.4** | Weak opening regex reliable |
| `narrative_craft_storytelling` | STRONG (0.6-0.95) | **0.55 / 0.45** | Scene/dialogue detection via regex |
| `structural_coherence_flow` | STRONG (0.65-0.9) | **0.55 / 0.45** | Paragraph count/transitions measurable |
| `closing_impact_resolution` | MODERATE (0.6-0.85) | **0.4 / 0.6** | Asymmetric: weak closings reliable, strong ambiguous |
| `authenticity_specificity_detail` | MODERATE (0.5-0.7) | **0.35 / 0.65** | "Lived experience" needs LLM |
| `emotional_resonance_vulnerability` | MODERATE (0.55-0.75) | **0.35 / 0.65** | Emotion word lists help, authenticity needs LLM |
| `argument_rhetorical_craft` | MODERATE (0.5-0.75) | **0.35 / 0.65** | Claim/evidence counts measurable, quality needs LLM |
| `intellectual_vitality_curiosity` | MODERATE-WEAK (0.5-0.75) | **0.3 / 0.7** | "Ideas as tools" vs name-dropping needs LLM |
| `thematic_depth_reflection` | MODERATE-WEAK (0.5-0.7) | **0.3 / 0.7** | Reflection markers detected, depth needs LLM |
| `growth_transformation_arc` | MODERATE-WEAK (0.5-0.7) | **0.3 / 0.7** | Growth markers detected, arc quality needs LLM |
| `tonal_sophistication` | WEAK (0.5 fixed) | **0.25 / 0.75** | Code says "genuinely hard to assess deterministically" |
| `originality_voice_authenticity` | WEAK (0.45-0.7) | **0.2 / 0.8** | Code says "hardest thing to assess deterministically" |

### Key Design Decisions

1. **Zero-annotation fallback:** When no annotations exist for a dimension → collapse to pure heuristic (1.0 / 0.0)
2. **Linear ramp for annotation count:** If `annotationCount < minAnnotationsForFullWeight`, blend annotation weight down proportionally
3. **New `resolveDimensionCalibration()` method** replaces hardcoded constants

### TypeScript Types

```typescript
interface DimensionCalibration {
  heuristicWeight: number;     // 0-1
  annotationWeight: number;    // 0-1, must sum with heuristicWeight to 1.0
  minAnnotationsForFullWeight?: number;  // Default: 1
}

interface ScoreCalibrationConfig {
  dimensions: Partial<Record<string, DimensionCalibration>>;
}
```

---

## 4. Craft Feature Extraction

**Agent: craft-features-expert** | 1,029 word list entries, 10 detection algorithms

### Complete Word Lists

| Category | Count | Sample |
|---|---|---|
| STRONG_VERBS | ~215 | sprinted, whispered, shattered, carved, ignited, wrestled, lunged, gasped |
| WEAK_VERBS | ~55 | was, were, is, had, got, went, said, made, came, did |
| FILLER_PHRASES | ~44 | "in order to", "the fact that", "it is important to note", "I believe that" |
| SENSORY_WORDS (Sight) | ~100 | gleaming, crimson, shadowy, flickering, luminous |
| SENSORY_WORDS (Sound) | ~85 | whispered, thundered, rustling, crackling, humming |
| SENSORY_WORDS (Touch) | ~65 | rough, silky, scalding, prickly, velvet |
| SENSORY_WORDS (Taste) | ~35 | bitter, tangy, savory, metallic, honeyed |
| SENSORY_WORDS (Smell) | ~35 | musty, fragrant, acrid, pungent, earthy |
| ABSTRACT_WORDS | ~155 | truth, importance, significance, value, meaning, purpose |
| CONCRETE_WORDS | ~210 | table, rain, whisper, brick, cotton, cinnamon |
| ADVERBS_WEAK | ~80 | very, really, quite, somewhat, rather, pretty, just |
| TRANSITION_WORDS | ~70 | furthermore, however, therefore, first, meanwhile |
| **Grand Total** | **~1,029** | |

### Top 10 Craft Detection Algorithms

1. **sentenceRhythm** — Length variance + deliberate short-long-short pattern detection
2. **openingType** — 7-type classifier (sensory_scene, in_medias_res, dialogue, provocative, question, context, quote_definition)
3. **closingType** — 6-type classifier (circular, forward_looking, resonant_image, question, recontextualization, summary)
4. **verbStrength** — Strong/weak verb ratio per paragraph
5. **concreteAbstractRatio** — Concrete vs abstract word density
6. **showDontTellRatio** — (Covered in Section 6)
7. **emotionalArcTracker** — Per-paragraph emotional intensity via word lists
8. **dialogueQuality** — Presence, naturalness (no "I said"), integration with narrative
9. **specificityScore** — Named entities, numbers, proper nouns, concrete details density
10. **redundancyScore** — Repeated content words within 3-sentence window / total content words

### Integration Strategy

**Parallel module** (not extends/wraps): `craftFeatureExtractor.extract(text)` runs alongside existing `featureExtractor.extract(text)`. Results merged in pipeline.

**New file:** `src/workshop/scoring/craftFeatures.ts` (~400 lines)

---

## 5. Essay Structure Decomposition

**Agent: structure-detective** | Complete TypeScript implementation (~450 lines)

### Files Designed

- `src/pipeline/structureTypes.ts` (~80 lines) — Types
- `src/pipeline/structureAnalyzer.ts` (~350 lines) — Implementation

### 6 Arc Detection Functions

| Arc | Detection Method | Score Formula |
|---|---|---|
| **LINEAR** | Temporal markers in order, chronological paragraph ordering | `ordered_temporal / total_paragraphs`, penalize non-sequential |
| **IN_MEDIAS_RES** | Action verb in first 10 words, tense shift in paragraph 2+ | `action_opening * 0.6 + context_shift * 0.4` |
| **CIRCULAR** | Content word overlap between first/last paragraphs, repeated phrases | `word_overlap * 0.5 + repeated_phrases * 0.5` |
| **MONTAGE** | Topic shifts (overlap < 0.3), length variance, thematic thread | `shifts * 0.4 + variance * 0.3 + thread * 0.3` |
| **ZOOM_LENS** | Concrete→abstract gradient, sensory opening, abstract closing | `gradient * 0.6 + opening_concrete * 0.2 + closing_abstract * 0.2` |
| **BRAIDED** | A-B-A-B alternating topics, convergence in final paragraph | `alternation * 0.5 + convergence * 0.5` |

### 10 Beat Types

`hook`, `setup`, `inciting`, `rising`, `pivot`, `reflection`, `resolution`, `connection`, `callback`, `coda`

Each with: regex patterns, position constraints (e.g., HOOK must be paragraph 0), required beats per arc type mapping.

### Structure Score Formula

`30% arc_confidence + 50% beat_quality + 20% pacing - penalties`

Where pacing = front_loaded | balanced | back_loaded.

---

## 6. Theme & Insight Analysis

**Agent: theme-insight-expert** | 4 complete algorithm implementations

### 6.1 Show-Don't-Tell Ratio

- **70+ TELLING_MARKERS:** "I learned", "I realized", "taught me that", "showed me the importance", "I understood", "I felt [adjective]", "I was [emotion]", "the value of", "the significance of", etc.
- **SHOWING_MARKERS:** Sensory action verbs + specific detail patterns + dialogue
- **Formula:** `showingMarkers / (showingMarkers + tellingMarkers * 3)`
- **Score bands:** 0.0-0.3 → heavy_telling, 0.3-0.5 → mixed, 0.5-0.7 → balanced, 0.7-0.85 → strong_showing, 0.85+ → masterful
- **Per-paragraph breakdown** for targeted feedback

### 6.2 Cliché Theme Detection (15 themes)

Complete themes with keywords (10+ per theme), thresholds, and anti-patterns:

`sports_injury`, `volunteer_trip`, `immigrant_struggle`, `dead_relative`, `competition_win`, `divorce_hardship`, `pet_death`, `first_generation`, `summer_camp`, `moving_schools`, `debate_team`, `pandemic_essay`, `mental_health_generic`, `learning_disability`, `big_game`

**Freshness scoring** — 4 signals:
1. `specificSensoryDetail` — Sensory words in same paragraph as theme keywords
2. `unexpectedAngle` — Subversion/contrast markers near theme keywords
3. `selfAwareness` — Meta-awareness phrases ("I know this sounds like...", "Unlike the typical...")
4. `narrativeSubversion` — Unexpected turns or reversals

**Freshness levels:** cliché (0-1 signals), familiar_but_fresh (2), original (3+ or no cliché detected)

### 6.3 Insight Depth Scorer (6 levels)

| Level | Name | Score Range | Detection |
|---|---|---|---|
| 0 | none | 0-15 | No reflection markers in final 25% |
| 1 | cliché | 15-30 | Matches 40+ CLICHE_INSIGHTS ("hard work pays off", "value of teamwork") |
| 2 | observation | 30-50 | Reflection present but surface-level |
| 3 | understanding | 50-70 | Specific cause-effect reasoning |
| 4 | connection | 70-85 | Links experience to broader meaning |
| 5 | wisdom | 85-100 | Surprise + behavior change + earned insight |

- **40+ CLICHE_INSIGHTS** blacklist
- **30+ REFLECTION_PHRASES** detection
- **WISDOM_INDICATORS** for highest-level detection
- **Focus on final 25% of essay** (where insights naturally concentrate)

### 6.4 Thematic Coherence

- **Paragraph content word extraction** (nouns + verbs + adjectives, stop words removed)
- **100+ STOP_WORDS** list
- **Local coherence:** Adjacent paragraph keyword overlap (Jaccard similarity)
- **Global coherence:** Each paragraph vs essay-wide keyword set
- **Tangent detection:** Paragraphs with <20% overlap with global keywords
- **Score: 0-100** (local 60% + global 40%)

---

## 7. Character & Voice Analysis

**Agent: character-voice-expert** | 4 algorithm systems

### 7.1 Character Revelation Hierarchy (7 levels)

| Level | Name | Detection | Strength |
|---|---|---|---|
| 7 | **embodied_experience** | 82 PHYSICAL_SENSATION_WORDS + emotion | Strongest |
| 6 | **moment_of_choice** | MOMENT_OF_CHOICE_PATTERNS ("I could have... but") | Very strong |
| 5 | **internal_process** | INTERNAL_PROCESS_PATTERNS ("I wondered", "I questioned") | Strong |
| 4 | **specific_detail** | Specificity score > 0.7 | Moderate |
| 3 | **action_description** | Action verb density > 0.3 | Moderate |
| 2 | **others_testimony** | "my teacher said", "my friend told" patterns | Weak |
| 1 | **direct_statement** | "I am a...", "I have always been..." | Weakest |

### 7.2 Growth Arc Detection

- **35+ BEFORE_STATE_MARKERS:** "I used to", "before that", "growing up I always"
- **44+ CHANGE_CATALYST_MARKERS:** "everything changed when", "the turning point", "I realized"
- **43+ AFTER_STATE_MARKERS:** "now I", "since then", "I've come to"
- **Arc completeness score:** All 3 phases present = complete, missing any = incomplete

### 7.3 Voice Consistency

- **Per-paragraph profiling:** formality level, emotional intensity, complexity
- **Adult voice detection:** 2σ threshold — if any paragraph deviates >2σ from the mean, flag as potential "parent/counselor wrote this" signal
- **Consistency score:** 1 - (max_deviation / range) across all paragraphs

### 7.4 Vulnerability Calibration

- **TOO_LITTLE markers:** emotional avoidance, deflection, humor as shield
- **RIGHT_AMOUNT markers:** appropriate self-reflection, earned vulnerability
- **TOO_MUCH markers:** trauma dumping, graphic detail, excessive self-pity
- **Sweet spot:** score 50-80 (appropriately_vulnerable band)
- **Bands:** too_guarded (0-30), cautiously_open (30-50), appropriately_vulnerable (50-80), deeply_vulnerable (80-90), oversharing (90-100)

### Overall Character Score

**35% revelation + 30% growth + 20% voice + 15% vulnerability**

---

## 8. Registry Architecture

**Agent: registry-architect** | 3 registries + 30 manifests (79,316 chars of complete designs)

All registries follow the existing `dimensionRegistry` self-registering pattern: `Map<string, Manifest>` singleton, `register()` at module scope, `autoImport()` with glob for `*.{type}.ts` files, `_reset()` for tests.

### 8.1 WritingStrategyRegistry

**File:** `src/workshop/registry/strategyRegistry.ts`

**Type:** `StrategyManifest { id, displayName, description, bestFor: WorkshopEssayType[], detection: { signals, threshold }, teaching: { explanation, howToUse, pitfalls }, examples: { title, excerpt, analysis }[] }`

**5 Strategy Manifests** (each ~80-120 lines with complete content):

| Strategy | Best For | Key Detection Signals |
|---|---|---|
| `montage_technique` | Personal statement, UC PIQ, Identity | Multiple scene breaks, 3+ settings, no explicit transitions |
| `zoom_lens` | Personal statement, Challenge, Community | Broad opening → single micro-moment, increasing sensory density |
| `bracket_structure` | Personal statement, UC PIQ, Challenge | Closing echoes opening imagery, same frame with new meaning |
| `extended_metaphor` | Personal statement, Intellectual, Identity | Vocabulary from single domain threads throughout all paragraphs |
| `in_medias_res` | Personal statement, Challenge, Community | Action verb opening, tense shift to past, delayed context establishment |

Each manifest includes: 2 complete before/after examples with analysis, 5 pitfalls, complete teaching content with mentor voice.

### 8.2 EssayPatternRegistry

**File:** `src/workshop/registry/patternRegistry.ts`

**Type:** `PatternManifest { id, category: 'opening'|'transition'|'closing'|'technique', displayName, detection: RegExp | ((text) => boolean), teaching, beforeAfter: { before, after } }`

**10 Pattern Manifests:**

| Category | Pattern | Detection Method |
|---|---|---|
| Opening | `sensory_scene_opening` | First sentence contains 2+ sensory words from SENSORY_WORDS set |
| Opening | `dialogue_hook_opening` | First paragraph opens with direct speech (quotation marks in first sentence) |
| Opening | `in_medias_res_opening` | Action verb in first 5 words + present tense or past progressive |
| Transition | `bridge_sentence` | Sentence spanning paragraphs that contains both a backward-referencing clause and forward motion |
| Transition | `thematic_echo` | Key content word from an earlier paragraph reappears with changed meaning |
| Closing | `circular_return` | 3+ content words from paragraph 0 reappear in final paragraph |
| Closing | `forward_looking` | Future tense markers in final 2 sentences |
| Closing | `resonant_image` | Final sentence contains 2+ sensory/concrete words with no abstract nouns |
| Technique | `show_dont_tell` | Scene with sensory detail + action verbs + no explicit emotion labeling |
| Technique | `specific_detail_window` | Named entities, precise numbers, or proper nouns in a descriptive passage |

### 8.3 QualitySignalRegistry

**File:** `src/workshop/registry/signalRegistry.ts`

**Type:** `QualitySignalManifest { id, dimensionId, displayName, compute: (features, text) => number, weight }`

**15 Signal Manifests:**

| Signal | Feeds Dimension | Compute Logic |
|---|---|---|
| `thematic_depth` | thematic_depth_reflection | Keyword overlap coherence + insight depth score |
| `show_dont_tell` | narrative_craft_storytelling | Showing/telling marker ratio |
| `thematic_originality` | originality_voice_authenticity | Cliché theme detection + freshness scoring |
| `character_revelation` | authenticity_specificity_detail | 7-level hierarchy score |
| `growth_arc` | growth_transformation_arc | Before/catalyst/after completeness |
| `insight_depth` | thematic_depth_reflection | 6-level insight scorer |
| `insight_uniqueness` | originality_voice_authenticity | Cliché insight blacklist match |
| `sentence_rhythm` | narrative_craft_storytelling | Length variance + pattern detection |
| `voice_consistency` | tonal_sophistication | Per-paragraph deviation analysis |
| `opening_impact` | opening_hook_engagement | Opening type classifier + sensory density |
| `closing_resonance` | closing_impact_resolution | Closing type + circular/image callback |
| `transition_quality` | structural_coherence_flow | Bridge sentences + thematic echo density |
| `word_precision` | word_economy_craft | Strong/weak verb ratio + filler phrase density |
| `concrete_detail_density` | authenticity_specificity_detail | Concrete/abstract word ratio |
| `vulnerability_calibration` | emotional_resonance_vulnerability | Sweet spot 50-80 scoring |

**Full registry-architect findings** (79,316 chars with all manifest content): `/tmp/r3-registry-architect-redo.md`

---

## 9. Performance Engineering

**Agent: perf-engineer** | Streaming SSE + paragraph diff engine

### 9.1 Streaming SSE Pipeline

**New file:** `src/pipeline/streamingPipeline.ts` (~250 lines)

**SSE Event Types:**
```
{ type: 'scores', data: heuristicScores }        // Phase 1+2 results (~100ms)
{ type: 'annotation', data: singleAnnotation }    // Per-annotation as parsed (~3-5s)
{ type: 'complete', data: fullAnalysisResult }     // Final scores + summary
{ type: 'error', data: { message, phase } }        // Error at any phase
```

**Key design decisions:**
- Uses Anthropic SDK streaming (`stream: true`) — requires new `callClaudeStreaming()` function
- Partial JSON extraction from streaming response (accumulate text, try-parse incrementally)
- Express SSE setup with `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- Client reconnection via `Last-Event-ID` header

**New API endpoint:** `POST /api/v1/annotate/analyze/stream`

### 9.2 Paragraph Diff Engine

**New file:** `src/pipeline/paragraphDiffEngine.ts` (~200 lines)

**Algorithm:**
1. Split both old and new text into paragraphs
2. Hash each paragraph (SHA-256)
3. **3-pass matching:**
   - Pass 1: Exact hash match → preserved (O(1) lookup)
   - Pass 2: Jaccard similarity > 0.6 → modified
   - Pass 3: Unmatched → added/deleted
4. Recalculate offsets for preserved annotations

**Estimated savings:** 30-50% cost reduction on re-analysis (only send changed paragraphs to LLM)

### 9.3 Prompt Caching Strategy

**3-tier system:**
- **Tier 1 (Static, ~800 tokens):** Role definition, dimension reference, annotation schema, severity guide, few-shot examples — cached across ALL essay types
- **Tier 2 (Essay-type, ~300 tokens):** Profile block, teaching tone, anti-patterns — cached per essay type
- **Tier 3 (Dynamic, ~200 tokens):** Essay text, features, expertise context — per-request

**Cache hit prediction:** After first call per essay type, ~70% of system prompt hits cache → ~40% input cost reduction.

### 9.4 React Hook

**New file:** `src/hooks/useStreamingAnalysis.ts` (~120 lines)

```typescript
function useStreamingAnalysis() {
  return {
    analyze: (text, config) => void,
    annotations: EssayAnnotation[],          // Incrementally populated
    scores: DerivedDimensionScore[] | null,   // Available early
    result: AnnotatedAnalysisResult | null,   // Final complete result
    phase: 'idle' | 'scoring' | 'annotating' | 'complete' | 'error',
    error: Error | null,
  };
}
```

Uses `fetch()` + `ReadableStream` for SSE consumption.

---

## 10. Implementation Wave Map

**Agent: implementation-planner** | File-by-file build order with dependencies

### Wave Overview

| Wave | Name | New Files | Modified Files | Dependencies | Risk |
|---|---|---|---|---|---|
| **1A** | Foundation Types | 0 | 1 (+80 lines to types.ts) | None | LOW |
| **1B** | Score Calibration + Summary + Roadmap | 2 | 2 | 1A | MEDIUM |
| **1C** | Prompt Enhancements | 0 | 1 (+150 lines to promptBuilder.ts) | 1A | LOW |
| **1D** | Craft Features | 1 | 2 | 1A | MEDIUM |
| **2A** | Structure Analyzer | 2 | 3 | 1A, 1D | MEDIUM |
| **2B** | Theme + Insight | 2 | 2 | 1A, 1D | LOW-MED |
| **2C** | Character + Voice | 1 | 2 | 1A, 1D | LOW-MED |
| **2D** | Prompt Builder V2 | 0 | 1 (+100 lines) | 2A, 2B, 2C | MEDIUM |
| **3A** | Registry Infrastructure | 6 | 2 | 1A | LOW |
| **3B** | Strategy Manifests (5) | 5 | 0 | 3A | LOW |
| **3C** | Pattern Manifests (10) | 10 | 0 | 3A | LOW |
| **3D** | Signal Manifests (15) | 15 | 0 | 3A | LOW |
| **3E** | Registry Integration | 0 | 3 | 3A-3D | HIGH |
| **3F** | Grammar Dimension | 2 | ~14 (weight rebalance) | 3A | MEDIUM |
| **4A** | Streaming SSE | 2 | 1 | 1A-1D | HIGH |
| **4B** | Paragraph Diff Engine | 1 | 1 | 1A | LOW |

### Parallel Execution Map

```
Wave 1A (Types) ──── Must complete first

Wave 1B ─────────┐
Wave 1C ─────────┤── PARALLEL (all depend on 1A)
Wave 1D ─────────┘

Wave 2A ─────────┐
Wave 2B ─────────┤── PARALLEL (all depend on 1A + 1D)
Wave 2C ─────────┘

Wave 2D ─────────── Must wait for 2A + 2B + 2C

Wave 3A ─────────── Can start after 1A (parallel with Wave 2)

Wave 3B ─────────┐
Wave 3C ─────────┤── PARALLEL (all depend on 3A)
Wave 3D ─────────┘

Wave 3E ─────────── Must wait for 3A-3D
Wave 3F ─────────── Parallel with 3E (depends on 3A)

Wave 4A ─────────── Can start after 1A-1D
Wave 4B ─────────── Can start after 1A (independent)
```

### Optimal 8-Agent Swarm Composition

| Agent | Owns | Track |
|---|---|---|
| **Lead** | Wave 1A types, final integration | Coordinator |
| **Score-Calibrator** | Wave 1B (summary + calibration) | Track A |
| **Prompt-Architect** | Wave 1C + 2D | Track B |
| **Craft-Features** | Wave 1D (craftFeatures.ts) | Track C |
| **Structure-Detective** | Wave 2A | Track A (after 1B) |
| **Theme-Insight** | Wave 2B | Track B (after 1C) |
| **Character-Voice** | Wave 2C | Track C (after 1D) |
| **Registry-Architect** | Wave 3A + 3B + 3C + 3D + 3F | Track D |
| **Perf-Engineer** | Wave 4A + 4B | Track E |

### Quality Gates

| Gate | After | Criteria |
|---|---|---|
| 1 | Wave 1A | `npx tsc --noEmit` passes, all new types complete |
| 2 | Wave 1B-1D | Craft features test passes, summary generates non-empty, prompt <2000 tokens |
| 3 | Wave 2A-2C | All analyzer tests pass, structure arc correct on 5 test essays, Phase 2 <200ms |
| 4 | Wave 2D | 10 test essays through updated pipeline, annotation quality improvement measurable |
| 5 | Wave 3A-3D | All 5 strategies + 10 patterns + 15 signals registered, `tsc` passes |
| 6 | Wave 3E-3F | 14 dims sum to 1.00, deep dive uses patterns, signals don't break 0-100 range |
| 7 | Wave 4A-4B | SSE delivers first annotation <3s, diff engine correct on 10 edge cases |

### Total Scope

- **New files:** ~53 (8 pipeline + 3 performance + 1 craft + 6 registry infra + 5 strategies + 10 patterns + 15 signals + 1 grammar + 4 tests)
- **Modified files:** ~10 (types.ts, annotationPipeline.ts, promptBuilder.ts, scoreDeriver.ts, deepDiveService.ts, reanalysisService.ts, shared/types.ts, featureExtractor.ts, workshop/index.ts, annotationRoutes.ts)
- **Estimated new code:** ~6,500-8,000 lines
- **Estimated modifications:** ~450-600 lines added to existing files
- **Test files:** 8 new (~60-100 lines each)

---

## Appendix A: Cross-Agent Findings Summary

### Agreements Across All Agents

1. **V1 pipeline is solid foundation** — All agents confirmed the architecture is sound
2. **Per-dimension calibration is highest-priority fix** — Hardcoded 40/60 is a known deficiency
3. **Craft features as parallel module** — All agents agreed on additive approach (not wrapping)
4. **Self-registering manifest pattern** — Follow existing dimensionRegistry pattern exactly
5. **Feature flags for risky changes** — Wave 3E (registry integration) and 4A (streaming) need flags

### Disagreements / Open Questions

1. **Response schema change timing:** Prompt engineer wants it in Wave 1C; implementation planner puts it in Wave 2D. **Resolution:** Wave 1C adds structure/contentAnalysis to schema, Wave 2D populates with heuristic data
2. **Grammar dimension weight redistribution:** Exact rebalancing strategy TBD (plan-validator flagged, no agent resolved)
3. **Registry signal composition in scoreDeriver:** How signals compose into dimension scores needs more design (flagged as HIGH risk)

---

## Appendix B: Complete Word Lists Reference

Full word lists are available in the craft-features-expert findings at `/tmp/r3-craft-features-expert.md` (25,255 chars). Key counts:

- STRONG_VERBS: 215 words
- SENSORY_WORDS: 320 words (5 categories)
- CONCRETE_WORDS: 210 words
- ABSTRACT_WORDS: 155 words
- Total: 1,029 entries

---

*Generated from Round 3 of 10-agent research swarms. See also:*
- *`docs/ANNOTATION_PIPELINE_DEEP_RESEARCH_R1.md` — Round 1 gap analysis + concept designs*
- *`docs/ANNOTATION_PIPELINE_MASTER_PLAN.md` — Authoritative implementation plan*
