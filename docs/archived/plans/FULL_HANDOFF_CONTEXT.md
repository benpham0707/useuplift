# Full Handoff Context — Activity Workshop Pipeline v4.3

> **For:** New Claude Code agents continuing development on the Activity Workshop pipeline.
> **Last verified:** Feb 9, 2026 — TypeScript clean, E2E passes ($0.39, 678s, 6.2/10, Harvard 3/6).

---

## What This System Does

The Activity Workshop is an AI-powered analysis and coaching system for college application extracurricular activities. It takes a student's 5-10 Common App activities and produces:

1. **Story Detection** — identifies the student's narrative archetype and spike area
2. **Deep Analysis** — per-activity tier classification, scoring, and quality assessment
3. **Teaching** — celebration-first coaching with concrete description rewrites, research citations, and interview guidance
4. **Scoring** — 1-10 rubric scores with 5-dimension breakdowns for both activity quality and description quality
5. **Synthesis** — Harvard 1-6 scale assessment, optimally ordered activities, and an actionable improvement plan

The system costs ~$0.36-0.53 per run and takes 5-10 minutes (most time is parallel Sonnet API calls).

---

## Pipeline Architecture (v4.3)

```
Stage 0: Story Detection (Haiku, ~$0.01, ~20s)
  Input: all activities + student context
  Output: StoryContext — archetype, primaryTheme, spikeHypothesis, contextualFactors

Stage 1: Analysis + Scoring (Sonnet, ~$0.15, ~300s) — ALL PARALLEL
  1a. Student Profiler (Haiku, fast) — initial tier/category sweep
  1b-1e. Sub-batch Analysis (Sonnet x3) — deep per-activity analysis in parallel sub-batches of ≤2
  1f. Scoring Orchestrator (Sonnet x3) — description scoring + activity scoring + portfolio scoring
  1g. Tier recomputation — rebuild tier distribution from per-activity results (not profiler)
  1h. Scoring-Analysis reconciliation — annotate tier disagreements
  Output: AnalysisContext — per-activity analysis, tier distribution, coherence, spike, scoring data

Stage 2: Teaching + Scoring Teaching Layer (Sonnet, ~$0.18, ~180s) — PARALLEL
  2a-2c. Individual teaching per activity (Sonnet, parallel sub-batches)
  2d. Portfolio-level teaching (generated from analysis, no API call)
  2e. Scoring Teaching Layer (Sonnet x1) — transformation guidance with rewrites
  2f. Merge step — upgrade descriptions if scoring rewrite is better
  Output: TeachingContext — per-activity teaching, portfolio teaching, scoringTeaching

Stage 3: Synthesis (Haiku, ~$0.02, ~15s)
  Output: SynthesisContext — Harvard scale, ordered activities, action plan, final message

Final: Portfolio Narrative (Sonnet, ~$0.05, ~30s)
  Output: PortfolioNarrative — threads, elevations, differentiators, two-sentence pitch
```

---

## File Map

All files are under `src/services/portfolioStrategy/services/activityWorkshop/`.

### Core Pipeline

| File | What It Does |
|------|-------------|
| `activityWorkshopService.ts` | **Main orchestrator** — runs 4-stage pipeline, assembles `ActivityWorkshopPipelineResult` (v4.3.0) |
| `types.ts` | **All type definitions** — StoryContext, AnalysisContext, TeachingContext, SynthesisContext, PipelineResult, and 60+ supporting interfaces |
| `stages/stage0StoryDetectionService.ts` | Haiku: archetype + theme + spike hypothesis detection |
| `stages/stage1ContextAwareAnalysisService.ts` | Sonnet: parallel sub-batch analysis + scoring orchestrator + tier recomputation |
| `stages/stage2ConditionalTeachingService.ts` | Sonnet: parallel teaching + portfolio teaching + scoring teaching layer + merge + normalization (LARGEST FILE, ~1700 lines) |
| `stages/stage3PortfolioSynthesisService.ts` | Haiku: final synthesis with scoring data → Harvard scale + action plan |
| `stages/portfolioNarrativeService.ts` | Sonnet: final narrative threads, spike, differentiators |

### Scoring System

