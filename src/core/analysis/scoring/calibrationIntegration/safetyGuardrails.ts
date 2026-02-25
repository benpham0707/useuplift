/**
 * Safety Guardrails — Hard limits preventing catastrophic scoring changes
 *
 * This module enforces absolute bounds on calibration adjustments.
 * No matter what the Bayesian posterior says, no matter what IRT suggests,
 * these limits CANNOT be exceeded.
 *
 * DESIGN PHILOSOPHY:
 * - Better to under-calibrate than to produce a wildly wrong score
 * - All limits are per-dimension AND per-essay (both must pass)
 * - Workshop-specific limits reflect the signal quality of input text
 * - Limits tighten at lower calibration levels (defense in depth)
 *
 * INVARIANT: For any input, the output score is always within
 * [raw - maxAdjustment, raw + maxAdjustment] per dimension, AND
 * the QI change is within [-maxQIChange, +maxQIChange].
 */

import {
  CalibrationLevel,
  WorkshopType,
  WorkshopSafetyLimits,
  SafetyCheckResult,
  WORKSHOP_SAFETY_LIMITS,
} from './types';

// ============================================================================
// PER-LEVEL ADJUSTMENT CAPS
// ============================================================================

/**
 * Maximum per-dimension adjustment allowed at each calibration level.
 * These are ADDITIONAL caps on top of the workshop safety limits.
 * The effective cap is min(level_cap, workshop_cap).
 */
const LEVEL_ADJUSTMENT_CAPS: Record<CalibrationLevel, number> = {
  [CalibrationLevel.SHADOW]: 0,       // Shadow: no changes applied
  [CalibrationLevel.LIGHT]: 0.5,      // Light: max ±0.5
  [CalibrationLevel.MODERATE]: 1.0,   // Moderate: max ±1.0
  [CalibrationLevel.FULL]: 2.0,       // Full: max ±2.0 (workshop limits apply)
  [CalibrationLevel.FULL_WITH_AUTOFIX]: 2.5, // Full+autofix: max ±2.5
};

/**
 * Maximum QI change allowed at each level.
 */
const LEVEL_QI_CAPS: Record<CalibrationLevel, number> = {
  [CalibrationLevel.SHADOW]: 0,
  [CalibrationLevel.LIGHT]: 3,
  [CalibrationLevel.MODERATE]: 6,
  [CalibrationLevel.FULL]: 12,
  [CalibrationLevel.FULL_WITH_AUTOFIX]: 15,
};

// ============================================================================
// SAFETY CHECK ENGINE
// ============================================================================

/**
 * Apply safety guardrails to a set of proposed calibration adjustments.
 *
 * This function takes the raw scores and proposed calibrated scores,
 * enforces all safety limits, and returns clamped scores along with
 * a detailed report of what was modified.
 *
 * @param rawScores - Original LLM scores
 * @param proposedCalibratedScores - Scores after scoring science pipeline
 * @param level - Current calibration level
 * @param workshopType - Type of workshop being scored
 * @param weights - Dimension weights for QI calculation
 * @param workshopLimits - Optional override for workshop safety limits
 * @returns Clamped scores and safety check report
 */
