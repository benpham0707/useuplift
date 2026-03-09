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
import type { ExpertiseMatchResult } from './expertiseSignaling/types';
import { getExpertiseDomain } from './expertiseSignaling';

// ============================================================================
// TITLE-EVIDENCE GATE (Issues 2 & 6)
// ============================================================================

/**
 * Leadership action verbs that prove the title-holder actually LED something.
 * If a description contains a leadership title but none of these actions,
 * the title alone should not inflate the score.
 */
const LEADERSHIP_ACTION_EVIDENCE = new Set([
  'delegated', 'delegating', 'mentored', 'mentoring', 'organized', 'organizing',
  'managed', 'managing', 'grew', 'growing', 'recruited', 'recruiting',
  'trained', 'training', 'directed', 'directing', 'restructured', 'restructuring',
  'coordinated', 'coordinating', 'oversaw', 'overseeing', 'supervised', 'supervising',
  'implemented', 'implementing', 'launched', 'launching', 'initiated', 'initiating',
  'negotiated', 'negotiating', 'advocated', 'advocating', 'mobilized', 'mobilizing',
  'spearheaded', 'spearheading', 'transformed', 'transforming', 'reformed', 'reforming',
  'expanded', 'expanding', 'created', 'creating', 'established', 'establishing',
  'proposed', 'proposing', 'redesigned', 'redesigning', 'built', 'building',
]);

/**
 * Leadership titles that are commonly inflated in activity descriptions.
 * These titles should only receive full scoring credit when accompanied
 * by evidence of actual leadership actions or measurable impact.
 */
const LEADERSHIP_TITLES = new Set([
  'president', 'founder', 'co-founder', 'captain', 'co-captain',
  'chair', 'chairman', 'chairwoman', 'chairperson', 'co-chair',
  'director', 'head', 'chief', 'leader', 'coordinator',
]);

/**
 * Check whether a description has leadership evidence beyond just a title.
 * Returns true if the description contains verbs/phrases demonstrating
 * actual leadership actions, not just holding a position.
 */
function hasLeadershipEvidence(features: ExtractedDescriptionFeatures): boolean {
  // Check if any extracted verbs match leadership action evidence
  for (const verb of features.verbs) {
    if (LEADERSHIP_ACTION_EVIDENCE.has(verb.lemma.toLowerCase())) return true;
    if (LEADERSHIP_ACTION_EVIDENCE.has(verb.verb.toLowerCase())) return true;
  }
  // Check for causal chains (leadership with demonstrated impact)
  if (features.impact.causalChains.length > 0) return true;
  // Check for measurable outcomes (results-oriented leadership)
  if (features.impact.hasMeasurableOutcome) return true;
  return false;
}

/**
 * Detect if a description or role contains a leadership title for THIS student.
 *
 * Uses word-boundary matching to avoid false positives from substrings:
 * - "spearheaded" should NOT match "head"
 * - "headquarters" should NOT match "head"
 * - "directed by the professor" should NOT match (that's someone else's title)
 *
 * Only matches standalone whole words from LEADERSHIP_TITLES.
 */
function containsLeadershipTitle(features: ExtractedDescriptionFeatures): boolean {
  // Check individual phrases and verb contexts for title mentions
  const searchTexts = [
    ...features.roleOwnership.individualPhrases,
    ...features.verbs.map(v => v.context),
    ...features.differentiation.uniqueDetails,
  ];
  for (const text of searchTexts) {
    const words = text.toLowerCase().split(/[\s,;/()-]+/);
    for (const word of words) {
      if (LEADERSHIP_TITLES.has(word)) return true;
    }
  }
  return false;
}

// ============================================================================
// "FOUNDED" SCALE ANALYSIS (Issue 7)
// ============================================================================

/**
 * Determine scale context for "founded" verb.
 * Returns a multiplier: small scale (0.6), unknown/moderate (0.8), large scale (1.0).
 */
