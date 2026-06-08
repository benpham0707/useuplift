# FORGE PLAN: Workshop Absorption into Essay Intelligence

**Date**: 2026-04-03
**Scope**: Absorb battle-tested content from Common App Workshop (112 files), PIQ Workshop (25+ files), Narrative Workshop (60+ files) into the Essay Intelligence pipeline.

---

## The Problem

Essay Intelligence has a world-class understanding pipeline (L1-L6) but generates all teaching content, technique suggestions, and college-specific guidance FROM SCRATCH every time. Meanwhile, three mature workshop systems contain:

- **62 curated before/after transformation examples** (unused by Essay Intelligence)
- **105 issue detection patterns** (zero reaching L3.5 analysis)
- **13 narrative strategies** (completely dark)
- **6 writing principles with reader-effect explanations** (partially connected, heavily truncated)
- **13 schools of deep college research** (99% data loss at the thin overlay)
- **8 prompt-specific weight profiles** (unused)
- **Socratic question banks per college** (unused)
- **33 telling phrase detection patterns** (free detection, zero LLM cost)

The result: coaching says "try showing not telling" when it could say "here's exactly what physical vulnerability looks like in a leadership essay, with a before/after, backed by a Stanford dean quote."

---

## Architecture: 3 Waves

### Wave 1: Teaching Content Pipeline (highest impact, lowest risk)
Unblock the curated teaching content that already exists but doesn't reach prompts.

### Wave 2: Detection & Rubric Enhancement (highest analytical impact)
Make the analysis pass essay-type-aware and pattern-informed.

### Wave 3: Deep College Intelligence (highest differentiation)
Replace the thin 300-token overlay with structured, rich college context.

---

## Wave 1: Teaching Content Pipeline

### 1A. Untruncate Technique Enrichment

**Current**: `routeFindingToEnrichedTechnique()` in coachingService.ts truncates technique bundles to ~200 chars and transformation examples to 120+150 chars. Only 1 example per match.

**Target**: Full technique teaching content when a finding matches. WHY (all core principles), HOW (whenToUse, integrationTips, antiPatterns), and 2 transformation examples (untruncated).

**Implementation**:
- Modify `routeFindingToEnrichedTechnique()` in coachingService.ts
- Remove the `.slice(0, 200)` and `.slice(0, 120)` truncations
- Include top 2 transformations per match (not just first)
- Add `whenToAvoid` to prevent inappropriate technique suggestions
- Token impact: +200-400 tokens per matched finding (within budget since cache prefix absorbs most)

### 1B. Inject PIQ Teaching Examples into Coaching

**Current**: 21 PIQ teaching example pairs (hooks, vulnerability, arc, specificity) are completely dark — imported nowhere in Essay Intelligence.

**Target**: When a finding matches a PIQ issue type (e.g., "manufactured vulnerability", "no turning point", "missing sensory details"), inject the corresponding weak-to-strong example pair.

**Implementation**:
- New function: `matchTeachingExample(findingClaim, dimension)` in a new `teachingContentRouter.ts`
- Lazy-imports `TEACHING_EXAMPLES` from `src/services/piq/teachingExamples.ts`
- Matches by `issueType` keyword against finding claim + dimension tag
- Returns the best matching example pair with its `principle` and `diffHighlights`
- Integration: called from the coaching prompt assembly in `buildCoachingPrompt()` → injected alongside technique enrichment

### 1C. Inject Narrative Strategies into L5 Annotations

**Current**: L5 ACTION annotations generate rewrite examples from scratch. No curated strategy options.

**Target**: When L5 produces an ACTION annotation, include a matched narrative strategy (from 13 available) with instruction + example concept.

**Implementation**:
- New function: `matchNarrativeStrategy(annotationType, paragraphRole, phase)` in `teachingContentRouter.ts`
- Lazy-imports strategies from `src/services/narrativeWorkshop/strategies.ts`
- Matches by `rubric_affinity` against annotation context (opening → In Media Res/Sensory Anchor; emotional → Internal Monologue; etc.)
- Selects 2 matching + 1 wildcard (existing `getStrategiesForCategory()` logic)
- Integration: injected into L5 annotation prompt as "SUGGESTED CRAFT STRATEGIES" section

