/**
 * Activity Rule Scorer — Deterministic Activity Scoring
 *
 * Layer 3b of the cognitive decomposition architecture.
 * Takes ExtractedEvidence + TierClassification → produces ActivityScore.
 * Zero LLM calls — pure TypeScript logic.
 *
 * The 5 activity components:
 * 1. Tier Assessment (30%) — Sara Harberson tier classification
 * 2. Recognition Level (25%) — External validation and awards
 * 3. Leadership & Impact (12.5%) — Role and quantifiable change (conditional)
 * 4. Community & Character (15%) — Character traits and community value
 * 5. Commitment & Progression (17.5%) — Time invested and growth
 *
 * STRUCTURAL GUARANTEE: Component scores are clamped to tier constraints.
 * Total score is clamped to tier score range.
 * A Tier 4 activity scores 4.0-5.4, period.
 *
 * Cost: $0.00 (pure TypeScript logic)
 * Latency: <1ms
 */

import type {
  ExtractedEvidence,
  TierClassification,
  ActivityScore,
  ActivityScoreBreakdown,
  TierAssessmentComponent,
  RecognitionComponent,
  LeadershipComponent,
  CommunityCharacterComponent,
  CommitmentComponent,
  ComparisonBenchmarks,
} from './types';
import {
  STANDARD_WEIGHTS,
  NO_LEADERSHIP_WEIGHTS,
  RECOGNITION_SCOPE_SCORES,
  ROLE_HIERARCHY_SCORES,
  IMPACT_SCOPE_SCORES,
  COMMUNITY_BENEFIT_SCORES,
  AUTHENTICITY_SIGNAL_SCORES,
  CHARACTER_TRAIT_BASE_SCORES,
} from './scoringRules';

// ============================================================================
// HOURS CONTEXT CATEGORIES (Issue 8)
// Exact canonical category IDs from categoryRegistry.ts
// ============================================================================

/** Categories where high hours are expected (paid/compensation) — weaker commitment signal */
const PAID_WORK_CATEGORIES = new Set([
  'work_family',       // Jobs, internships, family responsibilities
]);

/** Categories where high hours signal exceptional commitment — strongest signal */
const INTELLECTUAL_CATEGORIES = new Set([
  'stem_research',       // Lab research, data science
  'stem_competition',    // Math/science olympiads (prep-intensive)
  'medical_health',      // Clinical research, health studies
  'academic_enrichment', // Independent study, humanities research
  'writing_journalism',  // Investigative writing, literary work
  'performing_arts',     // Music practice, theater rehearsal
  'visual_arts',         // Studio art, design portfolio
  'technology',          // Coding projects, robotics
]);

// All other categories (community_service, leadership_government, debate_speech,
// athletics, entrepreneurship, social_activism, etc.) use the default 1.0x multiplier.

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

/** Clamp a component score to its tier constraint range */
function clampToConstraint(score: number, range: { min: number; max: number }): number {
  return clamp(round1(score), range.min, range.max);
}

/** Downgrade impact quality by one level (used when validation flags fire) */
function downgradeImpactQuality(
  quality: ExtractedEvidence['impact']['impactQuality']
): ExtractedEvidence['impact']['impactQuality'] {
  switch (quality) {
    case 'verified_significant': return 'verified_modest';
    case 'verified_modest': return 'claimed_vague';
    case 'claimed_vague': return 'claimed_none';
    case 'claimed_none': return 'claimed_none';
  }
}

// ============================================================================
// COMPONENT SCORERS
// ============================================================================

/**
 * A. Score Tier Assessment
 *
 * The tier score comes directly from the tier classifier's deterministic output.
 * This wraps it into the ActivityScoreComponent shape with appropriate weight.
 */
function scoreTierAssessment(
  tier: TierClassification,
  weight: number
): TierAssessmentComponent {
  const score = round1(tier.tierScore);
  return {
    score,
    maxScore: 10,
    weight,
    weightedScore: round1(score * weight),
    rationale: `Tier Assessment: ${tier.reasoning}`,
    tier: tier.externalTier,
  };
}

/**
 * B. Score Recognition Level
 *
 * Based on the highest recognition scope, with bonuses for multiple
 * recognitions and verifiability.
 */
