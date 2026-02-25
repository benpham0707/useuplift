/**
 * Post-LLM Calibrator
 *
 * Wraps existing proven modules for post-LLM score calibration:
 * - Constraint Satisfaction: catches logically impossible score combinations
 * - Diminishing Returns: generates revision priority rankings
 *
 * Only runs when scoring is present (skipped for pure teaching stages).
 * Performance: <1ms, pure computation.
 */

import { checkConstraints } from '../../core/analysis/scoring/scoringScience/constraintSatisfaction';
import { generateRevisionPriorities } from '../../core/analysis/scoring/scoringScience/diminishingReturns';
import type { CalibrationResult } from './types';

// ============================================================================
// MAIN CALIBRATOR
// ============================================================================

export class PostLLMCalibrator {
  /**
   * Calibrate LLM-produced scores using constraint satisfaction and
   * diminishing returns analysis.
   *
   * @param scores - Dimension scores from LLM (dimension name → score 0-10)
   * @param weights - Dimension weights (dimension name → weight 0-1)
   * @param rubricType - Which constraint set to apply
   * @param wordCount - Essay word count (for practical ceiling estimation)
   * @param activityCategory - Optional activity category for experience rubric ceilings
   * @returns CalibrationResult with adjusted scores and revision priorities
   */
  calibrate(
    scores: Record<string, number>,
    weights: Record<string, number>,
    rubricType: 'experience' | 'essay' = 'experience',
    wordCount: number = 300,
    activityCategory?: string,
  ): CalibrationResult {
    // Run constraint satisfaction with auto-fix enabled
    const constraintCheck = checkConstraints(scores, rubricType, true);

    // Use adjusted scores (if constraints were violated) or original scores
    const effectiveScores = constraintCheck.adjusted_scores ?? scores;

    // Generate revision priorities from effective scores
    const revisionPriorities = generateRevisionPriorities(
      effectiveScores,
      weights,
      wordCount,
      activityCategory,
    );

    return {
      constraintCheck,
      revisionPriorities,
      hasAdjustments: constraintCheck.violations_found > 0,
      adjustedScores: constraintCheck.adjusted_scores,
    };
  }

  /**
   * Quick check: are there any constraint violations without fixing them?
   * Useful for diagnostics/logging.
   */
  checkOnly(
    scores: Record<string, number>,
    rubricType: 'experience' | 'essay' = 'experience',
  ): { violationCount: number; hasHardViolations: boolean } {
    const result = checkConstraints(scores, rubricType, false);
    return {
      violationCount: result.violations_found,
      hasHardViolations: result.has_hard_violations,
    };
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const postLLMCalibrator = new PostLLMCalibrator();
