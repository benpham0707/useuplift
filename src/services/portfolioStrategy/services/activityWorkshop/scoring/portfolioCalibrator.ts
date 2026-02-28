/**
 * Portfolio Calibrator — Phase 4 of the Decomposed Scoring Architecture
 *
 * Enforces cross-activity consistency AFTER individual scoring.
 * Pure TypeScript logic, no LLM, $0.00 cost, <1ms latency.
 *
 * Four calibration rules applied in sequence:
 * 1. Evidence Consistency — hard invariants between evidence and component scores
 * 2. Relative Ordering — higher-tier activities MUST score higher
 * 3. Minimum Spread — prevent score clustering (all 5-6)
 * 4. Major Relevance Annotation — tag activities for downstream portfolio scoring
 *
 * The calibrator NEVER changes tier assignments. It adjusts scores WITHIN
 * tier ranges to enforce portfolio-level invariants that per-activity
 * scoring cannot guarantee.
 */

import type {
  ActivityScore,
  ActivityScoreRubric,
  InternalTier,
  TierClassification,
  ExtractedEvidence,
} from './types';
import { TIER_SCORE_RANGES, TIER_COMPONENT_CONSTRAINTS } from './types';
import { getMajorAlignment, getMajorRelevanceCategory } from './expertiseSignaling/majorAlignmentMatrix';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Input for portfolio calibration.
 * Each activity comes with its score, tier classification, and extracted evidence.
 */
export interface CalibrationInput {
  activityId: string;
  activityTitle: string;
  score: ActivityScore;
  tier: TierClassification;
  evidence: ExtractedEvidence;
}

/**
 * Output from portfolio calibration.
 * Same scores but potentially adjusted, with calibration metadata.
 */
export interface CalibrationOutput {
  activityId: string;
  activityTitle: string;
  /** Score after calibration (may be unchanged) */
  score: ActivityScore;
  /** Whether any adjustments were made */
  wasAdjusted: boolean;
  /** What adjustments were made and why */
  adjustments: CalibrationAdjustment[];
  /** Major relevance annotation for downstream portfolio scoring */
  majorRelevance: MajorRelevanceAnnotation;
}

/**
 * A single calibration adjustment applied to an activity.
 */
export interface CalibrationAdjustment {
  /** Which rule triggered this adjustment */
  rule: CalibrationRule;
  /** What changed */
  field: string;
  /** Previous value */
  from: number;
  /** New value */
  to: number;
  /** Why this adjustment was made */
  reason: string;
}

export type CalibrationRule =
  | 'EVIDENCE_CONSISTENCY'
  | 'RELATIVE_ORDERING'
  | 'MINIMUM_SPREAD'
  | 'TIER_RANGE_CLAMP';

/**
 * Major relevance annotation for an activity.
 */
export interface MajorRelevanceAnnotation {
  /** How relevant this activity is to the intended major */
  relevance: 'core' | 'supporting' | 'complementary' | 'unrelated';
  /** Why this relevance was assigned */
  rationale: string;
  /** Boost factor for downstream scoring [0, 1] */
  boostFactor?: number;
}

/**
 * Complete calibration result for a portfolio.
 */
export interface PortfolioCalibrationResult {
  /** Calibrated activities */
  activities: CalibrationOutput[];
  /** Summary of calibration actions */
  summary: {
    totalActivities: number;
    activitiesAdjusted: number;
    totalAdjustments: number;
    rulesApplied: CalibrationRule[];
    /** Was minimum spread enforcement needed? */
    spreadEnforced: boolean;
    /** Original score range vs calibrated range */
    originalRange: { min: number; max: number };
    calibratedRange: { min: number; max: number };
  };
}

// ============================================================================
// MAJOR RELEVANCE — via Structured Alignment Matrix
// ============================================================================
// Replaced flat keyword-based MAJOR_RELEVANCE_MAP with structured alignment
// matrix from expertiseSignaling/majorAlignmentMatrix.ts. The matrix provides:
// - 5 relevance tiers: critical | core | supporting | complementary | unrelated
// - Numeric boost factors [0, 1]
// - Admissions-informed rationale per alignment
// - ~90 major name aliases for robust matching
// See: getMajorAlignment() and getMajorRelevanceCategory() imported above