### 1D. Inject Surgical Examples into L5 Rewrite Calibration

**Current**: L5 ACTION annotation rewriteExamples are invented from scratch.

**Target**: When L5 generates a rewrite, include 1 matched surgical example (from 12 gold-standard) as a calibration anchor.

**Implementation**:
- Match by `rubricCategory` + `symptomTags` against the annotation's finding
- Inject as: "CALIBRATION EXAMPLE (gold standard transformation for this type of issue): [original] → [fix] because [rationale]"
- Token cost: ~150-200 tokens per ACTION annotation

### 1E. Telling Phrase Detection (Zero LLM Cost)

**Current**: No pre-scan for common telling phrases.

**Target**: Before coaching or annotation, scan paragraph text against 33 pre-compiled TELLING_PHRASE_PATTERNS. When matched, auto-inject the corresponding transformation example.

**Implementation**:
- Import `TELLING_PHRASE_PATTERNS` and `findExampleMatchingPhrase()` from `transformationExamples.ts`
- Run pattern scan on essay text during context assembly (pure string matching, zero LLM cost)
- Matched patterns trigger targeted example injection into coaching/annotation prompts
- Integration: in `essayCoachingRoutes.ts` during context assembly, or in `promptBlocks.ts` during block composition

### 1F. New File: Teaching Content Router

**File**: `src/services/essayIntelligence/coaching/teachingContentRouter.ts`

This is the central routing module that all teaching content flows through:

```typescript
interface TeachingContentMatch {
  source: 'technique_bundle' | 'piq_example' | 'narrative_strategy' | 'surgical_example' | 'telling_phrase';
  content: string;       // Formatted for prompt injection
  tokenEstimate: number; // For budget tracking
  relevance: number;     // 0-1 match quality
}

// Returns top-N teaching content matches for a given finding/annotation context
async function routeTeachingContent(context: {
  findingClaim?: string;
  dimension?: string;
  paragraphRole?: string;
  essayType?: string;
  phase?: string;
  paragraphText?: string;
  annotationType?: string;
  maxTokens?: number;
}): Promise<TeachingContentMatch[]>
```

Lazy-loads from all source modules. Caches after first load. Returns ranked matches within token budget.

---

## Wave 2: Detection & Rubric Enhancement

### 2A. Pre-Analysis Issue Scanner (NEW — Haiku, parallel with L3.75)

**Current**: L3.5 analyzes per-paragraph but can't detect essay-level structural patterns (vulnerability dump ratios, over-narration balance, swap test failure, AI pattern density).

**Target**: Single Haiku call before L3.5 that scans for 12-15 structural/essay-level patterns.

**Implementation**:
- New file: `src/services/essayIntelligence/analysis/issueScanner.ts`
- Runs parallel with L3.75 (zero latency impact)
- Input: full essay text + essay type
- Detects: VULNERABILITY_DUMP (>50% problem / <30% response), OVER_NARRATED (>60% narrative / <15% evidence), SWAP_TEST_FAIL (no school-specific details in supplement), AI_PATTERNS (density check), ESSAY_SPEAK_HEAVY (3+ template phrases), ONE_SIDED_FIT, JUST_DESCRIBING (no reflection), vulnerability/response ratio
- Output: `IssueScanResult { patterns: Array<{ id, severity, evidence, location }> }`
- Cost: ~$0.003 (Haiku, ~1500 input + 300 output tokens)
- Integration: results appended to L3.5 profile context as "PRE-ANALYSIS FLAGS"

### 2B. Essay-Type-Aware Analysis Pass

**Current**: L3.5 `buildSystemPrompt()` uses identical evaluation criteria regardless of essay type. A UC PIQ gets the same scoring as a Stanford supplement.

**Target**: Inject essay-type-specific evaluation lens (~300-500 tokens) into L3.5 system prompt.

