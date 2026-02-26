/**
 * Description Rule Scorer — Deterministic Description Scoring
 *
 * Layer 3a of the cognitive decomposition architecture.
 * Takes ExtractedDescriptionFeatures → produces DescriptionScore.
 * Zero LLM calls — pure TypeScript logic.
 *
 * The 5 scoring dimensions:
 * 1. Role Ownership (25%) — Does the reader know what THIS student did?
 * 2. Impact Evidence (25%) — Is there clear cause-and-effect?
 * 3. Differentiation (20%) — What makes THIS student stand out?
 * 4. Action Precision (15%) — How specific is the language?
 * 5. Quantification (15%) — Are numbers used meaningfully?
 *
 * Cost: $0.00 (pure TypeScript logic)
 * Latency: <1ms
 */

import type { ExtractedDescriptionFeatures } from './featureTypes';
import type { DescriptionScore, DescriptionScoreComponent } from './types';
import {
  VERB_QUALITY_HIERARCHY,
  DEFAULT_VERB_TIER,
  DESCRIPTION_DIMENSION_WEIGHTS,
} from './scoringRules';

// ============================================================================
// UTILITY
// ============================================================================

/** Clamp a value to [min, max] */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to 1 decimal place */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ============================================================================
// DIMENSION SCORERS
// ============================================================================

/**
 * A. Score Role Ownership — Does the reader know what THIS student did?
 *
 * Measures the ratio of individual vs team attribution in the description.
 * High individual ownership signals clear, compelling writing.
 */
function scoreRoleOwnership(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
  const { individualPhrases, teamPhrases, roleClearFromDescription, usesFirstPerson } = features.roleOwnership;
  const indCount = individualPhrases.length;
  const teamCount = teamPhrases.length;
  const total = indCount + teamCount;

  // Handle 0/0 case
  const individualRatio = total === 0 ? 0 : indCount / total;

  // Base score from ratio
  let score: number;
  if (individualRatio >= 0.9) {
    score = 9 + individualRatio; // 9-10
  } else if (individualRatio >= 0.7) {
    score = 7 + (individualRatio - 0.7) * 5; // 7-8
  } else if (individualRatio >= 0.5) {
    score = 5 + (individualRatio - 0.5) * 5; // 5-6
  } else if (individualRatio >= 0.3) {
    score = 3 + (individualRatio - 0.3) * 5; // 3-4
  } else {
    score = 1 + individualRatio * (2 / 0.3); // 1-2
  }

  // Bonuses
  if (roleClearFromDescription) score += 1;
  if (usesFirstPerson) score -= 1; // wastes characters

  // Penalty: zero individual phrases with team phrases → strong penalty
  if (indCount === 0 && teamCount > 0) score -= 2;

  score = clamp(round1(score), 0, 10);

  // Generate rationale
  const parts: string[] = [];
  if (indCount > 0) parts.push(`${indCount} individual action phrase(s)`);
  if (teamCount > 0) parts.push(`${teamCount} team/org phrase(s)`);
  if (total === 0) parts.push('no ownership phrases detected');
  if (roleClearFromDescription) parts.push('role clear from description alone');
  if (usesFirstPerson) parts.push('uses first person (wastes characters)');

  const rationale = `Role Ownership scored ${score}/10: ${parts.join('; ')}.`;

  return { score, maxScore: 10, rationale };
}

/**
 * B. Score Impact Evidence — Is there clear cause-and-effect?
 *
 * Points-based scoring from causal chains and measurable outcomes.
 * Generic, unsupported claims REDUCE the score.
 */
function scoreImpactEvidence(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
  const { causalChains, unsupportedClaims, hasMeasurableOutcome } = features.impact;

  let score = 0;

  // +3 per causal chain, +1 bonus if externally validated
  for (const chain of causalChains) {
    score += 3;
    if (chain.hasExternalValidation) score += 1;
  }

  // +2 for measurable outcomes
  if (hasMeasurableOutcome) score += 2;

  // -1 per unsupported claim
  score -= unsupportedClaims.length;

  // Hard cap: no chains + unsupported claims → max 2
  if (causalChains.length === 0 && unsupportedClaims.length > 0) {
    score = Math.min(score, 2);
  }

  score = clamp(round1(score), 0, 10);

  // Generate rationale
  const parts: string[] = [];
  if (causalChains.length > 0) {
    const validated = causalChains.filter(c => c.hasExternalValidation).length;
    parts.push(`${causalChains.length} causal chain(s)${validated > 0 ? ` (${validated} externally validated)` : ''}`);
  } else {
    parts.push('no causal chains found');
  }
  if (hasMeasurableOutcome) parts.push('has measurable outcome');
  if (unsupportedClaims.length > 0) parts.push(`${unsupportedClaims.length} unsupported claim(s)`);

  const rationale = `Impact Evidence scored ${score}/10: ${parts.join('; ')}.`;

  return { score, maxScore: 10, rationale };
}

/**
 * C. Score Action Precision — How specific and powerful is the language?
 *
 * Based on verb quality from the VERB_QUALITY_HIERARCHY lookup table.
 * Prefers individual-action verbs over team/org verbs.
 */