function getFoundedScaleMultiplier(features: ExtractedDescriptionFeatures): number {
  const meaningfulNumbers = features.numbers.filter(n => n.isMeaningful);

  for (const num of meaningfulNumbers) {
    const unitLower = num.unit.toLowerCase();
    const isReachMetric = unitLower.includes('member') || unitLower.includes('student') ||
      unitLower.includes('people') || unitLower.includes('participant') ||
      unitLower.includes('user') || unitLower.includes('family') ||
      unitLower.includes('famil') || unitLower.includes('served') ||
      unitLower.includes('client') || unitLower.includes('customer') ||
      unitLower.includes('attendee') || unitLower.includes('subscriber');
    const isRevenueMetric = unitLower.includes('dollar') || unitLower.includes('revenue') ||
      unitLower.includes('raised') || unitLower.includes('funded') ||
      unitLower.includes('income') || unitLower.includes('$');

    if (isReachMetric) {
      if (num.numericValue >= 100) return 1.0; // Large scale
      if (num.numericValue <= 10) return 0.6;  // Small scale
      return 0.8; // Moderate
    }
    if (isRevenueMetric) {
      if (num.numericValue >= 5000) return 1.0; // Significant revenue
      if (num.numericValue >= 1000) return 0.8; // Moderate revenue
      return 0.6; // Small
    }
  }

  // No scale indicators found — moderate credit (can't verify impact)
  return 0.8;
}

// ============================================================================
// QUANTIFICATION SIGNIFICANCE SCALING (Issue 10)
// ============================================================================

/**
 * Calculate a significance multiplier for a quantified metric.
 * Percentages and large absolute numbers are more impressive than small counts.
 */
function getQuantificationSignificance(num: { rawValue: string; numericValue: number; unit: string; hasContext: boolean; isMeaningful: boolean }): number {
  const unitLower = num.unit.toLowerCase();
  const rawLower = num.rawValue.toLowerCase();

  // Percentages (retention rate, growth %, improvement %) — high significance
  if (rawLower.includes('%') || unitLower.includes('percent') || unitLower.includes('rate') ||
    unitLower.includes('improvement') || unitLower.includes('increase') ||
    unitLower.includes('decrease') || unitLower.includes('reduction') ||
    unitLower.includes('growth')) {
    return 1.2;
  }

  // Large absolute numbers (1000+ people, $10K+ revenue, 500+ hours)
  if (num.numericValue >= 1000) return 1.1;

  // Medium absolute numbers (50-999)
  if (num.numericValue >= 50) return 1.0;

  // Small absolute numbers (<=49 with no context) — reduced significance
  // Exception: small numbers WITH strong context still count (e.g., "8 students all admitted to Ivy League")
  if (num.hasContext) return 0.85;
  return 0.7;
}

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
// DOMAIN-SPECIFIC VERB LOOKUP
// ============================================================================

/**
 * Build a domain-specific verb→tier mapping from an ExpertiseDomain's verbHierarchy.
 *
 * Maps the 3-tier domain system (power/standard/weak) to the global 5-tier scale:
 *   power   → 5 (ELITE)  — field-specific verbs signaling original contribution
 *   standard → 3 (GOOD)   — competent verbs appropriate for the field
 *   weak     → 1 (POOR)   — passive verbs that signal resume padding
 *
 * Returns a Map<lowercase_lemma, tier> for O(1) lookup per verb.
 * Returns undefined if no domain is found (caller falls back to global hierarchy).
 */
function buildDomainVerbLookup(expertiseResult: ExpertiseMatchResult): Map<string, 1 | 2 | 3 | 4 | 5> | undefined {
  const domain = getExpertiseDomain(expertiseResult.domainId);
  if (!domain || domain.verbHierarchy.length === 0) return undefined;

  const tierMapping: Record<string, 1 | 2 | 3 | 4 | 5> = {
    power: 5,
    standard: 3,
    weak: 1,
  };

  const lookup = new Map<string, 1 | 2 | 3 | 4 | 5>();
  for (const verbTier of domain.verbHierarchy) {
    const numericTier = tierMapping[verbTier.tier];
    if (numericTier === undefined) continue;
    for (const verb of verbTier.verbs) {
      lookup.set(verb.toLowerCase(), numericTier);
    }
  }

  return lookup.size > 0 ? lookup : undefined;
}

