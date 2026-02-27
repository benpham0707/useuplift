/**
 * Nuance Calibration Service — Sonnet-Powered Score Adjustment
 *
 * The heart of the hybrid scoring system. Takes rule scorer output + calibration
 * context from the achievement database, calls Sonnet for focused nuance adjustment.
 *
 * Key constraints (enforced in code, NOT by the LLM):
 * - Adjusted scores MUST stay within tier.scoreRange
 * - Adjusted component scores MUST stay within tier.componentConstraints
 * - Total adjustment magnitude capped at ±1.5 from rule scorer output
 * - If Sonnet returns scores outside bounds, code clamps them
 *
 * Graceful degradation: If calibration context is low confidence (no matching
 * category), the service skips the LLM call and returns pure rule scorer output.
 *
 * Cost: ~$0.01-0.015 per activity (small focused prompt, JSON-only output)
 */

import { callClaudeWithRetry, type ClaudeCallOptions } from '../../../../../lib/llm/claude';
import { tryParseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import type { ExtractedEvidence, TierClassification, ActivityScore, DescriptionScore } from './types';
import type {
  CalibrationContext,
  NuanceCalibrationInput,
  NuanceCalibratedResult,
  CalibrationLLMResponse,
  ScoreAdjustment,
} from './nuanceCalibrationTypes';
import { getCalibrationContext } from './achievementRetrieval';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_ADJUSTMENT_MAGNITUDE = 1.5;
const MAX_COMPONENT_ADJUSTMENT = 1.5;

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Build a focused calibration prompt for Sonnet.
 * Compact (~600 tokens input) with only the data needed for nuanced adjustment.
 */
function buildCalibrationPrompt(input: NuanceCalibrationInput): string {
  const { activity, preliminaryScores, tierRange, calibration } = input;

  // Format calibration entries
  const entriesSection = calibration.calibrationEntries
    .map(e => {
      const sel = e.selectivityRatio ? ` | Selectivity: ${e.selectivityRatio}` : '';
      return `  - ${e.activity}: [${e.scoreRange[0]}-${e.scoreRange[1]}] — ${e.context}${sel}`;
    })
    .join('\n');

  // Format role hierarchy
  const rolesSection = calibration.roleHierarchy
    .map(r => `  - ${r.role}: ${r.scoreModifier >= 0 ? '+' : ''}${r.scoreModifier} (${r.context})`)
    .join('\n');

  // Format subcategory prestige
  const prestigeSection = calibration.subcategoryPrestige
    ? `${calibration.subcategoryPrestige.name} (prestige: ${calibration.subcategoryPrestige.prestigeLevel}/5 — ${calibration.subcategoryPrestige.prestigeContext})`
    : 'Unknown subcategory';

  const prompt = `You are calibrating activity scores with field-specific context.
Your job: adjust component scores WITHIN the given tier bounds to reflect nuance that deterministic rules missed.
Return ONLY adjustments where the preliminary score clearly misses context.

ACTIVITY: ${activity.title}
DESCRIPTION: ${activity.description}
${activity.position ? `POSITION: ${activity.position}` : ''}

PRELIMINARY SCORES (from deterministic rules):
- Activity total: ${preliminaryScores.activityTotal}/10 (tier range: ${tierRange.min}-${tierRange.max})
- Components: recognition ${preliminaryScores.components.recognitionScore}, leadership ${preliminaryScores.components.leadershipScore}, community ${preliminaryScores.components.communityScore}, commitment ${preliminaryScores.components.commitmentScore}

FIELD: ${calibration.categoryMatch.category} → ${prestigeSection}

CALIBRATION BENCHMARKS:
${entriesSection || '  No matching benchmarks found'}

ROLE HIERARCHY IN THIS FIELD:
${rolesSection || '  No role hierarchy available'}

${calibration.selectivityContext ? `SELECTIVITY CONTEXT: ${calibration.selectivityContext}` : ''}

RULES:
1. Only adjust components where the preliminary score clearly under- or over-values based on the calibration data
2. Each adjustment must be within the tier bounds
3. Maximum adjustment per component: ±${MAX_COMPONENT_ADJUSTMENT}
4. Return empty adjustments array if preliminary scores are already well-calibrated
5. Focus on: selectivity gradient, role nuance, subcategory prestige, progression arc

Return JSON only:
{"adjustments":[{"component":"recognition|leadership|community|commitment","adjustedScore":N,"reason":"brief reason"}]}`;

  return prompt;
}

// ============================================================================
// SCORE CLAMPING
// ============================================================================

/** Clamp a value to [min, max] */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to 1 decimal place */
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Apply adjustments to component scores, clamping to tier constraints.
 * Also caps the magnitude of any single adjustment.
 */
function applyAdjustments(
  input: NuanceCalibrationInput,
  llmAdjustments: CalibrationLLMResponse['adjustments']
): { adjustments: ScoreAdjustment[]; adjustedComponents: NuanceCalibratedResult['adjustedComponents'] } {
  const { preliminaryScores, componentConstraints } = input;
  const adjustments: ScoreAdjustment[] = [];

  // Start with original scores
  const adjusted = {
    recognitionScore: preliminaryScores.components.recognitionScore,
    leadershipScore: preliminaryScores.components.leadershipScore,
    communityScore: preliminaryScores.components.communityScore,
    commitmentScore: preliminaryScores.components.commitmentScore,
  };

  for (const adj of llmAdjustments) {
    const component = adj.component;
    let originalScore: number;
    let constraintRange: { min: number; max: number };

    switch (component) {
      case 'recognition':
        originalScore = preliminaryScores.components.recognitionScore;
        constraintRange = componentConstraints.recognition;
        break;
      case 'leadership':
        originalScore = preliminaryScores.components.leadershipScore;
        constraintRange = componentConstraints.leadership;
        break;
      case 'community':
        originalScore = preliminaryScores.components.communityScore;
        constraintRange = componentConstraints.community;
        break;
      case 'commitment':
        originalScore = preliminaryScores.components.commitmentScore;
        constraintRange = componentConstraints.commitment;
        break;
      default:
        // Skip unknown components
        continue;
    }

    // Clamp the adjustment magnitude
    let adjustedScore = round1(adj.adjustedScore);
    const delta = adjustedScore - originalScore;
    if (Math.abs(delta) > MAX_COMPONENT_ADJUSTMENT) {
      adjustedScore = round1(originalScore + Math.sign(delta) * MAX_COMPONENT_ADJUSTMENT);
    }

    // Clamp to tier constraints
    adjustedScore = clamp(adjustedScore, constraintRange.min, constraintRange.max);

    // Only record if there's an actual change
    if (adjustedScore !== originalScore) {
      adjustments.push({
        component,
        originalScore,
        adjustedScore,
        reason: adj.reason,
      });

      // Apply to adjusted scores
      switch (component) {
        case 'recognition': adjusted.recognitionScore = adjustedScore; break;
        case 'leadership': adjusted.leadershipScore = adjustedScore; break;
        case 'community': adjusted.communityScore = adjustedScore; break;
        case 'commitment': adjusted.commitmentScore = adjustedScore; break;
      }
    }
  }

  return { adjustments, adjustedComponents: adjusted };
}

/**
 * Calculate adjusted activity total from component scores.
 * Uses the same weight formula as the activity rule scorer.
 */
function calculateAdjustedTotal(
  tierScore: number,
  adjustedComponents: NuanceCalibratedResult['adjustedComponents'],
  leadershipApplicable: boolean,
  tierRange: { min: number; max: number }
): number {
  // Standard weights (from scoringRules.ts)
  const weights = leadershipApplicable
    ? { tier: 0.30, recognition: 0.25, leadership: 0.125, community: 0.15, commitment: 0.175 }
    : { tier: 0.343, recognition: 0.286, leadership: 0.0, community: 0.171, commitment: 0.20 };

  const rawTotal =
    tierScore * weights.tier +
    adjustedComponents.recognitionScore * weights.recognition +
    adjustedComponents.leadershipScore * weights.leadership +
    adjustedComponents.communityScore * weights.community +
    adjustedComponents.commitmentScore * weights.commitment;

  return clamp(round1(rawTotal), tierRange.min, tierRange.max);
}

// ============================================================================
// MAIN CALIBRATION FUNCTION
// ============================================================================

/**
 * Calibrate an activity's scores using Sonnet and field-specific context.
 *
 * GRACEFUL DEGRADATION: If calibration context is low confidence with no
 * matching entries, skips the LLM call and returns uncalibrated scores.
 */
export async function calibrateActivity(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  activityScore: ActivityScore,
  activityMeta: { title: string; description: string; type?: string; position?: string }
): Promise<NuanceCalibratedResult> {
  // Assemble calibration context
  const calibration = getCalibrationContext(evidence, tier, activityMeta);

  // Graceful degradation: no calibration data = skip LLM call
  if (
    calibration.calibrationEntries.length === 0 ||
    calibration.categoryMatch.confidence === 'low'
  ) {
    return {
      adjustedActivityTotal: activityScore.total,
      adjustedComponents: {
        recognitionScore: activityScore.breakdown.recognitionLevel.score,
        leadershipScore: activityScore.breakdown.leadershipImpact.score,
        communityScore: activityScore.breakdown.communityCharacter.score,
        commitmentScore: activityScore.breakdown.commitmentProgression.score,
      },
      adjustments: [],
      tierAgreement: 'confirmed',
      calibrationApplied: false,
    };
  }

  // Build input for the calibration prompt
  const input: NuanceCalibrationInput = {
    activity: activityMeta,
    preliminaryScores: {
      activityTotal: activityScore.total,
      descriptionTotal: 0, // Not used in calibration prompt
      components: {
        tierScore: activityScore.breakdown.tierAssessment.score,
        recognitionScore: activityScore.breakdown.recognitionLevel.score,
        leadershipScore: activityScore.breakdown.leadershipImpact.score,
        communityScore: activityScore.breakdown.communityCharacter.score,
        commitmentScore: activityScore.breakdown.commitmentProgression.score,
      },
    },
    tierRange: tier.scoreRange,
    componentConstraints: tier.componentConstraints,
    calibration,
  };

  // Build prompt and call Sonnet
  const prompt = buildCalibrationPrompt(input);

  const options: ClaudeCallOptions = {
    model: SONNET_MODEL,
    temperature: 0.1,  // Low temperature for consistent calibration
    maxTokens: 500,    // Small output — just adjustments JSON
    systemPrompt: 'You are a precise activity scoring calibrator. Return ONLY valid JSON with score adjustments. No explanation outside JSON.',
    useJsonMode: true,
  };

  try {
    const response = await callClaudeWithRetry<CalibrationLLMResponse>(prompt, options, 2);

    // callClaudeWithRetry with useJsonMode:true already parses JSON into response.content
    // If it's already an object, use directly; if string (fallback), parse it
    const rawContent = response.content;
    let parsed: CalibrationLLMResponse | null;
    if (typeof rawContent === 'object' && rawContent !== null) {
      parsed = rawContent as CalibrationLLMResponse;
    } else {
      parsed = tryParseClaudeJSON<CalibrationLLMResponse>(
        String(rawContent),
        'nuance-calibration'
      );
    }

    if (!parsed || !Array.isArray(parsed.adjustments)) {
      // Parse failed — fall back to uncalibrated scores
      const rawStr = typeof rawContent === 'string' ? rawContent.substring(0, 200) : JSON.stringify(rawContent).substring(0, 200);
      console.warn('[NuanceCalibration] Failed to parse LLM response, using uncalibrated scores. Raw:', rawStr);
      return {
        adjustedActivityTotal: activityScore.total,
        adjustedComponents: {
          recognitionScore: activityScore.breakdown.recognitionLevel.score,
          leadershipScore: activityScore.breakdown.leadershipImpact.score,
          communityScore: activityScore.breakdown.communityCharacter.score,
          commitmentScore: activityScore.breakdown.commitmentProgression.score,
        },
        adjustments: [],
        tierAgreement: 'confirmed',
        calibrationApplied: false,
      };
    }

    // Apply adjustments with clamping
    const { adjustments, adjustedComponents } = applyAdjustments(input, parsed.adjustments);

    // Calculate adjusted total
    const leadershipApplicable = activityScore.breakdown.leadershipImpact.isApplicable;
    const adjustedTotal = calculateAdjustedTotal(
      input.preliminaryScores.components.tierScore,
      adjustedComponents,
      leadershipApplicable,
      tier.scoreRange
    );

    // Cap total adjustment magnitude
    const totalDelta = adjustedTotal - activityScore.total;
    const finalTotal = Math.abs(totalDelta) > MAX_ADJUSTMENT_MAGNITUDE
      ? round1(activityScore.total + Math.sign(totalDelta) * MAX_ADJUSTMENT_MAGNITUDE)
      : adjustedTotal;

    return {
      adjustedActivityTotal: clamp(finalTotal, tier.scoreRange.min, tier.scoreRange.max),
      adjustedComponents,
      adjustments,
      tierAgreement: adjustments.length > 0 ? 'adjusted_within_bounds' : 'confirmed',
      calibrationApplied: true,
    };

  } catch (error) {
    // LLM call failed — fall back to uncalibrated scores
    console.error('[NuanceCalibration] LLM call failed:', error instanceof Error ? error.message : 'Unknown error');
    return {
      adjustedActivityTotal: activityScore.total,
      adjustedComponents: {
        recognitionScore: activityScore.breakdown.recognitionLevel.score,
        leadershipScore: activityScore.breakdown.leadershipImpact.score,
        communityScore: activityScore.breakdown.communityCharacter.score,
        commitmentScore: activityScore.breakdown.commitmentProgression.score,
      },
      adjustments: [],
      tierAgreement: 'confirmed',
      calibrationApplied: false,
    };
  }
}

/**
 * Calibrate a batch of activities.
 * Currently calls individually; future optimization can bundle into single Sonnet call.
 */
export async function calibrateBatch(
  activities: Array<{
    evidence: ExtractedEvidence;
    tier: TierClassification;
    activityScore: ActivityScore;
    meta: { title: string; description: string; type?: string; position?: string };
  }>
): Promise<NuanceCalibratedResult[]> {
  // Process concurrently with concurrency limit
  const CONCURRENCY = 3;
  const results: NuanceCalibratedResult[] = new Array(activities.length);

  for (let i = 0; i < activities.length; i += CONCURRENCY) {
    const batch = activities.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(a => calibrateActivity(a.evidence, a.tier, a.activityScore, a.meta))
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[i + j] = batchResults[j];
    }
  }

  return results;
}

// ============================================================================
// SERVICE CLASS (singleton pattern per codebase convention)
// ============================================================================

export class NuanceCalibrationService {
  async calibrateActivity(
    evidence: ExtractedEvidence,
    tier: TierClassification,
    activityScore: ActivityScore,
    activityMeta: { title: string; description: string; type?: string; position?: string }
  ): Promise<NuanceCalibratedResult> {
    return calibrateActivity(evidence, tier, activityScore, activityMeta);
  }

  async calibrateBatch(
    activities: Array<{
      evidence: ExtractedEvidence;
      tier: TierClassification;
      activityScore: ActivityScore;
      meta: { title: string; description: string; type?: string; position?: string };
    }>
  ): Promise<NuanceCalibratedResult[]> {
    return calibrateBatch(activities);
  }
}

export const nuanceCalibrationService = new NuanceCalibrationService();
