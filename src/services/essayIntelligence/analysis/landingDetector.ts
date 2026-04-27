// ============================================================================
// LANDING DETECTOR (Phase 1 D-1.3)
// ============================================================================
// Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_ITERATION_LOOP_DESIGN.md
//   §5 (the heart of the loop), §5.1 (3 signals), §5.2 (LLM-judged
//   combiner — NOT a formula), §5.3 (asymmetric tolerance: prefer-not-
//   to-repeat over prefer-to-cover).
// Q4 (locked, Tue 2026-04-26): confidence floor 0.7 to count as
//   `addressed`; below → `partially_addressed`.
//
// Single Haiku call per (TaughtMove, iteration). Structured output
// enforced via JSON mode + airtight runtime schema validation.
//
// D-1.3 is the SKELETON: API surface + validation + Q4 enforcement +
// the call wiring. The prompt body lives at
// `prompts/landingDetector.prompt.ts` (D-1.4) which lands separately
// after 3+ rounds of revision. The end-to-end calibration check
// against real Haiku is D-1.5 ($0.50–$1.00 mid-build touchpoint).
//
// Failure surface (per the no-fallback charter):
//   - Haiku call failure → throw; caller halts.
//   - JSON parse failure → throw with raw output in error context.
//   - Schema-validation failure (missing field, wrong type, status
//     not in enum, confidence outside [0,1], signalsUsed has unknown
//     entry) → throw with a diagnostic naming the violation.
// We do NOT silently coerce missing fields, fallback to a default
// status, or guess confidence — every failure mode is visible.

import { callClaude } from '../../../lib/llm/claude';
import { emitStepStart, emitStepSuccess, emitStepFailure } from '../telemetry/iterationTelemetry';
import { LANDING_DETECTOR_PROMPT_VERSION, buildLandingDetectorUserPrompt, LANDING_DETECTOR_SYSTEM_PROMPT } from './prompts/landingDetector.prompt';
import type { TaughtMove } from '../profileTypes';

// ─── Constants ─────────────────────────────────────────────────────────

/** Haiku 4.5 — fast, structured-output capable, designed for diagnosis. */
export const LANDING_DETECTOR_MODEL = 'claude-haiku-4-5-20251001';

/** Q4 (locked): confidence floor for `addressed`. */
export const ADDRESSED_CONFIDENCE_FLOOR = 0.7;

/**
 * Output token budget. Landing detector reasoning is short — a few
 * sentences plus the structured fields — so a tight cap protects
 * against runaway prose.
 */
const MAX_OUTPUT_TOKENS = 800;

// ─── Types ─────────────────────────────────────────────────────────────

/**
 * Input to the landing detector. Three signals A/B/C per
 * ITERATION_LOOP_DESIGN §5.1; A and edit are required, B and C are
 * optional (some iterations have only the edit).
 */
export interface LandingDetectorInput {
  /** The move whose landing is being detected. */
  priorTaughtMove: TaughtMove;
  /**
   * Signal A — edit vs critique. The student's edit at the move's
   * location, with a significance classification.
   */
  edit: {
    oldText: string;
    newText: string;
    significance: 'minor' | 'moderate' | 'significant' | 'transformative';
  };
  /**
   * Signal B — re-detection. Whether the new analysis pass at the same
   * location still flags the symptom the move was teaching about.
   * Optional: present only when re-analysis has run on the post-edit
   * paragraph.
   */
  newAnalysisAtLocation?: {
    symptomFlagged: boolean;
    reasoning?: string;
  };
  /**
   * Signal C — chat behavior. Whether the student engaged with the
   * move in conversation, and what mood they brought. Optional: present
   * only when the Conversator has captured chat turns referencing the
   * move (Phase 3+).
   */
  chatBehavior?: {
    engaged: boolean;
    mood: 'curious' | 'frustrated' | 'dismissive' | 'neutral';
    raw?: string;
  };
}

/**
 * Output from the landing detector. Four classifications per
 * ITERATION_LOOP_DESIGN §5.2; `pending` is NOT a valid output here
 * (pending is the absence of a detector result, not a classification
 * the detector emits).
 *
 * `signalsUsed` audits which signals the LLM-judged combiner relied
 * on. Useful for calibration drift detection — if the detector reports
 * `signalsUsed: ['edit_vs_critique']` despite B and C being available,
 * the prompt may be ignoring those signals.
 */
