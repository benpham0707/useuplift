/**
 * Enhanced Workshop Types
 *
 * Output types for the enhanced workshop system that wraps existing
 * workshop orchestrators with new capabilities (voice profiling,
 * inline editing, authenticity checking, session context, analytics).
 *
 * These types extend — never replace — the existing workshop types.
 */

import type { StudentVoiceProfile } from '../voiceProfile/types';
import type { AIRiskAssessment } from '../authenticity/types';
import type { DocumentSession, StartSessionInput } from '../sessionContext/types';
import type { InlineEditRequest, InlineEditResult, EditingCommand } from '../inlineEditor/types';
import type { VersionComparison } from '../analytics/types';
import type { VersionScores, VersionEdit } from '../analytics/versionComparisonService';
import type { CommandSuggestion } from '../inlineEditor/inlineEditorService';

// ============================================================================
// SESSION
// ============================================================================

/** Input for starting an enhanced editing session */
export interface StartEnhancedSessionInput {
  /** Document type being edited */
  documentType: StartSessionInput['documentType'];
  /** Current essay/document text */
  text: string;
  /** Essay type (e.g., Common App prompt, PIQ prompt number) */
  essayType?: string;
  /** The prompt text the student is responding to */
  promptText?: string;
  /** Target college ID */
  collegeId?: string;
}

/** An active enhanced editing session — bundles old session + new capabilities */
export interface EnhancedSession {
  sessionId: string;
  voiceProfile: StudentVoiceProfile | null;
  aiRisk: AIRiskAssessment;
  documentType: StartSessionInput['documentType'];
  essayType?: string;
  wordCount: number;
}

// ============================================================================
// INLINE EDITING
// ============================================================================

/** Request for an enhanced inline edit */
export interface EnhancedInlineEditRequest {
  /** Active session ID */
  sessionId: string;
  /** The selected text to transform */
  selectedText: string;
  /** Full document text for context */
  fullDocument: string;
  /** Character positions of the selection */
  selectionStart: number;
  selectionEnd: number;
  /** The editing command to apply */
  command: EditingCommand;
  /** Additional context from the user */
  additionalContext?: string;
}

/** Request for command suggestions */
export interface SuggestCommandsRequest {
  /** Selected text to get suggestions for */
  selectedText: string;
  /** Full document for context */
  fullDocument: string;
  /** Essay type for domain-specific suggestions */
  essayType?: string;
}

// ============================================================================
// VOICE PROFILE
// ============================================================================

/** Request to build or enrich a voice profile */
export interface BuildVoiceProfileRequest {
  /** Writing sample to analyze */
  text: string;
  /** Source of the writing sample */
  source: 'essay' | 'chat' | 'uploaded_sample';
}

// ============================================================================
// AUTHENTICITY
// ============================================================================

/** Request for an authenticity check */
export interface AuthenticityCheckRequest {
  /** Text to check for AI-likeness */
  text: string;
}

// ============================================================================
// VERSION COMPARISON
// ============================================================================

/** Request to compare two scored essay versions */
export interface VersionCompareRequest {
  oldVersion: VersionScores;
  newVersion: VersionScores;
  edits?: VersionEdit[];
}

/** Result of version comparison with summary */
export interface EnhancedVersionComparison extends VersionComparison {
  summary: string;
}

// ============================================================================
// WRITING ENHANCEMENT
// ============================================================================

/** Snapshot of essay quality at a point in time */
export interface EssaySnapshot {
  text: string;
  wordCount: number;
  eqi: number;
  dimensionScores: Record<string, number>;
  impressionLabel: string;
  weakestDimensions: string[];
  flags: string[];
}

/** A single improvement action recommended by the planner */
export interface ImprovementAction {
  /** Target dimension to improve */
  dimension: string;
  /** Editing command to apply */
  command: EditingCommand;
  /** Which passage to target (substring of essay) */
  targetPassage: string;
  /** Why this action was chosen */
  rationale: string;
  /** Expected EQI gain from this action */
  expectedGain: number;
  /** Difficulty estimate */
  difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  /** Priority rank (1 = highest) */
  rank: number;
}

/** Output of the improvement planner */
export interface ImprovementPlan {
  /** Pre-analysis snapshot */
  snapshot: EssaySnapshot;
  /** ROI-ranked list of actions */
  actions: ImprovementAction[];
  /** Top recommendation summary */
  summary: string;
}

