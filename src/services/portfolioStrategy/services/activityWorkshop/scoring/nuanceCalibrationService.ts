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
 * All activities go through Sonnet nuance calibration — the LLM is the primary
 * intelligence. When no direct calibration data exists, proxy or universal
 * fallback context is injected so Sonnet always has scoring guidance.
 *
 * BATCH OPTIMIZATION: calibrateBatch() sends ALL activities in a single Sonnet
 * call (~$0.006-0.009 for 10 activities vs ~$0.02-0.03 with individual calls).
 * Falls back to individual calls if batch JSON parse fails.
 */

import { callClaudeWithRetry, type ClaudeCallOptions } from '../../../../../lib/llm/claude';
import { tryParseClaudeJSON } from '../../../../commonAppWorkshop/utils/jsonParser';
import type { ExtractedEvidence, TierClassification, ActivityScore, DescriptionScore } from './types';
import type {
  CalibrationContext,
  NuanceCalibrationInput,
  NuanceCalibratedResult,
  CalibrationLLMResponse,
  BatchCalibrationLLMResponse,
  ScoreAdjustment,
} from './nuanceCalibrationTypes';
import { getCalibrationContextWithTrace } from './achievementRetrieval';
import type { CalibrationContextWithTrace } from './achievementRetrieval';
import { STANDARD_WEIGHTS, NO_LEADERSHIP_WEIGHTS } from './scoringRules';
import { resolveCategory } from './knowledge/categoryRegistry';

// ============================================================================
// CONSTANTS
// ============================================================================

const SONNET_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_ADJUSTMENT_MAGNITUDE = 1.5;
const MAX_COMPONENT_ADJUSTMENT = 1.5;
const VALID_COMPONENTS = new Set(['recognition', 'leadership', 'community', 'commitment']);

// ============================================================================
// PROMPT BUILDERS
// ============================================================================

/**
 * Build a focused calibration prompt for a single activity.
 * Compact (~600 tokens input) with only the data needed for nuanced adjustment.
 */
function buildCalibrationPrompt(
  input: NuanceCalibrationInput,
  resolutionContext?: { resolutionMethod: 'direct' | 'proxy' | 'universal'; proxyDomainUsed: string | null; domainSpecificContext: string | null }
): string {
  return buildActivitySection(input, 0, resolutionContext);
}

/**
 * Build a section for one activity within a batch prompt.
 * Optionally injects proxy/universal context when domain resolution used a fallback.
 */
