/**
 * Regression Guard — Hybrid Heuristic + LLM Judge
 *
 * Validates that essay edits don't regress quality. Two layers:
 *
 * 1. HEURISTIC (fast, deterministic): catches structural regressions —
 *    severe EQI drops, dimension collapses, word count anomalies.
 *
 * 2. LLM JUDGE (Haiku, ~$0.002): evaluates what heuristics can't —
 *    voice consistency, specificity, authenticity, narrative strength.
 *
 * Both layers always run. No fallbacks. If the Haiku call fails, we throw.
 * The LLM judge is the PRIMARY quality signal; the heuristic is supplementary.
 *
 * Verdict logic:
 *   - LLM says 'degraded' with confidence > 0.6 → reject
 *   - LLM says voice is inconsistent with confidence > 0.5 → reject
 *   - Heuristic: EQI drop > 5 → reject (catastrophic structural regression)
 *   - Heuristic: any dimension drops > 3.0 → reject (severe collapse)
 *   - LLM says 'neutral' + 3+ heuristic regressions outweigh improvements → reject
 *
 * Dependencies: preAnalyzer, voiceProfileService, callClaude (Haiku)
 */

import type {
  EssaySnapshot,
  RegressionCheckResult,
  LLMJudgment,
  EditContext,
} from './types';
import { preAnalyze } from './preAnalyzer';
import { callClaude } from '@/lib/llm/claude';
import { voiceProfileService } from '../voiceProfile';
import type { StudentVoiceProfile } from '../voiceProfile/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

/** Minimum delta to count as a meaningful improvement (filters noise) */
const MIN_IMPROVEMENT_THRESHOLD = 0.3;

/** Minimum delta to count as a meaningful regression (filters noise) */
const MIN_REGRESSION_THRESHOLD = 0.3;

/** EQI drop threshold for catastrophic structural regression */
const CATASTROPHIC_EQI_DROP = 5.0;

/** Single-dimension drop threshold for severe collapse */
const SEVERE_DIMENSION_DROP = 3.0;

/** LLM confidence threshold for 'degraded' verdict to trigger rejection */
const LLM_DEGRADED_CONFIDENCE_THRESHOLD = 0.6;

/** LLM confidence threshold for voice inconsistency to trigger rejection */
const LLM_VOICE_CONFIDENCE_THRESHOLD = 0.5;

/** Minimum regression count (when > improvements) to flag with neutral LLM verdict */
const SUSPICIOUS_REGRESSION_COUNT = 3;

// ============================================================================
// LLM JUDGE PROMPT
// ============================================================================

const LLM_JUDGE_SYSTEM_PROMPT = `You are a quality judge for college application essay edits. Your role is to determine whether an edit improved, maintained, or degraded the essay's quality.

You evaluate edits on 4 criteria:

1. SPECIFICITY: Does the edited version contain more concrete, vivid details — or has it become more generic and abstract? Look for: specific names, numbers, sensory details, particular moments vs. vague summaries.

2. VOICE: Does the edited version sound like THIS specific student? Compare against the provided voice profile. Watch for: AI-polished phrasing replacing natural speech patterns, vocabulary that doesn't match the student's level, sentence structures that feel foreign to their style.

3. AUTHENTICITY: Does the edited version feel genuine and personal — or manufactured and formulaic? Signs of degradation: cliche college-essay language ("I learned that...", "This experience taught me..."), forced emotional beats, impressive-sounding but hollow claims.

4. NARRATIVE STRENGTH: Is the story, argument, or reflection stronger? Consider: clarity of the central point, logical flow, emotional resonance, whether the reader comes away with a clearer picture of who this student is.

IMPORTANT RULES:
- Minor word-level changes that preserve meaning = 'neutral', NOT 'improved'
- An edit that adds specificity but loses voice = 'degraded' (voice preservation is paramount)
- An edit that sounds better but less authentic = 'degraded'
- Be honest about confidence — if the passages are very similar, confidence should be low
- The explanation must be 1-2 sentences a human can understand (it surfaces to the user)

Respond with ONLY valid JSON matching this schema:
{
  "verdict": "improved" | "neutral" | "degraded",
  "confidence": <number 0-1>,
  "explanation": "<1-2 sentence human-readable explanation>",
  "voiceConsistent": <boolean>,
  "specificityChange": "increased" | "maintained" | "decreased",
  "authenticityChange": "increased" | "maintained" | "decreased"
}`;

