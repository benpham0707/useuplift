/**
 * Writing Enhancement Orchestrator — The Brain (v2)
 *
 * Coordinates the full enhancement loop with two critical improvements
 * over v1:
 *
 *   1. RE-PLAN AFTER EACH EDIT. The planner runs on the CURRENT text
 *      every iteration, so each step targets passages that actually
 *      exist and deprioritizes already-improved dimensions.
 *
 *   2. VOICE IS ALWAYS-ON. A StudentVoiceProfile is built or loaded
 *      before any edits begin. If voice profile construction fails,
 *      the entire enhance call throws — never proceed without voice.
 *
 * Enhancement loop per step:
 *   1. planImprovements(currentSnapshot) → top-1 action  [Haiku ~$0.002]
 *   2. Validate targetPassage exists in currentText       [0ms]
 *   3. inlineEditorService.applyCommand(...)              [Sonnet ~$0.01]
 *   4. preAnalyze(editedText) → afterSnapshot             [deterministic ~200ms]
 *   5. checkRegression(before, after, editContext)        [Haiku ~$0.002]
 *   6. Accept → update currentText; Reject → log and continue
 *   7. Loop back to step 1 with the updated text
 *
 * Total per step: ~$0.016, ~3s
 *
 * Design principles:
 *   - No fallbacks. If anything fails, throw. Errors > degraded quality.
 *   - No fuzzy matching. If the LLM quotes a passage that doesn't exist
 *     in the text, skip it (input validation, not a fallback).
 *   - Voice goes everywhere: inline editor and regression guard context.
 *   - The orchestrator coordinates — it doesn't analyze or judge.
 *
 * Dependencies: preAnalyzer, improvementPlanner, regressionGuard,
 *               inlineEditorService, voiceProfileService, sessionContextService
 */

import type {
  EnhanceRequest,
  EnhanceResult,
  EnhancementStepResult,
  RegressionCheckResult,
} from './types';
import type { StudentVoiceProfile } from '../voiceProfile/types';
import { preAnalyze } from './preAnalyzer';
import { planImprovements } from './improvementPlanner';
import { checkRegression } from './regressionGuard';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_STEPS = 3;
const MAX_ALLOWED_STEPS = 8;

/**
 * Stop the loop after this many consecutive failures (passage not found
 * or rejected by guard). Indicates a systemic problem — the LLM is
 * consistently producing bad plans or the text is resistant to improvement.
 */
const MAX_CONSECUTIVE_FAILURES = 3;

// ============================================================================
// ORCHESTRATOR
// ============================================================================

export class WritingEnhancementOrchestrator {
  /**
   * Run the full enhancement loop.
   *
   * Throws if:
   *   - Voice profile cannot be built or loaded
   *   - Pre-analysis fails
   *   - Any internal service throws an unrecoverable error
   *
   * Does NOT throw if:
   *   - Individual edit steps are rejected (normal operation)
   *   - The planner returns no actions (essay is already strong)
   *   - A target passage isn't found (skipped, counts as failure)
   */
  async enhance(request: EnhanceRequest): Promise<EnhanceResult> {
    const startTime = Date.now();
    const maxSteps = Math.min(request.maxSteps ?? DEFAULT_MAX_STEPS, MAX_ALLOWED_STEPS);

    // ------------------------------------------------------------------
    // 1. Build voice profile (REQUIRED — never skip, never degrade)
    // ------------------------------------------------------------------
    const voiceProfile = await this.loadOrBuildVoiceProfile(request);

    // ------------------------------------------------------------------
    // 2. Pre-analyze the original text
    // ------------------------------------------------------------------
    const beforeSnapshot = await preAnalyze(request.text, request.essayType);

    let currentText = request.text;
    let currentSnapshot = beforeSnapshot;

    const completedSteps: EnhancementStepResult[] = [];
    const rejectedSteps: EnhancementStepResult[] = [];
    let totalCost = 0;
    let consecutiveFailures = 0;

    // Track passages that were tried and rejected/not-found, so the planner
    // doesn't keep targeting the same text in a loop.
    const excludedPassages: string[] = [];

    // ------------------------------------------------------------------
    // 3. Enhancement loop — re-plan after EVERY accepted edit
    // ------------------------------------------------------------------
    while (completedSteps.length < maxSteps) {
      // Stop if too many consecutive failures
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn(
          '[EnhancementOrchestrator] Stopping: %d consecutive failures (passage not found or rejected)',
          consecutiveFailures,
        );
        break;
      }

      // 3a. Plan improvements for the CURRENT text (re-plan each iteration)
      //     Pass excludedPassages so the planner skips already-tried targets.
      const plan = await planImprovements(currentSnapshot, {
        focusDimensions: request.focusDimensions,
        maxActions: 1 + excludedPassages.length, // Ask for extras so we can skip excluded ones
        essayType: request.essayType,
      });

      // Nothing left to improve — the essay is strong across all dimensions
      if (plan.actions.length === 0) {
        break;
      }

      // Pick the first action that doesn't target an already-excluded passage.
      const action = plan.actions.find(a =>
        !excludedPassages.some(excluded =>
          a.targetPassage.includes(excluded) || excluded.includes(a.targetPassage)
        )
      );

      if (!action) {
        // All planned actions target excluded passages — nothing new to try
        console.warn(
          '[EnhancementOrchestrator] All %d planned actions target excluded passages. Stopping.',
          plan.actions.length,
        );
        break;
      }

      // 3b. Validate that the target passage exists in the current text
      const passageIndex = currentText.indexOf(action.targetPassage);
      if (passageIndex < 0) {
        // The planner quoted a passage that doesn't exist in the text.
        // This is NOT a fallback — it's input validation. Skip and re-plan.
        console.warn(
          '[EnhancementOrchestrator] Target passage not found in current text (dimension: %s, passage length: %d). Skipping.',
          action.dimension,
          action.targetPassage.length,
        );

        rejectedSteps.push({
          action,
          editedText: currentText,
          passed: false,
          regressionCheck: buildPassageNotFoundResult(),
          teachingNote: '',
          cost: 0,
        });

        excludedPassages.push(action.targetPassage);
        consecutiveFailures++;
        continue;
      }

      // 3c. Apply inline edit (Sonnet call)
      const { inlineEditorService } = await import('@/services/inlineEditor');
      const editResult = await inlineEditorService.applyCommand({
        selectedText: action.targetPassage,
        fullDocument: currentText,
        selectionStart: passageIndex,
        selectionEnd: passageIndex + action.targetPassage.length,
        command: action.command,
        voiceProfile,
        essayType: request.essayType,
        additionalContext: `Focus: ${action.dimension}. ${action.rationale}`,
        sessionId: request.sessionId,
      });

      const stepCost = editResult.cost ?? 0;

      // 3d. Build edited text by splicing in the primary (safe) suggestion
      const editedText =
        currentText.slice(0, passageIndex) +
        editResult.primary.text +
        currentText.slice(passageIndex + action.targetPassage.length);

      // 3e. Re-analyze the edited text
      const afterSnapshot = await preAnalyze(editedText, request.essayType);

      // 3f. Regression guard check (hybrid: heuristic + LLM judge)
      const regressionResult = await checkRegression(currentSnapshot, afterSnapshot, {
        action,
        beforePassage: action.targetPassage,
        afterPassage: editResult.primary.text,
        voiceProfile,
        essayType: request.essayType,
      });

      // 3g. Accept or reject
      const stepResult: EnhancementStepResult = {
        action,
        editedText: regressionResult.passed ? editedText : currentText,
        passed: regressionResult.passed,
        regressionCheck: regressionResult,
        teachingNote: editResult.teachingNote ?? '',
        cost: stepCost,
      };

      totalCost += stepCost;

      if (regressionResult.passed) {
        // Edit accepted — update current state for next iteration
        currentText = editedText;
        currentSnapshot = afterSnapshot;
        completedSteps.push(stepResult);
        consecutiveFailures = 0;
        // Clear excluded passages on success — the text has changed,
        // so previous rejections may no longer apply
        excludedPassages.length = 0;
      } else {
        // Edit rejected — exclude this passage from future attempts
        rejectedSteps.push(stepResult);
        excludedPassages.push(action.targetPassage);
        consecutiveFailures++;
      }
    }