// ============================================================================
// DIMENSION SCORERS
// ============================================================================

/**
 * A. Score Role Ownership — Does the reader know what THIS student did?
 *
 * Measures the ratio of individual vs team attribution in the description.
 * High individual ownership signals clear, compelling writing.
 *
 * TITLE-EVIDENCE GATE (Issues 2 & 6): If the description contains a
 * leadership title (President, Founder, Captain, etc.) but no evidence of
 * actual leadership actions, the role ownership bonus is capped. Titles
 * without demonstrated impact are duties, not achievements.
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

  // TITLE-EVIDENCE GATE (Issues 2 & 6):
  // If description mentions a leadership title but lacks evidence of actual
  // leadership actions (delegating, mentoring, organizing, etc.), cap the
  // score. A title alone is not role ownership — it's a position label.
  const hasTitle = containsLeadershipTitle(features);
  const hasEvidence = hasLeadershipEvidence(features);
  let titleGateApplied = false;

  if (hasTitle && !hasEvidence) {
    // Cap: title without evidence maxes at 6.0
    // (Position is clear, but AOs see through title-only entries)
    score = Math.min(score, 6.0);
    titleGateApplied = true;
  }

  score = clamp(round1(score), 0, 10);

  // Generate rationale
  const parts: string[] = [];
  if (indCount > 0) parts.push(`${indCount} individual action phrase(s)`);
  if (teamCount > 0) parts.push(`${teamCount} team/org phrase(s)`);
  if (total === 0) parts.push('no ownership phrases detected');
  if (roleClearFromDescription) parts.push('role clear from description alone');
  if (usesFirstPerson) parts.push('uses first person (wastes characters)');
  if (titleGateApplied) parts.push('title-only: leadership title present but no leadership action evidence (capped)');

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
 * Uses field-specific verb hierarchy when expertise signals are available,
 * falling back to the global VERB_QUALITY_HIERARCHY for unlisted verbs.
 *
 * This matters because verb quality is field-dependent:
 * - "Designed" is ELITE (5) in engineering but STANDARD (3) in visual arts
 * - "Discovered" is ELITE (5) in research but has no special status in athletics
 * - "Competed" is STANDARD (3) in athletics but WEAK (1) in research
 *
 * SCALE-AWARE "FOUNDED" (Issue 7): "Founded" is scored contextually —
 * founding a 5-person book club is moderate initiative, while founding
 * a nonprofit serving 500+ families is exceptional initiative. The verb
 * tier is scaled by evidence of impact/reach.
 *
 * Prefers individual-action verbs over team/org verbs.
 */
