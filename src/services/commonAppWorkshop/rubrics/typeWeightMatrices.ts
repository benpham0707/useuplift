/**
 * Type-Specific Weight Matrices
 *
 * Each of the 14 supplemental essay types has different priorities.
 * These matrices define how much each dimension matters for each type.
 *
 * Like PIQ's prompt-specific weights, these allow the universal dimensions
 * to be applied differently based on what the essay type demands.
 */

import type { SupplementalDimension } from './universalSupplementalRubric';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Weight matrix for a specific essay type
 * Weights should sum to 100
 */
export type DimensionWeightMatrix = Record<SupplementalDimension, number>;

/**
 * Complete weight configuration for an essay type
 */
export interface TypeWeightConfig {
  type: SupplementalType;
  name: string;
  word_range: { min: number; max: number };
  weights: DimensionWeightMatrix;
  critical_dimensions: SupplementalDimension[]; // Dimensions that MUST be strong
  not_applicable: SupplementalDimension[]; // Dimensions to deprioritize
  excellence_requirements: string[]; // What makes this type 85+
}

// ============================================================================
// WEIGHT MATRICES FOR ALL 14 TYPES
// ============================================================================

export const TYPE_WEIGHT_CONFIGS: Record<SupplementalType, TypeWeightConfig> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 1: WHY US (100-350 words)
  // ═══════════════════════════════════════════════════════════════════════════
  why_us: {
    type: 'why_us',
    name: 'Why Us Essay',
    word_range: { min: 100, max: 350 },
    weights: {
      specificity_evidence: 12,     // CRITICAL - names professors, courses
      authenticity_voice: 8,        // MEDIUM - natural but strategic
      personal_connection: 11,      // HIGH - why resources matter to THEM
      fit_demonstration: 14,        // CRITICAL - mutual value proposition
      narrative_clarity: 7,         // MEDIUM - clear but not story-driven
      growth_transformation: 4,     // LOWER - not about growth
      vulnerability_balance: 3,     // LOWER - less vulnerability expected
      reflection_insight: 5,        // LOWER - less about depth
      research_depth: 15,           // CRITICAL - separates great from good
      strategic_coherence: 6,       // MEDIUM - fits application
      prompt_responsiveness: 8,     // HIGH - must answer "why us"
      impact_memorability: 7        // MEDIUM - should be memorable
    },
    critical_dimensions: ['fit_demonstration', 'research_depth', 'specificity_evidence'],
    not_applicable: ['vulnerability_balance', 'growth_transformation'],
    excellence_requirements: [
      'Names 3-5 specific, unique resources other colleges don\'t have',
      'Each resource connected to personal goal or past experience',
      'Evidence of research beyond website (syllabi, professor research, student publications)',
      'Clear mutual value proposition (gives AND receives)',
      'Could NOT swap college name'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 2: WHY MAJOR (150-350 words)
  // ═══════════════════════════════════════════════════════════════════════════
  why_major: {
    type: 'why_major',
    name: 'Why This Major',
    word_range: { min: 150, max: 350 },
    weights: {
      specificity_evidence: 11,     // HIGH - field knowledge, concepts
      authenticity_voice: 9,        // MEDIUM-HIGH - genuine curiosity
      personal_connection: 10,      // HIGH - origin story of interest
      fit_demonstration: 10,        // HIGH - program fit
      narrative_clarity: 8,         // MEDIUM - intellectual journey
      growth_transformation: 5,     // MEDIUM - intellectual growth
      vulnerability_balance: 2,     // LOWER - less vulnerability expected
      reflection_insight: 14,       // CRITICAL - becomes "Intellectual Depth"
      research_depth: 12,           // HIGH - program-specific research
      strategic_coherence: 4,       // LOWER
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 9        // HIGH - unique intellectual angle
    },
    critical_dimensions: ['reflection_insight', 'research_depth', 'specificity_evidence'],
    not_applicable: ['vulnerability_balance'],
    excellence_requirements: [
      'Clear origin story (the spark moment)',
      'Shows progression of independent exploration',
      'Demonstrates field knowledge (specific concepts, questions, challenges)',
      'Connects to college\'s unique program strengths',
      'Intellectual curiosity dominates (not just career ambition)'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 3: COMMUNITY CONTRIBUTION (150-300 words)
  // ═══════════════════════════════════════════════════════════════════════════
  community: {
    type: 'community',
    name: 'Community Contribution',
    word_range: { min: 150, max: 300 },
    weights: {
      specificity_evidence: 11,     // HIGH - specific contributions
      authenticity_voice: 9,        // MEDIUM-HIGH - genuine intent
      personal_connection: 12,      // CRITICAL - past predicts future
      fit_demonstration: 13,        // CRITICAL - community fit
      narrative_clarity: 8,         // MEDIUM - clear plan
      growth_transformation: 5,     // LOWER
      vulnerability_balance: 5,     // LOWER
      reflection_insight: 6,        // MEDIUM - community awareness
      research_depth: 9,            // HIGH - community values research
      strategic_coherence: 8,       // HIGH - what you uniquely bring
      prompt_responsiveness: 7,     // MEDIUM
      impact_memorability: 7        // MEDIUM
    },
    critical_dimensions: ['fit_demonstration', 'personal_connection', 'specificity_evidence'],
    not_applicable: [],
    excellence_requirements: [
      'Names 2-3 specific past community contributions as evidence',
      'Shows deep understanding of THIS college\'s community values',
      'Names specific organizations/opportunities for involvement',
      'Clear "I will give" AND "I will participate" balance',
      'Past behavior clearly predicts future involvement'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 4: DIVERSITY/BACKGROUND (200-500 words)
  // ═══════════════════════════════════════════════════════════════════════════
  diversity: {
    type: 'diversity',
    name: 'Diversity Statement',
    word_range: { min: 200, max: 500 },
    weights: {
      specificity_evidence: 9,      // HIGH - specific experiences
      authenticity_voice: 11,       // CRITICAL - genuine voice essential
      personal_connection: 14,      // CRITICAL - background IS content
      fit_demonstration: 5,         // LOWER - less about college fit
      narrative_clarity: 9,         // MEDIUM-HIGH - clear story
      growth_transformation: 10,    // HIGH - growth through experience
      vulnerability_balance: 12,    // CRITICAL - honest without victimhood
      reflection_insight: 10,       // HIGH - self-awareness required
      research_depth: 2,            // N/A - not about research
      strategic_coherence: 6,       // MEDIUM - fits application
      prompt_responsiveness: 4,     // BASELINE
      impact_memorability: 8        // MEDIUM - unique perspective
    },
    critical_dimensions: ['personal_connection', 'vulnerability_balance', 'authenticity_voice'],
    not_applicable: ['research_depth'],
    excellence_requirements: [
      'Moves from identity → unique perspective → how enriches community',
      'Balances vulnerability with strength (not victim narrative)',
      'Shows growth and resilience through experience',
      'Self-awareness about how experience shapes worldview',
      'Not defensive or apologetic'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 5: INTELLECTUAL CURIOSITY (200-400 words)
  // ═══════════════════════════════════════════════════════════════════════════
  intellectual: {
    type: 'intellectual',
    name: 'Intellectual Curiosity',
    word_range: { min: 200, max: 400 },
    weights: {
      specificity_evidence: 12,     // HIGH - specific ideas/concepts
      authenticity_voice: 11,       // HIGH - genuine curiosity
      personal_connection: 10,      // HIGH - self-directed learning
      fit_demonstration: 7,         // MEDIUM - academic fit
      narrative_clarity: 9,         // MEDIUM - intellectual journey
      growth_transformation: 8,     // MEDIUM - intellectual growth
      vulnerability_balance: 4,     // LOWER
      reflection_insight: 14,       // CRITICAL - intellectual depth
      research_depth: 3,            // LOWER - self-directed exploration
      strategic_coherence: 6,       // MEDIUM
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 10       // HIGH - unique ideas stick
    },
    critical_dimensions: ['reflection_insight', 'specificity_evidence', 'authenticity_voice'],
    not_applicable: ['vulnerability_balance'],
    excellence_requirements: [
      'Shows self-directed learning beyond classroom',
      'Demonstrates deep engagement with ideas (not just consumption)',
      'Asks meaningful questions, shows evolution of thinking',
      'Connects ideas across disciplines',
      'Specific concepts/questions named, not generic "love of learning"'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 6: EXTRACURRICULAR/ACTIVITY (250-500 words)
  // ═══════════════════════════════════════════════════════════════════════════
  extracurricular: {
    type: 'extracurricular',
    name: 'Activity/Passion Essay',
    word_range: { min: 250, max: 500 },
    weights: {
      specificity_evidence: 11,     // HIGH - specific impact, numbers
      authenticity_voice: 11,       // HIGH - genuine passion
      personal_connection: 12,      // CRITICAL - why THIS activity
      fit_demonstration: 4,         // LOWER
      narrative_clarity: 10,        // HIGH - activity story arc
      growth_transformation: 10,    // HIGH - growth through activity
      vulnerability_balance: 7,     // MEDIUM - challenges faced
      reflection_insight: 10,       // HIGH - what activity reveals
      research_depth: 3,            // LOWER
      strategic_coherence: 7,       // MEDIUM - new dimension shown
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 9        // MEDIUM-HIGH - character revelation
    },
    critical_dimensions: ['personal_connection', 'specificity_evidence', 'authenticity_voice'],
    not_applicable: ['research_depth'],
    excellence_requirements: [
      'Goes deep into ONE activity (not surface-level many)',
      'Shows personal growth arc through the activity',
      'Demonstrates specific impact on others/community',
      'Reveals character, values, or identity',
      'Shows sustained commitment and evolution'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 7: CHALLENGE/ADVERSITY (250-650 words)
  // ═══════════════════════════════════════════════════════════════════════════
  challenge: {
    type: 'challenge',
    name: 'Challenge Essay',
    word_range: { min: 250, max: 650 },
    weights: {
      specificity_evidence: 9,      // HIGH - specific challenge/response
      authenticity_voice: 10,       // HIGH - genuine not performed
      personal_connection: 10,      // HIGH - personal challenge
      fit_demonstration: 2,         // N/A
      narrative_clarity: 12,        // CRITICAL - story arc essential
      growth_transformation: 14,    // CRITICAL - response > problem
      vulnerability_balance: 13,    // CRITICAL - honest about struggle
      reflection_insight: 11,       // HIGH - meaning extracted
      research_depth: 1,            // N/A
      strategic_coherence: 4,       // LOWER
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 8        // MEDIUM - memorable resilience
    },
    critical_dimensions: ['growth_transformation', 'vulnerability_balance', 'narrative_clarity'],
    not_applicable: ['research_depth', 'fit_demonstration'],
    excellence_requirements: [
      '20% problem, 80% response',
      'Clear before/after transformation',
      'Growth earned through 2+ failed attempts (not instant)',
      'Physical/emotional details present',
      'No "I learned" statements - shows growth through action'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 8: LEADERSHIP (200-400 words)
  // ═══════════════════════════════════════════════════════════════════════════
  leadership: {
    type: 'leadership',
    name: 'Leadership Experience',
    word_range: { min: 200, max: 400 },
    weights: {
      specificity_evidence: 13,     // CRITICAL - specific impact shown
      authenticity_voice: 10,       // HIGH - genuine not bragging
      personal_connection: 10,      // HIGH - leadership philosophy
      fit_demonstration: 4,         // LOWER
      narrative_clarity: 9,         // MEDIUM - leadership story
      growth_transformation: 11,    // HIGH - growth as leader
      vulnerability_balance: 10,    // HIGH - failures/challenges
      reflection_insight: 10,       // HIGH - leadership insights
      research_depth: 2,            // LOWER
      strategic_coherence: 6,       // MEDIUM
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 9        // MEDIUM - memorable leadership
    },
    critical_dimensions: ['specificity_evidence', 'growth_transformation', 'vulnerability_balance'],
    not_applicable: ['research_depth'],
    excellence_requirements: [
      'Defines leadership beyond titles (actions, not positions)',
      'Shows specific impact on individuals or team',
      'Demonstrates collaborative vs authoritarian style',
      'Includes vulnerability (failures, challenges faced)',
      'Shows growth as a leader over time'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 9: CREATIVE (200-350 words)
  // ═══════════════════════════════════════════════════════════════════════════
  creative: {
    type: 'creative',
    name: 'Creative Side',
    word_range: { min: 200, max: 350 },
    weights: {
      specificity_evidence: 10,     // HIGH - specific creative work
      authenticity_voice: 14,       // CRITICAL - voice IS creativity
      personal_connection: 11,      // HIGH - creativity to identity
      fit_demonstration: 3,         // LOWER
      narrative_clarity: 9,         // MEDIUM - creative journey
      growth_transformation: 9,     // MEDIUM - growth through creativity
      vulnerability_balance: 8,     // MEDIUM - creative risk-taking
      reflection_insight: 10,       // HIGH - creative process insight
      research_depth: 2,            // N/A
      strategic_coherence: 6,       // MEDIUM
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 12       // CRITICAL - creativity should stick
    },
    critical_dimensions: ['authenticity_voice', 'impact_memorability', 'personal_connection'],
    not_applicable: ['research_depth', 'fit_demonstration'],
    excellence_requirements: [
      'Shows creative PROCESS, not just product',
      'Connects creativity to identity/values',
      'Demonstrates growth through creative work',
      'Reveals unique perspective on the world',
      'Balances passion with reflection'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 10: VALUES (200-400 words)
  // ═══════════════════════════════════════════════════════════════════════════
  values: {
    type: 'values',
    name: 'Personal Values',
    word_range: { min: 200, max: 400 },
    weights: {
      specificity_evidence: 11,     // HIGH - demonstrate, don\'t state
      authenticity_voice: 14,       // CRITICAL - genuine values
      personal_connection: 12,      // HIGH - values in action
      fit_demonstration: 3,         // LOWER
      narrative_clarity: 9,         // MEDIUM - values story
      growth_transformation: 8,     // MEDIUM - how values developed
      vulnerability_balance: 8,     // MEDIUM - honest self-reflection
      reflection_insight: 13,       // CRITICAL - values depth
      research_depth: 2,            // N/A
      strategic_coherence: 6,       // MEDIUM
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 8        // MEDIUM - unique values
    },
    critical_dimensions: ['authenticity_voice', 'reflection_insight', 'personal_connection'],
    not_applicable: ['research_depth', 'fit_demonstration'],
    excellence_requirements: [
      'Shows values through actions/stories (not stating them)',
      'Explains how values developed (origin story)',
      'Demonstrates consistency across multiple contexts',
      'Shows self-awareness and nuance',
      'Avoids preachy or generic statements'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 11: FUTURE GOALS (150-300 words)
  // ═══════════════════════════════════════════════════════════════════════════
  future_goals: {
    type: 'future_goals',
    name: 'Future Goals',
    word_range: { min: 150, max: 300 },
    weights: {
      specificity_evidence: 12,     // HIGH - specific goals
      authenticity_voice: 10,       // HIGH - genuine aspirations
      personal_connection: 14,      // CRITICAL - past → future connection
      fit_demonstration: 11,        // HIGH - why this college helps
      narrative_clarity: 9,         // MEDIUM - clear trajectory
      growth_transformation: 8,     // MEDIUM - logical progression
      vulnerability_balance: 3,     // LOWER
      reflection_insight: 10,       // HIGH - why these goals
      research_depth: 2,            // LOWER
      strategic_coherence: 8,       // MEDIUM - fits application story
      prompt_responsiveness: 6,     // BASELINE
      impact_memorability: 7        // MEDIUM
    },
    critical_dimensions: ['personal_connection', 'specificity_evidence', 'fit_demonstration'],
    not_applicable: ['vulnerability_balance'],
    excellence_requirements: [
      'Goals are specific and achievable',
      'Clear connection between past experiences and future goals',
      'Includes impact on others/society (not just career)',
      'Shows thoughtful planning and awareness of path',
      'Aligns with values demonstrated elsewhere in application'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 12: ADDITIONAL INFO (100-650 words)
  // ═══════════════════════════════════════════════════════════════════════════
  additional_info: {
    type: 'additional_info',
    name: 'Additional Information',
    word_range: { min: 100, max: 650 },
    weights: {
      specificity_evidence: 13,     // CRITICAL - specific context
      authenticity_voice: 8,        // MEDIUM - honest tone
      personal_connection: 10,      // HIGH - personal context
      fit_demonstration: 5,         // LOWER
      narrative_clarity: 9,         // MEDIUM - clear explanation
      growth_transformation: 6,     // MEDIUM - resilience if applicable
      vulnerability_balance: 10,    // HIGH - balance explanation/ownership
      reflection_insight: 7,        // MEDIUM - self-awareness
      research_depth: 3,            // LOWER
      strategic_coherence: 15,      // CRITICAL - must add value
      prompt_responsiveness: 10,    // HIGH - answer what they ask
      impact_memorability: 4        // LOWER
    },
    critical_dimensions: ['strategic_coherence', 'specificity_evidence', 'prompt_responsiveness'],
    not_applicable: [],
    excellence_requirements: [
      'Adds genuinely NEW information not found elsewhere',
      'Provides context WITHOUT making excuses',
      'Explains circumstances clearly and concisely',
      'Balances explanation with ownership/resilience',
      'Strategic about what to include vs. leave out'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 13: SHORT ANSWER (25-150 words)
  // ═══════════════════════════════════════════════════════════════════════════
  short_answer: {
    type: 'short_answer',
    name: 'Short Answer',
    word_range: { min: 25, max: 150 },
    weights: {
      specificity_evidence: 16,     // CRITICAL - every word specific
      authenticity_voice: 14,       // CRITICAL - personality shines
      personal_connection: 10,      // HIGH - personal detail
      fit_demonstration: 5,         // LOWER
      narrative_clarity: 9,         // MEDIUM - clear and focused
      growth_transformation: 4,     // N/A
      vulnerability_balance: 2,     // N/A
      reflection_insight: 6,        // LOWER - limited room
      research_depth: 1,            // N/A
      strategic_coherence: 8,       // MEDIUM - fits application
      prompt_responsiveness: 12,    // CRITICAL - no room for tangents
      impact_memorability: 13       // CRITICAL - must punch above weight
    },
    critical_dimensions: ['specificity_evidence', 'authenticity_voice', 'impact_memorability'],
    not_applicable: ['growth_transformation', 'vulnerability_balance', 'research_depth'],
    excellence_requirements: [
      'Every word earns its place (ruthless conciseness)',
      'Highly specific (names, numbers, details)',
      'Shows personality through voice and content',
      'Memorable - reader will recall this answer',
      'Strategic word choice that reveals character'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE 14: OPTIONAL ESSAY (200-500 words)
  // ═══════════════════════════════════════════════════════════════════════════
  optional: {
    type: 'optional',
    name: 'Optional Essay',
    word_range: { min: 200, max: 500 },
    weights: {
      specificity_evidence: 10,     // HIGH - specific content
      authenticity_voice: 11,       // HIGH - genuine contribution
      personal_connection: 10,      // HIGH - new dimension of you
      fit_demonstration: 2,         // LOWER
      narrative_clarity: 9,         // MEDIUM - well-crafted
      growth_transformation: 7,     // MEDIUM
      vulnerability_balance: 6,     // MEDIUM
      reflection_insight: 9,        // MEDIUM - depth of thought
      research_depth: 1,            // N/A
      strategic_coherence: 18,      // CRITICAL - must justify existence
      prompt_responsiveness: 5,     // LOWER - topic is open
      impact_memorability: 12       // HIGH - worth reader's time
    },
    critical_dimensions: ['strategic_coherence', 'impact_memorability', 'authenticity_voice'],
    not_applicable: ['research_depth', 'fit_demonstration'],
    excellence_requirements: [
      'Fills clear gap in application (shows new dimension)',
      'Worth reader\'s time (high quality bar)',
      'Strategic topic choice that complements other essays',
      'Shows another side of applicant',
      'Would not hurt application if submitted'
    ]
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get weight configuration for an essay type
 */
export function getTypeWeightConfig(type: SupplementalType): TypeWeightConfig {
  return TYPE_WEIGHT_CONFIGS[type];
}

/**
 * Get weight for a specific dimension in a specific type
 */
export function getDimensionWeight(type: SupplementalType, dimension: SupplementalDimension): number {
  return TYPE_WEIGHT_CONFIGS[type].weights[dimension];
}

/**
 * Get critical dimensions for a type
 */
export function getCriticalDimensions(type: SupplementalType): SupplementalDimension[] {
  return TYPE_WEIGHT_CONFIGS[type].critical_dimensions;
}

/**
 * Get not applicable dimensions for a type
 */
export function getNotApplicableDimensions(type: SupplementalType): SupplementalDimension[] {
  return TYPE_WEIGHT_CONFIGS[type].not_applicable;
}

/**
 * Get excellence requirements for a type
 */
export function getExcellenceRequirements(type: SupplementalType): string[] {
  return TYPE_WEIGHT_CONFIGS[type].excellence_requirements;
}

/**
 * Calculate weighted score from dimension scores
 */
export function calculateWeightedScore(
  type: SupplementalType,
  dimensionScores: Record<SupplementalDimension, number>
): number {
  const weights = TYPE_WEIGHT_CONFIGS[type].weights;
  let totalScore = 0;

  for (const [dimension, weight] of Object.entries(weights)) {
    const score = dimensionScores[dimension as SupplementalDimension] || 0;
    totalScore += score * weight;
  }

  // Normalize to 0-100 scale
  // Dimensions are 0-10, weights sum to 100
  // A perfect score would be 10 × 100 = 1000, so divide by 10 to get 0-100
  return Math.min(100, Math.round(totalScore / 10));
}

/**
 * Validate that weights sum to 100
 */
export function validateWeights(type: SupplementalType): boolean {
  const weights = TYPE_WEIGHT_CONFIGS[type].weights;
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  return sum === 100;
}

/**
 * Get top N dimensions by weight for a type
 */
export function getTopDimensions(type: SupplementalType, n: number = 3): SupplementalDimension[] {
  const weights = TYPE_WEIGHT_CONFIGS[type].weights;
  const sorted = Object.entries(weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([dim]) => dim as SupplementalDimension);
  return sorted;
}
