/**
 * Re-Analysis Orchestrator — Launch 3 Edit-Aware Pipeline
 *
 * Coordinates the Launch 3 lifecycle:
 *   processEdit()             — handles essay text changes
 *   processCoachingTurn()     — handles L6 conversation
 *   triggerReanalysis()       — manual or automatic re-analysis
 *
 * Uses existing analyzeEssay() from analysisOrchestrator for comprehensive passes.
 * Uses focusedAnalyzer for surgical focused passes.
 * Coordinates version tracking across the lifecycle.
 *
 * Key design decisions:
 * - NOT a singleton — each essay session creates its own instance via
 *   createReanalysisOrchestrator() factory.
 * - Concurrency safety: isProcessing flag + single-slot edit queue. The queue
 *   holds at most one pending edit (the latest). Older superseded edits are dropped.
 * - Debounce: rapid keystrokes are coalesced — processing does not begin until
 *   the essay has been quiescent for debounceMs milliseconds.
 * - No LLM calls in this file — pure orchestration.
 */

import type {
  EssayProfile,
  CheckpointStore,
  EditUnderstanding,
  EditUnderstandingOutput,
  VersionRecord,
  ConversationInsight,
  ReanalysisBrief,
  Finding,
  DeltaSynthesisRequest,
  HolisticSectionType,
  CarryForwardDecision,
} from '../profileTypes';

// Coordinator + Router
import { EssayProfileCoordinator } from '../profileManager/essayProfileManager';
import { FindingStore } from '../findings/findingStore';
// InMemoryCheckpointStore import removed — checkpoint store is now preserved via this.checkpointStore
import { ProfileRouter } from '../profileManager/profileRouter';

// Launch 2 pipeline — analyzeEssay is the top-level standalone function added below
import { analyzeEssay } from './analysisOrchestrator';
import type { PipelineInput, PipelineResult, LayerCost } from './analysisOrchestrator';

// =============================================================================
// Launch 3 services — real imports now enabled
// =============================================================================

import { editUnderstandingService } from './editUnderstandingService';
import type { EditUnderstandingResult } from './editUnderstandingService';
import { createVersionTracker } from '../versionTracker';
import type { VersionTracker, ReanalysisTrigger } from '../versionTracker';
import { FocusedAnalyzer, focusedAnalyzer } from './focusedAnalyzer';
import type { FocusedAnalysisResult } from './focusedAnalyzer';
import { coachingService } from '../coaching/coachingService';
import type { ConversationTurn, CoachingResult } from '../coaching/coachingService';
import type { CoachingSessionMemory, LearningStyleObservations, CognitiveAssessment, CoachingQualitySignals, CoachingMode } from '../profileTypes';
import { detectCoachingMode } from '../coaching/modeDetection';
import { holisticSynthesisService } from './holisticSynthesis';

// [D-1.12 closure 2026-04-29] Iteration telemetry for halt-on-error
// surfacing. Failures in focused-mode / comprehensive-mode catches now
// emit structured iteration events so the audit trail captures the
// rejection (parity with F-2's AO First Read closure pattern).
import { emitIterationEvent } from '../telemetry/iterationTelemetry';
import { getCurrentIteration } from '../profileManager/essayProfileManager';

// Re-export ConversationTurn so callers can use it without importing from coachingService
export type { ConversationTurn };

// ============================================================================
// RESULT TYPES
// ============================================================================

// Re-export for convenience so callers don't need to import from two places
export type { LayerCost } from './analysisOrchestrator';
export type { ReanalysisBrief } from '../profileTypes';

/**
 * Result returned by processEdit().
 */
export interface EditProcessResult {
  /** The edit understanding produced by the LLM (or mechanical diff on failure) */
  editOutput: EditUnderstandingOutput;
  /** Which analysis mode was chosen / executed */
  mode: 'focused' | 'comprehensive' | 'deferred';
  /** Focused analysis result (if mode === 'focused' and it completed) */
  focusedResult?: FocusedAnalysisResult;
  /** Whether a full comprehensive re-analysis was triggered */
  reanalysisTriggered: boolean;
  /** Brief used for re-analysis (present when reanalysisTriggered === true) */
  reanalysisBrief?: ReanalysisBrief;
  /** Total cost in USD across all sub-calls */
  totalCost: number;
  /** Per-layer cost breakdown */
  costBreakdown: LayerCost[];

  /**
   * [D-1.12 C3+C4 closure 2026-04-29] Why a return shape with
   * `mode === 'deferred'` or `reanalysisTriggered: false` was produced.
   *
   * Pre-fix the orchestrator returned `mode: 'deferred'` for THREE
   * semantically-distinct conditions: (i) version-tracker policy chose
   * to defer, (ii) the focused analyzer threw and we silently absorbed,
   * (iii) the comprehensive triggerReanalysis threw and we silently
   * absorbed. Same return shape, three different realities. Consumer
   * could not route differently on each.
   *
   * `deferReason` is the discriminator. When the consumer sees
   * `deferReason === 'policy_defer'`, it's a clean policy decision and
   * the caller can retry / surface as "we'll get to this." When it's
   * `'focused_failed'` or `'comprehensive_failed'`, an inner sub-layer
   * crashed and the caller should surface the `error` field's diagnostic
   * to the user / logs / a 5xx response.
   *
   * `error` is populated alongside the failure variants. Consumers
   * MUST check `deferReason` before reading `error`; the field is
   * undefined on the policy-defer path and on the success paths.
   *
   * Backwards compatibility: every pre-existing consumer of
   * `EditProcessResult.mode` continues to work unchanged. The new
   * fields are additive.
   */
  deferReason?: 'policy_defer' | 'focused_failed' | 'comprehensive_failed';
  error?: {
    layer: 'focusedAnalyzer' | 'triggerReanalysis';
    message: string;
    code?: string;
  };
}

/**
 * Result returned by processCoachingTurn().
 */
export interface CoachingTurnResult {
  /** Whether the turn succeeded */
  success: boolean;
  /** Error message if success === false */
  error?: string;
  /** The AI's response to the student (null on failure) */
  response: string | null;
  /** ID of the extracted insight (if any) */
  insightId?: string;
  /** Whether the conversation caused a meaningful profile deepening */
  profileDeepened: boolean;
  /** Total cost in USD */
  totalCost: number;
  /** Per-layer cost breakdown */
  costBreakdown: LayerCost[];
  /** Improvement 6: Session memory — pass back on the next turn */
  sessionMemory?: CoachingSessionMemory;
  /** Improvement 6: Learning style observations — pass back on the next turn */
  learningStyle?: LearningStyleObservations;
  /** Improvement 6: LLM-assessed cognitive state for this turn */
  cognitiveAssessment?: CognitiveAssessment;
  /** Improvement 6: Quality signals (every 3 turns) */
  qualitySignals?: CoachingQualitySignals;
}

/**
 * Result returned by triggerReanalysis().
 */
export interface ReanalysisResult {
  /** The brief that described accumulated changes */
  brief: ReanalysisBrief;
  /** The full pipeline result (including new profile snapshot) */
  pipelineResult: PipelineResult;
  /** The version record closed out by this re-analysis */
  versionRecord: VersionRecord;
  /** Total cost in USD */
  totalCost: number;
}

/**
 * Whether a re-analysis should be suggested to the student.
 */