function scoreActionPrecision(
  features: ExtractedDescriptionFeatures,
  expertiseResult?: ExpertiseMatchResult,
): DescriptionScoreComponent {
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

  // Build domain-specific verb lookup if expertise data is available
  const domainVerbLookup = expertiseResult ? buildDomainVerbLookup(expertiseResult) : undefined;
  const usingDomainVerbs = domainVerbLookup !== undefined;

  // Issue 7: pre-compute "founded" scale multiplier once
  const foundedScaleMultiplier = getFoundedScaleMultiplier(features);

  // Verbs that represent founding/creating and should be scale-aware
  const FOUNDING_VERBS = new Set(['found', 'founded', 'co-found', 'co-founded', 'establish', 'established', 'start', 'started']);

  // Resolve verb tier: domain-specific → global → default
  // Issue 7: founding verbs are scale-adjusted
  const resolveVerbTier = (lemma: string): number => {
    const lower = lemma.toLowerCase();
    let tier: number;

    // Domain-specific lookup takes priority
    if (domainVerbLookup) {
      const domainTier = domainVerbLookup.get(lower);
      if (domainTier !== undefined) {
        tier = domainTier;
      } else {
        tier = VERB_QUALITY_HIERARCHY[lower] ?? DEFAULT_VERB_TIER;
      }
    } else {
      tier = VERB_QUALITY_HIERARCHY[lower] ?? DEFAULT_VERB_TIER;
    }

    // Issue 7: Scale-adjust founding verbs
    // "founded" base tier is 4 (STRONG). Scale multiplier adjusts the effective tier:
    //   small scale (0.6): 4 * 0.6 = 2.4 → moderate-weak
    //   unknown (0.8): 4 * 0.8 = 3.2 → good
    //   large scale (1.0): 4 * 1.0 = 4.0 → strong (full credit)
    if (FOUNDING_VERBS.has(lower) && tier >= 4) {
      tier = tier * foundedScaleMultiplier;
    }

    return Math.max(1, Math.min(5, tier));
  };

  // Look up each verb's tier using the layered resolver
  const tiers = targetVerbs.map(v => resolveVerbTier(v.lemma));
  const avgTier = tiers.reduce((sum, t) => sum + t, 0) / tiers.length;

  // Map 1-5 tier scale to 0-10 score: tier × 2
  let score = avgTier * 2;

  // Bonus: 3+ distinct elite/strong verbs (tier 4-5)
  const eliteStrongCount = new Set(
    targetVerbs
      .filter(v => resolveVerbTier(v.lemma) >= 4)
      .map(v => v.lemma.toLowerCase())
  ).size;
  if (eliteStrongCount >= 3) score += 1;

  // Penalty: > 50% poor/weak verbs (tier 1-2)
  const weakCount = tiers.filter(t => t <= 2).length;
  if (weakCount / tiers.length > 0.5) score -= 1;

  score = clamp(round1(score), 0, 10);

  // Generate rationale
  const bestVerbs = targetVerbs
    .filter(v => resolveVerbTier(v.lemma) >= 4)
    .map(v => v.lemma)
    .slice(0, 3);
  const worstVerbs = targetVerbs
    .filter(v => resolveVerbTier(v.lemma) <= 2)
    .map(v => v.lemma)
    .slice(0, 3);

  const parts: string[] = [`${targetVerbs.length} verb(s), average tier ${round1(avgTier)}/5`];
  if (bestVerbs.length > 0) parts.push(`strong: ${bestVerbs.join(', ')}`);
  if (worstVerbs.length > 0) parts.push(`weak: ${worstVerbs.join(', ')}`);
  if (usingDomainVerbs) parts.push(`field-specific scoring: ${expertiseResult!.domainId}`);
  // Issue 7: note if "founded" was scale-adjusted
  if (targetVerbs.some(v => FOUNDING_VERBS.has(v.lemma.toLowerCase())) && foundedScaleMultiplier < 1.0) {
    parts.push(`"founded" scale-adjusted (×${foundedScaleMultiplier}): ${foundedScaleMultiplier <= 0.6 ? 'small scale' : 'moderate/unknown scale'}`);
  }

  const rationale = `Action Precision scored ${score}/10: ${parts.join('; ')}.`;

  return { score, maxScore: 10, rationale };
}

/**
 * D. Score Quantification — Are numbers used meaningfully?
 *
 * Rewards meaningful numbers with context, penalizes vanity metrics.
 *
 * SIGNIFICANCE SCALING (Issue 10): Not all numbers are equally impressive.
 * Percentages (retention rate, improvement %) are more significant than
 * small absolute counts. Large numbers (1000+ people, $10K+) are more
 * significant than small ones. This prevents "8 students" from getting
 * the same quantification bonus as "89% retention rate".
 */
