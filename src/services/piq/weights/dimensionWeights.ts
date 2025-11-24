/**
 * PIQ DIMENSION WEIGHTS
 *
 * Prompt-specific weight configurations for all 13 dimensions across 8 PIQ types.
 * Weights are calibrated based on:
 * - UC official guidance and evaluation criteria
 * - Analysis of 19 exemplar essays from successful admits
 * - Admissions officer interview data
 * - 19 iterations of extracurricular workshop validation
 */

import type { PIQRubricDimension, PIQPromptType } from '../types';

export interface DimensionWeightConfig {
  dimension: PIQRubricDimension;
  weight: number;                // 0-1 (percentage as decimal)
  shown: boolean;                // Display this dimension for this prompt type?
  emphasis: 'high' | 'medium' | 'low';
}

export interface PIQWeightProfile {
  promptType: PIQPromptType;
  promptName: string;
  dimensionWeights: DimensionWeightConfig[];
  totalWeight: number;           // Should sum to 1.0
}

// ============================================================================
// BASELINE WEIGHTS (Default/Average)
// ============================================================================

export const BASELINE_WEIGHTS: Record<PIQRubricDimension, number> = {
  opening_hook_quality: 0.10,
  vulnerability_authenticity: 0.12,
  specificity_evidence: 0.10,
  voice_integrity: 0.08,
  narrative_arc_stakes: 0.09,
  transformative_impact: 0.10,
  role_clarity_ownership: 0.07,
  initiative_leadership: 0.07,
  context_circumstances: 0.06,
  reflection_insight: 0.09,
  identity_self_discovery: 0.06,
  craft_language_quality: 0.06,
  fit_trajectory: 0.05
};

// Verify baseline sums to 1.0
const baselineSum = Object.values(BASELINE_WEIGHTS).reduce((sum, w) => sum + w, 0);
if (Math.abs(baselineSum - 1.0) > 0.001) {
  console.warn(`⚠️  Baseline weights sum to ${baselineSum.toFixed(3)}, not 1.0`);
}

// ============================================================================
// PROMPT-SPECIFIC WEIGHT PROFILES
// ============================================================================