    // ------------------------------------------------------------------
    // 4. Final snapshot
    // ------------------------------------------------------------------
    const afterSnapshot = completedSteps.length > 0
      ? await preAnalyze(currentText, request.essayType)
      : beforeSnapshot;

    return {
      originalText: request.text,
      improvedText: currentText,
      before: beforeSnapshot,
      after: afterSnapshot,
      eqiGain: Math.round((afterSnapshot.eqi - beforeSnapshot.eqi) * 10) / 10,
      steps: completedSteps,
      rejectedSteps,
      totalCost: Math.round(totalCost * 10000) / 10000,
      totalTimeMs: Date.now() - startTime,
    };
  }

  // ============================================================================
  // VOICE PROFILE — ALWAYS-ON
  // ============================================================================

  /**
   * Load or build a voice profile. NEVER returns null/undefined.
   * Throws if building fails — do NOT proceed without voice.
   *
   * Priority:
   *   1. Session exists + stored profile → use it
   *   2. Session exists + no stored profile → build from essay text
   *   3. No session → build temporary profile from essay text
   *   4. Any failure → throw (never silently skip)
   */
  private async loadOrBuildVoiceProfile(request: EnhanceRequest): Promise<StudentVoiceProfile> {
    const { voiceProfileService } = await import('@/services/voiceProfile');

    // Try loading from session
    if (request.sessionId) {
      const { sessionContextService } = await import('@/services/sessionContext');
      const session = sessionContextService.getSession(request.sessionId);

      if (session?.userId) {
        // Attempt to load a stored profile
        const stored = await voiceProfileService.load(session.userId);
        if (stored) return stored;

        // No stored profile — build one from the essay text
        return voiceProfileService.buildFromSample(session.userId, request.text, 'essay');
      }
    }

    // No session — build a temporary profile from the essay text
    return voiceProfileService.buildFromSample('temp-enhance', request.text, 'essay');
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build a RegressionCheckResult for the "passage not found" case.
 * This is NOT a fallback — it's a structured rejection for tracking.
 */
function buildPassageNotFoundResult(): RegressionCheckResult {
  return {
    passed: false,
    dimensionDeltas: {},
    eqiDelta: 0,
    regressions: [],
    improvements: [],
    llmJudgment: {
      verdict: 'neutral',
      confidence: 0,
      explanation: 'Target passage not found in current text. The planner quoted a non-existent passage.',
      voiceConsistent: true,
      specificityChange: 'maintained',
      authenticityChange: 'maintained',
    },
    rejectionReason: 'Target passage not found in current text.',
  };
}

// ============================================================================
// SINGLETON
// ============================================================================

export const writingEnhancementOrchestrator = new WritingEnhancementOrchestrator();
