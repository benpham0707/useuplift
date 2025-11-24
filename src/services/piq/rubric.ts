/**
 * PIQ RUBRIC STRUCTURE
 *
 * Unified 13-dimension rubric for evaluating Personal Insight Question essays.
 * Combines best of:
 * - PIQ-specific dimensions (Opening Hook, Vulnerability, Identity)
 * - Proven extracurricular dimensions (Initiative, Role Clarity, Context)
 * - Shared dimensions refined from both systems
 *
 * Weights are baseline values - prompt-specific weights are in dimensionWeights.ts
 */

import type { PIQRubricDimension, PIQPromptType } from './types';
import { BASELINE_WEIGHTS } from './weights/dimensionWeights';

// ============================================================================
// DIMENSION METADATA
// ============================================================================

export interface PIQDimensionMetadata {
  dimension: PIQRubricDimension;
  name: string;
  description: string;
  weight: number;                 // Baseline weight (0-1)
  priority: number;               // 1 = highest priority
  tier: 'critical_foundations' | 'impact_growth' | 'depth_meaning' | 'polish_positioning';
  whatWeEvaluate: string[];       // Key evaluation criteria
}

export const PIQ_RUBRIC_DIMENSIONS: PIQDimensionMetadata[] = [
  // ========================================================================
  // TIER 1: CRITICAL FOUNDATIONS (45% baseline)
  // ========================================================================

  {
    dimension: 'opening_hook_quality',
    name: 'Opening Hook Quality',
    description: 'How effectively your opening grabs attention, establishes stakes, and promises a compelling story within the first 2-3 sentences.',
    weight: BASELINE_WEIGHTS.opening_hook_quality,
    priority: 2,
    tier: 'critical_foundations',
    whatWeEvaluate: [
      'Hook type sophistication (in medias res, vulnerability-first, sensory)',
      'Immediate engagement and intrigue',
      'Stakes establishment (why should reader care)',
      'Connection to essay body (not disconnected)',
      'Literary techniques used',
      'Sensory and specific details in opening'
    ]
  },

  {
    dimension: 'vulnerability_authenticity',
    name: 'Vulnerability & Authenticity',
    description: 'Emotional depth, risk-taking, and transformation credibility. Shows authentic self-revelation without manufactured college essay language.',
    weight: BASELINE_WEIGHTS.vulnerability_authenticity,
    priority: 1,
    tier: 'critical_foundations',
    whatWeEvaluate: [
      'Level of vulnerability (1-5 scale: surface → raw emotional honesty)',
      'Physical/sensory symptoms of emotion (hands shaking, threw up, couldn\'t sleep)',
      'Specific failures and how you handled them',
      'Transformation credibility (earned through struggle vs imposed epiphany)',
      'Defense mechanisms and self-awareness shown',
      'Authenticity markers vs manufactured phrases ("I learned...", "This taught me...")'
    ]
  },

  {
    dimension: 'specificity_evidence',
    name: 'Specificity & Evidence',
    description: 'Concrete details, numbers, proper nouns, and sensory information that build credibility and vividness.',
    weight: BASELINE_WEIGHTS.specificity_evidence,
    priority: 3,
    tier: 'critical_foundations',
    whatWeEvaluate: [
      'Quantified metrics and numbers (hours, people impacted, % improvement)',
      'Specific details vs vague statements',
      'Sensory information (sight, sound, touch, smell, taste)',
      'Proper nouns (names, places, organizations, titles)',
      'Time specificity (dates, durations, timelines)',
      'Before/after comparisons with concrete evidence'
    ]
  },

  {
    dimension: 'voice_integrity',
    name: 'Voice Integrity',
    description: 'Authentic student voice free from manufactured college essay language, AI-like phrasing, and generic essay-speak.',
    weight: BASELINE_WEIGHTS.voice_integrity,
    priority: 4,
    tier: 'critical_foundations',
    whatWeEvaluate: [
      'Absence of essay-speak phrases',
      'Natural conversational rhythm',
      'Active vs passive voice ratio (>70% active)',
      'Vocabulary authenticity (sounds like 17-year-old, not 40-year-old)',
      'Sentence variety and flow',
      'Sounds like you, not ChatGPT or a textbook'
    ]
  },

  {
    dimension: 'narrative_arc_stakes',
    name: 'Narrative Arc & Stakes',
    description: 'Story structure with clear tension, conflict, turning points, and resolution that feels earned. What was at risk?',
    weight: BASELINE_WEIGHTS.narrative_arc_stakes,
    priority: 5,
    tier: 'critical_foundations',
    whatWeEvaluate: [
      'Central tension and conflict clearly established',
      'Stakes clarity (what was at risk - reputation, relationship, identity, opportunity)',
      'Turning point / moment of change',
      'Arc pattern (circular, linear, evolved, disrupted)',
      'Complexity (not too neat/resolved)',
      'Scene vs summary ratio (>60% scene)'
    ]
  },

  // ========================================================================
  // TIER 2: IMPACT & GROWTH (30% baseline)
  // ========================================================================

  {
    dimension: 'transformative_impact',
    name: 'Transformative Impact',
    description: 'Genuine growth and change over time vs generic "learning experiences". How has this shaped who you are?',
    weight: BASELINE_WEIGHTS.transformative_impact,
    priority: 6,
    tier: 'impact_growth',
    whatWeEvaluate: [
      'Before/after belief shifts (how your thinking changed)',
      'Concrete evidence of transformation (what you do differently now)',
      'Growth arc (not instant epiphany, but earned through struggle)',
      'Impact on behavior, relationships, or worldview',
      'Avoiding "I learned that..." statements',
      'Transformation specificity (exactly what changed)'
    ]
  },

  {
    dimension: 'role_clarity_ownership',
    name: 'Role Clarity & Ownership',
    description: 'Clear "I" vs "we" statements, specific contributions, avoiding credit ambiguity. What did YOU do?',
    weight: BASELINE_WEIGHTS.role_clarity_ownership,
    priority: 7,
    tier: 'impact_growth',
    whatWeEvaluate: [
      '"I" statements vs "we" statements (>70% I for individual actions)',
      'Specific role description (not just title)',
      'Clear differentiation of your contribution vs group effort',
      'Ownership of failures and struggles (not just successes)',
      'Avoiding vague "helped with" or "was part of"',
      'Agency demonstration (you made things happen)'
    ]
  },

  {
    dimension: 'initiative_leadership',
    name: 'Initiative & Leadership',
    description: 'Proactive problem-spotting, taking action without being told, creating opportunities vs waiting for them.',
    weight: BASELINE_WEIGHTS.initiative_leadership,
    priority: 8,
    tier: 'impact_growth',
    whatWeEvaluate: [
      'Proactive vs reactive actions',
      'Problem identification (you spotted the issue)',
      'Self-directed learning or action',
      'Taking risks without guarantee of success',
      'Creating opportunities vs waiting for them',
      'Leadership moments (formal title or informal influence)'
    ]
  },

  {
    dimension: 'context_circumstances',
    name: 'Context & Circumstances',
    description: 'Challenges faced, resourcefulness, overcoming obstacles. UC values understanding your opportunities and barriers.',
    weight: BASELINE_WEIGHTS.context_circumstances,
    priority: 9,
    tier: 'impact_growth',
    whatWeEvaluate: [
      'Obstacles clearly described (financial, family, language, access, disability, discrimination)',
      'Resourcefulness demonstrated (making do with limited resources)',
      'Resilience shown (bouncing back from setbacks)',
      'Context provided without victimhood narrative',
      'How circumstances shaped your actions or growth',
      'Avoiding "woe is me" tone while being honest about challenges'
    ]
  },

  // ========================================================================
  // TIER 3: DEPTH & MEANING (15% baseline)
  // ========================================================================

  {
    dimension: 'reflection_insight',
    name: 'Reflection & Insight',
    description: 'Depth of self-awareness, universal insights, meaning-making beyond surface observations. What did you realize?',
    weight: BASELINE_WEIGHTS.reflection_insight,
    priority: 10,
    tier: 'depth_meaning',
    whatWeEvaluate: [
      'Belief shifts (before vs after thinking)',
      'Universal insights (transferable wisdom beyond your specific situation)',
      'Self-realization depth (not just "I learned teamwork")',
      'Insight earned through experience (not imposed moral)',
      'Avoiding generic lessons ("hard work pays off", "never give up")',
      'Connecting specific experience to universal truths'
    ]
  },

  {
    dimension: 'identity_self_discovery',
    name: 'Identity & Self-Discovery',
    description: 'How the essay reveals who you are, your core values, and how your identity has evolved through this experience.',
    weight: BASELINE_WEIGHTS.identity_self_discovery,
    priority: 11,
    tier: 'depth_meaning',
    whatWeEvaluate: [
      'Identity exploration and complexity',
      'Core values made visible through actions (not stated)',
      'Self-concept evolution shown (who you were to who you are)',
      'Identity coherence across essay (consistent sense of self)',
      'Values demonstrated, not stated (not "I value hard work" but showing hard work through actions)',
      'Cultural/personal context integration'
    ]
  },

  // ========================================================================
  // TIER 4: POLISH & POSITIONING (10% baseline)
  // ========================================================================

  {
    dimension: 'craft_language_quality',
    name: 'Craft & Language Quality',
    description: 'Literary sophistication through varied sentence structure, imagery, dialogue, and language precision.',
    weight: BASELINE_WEIGHTS.craft_language_quality,
    priority: 12,
    tier: 'polish_positioning',
    whatWeEvaluate: [
      'Sentence rhythm variety (short punchy + longer complex)',
      'Imagery and metaphor use (not overwrought)',
      'Dialogue integration (makes scenes come alive)',
      'Literary techniques (show vs tell, sensory details, pacing)',
      'Language precision (exact right word, not close-enough word)',
      'Sound devices and flow (essay sounds good read aloud)'
    ]
  },

  {
    dimension: 'fit_trajectory',
    name: 'Fit & Trajectory',
    description: 'Connection to future studies, career, or continued contribution. How does this experience point toward what is next?',
    weight: BASELINE_WEIGHTS.fit_trajectory,
    priority: 13,
    tier: 'polish_positioning',
    whatWeEvaluate: [
      'Future connection clarity (how this experience shapes what is next)',
      'UC-specific mentions when appropriate (programs, values, opportunities)',
      'Trajectory credibility (logical path from experience to future)',
      'Continued commitment indicators (not one-time thing)',
      'Avoiding generic "I want to change the world" statements',
      'Specific next steps or goals when relevant'
    ]
  }
];

