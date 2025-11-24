/**
 * Feedback Enricher
 *
 * Phase 17.5: Item 2 - Enriches simple rubric evidence with:
 * - Calibration context (percentile, competitive benchmark)
 * - Tier breakdown (current → next tier)
 * - What they did well (authentic praise)
 * - Essay-specific guidance
 *
 * This is a LIGHTWEIGHT wrapper that enhances existing evidence
 * without requiring changes to the core scoring architecture.
 */

import {
  getPercentileForScore,
  getCompetitiveBenchmark,
  getTierInfo,
  explainScore
} from './calibrationData';

// ============================================================================
// TYPES
// ============================================================================

export interface SimpleEvidence {
  quotes: string[];
  justification: string;
  constructive_feedback?: string;
  anchors_met?: number[];
}

export interface EnrichedFeedback {
  // Original fields (unchanged)
  quotes: string[];
  justification: string;
  constructive_feedback: string;
  anchors_met: number[];

  // NEW: Enhanced sections
  calibration: {
    percentile: string;
    competitive_range: string;
    context_explanation: string;
  };

  strengths: string[];
  opportunities: string[];

  tier_navigation: {
    current_tier: string;
    current_description: string;
    next_tier: string;
    next_description: string;
    how_to_advance: string[];
  };

  next_step: {
    specific_guidance: string;
    essay_example?: string;
  };
}

// ============================================================================
// MAIN ENRICHER
// ============================================================================

/**
 * Enrich simple evidence with calibration, tiers, and personalized guidance
 */
export function enrichFeedback(
  dimensionName: string,
  score: number,
  simpleEvidence: SimpleEvidence,
  essayText: string,
  options: {
    personalizationLevel?: 'low' | 'medium' | 'high';
  } = {}
): EnrichedFeedback {

  const { personalizationLevel = 'medium' } = options;

  // Calibration context
  const calibration = {
    percentile: getPercentileForScore(score, dimensionName),
    competitive_range: getCompetitiveBenchmark(dimensionName),
    context_explanation: explainScore(score, dimensionName)
  };

  // Extract strengths from justification
  const strengths = extractStrengths(
    simpleEvidence.justification,
    simpleEvidence.quotes,
    score
  );

  // Extract opportunities
  const opportunities = extractOpportunities(
    simpleEvidence.justification,
    simpleEvidence.constructive_feedback,
    score
  );

  // Tier navigation
  const tierInfo = getTierInfo(score, dimensionName);
  const tier_navigation = {
    current_tier: tierInfo?.current?.tier_name || `Level ${Math.floor(score / 2.5) + 1}`,
    current_description: tierInfo?.current?.description || "Current performance level",
    next_tier: tierInfo?.next?.tier_name || "Next level",
    next_description: tierInfo?.next?.description || "Higher performance level",
    how_to_advance: tierInfo?.next?.advancement_criteria || tierInfo?.current?.advancement_criteria || [
      "Focus on the opportunities listed below"
    ]
  };

  // Essay-specific next step
  const next_step = buildNextStep(
    dimensionName,
    score,
    simpleEvidence,
    essayText,
    personalizationLevel
  );

  return {
    // Original fields (backwards compatible)
    quotes: simpleEvidence.quotes,
    justification: simpleEvidence.justification,
    constructive_feedback: simpleEvidence.constructive_feedback || "See specific guidance below",
    anchors_met: simpleEvidence.anchors_met || [],

    // Enhanced fields
    calibration,
    strengths,
    opportunities,
    tier_navigation,
    next_step
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractStrengths(
  justification: string,
  quotes: string[],
  score: number
): string[] {

  const strengths: string[] = [];

  // Look for positive language in justification
  const positivePatterns = [
    /(?:shows?|demonstrates?|includes?|provides?|uses?)\s+([^.!?]+(?:specific|concrete|vivid|clear|strong|effective|good)[^.!?]*)/gi,
    /(?:good|strong|effective|clear)\s+([^.!?]+)/gi
  ];

  for (const pattern of positivePatterns) {
    const matches = justification.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        strengths.push(match[1].trim());
      }
    }
  }

  // If score is decent (6+), add encouragement about specific details
  if (score >= 6 && quotes.length > 0) {
    // Look for numbers in quotes
    const numbers = quotes.join(' ').match(/\d+/g);
    if (numbers && numbers.length > 0) {
      strengths.push(`Uses specific numbers and concrete details`);
    }
  }

  // Fallback: At least acknowledge effort
  if (strengths.length === 0) {
    if (score >= 5) {
      strengths.push("Shows foundation in this dimension");
    } else {
      strengths.push("Essay shows effort and potential");
    }
  }

  return strengths.slice(0, 4); // Max 4 strengths
}

function extractOpportunities(
  justification: string,
  constructiveFeedback: string | undefined,
  score: number
): string[] {

  const opportunities: string[] = [];

  // Primary source: constructive feedback
  if (constructiveFeedback) {
    opportunities.push(constructiveFeedback);
  }

  // Look for negative patterns in justification
  const weaknessPatterns = [
    /(?:lacks?|missing|needs?|could|should)\s+([^.!?]+)/gi,
    /(?:no|without|doesn't)\s+([^.!?]+)/gi
  ];

  for (const pattern of weaknessPatterns) {
    const matches = justification.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 10) {
        opportunities.push(match[1].trim());
      }
    }
  }

  // Ensure at least one opportunity
  if (opportunities.length === 0) {
    opportunities.push("See tier advancement criteria for specific improvements");
  }

  return opportunities.slice(0, 3); // Max 3 opportunities
}

function buildNextStep(
  dimensionName: string,
  score: number,
  evidence: SimpleEvidence,
  essayText: string,
  personalizationLevel: 'low' | 'medium' | 'high'
): { specific_guidance: string; essay_example?: string } {

  // Base guidance
  let specific_guidance = evidence.constructive_feedback ||
                           "Focus on strengthening this dimension with more depth and specificity";

  // Essay-specific example (high personalization only)
  let essay_example: string | undefined;

  if (personalizationLevel === 'high' && evidence.quotes.length > 0) {
    // Find a concrete detail in their essay
    const quote = evidence.quotes[0];

    // Look for specific details (numbers, proper nouns, concrete objects)
    const numberMatch = essayText.match(/(\d+)\s+(year|month|day|hour|piece|set)/i);
    const nounMatch = essayText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);

    if (numberMatch || nounMatch) {
      const detail = numberMatch?.[0] || nounMatch?.[0];
      essay_example = `Your essay includes this concrete detail: "${detail}" - this is the kind of specificity that strengthens writing. Look for opportunities to add more details like this.`;
    }
  }

  return {
    specific_guidance,
    essay_example
  };
}

// ============================================================================
// BATCH ENRICHER
// ============================================================================

/**
 * Enrich all dimensions at once
 */
export function enrichAllFeedback(
  dimensionScores: Array<{
    dimension_name: string;
    raw_score?: number;
    final_score: number;
    evidence: SimpleEvidence;
  }>,
  essayText: string,
  options: {
    personalizationLevel?: 'low' | 'medium' | 'high';
  } = {}
): Array<{
  dimension_name: string;
  raw_score?: number;
  final_score: number;
  evidence: SimpleEvidence;
  enriched_feedback: EnrichedFeedback;
}> {

  return dimensionScores.map(dim => ({
    ...dim,
    enriched_feedback: enrichFeedback(
      dim.dimension_name,
      dim.final_score,
      dim.evidence,
      essayText,
      options
    )
  }));
}