function scoreQuantification(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
  const meaningful = features.numbers.filter(n => n.isMeaningful);
  const vanity = features.numbers.filter(n => !n.isMeaningful);
  const meaningfulWithContext = meaningful.filter(n => n.hasContext);

  // Issue 10: Calculate weighted meaningful count using significance multipliers
  // Instead of raw count, use significance-weighted count
  const weightedMeaningfulWithContext = meaningfulWithContext.reduce(
    (sum, n) => sum + getQuantificationSignificance(n), 0
  );
  const weightedMeaningful = meaningful.reduce(
    (sum, n) => sum + getQuantificationSignificance(n), 0
  );

  // Base score from significance-weighted meaningful count
  let score: number;
  if (weightedMeaningfulWithContext >= 3.0) {
    score = 9 + Math.min(weightedMeaningfulWithContext - 3.0, 1); // 9-10
  } else if (weightedMeaningfulWithContext >= 2.0) {
    score = 7 + (weightedMeaningfulWithContext - 2.0); // 7-8
  } else if (weightedMeaningfulWithContext >= 1.0) {
    score = 5 + (weightedMeaningfulWithContext - 1.0); // 5-6
  } else if (weightedMeaningful >= 0.7) {
    score = 3 + Math.min(weightedMeaningful - 0.7, 1); // 3-4 (meaningful but no context)
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
    const significanceNote = weightedMeaningful !== meaningful.length
      ? ` (significance-weighted: ${round1(weightedMeaningful)})`
      : '';
    parts.push(`${meaningful.length} meaningful metric(s)${meaningfulWithContext.length > 0 ? ` (${meaningfulWithContext.length} with context)` : ''}${significanceNote}`);
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
 *
 * @param features - Extracted description features from Haiku
 * @param expertiseResult - Optional expertise match result for field-specific adjustments
 */
function scoreDescription(features: ExtractedDescriptionFeatures, expertiseResult?: ExpertiseMatchResult): DescriptionScore {
  // 1. Score all 5 dimensions
  const roleOwnershipResult = scoreRoleOwnership(features);
  const impactEvidenceResult = scoreImpactEvidence(features);
  const actionPrecisionResult = scoreActionPrecision(features, expertiseResult);
  const quantificationResult = scoreQuantification(features);
  const differentiationResult = scoreDifferentiation(features);

  // 1b. Apply expertise-based adjustments to differentiation (authenticity signal)
  if (expertiseResult && expertiseResult.confidence !== 'low') {
    const adj = expertiseResult.assessment.scoringAdjustments;

    // Differentiation adjustment: real expertise signals boost, name-drops reduce
    if (adj.differentiationModifier !== 0) {
      differentiationResult.score = clamp(
        round1(differentiationResult.score + adj.differentiationModifier),
        0, 10,
      );
      differentiationResult.rationale += ` [Expertise: ${adj.differentiationModifier > 0 ? '+' : ''}${adj.differentiationModifier.toFixed(2)}, ${expertiseResult.detectedSignals.length} signals, ${expertiseResult.detectedTraps.length} traps]`;
    }

    // Specificity adjustment: field-specific precision signals
    if (adj.specificityModifier !== 0) {
      roleOwnershipResult.score = clamp(
        round1(roleOwnershipResult.score + adj.specificityModifier),
        0, 10,
      );
      roleOwnershipResult.rationale += ` [Expertise specificity: ${adj.specificityModifier > 0 ? '+' : ''}${adj.specificityModifier.toFixed(2)}]`;
    }
  }

  // 1c. Title-evidence gate on impact dimension (Issues 2 & 6):
  // If a leadership title is present but no leadership evidence exists,
  // cap the impact evidence score. A title doesn't create impact.
  if (containsLeadershipTitle(features) && !hasLeadershipEvidence(features)) {
    if (impactEvidenceResult.score > 5.0) {
      impactEvidenceResult.score = clamp(round1(Math.min(impactEvidenceResult.score, 5.0)), 0, 10);
      impactEvidenceResult.rationale += ' [Title-evidence gate: impact capped — title present without demonstrated leadership impact]';
    }
  }

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
   *
   * @param features - Extracted description features from Haiku
   * @param expertiseResult - Optional expertise match result for field-specific adjustments
   */
  scoreDescription(features: ExtractedDescriptionFeatures, expertiseResult?: ExpertiseMatchResult): DescriptionScore {
    return scoreDescription(features, expertiseResult);
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

  scoreActionPrecision(features: ExtractedDescriptionFeatures, expertiseResult?: ExpertiseMatchResult): DescriptionScoreComponent {
    return scoreActionPrecision(features, expertiseResult);
  }

  scoreQuantification(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
    return scoreQuantification(features);
  }

  scoreDifferentiation(features: ExtractedDescriptionFeatures): DescriptionScoreComponent {
    return scoreDifferentiation(features);
  }
}

export const descriptionRuleScorerService = new DescriptionRuleScorerService();