// ============================================================================
// RULE 1: EVIDENCE CONSISTENCY
// ============================================================================

/**
 * Enforce hard invariants between extracted evidence and component scores.
 * These rules override LLM output when evidence clearly contradicts scores.
 */
function enforceEvidenceConsistency(
  input: CalibrationInput
): CalibrationAdjustment[] {
  const adjustments: CalibrationAdjustment[] = [];
  const { score, evidence, tier } = input;
  const { breakdown } = score;

  // Get component constraints for this tier
  const constraints = TIER_COMPONENT_CONSTRAINTS[tier.internalTier];

  // --- Recognition consistency ---

  // No recognitions at all → recognition score capped at 3
  if (evidence.recognitions.length === 0 && breakdown.recognitionLevel.score > 3) {
    adjustments.push({
      rule: 'EVIDENCE_CONSISTENCY',
      field: 'recognitionLevel.score',
      from: breakdown.recognitionLevel.score,
      to: 3,
      reason: 'No recognitions in extracted evidence — capping recognition score at 3',
    });
    breakdown.recognitionLevel.score = 3;
  }

  // National/international recognition → recognition score at least 7
  const hasNationalRecognition = evidence.recognitions.some(
    r => (r.level === 'national' || r.level === 'international') && r.isVerifiable
  );
  if (hasNationalRecognition && breakdown.recognitionLevel.score < 7) {
    adjustments.push({
      rule: 'EVIDENCE_CONSISTENCY',
      field: 'recognitionLevel.score',
      from: breakdown.recognitionLevel.score,
      to: Math.max(7, constraints.recognition.min),
      reason: 'Verifiable national/international recognition present — floor recognition at 7',
    });
    breakdown.recognitionLevel.score = Math.max(7, constraints.recognition.min);
  }

  // --- Leadership consistency ---

  if (breakdown.leadershipImpact.isApplicable) {
    // Founder role → leadership score at least 5
    if (evidence.role.type === 'founder' && breakdown.leadershipImpact.score < 5) {
      const newScore = Math.max(5, constraints.leadership.min);
      adjustments.push({
        rule: 'EVIDENCE_CONSISTENCY',
        field: 'leadershipImpact.score',
        from: breakdown.leadershipImpact.score,
        to: newScore,
        reason: 'Founder role confirmed in evidence — floor leadership at 5',
      });
      breakdown.leadershipImpact.score = newScore;
    }

    // Passive member/participant → leadership score capped at 3
    if (
      (evidence.role.type === 'member' || evidence.role.type === 'participant') &&
      breakdown.leadershipImpact.score > 3
    ) {
      adjustments.push({
        rule: 'EVIDENCE_CONSISTENCY',
        field: 'leadershipImpact.score',
        from: breakdown.leadershipImpact.score,
        to: 3,
        reason: 'Passive member/participant role — capping leadership at 3',
      });
      breakdown.leadershipImpact.score = 3;
    }
  }

  // --- Community consistency ---

  // Self-focused activity → community score capped at 4
  if (evidence.character.communityBenefit === 'self-focused' && breakdown.communityCharacter.score > 4) {
    adjustments.push({
      rule: 'EVIDENCE_CONSISTENCY',
      field: 'communityCharacter.score',
      from: breakdown.communityCharacter.score,
      to: 4,
      reason: 'Activity is self-focused per evidence — capping community score at 4',
    });
    breakdown.communityCharacter.score = 4;
  }

  // Significant community benefit → community score at least 5
  if (evidence.character.communityBenefit === 'significant' && breakdown.communityCharacter.score < 5) {
    const newScore = Math.max(5, constraints.community.min);
    adjustments.push({
      rule: 'EVIDENCE_CONSISTENCY',
      field: 'communityCharacter.score',
      from: breakdown.communityCharacter.score,
      to: newScore,
      reason: 'Significant community benefit confirmed — floor community at 5',
    });
    breakdown.communityCharacter.score = newScore;
  }

  // Resume padding signals → community score capped at 3
  if (
    breakdown.communityCharacter.authenticitySignal === 'resume_padding' &&
    breakdown.communityCharacter.score > 3
  ) {
    adjustments.push({
      rule: 'EVIDENCE_CONSISTENCY',
      field: 'communityCharacter.score',
      from: breakdown.communityCharacter.score,
      to: 3,
      reason: 'Resume padding detected — capping community score at 3',
    });
    breakdown.communityCharacter.score = 3;
  }

  // --- Commitment consistency ---

  // 3+ years → commitment score at least 5
  if (evidence.commitment.yearsActive >= 3 && breakdown.commitmentProgression.score < 5) {
    const newScore = Math.max(5, constraints.commitment.min);
    adjustments.push({
      rule: 'EVIDENCE_CONSISTENCY',
      field: 'commitmentProgression.score',
      from: breakdown.commitmentProgression.score,
      to: newScore,
      reason: `${evidence.commitment.yearsActive} years of commitment — floor commitment at 5`,
    });
    breakdown.commitmentProgression.score = newScore;
  }

  // Progression arc + 3+ years → commitment score at least 6
  if (
    evidence.commitment.showsProgression &&
    evidence.commitment.yearsActive >= 3 &&
    breakdown.commitmentProgression.score < 6
  ) {
    const newScore = Math.max(6, constraints.commitment.min);
    if (newScore > breakdown.commitmentProgression.score) {
      adjustments.push({
        rule: 'EVIDENCE_CONSISTENCY',
        field: 'commitmentProgression.score',
        from: breakdown.commitmentProgression.score,
        to: newScore,
        reason: `${evidence.commitment.yearsActive} years with progression arc — floor commitment at 6`,
      });
      breakdown.commitmentProgression.score = newScore;
    }
  }

  return adjustments;
}

