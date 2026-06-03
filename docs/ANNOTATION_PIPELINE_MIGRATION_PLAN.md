# Annotation Pipeline V2 — Migration Plan

> **Owner:** Migration Planner Agent
> **Created:** 2026-02-28
> **Status:** Complete — Ready for implementation review

---

## Table of Contents

1. [Consumer Dependency Map](#consumer-dependency-map)
2. [Dimension Systems Overview](#dimension-systems-overview)
3. [Breaking Changes](#breaking-changes)
4. [Migration Strategy](#migration-strategy)
5. [Feature Flags Needed](#feature-flags-needed)
6. [Database Migration](#database-migration)
7. [Rollback Plan](#rollback-plan)
8. [Risk Assessment](#risk-assessment)

---

## Consumer Dependency Map

### Three Dimension Systems in Play

The codebase has **three** independent dimension systems:

| System | Dimensions | Scale | Used By |
|--------|-----------|-------|---------|
| **Core Rubric** (v1.0.0/v1.0.1) | 12 dims (`opening_power_scene_entry`, `narrative_arc_stakes_turn`, etc.) | 0-10 | `src/core/`, analysis engine, scoring science |
| **Activity Workshop** | 11 dims (`voice_integrity`, `specificity_evidence`, etc.) | 0-10 | `src/http/routes.ts` fallback paths, frontend activity components |
| **Workshop Registry** (V1 annotation) | 13 dims (`narrative_craft_storytelling`, `emotional_resonance_vulnerability`, etc.) | 0-100 | `src/workshop/`, `src/pipeline/`, `src/services/enhancedWorkshop/`, `src/components/annotation/` |

**V2 changes ONLY affect the Workshop Registry system (13 dims).** The Core Rubric (12 dims) and Activity Workshop (11 dims) are NOT directly affected.

### Full Consumer File Map

#### A. Pipeline Internal Files (DIRECTLY AFFECTED)

| File | What It Imports | What It Uses | V2 Impact |
|------|----------------|-------------|-----------|
| `src/pipeline/types.ts` | `WorkshopEssayType`, `ImpressionLabel`, `ExtractedFeatures`, `FinalDimensionScore` from `workshop/shared/types` | `EssayAnnotation.dimensionId` (string), `DerivedDimensionScore.dimensionId` | **HIGH**: Comment says "13 dimensions", dimensionId values will change. Types themselves are fine (generic string). |
| `src/pipeline/annotationPipeline.ts` | `featureExtractor`, `essayProfileRegistry`, `dimensionRegistry` from `workshop` | `dimensionRegistry.getDimension(raw.dimensionId)` for validation | **HIGH**: Validates annotations against registry. Will auto-adapt if registry has new dimension IDs. |
| `src/pipeline/promptBuilder.ts` | `dimensionRegistry`, `essayProfileRegistry` from `workshop` | `dimensionRegistry.getAll()` to build dimension reference in LLM prompt. Hardcodes "13 total" in prompt text. | **HIGH**: Must update "13 total" to "10 total". Dimension reference auto-adapts from registry. |
| `src/pipeline/scoreDeriver.ts` | `dimensionRegistry`, `essayProfileRegistry`, `eqiCalculator` from `workshop` | `dimensionRegistry.getAll()`, per-dimension heuristic scoring, hardcoded `HEURISTIC_WEIGHT=0.4` / `ANNOTATION_WEIGHT=0.6` | **HIGH**: Per-dimension H/A weights replace hardcoded 40/60. Must support variable fusion weights. |
| `src/pipeline/deepDiveService.ts` | `commandRegistry` from `workshop`; `EssayAnnotation`, `DeepDiveResult` from `./types` | `annotation.dimensionId` in prompt text | **LOW**: Uses dimension ID as string in prompt, no validation against registry. Will work with new IDs. |
| `src/pipeline/reanalysisService.ts` | `ReanalysisRequest`, `ReanalysisResult`, `AnnotatedAnalysisResult`, `EssayAnnotation` from `./types` | Calls `annotationPipeline.analyze()` with fresh text | **LOW**: Delegates to pipeline, no direct dimension dependency. |
| `src/pipeline/batchActivityPipeline.ts` | `dimensionRegistry`, `essayProfileRegistry`, `featureExtractor` from `workshop`; `scoreDeriver` | `dimensionRegistry.getAll()` for prompt, `dimensionRegistry.getDimension()` for validation | **HIGH**: Same as annotationPipeline — validates against registry, hardcodes "13 scoring dimensions". |
| `src/pipeline/index.ts` | Re-exports all pipeline types and services | Barrel file | **LOW**: No code changes needed unless new types are added. |

#### B. Workshop System Files (DIRECTLY AFFECTED)

| File | What It Uses | V2 Impact |
|------|-------------|-----------|
| `src/workshop/dimensions/*.dim.ts` (13 files) | Each registers one dimension with `dimensionRegistry.register()` | **CRITICAL**: 5 files deleted (merged dims), 2 new files created, 3 files modified (absorb merged content). |
| `src/workshop/registry/dimensionRegistry.ts` | `DimensionManifest`, weight validation (`sum === 1.00`) | **MEDIUM**: Registry itself is generic. Just needs correct files imported. Weight validation auto-works. |
| `src/workshop/registry/essayProfileRegistry.ts` | `EssayProfileManifest` | **LOW**: No dimension-specific code. |
| `src/workshop/registry/commandRegistry.ts` | `CommandManifest` | **NONE**: Commands are dimension-agnostic. |
| `src/workshop/essay-profiles/*.profile.ts` (7 files) | `dimensionWeightOverrides` with dimension ID keys | **HIGH**: All 7 profiles reference old dimension IDs in weight overrides. Must update to new IDs. |
| `src/workshop/orchestrator/strategySelector.ts` | `ScoringResult.dimensionScores`, `FinalDimensionScore.dimensionId` | **LOW**: Uses dimension IDs from scoring result dynamically, no hardcoded IDs. |
| `src/workshop/scoring/hybridScoringPipeline.ts` | `dimensionRegistry.getAll()` | **LOW**: Iterates all registered dimensions. Auto-adapts to new set. |
| `src/workshop/scoring/featureExtractor.ts` | `ExtractedFeatures` | **NONE**: Pure text analysis, no dimension knowledge. |
| `src/workshop/scoring/eqiCalculator.ts` | `EQIInput`, `EQIResult`, `ImpressionLabel` | **LOW**: Uses dimension IDs from input, no hardcoded IDs. |
| `src/workshop/scoring/llmScoringService.ts` | `DimensionManifest.buildLLMPrompt()` | **LOW**: Calls dimension-provided functions. Auto-adapts. |
| `src/workshop/shared/types.ts` | Type definitions | **LOW**: Types use generic strings for dimension IDs. No changes needed unless DimensionManifest interface changes. |
| `src/workshop/index.ts` | Barrel exports + imports `./essay-profiles` and dimension registration | **MEDIUM**: If dimension files change, import paths may need updating. |

#### C. Enhanced Workshop / Bridge (DIRECTLY AFFECTED)

| File | What It Uses | V2 Impact |
|------|-------------|-----------|
| `src/services/enhancedWorkshop/workshopBridge.ts` | Imports all 13 `*.dim.ts` files individually, `hybridScoringPipeline`, `dimensionRegistry`, `commandRegistry`, `essayProfileRegistry`, `strategySelector` | **HIGH**: Hardcoded imports of all 13 dimension files must be updated to new 10. `getNewRubricWeights()` auto-adapts. Comments say "13-dim". |
| `src/services/enhancedWorkshop/improvementPlanner.ts` | `dimensionScores` via `EssaySnapshot`, lazy-loads `workshopBridge` functions. Has hardcoded `RUBRIC_WEIGHTS` (12-dim core rubric, NOT workshop dims). | **LOW-MEDIUM**: The hardcoded `RUBRIC_WEIGHTS` are core rubric dims (v1.0.1), not workshop dims. But `getNewRubricWeights()` path returns workshop dims and needs to work with new 10. |
| `src/services/enhancedWorkshop/types.ts` | `EssaySnapshot.dimensionScores: Record<string, number>`, `EssaySnapshot.weakestDimensions: string[]`, `ImprovementAction.dimension: string`, `EnhanceRequest.focusDimensions?: string[]` | **LOW**: All dimension references are generic strings. No hardcoded dimension IDs. |
| `src/services/enhancedWorkshop/index.ts` | Re-exports `workshopBridge` | **NONE** |
| `src/services/enhancedWorkshop/preAnalyzer.ts` | Uses enhanced workshop types | **LOW** |
| `src/services/enhancedWorkshop/writingEnhancementOrchestrator.ts` | Uses `EssaySnapshot`, calls planner | **LOW**: Generic dimension handling. |

#### D. Frontend Annotation Components (AFFECTED)

| File | What It Uses | V2 Impact |
|------|-------------|-----------|
| `src/components/annotation/types.ts` | Re-exports `EssayAnnotation`, `DerivedDimensionScore`, `AnnotatedAnalysisResult`, `DeepDiveResult`, `AnnotationSeverity` from `pipeline/types` | **LOW**: Types are generic. No dimension-specific code. |
| `src/components/annotation/AnnotatedWorkshopPage.tsx` | `AnnotatedAnalysisResult`, `AnnotationPipelineConfig` | **LOW**: Passes data through, no dimension processing. |
| `src/components/annotation/ScoreDashboardCompact.tsx` | `DerivedDimensionScore` — renders `dim.displayName`, `dim.score`, `dim.effectiveWeight` | **LOW**: Renders whatever dimensions exist. Will auto-show 10 instead of 13. |
| `src/components/annotation/AnnotationFilterBar.tsx` | `EssayAnnotation`, `AnnotationFilters.dimensionIds` | **LOW**: Filters by dynamic dimension IDs. |
| `src/components/annotation/AnnotationContextPanel.tsx` | `DerivedDimensionScore`, `AnnotatedAnalysisResult` | **LOW**: Renders dimension data generically. |
| `src/components/annotation/AnnotationDetailCard.tsx` | `EssayAnnotation` (dimensionId for display) | **LOW**: Shows dimension ID as label. |
| `src/components/annotation/hooks/useAnnotationState.ts` | `AnnotatedAnalysisResult` | **LOW**: State management, no dimension logic. |
| `src/components/annotation/hooks/useAnnotationResolver.ts` | `EssayAnnotation` | **NONE**: Text span resolution only. |
| `src/components/annotation/utils/highlightBuilder.ts` | `AnnotationSeverity` | **NONE**: Severity-based styling only. |
| `src/components/annotation/utils/anchorResolver.ts` | `EssayAnnotation` | **NONE**: Text anchoring only. |
| `src/components/annotation/activity/ActivityAnnotatedCard.tsx` | `EssayAnnotation`, `DerivedDimensionScore` | **LOW**: Renders dimension data generically. |
| `src/components/annotation/AnnotatedEssayReader.tsx` | Annotation display | **NONE** |
| `src/components/annotation/ParagraphWithGutter.tsx` | Annotation display | **NONE** |
| `src/components/annotation/WorkshopToolbar.tsx` | Toolbar actions | **NONE** |

#### E. API Routes (AFFECTED)

| File | What It Uses | V2 Impact |
|------|-------------|-----------|
| `src/http/annotationRoutes.ts` | `annotationPipeline`, `deepDiveService`, `reanalysisService`, `batchActivityPipeline` + request types | **LOW**: Passes through to pipeline services. No dimension logic. |
| `src/http/routes.ts` | Mounts `annotationRouter` at `/api/v1/annotate`. Hardcoded 11-dim activity rubric in fallback paths. | **NONE for V2**: The 11-dim activity rubric is a separate system. Annotation routes just mount the pipeline. |

#### F. Services Using OLD Dimension Systems (NOT DIRECTLY AFFECTED by V2)

| File | Dimension System | V2 Impact |
|------|-----------------|-----------|
| `src/core/essay/rubrics/v1.0.0.ts` | Core Rubric (12 dims) | **NONE** |
| `src/core/essay/rubrics/v1.0.1.ts` | Core Rubric (12 dims) | **NONE** |
| `src/core/essay/analysis/analysisEngine.ts` | Core Rubric (12 dims) | **NONE** |
| `src/core/essay/types/essay.ts` | Core Rubric (`RubricDimensionNames`) | **NONE** |
| `src/core/essay/types/rubric.ts` | Core Rubric types | **NONE** |
| `src/core/analysis/scoring/scoringScience/*.ts` (5 files) | Core Rubric (12 dims) | **NONE** |
| `src/services/narrativeWorkshop/analyzers/rubricAnalysisService.ts` | Core Rubric IDs (string references) | **NONE** |
| `src/services/narrativeWorkshop/strategies.ts` | Core Rubric IDs (`rubric_affinity` arrays) | **NONE** |
| `src/services/narrativeWorkshop/surgicalExamples.ts` | Core Rubric IDs | **NONE** |
| `src/services/piqWorkshopAnalysisService.ts` | Maps core rubric → activity rubric | **NONE** |
| `src/services/unified/feedbackFormatter.ts` | Core Rubric IDs | **NONE** |
| `src/services/unified/calibrationData.ts` | Core Rubric IDs | **NONE** |

#### G. Tests

| File | V2 Impact |
|------|-----------|
| `tests/activity/test-kb-and-cross-user-cache.ts` | **LOW**: Activity scoring tests, may reference dimension counts |
| `tests/workshop/test-hybrid-scoring-calibration.ts` | **HIGH**: Likely validates 13-dimension scores |
| `tests/workshop/test-workshop-integration.ts` | **HIGH**: Workshop integration, dimension validation |
| `tests/workshop/test-workshop-registry.ts` | **HIGH**: Registry tests, dimension count assertions |
| `tests/workshop/test-workshop-llm-e2e.ts` | **MEDIUM**: LLM scoring E2E |
| `tests/workshop/test-essay-profiles-calibration.ts` | **HIGH**: Profile weight assertions |

---

## Dimension Transition: 13 → 10

### Current 13 Dimensions (V1)

| # | ID | Weight | V2 Fate |
|---|-----|--------|---------|
| 1 | `narrative_craft_storytelling` | 8% | **ABSORBS** `tonal_sophistication` → renamed `narrative_craft_scene_construction` (10%) |
| 2 | `emotional_resonance_vulnerability` | 8% | **KEPT** (11%) |
| 3 | `intellectual_vitality_curiosity` | 9% | **KEPT** (11%) |
| 4 | `originality_voice_authenticity` | 10% | **MERGED** with `authenticity_specificity_detail` → `voice_originality_irreplaceability` (14%) |
| 5 | `structural_coherence_flow` | 8% | **ABSORBS** `opening_hook_engagement` + `closing_impact_resolution` (8%) |
| 6 | `thematic_depth_self_awareness` | 9% | **ABSORBS** `growth_transformation_arc` (13%) |
| 7 | `opening_hook_engagement` | 6% | **FOLDED** into `structural_coherence_flow` |
| 8 | `closing_impact_resolution` | 6% | **FOLDED** into `structural_coherence_flow` |
| 9 | `growth_transformation_arc` | 8% | **MERGED** into `thematic_depth_self_awareness` |
| 10 | `authenticity_specificity_detail` | 8% | **MERGED** into `voice_originality_irreplaceability` |
| 11 | `tonal_sophistication` | 6% | **MERGED** into `narrative_craft_scene_construction` |
| 12 | `argument_rhetorical_craft` | 7% | **TRANSFORMED** → `clarity_of_purpose_throughline` (8%) |
| 13 | `word_economy_craft` | 7% | **KEPT** (6%) |

### New 10 Dimensions (V2)

| # | ID | Weight | Source |
|---|-----|--------|--------|
| 1 | `voice_originality_irreplaceability` | 14% | Merge of `originality_voice_authenticity` + `authenticity_specificity_detail` |
| 2 | `thematic_depth_self_awareness` | 13% | Absorbs `growth_transformation_arc` |
| 3 | `emotional_resonance_vulnerability` | 11% | Kept, reweighted |
| 4 | `intellectual_vitality_curiosity` | 11% | Kept, reweighted |
| 5 | `narrative_craft_scene_construction` | 10% | `narrative_craft_storytelling` absorbs `tonal_sophistication` |
| 6 | `memorability_committee_impact` | 10% | **NEW** |
| 7 | `agency_initiative` | 9% | **NEW** |
| 8 | `structural_coherence_flow` | 8% | Absorbs `opening_hook_engagement` + `closing_impact_resolution` |
| 9 | `clarity_of_purpose_throughline` | 8% | Transform of `argument_rhetorical_craft` |
| 10 | `word_economy_craft` | 6% | Kept, reweighted |

**Weight check:** 14 + 13 + 11 + 11 + 10 + 10 + 9 + 8 + 8 + 6 = **100%**

---

## Breaking Changes

### BC-1: Dimension ID Renames (7 IDs change)

**Affected:** Every file that hardcodes dimension IDs as strings.

| Old ID | New ID |
|--------|--------|
| `originality_voice_authenticity` | `voice_originality_irreplaceability` |
| `authenticity_specificity_detail` | *(deleted, merged into above)* |
| `narrative_craft_storytelling` | `narrative_craft_scene_construction` |
| `tonal_sophistication` | *(deleted, merged into above)* |
| `argument_rhetorical_craft` | `clarity_of_purpose_throughline` |
| `growth_transformation_arc` | *(deleted, merged into `thematic_depth_self_awareness`)* |
| `opening_hook_engagement` | *(deleted, folded into `structural_coherence_flow`)* |
| `closing_impact_resolution` | *(deleted, folded into `structural_coherence_flow`)* |

**Files with hardcoded old IDs:**
- `src/workshop/essay-profiles/*.profile.ts` (7 files) — `dimensionWeightOverrides` keys
- `src/workshop/dimensions/*.dim.ts` (13 files) — `const ID = '...'` and `dimensionRegistry.register()`
- `src/services/enhancedWorkshop/workshopBridge.ts` — hardcoded import paths for all 13 dim files

### BC-2: Dimension Count Change (13 → 10)

**Affected:**
- `src/pipeline/promptBuilder.ts` — hardcodes "13 total" in system prompt
- `src/pipeline/batchActivityPipeline.ts` — comment says "13 scoring dimensions"
- `src/components/annotation/ScoreDashboardCompact.tsx` — comment says "13 dimension bars"
- Any test that asserts `dimensions.length === 13`

### BC-3: Score Fusion Weight Change (per-dimension H/A replaces hardcoded 40/60)

**Affected:**
- `src/pipeline/scoreDeriver.ts` — `HEURISTIC_WEIGHT = 0.4`, `ANNOTATION_WEIGHT = 0.6` are constants

**V2 requirement:** Each dimension has its own H/A weight ratio. Must be stored on `DimensionManifest` or in a separate calibration config.

### BC-4: Dimension Weight Changes

**Affected:**
- `src/workshop/dimensions/*.dim.ts` — each has `weight: 0.XX`
- `src/workshop/essay-profiles/*.profile.ts` — `dimensionWeightOverrides` with old IDs and weights
- `dimensionRegistry.validateWeights()` — will catch weight sum errors at startup

### BC-5: Response Schema Change (array → object) [FUTURE]

**Affected (when implemented):**
- `src/pipeline/annotationPipeline.ts` — `parseAnnotations()` expects JSON array
- `src/pipeline/batchActivityPipeline.ts` — `parseResponse()` expects `{ activities, portfolioPatterns }`
- `src/pipeline/types.ts` — `AnnotatedAnalysisResult` would gain new fields (`structure`, `contentAnalysis`)

**Note:** This can be additive. Keep `annotations[]` as-is and add new fields alongside it.

### BC-6: New Dimension Files Needed

2 new `*.dim.ts` files must be created:
- `src/workshop/dimensions/memorability-committee.dim.ts` — `memorability_committee_impact`
- `src/workshop/dimensions/agency-initiative.dim.ts` — `agency_initiative`

### BC-7: Heuristic Scorer Consolidation

Merged dimensions need consolidated heuristic scorers. For example, `voice_originality_irreplaceability` must combine signals from both `originality_voice_authenticity` AND `authenticity_specificity_detail`.

---

## Migration Strategy

### Phase 1: Backward-Compatible Foundation (No Breaking Changes)

**Goal:** Add V2 dimension files alongside V1 without breaking anything.

1. **Create new dimension files** (additive only):
   - `src/workshop/dimensions/memorability-committee.dim.ts`
   - `src/workshop/dimensions/agency-initiative.dim.ts`
   - Do NOT register these yet (or register behind a feature flag)

2. **Add V2 types** (additive):
   - Add `DimensionManifest.fusionWeights?: { heuristic: number; annotation: number }` as optional field
   - Add response schema extensions to `pipeline/types.ts` as optional fields on `AnnotatedAnalysisResult`

3. **Create dimension ID mapping utility**:
   ```typescript
   // src/workshop/shared/dimensionMapping.ts
   export const V1_TO_V2_DIMENSION_MAP: Record<string, string> = {
     originality_voice_authenticity: 'voice_originality_irreplaceability',
     authenticity_specificity_detail: 'voice_originality_irreplaceability',
     narrative_craft_storytelling: 'narrative_craft_scene_construction',
     tonal_sophistication: 'narrative_craft_scene_construction',
     argument_rhetorical_craft: 'clarity_of_purpose_throughline',
     growth_transformation_arc: 'thematic_depth_self_awareness',
     opening_hook_engagement: 'structural_coherence_flow',
     closing_impact_resolution: 'structural_coherence_flow',
     // Kept (renamed or same):
     emotional_resonance_vulnerability: 'emotional_resonance_vulnerability',
     intellectual_vitality_curiosity: 'intellectual_vitality_curiosity',
     structural_coherence_flow: 'structural_coherence_flow',
     thematic_depth_self_awareness: 'thematic_depth_self_awareness',
     word_economy_craft: 'word_economy_craft',
   };
   ```

4. **Create V2 dimension set module** (self-contained, not yet wired):
   - `src/workshop/dimensions/v2/` directory with all 10 dimension files
   - Each file has consolidated heuristic scorers from merged V1 dims

**Deliverables:** New files only. Zero changes to existing files. V1 continues to work exactly as before.

### Phase 2: Dimension Transition (Feature-Flagged)

**Goal:** Enable V2 dimensions behind a flag while V1 remains the default.

1. **Add dimension version to DimensionRegistry**:
   ```typescript
   class DimensionRegistry {
     private v1Dimensions = new Map<string, DimensionManifest>();
     private v2Dimensions = new Map<string, DimensionManifest>();
     private activeVersion: 'v1' | 'v2' = 'v1';

     setVersion(version: 'v1' | 'v2'): void { ... }
     getAll(): DimensionManifest[] { /* returns active version */ }
   }
   ```

2. **Update essay profiles with dual keys**:
   ```typescript
   dimensionWeightOverrides: {
     // V1 keys (active until flag flipped):
     narrative_craft_storytelling: 0.10,
     // V2 keys (ignored until flag flipped):
     narrative_craft_scene_construction: 0.10,
   }
   ```
   Or: create `v2DimensionWeightOverrides` alongside existing field.

3. **Update scoreDeriver for per-dimension fusion**:
   - Read `fusionWeights` from `DimensionManifest` if present
   - Fall back to hardcoded 40/60 if not present (backward compatible)

4. **Update workshopBridge**:
   - When `useV2Dimensions` flag is set, import V2 dimension files instead of V1
   - Update `preAnalyzeWithNewPipeline()` and `fullAnalyzeWithNewPipeline()` to use V2 registry

5. **Update promptBuilder**:
   - Read dimension count from registry (`dimensionRegistry.getAll().length`) instead of hardcoding "13 total"

6. **Update tests**:
   - Add V2 dimension tests alongside V1
   - Test weight validation with new 10-dimension set
   - Test dimension mapping utility

**Deliverables:** Feature-flagged V2 path. V1 still default. Both paths tested.

### Phase 3: Schema Evolution (Additive)

**Goal:** Extend the result object with new analysis types without breaking existing consumers.

1. **Extend `AnnotatedAnalysisResult`** (all new fields optional):
   ```typescript
   interface AnnotatedAnalysisResult {
     // ... existing fields unchanged ...

     // V2 additions (optional, backward compatible):
     structure?: StructureAnalysis;
     contentAnalysis?: ContentAnalysis;
     improvementRoadmap?: ImprovementRoadmap;
     craftFeatures?: CraftFeatures;
   }
   ```

2. **Update `annotationPipeline.ts` parseAnnotations()**:
   - Support both JSON array (V1) and `{ annotations, structure, contentAnalysis }` (V2) response formats
   - Parse format based on what the LLM returns

3. **Frontend components** auto-ignore unknown fields — no changes needed for existing UI.

**Deliverables:** Extended types, dual-format parser. Zero breaking changes.

### Phase 4: Consumer Updates (File-by-File Migration Order)

**Goal:** Switch default from V1 to V2. Update all consumers.

**Migration order** (respects dependency chain):

```
Layer 0: Types & Utilities
  1. src/workshop/shared/types.ts — Add fusionWeights to DimensionManifest
  2. src/workshop/shared/dimensionMapping.ts — Already created in Phase 1
  3. src/pipeline/types.ts — Add optional V2 fields to AnnotatedAnalysisResult

Layer 1: Registry & Dimensions
  4. src/workshop/dimensions/v2/*.dim.ts — Finalize all 10 dimension files
  5. src/workshop/registry/dimensionRegistry.ts — Add version support
  6. src/workshop/index.ts — Update imports for V2 dimensions

Layer 2: Scoring
  7. src/pipeline/scoreDeriver.ts — Per-dimension fusion weights
  8. src/workshop/scoring/hybridScoringPipeline.ts — Works auto, verify
  9. src/workshop/scoring/eqiCalculator.ts — Works auto, verify

Layer 3: Prompt & Pipeline
  10. src/pipeline/promptBuilder.ts — Dynamic dimension count, V2 prompt tweaks
  11. src/pipeline/annotationPipeline.ts — Dual-format response parsing
  12. src/pipeline/batchActivityPipeline.ts — Same updates as annotationPipeline
  13. src/pipeline/deepDiveService.ts — Verify works with new dimension IDs

Layer 4: Bridge & Enhanced Workshop
  14. src/services/enhancedWorkshop/workshopBridge.ts — Update dim imports, comments
  15. src/services/enhancedWorkshop/improvementPlanner.ts — Verify new pipeline path

Layer 5: Essay Profiles
  16. src/workshop/essay-profiles/personal-statement.profile.ts — V2 dimension IDs + weights
  17. src/workshop/essay-profiles/uc-piq.profile.ts
  18. src/workshop/essay-profiles/why-us.profile.ts
  19. src/workshop/essay-profiles/community.profile.ts
  20. src/workshop/essay-profiles/identity-background.profile.ts
  21. src/workshop/essay-profiles/activity-essay.profile.ts
  22. src/workshop/essay-profiles/analytical.profile.ts

Layer 6: Frontend (last — adapts to whatever backend sends)
  23. src/components/annotation/ScoreDashboardCompact.tsx — Update comment only
  24. Remaining annotation components — verify rendering with 10 dims

Layer 7: Tests
  25. Update all test files with V2 dimension expectations
  26. Add migration/compatibility tests
```

**Deliverables:** V2 becomes the default. V1 dimension files can be kept for rollback.

---

## Feature Flags Needed

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `USE_V2_DIMENSIONS` | `boolean` | `false` | Switches dimension registry to V2 (10 dims). Controls which `*.dim.ts` files are active. |
| `USE_V2_RESPONSE_SCHEMA` | `boolean` | `false` | Enables parsing of `{ annotations, structure, contentAnalysis }` response format. |
| `USE_PER_DIM_FUSION_WEIGHTS` | `boolean` | `false` | Uses per-dimension H/A weights instead of hardcoded 40/60. |

**Implementation:** Flags can be environment variables (`process.env.ANNOTATION_V2_DIMENSIONS === 'true'`) or runtime config. Since these are server-side only, env vars are simplest.

**Lifecycle:**
1. Deploy with all flags `false` (V1 behavior)
2. Enable `USE_V2_DIMENSIONS` + `USE_PER_DIM_FUSION_WEIGHTS` together (dimension transition)
3. Enable `USE_V2_RESPONSE_SCHEMA` after LLM prompts are updated
4. After validation period, remove flags and V1 code

---

## Database Migration

### Current Schema

The `essay_analysis_reports` table stores dimension scores as JSONB:

```sql
dimension_scores JSONB NOT NULL,  -- Array of 12 rubric dimension scores with evidence
CONSTRAINT dimension_scores_valid CHECK (jsonb_typeof(dimension_scores) = 'array')
```

**Important:** This JSONB column stores **core rubric** dimension scores (12 dims: `opening_power_scene_entry`, etc.), NOT workshop dimension scores. V2 workshop dimension changes do NOT affect this column.

### Annotation Pipeline Results Storage

The annotation pipeline results (`AnnotatedAnalysisResult`) are **NOT currently persisted to the database**. They are returned directly in API responses. If/when persistence is added:

```sql
-- Future migration for annotation pipeline results
CREATE TABLE annotation_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,  -- Clerk user ID
  essay_id UUID REFERENCES essays(id),

  -- Version tracking
  dimension_version TEXT NOT NULL DEFAULT 'v1',  -- 'v1' (13 dims) or 'v2' (10 dims)
  pipeline_version TEXT NOT NULL DEFAULT '1.0',

  -- Results (JSONB for flexibility during migration)
  annotations JSONB NOT NULL,
  dimension_scores JSONB NOT NULL,
  eqi NUMERIC(5,2) NOT NULL,
  impression_label TEXT NOT NULL,
  summary JSONB NOT NULL,

  -- V2 additions (nullable for backward compatibility)
  structure_analysis JSONB,
  content_analysis JSONB,
  improvement_roadmap JSONB,
  craft_features JSONB,

  -- Meta
  cost_usd NUMERIC(8,4),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_annotations CHECK (jsonb_typeof(annotations) = 'array'),
  CONSTRAINT valid_dimension_scores CHECK (jsonb_typeof(dimension_scores) = 'array')
);

-- Index for querying by version
CREATE INDEX idx_annotation_results_version ON annotation_analysis_results(dimension_version);
```

### Data Migration for Existing Results

If annotation results ARE stored somewhere (e.g., client-side cache, localStorage):
- Include `dimension_version` in every stored result
- On read, check version and apply mapping if needed:
  ```typescript
  function migrateV1ToV2(result: AnnotatedAnalysisResult): AnnotatedAnalysisResult {
    return {
      ...result,
      annotations: result.annotations.map(a => ({
        ...a,
        dimensionId: V1_TO_V2_DIMENSION_MAP[a.dimensionId] ?? a.dimensionId,
      })),
      dimensionScores: remapDimensionScores(result.dimensionScores),
    };
  }
  ```

---

## Rollback Plan

### Level 1: Feature Flag Rollback (Instant)

Set all V2 feature flags to `false`:
```bash
export ANNOTATION_V2_DIMENSIONS=false
export ANNOTATION_V2_RESPONSE_SCHEMA=false
export ANNOTATION_V2_FUSION_WEIGHTS=false
```

Restart the server. All annotation pipeline calls revert to V1 behavior (13 dimensions, 40/60 fusion, array response format).

**Prerequisite:** V1 dimension files must still be present in the codebase.

### Level 2: Code Rollback (Git)

If Phase 4 (consumer updates) has been completed and V1 code removed:
```bash
git revert <V2-migration-commits>
```

**Prerequisite:** Migration was done in atomic commits per the Phase 4 order.

### Level 3: Data Rollback

If annotation results were persisted with V2 dimension IDs:
```sql
-- Revert V2 dimension scores to V1 (reverse mapping)
UPDATE annotation_analysis_results
SET dimension_version = 'v1',
    dimension_scores = (
      -- Apply reverse mapping
      SELECT jsonb_agg(
        jsonb_set(score, '{dimensionId}',
          to_jsonb(COALESCE(
            (SELECT key FROM jsonb_each_text('{"voice_originality_irreplaceability":"originality_voice_authenticity"}'::jsonb)
             WHERE value = score->>'dimensionId'),
            score->>'dimensionId'
          ))
        )
      ) FROM jsonb_array_elements(dimension_scores) AS score
    )
WHERE dimension_version = 'v2';
```

---

## Risk Assessment

### Per-Consumer Risk Matrix

| Consumer | Risk | Justification |
|----------|------|---------------|
| `src/workshop/dimensions/*.dim.ts` | **CRITICAL** | Core dimension files must be replaced. Heuristic scorers must be consolidated correctly or scoring breaks silently. |
| `src/workshop/essay-profiles/*.profile.ts` | **HIGH** | 7 files with hardcoded dimension IDs. Miss one override → incorrect weight normalization → silent score drift. |
| `src/pipeline/scoreDeriver.ts` | **HIGH** | Per-dimension fusion weights change the fundamental scoring math. Must be calibrated carefully. |
| `src/pipeline/promptBuilder.ts` | **HIGH** | LLM prompt references dimension IDs. Wrong prompt → LLM produces annotations with invalid dimension IDs → all annotations silently dropped. |
| `src/pipeline/annotationPipeline.ts` | **MEDIUM** | Validates annotations against registry. Auto-adapts BUT could silently drop valid V2 annotations if registry isn't updated. |
| `src/pipeline/batchActivityPipeline.ts` | **MEDIUM** | Same risk as annotationPipeline. |
| `src/services/enhancedWorkshop/workshopBridge.ts` | **MEDIUM** | Hardcoded dimension imports. Will crash at import time if files don't exist — fail-fast, easy to catch. |
| `src/components/annotation/*` | **LOW** | Frontend renders whatever dimensions exist. May look odd with fewer bars but won't break. |
| `src/http/annotationRoutes.ts` | **LOW** | Pass-through only. No dimension logic. |
| `src/pipeline/deepDiveService.ts` | **LOW** | Uses dimension IDs as strings in prompts. Works with any ID. |
| `src/core/**` (12-dim rubric) | **NONE** | Completely separate dimension system. Not touched by V2. |
| `src/http/routes.ts` (11-dim activity) | **NONE** | Completely separate dimension system. Not touched by V2. |

### Top Risks

1. **Silent scoring regression**: If heuristic scorers for merged dimensions don't properly combine signals from both source dimensions, scores will drift without obvious errors.
   - **Mitigation:** Calibration test suite (already in progress) comparing V1 vs V2 scores on same essays.

2. **LLM prompt / registry mismatch**: If the LLM prompt lists V2 dimension IDs but the registry still has V1, all annotations get dropped.
   - **Mitigation:** Feature flag ensures prompt and registry switch together. Startup validation catches mismatches.

3. **Essay profile weight normalization**: If some profiles have V1 IDs and others have V2, `eqiCalculator` will misweight dimensions.
   - **Mitigation:** Update all 7 profiles atomically in a single commit.

4. **Cached/stored V1 results breaking**: If any V1 results are cached (client-side, DB), reading them after V2 deploy could fail.
   - **Mitigation:** Version tag on all stored results. Migration function for reads.

---

## Summary: What to Do First

1. **Phase 1 is zero-risk.** Start immediately. Create V2 dimension files, mapping utility, and type extensions. No existing code changes.

2. **Phase 2 requires careful feature flag design.** Plan the `DimensionRegistry` versioning API before coding.

3. **Phase 3 is independent of Phase 2.** Can be done in parallel (additive schema changes).

4. **Phase 4 is the big switch.** Do it in the exact file order listed above. Test each layer before proceeding to the next.

5. **Keep V1 dimension files for at least 2 weeks after V2 goes default.** Feature flag rollback is instant.