function scoreActionPrecision(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
  const allVerbs = features.verbs;

  // Prefer individual-action verbs; fall back to all verbs if none
  let targetVerbs = allVerbs.filter(v => v.isIndividualAction);
  if (targetVerbs.length === 0) targetVerbs = allVerbs;

  if (targetVerbs.length === 0) {
    return {
      score: 1,
      maxScore: 10,
      rationale: 'Action Precision scored 1/10: no action verbs detected in description.',
    };
  }

  // Look up each verb's tier
  const tiers = targetVerbs.map(v => VERB_QUALITY_HIERARCHY[v.lemma.toLowerCase()] ?? DEFAULT_VERB_TIER);
  const avgTier = tiers.reduce((sum, t) => sum + t, 0) / tiers.length;

  // Map 1-5 tier scale to 0-10 score: tier × 2
  let score = avgTier * 2;

  // Bonus: 3+ distinct elite/strong verbs (tier 4-5)
  const eliteStrongCount = new Set(
    targetVerbs
      .filter(v => (VERB_QUALITY_HIERARCHY[v.lemma.toLowerCase()] ?? DEFAULT_VERB_TIER) >= 4)
      .map(v => v.lemma.toLowerCase())
  ).size;
  if (eliteStrongCount >= 3) score += 1;

  // Penalty: > 50% poor/weak verbs (tier 1-2)
  const weakCount = tiers.filter(t => t <= 2).length;
  if (weakCount / tiers.length > 0.5) score -= 1;

  score = clamp(round1(score), 0, 10);

  // Generate rationale
  const bestVerbs = targetVerbs
    .filter(v => (VERB_QUALITY_HIERARCHY[v.lemma.toLowerCase()] ?? DEFAULT_VERB_TIER) >= 4)
    .map(v => v.lemma)
    .slice(0, 3);
  const worstVerbs = targetVerbs
    .filter(v => (VERB_QUALITY_HIERARCHY[v.lemma.toLowerCase()] ?? DEFAULT_VERB_TIER) <= 2)
    .map(v => v.lemma)
    .slice(0, 3);

  const parts: string[] = [`${targetVerbs.length} verb(s), average tier ${round1(avgTier)}/5`];
  if (bestVerbs.length > 0) parts.push(`strong: ${bestVerbs.join(', ')}`);
  if (worstVerbs.length > 0) parts.push(`weak: ${worstVerbs.join(', ')}`);

  const rationale = `Action Precision scored ${score}/10: ${parts.join('; ')}.`;

  return { score, maxScore: 10, rationale };
}

/**
 * D. Score Quantification — Are numbers used meaningfully?
 *
 * Rewards meaningful numbers with context, penalizes vanity metrics.
 */
function scoreQuantification(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
  const meaningful = features.numbers.filter(n => n.isMeaningful);
  const vanity = features.numbers.filter(n => !n.isMeaningful);
  const meaningfulWithContext = meaningful.filter(n => n.hasContext);

  // Base score from meaningful count
  let score: number;
  if (meaningfulWithContext.length >= 3) {
    score = 9 + Math.min(meaningfulWithContext.length - 3, 1); // 9-10
  } else if (meaningfulWithContext.length >= 2) {
    score = 7 + (meaningfulWithContext.length - 2); // 7-8
  } else if (meaningfulWithContext.length >= 1) {
    score = 5 + (meaningfulWithContext.length - 1); // 5-6
  } else if (meaningful.length >= 1) {
    score = 3 + Math.min(meaningful.length - 1, 1); // 3-4 (meaningful but no context)
  } else if (vanity.length > 0) {
    score = 2; // vanity only
  } else {
    score = 1; // no numbers at all
  }

  // Bonus: meaningful number with context
  if (meaningfulWithContext.length > 0) score += 1;

  // Penalty: -1 per vanity metric (capped at -2)
  score -= Math.min(vanity.length, 2);

  score = clamp(round1(score), 0, 10);

  // Generate rationale
  const parts: string[] = [];
  if (meaningful.length > 0) {
    parts.push(`${meaningful.length} meaningful metric(s)${meaningfulWithContext.length > 0 ? ` (${meaningfulWithContext.length} with context)` : ''}`);
  }
  if (vanity.length > 0) parts.push(`${vanity.length} vanity metric(s)`);
  if (features.numbers.length === 0) parts.push('no numbers found in description');

  const rationale = `Quantification scored ${score}/10: ${parts.join('; ')}.`;

  return { score, maxScore: 10, rationale };
}

/**
 * E. Score Differentiation — What makes THIS student stand out?
 *
 * Based on unique details, the thousand-student test, and generic phrase count.
 */