export interface LandingDetectorOutput {
  status: 'addressed' | 'partially_addressed' | 'unaddressed' | 'changed_target';
  /** 0-1 confidence in the classification. */
  confidence: number;
  /** Free-text reasoning grounded in the inputs. */
  reasoning: string;
  /** Which signals fed the LLM-judged combiner. */
  signalsUsed: Array<'edit_vs_critique' | 'redetection' | 'chat_behavior'>;
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Run the landing detector on a single (priorTaughtMove, edit) pair.
 *
 * Single Haiku call per pair. Structured-output JSON mode. Airtight
 * runtime validation; throws on any schema deviation.
 *
 * Q4 enforcement: if the detector returns `addressed` with confidence
 * below `ADDRESSED_CONFIDENCE_FLOOR` (0.7), downgrades the status to
 * `partially_addressed` BEFORE returning. The original confidence is
 * preserved; only the status changes. Per ITERATION_LOOP_DESIGN §5.3:
 * "Asymmetric tolerance: prefer-not-to-repeat over prefer-to-cover."
 *
 * Telemetry: emitStepStart at call entry; emitStepSuccess on clean
 * return (with cost + tokens); emitStepFailure on any throw before
 * re-throwing. Iteration tagged via the priorTaughtMove's
 * taughtAtIteration + 1 (we're detecting landing on the iteration
 * AFTER the move was delivered).
 */
export async function detectLanding(
  input: LandingDetectorInput,
): Promise<LandingDetectorOutput> {
  validateInput(input);

  const detectingAtIteration = input.priorTaughtMove.taughtAtIteration + 1;
  const { stepId } = emitStepStart(detectingAtIteration, 'landingDetector', {
    model: LANDING_DETECTOR_MODEL,
  });

  try {
    const response = await callClaude({
      model: LANDING_DETECTOR_MODEL,
      systemPrompt: LANDING_DETECTOR_SYSTEM_PROMPT,
      userPrompt: buildLandingDetectorUserPrompt(input),
      useJsonMode: true,
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.0,
    });

    const parsed = parseAndValidate(response.content, response);
    const output = applyConfidenceFloor(parsed);

    // Compute approximate cost (the build cost ledger captures the
    // exact cost via claude.ts's own recordCost wiring — this duplicate
    // is for telemetry visibility, not double-billing).
    emitStepSuccess(stepId, {
      model: LANDING_DETECTOR_MODEL,
      tokenUsage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheReadTokens: response.usage.cache_read_input_tokens ?? undefined,
        cacheWriteTokens: response.usage.cache_creation_input_tokens ?? undefined,
      },
    });

    return output;
  } catch (err) {
    emitStepFailure(stepId, err as Error, {
      code: 'landing_detector_failure',
      extra: {
        priorMoveId: input.priorTaughtMove.id,
        editSignificance: input.edit.significance,
        promptVersion: LANDING_DETECTOR_PROMPT_VERSION,
      },
    });
    // Re-throw — caller (priorAnnotationsBuilder, D-1.6) halts the
    // iteration. No fallback to a default classification.
    throw err;
  }
}

// ─── Validation helpers ────────────────────────────────────────────────

/**
 * Validate the input shape before calling Haiku. Throws fail-fast on
 * missing required fields. Catches caller-side bugs (e.g.,
 * priorTaughtMove from a malformed checkpoint, edit.significance not
 * in the expected enum) before spending a Haiku call on them.
 */
function validateInput(input: LandingDetectorInput): void {
  if (!input || typeof input !== 'object') {
    throw new Error('[landingDetector] input is missing or not an object.');
  }
  if (!input.priorTaughtMove || typeof input.priorTaughtMove !== 'object') {
    throw new Error('[landingDetector] input.priorTaughtMove is missing or not an object.');
  }
  if (typeof input.priorTaughtMove.id !== 'string' || input.priorTaughtMove.id.length === 0) {
    throw new Error('[landingDetector] input.priorTaughtMove.id is missing or empty.');
  }
  if (typeof input.priorTaughtMove.taughtAtIteration !== 'number') {
    throw new Error('[landingDetector] input.priorTaughtMove.taughtAtIteration must be a number.');
  }
  if (!input.edit || typeof input.edit !== 'object') {
    throw new Error('[landingDetector] input.edit is missing or not an object.');
  }
  if (typeof input.edit.oldText !== 'string') {
    throw new Error('[landingDetector] input.edit.oldText must be a string.');
  }
  if (typeof input.edit.newText !== 'string') {
    throw new Error('[landingDetector] input.edit.newText must be a string.');
  }
  const validSignificance = ['minor', 'moderate', 'significant', 'transformative'];
  if (!validSignificance.includes(input.edit.significance)) {
    throw new Error(
      `[landingDetector] input.edit.significance must be one of ${validSignificance.join(' | ')}; ` +
        `got ${JSON.stringify(input.edit.significance)}.`,
    );
  }
  if (input.newAnalysisAtLocation !== undefined) {
    if (typeof input.newAnalysisAtLocation !== 'object' || input.newAnalysisAtLocation === null) {
      throw new Error('[landingDetector] input.newAnalysisAtLocation must be an object when present.');
    }
    if (typeof input.newAnalysisAtLocation.symptomFlagged !== 'boolean') {
      throw new Error('[landingDetector] input.newAnalysisAtLocation.symptomFlagged must be a boolean.');
    }
  }
  if (input.chatBehavior !== undefined) {
    if (typeof input.chatBehavior !== 'object' || input.chatBehavior === null) {
      throw new Error('[landingDetector] input.chatBehavior must be an object when present.');
    }
    if (typeof input.chatBehavior.engaged !== 'boolean') {
      throw new Error('[landingDetector] input.chatBehavior.engaged must be a boolean.');
    }
    const validMoods = ['curious', 'frustrated', 'dismissive', 'neutral'];
    if (!validMoods.includes(input.chatBehavior.mood)) {
      throw new Error(
        `[landingDetector] input.chatBehavior.mood must be one of ${validMoods.join(' | ')}; ` +
          `got ${JSON.stringify(input.chatBehavior.mood)}.`,
      );
    }
  }
}

