/**
 * PASS Session Manager
 *
 * Manages session state for the multi-stage portfolio analysis pipeline.
 * Handles:
 * - Session creation and lifecycle
 * - Intermediate result storage
 * - Stage completion tracking
 * - Context accumulation between stages
 */

import {
  AnalysisStage,
  StageSummary,
  PipelineState,
  ComprehensiveStudentInput,
  ComprehensiveAnalysisConfig,
} from '../types';

// ============================================================================
// SESSION STATE TYPES
// ============================================================================

export interface PASSSession {
  id: string;
  userId: string;
  createdAt: string;
  lastUpdatedAt: string;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  currentStage: AnalysisStage | null;
  completedStages: AnalysisStage[];
  stageResults: Map<AnalysisStage, StageResult>;
  accumulatedContext: AccumulatedContext;
  metrics: SessionMetrics;
  config: ComprehensiveAnalysisConfig;
  input: ComprehensiveStudentInput;
}

export interface StageResult {
  stage: AnalysisStage;
  startedAt: string;
  completedAt: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output: any;
  error?: string;
  llmCalls: LLMCallRecord[];
  summary: StageSummary | null;
}

export interface LLMCallRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costCents: number;
  latencyMs: number;
  purpose: string;
}

export interface AccumulatedContext {
  // Stage 0 outputs
  studentArchetype?: string;
  preliminaryTiers?: Record<string, number>;
  contextFlags?: string[];

  // Stage 1 outputs
  activityDiagnosis?: {
    tierClassifications: Array<{ name: string; tier: 1 | 2 | 3 | 4 }>;
    spikeDetected: boolean;
    spikeAreas: string[];
    gaps: string[];
  };
  academicDiagnosis?: {
    rigorLevel: string;
    trajectoryDirection: string;
    testingStrategy: string;
  };
  essayDiagnosis?: {
    topicsUsed: string[];
    voiceStrength: number;
    overlaps: string[];
  };

  // Stage 2 outputs
  characterScores?: Record<string, number>;
  narrativeCoherence?: number;
  harvardScore?: number;
  keyStrengths?: string[];
  developmentAreas?: string[];

  // Stage 3 outputs
  schoolFitScores?: Record<string, number>;

  // Stage 4 outputs
  strategicRecommendations?: string[];

  // Citations tracked across all stages
  citations: Array<{
    stage: AnalysisStage;
    source: string;
    reference: string;
  }>;
}

export interface SessionMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  totalCostCents: number;
  totalLatencyMs: number;
  llmCallCount: number;
  stageTimings: Record<AnalysisStage, number>;
}

// ============================================================================
// SESSION MANAGER CLASS
// ============================================================================

export class PASSSessionManager {
  private sessions: Map<string, PASSSession> = new Map();
  private userSessionIndex: Map<string, string[]> = new Map();

  /**
   * Create a new analysis session
   */
  createSession(
    userId: string,
    input: ComprehensiveStudentInput,
    config: ComprehensiveAnalysisConfig
  ): PASSSession {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: PASSSession = {
      id: sessionId,
      userId,
      createdAt: now,
      lastUpdatedAt: now,
      status: 'active',
      currentStage: null,
      completedStages: [],
      stageResults: new Map(),
      accumulatedContext: {
        citations: [],
      },
      metrics: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCachedTokens: 0,
        totalCostCents: 0,
        totalLatencyMs: 0,
        llmCallCount: 0,
        stageTimings: {} as Record<AnalysisStage, number>,
      },
      config,
      input,
    };

    this.sessions.set(sessionId, session);

    // Index by user
    const userSessions = this.userSessionIndex.get(userId) || [];
    userSessions.push(sessionId);
    this.userSessionIndex.set(userId, userSessions);

