/**
 * Score Deriver — Phase 4 of the Annotation Pipeline
 *
 * Derives per-dimension scores by fusing two signals:
 *   1. Heuristic scores from deterministic feature extraction (~50ms)
 *   2. Annotation-derived signals from the LLM's inline annotations
 *
 * Fusion: finalScore = heuristicScore * hWeight + annotationSignalScore * aWeight
 *
 * Default weights are 0.4 heuristic / 0.6 annotation, with per-dimension
 * overrides for dimensions where one signal is stronger (e.g., authenticity
 * leans 0.3/0.7 toward annotations; structural_coherence leans 0.55/0.45
 * toward heuristics). Configurable at runtime via setCalibration().
 *
 * The annotation signal captures what the LLM actually observed in the text
 * (strengths and issues per dimension), while heuristics provide a stable
 * baseline from measurable text features.
 */

import type {
  DerivedDimensionScore,
  ScoreDerivationInput,
  EssayAnnotation,
  AnnotationSeverity,
  ScoreCalibrationConfig,
} from './types';
import type {
  EQIInput,
  ImpressionLabel,
  DimensionManifest,
} from '../workshop/shared/types';
import {
  dimensionRegistry,
  essayProfileRegistry,
  eqiCalculator,
} from '../workshop';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default calibration: per-dimension weights for heuristic vs annotation signal fusion */
const DEFAULT_CALIBRATION: ScoreCalibrationConfig = {
  heuristicWeight: 0.4,
  annotationWeight: 0.6,
  dimensionSignalWeights: {
    // Dimensions where annotation evidence is particularly valuable
    authenticity_specificity: { heuristic: 0.3, annotation: 0.7 },
    thematic_depth: { heuristic: 0.3, annotation: 0.7 },
    emotional_resonance: { heuristic: 0.35, annotation: 0.65 },
    growth_transformation: { heuristic: 0.3, annotation: 0.7 },
    // Dimensions where heuristics are strong
    word_economy: { heuristic: 0.5, annotation: 0.5 },
    structural_coherence: { heuristic: 0.55, annotation: 0.45 },
  },
};

/** Annotation signal scoring: base score and adjustments */
const ANNOTATION_BASE_SCORE = 70;
const STRENGTH_BONUS = 5;
const STRENGTH_CAP = 20;

/** Severity penalties (per annotation of that severity) */
const SEVERITY_PENALTY: Record<Exclude<AnnotationSeverity, 'strength'>, number> = {
  critical: 8,
  important: 5,
  suggestion: 3,
};
const PENALTY_CAP = 40;

// ============================================================================
// SCORE DERIVER
// ============================================================================

export class ScoreDeriver {
  /** Calibration config — per-dimension heuristic/annotation weights */
  private calibration: ScoreCalibrationConfig = { ...DEFAULT_CALIBRATION };

  /**
   * Override calibration weights at runtime.
   * Merges with existing calibration (partial updates are fine).
   */
  setCalibration(config: Partial<ScoreCalibrationConfig>): void {
    if (config.heuristicWeight !== undefined) {
      this.calibration.heuristicWeight = config.heuristicWeight;
    }
    if (config.annotationWeight !== undefined) {
      this.calibration.annotationWeight = config.annotationWeight;
    }
    if (config.dimensionSignalWeights) {
      this.calibration.dimensionSignalWeights = {
        ...this.calibration.dimensionSignalWeights,
        ...config.dimensionSignalWeights,
      };
    }
  }