// ============================================================================
// RULE 2: RELATIVE ORDERING
// ============================================================================

/**
 * Enforce that higher-tier activities score higher than lower-tier activities.
 * Within the same tier, activities with stronger signals score higher.
 *
 * When intendedMajor is provided, major-relevant activities get priority
 * within the same tier.
 */
function enforceRelativeOrdering(
  inputs: CalibrationInput[],
  intendedMajor?: string
): CalibrationAdjustment[] {
  const adjustments: CalibrationAdjustment[] = [];
  if (inputs.length < 2) return adjustments;

  // Sort by tier (ascending = better tier first), then by signal count
  const sorted = [...inputs].sort((a, b) => {
    // Primary: tier (lower = better)
    if (a.tier.internalTier !== b.tier.internalTier) {
      return a.tier.internalTier - b.tier.internalTier;
    }
    // Secondary: signal count (more = better)
    const aSignals = a.tier.signals.filter(s => s.matched).length;
    const bSignals = b.tier.signals.filter(s => s.matched).length;
    if (aSignals !== bSignals) return bSignals - aSignals;
    // Tertiary: major relevance (if applicable)
    if (intendedMajor) {
      const aRelevance = computeMajorRelevance(a, intendedMajor);
      const bRelevance = computeMajorRelevance(b, intendedMajor);
      const relevanceOrder: Record<string, number> = { core: 0, supporting: 1, complementary: 2, unrelated: 3 };
      return (relevanceOrder[aRelevance] ?? 3) - (relevanceOrder[bRelevance] ?? 3);
    }
    return 0;
  });

  // Walk sorted list and fix ordering violations
  const MIN_GAP_BETWEEN_TIERS = 0.3;

  for (let i = 0; i < sorted.length - 1; i++) {
    const better = sorted[i];
    const worse = sorted[i + 1];

    // Skip if same tier — ordering within same tier isn't strictly required
    if (better.tier.internalTier === worse.tier.internalTier) continue;

    // If higher-tier activity scores LOWER than lower-tier activity, fix it
    if (better.score.total <= worse.score.total) {
      const betterRange = TIER_SCORE_RANGES[better.tier.internalTier];
      const worseRange = TIER_SCORE_RANGES[worse.tier.internalTier];

      // Push the worse activity DOWN within its range
      const worseNewTotal = Math.max(
        worseRange.min,
        Math.min(worse.score.total, betterRange.min - MIN_GAP_BETWEEN_TIERS)
      );

      if (worseNewTotal !== worse.score.total) {
        adjustments.push({
          rule: 'RELATIVE_ORDERING',
          field: 'total',
          from: worse.score.total,
          to: worseNewTotal,
          reason: `"${worse.activityTitle}" (Tier ${worse.tier.internalTier}) scored ${worse.score.total} >= "${better.activityTitle}" (Tier ${better.tier.internalTier}) at ${better.score.total}. Adjusted to ${worseNewTotal} to enforce tier ordering.`,
        });
        worse.score.total = worseNewTotal;
      }

      // If still violated, push the better activity UP within its range
      if (better.score.total <= worseNewTotal + MIN_GAP_BETWEEN_TIERS) {
        const betterNewTotal = Math.min(
          betterRange.max,
          Math.max(better.score.total, worseNewTotal + MIN_GAP_BETWEEN_TIERS)
        );
        if (betterNewTotal !== better.score.total) {
          adjustments.push({
            rule: 'RELATIVE_ORDERING',
            field: 'total',
            from: better.score.total,
            to: betterNewTotal,
            reason: `"${better.activityTitle}" (Tier ${better.tier.internalTier}) pushed up to ${betterNewTotal} to maintain ${MIN_GAP_BETWEEN_TIERS} gap above "${worse.activityTitle}".`,
          });
          better.score.total = betterNewTotal;
        }
      }
    }

    // Enforce minimum gap between different tiers
    if (
      better.tier.internalTier !== worse.tier.internalTier &&
      better.score.total - worse.score.total < MIN_GAP_BETWEEN_TIERS
    ) {
      const worseRange = TIER_SCORE_RANGES[worse.tier.internalTier];
      const betterRange = TIER_SCORE_RANGES[better.tier.internalTier];

      // Try to widen the gap by pushing worse down
      const target = better.score.total - MIN_GAP_BETWEEN_TIERS;
      if (target >= worseRange.min && target < worse.score.total) {
        adjustments.push({
          rule: 'RELATIVE_ORDERING',
          field: 'total',
          from: worse.score.total,
          to: target,
          reason: `Gap between "${better.activityTitle}" (${better.score.total}) and "${worse.activityTitle}" (${worse.score.total}) is < ${MIN_GAP_BETWEEN_TIERS}. Widened by adjusting worse down to ${target}.`,
        });
        worse.score.total = target;
      } else {
        // Push better up instead
        const betterTarget = worse.score.total + MIN_GAP_BETWEEN_TIERS;
        if (betterTarget <= betterRange.max && betterTarget > better.score.total) {
          adjustments.push({
            rule: 'RELATIVE_ORDERING',
            field: 'total',
            from: better.score.total,
            to: betterTarget,
            reason: `Gap too small. Pushed "${better.activityTitle}" up from ${better.score.total} to ${betterTarget}.`,
          });
          better.score.total = betterTarget;
        }
      }
    }
  }

  return adjustments;
}