function buildActivitySection(
  input: NuanceCalibrationInput,
  index: number,
  resolutionContext?: { resolutionMethod: 'direct' | 'proxy' | 'universal'; proxyDomainUsed: string | null; domainSpecificContext: string | null }
): string {
  const { activity, preliminaryScores, tierRange, calibration } = input;

  const entriesSection = calibration.calibrationEntries
    .map(e => {
      const sel = e.selectivityRatio ? ` | Selectivity: ${e.selectivityRatio}` : '';
      return `  - ${e.activity}: [${e.scoreRange[0]}-${e.scoreRange[1]}] — ${e.context}${sel}`;
    })
    .join('\n');

  const rolesSection = calibration.roleHierarchy
    .map(r => `  - ${r.role}: ${r.scoreModifier >= 0 ? '+' : ''}${r.scoreModifier} (${r.context})`)
    .join('\n');

  const prestigeSection = calibration.subcategoryPrestige
    ? `${calibration.subcategoryPrestige.name} (prestige: ${calibration.subcategoryPrestige.prestigeLevel}/5 — ${calibration.subcategoryPrestige.prestigeContext})`
    : 'Unknown subcategory';

  let expertiseBlock = '';
  if (input.expertiseContext) {
    const ctx = input.expertiseContext;
    expertiseBlock = `
EXPERTISE SIGNALS (pre-computed, deterministic):
- Domain: ${ctx.domainId} (confidence: ${ctx.confidence})
- ${ctx.signalCount} real expertise signal(s), ${ctx.trapCount} name-drop trap(s)
- Net expertise score: ${ctx.expertiseScore >= 0 ? '+' : ''}${ctx.expertiseScore}
${ctx.topSignals.length > 0 ? `- Key signals: ${ctx.topSignals.join(', ')}` : ''}
${ctx.topTraps.length > 0 ? `- Name-drop traps: ${ctx.topTraps.join(', ')}` : ''}`;
  }

  // Build impressiveness context block from ImpressionAnalysisResult
  // Injects field-specific WHY context, major alignment, and technical depth markers.
  let impressionBlock = '';
  if (input.impressionContext) {
    const imp = input.impressionContext;
    const hasDepthMarkers = (imp.technicalDepthMarkers ?? []).length > 0;
    const hasMajorAlignment = imp.majorAlignment && imp.majorAlignment.relevance !== 'unrelated';
    const hasWhyContext = imp.impressionContext?.whyImpressive && imp.impressionContext.whyImpressive !== 'Unable to assess field-specific impressiveness without domain match';

    // Only inject when there's non-redundant signal
    if (hasDepthMarkers || hasMajorAlignment || hasWhyContext) {
      const parts: string[] = [];

      // Rich field: WHY this achievement level matters (from impressiveness ladder)
      if (hasWhyContext && imp.level && imp.confidence !== 'low') {
        parts.push(`Impressiveness: ${imp.level} (${imp.confidence} confidence) — ${imp.impressionContext.whyImpressive}`);
      }

      if (hasMajorAlignment && imp.majorAlignment) {
        parts.push(`Major alignment: ${imp.majorAlignment.relevance} for intended major — ${imp.majorAlignment.rationale}`);
      }

      if (hasDepthMarkers) {
        const markers = (imp.technicalDepthMarkers ?? []).slice(0, 3)
          .map((m: { marker: string; significance: string }) => `${m.marker}: ${m.significance}`)
          .join('; ');
        parts.push(`Technical depth markers: ${markers}`);
      }

      impressionBlock = `\nIMPRESSION CONTEXT:\n${parts.map(p => `- ${p}`).join('\n')}`;
    }
  }

  // Build resolution context block for proxy/universal fallback
  let resolutionBlock = '';
  if (resolutionContext) {
    if (resolutionContext.resolutionMethod === 'proxy' && resolutionContext.proxyDomainUsed) {
      resolutionBlock = `\n[PROXY CONTEXT WARNING: This activity type has NO direct calibration data.
Benchmarks below are from the PROXY domain "${resolutionContext.proxyDomainUsed}" and may NOT directly apply.
CRITICAL: Do NOT assume this activity matches the proxy domain's prestige levels or benchmarks.
Score based on the activity's OWN evidence (scope, impact, recognition, commitment) — not the proxy domain's typical achievements.
Proxy benchmarks are reference points for STRUCTURE (what tier looks like), not CONTENT (what specific achievements mean).]`;
    } else if (resolutionContext.resolutionMethod === 'universal') {
      resolutionBlock = `\n[UNIVERSAL SCORING — No field-specific benchmarks available for this activity type.
Score based on these universal achievement signals:
- SCALE: How many people are impacted? (10 = local/personal, 100+ = significant, 1000+ = impressive)
- SELECTIVITY: How hard is it to get this role/recognition? (open to all = low, competitive selection = high)
- DURATION: How sustained is commitment? (< 1yr = developing, 2-3yr = committed, 4yr = dedicated)
- PROGRESSION: Is there growth in responsibility/impact? (static role = lower, growing role = higher)
- EXTERNAL VALIDATION: Awards, published work, grants, media coverage, institutional recognition
- ORIGINALITY: Did the student create something new vs participate in existing programs?
Use the tier range and component constraints as bounds. Score conservatively for unknown domains.]`;
    }
    if (resolutionContext.domainSpecificContext) {
      resolutionBlock += `\nHAIKU DOMAIN ANALYSIS: ${resolutionContext.domainSpecificContext}`;
    }
  }

  return `--- ACTIVITY ${index} ---
ACTIVITY: ${activity.title}
DESCRIPTION: ${activity.description}
${activity.position ? `POSITION: ${activity.position}` : ''}

PRELIMINARY SCORES (from deterministic rules):
- Activity total: ${preliminaryScores.activityTotal}/10 (tier range: ${tierRange.min}-${tierRange.max})
- Components: recognition ${preliminaryScores.components.recognitionScore}, leadership ${preliminaryScores.components.leadershipScore}, community ${preliminaryScores.components.communityScore}, commitment ${preliminaryScores.components.commitmentScore}

FIELD: ${calibration.categoryMatch.category} → ${prestigeSection}
${resolutionBlock}
CALIBRATION BENCHMARKS:
${entriesSection || '  No matching benchmarks found'}

ROLE HIERARCHY IN THIS FIELD:
${rolesSection || '  No role hierarchy available'}

${calibration.selectivityContext ? `SELECTIVITY CONTEXT: ${calibration.selectivityContext}` : ''}${expertiseBlock}${impressionBlock}${buildAOExpectationsBlock(activity.type, activity.description, activity.position)}`;
}