function scoreDifferentiation(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
  const { uniqueDetails, genericPhrases, passesThousandStudentTest, standoutElement } = features.differentiation;
  const uniqueCount = uniqueDetails.length;
  const genericCount = genericPhrases.length;

  // Base score
  let score: number;
  if (uniqueCount >= 3 && passesThousandStudentTest) {
    score = 9 + Math.min(uniqueCount - 3, 1); // 9-10
  } else if (uniqueCount >= 2 && passesThousandStudentTest) {
    score = 7 + (uniqueCount - 2); // 7-8
  } else if (uniqueCount >= 1 || passesThousandStudentTest) {
    score = 5 + Math.min(uniqueCount, 1); // 5-6
  } else {
    score = 2 + Math.min(uniqueCount, 1); // 2-3
  }

  // Standout element bonus
  if (standoutElement) score += 1;

  // Generic phrase penalty: -1 per 2 generic phrases (capped at -2)
  score -= Math.min(Math.floor(genericCount / 2), 2);

  score = clamp(round1(score), 0, 10);

  // Generate rationale
  const parts: string[] = [];
  parts.push(`${uniqueCount} unique detail(s)`);
  parts.push(passesThousandStudentTest ? 'passes 1,000-student test' : 'fails 1,000-student test');
  if (standoutElement) parts.push(`standout: "${standoutElement}"`);
  if (genericCount > 0) parts.push(`${genericCount} generic phrase(s)`);

  const rationale = `Differentiation scored ${score}/10: ${parts.join('; ')}.`;

  return { score, maxScore: 10, rationale };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Score an activity description deterministically from extracted features.
 *
 * Produces exactly the same `DescriptionScore` shape as the LLM-powered scorer.
 * Downstream consumers see the same type regardless of scoring method.
 */
function scoreDescription(features: ExtractedDescriptionFeatures): DescriptionScore {
  // 1. Score all 5 dimensions
  const roleOwnershipResult = scoreRoleOwnership(features);
  const impactEvidenceResult = scoreImpactEvidence(features);
  const actionPrecisionResult = scoreActionPrecision(features);
  const quantificationResult = scoreQuantification(features);
  const differentiationResult = scoreDifferentiation(features);

  // 2. Calculate weighted total
  const weights = DESCRIPTION_DIMENSION_WEIGHTS;
  const weightedTotal =
    roleOwnershipResult.score * weights.roleOwnership +
    impactEvidenceResult.score * weights.impactEvidence +
    differentiationResult.score * weights.differentiation +
    actionPrecisionResult.score * weights.actionPrecision +
    quantificationResult.score * weights.quantification;

  // Floor at 1 — DescriptionScore.total is on a 1-10 scale
  const total = clamp(round1(weightedTotal), 1, 10);

  // 3. Build breakdown with legacy field names
  const breakdown = {
    specificity: roleOwnershipResult,
    impactClarity: impactEvidenceResult,
    actionLanguage: actionPrecisionResult,
    quantification: quantificationResult,
    authenticityVoice: differentiationResult,
  };

  // 4. Generate strengths (top 2 dimensions scoring >= 7)
  const dimensionScores = [
    { name: 'Role Ownership', score: roleOwnershipResult.score },
    { name: 'Impact Evidence', score: impactEvidenceResult.score },
    { name: 'Action Precision', score: actionPrecisionResult.score },
    { name: 'Quantification', score: quantificationResult.score },
    { name: 'Differentiation', score: differentiationResult.score },
  ].sort((a, b) => b.score - a.score);

  const strengths = dimensionScores
    .filter(d => d.score >= 7)
    .slice(0, 2)
    .map(d => `${d.name} (${d.score}/10): strong performance in this dimension`);

  // 5. Generate improvements (bottom 2 dimensions scoring <= 5)
  const improvements = dimensionScores
    .filter(d => d.score <= 5)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map(d => `${d.name} (${d.score}/10): needs improvement in this dimension`);

  // 6. Generate overall rationale
  const overallRationale =
    `Description scored ${total}/10. ` +
    `Strongest: ${dimensionScores[0].name} (${dimensionScores[0].score}/10). ` +
    `Weakest: ${dimensionScores[dimensionScores.length - 1].name} (${dimensionScores[dimensionScores.length - 1].score}/10). ` +
    `Weighted from: Role Ownership ${roleOwnershipResult.score}, Impact ${impactEvidenceResult.score}, ` +
    `Differentiation ${differentiationResult.score}, Action Precision ${actionPrecisionResult.score}, ` +
    `Quantification ${quantificationResult.score}.`;

  return {
    total,
    breakdown,
    strengths,
    improvements,
    overallRationale,
  };
}

// ============================================================================
// SERVICE CLASS (singleton pattern per codebase convention)
// ============================================================================

export class DescriptionRuleScorerService {
  /**
   * Score a description deterministically from extracted features.
   * Produces the same DescriptionScore shape as the LLM-powered scorer.
   */
  scoreDescription(features: ExtractedDescriptionFeatures): DescriptionScore {
    return scoreDescription(features);
  }

  /**
   * Score individual dimensions (exposed for unit testing).
   */
  scoreRoleOwnership(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
    return scoreRoleOwnership(features);
  }

  scoreImpactEvidence(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
    return scoreImpactEvidence(features);
  }

  scoreActionPrecision(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
    return scoreActionPrecision(features);
  }

  scoreQuantification(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
    return scoreQuantification(features);
  }

  scoreDifferentiation(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
    return scoreDifferentiation(features);
  }
}

export const descriptionRuleScorerService = new DescriptionRuleScorerService();
