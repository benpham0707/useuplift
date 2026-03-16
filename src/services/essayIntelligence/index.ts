/**
 * Essay Intelligence System — Barrel Exports (V2)
 *
 * The V2 system is organized into:
 *   - Profile Types: complete type system for the EssayProfile
 *   - Profile Manager: coordinator, checkpoint stores, mutators, router
 *   - Analysis Pipeline: L1→L2→L2.5→L3→L3.75→L3.5→L4+L5 layers
 *   - Edit Understanding: classifies what an edit means in context
 *   - Focused Analyzer: surgical re-analysis for small changes
 *   - Reanalysis Orchestrator: edit lifecycle management (focused vs comprehensive)
 *   - Coaching Service: L6 student conversation → coaching response
 *   - Version Tracker: tracks edits, staleness, triggers re-analysis
 */

// ============================================================================
// PROFILE TYPES (the type system that everything else consumes)
// ============================================================================

export type {
  // Core profile
  EssayProfile,
  ProfileIndex,
  EssayNorthStar,

  // Paragraph-level
  ParagraphProfile,
  SentenceProfile,

  // Understanding layer (descriptive — what the essay IS)
  ObservationEntry,
  ParagraphUnderstanding,
  SentenceUnderstanding,

  // Analysis layer (evaluative — how well it works)
  ParagraphAnalysis,
  AnalysisPassOutput,

  // Holistic sections
  VoiceIdentity,
  VoiceMap,
  EmotionalTopography,
  MomentEarnednessMap,
  ThematicArchitecture,
  NarrativeStrategy,
  CharacterRevelation,
  CraftAssessment,
  AdmissionsPositioning,

  // Connections (V2: bidirectional, strength-aware connection graph)
  Connection,
  ConnectionEndpoint,
  ConnectionRoutingTag,
  ConnectionStrengthCategory,
  ConnectionDirectionality,
  ConnectionSource,
  ProfileConnections,

  // Conversation insights
  ConversationInsight,
  PatternInsight,

  // Edit understanding types
  EditDiff,
  EditUnderstanding,
  EditUnderstandingOutput,
  StalenessEffect,
  EditChangeType,

  // Version tracking
  VersionRecord,
  ReanalysisBrief,

  // Improvement phase
  ImprovementPhase,
  ImprovementPhaseLevel,

  // Checkpoint
  CheckpointStore,

  // Finding lifecycle types
  Finding,
  FindingMaturity,
  FindingCoachingValue,
  FindingSource,
  FindingScope,
  FindingEvidence,
  FindingLineageEntry,

  // Enums & unions
  HolisticDimension,
  HolisticSectionType,
  EssayType,
  InsightCategory,
  ConfidenceLevel,
  NorthStarConfidence,
  StalenessStrength,
  MutationType,
  StructuralWeight,

  // Coaching intelligence (Improvement 6)
  CognitiveAssessment,
  CoachingSessionMemory,
  LearningStyleObservations,
  CoachingQualitySignals,

  // Version branching (Improvement 10)
  SnapshotSource,
  SnapshotUnderstanding,
  EssaySnapshot,
  SnapshotComparison,
} from './profileTypes';

// ============================================================================
// PROFILE MANAGER (coordinator, router, checkpoint stores)
// ============================================================================

export {
  EssayProfileCoordinator,
  createInitialProfile,
} from './profileManager/essayProfileManager';

export { ProfileRouter } from './profileManager/profileRouter';
export type { AssembledProfileContext } from './profileManager/profileRouter';

export {
  InMemoryCheckpointStore,
  NoOpCheckpointStore,
} from './profileManager/checkpointStore';

// ============================================================================
// CONNECTION GRAPH (V2: bidirectional, strength-aware)
// ============================================================================

export {
  ConnectionGraph,
  createConnection,
  buildHolisticConnectionContext,
  buildParagraphConnectionContext,
  buildScoutLeadContext,
  buildRevalidationContext,
  buildCompactConnectionContext,
} from './connections';

// ============================================================================
// ANALYSIS PIPELINE (L1 → L5)
// ============================================================================

