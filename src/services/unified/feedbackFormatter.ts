/**
 * Enhanced Feedback Formatter
 *
 * Phase 17.5: Item 2 - Transform LLM analyzer output into rich,
 * calibrated, deeply personalized feedback.
 *
 * Philosophy:
 * - Acknowledge what they DID well (authentic praise)
 * - Explain their score in context (percentile, competitive range)
 * - Show the tier pathway (current → next tier)
 * - Give essay-specific, actionable next steps
 * - Make them feel: "They really READ my essay and get what I'm trying to do"
 */

import {
  EnhancedDimensionEvidence,
  RichLLMAnalysis,
  FeedbackFormattingOptions
} from './enhancedFeedbackTypes';
import {
  getPercentileForScore,
  getCompetitiveBenchmark,
  getTierForScore,
  explainScore,
  getTierInfo,
  getCalibrationForDimension
} from './calibrationData';

// ============================================================================
// MAIN FORMATTER
// ============================================================================

export function formatEnhancedFeedback(
  dimension: string,
  score: number,
  llmAnalysis: RichLLMAnalysis,
  essayText: string,
  options: FeedbackFormattingOptions = {}
): EnhancedDimensionEvidence {

  const {
    tone = 'balanced',
    depth = 'detailed',
    personalization_level = 'high'
  } = options;

  // Extract quotes
  const quotes = llmAnalysis.evidence_quotes || [];

  // Generate each section
  const what_we_see = generatePersonalizedObservation(
    dimension,
    quotes,
    llmAnalysis,
    essayText,
    personalization_level
  );

  const what_works_well = extractStrengths(llmAnalysis, quotes, essayText);

  const specific_opportunities = extractOpportunities(llmAnalysis, quotes, tone);

  const score_context = {
    your_score: score,
    percentile_range: getPercentileForScore(score, dimension),
    competitive_benchmark: getCompetitiveBenchmark(dimension),
    what_this_means: explainScore(score, dimension)
  };

  const tier_breakdown = buildTierBreakdown(score, dimension, llmAnalysis);

  const concrete_next_step = buildConcreteNextStep(
    dimension,
    score,
    llmAnalysis,
    quotes,
    essayText,
    personalization_level
  );

  // Legacy fields (for backwards compatibility)
  const justification = llmAnalysis.evaluator_note || buildJustification(llmAnalysis, score);
  const constructive_feedback = llmAnalysis.strategic_pivot || concrete_next_step.prescription;

  return {
    quotes,
    what_we_see,
    what_works_well,
    specific_opportunities,
    score_context,
    tier_breakdown,
    concrete_next_step,
    justification,
    constructive_feedback,
    anchors_met: [] // Legacy field
  };
}

// ============================================================================
// SECTION BUILDERS
// ============================================================================

/**
 * Generate personalized observation about their essay
 */
function generatePersonalizedObservation(
  dimension: string,
  quotes: string[],
  llmAnalysis: RichLLMAnalysis,
  essayText: string,
  personalizationLevel: 'low' | 'medium' | 'high'
): string {

  if (personalizationLevel === 'low') {
    return `Looking at your essay, we analyzed the ${dimension.replace(/_/g, ' ')} dimension.`;
  }

  // Extract a specific detail from their essay to reference
  const specificDetail = extractSpecificDetail(quotes, essayText);

  const observations = [];

  // Reference their specific content
  if (quotes.length > 0 && personalizationLevel === 'high') {
    const primaryQuote = quotes[0];
    observations.push(`Looking at your essay, we see you open with: "${primaryQuote.substring(0, 80)}${primaryQuote.length > 80 ? '...' : ''}"`);
  }

  // Add context from LLM analysis
  if (llmAnalysis.tier_evaluation?.tier_reasoning) {
    observations.push(llmAnalysis.tier_evaluation.tier_reasoning);
  }

  return observations.join(' ');
}

/**
 * Extract what they did well (authentic praise)
 */
