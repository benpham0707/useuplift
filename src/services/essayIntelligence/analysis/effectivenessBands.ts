/**
 * Effectiveness Bands — Maps 0-100 sentence/paragraph scores to named
 * quality tiers for user-facing display.
 *
 * Internal scoring remains 0-100 for calibration, distribution diagnostics,
 * and anchor comparisons. The bands prevent false precision: a score of 71
 * vs 73 carries zero signal given LLM variance of 8-15 points, but
 * "Functional" vs "Functional" is honest.
 *
 * Band boundaries match the calibration table in analysisPass.ts (lines 315-322).
 */

export type EffectivenessBand =
  | 'masterful'     // 96-100 — 0-1 per essay
  | 'exceptional'   // 86-95  — 1-2 per essay
  | 'strong'        // 76-85  — several per strong essay
  | 'functional'    // 55-75  — most sentences in decent essays
  | 'developing'    // 40-54  — several in developing essays
  | 'problematic';  // 0-39   — rare in submitted work

export interface EffectivenessBandResult {
  /** The band classification */
  band: EffectivenessBand;
  /** Title-case label for display */
  label: string;
  /** One-line description of what this band means for the student */
  description: string;
  /** Score range this band covers [min, max] */
  range: [number, number];
}

const BAND_DEFINITIONS: readonly EffectivenessBandResult[] = [
  { band: 'masterful', label: 'Masterful', description: 'Would make an AO pause and re-read', range: [96, 100] },
  { band: 'exceptional', label: 'Exceptional', description: 'Memorable after reading 50 essays', range: [86, 95] },
  { band: 'strong', label: 'Strong', description: 'Does its job with distinction', range: [76, 85] },
  { band: 'functional', label: 'Functional', description: 'Competent but not memorable', range: [55, 75] },
  { band: 'developing', label: 'Developing', description: 'Gets the point across with issues', range: [40, 54] },
  { band: 'problematic', label: 'Problematic', description: 'Actively harms the essay', range: [0, 39] },
] as const;

/**
 * Convert a 0-100 effectiveness score to a named band for user-facing display.
 *
 * Edge cases:
 * - NaN, negative, undefined → problematic (safest default)
 * - > 100 → masterful
 */
export function toEffectivenessBand(score: number): EffectivenessBandResult {
  // Guard against invalid inputs
  if (typeof score !== 'number' || isNaN(score) || score < 0) {
    return BAND_DEFINITIONS[5]; // problematic
  }
  if (score > 100) {
    return BAND_DEFINITIONS[0]; // masterful
  }

  if (score >= 96) return BAND_DEFINITIONS[0];
  if (score >= 86) return BAND_DEFINITIONS[1];
  if (score >= 76) return BAND_DEFINITIONS[2];
  if (score >= 55) return BAND_DEFINITIONS[3];
  if (score >= 40) return BAND_DEFINITIONS[4];
  return BAND_DEFINITIONS[5];
}

/**
 * Format a score as a band label for coaching prompts.
 * Returns "STRONG" instead of "72" — honest about precision limits.
 */
export function formatScoreAsBand(score: number): string {
  const { label } = toEffectivenessBand(score);
  return label.toUpperCase();
}

/**
 * Format a score with band context for coaching prompts.
 * Returns "STRONG (76-85 band)" — gives the LLM useful context without false precision.
 */
export function formatScoreWithBandContext(score: number): string {
  const { label, range } = toEffectivenessBand(score);
  return `${label.toUpperCase()} (${range[0]}-${range[1]} band)`;
}