| File | What It Does |
|------|-------------|
| `scoring/scoringOrchestrator.ts` | Master pipeline: descriptions → activities → portfolio → (optional) teaching |
| `scoring/descriptionScoringService.ts` | 5-dim description scoring: Role Ownership (0-2.5), Impact (0-2), Action (0-2), Quantification (0-1.5), Differentiation (0-2) |
| `scoring/activityScoringService.ts` | 5-component activity scoring: Tier, Recognition, Leadership, Character, Commitment (weighted, /10) |
| `scoring/portfolioScoringService.ts` | Portfolio scoring: overall /10, Harvard 1-6, breakdowns, strengths/gaps |
| `scoring/activityTeachingLayerService.ts` | Deep transformations: principle → before/after rewrite → changes → citations → projected score |
| `scoring/types.ts` | Scoring type definitions |
| `scoring/teachingLayerTypes.ts` | Teaching layer type definitions (ActivityTransformation, ConnectionStrategy, etc.) |
| `scoring/scoringCacheService.ts` | Per-activity hash-based caching — only re-scores changed activities |
| `scoring/comparisonBenchmarksLibrary.ts` | Static benchmark data for activity comparisons |

### Knowledge Base

| File | What It Does |
|------|-------------|
| `activityTeachingKnowledgeBase.ts` | Teaching principles, dimension scoring standards, before/after transformations |
| `expertCounselorKnowledgeBase.ts` | Counselor-style guidance, category patterns, red flags, fabrication detection |
| `expertSystemPrompts.ts` | System prompt templates for all LLM calls |
| `knowledgeAssemblyService.ts` | Assembles expert knowledge context for each activity |

### Tests

| File | What It Does |
|------|-------------|
| `tests/test-full-pipeline-e2e-output.ts` | **Main E2E test** — runs full pipeline, renders all output. ~$0.36-0.53, ~5-10 min |

---

## Key Types Quick Reference

### `ActivityWorkshopPipelineResult`
```typescript
{
  sessionId: string;
  version: '4.3.0';
  scoring?: {
    portfolioRubric: PortfolioScoreRubric;     // overall /10, Harvard 1-6
    activityScores: ActivityScoreRubric[];       // per-activity deep dives
    scoringTeaching?: TeachingLayerOutput;       // transformations + rewrites
  };
  stage0: StoryContext;
  stage1: AnalysisContext;
  stage2: TeachingContext;
  stage3: SynthesisContext;
  finalNarrative?: PortfolioNarrative;
  totalCost: number;
}
```

### `StoryContext` (Stage 0)
- `narrativeIdentity.archetype` — builder | caretaker | scholar | innovator | leader | advocate
- `narrativeIdentity.primaryTheme` — **NOT `centralTheme`**
- `narrativeIdentity.secondaryThemes` — **NOT `coreStrengths`**
- `narrativeIdentity.storyEssence` — one-sentence story
- `contextualFactors` — **NOT `contextSignals`**
  - `hasWorkFamilyObligations`, `firstGenIndicators`, `hasResourceConstraints`
- `spikeHypothesis.likelySpike`, `spikeHypothesis.spikeArea`
- `narrativeThreads[]`, `activityStoryRoles[]`

### `AnalysisContext` (Stage 1)
- `activities: Record<string, ActivityAnalysis>` — per-activity
  - `classification.detectedCategory` — **NOT `classification.category`** (CRITICAL)
  - `classification.tier` (1-4)
- `tierDistribution: { tier1, tier2, tier3, tier4 }` — recomputed from per-activity
- `scoring?: { portfolioRubric, activityScoresById, scoringComplete }`

### `TeachingContext` (Stage 2)
- `teachingDelivered[]` — per-activity: teaching depth + ActivityTeaching
  - `teaching.descriptionOptimization.optimizedDescription` — the 150-char rewrite
  - `teaching.improvementTeaching` — THE PROBLEM → WHY → HOW
  - `teaching.narrativeGuidance` — category-specific interview/story framing
- `portfolioTeaching` — narrative, coherence, strategic direction
- `scoringTeaching?` — ActivityTransformation[], ConnectionStrategy[], StrategicPriority[], CraftTeaching[]

### Scoring Types
**Combined Score = Activity (70%) + Description (30%)**

**DescriptionScore** (5 dimensions, /10):
| Dimension | Field Name | Max Score |
|-----------|-----------|-----------|
| Role Ownership | `specificity` | 2.5 |
| Evidence of Impact | `impactClarity` | 2.0 |
| Action Precision | `actionLanguage` | 2.0 |
| Strategic Quantification | `quantification` | 1.5 |
| Differentiation Signal | `authenticityVoice` | 2.0 |