// Verify weights sum to 1.0
const totalWeight = PIQ_RUBRIC_DIMENSIONS.reduce((sum, dim) => sum + dim.weight, 0);
if (Math.abs(totalWeight - 1.0) > 0.001) {
  console.warn(`⚠️  PIQ rubric baseline weights sum to ${totalWeight.toFixed(3)}, not 1.0`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get dimension metadata by key
 */
export function getPIQDimensionMetadata(dimension: PIQRubricDimension): PIQDimensionMetadata {
  const metadata = PIQ_RUBRIC_DIMENSIONS.find(d => d.dimension === dimension);
  if (!metadata) {
    throw new Error(`Unknown PIQ dimension: ${dimension}`);
  }
  return metadata;
}

/**
 * Calculate weighted NQI-style score from dimension scores
 *
 * @param dimensionScores - Array of dimension scores (0-10)
 * @param weights - Optional custom weights (uses baseline if not provided)
 * @returns Overall score 0-100
 */
export function calculatePIQOverallScore(
  dimensionScores: { dimension: PIQRubricDimension, score: number }[],
  weights?: Record<PIQRubricDimension, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const { dimension, score } of dimensionScores) {
    const weight = weights?.[dimension] ?? getPIQDimensionMetadata(dimension).weight;
    weightedSum += score * weight * 10; // Score is 0-10, weight is 0-1, result should be 0-100
    totalWeight += weight;
  }

  // Normalize to 0-100
  return Math.round((weightedSum / totalWeight));
}

/**
 * Get score tier label
 */
export function getPIQScoreTier(score: number): 'excellent' | 'strong' | 'good' | 'needs_work' | 'weak' {
  if (score >= 85) return 'excellent';
  if (score >= 75) return 'strong';
  if (score >= 65) return 'good';
  if (score >= 50) return 'needs_work';
  return 'weak';
}

/**
 * Get reader impression label
 */
export function getPIQReaderImpression(score: number, tier: string): string {
  if (tier === 'excellent') {
    return 'Exceptional essay that would stand out to admissions officers';
  }
  if (tier === 'strong') {
    return 'Strong essay competitive for UC admission';
  }
  if (tier === 'good') {
    return 'Solid essay with room for elevation';
  }
  if (tier === 'needs_work') {
    return 'Foundation present but needs significant strengthening';
  }
  return 'Requires substantial revision for competitiveness';
}

/**
 * Get dimension status based on score and issue count
 */
export function getDimensionStatus(
  score: number,
  criticalIssues: number,
  majorIssues: number
): 'critical' | 'needs_work' | 'good' | 'excellent' {
  if (criticalIssues >= 2 || score < 5) return 'critical';
  if (criticalIssues >= 1 || majorIssues >= 3 || score < 6.5) return 'needs_work';
  if (score >= 8.5) return 'excellent';
  return 'good';
}

/**
 * Format dimension name for display
 */
export function formatDimensionName(dimension: PIQRubricDimension): string {
  return getPIQDimensionMetadata(dimension).name;
}

/**
 * Generate quick summary for overall result
 */
export function generatePIQQuickSummary(
  score: number,
  tier: string,
  topIssues: { dimension: PIQRubricDimension, severity: string }[]
): string {
  const criticalCount = topIssues.filter(i => i.severity === 'critical').length;

  if (tier === 'excellent') {
    return `Exceptional PIQ! ${topIssues.length} minor polish opportunities.`;
  }

  if (tier === 'strong') {
    return `Strong foundation. Address ${topIssues.length} issues to reach excellent tier (85+).`;
  }

  if (tier === 'good') {
    return `Solid PIQ with room to grow. Focus on ${topIssues.length} key improvements.`;
  }

  if (criticalCount > 0) {
    return `Start with ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} for maximum impact.`;
  }

  return `Significant strengthening needed. Begin with vulnerability and specificity.`;
}

/**
 * Get dimensions by tier
 */
export function getDimensionsByTier(
  tier: 'critical_foundations' | 'impact_growth' | 'depth_meaning' | 'polish_positioning'
): PIQDimensionMetadata[] {
  return PIQ_RUBRIC_DIMENSIONS.filter(d => d.tier === tier);
}

/**
 * Get top N priority dimensions
 */
export function getTopPriorityDimensions(n: number = 5): PIQDimensionMetadata[] {
  return PIQ_RUBRIC_DIMENSIONS
    .sort((a, b) => a.priority - b.priority)
    .slice(0, n);
}

/**
 * Get all 13 dimensions in priority order
 */
export function getAllDimensionsInPriorityOrder(): PIQDimensionMetadata[] {
  return PIQ_RUBRIC_DIMENSIONS.sort((a, b) => a.priority - b.priority);
}