    console.log(`[SessionManager] Created session ${sessionId} for user ${userId}`);
    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): PASSSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions for a user
   */
  getUserSessions(userId: string): PASSSession[] {
    const sessionIds = this.userSessionIndex.get(userId) || [];
    return sessionIds
      .map(id => this.sessions.get(id))
      .filter((s): s is PASSSession => s !== undefined);
  }

  /**
   * Start a stage in the session
   */
  startStage(sessionId: string, stage: AnalysisStage): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const stageResult: StageResult = {
      stage,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'running',
      output: null,
      llmCalls: [],
      summary: null,
    };

    session.stageResults.set(stage, stageResult);
    session.currentStage = stage;
    session.lastUpdatedAt = new Date().toISOString();

    console.log(`[SessionManager] Started stage ${stage} for session ${sessionId}`);
  }

  /**
   * Record an LLM call within a stage
   */
  recordLLMCall(
    sessionId: string,
    stage: AnalysisStage,
    record: LLMCallRecord
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const stageResult = session.stageResults.get(stage);
    if (!stageResult) {
      throw new Error(`Stage ${stage} not started in session ${sessionId}`);
    }

    stageResult.llmCalls.push(record);

    // Update session metrics
    session.metrics.totalInputTokens += record.inputTokens;
    session.metrics.totalOutputTokens += record.outputTokens;
    session.metrics.totalCachedTokens += record.cachedTokens;
    session.metrics.totalCostCents += record.costCents;
    session.metrics.totalLatencyMs += record.latencyMs;
    session.metrics.llmCallCount += 1;

    session.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Complete a stage with its output
   */
  completeStage(
    sessionId: string,
    stage: AnalysisStage,
    output: any,
    summary: StageSummary
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const stageResult = session.stageResults.get(stage);
    if (!stageResult) {
      throw new Error(`Stage ${stage} not started in session ${sessionId}`);
    }

    stageResult.completedAt = new Date().toISOString();
    stageResult.status = 'completed';
    stageResult.output = output;
    stageResult.summary = summary;

    // Calculate stage timing
    const startTime = new Date(stageResult.startedAt).getTime();
    const endTime = new Date(stageResult.completedAt).getTime();
    session.metrics.stageTimings[stage] = endTime - startTime;

    session.completedStages.push(stage);
    session.currentStage = null;
    session.lastUpdatedAt = new Date().toISOString();

    console.log(`[SessionManager] Completed stage ${stage} for session ${sessionId}`);
  }

  /**
   * Fail a stage with an error
   */
  failStage(sessionId: string, stage: AnalysisStage, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const stageResult = session.stageResults.get(stage);
    if (!stageResult) {
      throw new Error(`Stage ${stage} not started in session ${sessionId}`);
    }

    stageResult.completedAt = new Date().toISOString();
    stageResult.status = 'failed';
    stageResult.error = error;

    session.currentStage = null;
    session.lastUpdatedAt = new Date().toISOString();

    console.error(`[SessionManager] Stage ${stage} failed for session ${sessionId}: ${error}`);
  }

  /**
   * Update accumulated context with stage outputs
   */
  updateContext(
    sessionId: string,
    contextUpdate: Partial<AccumulatedContext>
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Merge context updates
    session.accumulatedContext = {
      ...session.accumulatedContext,
      ...contextUpdate,
      // Special handling for citations - append rather than replace
      citations: [
        ...session.accumulatedContext.citations,
        ...(contextUpdate.citations || []),
      ],
    };

    session.lastUpdatedAt = new Date().toISOString();
  }

  /**
   * Get accumulated context for building prompts
   */
  getAccumulatedContext(sessionId: string): AccumulatedContext {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return session.accumulatedContext;
  }

  /**
   * Get stage result
   */
  getStageResult(sessionId: string, stage: AnalysisStage): StageResult | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return session.stageResults.get(stage) || null;
  }

  /**
   * Complete the session
   */
  completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'completed';
    session.lastUpdatedAt = new Date().toISOString();

    console.log(
      `[SessionManager] Session ${sessionId} completed. ` +
      `Total cost: $${(session.metrics.totalCostCents / 100).toFixed(4)}, ` +
      `Total tokens: ${session.metrics.totalInputTokens + session.metrics.totalOutputTokens}`
    );
  }

  /**
   * Fail the session
   */
  failSession(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'failed';
    session.lastUpdatedAt = new Date().toISOString();

    console.error(`[SessionManager] Session ${sessionId} failed: ${error}`);
  }

  /**
   * Cancel the session
   */
  cancelSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'cancelled';
    session.lastUpdatedAt = new Date().toISOString();

    console.log(`[SessionManager] Session ${sessionId} cancelled`);
  }

  /**
   * Get session metrics
   */
  getSessionMetrics(sessionId: string): SessionMetrics | null {
    const session = this.sessions.get(sessionId);
    return session?.metrics || null;
  }

  /**
   * Clean up old sessions (call periodically)
   */
  cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const sessionAge = now - new Date(session.createdAt).getTime();
      if (sessionAge > maxAgeMs && session.status !== 'active') {
        this.sessions.delete(sessionId);

        // Clean up user index
        const userSessions = this.userSessionIndex.get(session.userId);
        if (userSessions) {
          const filtered = userSessions.filter(id => id !== sessionId);
          if (filtered.length > 0) {
            this.userSessionIndex.set(session.userId, filtered);
          } else {
            this.userSessionIndex.delete(session.userId);
          }
        }

        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SessionManager] Cleaned up ${cleaned} old sessions`);
    }

    return cleaned;
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `pass_${timestamp}_${random}`;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const passSessionManager = new PASSSessionManager();
