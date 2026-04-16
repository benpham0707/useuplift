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

  // ── Construction ──────────────────────────────────────────────────────────

  constructor(profile: EssayProfile, checkpointStore: CheckpointStore, essayId?: string) {
    this.checkpointStore = checkpointStore;
    this.coordinator = EssayProfileCoordinator.fromCheckpoint(profile, checkpointStore);
    this.router = new ProfileRouter();
    this.essayId = essayId ?? `essay_${Date.now()}`;

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
  async triggerReanalysis(): Promise<ReanalysisResult> {
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

    const pipelineInput: PipelineInput = {
      // FIX 4.7: use stored essayId instead of synthetic one
      essayId: this.essayId,
      essayText: currentText,
      essayType,
      priorFindings: priorFindings.length > 0 ? priorFindings : undefined,
    };

    // Run comprehensive pipeline with the reanalysis brief
    let pipelineResult: PipelineResult;
    try {
      pipelineResult = await analyzeEssay(pipelineInput, brief);
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
    try {
      const freshProfile = pipelineResult.profile as EssayProfile;
      this.coordinator = EssayProfileCoordinator.fromCheckpoint(
        freshProfile,
        this.checkpointStore,
      );
      console.log('[ReanalysisOrchestrator] Coordinator updated with fresh post-reanalysis profile (checkpoint store preserved)');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[ReanalysisOrchestrator] Failed to update coordinator after reanalysis (CRITICAL): ${msg}`,
      );
      // This is a serious issue — the coordinator is now stale. But we still return
      // the result so the caller can see the reanalysis output.
    }

    // Close the version record
    let versionRecord: VersionRecord;
    try {
      versionRecord = this.versionTracker.closeVersion(currentText);
    } catch (err) {
      console.error('[ReanalysisOrchestrator] Failed to close version (non-fatal):', err);
      // Synthesize a minimal version record so we can still return a result
      versionRecord = {
        version: 0,
        snapshotText: currentText,
        analyzedAt: new Date().toISOString(),
        changes: [],
        insightsSinceLastVersion: [],
        lightTouchAdjustments: [],
      };
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
      console.error(
        '[ReanalysisOrchestrator] focusedAnalyzer.runFocusedAnalysis failed (deferring):',
        error instanceof Error ? error.message : String(error),
      );
      // On focused analysis failure: defer — don't escalate automatically
      return {
        editOutput,
        mode: 'deferred',
        reanalysisTriggered: false,
        totalCost,
        costBreakdown,
      };
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
      return {
        editOutput,
        mode: 'comprehensive',
        focusedResult,
        reanalysisTriggered: false,
        totalCost,
        costBreakdown,
      };
    }

    // Trigger re-analysis
    console.log(
      `[ReanalysisOrchestrator] Triggering comprehensive re-analysis from edit ` +
      `(urgency=${trigger.urgency})`,
    );
    let reanalysisBrief: ReanalysisBrief | undefined;

    try {
      const reanalysisResult = await this.triggerReanalysis();
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
      console.error(
        '[ReanalysisOrchestrator] triggerReanalysis failed:',
        error instanceof Error ? error.message : String(error),
      );
      return {
        editOutput,
        mode: 'comprehensive',
        focusedResult,
        reanalysisTriggered: false,
        totalCost,
        costBreakdown,
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
 * @param essayId         Optional essay ID — used in re-analysis pipeline inputs
 */
export function createReanalysisOrchestrator(
  profile: EssayProfile,
  checkpointStore: CheckpointStore,
  essayId?: string,
): ReanalysisOrchestrator {
  return new ReanalysisOrchestrator(profile, checkpointStore, essayId);
}