// ============================================================================
// RULE 3: MINIMUM SPREAD
// ============================================================================

/**
 * Enforce minimum score spread across the portfolio.
 * If all scores cluster within ±1.0, scale outward to ±2.0 minimum.
 * Preserves relative ordering and tier range constraints.
 */
function enforceMinimumSpread(
  inputs: CalibrationInput[]
): CalibrationAdjustment[] {
  const adjustments: CalibrationAdjustment[] = [];
  if (inputs.length < 3) return adjustments; // Need 3+ activities for spread

  const scores = inputs.map(i => i.score.total);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore;

  const MINIMUM_SPREAD = 2.0;

  if (range >= MINIMUM_SPREAD) return adjustments; // Spread is adequate

  // Compute the median as the anchor point
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median = sortedScores[Math.floor(sortedScores.length / 2)];

  // Scale factor needed to reach minimum spread
  // Current range → minimum spread
  const scaleFactor = range > 0.01 ? MINIMUM_SPREAD / range : 1;

  for (const input of inputs) {
    const original = input.score.total;
    const tierRange = TIER_SCORE_RANGES[input.tier.internalTier];

    // Scale outward from median
    let scaled = median + (original - median) * scaleFactor;

    // Clamp to tier range
    scaled = Math.max(tierRange.min, Math.min(tierRange.max, scaled));

    // Round to 1 decimal
    scaled = Math.round(scaled * 10) / 10;

    if (scaled !== original) {
      adjustments.push({
        rule: 'MINIMUM_SPREAD',
        field: 'total',
        from: original,
        to: scaled,
        reason: `Score spread was ${range.toFixed(1)} (< ${MINIMUM_SPREAD} minimum). Scaled from median ${median.toFixed(1)}: ${original.toFixed(1)} → ${scaled.toFixed(1)}.`,
      });
      input.score.total = scaled;
    }
  }

  return adjustments;
}

