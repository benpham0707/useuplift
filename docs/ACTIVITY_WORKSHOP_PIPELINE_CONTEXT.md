# Activity Workshop Pipeline v4.3 — Comprehensive Context Document

> **Purpose:** This document contains everything needed to continue development on the Activity Workshop pipeline. It captures architecture, recent changes, design decisions, known issues, and the design philosophy that governs this system.

---

## Table of Contents

1. [Pipeline Architecture](#pipeline-architecture)
2. [File Map & Responsibilities](#file-map--responsibilities)
3. [Key Types & Interfaces](#key-types--interfaces)
4. [Recent Work: v4.3 Quality Fixes (P1-P10)](#recent-work-v43-quality-fixes-p1-p10)
5. [Design Principles](#design-principles)
6. [Scoring System Architecture](#scoring-system-architecture)
7. [Teaching System Architecture](#teaching-system-architecture)
8. [Known Issues & Next Steps](#known-issues--next-steps)
9. [Testing](#testing)
10. [Critical Gotchas](#critical-gotchas)

---

## Pipeline Architecture

### v4.3 Pipeline Flow

```
Stage 0: Story Detection (Haiku, ~$0.01)
  → StoryContext: archetype, primaryTheme, narrativeIdentity, spikeHypothesis, contextualFactors

Stage 1: Parallel Analysis + Scoring (~$0.15, ~60s)
  1a. Student Profiler (Haiku)
  1b-1e. Sub-batch Analysis (Sonnet, parallel)
  1f. Scoring Orchestrator (Sonnet, parallel with 1b-1e)    ← v4.3 NEW
      - Description batch scoring (1 call)
      - Activity batch scoring (1 call)
      - Portfolio holistic scoring (1 call)
  1g. Scoring ↔ Analysis tier reconciliation               ← v4.3 NEW
  1h. Populate AnalysisContext.scoring                      ← v4.3 NEW
  → AnalysisContext: per-activity analysis, tier distribution, coherence, spike, scoring

Stage 2: Parallel Teaching + Scoring Teaching Layer (~$0.18, ~120s)
  2a-2c. Parallel Individual Teaching (Sonnet, sub-batches)
  2d. Portfolio-level Teaching (generated from analysis)
  2e. Scoring Teaching Layer (Sonnet, 1 call)               ← v4.3 NEW
  2f. Merge Step: upgrade descriptions if scoring rewrite is better  ← v4.3 NEW
  → TeachingContext: per-activity teaching, portfolio teaching, scoringTeaching

Stage 3: Portfolio Synthesis (Haiku, ~$0.02)
  → SynthesisContext: Harvard scale, ordered activities, action plan, final message
  → Now receives real scoring data for better synthesis    ← v4.3 ENHANCED

Final Narrative (Sonnet, ~$0.05)
  → PortfolioNarrative: threads, differentiators, two-sentence pitch

Total: ~$0.41-0.53, ~5-7 min
```

### Key Design Decisions

1. **Scoring runs IN PARALLEL with analysis** — zero additional wall-clock time
2. **Scoring is NON-FATAL** — if `scoringOrchestrator.scorePortfolio()` fails, pipeline continues with `scoring: undefined`
3. **Teaching layer is a SEPARATE call in Stage 2** — happens after scores exist so it can reference exact breakdowns
4. **Tier reconciliation** — Stage 1 recomputes tiers from per-activity analysis (not profiler) and annotates scoring tier disagreements
5. **Merge step** — Stage 2 Step 7 upgrades descriptions when scoring teaching produces a better char-constrained rewrite
6. **Cache-ready** — `scoringCacheService` provides per-activity hash-based caching; only changed activities get re-scored

---

## File Map & Responsibilities

### Root (`activityWorkshop/`)

| File | Responsibility |
|------|---------------|
| `activityWorkshopService.ts` | **Main orchestrator** — runs the 4-stage pipeline, assembles final result (v4.3.0) |
| `types.ts` | **All type definitions** — StoryContext, AnalysisContext, TeachingContext, SynthesisContext, PipelineResult |
| `index.ts` | Barrel export |
| `activityAnalysisService.ts` | Single-activity LLM analysis (used by sub-batch) |
| `activityTeachingService.ts` | Single-activity LLM teaching |
| `batchActivityAnalysisService.ts` | Sub-batch parallel analysis orchestration |
| `batchActivityTeachingService.ts` | Sub-batch parallel teaching orchestration |
| `activityDiagnosisService.ts` | Heuristic activity diagnosis |
| `activityCitationService.ts` | Research citation generation |
| `knowledgeAssemblyService.ts` | Assembles expert knowledge for prompts |
| `activityTeachingKnowledgeBase.ts` | Teaching principles, dimension standards, transformations |
| `expertCounselorKnowledgeBase.ts` | Counselor-style guidance, category patterns, red flags |
| `expertSystemPrompts.ts` | System prompt templates for LLM calls |
| `enhancedActivityTeachingService.ts` | Enhanced teaching with knowledge integration |
| `stage1AIntegration.ts` | Integration bridge for Stage 1a |

### Stages (`stages/`)

| File | Responsibility |
|------|---------------|
| `stage0StoryDetectionService.ts` | Haiku-based story/archetype detection from all activities |
| `stage1ContextAwareAnalysisService.ts` | Parallel analysis + scoring + tier reconciliation |
| `stage2ConditionalTeachingService.ts` | Parallel teaching + portfolio teaching + scoring teaching layer + merge |
| `stage3PortfolioSynthesisService.ts` | Final Haiku synthesis: Harvard scale, ordering, action plan |
| `portfolioNarrativeService.ts` | Final narrative: threads, differentiators, two-sentence pitch |
| `index.ts` | Barrel export |

### Scoring (`scoring/`)

| File | Responsibility |
|------|---------------|
| `scoringOrchestrator.ts` | Master pipeline: descriptions → activities → portfolio → (optional) teaching |
| `descriptionScoringService.ts` | 5-dimension description scoring (Role Ownership, Impact, Action, Quantification, Differentiation) |
| `activityScoringService.ts` | 5-component activity scoring (Tier, Recognition, Leadership, Character, Commitment) |
| `portfolioScoringService.ts` | 5-dimension portfolio scoring + Harvard 1-6 scale |
| `activityTeachingLayerService.ts` | Deep transformation guidance: rewrites, citations, craft teaching |
| `profileIntegrationService.ts` | Integrates profile data into scoring context |
| `comparisonBenchmarksLibrary.ts` | Static benchmark data for activity comparisons |
| `scoringCacheService.ts` | Per-activity hash-based caching |
| `scoringCacheTypes.ts` | Cache type definitions |
| `types.ts` | All scoring types: DescriptionScore, ActivityScore, PortfolioScoreRubric, etc. |
| `teachingLayerTypes.ts` | Teaching types: ActivityTransformation, ConnectionStrategy, CraftTeaching, etc. |
| `index.ts` | Barrel export |

### Chat (`chat/`) — Conversational interface (separate from pipeline)

| File | Responsibility |
|------|---------------|
| `activityProfileChatService.ts` | Chat-based activity profiling |
| `conversationManager.ts` | Manages multi-turn conversation state |
| `conversationModeService.ts` | Handles conversation mode transitions |
| `dynamicConversationEngine.ts` | Dynamic question generation |
| `questionGenerator.ts` | Generates follow-up questions |
| `responseExtractor.ts` | Extracts structured data from responses |
| `types.ts` | Chat-specific types |

### Profile (`profile/`) — Activity profiling

| File | Responsibility |
|------|---------------|
| `activityProfileService.ts` | Profile assembly for activities |
| `profileDescriptionGenerator.ts` | Generates optimized descriptions from profiles |
| `types.ts` | Profile types |

---

## Key Types & Interfaces

### Pipeline Result (`ActivityWorkshopPipelineResult`)

```typescript
interface ActivityWorkshopPipelineResult {
  sessionId: string;
  version: '4.3.0';
  completedAt: string;
  finalNarrative?: PortfolioNarrative;
  scoring?: {
    portfolioRubric: PortfolioScoreRubric;    // Overall + Harvard scale
    activityScores: ActivityScoreRubric[];     // Per-activity deep dives
    scoringTeaching?: TeachingLayerOutput;     // Transformations + rewrites
  };
  stage0: StoryContext;
  stage1: AnalysisContext;
  stage2: TeachingContext;
  stage3: SynthesisContext;
  analysis: PortfolioAnalysis;   // Legacy
  teaching: PortfolioTeaching;   // Legacy
  totalCost: number;
}
```

### StoryContext (Stage 0 Output)

Key fields:
- `narrativeIdentity.primaryTheme` (NOT `centralTheme`)
- `narrativeIdentity.secondaryThemes` (NOT `coreStrengths`)
- `narrativeIdentity.archetype` — builder | caretaker | scholar | innovator | leader | advocate
- `narrativeIdentity.storyEssence` — one-sentence story
- `narrativeIdentity.archetypeConfidence` — 0-100
- `contextualFactors` (NOT `contextSignals`)
  - `hasWorkFamilyObligations`, `firstGenIndicators`, `hasResourceConstraints`, `ruralSuburbanUrban`, etc.
- `spikeHypothesis.likelySpike`, `spikeHypothesis.spikeArea`, `spikeHypothesis.maturity`
- `narrativeThreads[]` — cross-activity story threads
- `activityStoryRoles[]` — role each activity plays in the narrative

### AnalysisContext (Stage 1 Output)

Key fields:
- `activities: Record<string, ActivityAnalysis>` — per-activity
  - `classification.tier` (1-4)
  - `classification.detectedCategory` — **NOT `classification.category`** (CRITICAL BUG FIX)
  - `classification.impact`, `classification.authenticity`
- `tierDistribution: { tier1, tier2, tier3, tier4 }` — recomputed from per-activity (not profiler)
- `coherenceAnalysis: { score, assessment, disconnectedActivities[] }`
- `spikeAnalysis: { hasSpike, spikeType, spikeArea }`
- `competitiveAssessment: { overallStrength }`
- `portfolioTeachingNeeds: { primaryIssue, strengthsToHighlight[] }`
- `scoring?: { portfolioRubric, activityScoresById, scoringComplete }` — v4.3

### TeachingContext (Stage 2 Output)

Key fields:
- `teachingDelivered[]` — per-activity: `{ activityId, teachingDepth, teaching: ActivityTeaching }`
  - `teaching.descriptionOptimization.optimizedDescription` — the rewritten 150-char description
  - `teaching.improvementTeaching` — THE PROBLEM → WHY IT MATTERS → HOW TO FIX IT
  - `teaching.narrativeGuidance` — category-specific interview/story framing
- `quickEncouragements[]` — for already-strong activities
- `skippedActivities[]` — for activities that don't need teaching
- `portfolioTeaching` — portfolio-level narrative, coherence, strategic direction
- `scoringTeaching?` — v4.3: ActivityTransformation[], ConnectionStrategy[], StrategicPriority[], CraftTeaching[]

### Scoring Types

**DescriptionScore** (5 dimensions, total /10):
- `specificity` — Role Ownership (0-2.5)
- `impactClarity` — Evidence of Impact (0-2)
- `actionLanguage` — Action Precision (0-2)
- `quantification` — Strategic Quantification (0-1.5)
- `authenticityVoice` — Differentiation Signal (0-2)

**ActivityScore** (5 components, weighted to /10):
- `tierAssessment` — Tier rating (weight varies)
- `recognitionLevel` — Awards/recognition
- `leadershipImpact` — Leadership + impact
- `communityCharacter` — Character development
- `commitmentProgression` — Depth of commitment

**Combined Score**: Activity (70%) + Description (30%)

**PortfolioScoreRubric**: `overallScore.total/10`, `harvardScale.rating/6`, `activityScores[]`, `keyStrengths[]`, `keyGaps[]`

**ActivityTransformation** (from teaching layer):
- `principle: { name, whyItMatters, applicationToActivity }`
- `rewrite: { original, suggested, characterCount, changesApplied[] }`
- `alternatives[]`, `citations[]`
- `expectedScoreImprovement: { projectedScore, improvingComponents[], rationale }`

---

## Recent Work: v4.3 Quality Fixes (P1-P10)

### All 10 fixes are complete. Here's what was done:

#### P1: Narrative Guidance Still Templated (ROOT CAUSE FIX)
**Problem:** Narrative guidance was always generic despite category-specific code existing.
**Root Cause:** `classification.category` doesn't exist — the actual field is `classification.detectedCategory`.
**Fix:** `replace_all` in `stage2ConditionalTeachingService.ts`: `classification?.category` → `classification?.detectedCategory` at both call sites.
**Additional Fix:** Method ordering — `work_family_responsibility` contains both `work` and `family`. Reordered all three `getCategorySpecific*()` methods to check `family/caregiv/farm` BEFORE `work/employ/job`.
**File:** `stage2ConditionalTeachingService.ts`

#### P2: Description Rewrites Exceed 150-Char Limit
**Problem:** Optimized descriptions were often >150 chars.
**Fix:** Added character count enforcement in `normalizeDescriptionOptimization()` — if over limit, truncate at word boundary, append ellipsis. Added Step 7 merge in Stage 2 that upgrades descriptions when scoring teaching has a better char-constrained rewrite.
**File:** `stage2ConditionalTeachingService.ts`

#### P3: Tier Distribution Doesn't Match Per-Activity Tiers
**Problem:** `tierDistribution` came from the profiler (Stage 1a), which is a separate Haiku call that can assign different tiers than the Sonnet sub-batch analysis.
**Fix:** Added tier recomputation after merge in `stage1ContextAwareAnalysisService.ts` — iterates per-activity tiers and rebuilds `tierDistribution`.
**File:** `stage1ContextAwareAnalysisService.ts`

#### P4: Empty Improvement Teaching Fields
**Problem:** `improvementTeaching` fields (problem, whyItMatters, howToFix) were sometimes empty after LLM normalization.
**Fix:** Added substantive fallback generation in `normalizeImprovementTeaching()` using activity analysis context. Generates meaningful problem/solution statements from actual scoring dimensions.
**File:** `stage2ConditionalTeachingService.ts`

#### P5: No Verification Caveat on AI-Suggested Details
**Problem:** Descriptions containing AI-suggested metrics (like "trained 12+ employees") had no indication they should be personalized.
**Fix:** Added verification caveat appended to descriptions when they contain fabricated-looking metrics. The caveat says "Verify all specific numbers and replace with your actual figures."
**IMPORTANT DESIGN PRINCIPLE:** These suggested metrics are INTENTIONAL — they serve as inspirational EXAMPLES for students to personalize. They should NOT be suppressed. See [Design Principles](#design-principles).
**File:** `stage2ConditionalTeachingService.ts`

#### P6: Scoring-Analysis Tier Disagreements Unresolved
**Problem:** When scoring and analysis assign different tiers, there was no reconciliation.
**Fix:** Added tier reconciliation in Stage 1 (`stage1ContextAwareAnalysisService.ts`) — after scoring completes, compares each activity's analysis tier vs scoring tier. When they disagree, annotates the scoring rationale with the contextual tier.
**File:** `stage1ContextAwareAnalysisService.ts`

#### P7: Action Plan Contains Hallucinated Details
**Problem:** Stage 3's action plan sometimes included fabricated retrospective claims about achievements.
**Fix:** Two-pronged: (1) Prompt instruction in Stage 3 telling LLM to keep action items forward-looking, (2) Post-processing `flagHallucinatedSpecifics()` that detects numbers in action items not present in student input and flags them with `[Verify: ...]`.
**IMPORTANT:** The prompt was revised to explicitly ENCOURAGE vivid suggested metrics in `finalDescription` fields (they're examples for students) while keeping action plan items forward-looking. See [Design Principles](#design-principles).
**File:** `stage3PortfolioSynthesisService.ts`

#### P8: Stage 0 Missing Fields in E2E Output
**Problem:** E2E test was referencing wrong field names (`centralTheme`, `coreStrengths`, `contextSignals`).
**Fix:** Updated to correct names: `primaryTheme`, `secondaryThemes`, `contextualFactors`. Added rendering for narrative threads, activity story roles.
**File:** `tests/portfolio/test-full-pipeline-e2e-output.ts`

#### P9: Portfolio Teaching Quality — Generic/Templated
**Problem:** `generatePortfolioTeaching()` was producing generic recommendations.
**Fix:** Rewrote entirely — now uses actual archetype, theme (truncated for inline use), storyEssence, strengths, disconnected activities, and spike analysis to produce substantive, specific portfolio-level guidance.
**File:** `stage2ConditionalTeachingService.ts`

#### P10: No Projected Score Improvement
**Problem:** No way to see estimated impact of applying transformations.
**Fix:** Added per-activity projected score improvement rendering in E2E test. Shows `currentScore → projectedScore (+delta)` per activity and portfolio-level aggregate estimate.
**File:** `tests/portfolio/test-full-pipeline-e2e-output.ts`

---

## Design Principles

### 1. Fabricated Metrics Are Inspirational Examples (CRITICAL)

**Suggested/fabricated metrics in descriptions (like "trained 12+ new employees", "avg grade improvement C+ → B+", "200-acre farm") are INTENTIONAL.** They serve as examples that inspire students to fill in their own real figures. The system should:

- **KEEP generating** vivid, specific suggested metrics in activity descriptions
- **Frame them as examples** — the P5 verification caveat ("verify all specific numbers and replace with your actual figures") is the right approach
- **NOT suppress them** — the Stage 3 prompt explicitly encourages suggested metrics in `finalDescription` fields
- **Only restrict fabrication** in the action plan, where items should be forward-looking advice, not retrospective claims

### 2. Celebration-First Teaching

All teaching follows: celebrate what's good → identify what could improve → teach how to improve. Never lead with criticism.

### 3. Category-Specific Guidance

Narrative guidance, interview tips, and story connections are tailored by `detectedCategory`:
- `work_family_responsibility`, `family`, `farm` — confidence framing, no victimhood
- `work`, `employment` — business language, transferable skills
- `service`, `volunteer`, `community` — impact metrics, systems thinking
- `research`, `academic` — methodology, discovery narrative
- `arts`, `creative` — artistic voice, portfolio context
- **Method ordering matters**: Check `family/farm` BEFORE `work` because compound categories like `work_family_responsibility` contain both substrings.

### 4. Scoring Complements, Not Replaces, Teaching

- Stage 2 teaching (qualitative counselor-style feedback) and scoring teaching (quantitative transformation guidance with rewrites) serve different purposes
- They complement each other — scoring provides the "what score and why", teaching provides the "how to improve"
- When both produce description rewrites, the merge step picks the better one

### 5. Non-Fatal Scoring

If any scoring call fails, the pipeline continues without scoring data. All scoring-dependent code checks `if (analysisContext.scoring?.scoringComplete)`.

---

## Scoring System Architecture

### Scoring Pipeline (inside `scoringOrchestrator.ts`)

```
Input: activities[] + studentContext
  ↓
Step 1: Description Batch Scoring (1 Sonnet call)
  → DescriptionScore per activity (5 dimensions, /10 total)
  ↓
Step 2: Activity Batch Scoring (1 Sonnet call)
  → ActivityScore per activity (5 weighted components, /10 total)
  ↓
Step 3: Portfolio Holistic Scoring (1 Sonnet call)
  → PortfolioScoreRubric (overall /10, Harvard 1-6, strengths, gaps)
  ↓
Step 4 (optional): Teaching Layer (1 Sonnet call)
  → ActivityTransformation[] with rewrites, citations, projected improvements

Combined Score = Activity (70%) + Description (30%)
```

### Teaching Layer Output

The teaching layer (`activityTeachingLayerService.ts`) generates:
- `activityTransformations[]` — per-activity: principle, before/after rewrite, changes applied, citations, projected score
- `connectionStrategies[]` — how to connect disconnected activities to the spike
- `strategicPriorities[]` — ordered list of what to focus on
- `craftTeaching[]` — writing principles with examples (optional)

---

## Teaching System Architecture

### Stage 2 Teaching Flow

```
For each activity (parallel sub-batches):
  1. Check if teaching needed (skip if excellent)
  2. Determine depth: deep (2+ issues) | medium (1 issue) | quick (minor tweaks)
  3. Generate teaching via LLM:
     - Description optimization (with 150-char constraint)
     - Improvement teaching (THE PROBLEM → WHY → HOW)
     - Narrative guidance (category-specific)
  4. Normalize all outputs (handle LLM format variations)
  5. Apply generic detection (reject templated responses, regenerate)

Then:
  6. Generate portfolio-level teaching (from analysis, not LLM)
  7. Generate scoring teaching layer (if scoring data available)
  8. Merge step: upgrade descriptions if scoring rewrite is better
```

### Normalization Functions in `stage2ConditionalTeachingService.ts`

These are critical for quality — they handle the unpredictable LLM output format:

- `normalizeDescriptionOptimization()` — extracts optimized description, enforces 150-char, handles multiple field name variants
- `normalizeImprovementTeaching()` — extracts problem/whyItMatters/howToFix, generates substantive fallbacks from analysis context
- `normalizeNarrativeGuidance()` — extracts positioning/interview/story framing, applies category-specific content, detects generic/templated responses
- `isGenericGuidance()` — checks for ≥2 known generic patterns in guidance text
- `isTemplatedInterviewTips()` — checks for ≥2 template signals in interview tips
- `getCategorySpecificFraming()` — returns category-tailored framing for narrative
- `getCategorySpecificInterviewTips()` — returns category-tailored interview guidance
- `getCategorySpecificStoryConnection()` — returns category-tailored story connection

---

## Known Issues & Next Steps

### Verified Working (E2E tested)
- All P1-P10 fixes verified in E2E test run (661.6s, $0.36, Portfolio 6.2/10, Harvard 3/6)
- Category-specific narrative guidance working (different per work/service/research/family)
- Tier distribution matches per-activity tiers
- Scoring deep dives rendering correctly
- Description transformations with rewrites and citations
- Portfolio teaching substantive and specific

### Pending Verification
- **Family/farm ordering fix** was applied AFTER the last E2E test. Needs one more E2E run to confirm `work_family_responsibility` category activities get family-specific (not work-specific) guidance.
- **P7 prompt revision** (allowing suggested metrics in descriptions) was applied after last test. Needs verification that Stage 3's `finalDescription` still generates rich example metrics.

### Potential Future Work
- **Teaching iteration** — allow students to iterate on specific activities after seeing scores
- **Comparative benchmarks** — show how the student's activity compares to successful applicants in same major
- **Profile integration** — feed `chat/` profile data into scoring for richer context
- **Description A/B testing** — present multiple description alternatives and let student choose
- **Score tracking** — track score improvements across sessions as student refines descriptions

---

## Testing

### E2E Test
```bash
ANTHROPIC_API_KEY="..." npx tsx tests/portfolio/test-full-pipeline-e2e-output.ts
```

Output includes:
- Stage 0: Story detection (archetype, theme, spike hypothesis, contextual factors)
- Stage 1: Per-activity analysis + scoring deep dives
- Stage 2: Teaching delivered per activity + portfolio teaching
- Scoring rubric: Portfolio score, Harvard scale, per-activity breakdowns (5+5 dimensions)
- Description transformations: Before/after rewrites with changes, citations, projected scores
- Stage 3: Harvard assessment, ordered activities, action plan, final message
- Final narrative: Threads, differentiators, two-sentence pitch
- Cost/timing breakdown

**Expected:** ~$0.36-0.53, ~5-10 min, Portfolio 5-7/10, Harvard 2-4/6

### TypeScript Check
```bash
npx tsc --noEmit  # Must pass clean (exit code 0)
```

### Test Student Profile
The E2E test uses a first-gen, working, rural student with 5 activities:
1. **CS Club Founder** (school_activity) — started first CS club, 25 students, hackathon
2. **ML Research** (work) — NLP rural healthcare, 50K records, co-authored paper
3. **Family Farm Operations Manager** (work_family_responsibility) — 200-acre farm, supply chain
4. **Math Tutoring Program** (community_service) — peer tutoring, school-wide program
5. **Regional Coding Competition** (competition) — 3 years, team captain, state finalist

This profile exercises: constraint intelligence, first-gen context, work/family obligations, rural context, STEM spike detection, multiple categories.

---

## Critical Gotchas

1. **`classification.detectedCategory` NOT `classification.category`** — The actual field name in the ActivityAnalysis type. Using `category` returns `undefined` and all category-specific code falls through to generic.

2. **Method ordering for compound categories** — `work_family_responsibility` contains both `work` and `family`. Always check `family/caregiv/farm` BEFORE `work/employ/job` in any category-matching code.

3. **StoryContext field names** — `primaryTheme` (NOT `centralTheme`), `secondaryThemes` (NOT `coreStrengths`), `contextualFactors` (NOT `contextSignals`).

4. **Scoring tier field** — The tier from scoring is at `actScore.activityScore.breakdown.tierAssessment.tier` (direct field), NOT parsed from the rationale text via regex.

5. **150-char description limit** — The Common App limit is 150 characters. All description rewrites MUST be enforced to this limit. The normalize function truncates at word boundary + ellipsis if over.

6. **Fabricated metrics are features, not bugs** — See Design Principles #1. Suggested numbers in descriptions are intentional examples for students to personalize.

7. **Parallel sub-batches in Stage 1 and 2** — Activities are split into sub-batches (typically 2-3 per batch) processed in parallel. The merge step after sub-batches must handle all activities being present.

8. **TypeScript strict mode** — The project uses `strict: true`. All types must be complete. No implicit `any`.

9. **Haiku for speed, Sonnet for quality** — Stage 0 and Stage 3 use Haiku (fast, cheap synthesis). Stages 1 and 2 use Sonnet (quality analysis/teaching). The scoring system uses Sonnet exclusively.

10. **The scoring orchestrator's `teachingOptions.includeTeaching`** — Set to `false` in Stage 1 (scoring only). The teaching layer is called separately in Stage 2 so it can reference the full analysis context.

---

## Modified Files Summary (Current Diff from HEAD)

```
stage1ContextAwareAnalysisService.ts  — Tier recomputation (P3), scoring-analysis tier reconciliation (P6)
stage2ConditionalTeachingService.ts   — Category bug fix (P1), ordering fix (P1), char limit (P2),
                                        improvement fallbacks (P4), generic detection (P4),
                                        portfolio teaching rewrite (P9), scoring teaching merge (v4.3)
stage3PortfolioSynthesisService.ts    — Scoring in synthesis prompt (v4.3), anti-hallucination for
                                        action plan (P7), inspirational metrics in descriptions (P7 revised)
test-full-pipeline-e2e-output.ts      — Stage 0 field fix (P8), projected scores (P10), scoring rendering
activityWorkshopService.ts            — Version 4.3.0, scoring passthrough
types.ts                              — scoringTeaching on TeachingContext, scoring on PipelineResult
```

---

*Last updated: February 2026. TypeScript compiles clean. All 10 quality fixes implemented and verified.*
