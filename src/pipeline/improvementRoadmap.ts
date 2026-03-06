/**
 * Improvement Roadmap — Generates prioritized improvement steps from annotations
 *
 * Phase 1C of the annotation pipeline V2. Converts non-strength annotations
 * into a categorized, priority-ranked roadmap with estimated EQI impact.
 *
 * Categorizes annotations into:
 * - quick_win: Sentence-level fixes with high impact-to-effort ratio
 * - deep_work: Structural, thematic, or character-level rework
 * - polish: Craft refinements (word choice, rhythm, transitions)
 *
 * Estimates EQI impact per step based on dimension weight and severity.
 *
 * Pure function — no LLM calls, no side effects.
 */

import type {
  EssayAnnotation,
  DerivedDimensionScore,
  AnnotationSeverity,
  ImprovementStep,
  ImprovementRoadmap,
} from './types';

// ============================================================================
// PUBLIC INTERFACE
// ============================================================================

/** Input for the roadmap generator */
export interface RoadmapGeneratorInput {
  /** All annotations produced by Phase 3 */
  annotations: EssayAnnotation[];
  /** Per-dimension scores derived in Phase 4 */
  dimensionScores: DerivedDimensionScore[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Severity multipliers for EQI impact estimation.
 * Higher multiplier = more EQI points recovered by fixing this issue.
 */
const SEVERITY_MULTIPLIER: Record<AnnotationSeverity, number> = {
  critical: 3,
  important: 2,
  suggestion: 1,
  strength: 0, // strengths are never included in the roadmap
};

/**
 * Dimension IDs that represent narrative/structural concerns.
 * Annotations for these dimensions at critical/important severity
 * are classified as deep_work (structural rework required).
 */
const NARRATIVE_DIMENSION_IDS = new Set<string>([
  'narrative_structure',
  'narrative_dynamics',
  'thematic_depth',
  'growth_transformation',
  'structural_coherence',
]);

/**
 * Dimension IDs where suggestion-level annotations with rewrite examples
 * are classified as quick_wins (sentence-level fixes).
 */
const QUICK_WIN_DIMENSION_IDS = new Set<string>([
  'word_economy',
  'tonal_sophistication',
]);

/**
 * Category sort order for global priority assignment.
 * Quick wins come first (highest ROI), then deep work (highest impact),
 * then polish (nice-to-have refinements).
 */
const CATEGORY_SORT_ORDER: Record<ImprovementStep['category'], number> = {
  quick_win: 0,
  deep_work: 1,
  polish: 2,
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a lookup map from dimensionId to effectiveWeight.
 * Returns 0 for unknown dimensions (defensive).
 */
function buildWeightMap(dimensionScores: DerivedDimensionScore[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const ds of dimensionScores) {
    map.set(ds.dimensionId, ds.effectiveWeight);
  }
  return map;
}

/**
 * Build a lookup map from dimensionId to displayName.
 * Falls back to the raw dimensionId if not found.
 */
function buildDisplayNameMap(dimensionScores: DerivedDimensionScore[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const ds of dimensionScores) {
    map.set(ds.dimensionId, ds.displayName);
  }
  return map;
}

/**
 * Classify a non-strength annotation into a roadmap category.
 *
 * Classification rules:
 * 1. quick_win: suggestion severity AND (has rewriteExample OR dimension is word_economy/tonal_sophistication)
 * 2. deep_work: critical/important severity AND dimension is narrative-related
 * 3. polish: everything else (suggestion-level craft improvements)
 */
function classifyAnnotation(annotation: EssayAnnotation): ImprovementStep['category'] {
  const { severity, dimensionId, rewriteExample } = annotation;

  // Rule 1: Quick wins — low-effort, high-value sentence-level fixes
  if (severity === 'suggestion') {
    const hasRewrite = rewriteExample !== undefined && rewriteExample.length > 0;
    if (hasRewrite || QUICK_WIN_DIMENSION_IDS.has(dimensionId)) {
      return 'quick_win';
    }
  }

  // Rule 2: Deep work — structural/thematic/narrative rework
  if (
    (severity === 'critical' || severity === 'important') &&
    NARRATIVE_DIMENSION_IDS.has(dimensionId)
  ) {
    return 'deep_work';
  }

  // Rule 3: Polish — everything else
  // This includes:
  // - critical/important annotations on non-narrative dimensions (still important, but more focused)
  // - suggestion annotations without rewrite examples on non-quick-win dimensions
  return 'polish';
}

/**
 * Estimate EQI impact for a single annotation.
 *
 * Formula: severityMultiplier * dimensionWeight * 100
 *
 * This produces a rough estimate of how many EQI points fixing this
 * issue could recover. The 100x scaling converts the 0-1 dimension
 * weight into the 0-100 EQI scale.
 */
function estimateEqiImpact(
  annotation: EssayAnnotation,
  weightMap: Map<string, number>,
): number {
  const multiplier = SEVERITY_MULTIPLIER[annotation.severity];
  const dimensionWeight = weightMap.get(annotation.dimensionId) ?? 0;
  return multiplier * dimensionWeight * 100;
}

/**
 * Build a human-readable description for an improvement step.
 *
 * Uses the annotation's suggestion as the base, prepending the dimension
 * display name for context. If the annotation has a rewrite example,
 * the description notes that a concrete example is available.
 */
function buildStepDescription(
  annotation: EssayAnnotation,
  displayNameMap: Map<string, string>,
): string {
  const dimensionName = displayNameMap.get(annotation.dimensionId) ?? annotation.dimensionId;
  const base = `[${dimensionName}] ${annotation.suggestion}`;

  if (annotation.rewriteExample && annotation.rewriteExample.length > 0) {
    return `${base} (rewrite example available)`;
  }

  return base;
}

/**
 * Create an ImprovementStep from a non-strength annotation.
 * Priority is assigned as 0 initially; final priority is set after sorting.
 */
function createStep(
  annotation: EssayAnnotation,
  weightMap: Map<string, number>,
  displayNameMap: Map<string, string>,
): ImprovementStep {
  return {
    annotationId: annotation.id,
    priority: 0, // placeholder — assigned after global sort
    category: classifyAnnotation(annotation),
    estimatedEqiImpact: estimateEqiImpact(annotation, weightMap),
    dimensionId: annotation.dimensionId,
    description: buildStepDescription(annotation, displayNameMap),
  };
}

/**
 * Sort steps within a category by estimatedEqiImpact DESC.
 * This ensures the most impactful fixes bubble to the top within each group.
 */
function sortByImpact(steps: ImprovementStep[]): ImprovementStep[] {
  return [...steps].sort((a, b) => b.estimatedEqiImpact - a.estimatedEqiImpact);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Generate a prioritized improvement roadmap from annotations and dimension scores.
 *
 * Algorithm:
 * 1. Filter to non-strength annotations only
 * 2. For each annotation, create an ImprovementStep with category and estimated EQI impact
 * 3. Sort by estimatedEqiImpact DESC within each category
 * 4. Order categories: quick_wins first, then deep_work, then polish
 * 5. Assign global priority ranks 1..N across all steps
 *
 * @param input - Annotations and dimension scores from the pipeline
 * @returns Categorized, priority-ranked improvement roadmap
 */
export function generateRoadmap(input: RoadmapGeneratorInput): ImprovementRoadmap {
  const { annotations, dimensionScores } = input;

  const weightMap = buildWeightMap(dimensionScores);
  const displayNameMap = buildDisplayNameMap(dimensionScores);

  // Step 1: Create improvement steps from non-strength annotations
  const allSteps = annotations
    .filter((a) => !a.isStrength)
    .map((a) => createStep(a, weightMap, displayNameMap));

  // Step 2: Bucket by category
  const quickWins: ImprovementStep[] = [];
  const deepWork: ImprovementStep[] = [];
  const polish: ImprovementStep[] = [];

  for (const step of allSteps) {
    switch (step.category) {
      case 'quick_win':
        quickWins.push(step);
        break;
      case 'deep_work':
        deepWork.push(step);
        break;
      case 'polish':
        polish.push(step);
        break;
    }
  }

  // Step 3: Sort within each category by impact DESC
  const sortedQuickWins = sortByImpact(quickWins);
  const sortedDeepWork = sortByImpact(deepWork);
  const sortedPolish = sortByImpact(polish);

  // Step 4: Merge into global priority order (quick_wins → deep_work → polish)
  const orderedSteps = [...sortedQuickWins, ...sortedDeepWork, ...sortedPolish];

  // Step 5: Assign priority ranks 1..N
  for (let i = 0; i < orderedSteps.length; i++) {
    orderedSteps[i].priority = i + 1;
  }

  return {
    steps: orderedSteps,
    quickWins: sortedQuickWins,
    deepWork: sortedDeepWork,
    polish: sortedPolish,
  };
}