function scoreRecognition(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  weight: number
): RecognitionComponent {
  const { recognitions } = evidence;

  // No recognitions → score 1, level 'none'
  if (recognitions.length === 0) {
    const score = clampToConstraint(1, tier.componentConstraints.recognition);
    return {
      score,
      maxScore: 10,
      weight,
      weightedScore: round1(score * weight),
      rationale: 'Recognition scored: no external recognition mentioned.',
      level: 'none',
    };
  }

  // Find highest-level recognition
  const levelOrder = ['international', 'national', 'state', 'regional', 'school', 'local'] as const;
  let highestLevel: typeof levelOrder[number] = 'local';
  for (const level of levelOrder) {
    if (recognitions.some(r => r.level === level)) {
      highestLevel = level;
      break;
    }
  }

  // Base score from highest level
  let score = RECOGNITION_SCOPE_SCORES[highestLevel] ?? 1;

  // Bonus: +0.5 per additional recognition at same or higher level (cap +1.5)
  const highestIdx = levelOrder.indexOf(highestLevel);
  const additionalHighLevel = recognitions.filter(r => {
    const rIdx = levelOrder.indexOf(r.level as typeof levelOrder[number]);
    return rIdx >= 0 && rIdx <= highestIdx;
  }).length - 1; // subtract 1 for the "first" one
  score += Math.min(additionalHighLevel * 0.5, 1.5);

  // Bonus: +1 if any recognition is verifiable with selectivity context
  if (recognitions.some(r => r.isVerifiable && r.selectivityContext != null)) {
    score += 1;
  }

  // Penalty: -1 if highest recognition is NOT verifiable
  const highestRec = recognitions.find(r => r.level === highestLevel);
  if (highestRec && !highestRec.isVerifiable) {
    score -= 1;
  }

  score = clampToConstraint(score, tier.componentConstraints.recognition);

  // Rationale
  const parts: string[] = [];
  parts.push(`highest recognition: ${highestLevel}`);
  if (additionalHighLevel > 0) parts.push(`${additionalHighLevel} additional high-level recognition(s)`);
  if (highestRec && !highestRec.isVerifiable) parts.push('highest recognition is not verifiable');

  return {
    score,
    maxScore: 10,
    weight,
    weightedScore: round1(score * weight),
    rationale: `Recognition scored ${score}/10: ${parts.join('; ')}.`,
    level: highestLevel as RecognitionComponent['level'],
  };
}

/**
 * C. Score Leadership & Impact
 *
 * Conditional component — returns N/A for solo/individual activities.
 * Based on role hierarchy + impact scope + quantified outcomes.
 */
function scoreLeadership(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  weight: number
): LeadershipComponent {
  // N/A for activities where leadership isn't applicable
  if (!evidence.role.isLeadershipApplicable) {
    return {
      score: 0,
      maxScore: 10,
      weight: 0,
      weightedScore: 0,
      rationale: 'Leadership N/A: individual activity without team/org component.',
      isApplicable: false,
      role: 'not_applicable',
      impactScope: 'not_applicable',
    };
  }

  // Base score from role hierarchy
  let score = ROLE_HIERARCHY_SCORES[evidence.role.type] ?? 1.5;

  // Impact scope modifier: scale 0-10, then compress to +0-2 bonus
  const scopeLevel = evidence.scope.level;
  let impactScopeScore = IMPACT_SCOPE_SCORES[scopeLevel] ?? IMPACT_SCOPE_SCORES['individual'] ?? 2;
  // Reduce scope confidence when scope-commitment mismatch detected
  if (evidence.validationFlags?.scopeCommitmentMismatch) {
    impactScopeScore = Math.max(0, impactScopeScore - 3);
  }
  score += (impactScopeScore / 10) * 2;

  // Bonus: graduated by impact quality
  if (evidence.impact.hasQuantifiedOutcomes && evidence.impact.metrics.some(m => m.isVerifiable)) {
    const effectiveQuality = evidence.validationFlags?.impactCredibilityIssue
      ? downgradeImpactQuality(evidence.impact.impactQuality)
      : evidence.impact.impactQuality;
    switch (effectiveQuality) {
      case 'verified_significant': score += 1.5; break;
      case 'verified_modest': score += 1.0; break;
      case 'claimed_vague': score += 0.0; break;
      case 'claimed_none': score += 0.0; break;
    }
  }

  // Bonus: +0.5 if estimated people reached >= 50
  if ((evidence.impact.estimatedPeopleReached ?? 0) >= 50) {
    score += 0.5;
  }

  score = clampToConstraint(score, tier.componentConstraints.leadership);

  // Map scope level to impact scope
  const impactScope = mapScopeToImpactScope(evidence.scope.level);

  // Rationale
  const parts: string[] = [];
  parts.push(`role: ${evidence.role.type}`);
  parts.push(`scope: ${evidence.scope.level}`);
  if (evidence.impact.hasQuantifiedOutcomes) parts.push('has quantified outcomes');
  if ((evidence.impact.estimatedPeopleReached ?? 0) > 0) {
    parts.push(`~${evidence.impact.estimatedPeopleReached} people reached`);
  }

  return {
    score,
    maxScore: 10,
    weight,
    weightedScore: round1(score * weight),
    rationale: `Leadership scored ${score}/10: ${parts.join('; ')}.`,
    isApplicable: true,
    role: evidence.role.type,
    impactScope,
  };
}