/**
 * Build an AO expectations block from the KB for prompt injection.
 * Provides field-specific context about what admissions officers actually evaluate.
 */
function buildAOExpectationsBlock(activityType?: string, description?: string, role?: string): string {
  if (!activityType && !description) return '';

  const resolution = resolveCategory(description || activityType || '', activityType, role);
  if (!resolution || !resolution.category.aoExpectations) return '';

  const ao = resolution.category.aoExpectations;
  return `
AO EXPECTATIONS (${resolution.category.label}):
- What registers: ${ao.whatRegisters.slice(0, 3).join('; ')}
- What AOs see through: ${ao.whatAOsSeeThrough.slice(0, 2).join('; ')}
- Golden question: "${ao.goldenQuestion}"`;
}

/**
 * Build a batch calibration prompt combining ALL activities into one Sonnet call.
 * Cross-activity context enables comparative scoring (e.g., research > grocery).
 */
function buildBatchCalibrationPrompt(
  inputs: NuanceCalibrationInput[],
  resolutionContexts?: Array<{ resolutionMethod: 'direct' | 'proxy' | 'universal'; proxyDomainUsed: string | null; domainSpecificContext: string | null } | undefined>
): string {
  const activitySections = inputs.map((input, idx) =>
    buildActivitySection(input, idx, resolutionContexts?.[idx])
  ).join('\n\n');

  return `You are calibrating ${inputs.length} activity scores with field-specific context.
Your job: adjust component scores WITHIN each activity's tier bounds to reflect nuance that deterministic rules missed.
Return ONLY adjustments where the preliminary score clearly misses context.
Consider activities comparatively — if one is clearly stronger/weaker than another, ensure scores reflect that.

## SELECTIVITY CONTEXT PRINCIPLES
Selectivity of the SETTING dramatically affects impressiveness. The same activity in different settings is NOT the same achievement:
- University research lab > school science club (even for the same hours/role)
- Selective program acceptance (e.g., RSI, SIMR, SSP) is itself evidence of distinction
- "Research assistant" at MIT ≠ "research assistant" at local library
- Working with published professors/PhDs signals a selective environment that vetted the student
- Scale of dataset/project at a university (50K records, NLP pipeline) signals real institutional research

## COMPARATIVE CALIBRATION: Activities of genuinely different quality MUST score differently
- Research with co-authored paper + university setting + large dataset >> peer tutoring at school
- State competition winner >> club participant with same hours
- Founded nonprofit with 501(c)(3) >> "volunteered at food bank"
- Ensure at least 1.5-point spread between activities of clearly different quality within the same tier

## CALIBRATION EXAMPLES (use these as anchors):
1. ML Research Assistant at university lab, co-authored paper, analyzed 50K+ records, built NLP pipeline → recognition 7-8, commitment 7-8. This is NOT the same as school-level tutoring.
2. Math Tutor at school, 3 hrs/wk for 2 years, helped 15 students → recognition 3-4, commitment 5-6. Solid but common.
3. Founded coding nonprofit, 200+ students served, $5K grant → recognition 6-7, leadership 7-8, community 7-8.
4. Varsity basketball, team captain, led to state semifinals → recognition 5-6, leadership 6-7.
5. Occasional food bank volunteer, 50 hours total, no defined role → recognition 1-2, commitment 2-3.

${activitySections}

RULES:
1. Only adjust components where the preliminary score clearly under- or over-values based on the calibration data
2. Each adjustment must be within the activity's tier bounds
3. Maximum adjustment per component: ±${MAX_COMPONENT_ADJUSTMENT}
4. Return empty adjustments array for activities already well-calibrated
5. Focus on: selectivity gradient, role nuance, subcategory prestige, progression arc
6. Consider relative strength across activities — stronger activities should score higher
7. Major alignment: If "critical" or "core" for intended major, this activity carries extra admissions weight — consider bumping recognition/community by up to +0.5 if evidence supports the alignment. If "complementary" or "unrelated," do not boost for major fit.
8. Mid-range discrimination: Scores 4.0-6.9 should NOT cluster. If two mid-tier activities are genuinely different in quality, ensure their scores are at least 1.0 apart. Use the full range within each tier band.

Return JSON only. CRITICAL REQUIREMENTS:
- The "activities" array MUST have EXACTLY ${inputs.length} entries
- Activities MUST be in index order: 0, 1, 2, ..., ${inputs.length - 1}. Do NOT reorder or skip any.
- Each entry MUST include its "index" field matching the activity number above
- Use empty adjustments array [] for activities that need no changes

Format:
{"activities":[{"index":0,"adjustments":[{"component":"recognition|leadership|community|commitment","adjustedScore":N,"reason":"brief reason"}]},{"index":1,"adjustments":[]}]}`;
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

    // Validate component name
    if (!VALID_COMPONENTS.has(component)) {
      console.warn(`[NuanceCalibration] Unknown component "${component}" in LLM response, skipping`);
      continue;
    }

    // Validate adjustedScore is a finite number
    if (!Number.isFinite(adj.adjustedScore)) {
      console.warn(`[NuanceCalibration] Invalid adjustedScore (${adj.adjustedScore}) for component "${component}", skipping`);
      continue;
    }

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
        continue;
    }

    // Clamp the adjustment magnitude
    let adjustedScore = round1(adj.adjustedScore);
    const delta = adjustedScore - originalScore;
    if (Math.abs(delta) > MAX_COMPONENT_ADJUSTMENT) {
      console.warn(`[NuanceCalibration] Component "${component}" adjustment capped: requested ${round1(delta)} → applied ${Math.sign(delta) * MAX_COMPONENT_ADJUSTMENT} for activity`);
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
  const weights = leadershipApplicable ? STANDARD_WEIGHTS : NO_LEADERSHIP_WEIGHTS;

  const rawTotal =
    tierScore * weights.tier +
    adjustedComponents.recognitionScore * weights.recognition +
    adjustedComponents.leadershipScore * weights.leadership +
    adjustedComponents.communityScore * weights.community +
    adjustedComponents.commitmentScore * weights.commitment;

  return clamp(round1(rawTotal), tierRange.min, tierRange.max);
}