**Implementation**:
- New file: `src/services/essayIntelligence/analysis/essayTypeCalibrator.ts`
- Lazy-imports calibration profiles from `src/services/narrativeWorkshop/essayTypeCalibration.ts` and weight profiles from `src/services/piq/weights/dimensionWeights.ts`
- Builds a compact ~300-500 token "TYPE-SPECIFIC EVALUATION LENS" containing:
  - Dimension weight adjustments for this type
  - Top 5 critical detection patterns for this type (from unified registry)
  - 2-3 red flag signals specific to this type
  - Scoring notes (tier descriptions from calibration profiles)
- Injected into L3.5 Block 1 (system prompt) — cached across all paragraph calls
- Token overhead: ~300-500 tokens (cached, one-time cost ~$0.002)

### 2C. Unified Pattern Registry

**Current**: 105 patterns scattered across 3 files with significant overlap.

**Target**: Single queryable registry that deduplicates, organizes by essay type, and returns top-N patterns.

**Implementation**:
- New file: `src/services/essayIntelligence/analysis/patternRegistry.ts`
- Merges patterns from:
  - `commonAppWorkshop/rubrics/issueDetectionPatterns.ts` (38 patterns)
  - `piq/issuePatterns.ts` (42 patterns)
  - `narrativeWorkshop/narrativePatterns.ts` (25 patterns)
- Deduplication map (6 known overlaps → merge to canonical):
  - GENERIC_ORIGIN_STORY = opening_generic_since_childhood = hook-weak-generic
  - NO_NUMBERS = spec-no-numbers
  - AI_PATTERNS = voice-sounds-like-ai
  - ESSAY_SPEAK_HEAVY = voice-essay-speak
  - STATED_NOT_SHOWN = show_telling_traits
  - GENERIC_LESSONS = reflect-generic-lessons = interiority_surface_reflection
- Result: ~60 unique patterns, each with: id, name, severity, essayTypes[], detectionPhrases[], before/after example, fix strategies

### 2D. Phase Assessment Type Calibration

**Current**: Phase assessment receives `essayType` but the prompt doesn't use type-specific expectations.

**Target**: Inject essay type scoring notes so "architecture phase" means different things for Why Us vs Personal Statement.

**Implementation**:
- Modify `phaseAssessment.ts` `buildPhaseSystemPrompt()` to include type-specific scoring notes from `essayTypeCalibration.ts`
- Token overhead: ~200-300 tokens (within existing prompt budget)

---

## Wave 3: Deep College Intelligence

### 3A. Enrich College Overlay Adapter

**Current**: `getCollegeCoachingOverlay()` returns ~300-500 flat tokens (top 3 values, top 3 red/green flags, 1 quote).

**Target**: Return structured rich context (~1500-2500 tokens) including ALL core values with weights, ALL red/green flags with full teaching objects, ALL key quotes with use-case routing, dimension weights.

**Implementation**:
- New function: `getEnrichedCollegeOverlay(collegeId)` in `collegeOverlay.ts`
- Returns structured sections (not flat text):
  1. COLLEGE VALUES: all core values with weights + is/isNot descriptions
  2. DIMENSION WEIGHTS: full weight table for this college's evaluation
  3. RED FLAGS: all flags with detection signals + teaching.problem + teaching.howToFix + exampleFix
  4. GREEN FLAGS: all flags with teaching.whatWorks + teaching.howToEnhance
  5. KEY AO QUOTES: all quotes with use-case routing (which issues/dimensions they apply to)
- The existing thin `getCollegeCoachingOverlay()` stays for backward compat
- Token impact: ~1500-2500 tokens (replaces current 300-500 in Block 14)

### 3B. Socratic Question Bank Integration

**Current**: Coach invents questions from scratch.

**Target**: When a finding matches a college-specific issue trigger, inject the curated Socratic question as a "PREFERRED QUESTION" directive.