/** LLM-powered quality judgment — the nuance layer of the guard */
export interface LLMJudgment {
  /** Overall verdict from the LLM judge */
  verdict: 'improved' | 'neutral' | 'degraded';
  /** Confidence in the judgment (0-1) */
  confidence: number;
  /** 1-2 sentence explanation of the judgment */
  explanation: string;
  /** Does the edited text preserve the student's authentic voice? */
  voiceConsistent: boolean;
  /** Did specificity increase, stay the same, or decrease? */
  specificityChange: 'increased' | 'maintained' | 'decreased';
  /** Did authenticity increase, stay the same, or decrease? */
  authenticityChange: 'increased' | 'maintained' | 'decreased';
}

/** Context about the edit being evaluated (passed to the guard) */
export interface EditContext {
  /** The improvement action that was applied */
  action: ImprovementAction;
  /** The original passage before editing */
  beforePassage: string;
  /** The edited passage after editing */
  afterPassage: string;
  /** Student's voice profile (always required — no silent skips) */
  voiceProfile: StudentVoiceProfile;
  /** Essay type for context */
  essayType?: string;
}

/** Result of a regression check (hybrid: heuristic + LLM) */
export interface RegressionCheckResult {
  /** Did the edit pass? Determined by combining heuristic + LLM signals */
  passed: boolean;
  /** Per-dimension deltas from heuristic scorer (positive = improvement) */
  dimensionDeltas: Record<string, number>;
  /** EQI delta from heuristic scorer */
  eqiDelta: number;
  /** Dimensions that regressed (heuristic) */
  regressions: Array<{
    dimension: string;
    before: number;
    after: number;
    delta: number;
  }>;
  /** Dimensions that improved (heuristic) */
  improvements: Array<{
    dimension: string;
    before: number;
    after: number;
    delta: number;
  }>;
  /** LLM quality judgment — always present, never falls back to heuristic-only */
  llmJudgment: LLMJudgment;
  /** Reason for rejection (if failed) */
  rejectionReason?: string;
}

/** Result of a single enhancement step */
export interface EnhancementStepResult {
  /** The action that was applied */
  action: ImprovementAction;
  /** The edited text (primary suggestion from inline editor) */
  editedText: string;
  /** Did the edit pass regression guard? */
  passed: boolean;
  /** Regression check details */
  regressionCheck: RegressionCheckResult;
  /** Teaching note from the inline editor */
  teachingNote: string;
  /** LLM cost for this step */
  cost: number;
}

/** Input for the full enhance endpoint */
export interface EnhanceRequest {
  /** Essay text to improve */
  text: string;
  /** Essay type */
  essayType?: string;
  /** Max improvement steps (default 3) */
  maxSteps?: number;
  /** Session ID (for voice/context) */
  sessionId?: string;
  /** Specific dimensions to focus on (optional) */
  focusDimensions?: string[];
}

/** Output of the full enhance flow */
export interface EnhanceResult {
  /** Original text */
  originalText: string;
  /** Final improved text */
  improvedText: string;
  /** Before snapshot */
  before: EssaySnapshot;
  /** After snapshot */
  after: EssaySnapshot;
  /** EQI improvement */
  eqiGain: number;
  /** Steps applied */
  steps: EnhancementStepResult[];
  /** Steps that were rejected by regression guard */
  rejectedSteps: EnhancementStepResult[];
  /** Total LLM cost */
  totalCost: number;
  /** Total time (ms) */
  totalTimeMs: number;
}

/** Input for pre-analyze endpoint */
export interface PreAnalyzeRequest {
  text: string;
  essayType?: string;
}

/** Input for plan-improvements endpoint */
export interface PlanImprovementsRequest {
  text: string;
  essayType?: string;
  focusDimensions?: string[];
  maxActions?: number;
}

/** Input for regression-check endpoint */
export interface RegressionCheckRequest {
  beforeText: string;
  afterText: string;
  essayType?: string;
}

// ============================================================================
// RE-EXPORTS (convenience)
// ============================================================================

export type {
  StudentVoiceProfile,
  AIRiskAssessment,
  InlineEditResult,
  EditingCommand,
  CommandSuggestion,
  VersionScores,
  VersionEdit,
};