**ActivityScore** (5 components, weighted to /10):
| Component | Key Fields |
|-----------|-----------|
| Tier Assessment | `.tier`, `.score`, `.weight`, `.rationale` |
| Recognition Level | `.level`, `.score`, `.weight` |
| Leadership/Impact | `.role`, `.impactScope`, `.score`, `.weight` |
| Community/Character | `.primaryTrait`, `.authenticitySignal`, `.score`, `.weight` |
| Commitment Progression | `.years`, `.showsProgression`, `.score`, `.weight` |

**ActivityTransformation** (from teaching layer):
```typescript
{
  activityId: string;
  activityName: string;
  currentScore: number;
  revisionLevel: 'minor_polish' | 'moderate_revision' | 'major_overhaul' | 'strategic_rethink';
  principle: { name, whyItMatters, applicationToActivity };
  rewrite: { original, suggested, characterCount, changesApplied[] };
  alternatives?: { angle, rewrite, whenToUse }[];
  citations: TeachingCitation[];
  expectedScoreImprovement: { projectedScore, improvingComponents[], rationale };
}
```

---

## Scoring Orchestrator API

```typescript
// In Stage 1 — scoring only (no teaching layer)
const result = await scoringOrchestrator.scorePortfolio({
  activities: input.activities,
  studentContext: {
    intendedMajor: input.studentContext?.intendedMajor,
    gradeLevel: input.studentContext?.gradeLevel,
    targetSchools: input.studentContext?.targetSchools,
  },
  teachingOptions: { includeTeaching: false },
});
// result.success, result.rubric, result.scoresByActivityId (Map)

// In Stage 2 — teaching layer only
const teaching = await activityTeachingLayerService.generateTeaching({
  scoringRubric: analysisContext.scoring!.portfolioRubric,
  activities: input.activities,
  studentContext: { ... },
  options: {
    maxTransformations: Math.min(input.activities.length, 5),
    includeAlternatives: true,
    includeCraftTeaching: true,
  },
});
// teaching.success, teaching.teaching (TeachingLayerOutput)
```

---

## Recent Work: 10 Quality Fixes (P1-P10) — ALL COMPLETE

### P1: Narrative Guidance — Category Bug (ROOT CAUSE)
**Bug:** `classification.category` → should be `classification.detectedCategory`. The field doesn't exist, so all category-specific code fell through to generic.
**Fix:** `replace_all` in `stage2ConditionalTeachingService.ts` at both call sites. Also reordered `getCategorySpecific*()` methods to check `family/caregiv/farm` BEFORE `work/employ/job` (compound categories like `work_family_responsibility` contain both substrings).
**Verified:** E2E shows Family Farm gets "state facts with confidence — no victimhood framing" (family-specific, not work-specific).

### P2: Description 150-Char Limit
**Fix:** `normalizeDescriptionOptimization()` enforces 150-char limit — truncates at word boundary + ellipsis. Stage 2 merge step picks better rewrite from scoring if under limit.

### P3: Tier Distribution Mismatch
**Fix:** After merge in Stage 1, recomputes `tierDistribution` by iterating per-activity tiers instead of trusting the profiler's independent count.

### P4: Empty Improvement Teaching
**Fix:** `normalizeImprovementTeaching()` generates substantive fallbacks from analysis context when LLM fields are empty.

### P5: No Verification Caveat on Suggested Metrics
**Fix:** Descriptions with AI-suggested metrics get a caveat: "Verify all specific numbers and replace with your actual figures."
**IMPORTANT:** The suggested metrics ARE INTENTIONAL — see Design Principles below.

### P6: Scoring-Analysis Tier Disagreements
**Fix:** Stage 1 compares each activity's analysis tier vs scoring tier. When they disagree, annotates scoring rationale with contextual tier.
**Key:** Scoring tier is at `actScore.activityScore.breakdown.tierAssessment.tier` (direct field), NOT parsed from rationale text via regex.

### P7: Action Plan Hallucination
**Fix:** Two-pronged: (1) Prompt tells Stage 3 to keep action plan items forward-looking, (2) `flagHallucinatedSpecifics()` detects numbers not in student input.
**IMPORTANT:** The prompt explicitly ENCOURAGES vivid suggested metrics in `finalDescription` fields. Only the action plan restricts fabrication. See Design Principles.