// ============================================================================
// RULE 4: MAJOR RELEVANCE ANNOTATION
// ============================================================================

/**
 * Compute major relevance for a single activity.
 * Does NOT change scores — provides metadata for downstream portfolio scoring.
 *
 * Uses the impressiveness calibration alignment matrix (30 majors x 12 domains)
 * with fallback to keyword-based matching for unmatched majors.
 */
function computeMajorRelevance(
  input: CalibrationInput,
  intendedMajor?: string
): 'core' | 'supporting' | 'complementary' | 'unrelated' {
  if (!intendedMajor) return 'unrelated';

  // Use structured alignment matrix (15 majors x 12 domains, ~90 aliases)
  const domainId = input.evidence.categoryMatch.category;
  const alignment = getMajorAlignment(domainId, intendedMajor);

  // Map critical → core for backward compatibility with callers expecting 4 values
  if (alignment.relevance === 'critical') return 'core';
  return alignment.relevance;
}

/**
 * Annotate all activities with major relevance.
 * Uses the structured alignment matrix for rich rationale and boost factors.
 */
function annotateMajorRelevance(
  inputs: CalibrationInput[],
  intendedMajor?: string
): MajorRelevanceAnnotation[] {
  return inputs.map(input => {
    if (!intendedMajor) {
      return { relevance: 'unrelated' as const, rationale: 'No intended major specified' };
    }

    const domainId = input.evidence.categoryMatch.category;
    const alignment = getMajorAlignment(domainId, intendedMajor);

    // Map critical → core for backward compatibility
    const relevance = alignment.relevance === 'critical' ? 'core' as const : alignment.relevance;

    return {
      relevance,
      rationale: alignment.rationale,
      boostFactor: alignment.boostFactor,
    };
  });
}

// ============================================================================
// TIER RANGE CLAMPING
// ============================================================================

/**
 * Clamp the total score to its tier range as a final safety net.
 * This should be a no-op if earlier phases respected constraints,
 * but guarantees structural correctness.
 */
function clampToTierRanges(
  inputs: CalibrationInput[]
): CalibrationAdjustment[] {
  const adjustments: CalibrationAdjustment[] = [];

  for (const input of inputs) {
    const range = TIER_SCORE_RANGES[input.tier.internalTier];
    const original = input.score.total;

    if (original < range.min) {
      adjustments.push({
        rule: 'TIER_RANGE_CLAMP',
        field: 'total',
        from: original,
        to: range.min,
        reason: `Score ${original} below tier ${input.tier.internalTier} minimum ${range.min}. Clamped.`,
      });
      input.score.total = range.min;
    } else if (original > range.max) {
      adjustments.push({
        rule: 'TIER_RANGE_CLAMP',
        field: 'total',
        from: original,
        to: range.max,
        reason: `Score ${original} above tier ${input.tier.internalTier} maximum ${range.max}. Clamped.`,
      });
      input.score.total = range.max;
    }
  }

  return adjustments;
}