function extractStrengths(
  llmAnalysis: RichLLMAnalysis,
  quotes: string[],
  essayText: string
): string[] {

  if (llmAnalysis.strengths && llmAnalysis.strengths.length > 0) {
    return llmAnalysis.strengths;
  }

  // Fallback: Extract from reasoning
  const strengths: string[] = [];

  // Look for positive signals in the analysis
  if (llmAnalysis.reasoning) {
    for (const [key, value] of Object.entries(llmAnalysis.reasoning)) {
      if (typeof value === 'string' && (value.includes('good') || value.includes('strong') || value.includes('effective'))) {
        strengths.push(value);
      }
    }
  }

  // If still no strengths, provide encouraging observation
  if (strengths.length === 0) {
    strengths.push("Your essay shows effort and care in its construction");
  }

  return strengths.slice(0, 5); // Max 5 strengths
}

/**
 * Extract opportunities for growth
 */
function extractOpportunities(
  llmAnalysis: RichLLMAnalysis,
  quotes: string[],
  tone: 'encouraging' | 'direct' | 'balanced'
): string[] {

  if (llmAnalysis.weaknesses && llmAnalysis.weaknesses.length > 0) {
    // Adjust tone if needed
    if (tone === 'encouraging') {
      return llmAnalysis.weaknesses.map(w =>
        w.replace(/^(No |Lacks |Missing )/i, 'Could strengthen: ')
      );
    }
    return llmAnalysis.weaknesses;
  }

  // Fallback
  return ["Consider deepening this dimension with more specific details and examples"];
}

/**
 * Build tier breakdown section
 */
function buildTierBreakdown(
  score: number,
  dimension: string,
  llmAnalysis: RichLLMAnalysis
): EnhancedDimensionEvidence['tier_breakdown'] {

  const tierInfo = getTierInfo(score, dimension);
  const calibration = getCalibrationForDimension(dimension);

  if (!tierInfo || !calibration) {
    // Fallback if dimension not found
    return {
      current_tier_name: "Current Level",
      current_tier_description: "Analysis in progress",
      current_tier_range: `${Math.floor(score)}-${Math.ceil(score)}`,
      next_tier_name: "Next Level",
      next_tier_description: "See improvement suggestions",
      next_tier_range: "",
      gap_analysis: llmAnalysis.tier_evaluation?.tier_reasoning || "See strategic guidance for next steps",
      path_to_next_tier: llmAnalysis.weaknesses || []
    };
  }

  const currentTier = tierInfo.current;
  const nextTier = tierInfo.next;

  return {
    current_tier_name: `TIER ${currentTier.tier_number}: ${currentTier.tier_name}`,
    current_tier_description: currentTier.description,
    current_tier_range: currentTier.score_range,

    next_tier_name: nextTier ? `TIER ${nextTier.tier_number}: ${nextTier.tier_name}` : "Maximum Tier Achieved",
    next_tier_description: nextTier?.description || "You're at the highest tier",
    next_tier_range: nextTier?.score_range || "",

    gap_analysis: llmAnalysis.tier_evaluation?.tier_reasoning ||
                   `To advance from ${currentTier.tier_name} to ${nextTier?.tier_name || 'the next level'}, focus on the opportunities listed below.`,

    path_to_next_tier: nextTier?.advancement_criteria || currentTier.advancement_criteria
  };
}

/**
 * Build concrete, essay-specific next step
 */