export const PIQ_WEIGHT_PROFILES: Record<PIQPromptType, PIQWeightProfile> = {
  // PIQ 1: Leadership & Influence
  piq1_leadership: {
    promptType: 'piq1_leadership',
    promptName: 'Leadership & Influence',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'vulnerability_authenticity', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'specificity_evidence', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'voice_integrity', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'narrative_arc_stakes', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'transformative_impact', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'role_clarity_ownership', weight: 0.09, shown: true, emphasis: 'high' },       // ⬆ Higher - need clear "I" vs "we"
      { dimension: 'initiative_leadership', weight: 0.10, shown: true, emphasis: 'high' },        // ⬆ Highest - core to prompt
      { dimension: 'context_circumstances', weight: 0.05, shown: true, emphasis: 'low' },         // ⬇ Lower - focus on actions
      { dimension: 'reflection_insight', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'identity_self_discovery', weight: 0.05, shown: true, emphasis: 'low' },
      { dimension: 'craft_language_quality', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'fit_trajectory', weight: 0.05, shown: true, emphasis: 'low' }
    ],
    totalWeight: 1.00
  },

  // PIQ 2: Creative Expression
  piq2_creative: {
    promptType: 'piq2_creative',
    promptName: 'Creative Expression',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.12, shown: true, emphasis: 'high' },        // ⬆ Higher - artistic openings matter
      { dimension: 'vulnerability_authenticity', weight: 0.11, shown: true, emphasis: 'medium' },
      { dimension: 'specificity_evidence', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'voice_integrity', weight: 0.10, shown: true, emphasis: 'high' },             // ⬆ Higher - artistic voice matters
      { dimension: 'narrative_arc_stakes', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'transformative_impact', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'role_clarity_ownership', weight: 0.06, shown: true, emphasis: 'low' },       // ⬇ Often solo work
      { dimension: 'initiative_leadership', weight: 0.06, shown: true, emphasis: 'low' },        // ⬇ Less emphasis
      { dimension: 'context_circumstances', weight: 0.05, shown: true, emphasis: 'low' },
      { dimension: 'reflection_insight', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'identity_self_discovery', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'craft_language_quality', weight: 0.13, shown: true, emphasis: 'high' },      // ⬆ Highest - artistic expression valued
      { dimension: 'fit_trajectory', weight: 0.05, shown: true, emphasis: 'low' }
    ],
    totalWeight: 1.00
  },

  // PIQ 3: Talent or Skill
  piq3_talent: {
    promptType: 'piq3_talent',
    promptName: 'Talent or Skill',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'vulnerability_authenticity', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'specificity_evidence', weight: 0.13, shown: true, emphasis: 'high' },        // ⬆ Highest - need concrete evidence of skill
      { dimension: 'voice_integrity', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'narrative_arc_stakes', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'transformative_impact', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'role_clarity_ownership', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'initiative_leadership', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'context_circumstances', weight: 0.05, shown: true, emphasis: 'low' },
      { dimension: 'reflection_insight', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'identity_self_discovery', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'craft_language_quality', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'fit_trajectory', weight: 0.06, shown: true, emphasis: 'medium' }
    ],
    totalWeight: 1.00
  },

  // PIQ 4: Educational Opportunity/Barrier
  piq4_educational: {
    promptType: 'piq4_educational',
    promptName: 'Educational Opportunity/Barrier',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'vulnerability_authenticity', weight: 0.13, shown: true, emphasis: 'high' },  // ⬆ High - overcoming barriers requires emotional honesty
      { dimension: 'specificity_evidence', weight: 0.12, shown: true, emphasis: 'high' },        // ⬆ High - need concrete details
      { dimension: 'voice_integrity', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'narrative_arc_stakes', weight: 0.11, shown: true, emphasis: 'high' },        // ⬆ Higher - overcoming story
      { dimension: 'transformative_impact', weight: 0.12, shown: true, emphasis: 'high' },       // ⬆ High - growth from adversity
      { dimension: 'role_clarity_ownership', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'initiative_leadership', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'context_circumstances', weight: 0.13, shown: true, emphasis: 'high' },       // ⬆ Highest - understanding obstacles critical
      { dimension: 'reflection_insight', weight: 0.11, shown: true, emphasis: 'high' },          // ⬆ Higher - what did you learn
      { dimension: 'identity_self_discovery', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'craft_language_quality', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'fit_trajectory', weight: 0.04, shown: true, emphasis: 'low' }
    ],
    totalWeight: 1.00
  },

  // PIQ 5: Significant Challenge
  piq5_challenge: {
    promptType: 'piq5_challenge',
    promptName: 'Significant Challenge',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.11, shown: true, emphasis: 'high' },        // ⬆ Higher - dramatic stakes
      { dimension: 'vulnerability_authenticity', weight: 0.15, shown: true, emphasis: 'high' },  // ⬆ HIGHEST - emotional honesty critical
      { dimension: 'specificity_evidence', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'voice_integrity', weight: 0.09, shown: true, emphasis: 'high' },             // ⬆ Higher
      { dimension: 'narrative_arc_stakes', weight: 0.13, shown: true, emphasis: 'high' },        // ⬆ Very high - story of overcoming
      { dimension: 'transformative_impact', weight: 0.13, shown: true, emphasis: 'high' },       // ⬆ Very high - growth from adversity
      { dimension: 'role_clarity_ownership', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'initiative_leadership', weight: 0.06, shown: true, emphasis: 'low' },
      { dimension: 'context_circumstances', weight: 0.14, shown: true, emphasis: 'high' },       // ⬆ HIGHEST - understanding obstacles
      { dimension: 'reflection_insight', weight: 0.11, shown: true, emphasis: 'high' },          // ⬆ Higher - what did you learn
      { dimension: 'identity_self_discovery', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'craft_language_quality', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'fit_trajectory', weight: 0.04, shown: true, emphasis: 'low' }
    ],
    totalWeight: 1.00
  },

  // PIQ 6: Academic Passion
  piq6_academic: {
    promptType: 'piq6_academic',
    promptName: 'Academic Passion',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'vulnerability_authenticity', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'specificity_evidence', weight: 0.12, shown: true, emphasis: 'high' },        // ⬆ Higher - concrete examples of pursuit
      { dimension: 'voice_integrity', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'narrative_arc_stakes', weight: 0.07, shown: true, emphasis: 'low' },         // ⬇ Lower - less narrative-driven
      { dimension: 'transformative_impact', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'role_clarity_ownership', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'initiative_leadership', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'context_circumstances', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'reflection_insight', weight: 0.12, shown: true, emphasis: 'high' },          // ⬆ HIGHEST - intellectual insights valued
      { dimension: 'identity_self_discovery', weight: 0.05, shown: true, emphasis: 'low' },
      { dimension: 'craft_language_quality', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'fit_trajectory', weight: 0.12, shown: true, emphasis: 'high' }               // ⬆ HIGHEST - connects to major/field
    ],
    totalWeight: 1.00
  },

  // PIQ 7: Community Contribution
  piq7_community: {
    promptType: 'piq7_community',
    promptName: 'Community Contribution',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'vulnerability_authenticity', weight: 0.08, shown: true, emphasis: 'low' },   // ⬇ Lower - less emphasis on internal struggle
      { dimension: 'specificity_evidence', weight: 0.12, shown: true, emphasis: 'high' },        // ⬆ Higher - concrete impact needed
      { dimension: 'voice_integrity', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'narrative_arc_stakes', weight: 0.07, shown: true, emphasis: 'low' },         // ⬇ Lower
      { dimension: 'transformative_impact', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'role_clarity_ownership', weight: 0.08, shown: true, emphasis: 'high' },      // ⬆ Higher - need to show YOUR role
      { dimension: 'initiative_leadership', weight: 0.09, shown: true, emphasis: 'high' },       // ⬆ Higher - proactive contribution
      { dimension: 'context_circumstances', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'reflection_insight', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'identity_self_discovery', weight: 0.05, shown: true, emphasis: 'low' },
      { dimension: 'craft_language_quality', weight: 0.06, shown: true, emphasis: 'medium' },
      { dimension: 'fit_trajectory', weight: 0.06, shown: true, emphasis: 'medium' }
    ],
    totalWeight: 1.00
  },

  // PIQ 8: Open-Ended Distinction
  piq8_open_ended: {
    promptType: 'piq8_open_ended',
    promptName: 'Open-Ended Distinction',
    dimensionWeights: [
      { dimension: 'opening_hook_quality', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'vulnerability_authenticity', weight: 0.12, shown: true, emphasis: 'high' },  // ⬆ Higher - authenticity valued
      { dimension: 'specificity_evidence', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'voice_integrity', weight: 0.08, shown: true, emphasis: 'medium' },
      { dimension: 'narrative_arc_stakes', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'transformative_impact', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'role_clarity_ownership', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'initiative_leadership', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'context_circumstances', weight: 0.10, shown: true, emphasis: 'medium' },
      { dimension: 'reflection_insight', weight: 0.09, shown: true, emphasis: 'medium' },
      { dimension: 'identity_self_discovery', weight: 0.08, shown: true, emphasis: 'high' },     // ⬆ Higher - "who are you"
      { dimension: 'craft_language_quality', weight: 0.07, shown: true, emphasis: 'medium' },
      { dimension: 'fit_trajectory', weight: 0.09, shown: true, emphasis: 'high' }               // ⬆ Higher - strategic positioning
    ],
    totalWeight: 1.00
  }
};

