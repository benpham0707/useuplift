/**
 * Essay Intelligence System — Barrel Exports
 *
 * Unified 6-layer essay understanding system:
 *   Layer 1: Deterministic foundation (features, narrative, sentence, word)
 *   Layer 2: Structural cartography (Haiku)
 *   Layer 3: Sequential deep walk (Sonnet × N paragraphs)
 *   Layer 4: Crystallization (Essay DNA + Paragraph Score Matrix)
 *   Layer 5: Targeted annotation
 *   Layer 6: Conversation-driven deepening
 */

// ── Types ──
export type {
  // Core hierarchy
  EssayUnderstanding,
  ParagraphUnderstanding,
  SentenceUnderstanding,
  WordAnnotation,

  // Layer 2
  StructuralCartography,

  // Layer 3
  RunningUnderstanding,
  ParagraphDeepAnalysis,

  // Layer 4
  EssayDNA,
  ParagraphScoreMatrix,

  // Layer 5
  DeepAnnotation,

  // Conversation
  ConversationInsight,
  ConversationFocus,
  ContextSlice,
  ContextRoute,
  AssembledContext,

  // Diff
  DiffResult,
  MeaningfulDiffResult,

  // Analysis
  AnalysisInput,
  AnalysisResult,
  AnalysisConfig,
  AnalysisPass,

  // Metrics
  SentenceMetrics,
  WordFlag,

  // Enums
  ReadinessLevel,
  ParagraphVerdict,
  ImpactLevel,
  WeaknessSeverity,
  WordVerdict,
  TransitionQuality,
  ThreadStrength,
  ArcMomentum,
  ConnectionType,
  AnnotationGranularity,
  WordFlagCategory,
  SentenceRhythm,
  SentenceType,
  AnalysisLayer,
} from './types';

export { DEFAULT_ANALYSIS_CONFIG } from './types';

// ── Services ──
export { EssayUnderstandingService, essayUnderstandingService } from './essayUnderstandingService';
export { DiffEngine, diffEngine } from './diffEngine';
export { SentenceAnalyzer, sentenceAnalyzer } from './sentenceAnalyzer';
export { WordAnalyzer, wordAnalyzer } from './wordAnalyzer';
export { ContextBuilder, contextBuilder } from './contextBuilder';

// ── Analysis layers ──
export { StructuralCartographer, structuralCartographer } from './analysis/structuralCartographer';
export { SequentialDeepWalk, sequentialDeepWalk } from './analysis/sequentialDeepWalk';
export { RunningUnderstandingManager, runningUnderstandingManager } from './analysis/runningUnderstandingManager';
export { CrystallizerService, crystallizerService } from './analysis/crystallizer';
export type {
  ParagraphScoreEntry,
  ParagraphScoreMatrix as L4ParagraphScoreMatrix,
  CoherenceIssue,
  CoherenceReport,
  L4CrystallizationResult,
} from './analysis/crystallizer';
export { DeepAnnotationService, deepAnnotationService } from './analysis/deepAnnotationService';
export { AnalysisOrchestrator, analysisOrchestrator } from './analysis/analysisOrchestrator';