### P8: Stage 0 Wrong Field Names in E2E
**Fix:** `centralTheme` → `primaryTheme`, `coreStrengths` → `secondaryThemes`, `contextSignals` → `contextualFactors`. Added narrative threads and activity story roles rendering.

### P9: Generic Portfolio Teaching
**Fix:** Rewrote `generatePortfolioTeaching()` with actual archetype, theme (truncated for inline use), strengths, disconnected activities, and spike analysis.

### P10: No Projected Score Improvement
**Fix:** E2E test renders per-activity projected scores from transformations + portfolio aggregate estimate.

---

## Design Principles (MUST FOLLOW)

### 1. Fabricated Metrics Are Inspirational Examples (CRITICAL)

Suggested metrics in descriptions (like "trained 12+ employees", "avg grades improved C+ → B+", "reducing errors 30%") are **INTENTIONAL**. They serve as examples that inspire students to personalize with their own real figures.

**DO:**
- Generate vivid, specific suggested metrics in activity descriptions
- Frame them as examples to personalize (P5 verification caveat)
- Stage 3 prompt explicitly encourages this

**DO NOT:**
- Suppress or remove suggested metrics from descriptions
- Add warnings that make students think the metrics are errors
- Fabricate retrospective claims in action plan items (those should be forward-looking advice)

### 2. Celebration-First Teaching
All teaching follows: celebrate → identify improvements → teach how to fix. Never lead with criticism.

### 3. Category-Specific Guidance
Narrative guidance is tailored by `detectedCategory`:
- `family/caregiv/farm` → confidence framing, no victimhood, skills focus
- `work/employ/job` → business language, transferable skills
- `service/volunteer/community` → impact metrics, systems thinking
- `research/academic` → methodology, discovery narrative
- `arts/creative` → artistic voice, portfolio context
- **ORDER MATTERS:** Check `family/farm` BEFORE `work` (compound categories match both)

### 4. Non-Fatal Scoring
If any scoring call fails, pipeline continues. All scoring-dependent code uses `if (analysisContext.scoring?.scoringComplete)`.

### 5. Character Limit Enforcement
Common App: 150 characters per description. All rewrites must respect this. The normalize function truncates at word boundary + ellipsis.

### 6. Model Selection
- **Haiku** ($0.25/$1.25 per M tokens): Stage 0 (story detection), Stage 3 (synthesis) — speed matters, data already exists
- **Sonnet** ($3/$15 per M tokens): Stages 1 & 2, all scoring — quality matters for analysis/teaching

---

## Critical Gotchas (Read These)

1. **`classification.detectedCategory` NOT `classification.category`** — Using `.category` gives `undefined`. All category logic silently falls through to generic.

2. **Method ordering for compound categories** — `work_family_responsibility` matches both `work` and `family`. Always check `family/caregiv/farm` first.

3. **StoryContext field names** — `primaryTheme` NOT `centralTheme`, `secondaryThemes` NOT `coreStrengths`, `contextualFactors` NOT `contextSignals`.

4. **Scoring tier field** — `actScore.activityScore.breakdown.tierAssessment.tier` (direct numeric field). Do NOT regex-parse from `.rationale`.

5. **`stage2ConditionalTeachingService.ts` is ~1700 lines** — It handles: individual teaching, normalization, generic detection, category-specific framing, portfolio teaching, scoring teaching layer, and the merge step. All normalization functions are in this file.

6. **Normalization handles LLM chaos** — LLMs return unpredictable field names (`action` vs `action_item` vs `task`), nested structures, and sometimes strings instead of objects. All `normalize*()` functions handle multiple key name variants and type coercion.

7. **Sub-batch parallelism** — Activities are split into sub-batches of ≤2 for parallel processing. Both Stage 1 and Stage 2 do this. The merge step after sub-batches must collect all activity IDs.

8. **`flagHallucinatedSpecifics()` only applies to action plan** — It's called inside `normalizeActionPlan()`, not on descriptions. Descriptions keep their inspirational metrics.

9. **Prompt caching** — Long system prompts with knowledge base content benefit from Anthropic's prompt caching. The knowledge assembly service is designed with cache-friendly prefixes.