// L1: First impressions + sentence/word analysis
export { EssayUnderstandingService, essayUnderstandingService } from './essayUnderstandingService';

// L2: Structural cartography (Haiku)
export { StructuralCartographer, structuralCartographer } from './analysis/structuralCartographer';

// L3: Sequential deep walk (Sonnet × N paragraphs)
export { SequentialDeepWalk, sequentialDeepWalk } from './analysis/sequentialDeepWalk';

// L3.75: Holistic synthesis (Sonnet, single call after walk)
export { holisticSynthesisService } from './analysis/holisticSynthesis';

// L3.5: Analysis pass (Sonnet, parallel per paragraph)
// Phase assessment (LLM-assessed via Sonnet — replaces deterministic computeImprovementPhase)
export { assessPhase } from './analysis/phaseAssessment';
export type { PhaseAssessmentInput, PhaseAssessmentResult } from './analysis/phaseAssessment';

// L4+L5: Crystallization + deep annotation
export { CrystallizerService, crystallizerService } from './analysis/crystallizer';
export type { L4CrystallizationResult } from './analysis/crystallizer';
export { DeepAnnotationService, deepAnnotationService } from './analysis/deepAnnotationService';

// Pipeline orchestrator (runs L1→L5 in sequence)
export {
  AnalysisOrchestrator,
  analysisOrchestrator,
  analyzeEssay,
} from './analysis/analysisOrchestrator';
export type {
  PipelineInput,
  PipelineResult,
  LayerCost,
  TokenUsage,
  CostSummary,
} from './analysis/analysisOrchestrator';

// ============================================================================
// FINDING LIFECYCLE (graduated evolution — append-only finding store)
// ============================================================================

export {
  FindingStore,
  COACHING_VALUE_ORDER,
  buildFindingContext,
  buildCompactFindingContext,
  buildParagraphFindingContext,
  buildFindingReferenceContext,
  deriveSentenceParticipation,
} from './findings';

export type { FindingContextOptions } from './findings';

// ============================================================================
// EDIT UNDERSTANDING (classifies what an edit means)
// ============================================================================

export {
  EditUnderstandingService,
  editUnderstandingService,
} from './analysis/editUnderstandingService';
export type { EditUnderstandingResult } from './analysis/editUnderstandingService';

// ============================================================================
// FOCUSED ANALYZER (surgical re-analysis for small edits)
// ============================================================================

export {
  FocusedAnalyzer,
  focusedAnalyzer,
} from './analysis/focusedAnalyzer';
export type {
  FocusedUnderstandingDelta,
  FocusedAnalysisDelta,
  FocusedAnalysisResult,
} from './analysis/focusedAnalyzer';

// ============================================================================
// REANALYSIS ORCHESTRATOR (edit lifecycle: focused vs comprehensive)
// ============================================================================

export {
  ReanalysisOrchestrator,
  createReanalysisOrchestrator,
} from './analysis/reanalysisOrchestrator';
export type {
  EditProcessResult,
  CoachingTurnResult,
  ReanalysisResult,
  ReanalysisSuggestion,
  ConversationTurn,
} from './analysis/reanalysisOrchestrator';

// ============================================================================
// COACHING SERVICE (L6: student conversation → coaching response)
// ============================================================================

export {
  CoachingService,
  coachingService,
} from './coaching/coachingService';
export type {
  CoachingResult,
  Stage4Verdict,
} from './coaching/coachingService';

// ============================================================================
// VERSION TRACKER (tracks edits, staleness, triggers re-analysis)
// ============================================================================

export {
  VersionTracker,
  createVersionTracker,
  serializeStalenessAccumulator,
} from './versionTracker';
export type { ReanalysisTrigger } from './versionTracker';

// ============================================================================
// VERSION BRANCHING (Improvement #10: Snapshot + Compare)
// ============================================================================

export {
  SnapshotManager,
  compareToSnapshot,
  hashCurrentState,
  shouldAutoSnapshotForEdit,
  shouldAutoSnapshotForMilestone,
} from './versioning';
export type {
  SnapshotSummary,
  CurrentEssayState,
  EditEvent,
  AutoSnapshotDecision,
  MilestoneEvent,
} from './versioning';