/**
 * Build an uncalibrated (passthrough) result for an activity.
 */
function buildUncalibratedResult(activityScore: ActivityScore): NuanceCalibratedResult {
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

/**
 * Process a single activity's adjustments from parsed LLM output.
 */
function processActivityAdjustments(
  input: NuanceCalibrationInput,
  activityScore: ActivityScore,
  tier: TierClassification,
  llmAdjustments: CalibrationLLMResponse['adjustments']
): NuanceCalibratedResult {
  const { adjustments, adjustedComponents } = applyAdjustments(input, llmAdjustments);

  const leadershipApplicable = activityScore.breakdown.leadershipImpact.isApplicable;
  const adjustedTotal = calculateAdjustedTotal(
    input.preliminaryScores.components.tierScore,
    adjustedComponents,
    leadershipApplicable,
    tier.scoreRange
  );

  // Cap total adjustment magnitude
  const totalDelta = adjustedTotal - activityScore.total;
  if (Math.abs(totalDelta) > MAX_ADJUSTMENT_MAGNITUDE) {
    console.warn(`[NuanceCalibration] Total adjustment capped: requested ${round1(totalDelta)} → applied ${Math.sign(totalDelta) * MAX_ADJUSTMENT_MAGNITUDE} for activity "${input.activity.title}"`);
  }
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
}

// ============================================================================
// MAIN CALIBRATION FUNCTION (single activity)
// ============================================================================

/**
 * Calibrate an activity's scores using Sonnet and field-specific context.
 *
 * Always calls Sonnet — the LLM is the primary intelligence for nuance.
 * Uses proxy/universal fallback when no direct calibration data is available.
 */
export async function calibrateActivity(
  evidence: ExtractedEvidence,
  tier: TierClassification,
  activityScore: ActivityScore,
  activityMeta: { title: string; description: string; type?: string; position?: string },
  expertiseContext?: NuanceCalibrationInput['expertiseContext'],
  impressionContext?: NuanceCalibrationInput['impressionContext']
): Promise<NuanceCalibratedResult> {
  // Assemble calibration context with proxy/universal fallback — never returns empty
  const calibrationWithTrace = getCalibrationContextWithTrace(evidence, tier, activityMeta);
  const calibration = calibrationWithTrace as CalibrationContext;

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
    expertiseContext,
    impressionContext,
  };

  // Build resolution context for prompt enrichment
  const resolutionContext = {
    resolutionMethod: calibrationWithTrace.resolutionMethod,
    proxyDomainUsed: calibrationWithTrace.proxyDomainUsed,
    domainSpecificContext: calibrationWithTrace.domainSpecificContext,
  };

  // Build prompt and call Sonnet
  const prompt = `You are calibrating activity scores with field-specific context.
Your job: adjust component scores WITHIN the given tier bounds to reflect nuance that deterministic rules missed.
Return ONLY adjustments where the preliminary score clearly misses context.

## SELECTIVITY CONTEXT PRINCIPLES
- University research lab > school science club (same hours, different tier)
- Selective program acceptance is itself evidence of distinction
- Scale of project (50K+ records, NLP pipeline) signals real institutional research
- Working with published professors/PhDs signals selective environment
- "Founded" at scale (200+ served, grant funding) >> "member" with same hours

${buildCalibrationPrompt(input, resolutionContext)}

RULES:
1. Only adjust components where the preliminary score clearly under- or over-values based on the calibration data
2. Each adjustment must be within the tier bounds
3. Maximum adjustment per component: ±${MAX_COMPONENT_ADJUSTMENT}
4. Return empty adjustments array if preliminary scores are already well-calibrated
5. Focus on: selectivity gradient, role nuance, subcategory prestige, progression arc
6. Major alignment: If "critical" or "core" for intended major, this activity carries extra admissions weight — consider bumping recognition/community by up to +0.5 if evidence supports the alignment. If "complementary" or "unrelated," do not boost for major fit.
7. Mid-range scores (4.0-6.9) need discrimination: use the full range within tier bands, not just the midpoint.

Return JSON only:
{"adjustments":[{"component":"recognition|leadership|community|commitment","adjustedScore":N,"reason":"brief reason"}]}`;

  const options: ClaudeCallOptions = {
    model: SONNET_MODEL,
    temperature: 0.1,  // Low temperature for consistent calibration
    maxTokens: 500,    // Small output — just adjustments JSON
    systemPrompt: 'You are a precise activity scoring calibrator for college admissions. You understand that selectivity of setting (university lab vs school club), scale of impact (50K records vs 15 students), and external validation (co-authored paper vs participation certificate) create LARGE score differences even within the same tier. Return ONLY valid JSON with score adjustments. No explanation outside JSON.',
    useJsonMode: true,
  };

  try {
    const response = await callClaudeWithRetry<CalibrationLLMResponse>(prompt, options, 2);

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
      const rawStr = typeof rawContent === 'string' ? rawContent.substring(0, 200) : JSON.stringify(rawContent).substring(0, 200);
      console.warn('[NuanceCalibration] Failed to parse LLM response, using uncalibrated scores. Raw:', rawStr);
      return buildUncalibratedResult(activityScore);
    }

    return processActivityAdjustments(input, activityScore, tier, parsed.adjustments);

  } catch (error) {
    console.error('[NuanceCalibration] LLM call failed:', error instanceof Error ? error.message : 'Unknown error');
    return buildUncalibratedResult(activityScore);
  }
}