10. **TypeScript strict mode** — `strict: true`. No implicit `any`. All types must be complete.

---

## Latest E2E Results (Feb 9, 2026)

```
Version: 4.3.0
Duration: 678.6s (~11.3 min)
Cost: $0.3935
Portfolio Score: 6.2/10
Harvard Scale: 3/6 ("Good - Top 15%")
Tier Distribution: T1=0, T2=1, T3=4, T4=0
Archetype: innovator
Spike: Computer Science & Technical Problem-Solving

Per-Activity Scores:
  ML Research:    7.1/10 (Activity: 7.3, Description: 6.5) → projected 7.8
  CS Club:        5.5/10 (Activity: 6.3, Description: 3.5) → projected 6.8
  Grocery:        6.8/10 (Activity: 7.5, Description: 5.0) → projected 7.4
  Math Tutor:     4.4/10 (Activity: 5.0, Description: 3.0) → projected 6.2
  Family Farm:    5.7/10 (Activity: 6.5, Description: 3.5) → projected 6.5
  Portfolio projected: 6.2 → ~6.9/10
```

All 5 descriptions rewritten within 150 chars with vivid suggested metrics.
Category-specific narrative guidance verified for all categories.
Family Farm correctly receives family-specific (not work-specific) framing.

---

## How to Run

```bash
# TypeScript check (must pass)
npx tsc --noEmit

# Full E2E test (requires API key, ~$0.36-0.53)
ANTHROPIC_API_KEY="..." npx tsx tests/test-full-pipeline-e2e-output.ts

# Output goes to stdout — pipe to file for review:
ANTHROPIC_API_KEY="..." npx tsx tests/test-full-pipeline-e2e-output.ts > /tmp/e2e-output.txt 2>&1
```

---

## Current State of Uncommitted Changes

Files modified from HEAD (not yet committed):

```
stages/stage1ContextAwareAnalysisService.ts  — P3 tier recompute + P6 scoring-analysis reconciliation
stages/stage2ConditionalTeachingService.ts   — P1 category fix + ordering + P2 char limit + P4 fallbacks + P9 portfolio teaching + scoring merge
stages/stage3PortfolioSynthesisService.ts    — v4.3 scoring in synthesis + P7 action plan + inspirational metrics prompt
activityWorkshopService.ts                   — v4.3.0 version + scoring passthrough
types.ts                                     — scoringTeaching on TeachingContext + scoring on PipelineResult
tests/test-full-pipeline-e2e-output.ts       — P8 field fixes + P10 projected scores + scoring/teaching rendering
scoring/activityTeachingLayerService.ts      — Minor type fixes
scoring/descriptionScoringService.ts         — Minor type fixes
scoring/scoringOrchestrator.ts               — Minor type fixes
scoring/teachingLayerTypes.ts                — Minor type fixes
```

All changes are local, uncommitted. TypeScript compiles clean. E2E verified.

---

## What's Next (Potential Work)

The v4.3 pipeline is functionally complete. Possible future directions:

1. **Teaching iteration** — Let students iterate on specific activities after seeing scores (re-run scoring on just the changed activity)
2. **Comparative benchmarks** — Show how the student's activity compares to successful applicants in same major (data exists in `comparisonBenchmarksLibrary.ts`)
3. **Profile integration** — Feed `chat/` profile data into scoring for richer context
4. **Description A/B testing** — Present multiple description alternatives and let student choose
5. **Score tracking** — Track score improvements across sessions as student refines descriptions
6. **Front-end integration** — Wire the pipeline result into the React UI
7. **Cost optimization** — Use prompt caching more aggressively, batch more efficiently

---

## Environment & Dependencies

- **Runtime:** Node.js with `tsx` for TypeScript execution
- **TypeScript:** Strict mode, `npx tsc --noEmit` for type checking
- **AI:** Anthropic Claude API (models: `claude-sonnet-4-5-20250514`, `claude-haiku-4-5-20251001`)
- **API call wrapper:** `src/lib/llm/claude.ts` — `callClaude()` function
- **JSON parsing:** `src/services/commonAppWorkshop/utils/jsonParser.ts` — `parseClaudeJSON()` with `jsonrepair` fallback
- **No test framework** — Tests are standalone `npx tsx` scripts with manual assertions

---

*This document is self-contained. Any agent reading it should have full context to continue development with the same depth and rigor.*