export interface ReanalysisSuggestion {
  shouldTrigger: boolean;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

// ============================================================================
// INTERNAL: debounce entry
// ============================================================================

/**
 * Entry stored in debounceTimers map.
 * Stores both the timer handle and the reject callback so we can cancel properly.
 */
interface DebounceEntry {
  timer: ReturnType<typeof setTimeout>;
  reject: (reason: unknown) => void;
}

// ============================================================================
// INTERNAL: pending edit queue
// ============================================================================

/** One pending edit — only the latest is ever kept. */
interface PendingEdit {
  oldText: string;
  newText: string;
  conversationContext?: string;
  resolve: (result: EditProcessResult) => void;
  reject: (error: unknown) => void;
}

// ============================================================================
// REANALYSIS ORCHESTRATOR
// ============================================================================

export class ReanalysisOrchestrator {
  private coordinator: EssayProfileCoordinator;
  private router: ProfileRouter;
  private versionTracker: VersionTracker;
  private essayId: string;

  /** Preserved checkpoint store — reused across coordinator rebuilds (e.g., after reanalysis) */
  private checkpointStore: CheckpointStore;

  /** Debounce timer map: key → DebounceEntry (timer + reject) */
  private debounceTimers: Map<string, DebounceEntry>;

  /** Processing-in-flight guard */
  private isProcessing: boolean;

  /**
   * The latest pending edit (queue of size 1).
   * While processEdit is running, any additional incoming edits overwrite this slot.
   * Once the current call completes, we drain this slot if non-null.
   */
  private pendingEdit: PendingEdit | null;

  /**
   * W5.4: Delta synthesis count per pipeline run.
   * Cap at 1 per processEdit or processCoachingTurn call to prevent loops.
   * Reset at the start of each processEdit / processCoachingTurn call.
   */
  private deltaSynthesisCount: number;

  /** Most recent EditUnderstanding from processEdit().
   *  Consumed once by the next processCoachingTurn() call, then cleared. */
  private lastEditUnderstanding: EditUnderstanding | null = null;

  /**
   * D-1.11 DP-1: most recent mode-selection decision from
   * processEditAndMaybeReanalyze. Captured at the moment
   * FocusedAnalyzer.selectAnalysisMode runs (this orchestrator's
   * iteration counter is still at the prior iter at that point).
   * Threaded through pipelineInput.modeSelectionDecision when
   * triggerReanalysis runs analyzeEssay; analyzeEssay fills in the
   * iteration AFTER incrementIteration and appends the decision.
   *
   * Cleared after each triggerReanalysis call to prevent stale
   * decisions from bleeding into subsequent iterations.
   */
  private lastModeSelectionDecision: Omit<CarryForwardDecision, 'iteration'> | null = null;

  // ── Construction ──────────────────────────────────────────────────────────

  constructor(profile: EssayProfile, checkpointStore: CheckpointStore, essayId: string) {
    // Round 7 P0 (D4-H1): essayId is now REQUIRED. The previous synthetic
    // `essay_${Date.now()}` fallback produced non-UUID strings that could
    // never satisfy the `essay_understanding.essay_id UUID` FK — another
    // path by which persistence silently no-op'd. Production caller
    // (`src/http/essayCoachingRoutes.ts`) already provides it.
    if (!essayId || essayId.trim() === '') {
      throw new Error(
        'ReanalysisOrchestrator requires a stable essayId; got undefined/empty. ' +
        'Upstream must pass the essay UUID at construction time (Round 7 P0, D4-H1).',
      );
    }
    this.checkpointStore = checkpointStore;
    this.essayId = essayId;
    this.coordinator = EssayProfileCoordinator.fromCheckpoint(profile, essayId, checkpointStore);
    this.router = new ProfileRouter();

    // FIX 1.2: createVersionTracker takes baselineText string, not (essayLength, profile)
    const baselineText = profile.paragraphs.map(p => p.text).join('\n\n');
    this.versionTracker = createVersionTracker(baselineText);

    this.debounceTimers = new Map();
    this.isProcessing = false;
    this.pendingEdit = null;
    this.deltaSynthesisCount = 0;

    console.log(`[ReanalysisOrchestrator] Initialized for essay: ${this.essayId}`);
  }

  // ── PUBLIC API ─────────────────────────────────────────────────────────────

  /**
   * Process an edit to the essay text.
   *
   * Steps:
   * 1. Call editUnderstandingService to understand the edit
   * 2. Apply edit understanding to coordinator (marks staleness)
   * 3. Record the edit in version tracker
   * 4. Select analysis mode (focused vs comprehensive)
   * 5. Run focused analysis OR trigger comprehensive re-analysis
   * 6. Return result with cost breakdown
   *
   * Concurrency: if a processEdit is already in-flight, the new edit is queued
   * (only the latest is kept). Once current completes, the queued edit runs.
   */
  async processEdit(
    oldText: string,
    newText: string,
    conversationContext?: string,
  ): Promise<EditProcessResult> {
    // If currently processing, queue this edit and wait for it
    if (this.isProcessing) {
      console.log('[ReanalysisOrchestrator] Edit queued (processing in-flight)');
      return new Promise<EditProcessResult>((resolve, reject) => {
        // Overwrite any previously queued edit — we only need the LATEST state
        if (this.pendingEdit) {
          this.pendingEdit.reject(
            new Error('[ReanalysisOrchestrator] Edit superseded by newer edit'),
          );
        }
        this.pendingEdit = { oldText, newText, conversationContext, resolve, reject };
      });
    }

    this.isProcessing = true;
    try {
      const result = await this.runEditProcessing(oldText, newText, conversationContext);
      return result;
    } finally {
      // FIX 3.5: keep isProcessing=true until drain completes to prevent race
      if (this.pendingEdit) {
        const pending = this.pendingEdit;
        this.pendingEdit = null;
        console.log('[ReanalysisOrchestrator] Draining queued edit');
        // Keep isProcessing=true for the drain — prevents new entries from racing
        this.processEdit(pending.oldText, pending.newText, pending.conversationContext)
          .then(pending.resolve)
          .catch(pending.reject)
          .finally(() => { this.isProcessing = false; });
      } else {
        this.isProcessing = false;
      }
    }
  }

  /**
   * Process a debounced edit — coalesces rapid keystrokes into a single call.
   * If another edit arrives within debounceMs, the timer resets and the old
   * promise is rejected (so callers can handle supersession gracefully).
   *
   * @param oldText             The baseline essay text (before this editing session)
   * @param newText             The current (latest) essay text
   * @param debounceMs          Quiescence window in milliseconds (default: 2000ms)
   * @param conversationContext Optional conversation context string
   */
  async processEditDebounced(
    oldText: string,
    newText: string,
    debounceMs: number = 2000,
    conversationContext?: string,
  ): Promise<EditProcessResult> {
    const key = 'edit';

    // FIX 3.4: cancel the old promise (reject it) when superseded
    const existing = this.debounceTimers.get(key);
    if (existing !== undefined) {
      clearTimeout(existing.timer);
      existing.reject(new Error('[ReanalysisOrchestrator] Debounce superseded by newer edit'));
      this.debounceTimers.delete(key);
      console.log(`[ReanalysisOrchestrator] Debounce reset (${debounceMs}ms)`);
    }

    return new Promise<EditProcessResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.debounceTimers.delete(key);
        this.processEdit(oldText, newText, conversationContext).then(resolve).catch(reject);
      }, debounceMs);