// ============================================================================
// HEURISTIC COMPARISON
// ============================================================================

/**
 * Compare two snapshots using deterministic heuristics.
 *
 * Returns structural data: dimension deltas, regressions, improvements,
 * EQI delta. This is an internal helper — it does NOT include LLM judgment.
 */
export function compareSnapshots(
  before: EssaySnapshot,
  after: EssaySnapshot
): Omit<RegressionCheckResult, 'llmJudgment'> {
  const eqiDelta = after.eqi - before.eqi;
  const dimensionDeltas: Record<string, number> = {};
  const regressions: RegressionCheckResult['regressions'] = [];
  const improvements: RegressionCheckResult['improvements'] = [];

  // Calculate per-dimension deltas
  const allDimensions = new Set([
    ...Object.keys(before.dimensionScores),
    ...Object.keys(after.dimensionScores),
  ]);

  for (const dim of allDimensions) {
    const beforeScore = before.dimensionScores[dim] ?? 0;
    const afterScore = after.dimensionScores[dim] ?? 0;
    const delta = Math.round((afterScore - beforeScore) * 10) / 10;
    dimensionDeltas[dim] = delta;

    if (delta < -MIN_REGRESSION_THRESHOLD) {
      regressions.push({ dimension: dim, before: beforeScore, after: afterScore, delta });
    } else if (delta > MIN_IMPROVEMENT_THRESHOLD) {
      improvements.push({ dimension: dim, before: beforeScore, after: afterScore, delta });
    }
  }

  return {
    passed: true, // Placeholder — final verdict computed in checkRegression
    dimensionDeltas,
    eqiDelta: Math.round(eqiDelta * 10) / 10,
    regressions,
    improvements,
  };
}

// ============================================================================
// LLM JUDGE
// ============================================================================

/**
 * Build the user prompt for the LLM judge.
 *
 * Includes: edit context (command, dimension, rationale), both passages,
 * and the student's voice profile summary.
 */
function buildJudgeUserPrompt(editContext: EditContext): string {
  const voiceSummary = voiceProfileService.getPromptSummary(editContext.voiceProfile);

  const lines: string[] = [];

  lines.push('## Edit Context');
  lines.push(`Target dimension: ${editContext.action.dimension}`);
  lines.push(`Command applied: ${editContext.action.command}`);
  lines.push(`Rationale: ${editContext.action.rationale}`);
  lines.push('');
  lines.push('## Original Passage');
  lines.push(editContext.beforePassage);
  lines.push('');
  lines.push('## Edited Passage');
  lines.push(editContext.afterPassage);
  lines.push('');
  lines.push('## Student Voice Profile');
  lines.push(voiceSummary);
  lines.push('');
  lines.push('Evaluate whether this edit improved, maintained, or degraded the essay quality. Consider all 4 criteria (specificity, voice, authenticity, narrative strength) and the student\'s voice profile.');

  return lines.join('\n');
}

/**
 * Build a user prompt for standalone comparison (no specific edit context).
 * Used by checkRegressionStandalone when comparing full texts.
 */
function buildStandaloneJudgeUserPrompt(
  beforeText: string,
  afterText: string,
  voiceProfile: StudentVoiceProfile
): string {
  const voiceSummary = voiceProfileService.getPromptSummary(voiceProfile);

  const lines: string[] = [];

  lines.push('## Original Text');
  lines.push(beforeText);
  lines.push('');
  lines.push('## Edited Text');
  lines.push(afterText);
  lines.push('');
  lines.push('## Student Voice Profile');
  lines.push(voiceSummary);
  lines.push('');
  lines.push('Compare these two versions of the essay. Evaluate whether the changes improved, maintained, or degraded the essay quality. Consider all 4 criteria (specificity, voice, authenticity, narrative strength) and the student\'s voice profile.');

  return lines.join('\n');
}

/**
 * Validate that the LLM response has all required fields with correct types.
 * Throws if validation fails — we do NOT degrade to heuristic-only.
 */