**Implementation**:
- New function: `getSocraticQuestionsForContext(collegeId, detectedIssues, promptId?)` in `collegeOverlay.ts`
- Loads from `CollegeResearch.socraticQuestions.byIssue` and `byPrompt`
- Returns 2-3 matched questions with expected outcomes
- Injected into coaching prompt as "COLLEGE-CALIBRATED QUESTIONS (prefer these over generic questions)"
- Token impact: ~100-200 tokens per coaching turn

### 3C. Prompt-Specific Rubric Injection

**Current**: Coach doesn't know the specific prompt's rubric criteria.

**Target**: When `promptId` is known, inject the 4-band rubric criteria + `whatPreventsHigherScore` + `criticalFailures`.

**Implementation**:
- Add `promptId?: string` to BlockContext type
- New function: `getPromptRubricContext(collegeId, promptId)` in `collegeOverlay.ts`
- Extracts from `CollegeResearch.essayPrompts[promptId].rubric`
- Returns compact ~400-600 token rubric context
- Injected into coaching prompt when available

### 3D. Specific Resource Matching

**Current**: Coach can't suggest specific professors, programs, labs, courses.

**Target**: When essay content mentions topics matching resource relevance tags, inject 1-3 relevant resources.

**Implementation**:
- New function: `matchCollegeResources(collegeId, essayText)` in `collegeOverlay.ts`
- Lightweight keyword matching of essay text against `CollegeResearch.specificResources[].relevanceTags`
- Returns top 3 matches with name, description, relevance explanation
- Token impact: ~200-400 tokens (conditional — only when matches found)

---

## Execution Phases

### Phase 1 (Wave 1 — Teaching Content): ~3-4 days
1. Create `teachingContentRouter.ts` with lazy-loading from all sources
2. Untruncate technique enrichment in `coachingService.ts`
3. Add PIQ example matching
4. Add narrative strategy matching for L5
5. Add surgical example calibration for L5
6. Add telling phrase pre-scan
7. Test: verify coaching responses include richer, more specific teaching

### Phase 2 (Wave 2 — Detection & Rubric): ~3-4 days
1. Create `patternRegistry.ts` with dedup + type filtering
2. Create `issueScanner.ts` (Haiku pre-scan)
3. Create `essayTypeCalibrator.ts`
4. Modify L3.5 `buildSystemPrompt()` for type-aware analysis
5. Modify phase assessment for type calibration
6. Wire issue scanner into pipeline (parallel with L3.75)
7. Test: verify essay-type-specific scoring differences + structural pattern detection

### Phase 3 (Wave 3 — College Intelligence): ~4-5 days
1. Build `getEnrichedCollegeOverlay()` with full structured context
2. Build `getSocraticQuestionsForContext()`
3. Add `promptId` to BlockContext
4. Build `getPromptRubricContext()`
5. Build `matchCollegeResources()`
6. Modify Block 14 (`essayTypeBlock`) to consume enriched overlay
7. Test: verify coaching includes dean quotes, specific resources, college-calibrated questions

---

## Cost Impact

| Item | Added Cost | Where |
|------|-----------|-------|
| Wave 1: Teaching content | $0.00 | Content injected into existing prompts, no new LLM calls |
| Wave 2: Issue scanner | ~$0.003/essay | 1 Haiku call, parallel with L3.75 |
| Wave 2: Type calibration | ~$0.002/essay | +300-500 cached tokens in L3.5 system prompt |
| Wave 3: Rich overlay | ~$0.003/essay | +1000-2000 tokens in coaching prompt (cached prefix) |
| Wave 3: Socratic questions | $0.00 | Injected into existing coaching turn |
| **TOTAL** | **~$0.008/essay** | **Well within $0.05 budget** |

---

## What Changes for the Student

### Before (current):
> "P2 tells rather than shows. The reader needs to experience your determination, not be told about it. Try replacing the named emotion with physical detail."

