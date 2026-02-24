/**
 * Version Comparison Service
 *
 * Compares two versions of an essay using cached analysis scores.
 * NO LLM cost — purely database + computation.
 *
 * Shows per-dimension score deltas, improvements, regressions,
 * and identifies the most impactful edit.
 */

import type { VersionComparison } from './types';

// ============================================================================
// TYPES
// ============================================================================

/** Cached analysis scores for a single version */
export interface VersionScores {
  /** Content hash (SHA-256 or similar) identifying this version */
  textHash: string;
  /** Per-dimension scores (dimension name → score 0-10) */
  dimensionScores: Record<string, number>;
  /** Overall score (e.g., narrative quality index) */
  overallScore: number;
  /** When this version was analyzed */
  analyzedAt: string;
}

/** Edit that occurred between two versions */
export interface VersionEdit {
  /** Which editing command was used */
  command: string;
  /** The original text that was replaced */
  originalText: string;
  /** The replacement text */
  replacementText: string;
  /** When the edit was made */
  timestamp: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export class VersionComparisonService {

  /**
   * Compare two scored versions of an essay.
   * Returns per-dimension deltas, improvements, regressions, and identifies
   * the most impactful edit if edit history is provided.
   *
   * NO LLM cost — purely computational.
   */
  compareVersions(
    oldVersion: VersionScores,
    newVersion: VersionScores,
    edits?: VersionEdit[]
  ): VersionComparison {
    const scoreDelta: Record<string, number> = {};
    const improvements: string[] = [];
    const regressions: string[] = [];
    const unchanged: string[] = [];

    // Compute per-dimension deltas
    const allDimensions = new Set([
      ...Object.keys(oldVersion.dimensionScores),
      ...Object.keys(newVersion.dimensionScores),
    ]);

    for (const dimension of allDimensions) {
      const oldScore = oldVersion.dimensionScores[dimension] ?? 0;
      const newScore = newVersion.dimensionScores[dimension] ?? 0;
      const delta = newScore - oldScore;

      scoreDelta[dimension] = Math.round(delta * 100) / 100;

      if (delta >= 0.5) {
        improvements.push(`${dimension}: ${oldScore.toFixed(1)} → ${newScore.toFixed(1)} (+${delta.toFixed(1)})`);
      } else if (delta <= -0.5) {
        regressions.push(`${dimension}: ${oldScore.toFixed(1)} → ${newScore.toFixed(1)} (${delta.toFixed(1)})`);
      } else {
        unchanged.push(dimension);
      }
    }

    // Overall delta
    const overallDelta = Math.round((newVersion.overallScore - oldVersion.overallScore) * 100) / 100;

    // Identify most impactful edit
    let mostImpactfulEdit = '';
    if (edits && edits.length > 0) {
      // Heuristic: the edit that changed the most text is likely most impactful
      // A more sophisticated approach would track per-edit score deltas
      const sorted = [...edits].sort((a, b) => {
        const aDiff = Math.abs(a.replacementText.length - a.originalText.length);
        const bDiff = Math.abs(b.replacementText.length - b.originalText.length);
        return bDiff - aDiff;
      });
      mostImpactfulEdit = `${sorted[0].command}: "${sorted[0].originalText.slice(0, 50)}${sorted[0].originalText.length > 50 ? '...' : ''}"`;
    } else if (improvements.length > 0) {
      // Fallback: the dimension with biggest improvement
      const biggestImprovement = Object.entries(scoreDelta)
        .sort(([, a], [, b]) => b - a)[0];
      if (biggestImprovement) {
        mostImpactfulEdit = `Biggest improvement: ${biggestImprovement[0]} (+${biggestImprovement[1].toFixed(1)})`;
      }
    }

    return {
      scoreDelta,
      overallDelta,
      improvements,
      regressions,
      unchanged,
      editCount: edits?.length ?? 0,
      mostImpactfulEdit,
    };
  }

  /**
   * Quick summary of version comparison for display.
   */
  summarize(comparison: VersionComparison): string {
    const parts: string[] = [];

    if (comparison.overallDelta > 0) {
      parts.push(`Overall: +${comparison.overallDelta.toFixed(1)} improvement`);
    } else if (comparison.overallDelta < 0) {
      parts.push(`Overall: ${comparison.overallDelta.toFixed(1)} regression`);
    } else {
      parts.push('Overall: no change');
    }

    if (comparison.improvements.length > 0) {
      parts.push(`Improved: ${comparison.improvements.length} dimension(s)`);
    }
    if (comparison.regressions.length > 0) {
      parts.push(`Regressed: ${comparison.regressions.length} dimension(s)`);
    }
    if (comparison.editCount > 0) {
      parts.push(`Edits: ${comparison.editCount}`);
    }
    if (comparison.mostImpactfulEdit) {
      parts.push(`Key change: ${comparison.mostImpactfulEdit}`);
    }

    return parts.join(' | ');
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

export const versionComparisonService = new VersionComparisonService();