/** Map scope level to LeadershipComponent.impactScope */
function mapScopeToImpactScope(
  level: ExtractedEvidence['scope']['level']
): LeadershipComponent['impactScope'] {
  switch (level) {
    case 'national':
    case 'international':
      return 'national';
    case 'state':
    case 'regional':
      return 'regional';
    case 'local':
      return 'community';
    case 'school':
      return 'organization';
    default:
      return 'individual';
  }
}

/**
 * D. Score Community & Character
 *
 * Based on character trait, community benefit level, and authenticity signals.
 * Always applicable — every activity reveals something about character.
 */
function scoreCommunityCharacter(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  weight: number
): CommunityCharacterComponent {
  const { primaryTrait, communityBenefit, authenticitySignals, paddingSignals } = evidence.character;

  // Start with character trait base score
  let score = CHARACTER_TRAIT_BASE_SCORES[primaryTrait] ?? 6;

  // Add community benefit contribution (scaled to +0-2.7 range)
  const benefitScore = COMMUNITY_BENEFIT_SCORES[communityBenefit] ?? 3.5;
  score += (benefitScore / 10) * 3;

  // Determine authenticity level and apply modifier
  let authenticityLevel: CommunityCharacterComponent['authenticitySignal'];
  if (authenticitySignals.length > 0 && paddingSignals.length === 0) {
    authenticityLevel = 'highly_authentic';
  } else if (authenticitySignals.length > 0) {
    authenticityLevel = 'genuine';
  } else if (paddingSignals.length > 0) {
    authenticityLevel = 'resume_padding';
  } else {
    authenticityLevel = 'neutral';
  }

  score += AUTHENTICITY_SIGNAL_SCORES[authenticityLevel];

  score = clampToConstraint(score, tier.componentConstraints.community);

  // Rationale
  const parts: string[] = [];
  parts.push(`trait: ${primaryTrait}`);
  parts.push(`community benefit: ${communityBenefit}`);
  parts.push(`authenticity: ${authenticityLevel}`);
  if (authenticitySignals.length > 0) parts.push(`${authenticitySignals.length} authenticity signal(s)`);
  if (paddingSignals.length > 0) parts.push(`${paddingSignals.length} padding signal(s)`);

  return {
    score,
    maxScore: 10,
    weight,
    weightedScore: round1(score * weight),
    rationale: `Community & Character scored ${score}/10: ${parts.join('; ')}.`,
    primaryTrait,
    communityBenefit,
    authenticitySignal: authenticityLevel,
  };
}

/**
 * E. Score Commitment & Progression
 *
 * Based on years active, progression, hours intensity, and sustained engagement.
 *
 * HOURS CONTEXT-AWARENESS (Issue 8): Hours per week are weighted by activity context.
 * 20hr/wk at a paid job (expected) is a weaker commitment signal than
 * 20hr/wk in a voluntary research lab (exceptional). The multiplier:
 *   - Paid work (employment, job): 0.5x — high hours expected for compensation
 *   - Voluntary work (volunteering, club): 1.0x — baseline commitment signal
 *   - Intellectual/creative work (research, writing, art, music): 1.2x — strongest signal
 */