// ============================================================================
// BATCH CALIBRATION (single Sonnet call for all activities)
// ============================================================================

/** Activity input type for calibrateBatch */
type BatchActivityInput = {
  evidence: ExtractedEvidence;
  tier: TierClassification;
  activityScore: ActivityScore;
  meta: { title: string; description: string; type?: string; position?: string };
  expertiseContext?: NuanceCalibrationInput['expertiseContext'];
  impressionContext?: NuanceCalibrationInput['impressionContext'];
};

/**
 * Calibrate a batch of activities in a SINGLE Sonnet call.
 *
 * Strategy:
 * 1. Build calibration context for ALL activities (proxy/universal fallback, no skip)
 * 2. Batch: combine all activities into ONE Sonnet call
 * 3. Parse: extract per-activity adjustments from batch JSON response
 * 4. Fallback: if batch JSON parse fails, retry with individual calls
 *
 * Cost: ~$0.006-0.009 for 10 activities (vs ~$0.02-0.03 with individual calls)
 */
export async function calibrateBatch(
  activities: BatchActivityInput[]
): Promise<NuanceCalibratedResult[]> {
  // Initialize ALL slots with uncalibrated defaults — ensures no undefined slots escape
  const results: NuanceCalibratedResult[] = activities.map(a => buildUncalibratedResult(a.activityScore));

  // Phase 1: Build calibration inputs for ALL activities (no skip — LLM is primary intelligence)
  // Uses getCalibrationContextWithTrace for proxy/universal fallback when direct match fails
  const needsCalibration: Array<{
    originalIndex: number;
    input: NuanceCalibrationInput;
    resolutionContext: { resolutionMethod: 'direct' | 'proxy' | 'universal'; proxyDomainUsed: string | null; domainSpecificContext: string | null };
  }> = [];

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    const calibrationWithTrace = getCalibrationContextWithTrace(a.evidence, a.tier, a.meta);
    const calibration = calibrationWithTrace as CalibrationContext;

    needsCalibration.push({
      originalIndex: i,
      input: {
        activity: a.meta,
        preliminaryScores: {
          activityTotal: a.activityScore.total,
          descriptionTotal: 0,
          components: {
            tierScore: a.activityScore.breakdown.tierAssessment.score,
            recognitionScore: a.activityScore.breakdown.recognitionLevel.score,
            leadershipScore: a.activityScore.breakdown.leadershipImpact.score,
            communityScore: a.activityScore.breakdown.communityCharacter.score,
            commitmentScore: a.activityScore.breakdown.commitmentProgression.score,
          },
        },
        tierRange: a.tier.scoreRange,
        componentConstraints: a.tier.componentConstraints,
        calibration,
        expertiseContext: a.expertiseContext,
        impressionContext: a.impressionContext,
      },
      resolutionContext: {
        resolutionMethod: calibrationWithTrace.resolutionMethod,
        proxyDomainUsed: calibrationWithTrace.proxyDomainUsed,
        domainSpecificContext: calibrationWithTrace.domainSpecificContext,
      },
    });
  }

  if (needsCalibration.length === 0) {
    return results;
  }

  // Phase 2: Single activity — use individual call (no batch overhead)
  if (needsCalibration.length === 1) {
    const { originalIndex } = needsCalibration[0];
    const a = activities[originalIndex];
    results[originalIndex] = await calibrateActivity(
      a.evidence, a.tier, a.activityScore, a.meta, a.expertiseContext, a.impressionContext
    );
    return results;
  }

  // Phase 3: Batch call — combine all activities into ONE Sonnet call
  console.log(`[NuanceCalibration] Batch calibrating ${needsCalibration.length} activities in single Sonnet call...`);

  const batchInputs = needsCalibration.map(n => n.input);
  const batchResolutionContexts = needsCalibration.map(n => n.resolutionContext);
  const batchPrompt = buildBatchCalibrationPrompt(batchInputs, batchResolutionContexts);

  // Scale maxTokens: ~250 tokens per activity (adjustments JSON + reasons)
  // Cap at 8000 to avoid extremely long outputs; for 20+ activities the
  // individual fallback is more reliable anyway
  const maxTokens = Math.min(8000, 300 + needsCalibration.length * 250);

  const options: ClaudeCallOptions = {
    model: SONNET_MODEL,
    temperature: 0.1,
    maxTokens,
    systemPrompt: `You are a precise activity scoring calibrator. Return ONLY valid JSON with score adjustments for ALL ${needsCalibration.length} activities. No explanation outside JSON.`,
    useJsonMode: true,
  };

  try {
    const response = await callClaudeWithRetry<BatchCalibrationLLMResponse>(batchPrompt, options, 2);

    const rawContent = response.content;
    let parsed: BatchCalibrationLLMResponse | null;
    if (typeof rawContent === 'object' && rawContent !== null) {
      parsed = rawContent as BatchCalibrationLLMResponse;
    } else {
      parsed = tryParseClaudeJSON<BatchCalibrationLLMResponse>(
        String(rawContent),
        'nuance-calibration-batch'
      );
    }

    if (!parsed || !Array.isArray(parsed.activities)) {
      // Batch parse failed — fall back to individual calls
      const rawStr = typeof rawContent === 'string' ? rawContent.substring(0, 300) : JSON.stringify(rawContent).substring(0, 300);
      console.warn(`[NuanceCalibration] Batch JSON parse failed, falling back to individual calls. Raw: ${rawStr}`);
      return calibrateBatchIndividual(activities, results, needsCalibration);
    }

    // CRITICAL: Detect truncated output — if Sonnet returned fewer activities than
    // expected, the JSON was likely truncated. Fall back to individual calls for
    // reliability rather than silently accepting partial results.
    if (parsed.activities.length < needsCalibration.length) {
      console.warn(
        `[NuanceCalibration] Batch response truncated: got ${parsed.activities.length}/${needsCalibration.length} activities. ` +
        `Falling back to individual calls for reliability.`
      );
      return calibrateBatchIndividual(activities, results, needsCalibration);
    }

    // Phase 4: Apply batch results with index validation
    let appliedCount = 0;
    const appliedIndices = new Set<number>();
    const failedIndices: number[] = [];

    for (const actResult of parsed.activities) {
      // Validate index range
      if (
        !Number.isFinite(actResult.index) ||
        actResult.index < 0 ||
        actResult.index >= needsCalibration.length
      ) {
        console.warn(`[NuanceCalibration] Batch result has invalid index: ${actResult.index}`);
        continue;
      }

      // Detect duplicate indices — skip second occurrence
      if (appliedIndices.has(actResult.index)) {
        console.warn(`[NuanceCalibration] Duplicate index ${actResult.index} in batch response, skipping`);
        continue;
      }

      const { originalIndex, input } = needsCalibration[actResult.index];
      const a = activities[originalIndex];

      if (!Array.isArray(actResult.adjustments)) {
        failedIndices.push(actResult.index);
        continue;
      }

      results[originalIndex] = processActivityAdjustments(
        input, a.activityScore, a.tier, actResult.adjustments
      );
      appliedIndices.add(actResult.index);
      appliedCount++;
    }

    // Find activities missing from the response (gaps in index coverage)
    for (let k = 0; k < needsCalibration.length; k++) {
      if (!appliedIndices.has(k) && !failedIndices.includes(k)) {
        failedIndices.push(k);
      }
    }

    // Retry failed/missing activities individually
    if (failedIndices.length > 0) {
      console.warn(`[NuanceCalibration] ${failedIndices.length}/${needsCalibration.length} activities missing/failed in batch. Retrying individually...`);
      for (const failedIdx of failedIndices) {
        const { originalIndex } = needsCalibration[failedIdx];
        const a = activities[originalIndex];
        results[originalIndex] = await calibrateActivity(
          a.evidence, a.tier, a.activityScore, a.meta, a.expertiseContext, a.impressionContext
        );
      }
    }

    console.log(`[NuanceCalibration] Batch complete: ${appliedCount} from batch, ${failedIndices.length} individual retries`);
    return results;

  } catch (error) {
    // Batch call failed entirely — fall back to individual calls
    console.error('[NuanceCalibration] Batch LLM call failed, falling back to individual calls:', error instanceof Error ? error.message : 'Unknown error');
    return calibrateBatchIndividual(activities, results, needsCalibration);
  }
}