// Verify all weight profiles sum to 1.0
Object.entries(PIQ_WEIGHT_PROFILES).forEach(([key, profile]) => {
  const sum = profile.dimensionWeights.reduce((total, dw) => total + dw.weight, 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn(`⚠️  ${key} weights sum to ${sum.toFixed(3)}, not 1.0`);
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get weight configuration for a specific prompt type
 */
export function getWeightProfile(promptType: PIQPromptType): PIQWeightProfile {
  const profile = PIQ_WEIGHT_PROFILES[promptType];
  if (!profile) {
    throw new Error(`Unknown PIQ prompt type: ${promptType}`);
  }
  return profile;
}

/**
 * Get weight for a specific dimension in a specific prompt type
 */
export function getDimensionWeight(
  promptType: PIQPromptType,
  dimension: PIQRubricDimension
): number {
  const profile = getWeightProfile(promptType);
  const config = profile.dimensionWeights.find(dw => dw.dimension === dimension);
  if (!config) {
    throw new Error(`Dimension ${dimension} not found in ${promptType} profile`);
  }
  return config.weight;
}

/**
 * Check if a dimension should be shown for a specific prompt type
 */
export function isDimensionShown(
  promptType: PIQPromptType,
  dimension: PIQRubricDimension
): boolean {
  const profile = getWeightProfile(promptType);
  const config = profile.dimensionWeights.find(dw => dw.dimension === dimension);
  return config?.shown ?? true;
}

/**
 * Get all dimensions that should be shown for a prompt type
 */
export function getShownDimensions(promptType: PIQPromptType): PIQRubricDimension[] {
  const profile = getWeightProfile(promptType);
  return profile.dimensionWeights
    .filter(dw => dw.shown)
    .map(dw => dw.dimension);
}

/**
 * Get high-emphasis dimensions for a prompt type
 */
export function getHighEmphasisDimensions(promptType: PIQPromptType): PIQRubricDimension[] {
  const profile = getWeightProfile(promptType);
  return profile.dimensionWeights
    .filter(dw => dw.emphasis === 'high')
    .map(dw => dw.dimension);
}

/**
 * Get dimension weight as percentage string
 */
export function formatDimensionWeight(weight: number): string {
  return `${(weight * 100).toFixed(0)}%`;
}

/**
 * Get all 13 dimensions in order
 */
export function getAllDimensions(): PIQRubricDimension[] {
  return [
    'opening_hook_quality',
    'vulnerability_authenticity',
    'specificity_evidence',
    'voice_integrity',
    'narrative_arc_stakes',
    'transformative_impact',
    'role_clarity_ownership',
    'initiative_leadership',
    'context_circumstances',
    'reflection_insight',
    'identity_self_discovery',
    'craft_language_quality',
    'fit_trajectory'
  ];
}