function scoreCommitment(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  weight: number
): CommitmentComponent {
  const { yearsActive, hoursPerWeek, weeksPerYear, showsProgression, progressionArc, sustainedThroughJunior } = evidence.commitment;

  // Years base score
  let score: number;
  if (yearsActive >= 4) {
    score = 9 + Math.min(yearsActive - 4, 1); // 9-10
  } else if (yearsActive >= 3) {
    score = 7 + (yearsActive - 3); // 7-8
  } else if (yearsActive >= 2) {
    score = 5 + (yearsActive - 2); // 5-6
  } else if (yearsActive >= 1) {
    score = 3 + (yearsActive - 1); // 3-4
  } else {
    score = 1 + Math.min(yearsActive, 1); // 1-2
  }

  // Progression bonus
  if (showsProgression) score += 1;
  if (progressionArc) score += 0.5;

  // Validation flag: cap progression bonus when commitment conflict detected
  if (evidence.validationFlags?.commitmentConflict) {
    // Cap the progression bonus at 0.5 (instead of up to 1.5)
    const progressionBonus = (showsProgression ? 1 : 0) + (progressionArc ? 0.5 : 0);
    if (progressionBonus > 0.5) {
      score -= (progressionBonus - 0.5); // Claw back excess
    }
  }

  // Issue 8: Context-aware hours intensity
  // Determine hours commitment multiplier based on activity category.
  // Uses exact canonical category IDs from categoryRegistry.ts — no substring matching.
  const category = evidence.categoryMatch.category;
  let hoursMultiplier = 1.0; // Default: voluntary/club
  let hoursContext = 'voluntary';

  // Paid work: high hours are expected (weaker signal)
  if (PAID_WORK_CATEGORIES.has(category)) {
    hoursMultiplier = 0.5;
    hoursContext = 'paid/expected';
  }
  // Intellectual/creative work: high hours are exceptional (strongest signal)
  else if (INTELLECTUAL_CATEGORIES.has(category)) {
    hoursMultiplier = 1.2;
    hoursContext = 'intellectual/creative';
  }

  // Hours intensity: weekly average across the year, with context multiplier
  const weeklyAvg = weeksPerYear > 0 ? (hoursPerWeek * weeksPerYear) / 52 : 0;
  const adjustedHoursBonus = weeklyAvg >= 20
    ? 1.0 * hoursMultiplier
    : weeklyAvg >= 10
      ? 0.5 * hoursMultiplier
      : 0;
  score += adjustedHoursBonus;

  // Sustained through junior year bonus
  if (sustainedThroughJunior) score += 0.5;

  score = clampToConstraint(score, tier.componentConstraints.commitment);

  // Rationale
  const parts: string[] = [];
  parts.push(`${yearsActive} year(s) active`);
  if (showsProgression) parts.push(`progression${progressionArc ? `: ${progressionArc}` : ''}`);
  if (hoursPerWeek > 0) {
    parts.push(`${hoursPerWeek} hrs/wk (${hoursContext}, ×${hoursMultiplier})`);
  }
  if (sustainedThroughJunior) parts.push('sustained through junior year');

  return {
    score,
    maxScore: 10,
    weight,
    weightedScore: round1(score * weight),
    rationale: `Commitment scored ${score}/10: ${parts.join('; ')}.`,
    years: yearsActive,
    showsProgression,
    sustainedThroughJunior,
  };
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Score an activity deterministically from extracted evidence and tier classification.
 *
 * Produces exactly the same `ActivityScore` shape as the LLM-powered scorer.
 * The total score is CLAMPED to the tier's score range — this is the structural guarantee.
 */
function scoreActivity(evidence: ExtractedEvidence, tier: TierClassification): ActivityScore {
  // 1. Determine if leadership is applicable
  const leadershipApplicable = evidence.role.isLeadershipApplicable;

  // 2. Select weight config
  const weightConfig = leadershipApplicable ? STANDARD_WEIGHTS : NO_LEADERSHIP_WEIGHTS;

  // 3. Score all 5 components
  const tierAssessment = scoreTierAssessment(tier, weightConfig.tier);
  const recognitionLevel = scoreRecognition(evidence, tier, weightConfig.recognition);
  const leadershipImpact = scoreLeadership(evidence, tier, leadershipApplicable ? weightConfig.leadership : 0);
  const communityCharacter = scoreCommunityCharacter(evidence, tier, weightConfig.community);
  const commitmentProgression = scoreCommitment(evidence, tier, weightConfig.commitment);

  // 4. Calculate weighted total
  const rawTotal =
    tierAssessment.weightedScore +
    recognitionLevel.weightedScore +
    leadershipImpact.weightedScore +
    communityCharacter.weightedScore +
    commitmentProgression.weightedScore;

  // 5. Clamp total to tier's score range (structural guarantee)
  const total = clamp(round1(rawTotal), tier.scoreRange.min, tier.scoreRange.max);

  // 6. Build breakdown
  const breakdown: ActivityScoreBreakdown = {
    tierAssessment,
    recognitionLevel,
    leadershipImpact,
    communityCharacter,
    commitmentProgression,
    weightConfig: {
      tierWeight: weightConfig.tier,
      recognitionWeight: weightConfig.recognition,
      leadershipWeight: leadershipApplicable ? weightConfig.leadership : 0,
      communityWeight: weightConfig.community,
      commitmentWeight: weightConfig.commitment,
      leadershipApplicable,
    },
  };

  // 7. Generate tier justification
  const tierJustification = tier.reasoning;

  // 8. Generate comparison benchmarks (placeholder — enriched in Layer 4 integration)
  const comparisonBenchmarks: ComparisonBenchmarks = {
    similarTo: `Activities at Tier ${tier.internalTier} level typically demonstrate similar patterns.`,
    above: `To move up, look at Tier ${Math.max(1, tier.internalTier - 1)} activities for inspiration.`,
    below: `This surpasses typical Tier ${Math.min(6, tier.internalTier + 1)} activities.`,
  };

  // 9. Generate improvement paths from lowest 2 component scores
  const componentScores = [
    { name: 'Recognition', score: recognitionLevel.score },
    { name: 'Community & Character', score: communityCharacter.score },
    { name: 'Commitment', score: commitmentProgression.score },
  ];
  if (leadershipApplicable) {
    componentScores.push({ name: 'Leadership', score: leadershipImpact.score });
  }
  const sortedComponents = [...componentScores].sort((a, b) => a.score - b.score);
  const improvementPaths = sortedComponents
    .slice(0, 2)
    .map(c => `${c.name} (${c.score}/10): improving this area would have the most impact on overall score.`);

  // 10. Generate overall rationale
  const overallRationale =
    `Activity scored ${total}/10 (Tier ${tier.internalTier} — ${tier.scoreRange.min}-${tier.scoreRange.max} range). ` +
    `Components: Tier ${tierAssessment.score}, Recognition ${recognitionLevel.score}, ` +
    `${leadershipApplicable ? `Leadership ${leadershipImpact.score}, ` : ''}` +
    `Community ${communityCharacter.score}, Commitment ${commitmentProgression.score}. ` +
    `Confidence: ${tier.confidence}.`;

  return {
    total,
    breakdown,
    tierJustification,
    comparisonBenchmarks,
    improvementPaths,
    overallRationale,
  };
}

// ============================================================================
// SERVICE CLASS (singleton pattern per codebase convention)
// ============================================================================

export class ActivityRuleScorerService {
  /**
   * Score an activity deterministically from extracted evidence and tier classification.
   * Produces the same ActivityScore shape as the LLM-powered scorer.
   */
  scoreActivity(evidence: ExtractedEvidence, tier: TierClassification): ActivityScore {
    return scoreActivity(evidence, tier);
  }

  /**
   * Score individual components (exposed for unit testing).
   */
  scoreTierAssessment(tier: TierClassification, weight: number): TierAssessmentComponent {
    return scoreTierAssessment(tier, weight);
  }

  scoreRecognition(evidence: ExtractedEvidence, tier: TierClassification, weight: number): RecognitionComponent {
    return scoreRecognition(evidence, tier, weight);
  }

  scoreLeadership(evidence: ExtractedEvidence, tier: TierClassification, weight: number): LeadershipComponent {
    return scoreLeadership(evidence, tier, weight);
  }

  scoreCommunityCharacter(evidence: ExtractedEvidence, tier: TierClassification, weight: number): CommunityCharacterComponent {
    return scoreCommunityCharacter(evidence, tier, weight);
  }

  scoreCommitment(evidence: ExtractedEvidence, tier: TierClassification, weight: number): CommitmentComponent {
    return scoreCommitment(evidence, tier, weight);
  }
}

export const activityRuleScorerService = new ActivityRuleScorerService();