      // Store timer + reject so we can cancel cleanly
      this.debounceTimers.set(key, { timer, reject });
    });
  }

  /**
   * Handle a coaching conversation turn (L6).
   *
   * Steps:
   * 1. Get current profile
   * 2. Call coachingService.processCoachingTurn()
   * 3. If an insight was extracted, record it in the version tracker (coordinator already
   *    applied the insight internally inside coachingService.runStage4ProfileDeepening)
   * 4. Wire stage4Verdict, tensionDescription, and detectedPatterns
   * 5. Return result
   *
   * FIX A1.6: accepts optional recentEditSummary, forwarded to coachingService
   */
  async processCoachingTurn(
    studentMessage: string,
    conversationHistory: ConversationTurn[],
    recentEditSummary?: string,
    sessionMemory?: CoachingSessionMemory,
    learningStyle?: LearningStyleObservations,
    crossModuleContext?: string,
    collegeId?: string,
  ): Promise<CoachingTurnResult> {
    console.log('[ReanalysisOrchestrator] Processing coaching turn');

    // W5.4: Reset delta synthesis counter for this turn
    this.deltaSynthesisCount = 0;

    const costBreakdown: LayerCost[] = [];
    let totalCost = 0;

    try {
      // FIX 4.6: use Readonly<EssayProfile> — don't cast away readonly
      const profile = this.coordinator.getProfile();

      // FIX A1.6: pass recentEditSummary as recentEditContext so coachingService can include
      // edit context in Stage 1 classification and Stage 3 response generation.
      // W9.3: pass edit strategy context from version tracker for approach-aware coaching
      const editStrategyContext = this.versionTracker.getApproachContext() ?? undefined;

      // W6A.3: Create session event for edit intelligence so it persists beyond one coaching turn
      if (this.lastEditUnderstanding && sessionMemory) {
        const eu = this.lastEditUnderstanding;
        const editParagraphs: number[] = [];
        if (eu.scopeRecommendation.targets) {
          for (const target of eu.scopeRecommendation.targets) {
            const match = target.match(/P(\d+)/i);
            if (match) editParagraphs.push(parseInt(match[1], 10) - 1);
          }
        }
        // Ensure events array exists
        if (!sessionMemory.events) sessionMemory.events = [];
        sessionMemory.events.push({
          turn: (sessionMemory.turnCount || 0) + 1,
          kind: `edit:${eu.changeType}`,
          summary: `Student edited${editParagraphs.length > 0 ? ` P${editParagraphs.map(p => p + 1).join(', P')}` : ''} — ${eu.apparentPurpose}`,
          significance: eu.significance === 'transformative' ? 0.9 : eu.significance === 'significant' ? 0.8 : eu.significance === 'moderate' ? 0.6 : 0.4,
          paragraphRefs: editParagraphs,
          findingRefs: [],
        });
      }

      // ── Coaching mode detection (block system) ──
      const richEditContext = this.buildRichEditContext(recentEditSummary);

      // Compute max paragraph edit count for iteration detection
      const editParagraphsForMode: number[] = [];
      if (this.lastEditUnderstanding?.scopeRecommendation.targets) {
        for (const target of this.lastEditUnderstanding.scopeRecommendation.targets) {
          const match = target.match(/P(\d+)/i);
          if (match) editParagraphsForMode.push(parseInt(match[1], 10) - 1);
        }
      }
      const maxEditCount = editParagraphsForMode.length > 0
        ? Math.max(...editParagraphsForMode.map(p => this.versionTracker.getEditCountForParagraph(p)))
        : 0;

      const coachingMode: CoachingMode = detectCoachingMode(
        richEditContext,
        this.lastEditUnderstanding?.significance,
        maxEditCount,
        studentMessage,
        this.versionTracker.hasAnyEdits(),
        this.lastEditUnderstanding?.changeType,
        profile.index.improvementPhase.level,
      );
      const iterationRound = coachingMode === 'iteration_deep' ? maxEditCount : undefined;

      // Detect in-session draft prose (student writing during the coaching session)
      const isInSessionDraft = !richEditContext && coachingMode === 'revision_response' &&
        !this.versionTracker.hasAnyEdits() // No prior edits = this is in-session writing, not a revision
        ? true
        : (coachingMode === 'revision_response' && !richEditContext); // revision_response without edit context = draft

      console.log(`[ReanalysisOrchestrator] Coaching mode: ${coachingMode}${iterationRound ? `, iteration round ${iterationRound}` : ''}${isInSessionDraft ? ', in-session draft detected' : ''}`);

      const coachingResult: CoachingResult = await coachingService.processCoachingTurn(
        studentMessage,
        conversationHistory,
        profile,
        this.coordinator,
        this.router,
        richEditContext,
        editStrategyContext,
        sessionMemory,
        learningStyle,
        crossModuleContext, // Assembled by caller (e.g., HTTP route) from studentNarrativeBridge
        coachingMode,
        iterationRound,
        isInSessionDraft,
        collegeId,
      );

      // FIX 1.4: cost is LayerCost[] (the breakdown array itself); totalCost is separate
      totalCost += coachingResult.totalCost;
      costBreakdown.push(...coachingResult.cost);

      // FIX A1.4: coachingService.runStage4ProfileDeepening already calls
      // coordinator.applyConversationInsight() internally for every non-clarification category.
      // Do NOT call it again here — doing so would apply the insight twice, causing duplicated
      // observations and incorrect confidence boosts.
      // This orchestrator's only job is to record the insight in the version tracker for change tracking.
      let insightId: string | undefined;
      // FIX 1.4: profileDeepened comes from CoachingResult directly
      let profileDeepened = coachingResult.profileDeepened;

      // FIX 1.4: use insightExtracted (not extractedInsight)
      if (coachingResult.insightExtracted) {
        const insight: ConversationInsight = coachingResult.insightExtracted;
        insightId = insight.id;

        console.log(
          `[ReanalysisOrchestrator] Insight recorded: ${insight.id} (${insight.category}) — already applied by coachingService`,
        );

        // Record insight in version tracker
        try {
          this.versionTracker.recordConversationInsight(insight.id);
        } catch (err) {
          console.error(
            '[ReanalysisOrchestrator] Failed to record insight in version tracker:',
            err,
          );
        }
      }

      // FIX A1.2: Wire stage4Verdict — track supersession, tension, patterns, and profileDeepened
      // stage4Verdict: 'superseded' means student's reinterpretation replaced old observations
      if (coachingResult.stage4Verdict === 'superseded') {
        profileDeepened = true;
        if (coachingResult.supersededFindingIds && coachingResult.supersededFindingIds.length > 0) {
          console.log(
            `[ReanalysisOrchestrator] Findings superseded by coaching: ${coachingResult.supersededFindingIds.join(', ')}`,
          );
        }
      }

      // FIX A1.2: Wire tensionDescription — log for now (versionTracker has no recordTensionDescription)
      if (coachingResult.tensionDescription) {
        console.log(
          `[ReanalysisOrchestrator] Tension identified: ${coachingResult.tensionDescription}`,
        );
      }

      // FIX A1.2: Wire detectedPatterns — add each pattern insight to the coordinator
      if (coachingResult.detectedPatterns && coachingResult.detectedPatterns.length > 0) {
        console.log(
          `[ReanalysisOrchestrator] Applying ${coachingResult.detectedPatterns.length} detected pattern(s) to coordinator`,
        );
        for (const pattern of coachingResult.detectedPatterns) {
          try {
            this.coordinator.addPatternInsight(pattern);
          } catch (err) {
            console.error('[ReanalysisOrchestrator] Failed to add pattern insight:', err);
          }
        }
      }

      // ── W5.4b: Delta synthesis for coaching supersession ─────────────────
      // When coaching produces a 'superseded' verdict, the holistic sections
      // that depended on the superseded observations may be stale.
      // Trigger a targeted delta synthesis to bring them up to date.
      if (coachingResult.stage4Verdict === 'superseded' && this.deltaSynthesisCount < 1) {
        try {
          // Derive affected holistic sections from the insight category
          const affectedSections = this.deriveCoachingAffectedSections(coachingResult);
          if (affectedSections.length > 0) {
            const supersededIds = coachingResult.supersededFindingIds?.join(', ') ?? 'unknown';
            const deltaRequest: DeltaSynthesisRequest = {
              targetSections: affectedSections,
              trigger: 'coaching_supersession',
              evidence: `Student reinterpretation superseded findings [${supersededIds}]. ${coachingResult.tensionDescription ?? ''}`,
            };

            const profileForDelta = this.coordinator.getProfile();
            const deltaResult = await holisticSynthesisService.deltaSynthesize(
              deltaRequest,
              profileForDelta,
            );

            this.coordinator.applySectionLevelSynthesis(deltaResult.output);
            this.deltaSynthesisCount++;

            totalCost += deltaResult.cost;
            costBreakdown.push({
              layer: 'delta_synthesis_coaching',
              cost: deltaResult.cost,
              tokenUsage: deltaResult.tokenUsage,
              timingMs: deltaResult.timingMs,
            });

            console.log(
              `[ReanalysisOrchestrator] W5.4b: Delta synthesis for coaching supersession — ` +
              `sections=[${affectedSections.join(', ')}], ` +
              `isSubstantive=${deltaResult.output.isSubstantive}, ` +
              `cost=$${deltaResult.cost.toFixed(4)}`,
            );
          }
        } catch (error) {
          // Delta synthesis failure is NOT fatal — coaching result is still valid
          console.error(
            '[ReanalysisOrchestrator] W5.4b: Delta synthesis failed (non-fatal):',
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      console.log(
        `[ReanalysisOrchestrator] Coaching turn complete: ` +
        `insightExtracted=${!!insightId}, cost=$${totalCost.toFixed(4)}`,
      );

      return {
        success: true,
        response: coachingResult.response,
        insightId,
        profileDeepened,
        totalCost,
        costBreakdown,
        sessionMemory: coachingResult.sessionMemory,
        learningStyle: coachingResult.learningStyle,
        cognitiveAssessment: coachingResult.cognitiveAssessment,
        qualitySignals: coachingResult.qualitySignals,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[ReanalysisOrchestrator] Coaching turn failed:', msg);
      // FIX 3.7: return structured error (no degraded hardcoded response)
      return {
        success: false,
        error: msg,
        response: null,
        profileDeepened: false,
        totalCost,
        costBreakdown,
      };
    }
  }

  /**
   * Trigger a full comprehensive re-analysis.
   *
   * Called:
   * - Automatically when processEdit() determines comprehensive analysis is warranted
   *   and the version tracker says to proceed
   * - Manually by the caller to force a fresh analysis
   *
   * Steps:
   * 1. Generate re-analysis brief from version tracker
   * 2. Get current essay text from version tracker
   * 3. Save checkpoint before running
   * 4. Run comprehensive pipeline via analyzeEssay()
   * 5. Close version record
   * 6. Return result
   */
  async triggerReanalysis(
    /**
     * [F-1 wire-up 2026-04-29] When the comprehensive re-analysis is the
     * escalation tail of a focused-mode run, the focused result's
     * escalationLevel (1|2|3|4) is threaded into PipelineInput so
     * commitIterationRecord populates IterationRecord.escalationLevel
     * with the level that actually triggered the comprehensive re-run
     * — not the silent 0 the consumer was reading before. Optional
     * because direct comprehensive re-analyses (no focused predecessor)
     * legitimately have no escalation level and `?? 0` keeps the
     * field at 0 in that case (per its declared 0|1|2|3|4 type).
     */
    focusedEscalationLevel?: 0 | 1 | 2 | 3 | 4,
  ): Promise<ReanalysisResult> {
    console.log('[ReanalysisOrchestrator] Triggering comprehensive re-analysis');

    // Generate brief from accumulated changes
    const brief = this.versionTracker.generateReanalysisBrief();
    const currentText = this.versionTracker.getActiveVersion().currentText;

    // Save checkpoint before re-analysis so we can recover if it fails
    try {
      await this.coordinator.checkpoint('before_reanalysis');
      console.log('[ReanalysisOrchestrator] Checkpoint saved before re-analysis');
    } catch (err) {
      console.error('[ReanalysisOrchestrator] Pre-reanalysis checkpoint failed (continuing):', err);
    }

    // Build pipeline input from current profile metadata
    // FIX 4.6: don't cast away Readonly
    const currentProfile = this.coordinator.getProfile();
    const essayType = currentProfile.northStar.activeScale === 'piq'
      ? 'piq' as const
      : currentProfile.northStar.activeScale === 'supplement'
        ? 'supplement' as const
        : 'common_app' as const;

    // Extract prior findings BEFORE running the pipeline so the walk can see them.
    // This enables true finding evolution: the walk sees prior findings in its prompt
    // context and can produce findingEvolutions (confirm, deepen, supersede).
    let priorFindings: Finding[] = [];
    try {
      const oldFindingStore = this.coordinator.getFindingStore();
      if (oldFindingStore.size > 0) {
        priorFindings = oldFindingStore.serialize().findings;
        console.log(
          `[ReanalysisOrchestrator] Extracted ${priorFindings.length} prior findings for walk evolution`,
        );
      }
    } catch (err) {
      console.error(
        '[ReanalysisOrchestrator] Failed to extract prior findings (non-fatal):',
        err instanceof Error ? err.message : String(err),
      );
    }

    // D-1.8: thread the prior-iteration baseline text and the LLM-judged
    // overall edit significance from upstream `editUnderstandingService` so
    // the analysisOrchestrator's priorAnnotations composer (Phase 6) can
    // build EditSignals against the actual edit, not a stale ledger snapshot.
    // The baselineText is the "before" essay text from the active version
    // window — exactly the OLD-half of the diff that prior taughtMoves
    // recorded their location.paragraphIndex against. lastEditUnderstanding
    // is populated by `runEditProcessing` (line 920) when an edit triggered
    // this re-analysis; null on student_request triggers (no edit). When
    // both are absent, the composer's mechanical-significance fallback
    // (D-1.8 §4) and ledger-snapshot lookup (D-1.10's deliverable) take over.
    const activeVersion = this.versionTracker.getActiveVersion();
    const priorEssayText = activeVersion.baselineText.length > 0 ? activeVersion.baselineText : undefined;
    const editSignificance = this.lastEditUnderstanding?.significance;

    // ── D-1.10: thread iteration-ledger continuity + triggeredBy + edit metadata ──
    // Closes Dead Wire #3 (analyzeEssay always called createNew with a
    // fresh empty ledger, silently discarding prior history). Capture the
    // existing iterationLedger from this.coordinator's profile NOW —
    // before analyzeEssay runs, because line 717's fromCheckpoint rebuild
    // will overwrite this.coordinator with the post-pipeline profile that
    // ALREADY has the new iteration record appended. The seed flows
    // through PipelineInput → createNew → createInitialProfile, replacing
    // the default empty ledger with a deep-clone of the prior state so the
    // new iteration appends rather than starts fresh.
    //
    // triggeredBy: 'edit' when an edit fired upstream (lastEditUnderstanding
    // is populated by runEditProcessing line 920 when edit-triggered);
    // 'student_request' when re-analysis was triggered via this orchestrator
    // without an edit (e.g., manual rerun from the chat interface).
    //
    // editChangeTypes: surfaced from the same upstream edit understanding;
    // used by analysisOrchestrator.commitIterationRecord to populate
    // IterationRecord.editScope.changeTypes when triggeredBy === 'edit'.
    //
    // [Item 13 drive-by fix 2026-04-30] Pre-existing duplicate `const currentProfile`
    // declaration in the same function scope (the first declaration is at line 691
    // for the essayType derivation). tsc tolerates this in the project's lib mode
    // but esbuild (used by vitest) rejects it as a hard transform error, blocking
    // any test that imports this file. Renamed the second to `profileForLedger` —
    // it's a separate semantic (the profile snapshot taken NOW, before analyzeEssay
    // overwrites this.coordinator). The two reads return the same Readonly snapshot
    // via the coordinator's pure getProfile, so behavior is identical.
    const profileForLedger = this.coordinator.getProfile();
    const priorIterationLedger = profileForLedger.iterationLedger;
    const triggeredBy: 'edit' | 'student_request' = this.lastEditUnderstanding ? 'edit' : 'student_request';
    const editChangeTypes = this.lastEditUnderstanding?.changeTypes;

    const pipelineInput: PipelineInput = {
      // FIX 4.7: use stored essayId instead of synthetic one
      essayId: this.essayId,
      essayText: currentText,
      essayType,
      priorFindings: priorFindings.length > 0 ? priorFindings : undefined,
      priorEssayText,
      editSignificance,
      priorIterationLedger,
      triggeredBy,
      editChangeTypes,
      // D-1.11 DP-1: thread mode-selection decision so analyzeEssay can
      // append it to recentDecisions[] AFTER incrementIteration runs.
      // `lastModeSelectionDecision` is set by processEditAndMaybeReanalyze
      // when an edit triggered the re-analysis. On 'student_request'
      // triggers (no edit, no mode selection), it stays null and
      // analyzeEssay's DP-1 append site no-ops via the `if (input.modeSelectionDecision)` guard.
      modeSelectionDecision: this.lastModeSelectionDecision ?? undefined,
      // [F-1 wire-up 2026-04-29] Thread focused-mode escalation level so
      // IterationRecord.escalationLevel reflects the level that actually
      // triggered comprehensive escalation, not a silent 0. See parameter
      // doc above; consumer at analysisOrchestrator.ts (search for
      // `escalationLevel: input.focusedEscalationLevel ?? 0`) — line
      // numbers drift across commits, so a textual anchor is more durable.
      focusedEscalationLevel,
    };

    // Run comprehensive pipeline with the reanalysis brief
    let pipelineResult: PipelineResult;
    try {
      pipelineResult = await analyzeEssay(pipelineInput, brief);
      // D-1.11 DP-1: clear consumed mode-selection decision so it doesn't
      // bleed into a subsequent triggerReanalysis (each call gets a fresh
      // decision from processEditAndMaybeReanalyze, OR null on
      // student_request triggers).
      this.lastModeSelectionDecision = null;
      console.log(
        `[ReanalysisOrchestrator] Re-analysis complete: ` +
        `layers=${pipelineResult.layersCompleted.join(',')}, ` +
        `cost=$${pipelineResult.costSummary.totalCost.toFixed(4)}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[ReanalysisOrchestrator] Re-analysis pipeline failed:', msg);
      throw error;
    }

    // FIX P0.4: Update this.coordinator with the fresh profile from the pipeline.
    // analyzeEssay() creates a NEW internal coordinator and returns the analyzed profile.
    // Prior findings were already seeded into the pipeline via input.priorFindings,
    // so the walk saw them and could produce findingEvolutions. The fresh profile
    // already contains both evolved prior findings and new walk findings — no
    // post-hoc migration needed.
    //
    // FIX P0.5: Preserve the existing checkpoint store across coordinator rebuilds.
    //
    // [D-1.12 C1 closure 2026-04-29] Pre-fix this catch logged "(CRITICAL)"
    // and then RETURNED THE RESULT ANYWAY, leaving `this.coordinator`
    // pointing at the pre-reanalysis state while the caller received the
    // post-reanalysis result. Invariant violation: returned data and
    // orchestrator state diverge silently. Now we throw — the caller's
    // catch (in runComprehensiveMode) populates EditProcessResult.error
    // and deferReason='comprehensive_failed' so the HTTP boundary can
    // surface a 5xx instead of routing into a divergent-state coaching
    // session.
    try {
      const freshProfile = pipelineResult.profile as EssayProfile;
      this.coordinator = EssayProfileCoordinator.fromCheckpoint(
        freshProfile,
        this.essayId,
        this.checkpointStore,
      );
      console.log('[ReanalysisOrchestrator] Coordinator updated with fresh post-reanalysis profile (checkpoint store preserved)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[ReanalysisOrchestrator] coordinator_rebuild failed — orchestrator state would diverge from returned result; halting: ${msg}`,
      );
    }

    // Close the version record.
    //
    // [D-1.12 C2 closure 2026-04-29] Pre-fix this catch synthesized a
    // fake VersionRecord with `version: 0`, empty arrays, current
    // timestamp. Banned shape per CLAUDE.md "no degraded fallbacks":
    // hardcoded substitute that downstream consumers cannot distinguish
    // from a real version=0. The version record is part of the audit
    // trail (cross-iteration continuity, change diffing); faking it
    // corrupts the very thing D-1.10 was built to preserve. Now we
    // throw — same caller-side surfacing as C1.
    let versionRecord: VersionRecord;
    try {
      versionRecord = this.versionTracker.closeVersion(currentText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[ReanalysisOrchestrator] versionTracker.closeVersion failed — cannot synthesize a placeholder VersionRecord without corrupting audit trail; halting: ${msg}`,
      );
    }

    return {
      brief,
      pipelineResult,
      versionRecord,
      totalCost: pipelineResult.costSummary.totalCost,
    };
  }

  /**
   * Ask whether re-analysis should be suggested to the student.
   * Informational only — the caller decides whether to act on it.
   */
  shouldSuggestReanalysis(): ReanalysisSuggestion {
    try {
      // FIX 1.3: real VersionTracker returns ReanalysisTrigger with shouldTrigger (not should)
      const trigger: ReanalysisTrigger = this.versionTracker.shouldTriggerReanalysis();
      return {
        shouldTrigger: trigger.shouldTrigger,
        reason: trigger.reason,
        urgency: trigger.urgency,
      };
    } catch {
      return { shouldTrigger: false, reason: 'Version tracker unavailable', urgency: 'low' };
    }
  }

  /**
   * Return the current profile (read-only snapshot).
   */
  getProfile(): Readonly<EssayProfile> {
    // FIX 4.6: return Readonly<EssayProfile> — coordinator.getProfile() returns that
    return this.coordinator.getProfile();
  }

  /**
   * FIX 3.13: Release all timers and pending state. Call when the session ends.
   */
  destroy(): void {
    for (const [, entry] of this.debounceTimers) {
      clearTimeout(entry.timer);
      entry.reject(new Error('[ReanalysisOrchestrator] Session destroyed'));
    }
    this.debounceTimers.clear();

    if (this.pendingEdit) {
      this.pendingEdit.reject(new Error('[ReanalysisOrchestrator] Session destroyed'));
      this.pendingEdit = null;
    }

    console.log(`[ReanalysisOrchestrator] Destroyed session: ${this.essayId}`);
  }

  // ── PRIVATE: edit context helpers ─────────────────────────────────────────

  /**
   * Build rich edit context from stored EditUnderstanding.
   * Falls back to VersionTracker summary if no EditUnderstanding is available.
   * Consumed once — clears lastEditUnderstanding after building.
   */
  private buildRichEditContext(fallbackSummary?: string): string | undefined {
    const eu = this.lastEditUnderstanding;
    if (!eu) return fallbackSummary;

    // Consume once (save ref for structured comparison before nulling)
    const editUnderstanding = eu;
    this.lastEditUnderstanding = null;

    const parts: string[] = [];

    parts.push(
      `Change type: ${editUnderstanding.changeType.replace(/_/g, ' ')} (${editUnderstanding.significance}).`,
    );
    parts.push(
      `Apparent purpose: "${editUnderstanding.apparentPurpose}" (confidence: ${editUnderstanding.purposeConfidence.toFixed(2)}).`,
    );

    if (editUnderstanding.profileImpact.connectionImpact.length > 0) {
      const impacts = editUnderstanding.profileImpact.connectionImpact
        .filter(ci => ci.effect !== 'unchanged')
        .map(ci => `${ci.connectionId} ${ci.effect}: ${ci.reasoning}`)
        .slice(0, 3);
      if (impacts.length > 0) {
        parts.push(`Connection effects: ${impacts.join('; ')}.`);
      }
    }

    if (editUnderstanding.profileImpact.directImpact) {
      parts.push(`Direct impact: ${editUnderstanding.profileImpact.directImpact}`);
    }

    if (editUnderstanding.profileImpact.holisticImpact) {
      parts.push(`Holistic: ${editUnderstanding.profileImpact.holisticImpact}`);
    }

    if (fallbackSummary) {
      parts.push(`Summary: ${fallbackSummary}`);
    }

    // ── Structured before/after comparison for revision coaching ──
    // When we have edit targets, include old paragraph text alongside the
    // change assessment so the coaching prompt can juxtapose versions.
    if (editUnderstanding.scopeRecommendation.targets) {
      const comparisonParts: string[] = [];
      for (const target of editUnderstanding.scopeRecommendation.targets) {
        const match = target.match(/P(\d+)/i);
        if (!match) continue;
        const pIdx = parseInt(match[1], 10) - 1;
        const oldText = this.versionTracker.getBaselineParagraphText(pIdx);
        if (oldText) {
          // Get current text from the profile for comparison
          const profile = this.coordinator.getProfile();
          const newText = profile.paragraphs[pIdx]?.text;
          if (newText && oldText.trim() !== newText.trim()) {
            comparisonParts.push(
              `\nP${pIdx + 1} BEFORE: "${oldText.slice(0, 300)}${oldText.length > 300 ? '...' : ''}"` +
              `\nP${pIdx + 1} AFTER: "${newText.slice(0, 300)}${newText.length > 300 ? '...' : ''}"`,
            );
          }
        }
      }
      if (comparisonParts.length > 0) {
        parts.push(`\n=== REVISION COMPARISON ===${comparisonParts.join('\n')}`);
      }
    }

    // ── Coaching directive: name the highest-priority coaching action ──
    const weakened = editUnderstanding.profileImpact.connectionImpact
      .filter(ci => ci.effect === 'weakened' || ci.effect === 'broken');
    if (weakened.length > 0) {
      parts.push(
        `\nCOACHING PRIORITY: ${weakened[0].connectionId} was ${weakened[0].effect} by this revision. ` +
        `Name what was LOST and show how to reclaim it without reverting.`,
      );
    }

    return parts.join(' ');
  }

  // ── PRIVATE: delta synthesis helpers ──────────────────────────────────────

  /**
   * W5.4b: Derive which holistic sections are affected by a coaching supersession.
   *
   * When coaching supersedes observations, the affected sections depend on
   * the insight category:
   * - reinterpretation → voice_identity, character_revelation, thematic_architecture
   * - emotional_reaction → emotional_topography, voice_identity
   * - new_context → thematic_architecture, narrative_strategy, character_revelation
   * - correction → craft_assessment, voice_identity
   * - Default → voice_identity, thematic_architecture (conservative)
   */
  private deriveCoachingAffectedSections(
    coachingResult: CoachingResult,
  ): HolisticSectionType[] {
    // If the coaching result has a specific insight category, derive from it
    const category = coachingResult.insightExtracted?.category;

    switch (category) {
      case 'reinterpretation':
        return ['voice_identity', 'character_revelation', 'thematic_architecture'];
      case 'emotional_reaction':
        return ['emotional_topography', 'voice_identity'];
      case 'new_context':
        return ['thematic_architecture', 'narrative_strategy', 'character_revelation'];
      case 'correction':
        return ['craft_assessment', 'voice_identity'];
      default:
        // Conservative default — voice + theme are most commonly affected
        return ['voice_identity', 'thematic_architecture'];
    }
  }

  // ── PRIVATE: core edit processing logic ────────────────────────────────────

  /**
   * The actual edit processing logic (called by processEdit after concurrency guard).
   */
  private async runEditProcessing(
    oldText: string,
    newText: string,
    conversationContext?: string,
  ): Promise<EditProcessResult> {
    const costBreakdown: LayerCost[] = [];
    let totalCost = 0;

    console.log(
      `[ReanalysisOrchestrator] Processing edit: ` +
      `oldLen=${oldText.length}, newLen=${newText.length}`,
    );

    // ── Step 1: Understand the edit ──────────────────────────────────────────
    let editOutput: EditUnderstandingOutput;
    try {
      // FIX 4.6: getProfile() returns Readonly<EssayProfile> — no cast needed
      const currentProfile = this.coordinator.getProfile();
      const editResult: EditUnderstandingResult = await editUnderstandingService.understandEdit(
        oldText,
        newText,
        currentProfile,
        this.router,
        conversationContext,
      );

      editOutput = editResult.output;

      // Store for rich context in next coaching turn
      this.lastEditUnderstanding = editOutput.understanding;

      // FIX 1.5: cost is LayerCost (single object), not a number
      totalCost += editResult.cost.cost;
      costBreakdown.push(editResult.cost);

      console.log(
        `[ReanalysisOrchestrator] Edit understood: ` +
        `significance=${editOutput.understanding.significance}, ` +
        `changeType=${editOutput.understanding.changeType}, ` +
        `cost=$${editResult.cost.cost.toFixed(4)}`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[ReanalysisOrchestrator] editUnderstandingService failed:', msg);
      throw new Error(`[ReanalysisOrchestrator] Edit understanding failed: ${msg}`);
    }

    // ── Step 2: Apply edit understanding to coordinator ──────────────────────
    try {
      this.coordinator.applyEditUnderstanding(editOutput);
      console.log('[ReanalysisOrchestrator] Edit understanding applied to coordinator');
    } catch (error) {
      console.error(
        '[ReanalysisOrchestrator] applyEditUnderstanding failed (non-fatal):',
        error instanceof Error ? error.message : String(error),
      );
    }

    // ── Step 2.5: Connection-based revalidation triage ─────────────────────
    // Log which connections are affected by this edit for diagnostic visibility
    {
      const profile = this.coordinator.getProfile();
      const editedParagraphs = editOutput.paragraphMapping?.map(m => m.newIndex) ?? [];
      let immediateCount = 0;
      let deferredCount = 0;
      for (const pIdx of editedParagraphs) {
        if (pIdx === undefined || pIdx < 0) continue;
        const affected = profile.connections.all.filter(
          c => c.status === 'active' && (c.from.paragraph === pIdx || c.to.paragraph === pIdx),
        );
        const immediate = affected.filter(
          c => c.strengthCategory === 'foundational' || c.strengthCategory === 'significant',
        );
        const deferred = affected.filter(
          c => c.strengthCategory === 'supporting' || c.strengthCategory === 'tentative',
        );
        immediateCount += immediate.length;
        deferredCount += deferred.length;
      }
      if (immediateCount > 0 || deferredCount > 0) {
        console.log(
          `[ReanalysisOrchestrator] Connection triage: ${immediateCount} immediate, ${deferredCount} deferred`,
        );
      }
    }

    // ── Step 3: Record edit in version tracker ───────────────────────────────
    try {
      this.versionTracker.recordEdit(editOutput, newText);
      console.log('[ReanalysisOrchestrator] Edit recorded in version tracker');
    } catch (error) {
      console.error(
        '[ReanalysisOrchestrator] versionTracker.recordEdit failed (non-fatal):',
        error instanceof Error ? error.message : String(error),
      );
    }

    // ── Step 4: Select analysis mode ─────────────────────────────────────────
    // FIX 4.6: getProfile() returns Readonly<EssayProfile>
    const currentProfileForMode = this.coordinator.getProfile();
    let selectedMode: 'focused' | 'comprehensive';
    try {
      // FIX 1.8: use real FocusedAnalyzer.selectAnalysisMode (static method on real class)
      selectedMode = FocusedAnalyzer.selectAnalysisMode(editOutput, currentProfileForMode);
      console.log(`[ReanalysisOrchestrator] Analysis mode selected: ${selectedMode}`);
    } catch (error) {
      console.error(
        '[ReanalysisOrchestrator] selectAnalysisMode failed, defaulting to focused:',
        error instanceof Error ? error.message : String(error),
      );
      selectedMode = 'focused';
    }

    // ── D-1.11 DP-1: capture the mode-selection carry-forward decision ──
    // We store the decision metadata on the orchestrator instance so
    // triggerReanalysis can attach it to pipelineInput.modeSelectionDecision
    // when comprehensive mode runs analyzeEssay. Focused-mode reanalyses
    // don't go through analyzeEssay so the decision can't be attached
    // to a new IterationRecord — documented gap (focused-mode iteration
    // commit is a separate deliverable). For focused mode we still set
    // the field so future deferred-fix code has access; it just won't
    // get persisted under the current architecture.
    //
    // decision type:
    //   'comprehensive' → 'rederive' (full re-analysis = re-derive everything)
    //   'focused'       → 'partial_refresh' (focused: re-derive some, carry rest)
    this.lastModeSelectionDecision = {
      itemKey: 'mode_selection',
      decision: selectedMode === 'comprehensive' ? 'rederive' : 'partial_refresh',
      rationale: `FocusedAnalyzer.selectAnalysisMode → ${selectedMode}`,
      costSavedIfCarry: 0, // baseline-cost reference table is D-4.11+ scope
      costSpentIfRederive: 0,
      arbitrationMechanism: 'validity_test', // selectAnalysisMode is a deterministic rules engine
    };

    // ── Step 5: Execute analysis ──────────────────────────────────────────────
    if (selectedMode === 'focused') {
      return await this.runFocusedMode(editOutput, costBreakdown, totalCost);
    } else {
      return await this.runComprehensiveMode(editOutput, costBreakdown, totalCost);
    }
  }

  /**
   * Execute focused analysis mode. May escalate to comprehensive if the analyzer
   * determines the changes are too broad for surgical treatment.
   */
  private async runFocusedMode(
    editOutput: EditUnderstandingOutput,
    costBreakdown: LayerCost[],
    totalCostSoFar: number,
  ): Promise<EditProcessResult> {
    let totalCost = totalCostSoFar;

    console.log('[ReanalysisOrchestrator] Running focused analysis');

    let focusedResult: FocusedAnalysisResult | undefined;

    try {
      // FIX 4.6: getProfile() returns Readonly<EssayProfile>
      const currentProfile = this.coordinator.getProfile();
      focusedResult = await focusedAnalyzer.runFocusedAnalysis(
        editOutput,
        currentProfile,
        this.coordinator,
        this.router,
      );

      // FIX 1.6: cost is LayerCost[] with separate totalCost
      totalCost += focusedResult.totalCost;
      costBreakdown.push(...focusedResult.cost);

      // FIX 1.6: escalation is checked via mode field, not boolean
      const escalated = focusedResult.mode === 'escalated_to_comprehensive';

      if (!escalated) {
        // FIX A1.1: Apply phaseUpdate immediately via coordinator.updateImprovementPhase().
        // The focused pipeline recomputes the phase after every surgical analysis; we must
        // wire the result into the live profile so subsequent coaching turns see the correct phase.
        if (focusedResult.phaseUpdate !== null) {
          try {
            this.coordinator.updateImprovementPhase(focusedResult.phaseUpdate);
            console.log(
              `[ReanalysisOrchestrator] Improvement phase updated: ${focusedResult.phaseUpdate.level}`,
            );
          } catch (err) {
            console.error('[ReanalysisOrchestrator] Failed to apply phaseUpdate:', err);
          }
        }

        // FIX A1.5 + P0.3: Log understandingDelta and analysisDelta for observability.
        // Deltas are APPLIED inside focusedAnalyzer.runFocusedAnalysis() via the coordinator
        // (understanding via direct profile mutation + applyLightTouchUpdate for staleness,
        // analysis via coordinator.applyAnalysisPassResult). We log here for debugging.
        if (focusedResult.understandingDelta !== null) {
          const ud = focusedResult.understandingDelta;
          console.log(
            `[ReanalysisOrchestrator] Understanding delta — ` +
            `primaryFunction=${ud.updatedPrimaryFunction ? 'changed' : 'unchanged'}, ` +
            `significance=${ud.updatedSignificance ?? 'unchanged'}, ` +
            `findingEvolutions=${ud.findingEvolutions?.length ?? 0}, ` +
            `ripple.beyondParagraph=${ud.rippleFlags.beyondParagraph}`,
          );
          // FIX P0.3: Deltas are now applied inside focusedAnalyzer.runFocusedAnalysis().
          // Understanding: direct profile mutation + coordinator.applyLightTouchUpdate() for staleness.
          // Analysis: coordinator.applyAnalysisPassResult() with synthetic AnalysisPassOutput.
        }
        if (focusedResult.analysisDelta !== null) {
          const ad = focusedResult.analysisDelta;
          console.log(
            `[ReanalysisOrchestrator] Analysis delta — ` +
            `effectiveness=${ad.effectiveness}, ` +
            `effectivenessDelta=${ad.effectivenessDelta > 0 ? '+' : ''}${ad.effectivenessDelta}, ` +
            `paragraphEffectivenessDelta=${ad.paragraphEffectivenessDelta > 0 ? '+' : ''}${ad.paragraphEffectivenessDelta}`,
          );
        }

        console.log(
          `[ReanalysisOrchestrator] Focused analysis complete: ` +
          `escalationLevel=${focusedResult.escalationLevel}, ` +
          `cost=$${focusedResult.totalCost.toFixed(4)}`,
        );
        return {
          editOutput,
          mode: 'focused',
          focusedResult,
          reanalysisTriggered: false,
          totalCost,
          costBreakdown,
        };
      }

      console.log('[ReanalysisOrchestrator] Focused analysis escalated to comprehensive');
    } catch (error) {
      // [D-1.12 C3 closure 2026-04-29] Pre-fix this catch returned
      // `{ mode: 'deferred', reanalysisTriggered: false }` indistinguishable
      // from the legitimate "policy chose to defer" path below. Caller
      // could not route differently between "policy decision" and "analyzer
      // crashed." Now: emit structured telemetry + populate the new
      // deferReason='focused_failed' + error fields on EditProcessResult so
      // the HTTP boundary can surface a 5xx instead of routing into a
      // garbage coaching session.
      const msg = error instanceof Error ? error.message : String(error);
      console.error(
        '[ReanalysisOrchestrator] focusedAnalyzer.runFocusedAnalysis failed:',
        msg,
      );
      const iter = getCurrentIteration(this.coordinator.getProfile());
      emitIterationEvent(this.essayId, {
        iteration: iter,
        step: 'runFocusedMode',
        status: 'failed',
        error: {
          message: msg,
          code: 'focused_analyzer_threw',
          context: { downstreamBehavior: 'EditProcessResult.deferReason=focused_failed; caller surfaces error.' },
        },
        timestamp: new Date().toISOString(),
      });
      return {
        editOutput,
        mode: 'deferred',
        reanalysisTriggered: false,
        totalCost,
        costBreakdown,
        deferReason: 'focused_failed',
        error: { layer: 'focusedAnalyzer', message: msg, code: 'focused_analyzer_threw' },
      };
    }

    // [D-1.12 Commit B 2026-04-29] Read focused-analyzer's new structured
    // failure flags. If any step caught (escalationLevelTrustworthy=false),
    // emit one iteration-telemetry event per failed step so the audit trail
    // captures the silent failures that were previously console-only.
    // The orchestrator is the emitter (not focusedAnalyzer) because
    // emitIterationEvent requires essayId, which lives on this.essayId
    // and would force a signature change to thread into the analyzer.
    if (focusedResult && !focusedResult.escalationLevelTrustworthy) {
      const iter = getCurrentIteration(this.coordinator.getProfile());
      for (const step of focusedResult.failedSteps) {
        emitIterationEvent(this.essayId, {
          iteration: iter,
          step: `focusedAnalyzer.${step}`,
          status: 'failed',
          error: {
            message: `[FocusedAnalyzer] step ${step} caught and continued; escalationLevel may be misleading`,
            code: `focused_${step}_swallowed`,
            context: {
              resultEscalationLevel: focusedResult.escalationLevel,
              allFailedSteps: focusedResult.failedSteps,
              note: 'Telemetry emit is the audit trail; the result was returned with escalationLevelTrustworthy=false.',
            },
          },
          timestamp: new Date().toISOString(),
        });
      }
      console.warn(
        `[ReanalysisOrchestrator] focused-analysis result has ${focusedResult.failedSteps.length} ` +
          `failed step(s): [${focusedResult.failedSteps.join(', ')}]; escalationLevel ` +
          `(${focusedResult.escalationLevel}) is untrustworthy and will not feed IterationRecord.escalationLevel.`,
      );
    }

    // Escalated: fall through to comprehensive
    return await this.runComprehensiveMode(editOutput, costBreakdown, totalCost, focusedResult);
  }

  /**
   * Execute comprehensive re-analysis (either directly chosen or escalated from focused).
   */
  private async runComprehensiveMode(
    editOutput: EditUnderstandingOutput,
    costBreakdown: LayerCost[],
    totalCostSoFar: number,
    focusedResult?: FocusedAnalysisResult,
  ): Promise<EditProcessResult> {
    let totalCost = totalCostSoFar;

    // FIX 1.3: use shouldTrigger (not should) from real VersionTracker
    const trigger = this.versionTracker.shouldTriggerReanalysis();

    if (!trigger.shouldTrigger) {
      console.log(
        `[ReanalysisOrchestrator] Comprehensive re-analysis recommended but deferred ` +
        `(urgency=${trigger.urgency}): ${trigger.reason}`,
      );
      // [D-1.12 C4 partial — policy-defer branch] Mark deferReason so
      // consumers can distinguish this clean policy decision from the
      // failure paths below. No `error` field; this is a healthy outcome.
      return {
        editOutput,
        mode: 'comprehensive',
        focusedResult,
        reanalysisTriggered: false,
        totalCost,
        costBreakdown,
        deferReason: 'policy_defer',
      };
    }

    // Trigger re-analysis
    console.log(
      `[ReanalysisOrchestrator] Triggering comprehensive re-analysis from edit ` +
      `(urgency=${trigger.urgency})`,
    );
    let reanalysisBrief: ReanalysisBrief | undefined;

    try {
      // [F-1 wire-up 2026-04-29 + D-1.12 Commit B 2026-04-29] Pass focused-mode
      // escalation level through so the resulting IterationRecord.escalationLevel
      // reflects the actual escalation tier (1|2|3|4) — UNLESS the focused
      // analyzer reported escalationLevelTrustworthy=false, in which case
      // pass undefined so the consumer's `?? 0` defaults honestly instead
      // of recording the (misleading) hardcoded fallback. Telemetry was
      // already emitted above, so the failure is captured in the audit
      // trail; this prevents a load-bearing audit field from carrying a lie.
      const trustedEscalationLevel =
        focusedResult && focusedResult.escalationLevelTrustworthy
          ? focusedResult.escalationLevel
          : undefined;
      const reanalysisResult = await this.triggerReanalysis(trustedEscalationLevel);
      reanalysisBrief = reanalysisResult.brief;
      totalCost += reanalysisResult.totalCost;

      // Accumulate the re-analysis layer costs
      for (const layer of reanalysisResult.pipelineResult.costSummary.layers) {
        costBreakdown.push(layer);
      }

      console.log(
        `[ReanalysisOrchestrator] Comprehensive re-analysis complete: ` +
        `cost=$${reanalysisResult.totalCost.toFixed(4)}`,
      );

      return {
        editOutput,
        mode: 'comprehensive',
        focusedResult,
        reanalysisTriggered: true,
        reanalysisBrief,
        totalCost,
        costBreakdown,
      };
    } catch (error) {
      // [D-1.12 C4 closure 2026-04-29] Pre-fix this catch returned
      // `{ mode: 'comprehensive', reanalysisTriggered: false }` —
      // shape-indistinguishable from the policy-defer branch above.
      // Same caller-visibility gap as C3. Now: emit structured telemetry
      // + populate deferReason='comprehensive_failed' + error so the
      // boundary can route correctly. C1 (coordinator-rebuild) and C2
      // (closeVersion) inside triggerReanalysis now throw cleanly into
      // this catch instead of silently swallowing.
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[ReanalysisOrchestrator] triggerReanalysis failed:', msg);
      const iter = getCurrentIteration(this.coordinator.getProfile());
      emitIterationEvent(this.essayId, {
        iteration: iter,
        step: 'runComprehensiveMode',
        status: 'failed',
        error: {
          message: msg,
          code: 'trigger_reanalysis_threw',
          context: {
            downstreamBehavior: 'EditProcessResult.deferReason=comprehensive_failed; caller surfaces error.',
            wasEscalation: focusedResult !== undefined,
          },
        },
        timestamp: new Date().toISOString(),
      });
      return {
        editOutput,
        mode: 'comprehensive',
        focusedResult,
        reanalysisTriggered: false,
        totalCost,
        costBreakdown,
        deferReason: 'comprehensive_failed',
        error: { layer: 'triggerReanalysis', message: msg, code: 'trigger_reanalysis_threw' },
      };
    }
  }
}

// ============================================================================
// FACTORY & EXPORT
// ============================================================================

/**
 * Create a ReanalysisOrchestrator for an existing essay profile.
 * Each essay session should have its own instance — this is NOT a singleton.
 *
 * @param profile         The current EssayProfile snapshot
 * @param checkpointStore Store for saving profile checkpoints
 * @param essayId         REQUIRED essay UUID — threaded into checkpoint
 *                        metadata (Round 7 P0, D4-H1)
 */
export function createReanalysisOrchestrator(
  profile: EssayProfile,
  checkpointStore: CheckpointStore,
  essayId: string,
): ReanalysisOrchestrator {
  return new ReanalysisOrchestrator(profile, checkpointStore, essayId);
}