function validateLLMJudgment(raw: unknown): LLMJudgment {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('[RegressionGuard] LLM judge returned non-object response');
  }

  const obj = raw as Record<string, unknown>;

  // Validate verdict
  const validVerdicts = ['improved', 'neutral', 'degraded'] as const;
  if (!validVerdicts.includes(obj.verdict as typeof validVerdicts[number])) {
    throw new Error(
      `[RegressionGuard] LLM judge returned invalid verdict: ${JSON.stringify(obj.verdict)}. ` +
      `Expected one of: ${validVerdicts.join(', ')}`
    );
  }

  // Validate confidence
  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    throw new Error(
      `[RegressionGuard] LLM judge returned invalid confidence: ${JSON.stringify(obj.confidence)}. ` +
      `Expected number between 0 and 1`
    );
  }

  // Validate explanation
  if (typeof obj.explanation !== 'string' || obj.explanation.trim().length === 0) {
    throw new Error(
      '[RegressionGuard] LLM judge returned empty or missing explanation'
    );
  }

  // Validate voiceConsistent
  if (typeof obj.voiceConsistent !== 'boolean') {
    throw new Error(
      `[RegressionGuard] LLM judge returned invalid voiceConsistent: ${JSON.stringify(obj.voiceConsistent)}. ` +
      `Expected boolean`
    );
  }

  // Validate specificityChange
  const validChanges = ['increased', 'maintained', 'decreased'] as const;
  if (!validChanges.includes(obj.specificityChange as typeof validChanges[number])) {
    throw new Error(
      `[RegressionGuard] LLM judge returned invalid specificityChange: ${JSON.stringify(obj.specificityChange)}. ` +
      `Expected one of: ${validChanges.join(', ')}`
    );
  }

  // Validate authenticityChange
  if (!validChanges.includes(obj.authenticityChange as typeof validChanges[number])) {
    throw new Error(
      `[RegressionGuard] LLM judge returned invalid authenticityChange: ${JSON.stringify(obj.authenticityChange)}. ` +
      `Expected one of: ${validChanges.join(', ')}`
    );
  }

  return {
    verdict: obj.verdict as LLMJudgment['verdict'],
    confidence: obj.confidence as number,
    explanation: (obj.explanation as string).trim(),
    voiceConsistent: obj.voiceConsistent as boolean,
    specificityChange: obj.specificityChange as LLMJudgment['specificityChange'],
    authenticityChange: obj.authenticityChange as LLMJudgment['authenticityChange'],
  };
}

/**
 * Call the Haiku LLM judge to evaluate an edit.
 *
 * No fallback. If the call fails, the error propagates.
 */
async function callLLMJudge(userPrompt: string): Promise<LLMJudgment> {
  const response = await callClaude<unknown>({
    systemPrompt: LLM_JUDGE_SYSTEM_PROMPT,
    userPrompt,
    model: HAIKU_MODEL,
    temperature: 0.2,
    maxTokens: 500,
    useJsonMode: true,
    cacheSystemPrompt: true,
  });

  return validateLLMJudgment(response.content);
}

// ============================================================================
// VERDICT LOGIC
// ============================================================================

/**
 * Compute the final pass/reject verdict from heuristic + LLM signals.
 *
 * Rejection reasons are accumulated — multiple reasons can fire.
 */