### After (Wave 1 — Teaching Content):
> "P2 says 'felt a surge of determination' — this is what we call an emotion label. Here's the principle: 'When a writer uses specific details, the reader's brain shifts from evaluating to experiencing' (Specificity Creates Trust).
>
> WEAK: 'I felt a surge of determination and knew I had to persevere.'
> STRONG: 'I spent most of Tuesday crying in the supply closet, terrified I'd already failed everyone. My first team meeting as president: three seniors walked out.'
>
> See the difference? The strong version shows physical vulnerability — the crying, the supply closet, the specific day. That's the Somatic Vulnerability technique: replace what you FELT with what your BODY DID."

### After (Wave 2 — Detection):
> [Pre-analysis catches that this is a Challenge essay with 60% trauma narration / 10% response — VULNERABILITY_DUMP pattern]
> "Your essay vividly describes the crisis — that's strong. But you're spending 4 paragraphs on the problem and half a paragraph on your response. AOs call this a 'vulnerability dump.' The fix isn't cutting the vivid parts — it's giving your RESPONSE the same vivid, detailed treatment. Right now your recovery reads like a summary. What did your first good day look like?"

### After (Wave 3 — College Intelligence):
> "Stanford weights Intellectual Vitality at 20% — Dean Shaw calls it 'the energy and depth of thought for anything you engage in.' Your robotics project shows competence, but Stanford's red flag CLASS_BASED_IV would fire: the project started as a school assignment. Stanford wants to see self-directed curiosity.
>
> Even if a class sparked this interest, what did you do ON YOUR OWN afterward? Weekend projects? Extra reading? Stanford's HAI institute (co-directed by Professor Fei-Fei Li) does exactly the kind of AI ethics work you mention — have you engaged with their public research?"

---

## Files Created/Modified Summary

### New Files (Wave 1):
- `src/services/essayIntelligence/coaching/teachingContentRouter.ts` (~200 lines)

### New Files (Wave 2):
- `src/services/essayIntelligence/analysis/issueScanner.ts` (~150 lines)
- `src/services/essayIntelligence/analysis/essayTypeCalibrator.ts` (~100 lines)
- `src/services/essayIntelligence/analysis/patternRegistry.ts` (~250 lines)

### Modified Files:
- `src/services/essayIntelligence/coaching/coachingService.ts` — untruncate technique enrichment
- `src/services/essayIntelligence/coaching/promptBlocks.ts` — inject teaching content + narrative strategies
- `src/services/essayIntelligence/analysis/deepAnnotationService.ts` — inject strategies + surgical examples
- `src/services/essayIntelligence/analysis/analysisPass.ts` — type-aware evaluation lens
- `src/services/essayIntelligence/analysis/phaseAssessment.ts` — type calibration
- `src/services/essayIntelligence/analysis/analysisOrchestrator.ts` — wire issue scanner parallel
- `src/services/essayIntelligence/coaching/collegeOverlay.ts` — enriched overlay + socratic + resources
- `src/services/essayIntelligence/coaching/types.ts` — add promptId to BlockContext

### Unchanged (leveraged as-is):
- `src/services/commonAppWorkshop/data/transformationExamples.ts` — consumed via lazy import
- `src/services/commonAppWorkshop/services/techniqueCategories.ts` — already imported, untruncated
- `src/services/commonAppWorkshop/rubrics/writingPrinciples.ts` — already partially connected
- `src/services/commonAppWorkshop/rubrics/issueDetectionPatterns.ts` — consumed by pattern registry
- `src/services/commonAppWorkshop/data/*.ts` (13 college files) — consumed by enriched overlay
- `src/services/piq/teachingExamples.ts` — consumed via lazy import
- `src/services/piq/issuePatterns.ts` — consumed by pattern registry
- `src/services/piq/weights/dimensionWeights.ts` — consumed by type calibrator
- `src/services/narrativeWorkshop/strategies.ts` — consumed via lazy import
- `src/services/narrativeWorkshop/surgicalExamples.ts` — consumed via lazy import
- `src/services/narrativeWorkshop/narrativePatterns.ts` — consumed by pattern registry
- `src/services/narrativeWorkshop/essayTypeCalibration.ts` — consumed by type calibrator