  /**
   * Derive dimension scores from annotations + heuristic features.
   *
   * @param input - Annotations from Phase 3, extracted features, and essay type
   * @returns Per-dimension scores, EQI, and impression label
   */
  deriveScores(input: ScoreDerivationInput): {
    dimensionScores: DerivedDimensionScore[];
    eqi: number;
    impressionLabel: ImpressionLabel;
  } {
    const { annotations, features, essayType } = input;
    const dimensions = dimensionRegistry.getAll();

    if (dimensions.length === 0) {
      console.warn('[ScoreDeriver] No dimensions registered. Returning empty scores.');
      return {
        dimensionScores: [],
        eqi: 0,
        impressionLabel: 'template_like_rebuild',
      };
    }

    // Get essay profile for weight overrides
    const profile = essayProfileRegistry.getProfile(essayType);
    const weightOverrides = profile?.dimensionWeightOverrides ?? {};

    // Build per-dimension annotation index for O(1) lookup
    const annotationsByDimension = this.indexAnnotationsByDimension(annotations);

    // Score each dimension
    const dimensionScores: DerivedDimensionScore[] = dimensions.map(dimension => {
      const dimAnnotations = annotationsByDimension.get(dimension.id) || [];

      // Step 1: Get heuristic score
      const heuristicResult = dimension.heuristicScore(features);
      const heuristicScore = clamp(heuristicResult.score, 0, 100);

      // Step 2: Compute annotation signal
      const { signalScore, strengthCount, issueCount } =
        this.computeAnnotationSignal(dimAnnotations);

      // Step 3: Fuse scores with per-dimension calibration
      const dimCalibration = this.calibration.dimensionSignalWeights?.[dimension.id];
      const hWeight = dimCalibration?.heuristic ?? this.calibration.heuristicWeight;
      const aWeight = dimCalibration?.annotation ?? this.calibration.annotationWeight;

      const fusedScore = clamp(
        Math.round(heuristicScore * hWeight + signalScore * aWeight),
        0,
        100,
      );

      // Step 4: Get effective weight (profile override or default)
      const effectiveWeight = weightOverrides[dimension.id] ?? dimension.weight;

      return {
        dimensionId: dimension.id,
        displayName: dimension.displayName,
        score: fusedScore,
        heuristicScore,
        annotationSignal: {
          count: dimAnnotations.length,
          strengthCount,
          issueCount,
        },
        annotationIds: dimAnnotations.map(a => a.id),
        effectiveWeight,
      };
    });

    // Build EQI inputs using effective weights (let eqiCalculator handle normalization)
    const eqiInputs: EQIInput[] = dimensionScores.map(ds => ({
      dimensionId: ds.dimensionId,
      score: ds.score,
      weight: ds.effectiveWeight,
    }));

    // Calculate EQI — pass essayType so eqiCalculator applies profile overrides + normalization
    const eqiResult = eqiCalculator.calculate(eqiInputs, essayType);

    return {
      dimensionScores,
      eqi: eqiResult.eqi,
      impressionLabel: eqiResult.impressionLabel,
    };
  }

  /**
   * Index annotations by dimensionId for efficient per-dimension lookup.
   */
  private indexAnnotationsByDimension(
    annotations: EssayAnnotation[],
  ): Map<string, EssayAnnotation[]> {
    const index = new Map<string, EssayAnnotation[]>();
    for (const annotation of annotations) {
      const existing = index.get(annotation.dimensionId);
      if (existing) {
        existing.push(annotation);
      } else {
        index.set(annotation.dimensionId, [annotation]);
      }
    }
    return index;
  }

  /**
   * Compute the annotation-derived signal score for a single dimension.
   *
   * Starts at a neutral base (70), then adjusts:
   *   - +5 per strength annotation (capped at +20)
   *   - -8 per critical, -5 per important, -3 per suggestion (capped at -40)
   *
   * Returns the signal score plus strength/issue counts for the score breakdown.
   */
  private computeAnnotationSignal(annotations: EssayAnnotation[]): {
    signalScore: number;
    strengthCount: number;
    issueCount: number;
  } {
    let strengthCount = 0;
    let issueCount = 0;
    let strengthBonus = 0;
    let issuePenalty = 0;

    for (const annotation of annotations) {
      if (annotation.isStrength) {
        strengthCount++;
        strengthBonus += STRENGTH_BONUS;
      } else {
        issueCount++;
        const severity = annotation.severity as Exclude<AnnotationSeverity, 'strength'>;
        issuePenalty += SEVERITY_PENALTY[severity] ?? SEVERITY_PENALTY.suggestion;
      }
    }

    // Apply caps
    strengthBonus = Math.min(strengthBonus, STRENGTH_CAP);
    issuePenalty = Math.min(issuePenalty, PENALTY_CAP);

    const signalScore = clamp(ANNOTATION_BASE_SCORE + strengthBonus - issuePenalty, 0, 100);

    return { signalScore, strengthCount, issueCount };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/** Clamp a number to [min, max] */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const scoreDeriver = new ScoreDeriver();
