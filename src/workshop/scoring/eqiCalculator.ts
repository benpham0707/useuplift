/**
 * EQI Calculator — Pure Weighted Sum with Weight Validation
 *
 * Authoritative Essay Quality Index calculator.
 * NO hidden bumps, NO curve adjustments.
 * EQI = Σ(score × weight) / 10, scaled to 0-100.
 *
 * Supports essay-type weight overrides from EssayProfileManifest.
 */

import type { EQIInput, EQIResult, ImpressionLabel, WorkshopEssayType } from '../shared/types';
import { essayProfileRegistry } from '../registry/essayProfileRegistry';

// ============================================================================
// IMPRESSION LABEL BANDS
// ============================================================================

const IMPRESSION_BANDS: Array<{ min: number; max: number; label: ImpressionLabel }> = [
  { min: 90, max: 100, label: 'arresting_deeply_human' },
  { min: 80, max: 89.99, label: 'compelling_clear_voice' },
  { min: 70, max: 79.99, label: 'competent_needs_texture' },
  { min: 60, max: 69.99, label: 'readable_but_generic' },
  { min: 0, max: 59.99, label: 'template_like_rebuild' },
];

// ============================================================================
// EQI CALCULATOR
// ============================================================================

class EQICalculator {
  /**
   * Calculate EQI from dimension scores.
   *
   * @param inputs - Array of { dimensionId, score (0-100), weight (0-1) }
   * @param essayType - Optional essay type for profile-based weight overrides
   * @returns EQI result with score, weighted breakdown, and impression label
   * @throws Error if weights don't sum to 1.00 ± 0.001
   */
  calculate(inputs: EQIInput[], essayType?: WorkshopEssayType): EQIResult {
    let effectiveInputs = inputs;
    let overridesApplied = false;

    // Apply essay-type weight overrides if available
    if (essayType) {
      const profile = essayProfileRegistry.getProfile(essayType);
      if (profile && Object.keys(profile.dimensionWeightOverrides).length > 0) {
        effectiveInputs = this.applyWeightOverrides(inputs, profile.dimensionWeightOverrides);
        overridesApplied = true;
      }
    }

    // Validate weights sum to 1.00
    this.assertWeightSum(effectiveInputs);

    // Calculate weighted scores
    const weightedScores: Record<string, number> = {};
    let weightedSum = 0;

    for (const input of effectiveInputs) {
      const weighted = input.score * input.weight;
      weightedScores[input.dimensionId] = weighted;
      weightedSum += weighted;
    }

    // EQI = weighted sum (scores are 0-100, weights sum to 1.0, so result is 0-100)
    // Note: If dimension scores are 0-10, caller must scale them to 0-100 first
    const eqi = Math.min(100, Math.round(weightedSum * 10) / 10);

    // Map to impression label
    const impressionLabel = this.getImpressionLabel(eqi);

    return {
      eqi,
      weightedScores,
      impressionLabel,
      overridesApplied,
    };
  }

  /**
   * Calculate EQI from 0-10 scale dimension scores.
   * Convenience method that handles the 0-10 → 0-100 scaling.
   */
  calculateFrom10Scale(
    inputs: Array<{ dimensionId: string; score: number; weight: number }>,
    essayType?: WorkshopEssayType
  ): EQIResult {
    const scaledInputs = inputs.map(input => ({
      ...input,
      score: input.score * 10, // Scale 0-10 → 0-100
    }));
    return this.calculate(scaledInputs, essayType);
  }

  /**
   * Get impression label for a given EQI score.
   */
  getImpressionLabel(eqi: number): ImpressionLabel {
    for (const band of IMPRESSION_BANDS) {
      if (eqi >= band.min && eqi <= band.max) {
        return band.label;
      }
    }
    return 'template_like_rebuild';
  }

  /**
   * Apply weight overrides from an essay profile.
   * Overrides specific dimension weights, then renormalizes so all weights sum to 1.00.
   */
  private applyWeightOverrides(
    inputs: EQIInput[],
    overrides: Partial<Record<string, number>>
  ): EQIInput[] {
    // Apply overrides to matching dimensions
    const adjusted = inputs.map(input => ({
      ...input,
      weight: overrides[input.dimensionId] ?? input.weight,
    }));

    // Renormalize weights to sum to 1.00
    const rawSum = adjusted.reduce((sum, i) => sum + i.weight, 0);
    if (rawSum === 0) {
      throw new Error('[EQICalculator] All weights are zero after applying overrides');
    }

    return adjusted.map(input => ({
      ...input,
      weight: input.weight / rawSum,
    }));
  }

  /**
   * Assert that weights sum to 1.00 ± 0.001.
   * @throws Error if validation fails
   */
  private assertWeightSum(inputs: EQIInput[]): void {
    const totalWeight = inputs.reduce((sum, i) => sum + i.weight, 0);

    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error(
        `[EQICalculator] Weight validation failed: weights sum to ${totalWeight.toFixed(4)}, ` +
        `expected 1.0000 ± 0.001. Inputs: ${JSON.stringify(inputs.map(i => ({ id: i.dimensionId, w: i.weight })))}`
      );
    }
  }
}

/** Singleton EQI calculator */
export const eqiCalculator = new EQICalculator();
export { EQICalculator };