/**
 * Parse Haiku's JSON response and validate against the
 * LandingDetectorOutput schema. Airtight: every field checked, every
 * enum value validated, confidence range checked.
 *
 * On any deviation, throws with a diagnostic that includes the raw
 * response (truncated to 500 chars) so the operator can debug.
 */
function parseAndValidate(content: string, rawResponse: { content: string }): LandingDetectorOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (parseErr) {
    throw new Error(
      `[landingDetector] failed to parse Haiku JSON output: ${(parseErr as Error).message}. ` +
        `Raw output (truncated): ${content.slice(0, 500)}`,
    );
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`[landingDetector] parsed output is not an object. Raw: ${content.slice(0, 500)}`);
  }
  const o = parsed as Record<string, unknown>;

  const validStatuses = ['addressed', 'partially_addressed', 'unaddressed', 'changed_target'];
  if (typeof o.status !== 'string' || !validStatuses.includes(o.status)) {
    throw new Error(
      `[landingDetector] output.status must be one of ${validStatuses.join(' | ')}; ` +
        `got ${JSON.stringify(o.status)}. Raw: ${content.slice(0, 500)}`,
    );
  }
  if (typeof o.confidence !== 'number' || !Number.isFinite(o.confidence)) {
    throw new Error(
      `[landingDetector] output.confidence must be a finite number; got ${typeof o.confidence}. ` +
        `Raw: ${content.slice(0, 500)}`,
    );
  }
  if (o.confidence < 0 || o.confidence > 1) {
    throw new Error(
      `[landingDetector] output.confidence must be in [0, 1]; got ${o.confidence}. ` +
        `Raw: ${content.slice(0, 500)}`,
    );
  }
  if (typeof o.reasoning !== 'string' || o.reasoning.length === 0) {
    throw new Error(
      `[landingDetector] output.reasoning must be a non-empty string. Raw: ${content.slice(0, 500)}`,
    );
  }
  if (!Array.isArray(o.signalsUsed)) {
    throw new Error(
      `[landingDetector] output.signalsUsed must be an array. Raw: ${content.slice(0, 500)}`,
    );
  }
  const validSignals = ['edit_vs_critique', 'redetection', 'chat_behavior'];
  for (const sig of o.signalsUsed) {
    if (typeof sig !== 'string' || !validSignals.includes(sig)) {
      throw new Error(
        `[landingDetector] output.signalsUsed[*] must be one of ${validSignals.join(' | ')}; ` +
          `got ${JSON.stringify(sig)}. Raw: ${content.slice(0, 500)}`,
      );
    }
  }
  if (o.signalsUsed.length === 0) {
    throw new Error(
      `[landingDetector] output.signalsUsed must be non-empty — the LLM should report which signal(s) it used. ` +
        `Raw: ${content.slice(0, 500)}`,
    );
  }

  // Touch the rawResponse param to satisfy the unused-arg linter; the
  // raw response is captured in error contexts above when validation
  // fails so we keep the parameter for future use.
  void rawResponse;

  return {
    status: o.status as LandingDetectorOutput['status'],
    confidence: o.confidence,
    reasoning: o.reasoning,
    signalsUsed: o.signalsUsed as LandingDetectorOutput['signalsUsed'],
  };
}

/**
 * Apply Q4's asymmetric-tolerance floor: if the detector returned
 * `addressed` but confidence is below 0.7, downgrade the status to
 * `partially_addressed`. Confidence value is preserved unchanged —
 * the floor only affects classification, not the underlying number.
 *
 * Per ITERATION_LOOP_DESIGN §5.3: "Asymmetric tolerance: prefer-not-
 * to-repeat over prefer-to-cover." A weak `addressed` becomes
 * `partially_addressed` so the next iteration's L5 prompt knows the
 * move may still need teaching against, but doesn't aggressively
 * re-cover ground that mostly landed.
 *
 * Exported for unit testing of the floor logic in isolation.
 */
export function applyConfidenceFloor(output: LandingDetectorOutput): LandingDetectorOutput {
  if (output.status === 'addressed' && output.confidence < ADDRESSED_CONFIDENCE_FLOOR) {
    return {
      ...output,
      status: 'partially_addressed',
    };
  }
  return output;
}

// ─── Test helpers ──────────────────────────────────────────────────────

/**
 * Test-only: parse + validate a raw JSON string AS IF it came from
 * Haiku. Lets unit tests exercise the validation paths without
 * spinning up a real call. Exported under the __ convention to signal
 * test-only access.
 */
export function __parseAndValidateForTesting(rawJson: string): LandingDetectorOutput {
  return parseAndValidate(rawJson, { content: rawJson });
}