// ============================================================================
// TOTAL RECALCULATION
// ============================================================================

/**
 * Recalculate the weighted total from component scores.
 * Called after evidence consistency adjustments change individual components.
 */
function recalculateTotal(score: ActivityScore, tier: TierClassification): void {
  const { breakdown } = score;
  const config = breakdown.weightConfig;

  // Recalculate weighted scores for each component
  breakdown.tierAssessment.weightedScore = breakdown.tierAssessment.score * config.tierWeight;
  breakdown.recognitionLevel.weightedScore = breakdown.recognitionLevel.score * config.recognitionWeight;
  breakdown.leadershipImpact.weightedScore = breakdown.leadershipImpact.score * config.leadershipWeight;
  breakdown.communityCharacter.weightedScore = breakdown.communityCharacter.score * config.communityWeight;
  breakdown.commitmentProgression.weightedScore = breakdown.commitmentProgression.score * config.commitmentWeight;

  // Sum weighted scores
  const rawTotal =
    breakdown.tierAssessment.weightedScore +
    breakdown.recognitionLevel.weightedScore +
    breakdown.leadershipImpact.weightedScore +
    breakdown.communityCharacter.weightedScore +
    breakdown.commitmentProgression.weightedScore;

  // Clamp to tier range
  const range = TIER_SCORE_RANGES[tier.internalTier];
  score.total = Math.round(
    Math.max(range.min, Math.min(range.max, rawTotal)) * 10
  ) / 10;
}

// ============================================================================
// MAIN CALIBRATION FUNCTION
// ============================================================================

/**
 * Calibrate a portfolio of activity scores for cross-activity consistency.
 *
 * Applies rules in sequence:
 * 1. Evidence consistency (per-activity, may adjust components)
 * 2. Recalculate totals after component adjustments
 * 3. Tier range clamping (safety net)
 * 4. Relative ordering (cross-activity)
 * 5. Minimum spread (cross-activity)
 * 6. Final tier range clamping (safety net after spread/ordering)
 * 7. Major relevance annotation (metadata only)
 *
 * @param inputs - Activities with scores, tiers, and evidence
 * @param intendedMajor - Student's intended major (optional)
 * @returns Calibrated scores with adjustment metadata
 */