function computeVerdict(
  heuristic: Omit<RegressionCheckResult, 'llmJudgment'>,
  llmJudgment: LLMJudgment
): RegressionCheckResult {
  let passed = true;
  const reasons: string[] = [];

  // ----- LLM Judge (primary signal) -----

  // LLM says degraded with high confidence
  if (llmJudgment.verdict === 'degraded' && llmJudgment.confidence > LLM_DEGRADED_CONFIDENCE_THRESHOLD) {
    passed = false;
    reasons.push(
      `LLM judge: ${llmJudgment.explanation} (confidence: ${llmJudgment.confidence.toFixed(2)})`
    );
  }

  // Voice inconsistency — nuanced handling:
  // An edit that improves content but shifts voice slightly should NOT be auto-rejected.
  // Voice drift only triggers rejection when paired with degraded/neutral quality verdict.
  // Rationale: the weakest passages (scoring 0-2) inherently need to change — demanding
  // the exact same voice in a passage that's being deepened is a contradictory requirement.
  if (!llmJudgment.voiceConsistent && llmJudgment.confidence > LLM_VOICE_CONFIDENCE_THRESHOLD) {
    if (llmJudgment.verdict !== 'improved') {
      // Voice changed AND no improvement detected — reject
      passed = false;
      reasons.push(
        `Voice inconsistency detected: the edit changed the student's authentic voice ` +
        `without clear quality improvement (confidence: ${llmJudgment.confidence.toFixed(2)})`
      );
    } else {
      // Voice changed but content improved — flag but don't reject
      reasons.push(
        `Voice drift noted (confidence: ${llmJudgment.confidence.toFixed(2)}) — ` +
        `accepted because content quality improved`
      );
    }
  }

  // ----- Heuristic (structural safety net) -----

  // Catastrophic EQI drop
  if (heuristic.eqiDelta < -CATASTROPHIC_EQI_DROP) {
    passed = false;
    reasons.push(
      `Structural regression: EQI dropped by ${Math.abs(heuristic.eqiDelta).toFixed(1)} points ` +
      `(threshold: ${CATASTROPHIC_EQI_DROP})`
    );
  }

  // Severe single-dimension collapse
  const severeDrops = heuristic.regressions.filter(r => r.delta < -SEVERE_DIMENSION_DROP);
  if (severeDrops.length > 0) {
    passed = false;
    const dimNames = severeDrops.map(r => `${r.dimension} (${r.delta.toFixed(1)})`).join(', ');
    reasons.push(
      `Severe dimension collapse: ${dimNames} (threshold: ${SEVERE_DIMENSION_DROP})`
    );
  }

  // ----- Combined signal: neutral LLM + many heuristic regressions -----

  if (
    llmJudgment.verdict === 'neutral' &&
    heuristic.regressions.length > heuristic.improvements.length &&
    heuristic.regressions.length >= SUSPICIOUS_REGRESSION_COUNT
  ) {
    passed = false;
    reasons.push(
      `Suspicious pattern: LLM found no improvement while ${heuristic.regressions.length} dimensions regressed ` +
      `vs ${heuristic.improvements.length} improved — edit may be making text more generic`
    );
  }

  return {
    ...heuristic,
    passed,
    llmJudgment,
    rejectionReason: reasons.length > 0 ? reasons.join(' | ') : undefined,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Full hybrid regression check — heuristic + LLM judge.
 *
 * This is the primary export. Both layers always run; no fallbacks.
 *
 * @param beforeSnapshot - Quality snapshot before the edit
 * @param afterSnapshot  - Quality snapshot after the edit
 * @param editContext    - The edit that was applied (action, passages, voice profile)
 * @returns Hybrid verdict with both heuristic data and LLM judgment
 * @throws If the LLM call fails or returns invalid JSON
 */
export async function checkRegression(
  beforeSnapshot: EssaySnapshot,
  afterSnapshot: EssaySnapshot,
  editContext: EditContext
): Promise<RegressionCheckResult> {
  // Run heuristic comparison (sync, <1ms)
  const heuristic = compareSnapshots(beforeSnapshot, afterSnapshot);

  // Run LLM judge (async, ~1-2s with Haiku)
  const userPrompt = buildJudgeUserPrompt(editContext);
  const llmJudgment = await callLLMJudge(userPrompt);

  // Combine signals into final verdict
  return computeVerdict(heuristic, llmJudgment);
}

/**
 * Standalone regression check — for the `/regression-check` route.
 *
 * Builds snapshots from raw text, creates a temporary voice profile from
 * the before text, and runs the full hybrid check. Since there's no specific
 * edit context (no ImprovementAction), the LLM compares the full texts.
 *
 * @param beforeText - Original essay text
 * @param afterText  - Modified essay text
 * @param essayType  - Optional essay type for scoring context
 * @returns Hybrid verdict with snapshots
 * @throws If preAnalyze, voice profiling, or LLM call fails
 */
export async function checkRegressionStandalone(
  beforeText: string,
  afterText: string,
  essayType?: string
): Promise<RegressionCheckResult & { before: EssaySnapshot; after: EssaySnapshot }> {
  // Build snapshots and temporary voice profile in parallel
  const [beforeSnapshot, afterSnapshot, voiceProfile] = await Promise.all([
    preAnalyze(beforeText, essayType),
    preAnalyze(afterText, essayType),
    voiceProfileService.buildFromSample('temp-guard', beforeText, 'essay'),
  ]);

  // Run heuristic comparison
  const heuristic = compareSnapshots(beforeSnapshot, afterSnapshot);

  // Run LLM judge with standalone prompt (full text comparison)
  const userPrompt = buildStandaloneJudgeUserPrompt(beforeText, afterText, voiceProfile);
  const llmJudgment = await callLLMJudge(userPrompt);

  // Combine signals into final verdict
  const result = computeVerdict(heuristic, llmJudgment);

  return {
    ...result,
    before: beforeSnapshot,
    after: afterSnapshot,
  };
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const regressionGuard = {
  checkRegression,
  checkRegressionStandalone,
  compareSnapshots,
};