export function applySafetyGuardrails(
  rawScores: Record<string, number>,
  proposedCalibratedScores: Record<string, number>,
  level: CalibrationLevel,
  workshopType: WorkshopType,
  weights: Record<string, number>,
  workshopLimits?: WorkshopSafetyLimits
): {
  clampedScores: Record<string, number>;
  safetyCheck: SafetyCheckResult;
} {
  const limits = workshopLimits ?? WORKSHOP_SAFETY_LIMITS[workshopType];
  const levelCap = LEVEL_ADJUSTMENT_CAPS[level];
  const levelQICap = LEVEL_QI_CAPS[level];

  // If shadow mode, return raw scores immediately
  if (level === CalibrationLevel.SHADOW) {
    return {
      clampedScores: { ...rawScores },
      safetyCheck: {
        passed: true,
        blocked: false,
        dimensionClamping: [],
        qiClamped: false,
        totalAdjustmentClamped: false,
      },
    };
  }

  // Effective per-dimension cap: min of level cap and workshop cap
  const effectiveDimensionCap = Math.min(levelCap, limits.maxPerDimensionAdjustment);
  const effectiveQICap = Math.min(levelQICap, limits.maxQIChange);

  const clampedScores: Record<string, number> = {};
  const dimensionClamping: SafetyCheckResult['dimensionClamping'] = [];
  let totalAdjustmentMagnitude = 0;
  let adjustmentsClamped = false;

  // Step 1: Clamp per-dimension adjustments
  for (const [dim, rawScore] of Object.entries(rawScores)) {
    const proposed = proposedCalibratedScores[dim];
    if (proposed === undefined) {
      clampedScores[dim] = rawScore;
      continue;
    }

    const adjustment = proposed - rawScore;
    const absAdjustment = Math.abs(adjustment);

    if (absAdjustment > effectiveDimensionCap) {
      // Clamp the adjustment
      const clampedAdjustment = Math.sign(adjustment) * effectiveDimensionCap;
      clampedScores[dim] = Math.max(0, Math.min(10, rawScore + clampedAdjustment));
      adjustmentsClamped = true;

      dimensionClamping.push({
        dimension: dim,
        originalAdjustment: Math.round(adjustment * 100) / 100,
        clampedAdjustment: Math.round(clampedAdjustment * 100) / 100,
        reason: `Exceeded ${workshopType} cap (±${effectiveDimensionCap}) at level ${CalibrationLevel[level]}`,
      });
    } else {
      clampedScores[dim] = Math.max(0, Math.min(10, proposed));
    }

    totalAdjustmentMagnitude += Math.abs(clampedScores[dim] - rawScore);
  }

  // Step 2: Check total adjustment magnitude
  let totalAdjustmentClamped = false;
  if (totalAdjustmentMagnitude > limits.maxTotalAdjustment) {
    // Scale down all adjustments proportionally
    const scaleFactor = limits.maxTotalAdjustment / totalAdjustmentMagnitude;

    for (const [dim, rawScore] of Object.entries(rawScores)) {
      const currentAdjustment = clampedScores[dim] - rawScore;
      const scaledAdjustment = currentAdjustment * scaleFactor;
      clampedScores[dim] = Math.max(0, Math.min(10,
        Math.round((rawScore + scaledAdjustment) * 100) / 100
      ));
    }

    totalAdjustmentClamped = true;
    adjustmentsClamped = true;
  }

  // Step 3: Check QI change
  const rawQI = computeWeightedQI(rawScores, weights);
  const clampedQI = computeWeightedQI(clampedScores, weights);
  const qiChange = clampedQI - rawQI;
  let qiClamped = false;
  let originalQIChange: number | undefined;
  let clampedQIChange: number | undefined;

  if (Math.abs(qiChange) > effectiveQICap) {
    // Scale all adjustments down to respect QI cap
    originalQIChange = qiChange;
    const qiScaleFactor = effectiveQICap / Math.abs(qiChange);

    for (const [dim, rawScore] of Object.entries(rawScores)) {
      const currentAdjustment = clampedScores[dim] - rawScore;
      const scaledAdjustment = currentAdjustment * qiScaleFactor;
      clampedScores[dim] = Math.max(0, Math.min(10,
        Math.round((rawScore + scaledAdjustment) * 100) / 100
      ));
    }

    clampedQIChange = computeWeightedQI(clampedScores, weights) - rawQI;
    qiClamped = true;
    adjustmentsClamped = true;
  }

  // Step 4: Divergence check — if calibration diverges too much, block entirely
  const divergenceThreshold = effectiveDimensionCap * 3; // 3x the per-dimension cap
  let blocked = false;
  let blockReason: string | undefined;

  const maxProposedDivergence = Math.max(
    ...Object.entries(rawScores).map(([dim, raw]) => {
      const proposed = proposedCalibratedScores[dim] ?? raw;
      return Math.abs(proposed - raw);
    })
  );

  if (maxProposedDivergence > divergenceThreshold) {
    blocked = true;
    blockReason = `Calibration divergence too high (${maxProposedDivergence.toFixed(1)} > ${divergenceThreshold.toFixed(1)}). ` +
      `Falling back to raw scores for safety.`;

    // Revert to raw
    for (const [dim, rawScore] of Object.entries(rawScores)) {
      clampedScores[dim] = rawScore;
    }
  }

  return {
    clampedScores,
    safetyCheck: {
      passed: !blocked && dimensionClamping.length === 0 && !qiClamped && !totalAdjustmentClamped,
      blocked,
      blockReason,
      dimensionClamping,
      qiClamped,
      originalQIChange,
      clampedQIChange,
      totalAdjustmentClamped,
    },
  };
}

/**
 * Check if calibration should be disabled based on environment and feature flags.
 *
 * Order of precedence (highest to lowest):
 * 1. DISABLE_SCORE_CALIBRATION env var (emergency kill switch)
 * 2. Global feature flag
 * 3. Per-workshop feature flag
 * 4. Per-user disable list
 */
export function isCalibrationEnabled(
  featureFlags: {
    globalEnabled: boolean;
    workshopEnabled: Record<WorkshopType, boolean>;
    disabledUsers: Set<string>;
  },
  workshopType: WorkshopType,
  userId?: string
): boolean {
  // Emergency kill switch (highest precedence)
  if (process.env.DISABLE_SCORE_CALIBRATION === 'true') {
    return false;
  }

  // Global flag
  if (!featureFlags.globalEnabled) {
    return false;
  }

  // Per-workshop flag
  if (!featureFlags.workshopEnabled[workshopType]) {
    return false;
  }

  // Per-user disable
  if (userId && featureFlags.disabledUsers.has(userId)) {
    return false;
  }

  return true;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Compute weighted quality index from dimension scores.
 */
function computeWeightedQI(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [dim, score] of Object.entries(scores)) {
    const w = weights[dim] ?? 0;
    weightedSum += score * w;
    totalWeight += w;
  }

  return totalWeight > 0
    ? Math.round(weightedSum / totalWeight * 10 * 10) / 10
    : 0;
}