export function calibratePortfolio(
  inputs: CalibrationInput[],
  intendedMajor?: string
): PortfolioCalibrationResult {
  if (inputs.length === 0) {
    return {
      activities: [],
      summary: {
        totalActivities: 0,
        activitiesAdjusted: 0,
        totalAdjustments: 0,
        rulesApplied: [],
        spreadEnforced: false,
        originalRange: { min: 0, max: 0 },
        calibratedRange: { min: 0, max: 0 },
      },
    };
  }

  // Capture original scores for summary
  const originalScores = inputs.map(i => i.score.total);
  const originalMin = Math.min(...originalScores);
  const originalMax = Math.max(...originalScores);

  // Track all adjustments per activity
  const adjustmentMap = new Map<string, CalibrationAdjustment[]>();
  for (const input of inputs) {
    adjustmentMap.set(input.activityId, []);
  }

  // --- Rule 1: Evidence Consistency ---
  for (const input of inputs) {
    const adjs = enforceEvidenceConsistency(input);
    if (adjs.length > 0) {
      adjustmentMap.get(input.activityId)!.push(...adjs);
      // Recalculate total after component changes
      recalculateTotal(input.score, input.tier);
    }
  }

  // --- Rule: Tier Range Clamping (after consistency) ---
  const clampAdjs1 = clampToTierRanges(inputs);
  for (const adj of clampAdjs1) {
    const matchingInput = inputs.find(i => i.score.total === adj.to || i.activityTitle.includes(adj.reason));
    // Distribute clamp adjustments to the right activity
    for (const input of inputs) {
      if (adj.from !== input.score.total && adj.to === input.score.total) {
        adjustmentMap.get(input.activityId)!.push(adj);
        break;
      }
    }
  }
  // Simpler: apply clamp and track directly
  for (const input of inputs) {
    const range = TIER_SCORE_RANGES[input.tier.internalTier];
    if (input.score.total < range.min || input.score.total > range.max) {
      const clamped = Math.max(range.min, Math.min(range.max, input.score.total));
      adjustmentMap.get(input.activityId)!.push({
        rule: 'TIER_RANGE_CLAMP',
        field: 'total',
        from: input.score.total,
        to: clamped,
        reason: `Score ${input.score.total} outside tier ${input.tier.internalTier} range [${range.min}, ${range.max}]. Clamped to ${clamped}.`,
      });
      input.score.total = clamped;
    }
  }

  // --- Rule 2: Relative Ordering ---
  const orderAdjs = enforceRelativeOrdering(inputs, intendedMajor);
  for (const adj of orderAdjs) {
    // Find which activity this adjustment belongs to by matching the score change
    for (const input of inputs) {
      if (
        input.score.total === adj.to &&
        adj.reason.includes(input.activityTitle)
      ) {
        adjustmentMap.get(input.activityId)!.push(adj);
        break;
      }
    }
  }

  // --- Rule 3: Minimum Spread ---
  const spreadAdjs = enforceMinimumSpread(inputs);
  for (const adj of spreadAdjs) {
    for (const input of inputs) {
      if (input.score.total === adj.to && adj.reason.includes(String(adj.from))) {
        adjustmentMap.get(input.activityId)!.push(adj);
        break;
      }
    }
  }

  // --- Final Tier Range Clamping ---
  for (const input of inputs) {
    const range = TIER_SCORE_RANGES[input.tier.internalTier];
    if (input.score.total < range.min || input.score.total > range.max) {
      const clamped = Math.max(range.min, Math.min(range.max, input.score.total));
      adjustmentMap.get(input.activityId)!.push({
        rule: 'TIER_RANGE_CLAMP',
        field: 'total',
        from: input.score.total,
        to: clamped,
        reason: `Final clamp: ${input.score.total} → ${clamped} for tier ${input.tier.internalTier} [${range.min}, ${range.max}].`,
      });
      input.score.total = clamped;
    }
  }

  // --- Rule 4: Major Relevance Annotation ---
  const majorAnnotations = annotateMajorRelevance(inputs, intendedMajor);

  // Build output
  const activities: CalibrationOutput[] = inputs.map((input, i) => {
    const adjs = adjustmentMap.get(input.activityId) ?? [];
    return {
      activityId: input.activityId,
      activityTitle: input.activityTitle,
      score: input.score,
      wasAdjusted: adjs.length > 0,
      adjustments: adjs,
      majorRelevance: majorAnnotations[i],
    };
  });

  // Collect all unique rules applied
  const allAdjustments = activities.flatMap(a => a.adjustments);
  const rulesApplied = [...new Set(allAdjustments.map(a => a.rule))];

  const calibratedScores = inputs.map(i => i.score.total);

  return {
    activities,
    summary: {
      totalActivities: inputs.length,
      activitiesAdjusted: activities.filter(a => a.wasAdjusted).length,
      totalAdjustments: allAdjustments.length,
      rulesApplied,
      spreadEnforced: spreadAdjs.length > 0,
      originalRange: { min: originalMin, max: originalMax },
      calibratedRange: {
        min: Math.min(...calibratedScores),
        max: Math.max(...calibratedScores),
      },
    },
  };
}

// ============================================================================
// SERVICE CLASS (singleton pattern per codebase convention)
// ============================================================================

export class PortfolioCalibratorService {
  /**
   * Calibrate a portfolio of scored activities for cross-activity consistency.
   */
  calibrate(
    inputs: CalibrationInput[],
    intendedMajor?: string
  ): PortfolioCalibrationResult {
    return calibratePortfolio(inputs, intendedMajor);
  }
}

export const portfolioCalibratorService = new PortfolioCalibratorService();