/**
 * Fallback: calibrate activities individually with concurrency limit.
 * Used when batch JSON parse fails.
 */
async function calibrateBatchIndividual(
  activities: BatchActivityInput[],
  results: NuanceCalibratedResult[],
  needsCalibration: Array<{ originalIndex: number; input: NuanceCalibrationInput }>
): Promise<NuanceCalibratedResult[]> {
  console.log(`[NuanceCalibration] Individual fallback for ${needsCalibration.length} activities...`);
  const CONCURRENCY = 3;

  for (let i = 0; i < needsCalibration.length; i += CONCURRENCY) {
    const batch = needsCalibration.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(({ originalIndex }) => {
        const a = activities[originalIndex];
        return calibrateActivity(a.evidence, a.tier, a.activityScore, a.meta, a.expertiseContext, a.impressionContext);
      })
    );
    for (let j = 0; j < batchResults.length; j++) {
      results[batch[j].originalIndex] = batchResults[j];
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
    activityMeta: { title: string; description: string; type?: string; position?: string },
    expertiseContext?: NuanceCalibrationInput['expertiseContext'],
    impressionContext?: NuanceCalibrationInput['impressionContext']
  ): Promise<NuanceCalibratedResult> {
    return calibrateActivity(evidence, tier, activityScore, activityMeta, expertiseContext, impressionContext);
  }

  async calibrateBatch(
    activities: Array<{
      evidence: ExtractedEvidence;
      tier: TierClassification;
      activityScore: ActivityScore;
      meta: { title: string; description: string; type?: string; position?: string };
      expertiseContext?: NuanceCalibrationInput['expertiseContext'];
      impressionContext?: NuanceCalibrationInput['impressionContext'];
    }>
  ): Promise<NuanceCalibratedResult[]> {
    return calibrateBatch(activities);
  }
}

export const nuanceCalibrationService = new NuanceCalibrationService();
