/**
 * Sentence effectiveness → 6-tier visual band mapping.
 *
 * Single source of truth for the AnnotationV2 6-tier inline visual system
 * (UX contract §4.3 + §8 Q1). Backend owns the thresholds; the frontend
 * consumes the resulting `tier` label as-is and never re-implements these
 * bands. A threshold change is therefore a one-PR backend update.
 *
 * Consumers: L5 `deepAnnotationService` (`sentenceEffectiveness` grid +
 * `anchorEffectiveness`), and any future L4/L6 consumer that needs the
 * same banding.
 */

export type SentenceEffectivenessTier =
  | 'critical'
  | 'needs_work'
  | 'functional'
  | 'strong'
  | 'exceptional'
  | 'masterful';

/**
 * Map a 0-100 effectiveness score to its 6-tier visual band.
 *
 * Bands (UX contract §4 line 192):
 *   <40    critical    — wavy red underline
 *   40-54  needs_work  — solid amber underline
 *   55-75  functional  — no underline (visual silence)
 *   76-85  strong      — solid green underline
 *   86-95  exceptional — solid teal underline
 *   96-100 masterful   — shimmer purple underline
 *
 * Scores are assumed already clamped to 0-100 by L3.5 (`clampScore`).
 */
export function effectivenessToTier(score: number): SentenceEffectivenessTier {
  if (score < 40) return 'critical';
  if (score < 55) return 'needs_work';
  if (score < 76) return 'functional';
  if (score < 86) return 'strong';
  if (score < 96) return 'exceptional';
  return 'masterful';
}