function buildConcreteNextStep(
  dimension: string,
  score: number,
  llmAnalysis: RichLLMAnalysis,
  quotes: string[],
  essayText: string,
  personalizationLevel: 'low' | 'medium' | 'high'
): EnhancedDimensionEvidence['concrete_next_step'] {

  // Diagnosis: What's the core issue?
  const diagnosis = llmAnalysis.weaknesses?.[0] ||
                     llmAnalysis.tier_evaluation?.tier_reasoning ||
                     "This dimension could be strengthened";

  // Prescription: What's the fix?
  const prescription = llmAnalysis.strategic_pivot ||
                        generatePrescription(dimension, score, llmAnalysis);

  // Essay-specific example (high personalization only)
  let essay_specific_example = "";
  if (personalizationLevel === 'high' && quotes.length > 0) {
    essay_specific_example = extractEssaySpecificExample(dimension, quotes, essayText);
  }

  // Rewrite suggestion (if applicable)
  let rewrite_suggestion = "";
  if (personalizationLevel === 'high' && shouldOfferRewrite(dimension, score)) {
    rewrite_suggestion = generateRewriteSuggestion(dimension, quotes, llmAnalysis);
  }

  return {
    diagnosis,
    prescription,
    essay_specific_example,
    rewrite_suggestion
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildJustification(llmAnalysis: RichLLMAnalysis, score: number): string {
  if (llmAnalysis.evaluator_note) return llmAnalysis.evaluator_note;

  const qualityDescriptors: { [key: number]: string } = {
    1: "needs significant strengthening",
    2: "shows potential but requires substantial revision",
    3: "is functional but not yet distinctive",
    4: "demonstrates competence",
    5: "is developing well",
    6: "shows clear strengths",
    7: "is strong and competitive",
    8: "is very strong",
    9: "is exceptional",
    10: "is outstanding and exemplary"
  };

  const tierScore = Math.round(score);
  const descriptor = qualityDescriptors[tierScore] || "has been evaluated";

  return `This essay ${descriptor} in this dimension. Score: ${score}/10.`;
}

function extractSpecificDetail(quotes: string[], essayText: string): string {
  // Extract a memorable detail from their essay
  if (quotes.length > 0) {
    const quote = quotes[0];
    // Look for concrete nouns, numbers, proper nouns
    const concreteMatches = quote.match(/(\d+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
    if (concreteMatches && concreteMatches.length > 0) {
      return concreteMatches[0];
    }
  }
  return "";
}

function generatePrescription(
  dimension: string,
  score: number,
  llmAnalysis: RichLLMAnalysis
): string {

  // Generic prescriptions by dimension (fallback)
  const prescriptions: { [key: string]: string } = {
    opening_power_scene_entry: "Start with a specific, visual moment instead of an abstract statement",
    narrative_arc_stakes_turn: "Develop a clear conflict with meaningful stakes",
    character_interiority_vulnerability: "Share a moment of genuine doubt or vulnerability",
    show_dont_tell_craft: "Replace summary with specific scenes and sensory details",
    reflection_meaning_making: "Connect your insights to broader applications",
    intellectual_vitality_curiosity: "Show your intellectual engagement through specific examples",
    originality_specificity_voice: "Add details only YOU would know",
    structure_pacing_coherence: "Tighten transitions and vary sentence structure",
    word_economy_craft: "Cut unnecessary words and sharpen prose",
    context_constraints_disclosure: "Provide relevant context for your achievements"
  };

  return prescriptions[dimension] || "Focus on strengthening this dimension with more depth and specificity";
}

function extractEssaySpecificExample(
  dimension: string,
  quotes: string[],
  essayText: string
): string {

  // Look for concrete details in their essay that could be leveraged
  if (quotes.length === 0) return "";

  // Simple heuristic: find the most specific quote
  const specificQuote = quotes.reduce((best, current) => {
    const currentSpecificity = (current.match(/\d+/g) || []).length +
                                (current.match(/[A-Z][a-z]+/g) || []).length;
    const bestSpecificity = (best.match(/\d+/g) || []).length +
                             (best.match(/[A-Z][a-z]+/g) || []).length;
    return currentSpecificity > bestSpecificity ? current : best;
  }, quotes[0]);

  return `Look at this detail from your essay: "${specificQuote.substring(0, 100)}${specificQuote.length > 100 ? '...' : ''}" - this is the kind of specificity that strengthens your writing.`;
}

function shouldOfferRewrite(dimension: string, score: number): boolean {
  // Offer rewrites for low scores where concrete examples help
  const rewriteDimensions = [
    'opening_power_scene_entry',
    'show_dont_tell_craft',
    'word_economy_craft'
  ];

  return rewriteDimensions.includes(dimension) && score < 6;
}

function generateRewriteSuggestion(
  dimension: string,
  quotes: string[],
  llmAnalysis: RichLLMAnalysis
): string {

  if (quotes.length === 0) return "";

  // For opening hook, we can suggest a rewrite
  if (dimension === 'opening_power_scene_entry') {
    const originalOpening = quotes[0];

    // Extract any concrete details
    const concreteDetails = originalOpening.match(/(\d+|Lego|Ninjago|puzzle|sneaker|website|coding|HTML)/gi) || [];

    if (concreteDetails.length > 0) {
      return `Instead of: "${originalOpening.substring(0, 80)}..."\n\nConsider: "Start with a specific moment that shows your ${concreteDetails[0]} experience in action - drop us into the scene immediately."`;
    }
  }

  return "";
}
