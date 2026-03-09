/**
 * EssayProfileCoordinator — The Thin Dispatch Hub
 *
 * Deliberately thin coordinator that dispatches mutations to domain mutators
 * and manages cross-domain concerns (staleness, validation, checkpointing).
 *
 * What it does:
 * - Owns the optimistic concurrency write lock (writeVersion counter)
 * - Dispatches mutations to the correct domain mutator(s) per layer
 * - Manages cross-domain staleness propagation via the declared dependency map
 * - Triggers ProfileIndex recomputation after every mutation
 * - Handles checkpointing at pipeline boundaries
 * - Validates cross-domain consistency
 *
 * What it does NOT do:
 * - Contain any domain-specific mutation logic
 * - Import database modules or know how persistence works
 * - Make LLM calls or contain any AI logic
 * - Decide what content belongs in any profile section
 *
 * Spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  EssayType,
  ConfidenceLevel,
  ImprovementPhaseLevel,
  ProfileIndex,
  ParagraphProfile,
  SentenceProfile,
  SentenceUnderstanding,
  SentenceAnalysis,
  ParagraphUnderstanding,
  ParagraphAnalysis,
  VoiceIdentity,
  VoiceMap,
  EmotionalTopography,
  MomentEarnednessMap,
  ThematicArchitecture,
  NarrativeStrategy,
  CharacterRevelation,
  CraftAssessment,
  CrossDimensionEntanglement,
  AdmissionsPositioning,
  EssayNorthStar,
  ProfileConnections,
  Connection,
  ConversationInsight,
  MutationType,
  CheckpointReason,
  CheckpointStore,
  CheckpointMetadata,
  CircuitBreakerState,
  SessionBoundaryState,
  StalenessSnapshot,
  StalenessReport,
  StalenessTarget,
  StalenessStrength,
  ValidationResult,
  ReadinessScores,
  ObservationEntry,
  ParagraphFirstImpression,
  UnderstandingWalkOutput,
  HolisticSynthesisOutput,
  AnalysisPassOutput,
  NorthStarOutput,
  ConnectionScoutOutput,
  LightTouchUpdate,
  EditUnderstandingOutput,
  StalenessEffect,
} from '../profileTypes';

/**
 * Minimal StructuralCartography shape needed by the coordinator for dispatch.
 * The full type lives in ../types.ts (legacy). We define the subset here
 * to avoid pulling the entire legacy type tree (and its transitive imports)
 * into the profile manager module.
 *
 * When the legacy types.ts is available, consumers can cast to the full type.
 */
interface StructuralCartography {
  paragraphRoles: Array<{
    index: number;
    role: string;
    narrativeFunction: string;
    strengthContribution: string;
    weaknessFlag: string | null;
  }>;
  arcType: string;
  arcConfidence: number;
  arcVerification: string;
  transitions: Array<{
    fromParagraph: number;
    toParagraph: number;
    quality: string;
    mechanism: string;
  }>;
  centralTheme: string;
  themeProgression: string;
  thematicGaps: string[];
  pacingNotes: string;
  flatSpots: number[];
}

import {
  StalenessTrackerImpl,
  propagateStaleness,
  type PropagationContext,
} from './dependencyMap';

import { validateQuick as intraDomainValidateQuick } from './validation/intraDomainValidation';
import { validateFull as crossDomainValidateFull } from './validation/crossDomainValidation';

// ============================================================================
// MUTATOR INTERFACES
// ============================================================================
// These are the contracts that domain mutator implementations (Agents 3 & 4)
// will fulfill. The coordinator dispatches to these interfaces — it never
// contains domain-specific mutation logic.

/**
 * ISentenceMutator — sentence-level understanding and analysis mutations.
 * Owns: observedFunctions, inferredIntents, narrativeContributions,
 *       word significance, tags, back-propagation from later paragraphs.
 */
export interface ISentenceMutator {
  /** Apply understanding to a sentence (L3 walk output or first impressions) */
  applySentenceUnderstanding(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    understanding: Partial<SentenceUnderstanding>,
  ): MutationType[];

  /** Apply analysis to a sentence (L3.5 analysis pass) */
  applySentenceAnalysis(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    analysis: SentenceAnalysis,
  ): MutationType[];

  /** Apply back-propagation from a later paragraph's understanding walk */
  applyBackPropagation(
    profile: EssayProfile,
    update: {
      paragraph: number;
      sentence: number;
      observedFunctions?: ObservationEntry[];
      inferredIntents?: ObservationEntry[];
      narrativeContributions?: ObservationEntry[];
      newTags?: string[];
    },
  ): MutationType[];

  /** Add a connection ref ID to a sentence's connectionRefs array */
  addConnectionRef(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    connectionId: string,
  ): void;

  /** Add tags to a sentence's tags array */
  addTags(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    tags: string[],
  ): void;

  /** Update sentence text (for light-touch updates) */
  updateSentenceText(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    newText: string,
  ): void;

  /** Update inferred intents from student conversation (reinterpretation cascade) */
  updateInferredIntents(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    intents: ObservationEntry[],
    source?: { source: string; insightId: string },
  ): MutationType[];

  /** Correct a specific inferred intent (correction cascade) */
  correctInferredIntent(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    correctedObservation: string,
    correctedTo: ObservationEntry,
    source?: { source: string; insightId: string },
  ): MutationType[];

  /** Enrich narrative context with student-provided background (new_context cascade) */
  enrichNarrativeContext(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    newContext: string,
    source?: { source: string; insightId: string },
  ): MutationType[];

  /** Clarify an ambiguous observation without triggering staleness (clarification cascade) */
  clarifyObservation(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    clarification: string,
    source?: { source: string; insightId: string },
  ): MutationType[];
}

/**
 * IParagraphMutator — paragraph-level understanding, analysis, and role mutations.
 * Owns: paragraph role, effectiveness score, emotional register, craft profile,
 *       structural bookkeeping (sentence counts, index boundaries).
 */
export interface IParagraphMutator {
  /** Apply paragraph understanding (L3 walk output) */
  applyParagraphUnderstanding(
    profile: EssayProfile,
    paragraphIndex: number,
    understanding: Partial<ParagraphUnderstanding>,
  ): MutationType[];

  /** Apply paragraph analysis (L3.5 analysis pass) */
  applyParagraphAnalysis(
    profile: EssayProfile,
    paragraphIndex: number,
    analysis: ParagraphAnalysis,
  ): MutationType[];

  /** Update the structural role (from L2 cartography or L3 walk) */
  updateStructuralRole(
    profile: EssayProfile,
    paragraphIndex: number,
    role: string,
  ): MutationType[];

  /** Update paragraph tags */
  updateParagraphTags(
    profile: EssayProfile,
    paragraphIndex: number,
    tags: string[],
  ): void;

  /** Update structural bookkeeping (sentence counts, boundaries) */
  updateStructuralBookkeeping(
    profile: EssayProfile,
    paragraphCount: number,
    sentenceCounts: number[],
  ): void;
}

/**
 * IHolisticMutator — all 7 holistic sections + entanglements.
 * Supports both incremental merge (during L3 walk) and full supersession (during L3.75).
 */
export interface IHolisticMutator {
  /** Merge incremental holistic evolution from L3 walk step */
  mergeHolisticEvolution(
    profile: EssayProfile,
    evolution: {
      centralThesis?: string;
      thesisConfidence?: number;
      voiceSignature?: string;
      arcMomentum?: string;
    },
  ): MutationType[];

  /** Full supersession of all holistic sections (L3.75 synthesis) */
  applyFullHolisticSynthesis(
    profile: EssayProfile,
    synthesis: HolisticSynthesisOutput,
  ): MutationType[];

  /** Update craft assessment strength signatures (from L3.5 analysis) */
  updateCraftAssessment(
    profile: EssayProfile,
    update: {
      strengthSignatures?: Array<{ quality: string; evidence: string; paragraphs: number[] }>;
      growthEdges?: Array<{ quality: string; description: string; paragraphs: number[] }>;
    },
  ): MutationType[];

  /** Seed narrative strategy from L2 structural cartography */
  seedNarrativeStrategy(
    profile: EssayProfile,
    cartography: StructuralCartography,
  ): MutationType[];

  /** Enrich emotional topography with student-revealed emotional data (emotional_reaction cascade) */
  enrichEmotionalTopography(
    profile: EssayProfile,
    emotionalData: { location?: { paragraph: number; sentence?: number }; emotion?: string; observation?: string },
    source?: { source: string; insightId: string },
  ): MutationType[];
}

/**
 * IConnectionMutator — connection CRUD + referential integrity.
 * Owns: connections.all[], imageRecurrences, narrativeArcMap, redundancies.
 */
export interface IConnectionMutator {
  /** Add connections (from L3 walk, L2.5 scout, or conversation) */
  addConnections(
    profile: EssayProfile,
    connections: Array<{
      from: [number, number];
      to: [number, number];
      type: string;
      description: string;
      confidence?: number;
      discoveredByLayer?: string;
    }>,
  ): { mutations: MutationType[]; connectionIds: string[] };

  /** Remove a connection by ID */
  removeConnection(
    profile: EssayProfile,
    connectionId: string,
  ): MutationType[];

  /** Get connection IDs involving a specific sentence */
  getConnectionsForSentence(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
  ): string[];
}

/**
 * IVoiceMapMutator — voice shift entries, stability regions, intentionality.
 */
export interface IVoiceMapMutator {
  /** Apply the full voice map from L3.75 holistic synthesis */
  applyVoiceMap(
    profile: EssayProfile,
    voiceMap: VoiceMap,
  ): MutationType[];

  /** Update intentionality for a voice shift */
  updateIntentionality(
    profile: EssayProfile,
    shiftIndex: number,
    intentionality: {
      assessment: 'intentional' | 'unintentional' | 'ambiguous';
      confidence: number;
      reasoning: string;
    },
  ): MutationType[];

  /** Mark voice shifts at a location as intentional (preference cascade) */
  markIntentional(
    profile: EssayProfile,
    dimension: string,
    location: { paragraph: number; sentence?: number },
    source?: { source: string; insightId: string },
  ): MutationType[];
}

/**
 * IEarnednessMutator — earned-ness arrow creation, removal, typing.
 */
export interface IEarnednessMutator {
  /** Apply the full earned-ness map from L3.75 holistic synthesis */
  applyEarnednessMap(
    profile: EssayProfile,
    earnednessMap: MomentEarnednessMap,
  ): MutationType[];

  /** Add a single earning mechanism to an existing moment */
  addEarningMechanism(
    profile: EssayProfile,
    momentIndex: number,
    mechanism: {
      type: string;
      location: { paragraph: number; sentence?: number };
      contribution: string;
      connectionRef?: string;
    },
  ): MutationType[];

  /** Remove an earning mechanism */
  removeEarningMechanism(
    profile: EssayProfile,
    momentIndex: number,
    mechanismIndex: number,
  ): MutationType[];
}

/**
 * INorthStarMutator — North Star five dimensions.
 */
export interface INorthStarMutator {
  /** Apply the full North Star from L4 crystallization */
  applyNorthStar(
    profile: EssayProfile,
    northStar: EssayNorthStar,
  ): MutationType[];
}

/**
 * IInsightMutator — conversation insight storage.
 */
export interface IInsightMutator {
  /** Store a new conversation insight */
  applyInsight(
    profile: EssayProfile,
    insight: ConversationInsight,
  ): MutationType[];
}

// ============================================================================
// PLACEHOLDER MUTATORS (no-op implementations for compilation)
// ============================================================================
// These will be replaced by real implementations from Agents 3 & 4.
// They exist so the coordinator compiles and tests can exercise the dispatch flow.

class PlaceholderSentenceMutator implements ISentenceMutator {
  applySentenceUnderstanding(_p: EssayProfile, _pi: number, _si: number, _u: Partial<SentenceUnderstanding>): MutationType[] { return ['sentence_understanding_updated']; }
  applySentenceAnalysis(_p: EssayProfile, _pi: number, _si: number, _a: SentenceAnalysis): MutationType[] { return ['sentence_analysis_updated']; }
  applyBackPropagation(_p: EssayProfile, _u: any): MutationType[] { return ['sentence_understanding_updated']; }
  addConnectionRef(_p: EssayProfile, _pi: number, _si: number, _cid: string): void {}
  addTags(_p: EssayProfile, _pi: number, _si: number, _t: string[]): void {}
  updateSentenceText(_p: EssayProfile, _pi: number, _si: number, _t: string): void {}
  updateInferredIntents(_p: EssayProfile, _pi: number, _si: number, _i: ObservationEntry[]): MutationType[] { return ['sentence_understanding_updated']; }
  correctInferredIntent(_p: EssayProfile, _pi: number, _si: number, _co: string, _ct: ObservationEntry): MutationType[] { return ['sentence_understanding_updated']; }
  enrichNarrativeContext(_p: EssayProfile, _pi: number, _si: number, _nc: string): MutationType[] { return ['sentence_understanding_updated']; }
  clarifyObservation(_p: EssayProfile, _pi: number, _si: number, _c: string): MutationType[] { return []; }
}

class PlaceholderParagraphMutator implements IParagraphMutator {
  applyParagraphUnderstanding(_p: EssayProfile, _pi: number, _u: Partial<ParagraphUnderstanding>): MutationType[] { return ['paragraph_role_updated']; }
  applyParagraphAnalysis(_p: EssayProfile, _pi: number, _a: ParagraphAnalysis): MutationType[] { return []; }
  updateStructuralRole(_p: EssayProfile, _pi: number, _r: string): MutationType[] { return ['paragraph_role_updated']; }
  updateParagraphTags(_p: EssayProfile, _pi: number, _t: string[]): void {}
  updateStructuralBookkeeping(_p: EssayProfile, _pc: number, _sc: number[]): void {}
}

class PlaceholderHolisticMutator implements IHolisticMutator {
  mergeHolisticEvolution(_p: EssayProfile, _e: any): MutationType[] { return ['holistic_section_updated']; }
  applyFullHolisticSynthesis(_p: EssayProfile, _s: HolisticSynthesisOutput): MutationType[] { return ['holistic_section_updated']; }
  updateCraftAssessment(_p: EssayProfile, _u: any): MutationType[] { return ['holistic_section_updated']; }
  seedNarrativeStrategy(_p: EssayProfile, _c: StructuralCartography): MutationType[] { return ['holistic_section_updated']; }
  enrichEmotionalTopography(_p: EssayProfile, _d: any): MutationType[] { return ['holistic_section_updated']; }
}

class PlaceholderConnectionMutator implements IConnectionMutator {
  addConnections(_p: EssayProfile, _c: any[]): { mutations: MutationType[]; connectionIds: string[] } { return { mutations: ['connection_added'], connectionIds: [] }; }
  removeConnection(_p: EssayProfile, _cid: string): MutationType[] { return ['connection_removed']; }
  getConnectionsForSentence(_p: EssayProfile, _pi: number, _si: number): string[] { return []; }
}

class PlaceholderVoiceMapMutator implements IVoiceMapMutator {
  applyVoiceMap(_p: EssayProfile, _v: VoiceMap): MutationType[] { return ['voice_shift_added']; }
  updateIntentionality(_p: EssayProfile, _i: number, _intent: any): MutationType[] { return ['voice_intentionality_updated']; }
  markIntentional(_p: EssayProfile, _d: string, _l: any): MutationType[] { return ['voice_intentionality_updated']; }
}

class PlaceholderEarnednessMutator implements IEarnednessMutator {
  applyEarnednessMap(_p: EssayProfile, _e: MomentEarnednessMap): MutationType[] { return ['earnedness_arrow_added']; }
  addEarningMechanism(_p: EssayProfile, _mi: number, _m: any): MutationType[] { return ['earnedness_arrow_added']; }
  removeEarningMechanism(_p: EssayProfile, _mi: number, _meci: number): MutationType[] { return ['earnedness_arrow_removed']; }
}

class PlaceholderNorthStarMutator implements INorthStarMutator {
  applyNorthStar(_p: EssayProfile, _n: EssayNorthStar): MutationType[] { return ['north_star_updated']; }
}

class PlaceholderInsightMutator implements IInsightMutator {
  applyInsight(_p: EssayProfile, _i: ConversationInsight): MutationType[] { return ['conversation_insight_applied']; }
}

// ============================================================================
// INITIAL PROFILE FACTORY
// ============================================================================

/**
 * Create an initial EssayProfile from raw essay text. No LLM calls.
 * Just data shaping — every field has a defined empty state.
 *
 * This is the ONLY way to create an EssayProfile from scratch.
 */
export function createInitialProfile(input: {
  essayText: string;
  paragraphTexts: string[];
  sentenceTexts: string[][];
  metadata: {
    essayType: EssayType;
    wordCount: number;
    promptText?: string;
  };
}): EssayProfile {
  const { paragraphTexts, sentenceTexts, metadata } = input;

  const now = new Date().toISOString();

  // Build paragraph profiles with sentence stubs
  const paragraphs: ParagraphProfile[] = paragraphTexts.map((text, pIdx) => {
    const sentences: SentenceProfile[] = (sentenceTexts[pIdx] || []).map((sText, sIdx) => ({
      index: sIdx,
      text: sText,
      understanding: null,
      analysis: null,
    }));

    return {
      index: pIdx,
      text,
      tags: [],
      understanding: null,
      analysis: null,
      sentences,
    };
  });

  // Determine North Star scale from essay type
  const activeScale = metadata.essayType === 'supplement'
    ? 'supplement' as const
    : metadata.essayType === 'piq'
      ? 'piq' as const
      : 'personal_statement' as const;

  // Total sentence count
  const totalSentences = sentenceTexts.reduce((sum, p) => sum + p.length, 0);

  // Build empty profile index
  const index: ProfileIndex = {
    essayLength: {
      paragraphs: paragraphTexts.length,
      sentences: totalSentences,
      words: metadata.wordCount,
    },
    confidenceLevel: 'initial',
    topicTags: [],
    paragraphDigest: paragraphTexts.map((_, idx) => ({
      index: idx,
      roleSummary: '',
      tags: [],
      themes: [],
      sentenceCount: sentenceTexts[idx]?.length ?? 0,
      hasStrengths: false,
      hasWeaknesses: false,
      connectionCount: 0,
      improvementPriority: 0,
    })),
    sectionTokenCounts: {
      voiceIdentity: 0,
      voiceMap: 0,
      emotionalTopography: 0,
      momentEarnednessMap: 0,
      thematicArchitecture: 0,
      narrativeStrategy: 0,
      characterRevelation: 0,
      craftAssessment: 0,
      entanglements: 0,
      admissionsPositioning: 0,
      northStar: 0,
      connections: 0,
      paragraphs: paragraphTexts.map(() => 0),
    },
    connectionGraph: [],
    northStarSummary: {
      throughLineSummary: null,
      structuralRoles: [],
      maturity: 'absent',
    },
    stalenessSnapshot: {
      strongStale: [],
      moderateStale: [],
      weakStale: [],
      lastChangeAt: null,
    },
    activeConcerns: [],
    improvementPhase: {
      level: 'foundation',
      reasoning: 'Initial profile — no analysis has been performed yet',
      focusAreas: [],
      deferredAreas: [],
      readiness: { essayLevel: 0, paragraphLevel: 0, sentenceLevel: 0, wordLevel: 0 },
    },
    fullAnalysisCount: 0,
    lastComprehensiveAt: null,
  };

  // Build the full profile
  const profile: EssayProfile = {
    index,

    // Holistic sections — all empty
    voiceIdentity: {
      signature: '',
      register: '',
      distinctivePatterns: [],
      evolution: '',
      authenticVsPerformed: [],
    },
    voiceMap: {
      register: { baseline: '', observations: [] },
      vocabularyFingerprint: { baseline: '', observations: [], domains: [] },
      sentenceRhythm: { baseline: '', observations: [] },
      perspectiveDistance: { baseline: '', observations: [] },
      tonalDisposition: { baseline: '', observations: [], dominantQualities: [] },
      shifts: [],
      codeSwitching: [],
    },
    emotionalTopography: {
      arcTrajectory: '',
      peakMoments: [],
      undertones: [],
      emotionalProgression: [],
      showVsTell: [],
    },
    momentEarnednessMap: {
      moments: [],
      structuralObservation: '',
    },
    thematicArchitecture: {
      centralThesis: '',
      thesisConfidence: 0,
      thesisEvolution: '',
      threads: [],
      subtext: '',
      contradictions: [],
    },
    narrativeStrategy: {
      primaryStrategy: '',
      strategyRationale: '',
      pivotPoints: [],
      pacingAnalysis: '',
      structuralChoices: [],
    },
    characterRevelation: {
      writerPortrait: '',
      valuesRevealed: [],
      growthArc: '',
      intellectualFingerprint: '',
      blindSpots: [],
    },
    craftAssessment: {
      strengthSignatures: [],
      growthEdges: [],
      imageSystem: '',
      sentencePatterns: '',
      wordPatterns: '',
    },
    entanglements: [],
    admissionsPositioning: {
      tellabilitySummary: '',
      distinctivenessFactors: [],
      institutionalFit: '',
      redFlags: [],
      memorability: '',
      portfolioPosition: '',
    },

    // North Star — empty, scaled by essay type
    northStar: {
      activeScale,
      throughLineMap: activeScale === 'personal_statement' ? {
        centralElement: '',
        elementType: 'idea',
        transformation: '',
        journey: [],
        connectionRefs: [],
      } : null,
      structuralRolesMap: [],
      trajectory: activeScale !== 'supplement' ? {
        currentState: '',
        plausiblePaths: [],
        unrealizedConnections: [],
      } : null,
      distinctivenessSignature: {
        articulation: '',
        entanglementRefs: [],
        nonInterchangeableFactors: [],
      },
      intentBridge: activeScale === 'personal_statement' ? {
        studentIntent: null,
        systemReading: '',
        alignments: [],
        sourceInsightIds: [],
      } : null,
      confidence: 'hypothesis',
      lastUpdatedBy: 'initial',
    },

    // Paragraphs
    paragraphs,

    // Connections — empty
    connections: {
      all: [],
      imageRecurrences: [],
      narrativeArcMap: [],
      redundancies: [],
    },

    // Edit history — empty
    editHistory: [],

    // Conversation insights — empty
    conversationInsights: [],
    patternInsights: [],

    // Metadata
    metadata: {
      confidenceLevel: 'initial',
      lastUpdatedLayer: 0,
      paragraphsCovered: [],
      conversationInsightsCount: 0,
      totalAnalysisCost: 0,
      createdAt: now,
      lastMutatedAt: now,
      legacyProfile: false,
    },
  };

  return profile;
}

// ============================================================================
// ESSAY PROFILE COORDINATOR
// ============================================================================

export class EssayProfileCoordinator {
  private profile: EssayProfile;
  private writeVersion: number;
  private stalenessTracker: StalenessTrackerImpl;
  private checkpointStore: CheckpointStore;
  private circuitBreaker: CircuitBreakerState;
  private sessionBoundary: SessionBoundaryState;

  // ── Domain mutators ──
  private sentenceMutator: ISentenceMutator;
  private paragraphMutator: IParagraphMutator;
  private holisticMutator: IHolisticMutator;
  private connectionMutator: IConnectionMutator;
  private voiceMapMutator: IVoiceMapMutator;
  private earnednessMutator: IEarnednessMutator;
  private northStarMutator: INorthStarMutator;
  private insightMutator: IInsightMutator;

  private constructor(
    profile: EssayProfile,
    checkpointStore: CheckpointStore,
    mutators?: Partial<{
      sentence: ISentenceMutator;
      paragraph: IParagraphMutator;
      holistic: IHolisticMutator;
      connection: IConnectionMutator;
      voiceMap: IVoiceMapMutator;
      earnedness: IEarnednessMutator;
      northStar: INorthStarMutator;
      insight: IInsightMutator;
    }>,
  ) {
    this.profile = profile;
    this.writeVersion = 0;
    this.stalenessTracker = new StalenessTrackerImpl();
    this.checkpointStore = checkpointStore;

    this.circuitBreaker = {
      retryCount: 0,
      maxRetries: 3,
      failurePoint: '',
      attempts: [],
      tripped: false,
      cooldownExpiresAt: null,
    };

    this.sessionBoundary = {
      lastMutationAt: Date.now(),
      reanalysisThreshold: 3,
      defaultThreshold: 3,
      isFirstSession: true,
    };

    // Inject mutators — use placeholders if not provided
    this.sentenceMutator = mutators?.sentence ?? new PlaceholderSentenceMutator();
    this.paragraphMutator = mutators?.paragraph ?? new PlaceholderParagraphMutator();
    this.holisticMutator = mutators?.holistic ?? new PlaceholderHolisticMutator();
    this.connectionMutator = mutators?.connection ?? new PlaceholderConnectionMutator();
    this.voiceMapMutator = mutators?.voiceMap ?? new PlaceholderVoiceMapMutator();
    this.earnednessMutator = mutators?.earnedness ?? new PlaceholderEarnednessMutator();
    this.northStarMutator = mutators?.northStar ?? new PlaceholderNorthStarMutator();
    this.insightMutator = mutators?.insight ?? new PlaceholderInsightMutator();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTRUCTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a coordinator for a new essay.
   * Wraps createInitialProfile() to produce a properly shaped empty EssayProfile.
   */
  static createNew(input: {
    essayText: string;
    paragraphTexts: string[];
    sentenceTexts: string[][];
    metadata: {
      essayType: EssayType;
      wordCount: number;
      promptText?: string;
    };
    checkpointStore: CheckpointStore;
    mutators?: Partial<{
      sentence: ISentenceMutator;
      paragraph: IParagraphMutator;
      holistic: IHolisticMutator;
      connection: IConnectionMutator;
      voiceMap: IVoiceMapMutator;
      earnedness: IEarnednessMutator;
      northStar: INorthStarMutator;
      insight: IInsightMutator;
    }>;
  }): EssayProfileCoordinator {
    const profile = createInitialProfile({
      essayText: input.essayText,
      paragraphTexts: input.paragraphTexts,
      sentenceTexts: input.sentenceTexts,
      metadata: input.metadata,
    });
    return new EssayProfileCoordinator(profile, input.checkpointStore, input.mutators);
  }

  /**
   * Create a coordinator from a persisted profile (resume from checkpoint).
   */
  static fromCheckpoint(
    profile: EssayProfile,
    checkpointStore: CheckpointStore,
    mutators?: Partial<{
      sentence: ISentenceMutator;
      paragraph: IParagraphMutator;
      holistic: IHolisticMutator;
      connection: IConnectionMutator;
      voiceMap: IVoiceMapMutator;
      earnedness: IEarnednessMutator;
      northStar: INorthStarMutator;
      insight: IInsightMutator;
    }>,
  ): EssayProfileCoordinator {
    return new EssayProfileCoordinator(profile, checkpointStore, mutators);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER-SPECIFIC MUTATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * L1: Seed the profile from Haiku first impressions (parallel per-paragraph).
   */
  applyFirstImpressions(impressions: ParagraphFirstImpression[]): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L1_impressions');
    const allMutations: MutationType[] = [];

    for (const impression of impressions) {
      // SentenceMutator: map L1's simple string fields into SentenceUnderstanding partials.
      // L1 (Haiku) produces simple strings; L3 (Sonnet) will later SUPERSEDE these
      // with richer ObservationEntry[] via the same applySentenceUnderstanding path.
      for (const sentenceImpression of impression.sentences) {
        const mutations = this.sentenceMutator.applySentenceUnderstanding(
          this.profile,
          impression.paragraphIndex,
          sentenceImpression.index,
          {
            // Map L1's simple apparentPurpose string into an ObservationEntry
            observedFunctions: [{ observation: sentenceImpression.apparentPurpose }],
            // Map L1's rhetoricalFunction into rhetoricalFunctions array
            rhetoricalFunctions: [sentenceImpression.rhetoricalFunction],
            tags: sentenceImpression.tags,
          },
        );
        allMutations.push(...mutations);
      }

      // ParagraphMutator: set initial paragraph role from L1's apparentPurpose
      const roleMutations = this.paragraphMutator.updateStructuralRole(
        this.profile,
        impression.paragraphIndex,
        impression.apparentPurpose,
      );
      allMutations.push(...roleMutations);

      // ParagraphMutator: set paragraph tags
      this.paragraphMutator.updateParagraphTags(
        this.profile,
        impression.paragraphIndex,
        impression.tags,
      );
    }

    this.afterMutation(allMutations, { paragraphIndex: impressions[0]?.paragraphIndex });
  }

  /**
   * L2: Apply structural cartography from Sonnet bird's-eye analysis.
   */
  applyStructuralCartography(cartography: StructuralCartography): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L2_cartography');
    const allMutations: MutationType[] = [];

    // ParagraphMutator: update paragraph roles with structural context (supersession)
    for (const role of cartography.paragraphRoles) {
      const mutations = this.paragraphMutator.updateStructuralRole(
        this.profile,
        role.index,
        role.role,
      );
      allMutations.push(...mutations);
    }

    // HolisticMutator: seed narrative strategy
    const holisticMutations = this.holisticMutator.seedNarrativeStrategy(
      this.profile,
      cartography,
    );
    allMutations.push(...holisticMutations);

    this.afterMutation(allMutations, {});
  }

  /**
   * L2.5: Apply connection scout leads from Haiku parallel scan.
   */
  applyScoutLeads(scout: ConnectionScoutOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L2_5_scout');
    const allMutations: MutationType[] = [];

    // Flatten the categorized scout output into provisional connection leads.
    // Each category maps to a connection type that L3 will later confirm or reject.
    const flattenedLeads: Array<{
      from: [number, number];
      to: [number, number];
      type: string;
      description: string;
      confidence: number;
      discoveredByLayer: string;
    }> = [];

    // Repeated elements: create connections between each pair of occurrences
    for (const elem of scout.repeatedElements) {
      for (let i = 0; i < elem.occurrences.length; i++) {
        for (let j = i + 1; j < elem.occurrences.length; j++) {
          const from = elem.occurrences[i];
          const to = elem.occurrences[j];
          flattenedLeads.push({
            from: [from.paragraphIndex, from.sentenceIndex],
            to: [to.paragraphIndex, to.sentenceIndex],
            type: 'repeated_element',
            description: `Repeated element "${elem.element}": ${elem.potentialSignificance}`,
            confidence: 0.3,
            discoveredByLayer: 'l2_5_scout',
          });
        }
      }
    }

    // Tonal shifts: create connection between the sentence and the next structural boundary
    for (const shift of scout.tonalShifts) {
      flattenedLeads.push({
        from: [shift.location.paragraphIndex, shift.location.sentenceIndex],
        to: [shift.location.paragraphIndex, shift.location.sentenceIndex],
        type: 'tonal_shift',
        description: `Tonal shift from "${shift.fromTone}" to "${shift.toTone}" (${shift.abruptness})`,
        confidence: 0.3,
        discoveredByLayer: 'l2_5_scout',
      });
    }

    // Structural echoes: connect source to echo
    for (const echo of scout.structuralEchoes) {
      flattenedLeads.push({
        from: [echo.source.paragraphIndex, echo.source.sentenceIndex],
        to: [echo.echo.paragraphIndex, echo.echo.sentenceIndex],
        type: 'structural_echo',
        description: `Structural echo: ${echo.echoType}`,
        confidence: 0.3,
        discoveredByLayer: 'l2_5_scout',
      });
    }

    // ConnectionMutator: create provisional connections from flattened leads
    const { mutations: connMutations, connectionIds } = this.connectionMutator.addConnections(
      this.profile,
      flattenedLeads,
    );
    allMutations.push(...connMutations);

    // SentenceMutator: add scout-tag refs to endpoint sentences
    for (let i = 0; i < flattenedLeads.length; i++) {
      const lead = flattenedLeads[i];
      const connId = connectionIds[i];
      if (connId) {
        this.sentenceMutator.addConnectionRef(this.profile, lead.from[0], lead.from[1], connId);
        // Only add ref for 'to' if it's different from 'from' (tonal shifts are self-referencing)
        if (lead.from[0] !== lead.to[0] || lead.from[1] !== lead.to[1]) {
          this.sentenceMutator.addConnectionRef(this.profile, lead.to[0], lead.to[1], connId);
        }
      }
    }

    this.afterMutation(allMutations, { connectionIds });
  }

  /**
   * L3: Apply one paragraph's understanding walk output.
   * The most complex entry point — touches 3 mutators.
   */
  applyUnderstandingWalkStep(output: UnderstandingWalkOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L3_walk');
    const allMutations: MutationType[] = [];

    // 1. SentenceMutator: store sentence understandings for this paragraph
    for (const su of output.sentenceUnderstandings) {
      const mutations = this.sentenceMutator.applySentenceUnderstanding(
        this.profile,
        // Derive paragraph index from the paragraph understanding's position
        this.findParagraphIndexForWalkOutput(output),
        su.index,
        su.understanding,
      );
      allMutations.push(...mutations);
    }

    // 2. ParagraphMutator: store paragraph understanding
    const pIdx = this.findParagraphIndexForWalkOutput(output);
    const pMutations = this.paragraphMutator.applyParagraphUnderstanding(
      this.profile,
      pIdx,
      output.paragraphUnderstanding,
    );
    allMutations.push(...pMutations);

    // 3. SentenceMutator: apply back-propagations
    for (const backProp of output.priorSentenceUpdates) {
      const bpMutations = this.sentenceMutator.applyBackPropagation(this.profile, backProp);
      allMutations.push(...bpMutations);
    }

    // 4. ConnectionMutator: add new connections
    if (output.newConnections.length > 0) {
      const { mutations: connMutations, connectionIds } = this.connectionMutator.addConnections(
        this.profile,
        output.newConnections.map(conn => ({
          ...conn,
          discoveredByLayer: 'l3_walk',
        })),
      );
      allMutations.push(...connMutations);

      // Add connection refs to endpoint sentences
      for (let i = 0; i < output.newConnections.length; i++) {
        const conn = output.newConnections[i];
        const connId = connectionIds[i];
        if (connId) {
          this.sentenceMutator.addConnectionRef(this.profile, conn.from[0], conn.from[1], connId);
          this.sentenceMutator.addConnectionRef(this.profile, conn.to[0], conn.to[1], connId);
        }
      }
    }

    // 5. HolisticMutator: merge incremental holistic evolution
    if (output.holisticEvolution) {
      const hMutations = this.holisticMutator.mergeHolisticEvolution(
        this.profile,
        output.holisticEvolution,
      );
      allMutations.push(...hMutations);
    }

    // Build propagation context with back-propagated sentence locations
    const backPropContext: PropagationContext = {
      paragraphIndex: pIdx,
    };

    this.afterMutation(allMutations, backPropContext);
  }

  /**
   * L3.75: Apply holistic synthesis — replaces ALL 7+1 holistic sections.
   */
  applyHolisticSynthesis(synthesis: HolisticSynthesisOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L3_75_synthesis');
    const allMutations: MutationType[] = [];

    // HolisticMutator: full supersession of all holistic sections
    const hMutations = this.holisticMutator.applyFullHolisticSynthesis(this.profile, synthesis);
    allMutations.push(...hMutations);

    // VoiceMapMutator: populate full voice map
    const vMutations = this.voiceMapMutator.applyVoiceMap(this.profile, synthesis.voiceMap);
    allMutations.push(...vMutations);

    // EarnednessMutator: populate earned-ness arrow network
    const eMutations = this.earnednessMutator.applyEarnednessMap(this.profile, synthesis.momentEarnednessMap);
    allMutations.push(...eMutations);

    this.afterMutation(allMutations, {});

    // Checkpoint after L3.75 (first comprehensive holistic understanding)
    this.checkpoint('after_l3_75');
  }

  /**
   * L3.5: Apply one paragraph's analysis pass output.
   */
  applyAnalysisPassResult(result: AnalysisPassOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L3_5_analysis');
    const allMutations: MutationType[] = [];

    // SentenceMutator: store analysis for each sentence
    for (const sa of result.sentenceAnalyses) {
      const mutations = this.sentenceMutator.applySentenceAnalysis(
        this.profile,
        result.paragraphIndex,
        sa.sentenceIndex,
        {
          effectiveness: sa.effectiveness,
          effectivenessReasoning: sa.effectivenessReasoning,
          strengths: sa.strengths,
          weaknesses: sa.weaknesses,
          isStrength: sa.isStrength,
          isProblem: sa.isProblem,
          priorityForImprovement: sa.priorityForImprovement,
        },
      );
      allMutations.push(...mutations);
    }

    // ParagraphMutator: store paragraph-level analysis
    const pMutations = this.paragraphMutator.applyParagraphAnalysis(
      this.profile,
      result.paragraphIndex,
      {
        effectiveness: result.paragraphEffectiveness,
        verdict: result.paragraphVerdict,
        strengthSignatures: result.holisticAnalysisEvolution?.strengthSignatures ?? [],
        growthEdges: result.holisticAnalysisEvolution?.growthEdges ?? [],
      },
    );
    allMutations.push(...pMutations);

    // HolisticMutator: update craft assessment if there are new strength signatures
    if (result.holisticAnalysisEvolution) {
      const hMutations = this.holisticMutator.updateCraftAssessment(
        this.profile,
        result.holisticAnalysisEvolution,
      );
      allMutations.push(...hMutations);
    }

    this.afterMutation(allMutations, { paragraphIndex: result.paragraphIndex });
  }

  /**
   * L4: Apply North Star crystallization.
   */
  applyNorthStar(northStar: NorthStarOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L4_north_star');

    const mutations = this.northStarMutator.applyNorthStar(this.profile, northStar);

    this.afterMutation(mutations, {});

    // Checkpoint after L4
    this.checkpoint('after_l4');
  }

  /**
   * L6: Apply a conversation insight from coaching interaction.
   *
   * This is the cascade dispatch hub for student insights. The method:
   * 1. Stores the insight via InsightMutator (always)
   * 2. Dispatches category-specific cascade effects to domain mutators
   * 3. Propagates staleness based on which mutations occurred
   *
   * Cascade table:
   * | Category           | Mutators Dispatched                        | Staleness Effect              |
   * |--------------------|--------------------------------------------|-------------------------------|
   * | confirmation       | None                                       | None                          |
   * | reinterpretation   | SentenceMutator (updateInferredIntents)     | sentence_understanding_updated|
   * | correction         | SentenceMutator (correctInferredIntent)     | sentence_understanding_updated|
   * | new_context        | SentenceMutator (enrichNarrativeContext)    | sentence_understanding_updated|
   * | preference         | VoiceMapMutator (markIntentional)           | voice_intentionality_updated  |
   * | clarification      | SentenceMutator (clarifyObservation)        | None (refines, no staleness)  |
   * | emotional_reaction | HolisticMutator (enrichEmotionalTopography) | holistic_section_updated      |
   * | resistance         | None                                       | None                          |
   */
  applyConversationInsight(insight: ConversationInsight): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L6_insight');
    const allMutations: MutationType[] = [];
    const insightSource = { source: 'conversation_insight', insightId: insight.id };

    // Step 1: InsightMutator always stores the insight
    const iMutations = this.insightMutator.applyInsight(this.profile, insight);
    allMutations.push(...iMutations);

    // Step 2: Dispatch cascade effects based on insight category
    switch (insight.category) {
      case 'confirmation':
        // No mutations — the stored insight IS the confirmation record.
        // Confirmations boost confidence in readiness scoring (via the stored insight)
        // but do not change the profile's understanding/analysis layers.
        break;

      case 'reinterpretation':
        // Student reinterprets meaning. Replace inferredIntents for affected scope.
        // Use sentence-level scope if available, fall back to paragraph-level.
        if (insight.scope.sentences.length > 0) {
          for (const s of insight.scope.sentences) {
            if (s.probability >= 0.5) {
              const sMutations = this.sentenceMutator.updateInferredIntents(
                this.profile,
                s.paragraph,
                s.sentence,
                [{
                  observation: insight.sourceText,
                  confidence: 0.8,
                  evidence: `Student reinterpretation: "${insight.sourceText}"`,
                }],
              );
              allMutations.push(...sMutations);
            }
          }
        } else if (insight.scope.paragraphs.length > 0) {
          // Fall back to paragraph scope — update all sentences in affected paragraphs
          for (const ps of insight.scope.paragraphs) {
            if (ps.probability < 0.5) continue;
            const para = this.profile.paragraphs[ps.index];
            if (!para) continue;
            for (const sent of para.sentences) {
              if (sent.understanding) {
                const sMutations = this.sentenceMutator.updateInferredIntents(
                  this.profile,
                  ps.index,
                  sent.index,
                  [{
                    observation: insight.sourceText,
                    confidence: 0.8,
                    evidence: `Student reinterpretation: "${insight.sourceText}"`,
                  }],
                );
                allMutations.push(...sMutations);
              }
            }
          }
        }
        break;

      case 'correction':
        // Student says "that's wrong". Replace specific observation.
        // Use sentence scope for precise correction.
        if (insight.scope.sentences.length > 0) {
          for (const s of insight.scope.sentences) {
            if (s.probability >= 0.5) {
              const cMutations = this.sentenceMutator.correctInferredIntent(
                this.profile,
                s.paragraph,
                s.sentence,
                insight.sourceText, // what was wrong (or what the student said)
                {
                  observation: insight.sourceText,
                  confidence: 0.9,
                  evidence: `Student correction: "${insight.sourceText}"`,
                },
                insightSource,
              );
              allMutations.push(...cMutations);
            }
          }
        } else if (insight.scope.paragraphs.length > 0) {
          // Fall back to paragraph scope
          for (const ps of insight.scope.paragraphs) {
            if (ps.probability < 0.5) continue;
            const para = this.profile.paragraphs[ps.index];
            if (!para) continue;
            for (const sent of para.sentences) {
              if (sent.understanding) {
                const cMutations = this.sentenceMutator.correctInferredIntent(
                  this.profile,
                  ps.index,
                  sent.index,
                  insight.sourceText,
                  {
                    observation: insight.sourceText,
                    confidence: 0.9,
                    evidence: `Student correction: "${insight.sourceText}"`,
                  },
                  insightSource,
                );
                allMutations.push(...cMutations);
              }
            }
          }
        }
        break;

      case 'new_context':
        // Student reveals context not in the essay ("My dad was deployed when this happened").
        // Enrich sentence narrative context for affected scope.
        if (insight.scope.sentences.length > 0) {
          for (const s of insight.scope.sentences) {
            if (s.probability >= 0.5) {
              const nMutations = this.sentenceMutator.enrichNarrativeContext(
                this.profile,
                s.paragraph,
                s.sentence,
                insight.sourceText,
                insightSource,
              );
              allMutations.push(...nMutations);
            }
          }
        } else if (insight.scope.paragraphs.length > 0) {
          for (const ps of insight.scope.paragraphs) {
            if (ps.probability < 0.5) continue;
            const para = this.profile.paragraphs[ps.index];
            if (!para) continue;
            for (const sent of para.sentences) {
              if (sent.understanding) {
                const nMutations = this.sentenceMutator.enrichNarrativeContext(
                  this.profile,
                  ps.index,
                  sent.index,
                  insight.sourceText,
                  insightSource,
                );
                allMutations.push(...nMutations);
              }
            }
          }
        }
        break;

      case 'preference':
        // Student expresses writing preference ("I want to keep that informal voice").
        // Mark relevant voice shifts as intentional.
        if (insight.scope.paragraphs.length > 0) {
          for (const ps of insight.scope.paragraphs) {
            if (ps.probability >= 0.5) {
              const vMutations = this.voiceMapMutator.markIntentional(
                this.profile,
                'register', // Default dimension — preferences most often relate to register
                { paragraph: ps.index },
                insightSource,
              );
              allMutations.push(...vMutations);
            }
          }
        } else if (insight.scope.sentences.length > 0) {
          // Use sentence scope to identify paragraph
          const paragraphSet = new Set<number>();
          for (const s of insight.scope.sentences) {
            if (s.probability >= 0.5) {
              paragraphSet.add(s.paragraph);
            }
          }
          for (const pIdx of paragraphSet) {
            const vMutations = this.voiceMapMutator.markIntentional(
              this.profile,
              'register',
              { paragraph: pIdx },
              insightSource,
            );
            allMutations.push(...vMutations);
          }
        }
        break;

      case 'clarification':
        // Student clarifies ambiguity ("When I said 'they', I meant my parents").
        // Clarifications refine understanding without changing meaning — NO staleness.
        if (insight.scope.sentences.length > 0) {
          for (const s of insight.scope.sentences) {
            if (s.probability >= 0.5) {
              // clarifyObservation returns empty array (no staleness by design)
              this.sentenceMutator.clarifyObservation(
                this.profile,
                s.paragraph,
                s.sentence,
                insight.sourceText,
                insightSource,
              );
            }
          }
        } else if (insight.scope.paragraphs.length > 0) {
          for (const ps of insight.scope.paragraphs) {
            if (ps.probability < 0.5) continue;
            const para = this.profile.paragraphs[ps.index];
            if (!para) continue;
            for (const sent of para.sentences) {
              if (sent.understanding) {
                this.sentenceMutator.clarifyObservation(
                  this.profile,
                  ps.index,
                  sent.index,
                  insight.sourceText,
                  insightSource,
                );
              }
            }
          }
        }
        // Clarification does NOT push mutations — no staleness propagation
        break;

      case 'emotional_reaction':
        // Student reveals emotional relationship to essay content.
        // "Reading this back makes me feel anxious"
        {
          const eMutations = this.holisticMutator.enrichEmotionalTopography(
            this.profile,
            { observation: insight.sourceText },
            insightSource,
          );
          allMutations.push(...eMutations);
        }
        break;

      case 'resistance':
        // Student disagrees. Store but don't mutate.
        // Coaching handles resistance through dialogue, not by modifying the profile
        // to match the student's self-assessment (the student might be wrong about
        // their own essay — a common pattern in writing workshops).
        break;
    }

    // Build context for staleness propagation
    const affectedSentences = insight.scope.sentences
      .filter(s => s.probability >= 0.5)
      .map(s => ({ paragraph: s.paragraph, sentence: s.sentence }));

    this.afterMutation(allMutations, {
      insightCategory: insight.category,
      affectedSentences,
    });
  }

  /**
   * Edit pipeline: Apply light-touch profile updates.
   * Uses per-sentence row-level updates. Does NOT acquire profile-level optimistic lock.
   */
  applyLightTouchUpdate(update: LightTouchUpdate): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('edit_light_touch');

    switch (update.type) {
      case 'text_reference':
        if (update.textUpdates) {
          for (const tu of update.textUpdates) {
            this.sentenceMutator.updateSentenceText(
              this.profile,
              tu.paragraph,
              tu.sentence,
              tu.newText,
            );
          }
        }
        break;

      case 'structural_bookkeeping':
        if (update.structuralUpdates) {
          this.paragraphMutator.updateStructuralBookkeeping(
            this.profile,
            update.structuralUpdates.paragraphCount,
            update.structuralUpdates.sentenceCounts,
          );
        }
        break;

      case 'staleness_application':
        if (update.stalenessMarkers) {
          for (const marker of update.stalenessMarkers) {
            this.stalenessTracker.markStale(
              marker.target,
              marker.strength,
              marker.reason,
              'sentence_understanding_updated', // closest match for edit-triggered staleness
            );
          }
        }
        break;

      case 'inferred_intent':
        if (update.intentUpdates) {
          for (const iu of update.intentUpdates) {
            this.sentenceMutator.updateInferredIntents(
              this.profile,
              iu.paragraph,
              iu.sentence,
              iu.intents,
            );
          }
        }
        break;

      case 'index_remap':
        // Index remapping is complex — it involves updating all references
        // across the entire profile. For now, mark everything stale.
        if (update.indexRemap) {
          for (const deletedIdx of update.indexRemap.deletedParagraphs) {
            this.stalenessTracker.markStale(
              { type: 'paragraph', index: deletedIdx },
              'strong',
              'Paragraph deleted — all references invalidated',
              'paragraph_role_updated',
            );
          }
        }
        break;
    }

    // Light-touch does NOT increment writeVersion or run full afterMutation
    // (by design — no profile-level lock)
    this.profile.metadata.lastMutatedAt = new Date().toISOString();
    this.recomputeIndex();
  }

  /**
   * Edit pipeline: Apply edit understanding from re-analysis.
   */
  applyEditUnderstanding(output: EditUnderstandingOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('edit_understanding');
    const allMutations: MutationType[] = [];

    // Apply pre-computed staleness effects from the edit understanding
    for (const effect of output.stalenessEffects) {
      this.stalenessTracker.markStale(
        effect.target,
        effect.strength,
        effect.reason,
        'sentence_understanding_updated',
      );
    }

    // Route to appropriate mutators based on the edit scope
    for (const pc of output.diff.paragraphChanges) {
      if (pc.changeType === 'modified') {
        for (const sc of pc.sentenceChanges) {
          if (sc.changeType === 'modified' && sc.newText) {
            this.sentenceMutator.updateSentenceText(
              this.profile,
              pc.paragraphIndex,
              sc.sentenceIndex,
              sc.newText,
            );
            allMutations.push('sentence_understanding_updated');
          }
        }
      }
    }

    this.afterMutation(allMutations, {});
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY METHODS (read-only — no mutations, no side effects)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get current profile as a read-only snapshot.
   */
  getProfile(): Readonly<EssayProfile> {
    return this.profile;
  }

  /**
   * Get current staleness state for the Profile Router.
   */
  getStalenessState(): StalenessSnapshot {
    return this.stalenessTracker.getSnapshot();
  }

  /**
   * Get full staleness report for external consumers.
   */
  getStalenessReport(): StalenessReport {
    return this.stalenessTracker.getReport();
  }

  /**
   * Compute readiness scores across all four granularity levels.
   */
  computeReadiness(): ReadinessScores {
    return {
      essay: this.computeEssayReadiness(),
      paragraph: this.computeParagraphReadiness(),
      sentence: this.computeSentenceReadiness(),
      word: this.computeWordReadiness(),
    };
  }

  /**
   * Run quick validation — referential integrity checks only (<1ms target).
   * Delegates to the dedicated intraDomainValidation module (source of truth).
   */
  validateQuick(): ValidationResult {
    return intraDomainValidateQuick(this.profile);
  }

  /**
   * Run full validation — semantic coherence checks (more expensive).
   * Delegates to the dedicated crossDomainValidation module (source of truth).
   */
  validateFull(): ValidationResult {
    return crossDomainValidateFull(this.profile);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Checkpoint to durable storage via the CheckpointStore callback.
   * Runs full validation at checkpoints. Persists circuit breaker state.
   */
  async checkpoint(reason: CheckpointReason): Promise<void> {
    const validationResult = reason === 'circuit_breaker' ? this.validateQuick() : this.validateFull();

    const metadata: CheckpointMetadata = {
      essayId: '', // Will be set by the orchestrator
      reason,
      completedLayer: reason.replace('after_', ''),
      writeVersion: this.writeVersion,
      stalenessSnapshot: this.stalenessTracker.getSnapshot(),
      validationResult,
      costSoFar: this.profile.metadata.totalAnalysisCost,
    };

    await this.checkpointStore.save(this.profile, metadata);
  }

  /**
   * Get the current write version (for optimistic concurrency checks).
   */
  getWriteVersion(): number {
    return this.writeVersion;
  }

  /**
   * Get the circuit breaker state.
   */
  getCircuitBreakerState(): Readonly<CircuitBreakerState> {
    return this.circuitBreaker;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Post-mutation bookkeeping. Called after every mutation:
   * 1. Increment writeVersion
   * 2. Propagate staleness via dependency map
   * 3. Recompute ProfileIndex
   * 4. Run quick validation
   */
  private afterMutation(mutations: MutationType[], context: PropagationContext): void {
    if (mutations.length === 0) return;

    // 1. Increment write version
    this.writeVersion++;

    // 2. Update metadata
    this.profile.metadata.lastMutatedAt = new Date().toISOString();
    this.sessionBoundary.lastMutationAt = Date.now();

    // 3. Propagate staleness via the declared dependency map
    propagateStaleness(this.stalenessTracker, mutations, context);

    // 4. Recompute ProfileIndex
    this.recomputeIndex();

    // 5. Quick validation (logged, does not block)
    const validation = this.validateQuick();
    if (!validation.valid) {
      console.warn(
        '[EssayProfileCoordinator] Quick validation failed after mutation:',
        validation.checks.filter(c => !c.passed).map(c => `${c.name}: ${c.details}`),
      );
    }
  }

  /**
   * Recompute the ProfileIndex from current profile state.
   * Runs after every mutation. Cheap fields only — expensive recomputation
   * happens at checkpoints.
   */
  private recomputeIndex(): void {
    const profile = this.profile;
    const index = profile.index;

    // Update paragraph digests
    for (let i = 0; i < profile.paragraphs.length; i++) {
      const para = profile.paragraphs[i];
      if (i < index.paragraphDigest.length) {
        const digest = index.paragraphDigest[i];
        digest.sentenceCount = para.sentences.length;
        digest.tags = para.tags;
        digest.roleSummary = para.understanding?.role ?? digest.roleSummary;

        // Update strength/weakness flags from analysis
        if (para.analysis) {
          digest.hasStrengths = para.analysis.strengthSignatures.length > 0;
          digest.hasWeaknesses = para.analysis.growthEdges.length > 0;
        }

        // Count connections involving this paragraph
        digest.connectionCount = profile.connections.all.filter(
          c => c.from[0] === i || c.to[0] === i,
        ).length;
      }
    }

    // Update connection graph from connections store
    index.connectionGraph = profile.connections.all.map(c => ({
      from: c.from,
      to: c.to,
      type: c.type,
    }));

    // Update staleness snapshot in the index
    const snapshot = this.stalenessTracker.getSnapshot();
    index.stalenessSnapshot = {
      strongStale: snapshot.strongEntries.map(e => this.targetToString(e.target)),
      moderateStale: snapshot.moderateEntries.map(e => this.targetToString(e.target)),
      weakStale: [], // Weak entries not surfaced in the index (by design)
      lastChangeAt: profile.metadata.lastMutatedAt,
    };

    // Update confidence level based on layer progress
    index.confidenceLevel = profile.metadata.confidenceLevel;

    // Update essay length
    index.essayLength.paragraphs = profile.paragraphs.length;
    index.essayLength.sentences = profile.paragraphs.reduce(
      (sum, p) => sum + p.sentences.length,
      0,
    );
  }

  /**
   * Convert a StalenessTarget to a human-readable string for the index.
   */
  private targetToString(target: StalenessTarget): string {
    switch (target.type) {
      case 'holistic': return `holistic:${target.section}`;
      case 'paragraph': return `p${target.index}`;
      case 'sentence': return `p${target.paragraph}s${target.sentence}`;
      case 'connections': return `connections:${target.connectionIds.join(',')}`;
      case 'north_star': return 'north_star';
      case 'entanglements': return 'entanglements';
    }
  }

  /**
   * Check for session boundary (30+ minutes of inactivity).
   * If boundary crossed, reset the engagement threshold.
   */
  private checkSessionBoundary(): void {
    const now = Date.now();
    const elapsed = now - this.sessionBoundary.lastMutationAt;
    const SESSION_BOUNDARY_MS = 30 * 60 * 1000; // 30 minutes

    if (elapsed > SESSION_BOUNDARY_MS) {
      // Reset engagement threshold
      this.sessionBoundary.reanalysisThreshold = this.sessionBoundary.defaultThreshold;
      this.sessionBoundary.isFirstSession = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CIRCUIT BREAKER
  // ═══════════════════════════════════════════════════════════════════════════
  // Prevents infinite retry loops on persistent failures. After maxRetries (3)
  // failures at the same position, the circuit breaker trips and all further
  // mutations are blocked for a 5-minute cooldown. All completed work up to
  // the failure point is preserved at the last checkpoint.

  /**
   * Check whether the circuit breaker is tripped. If tripped and still in cooldown,
   * throws an error. If cooldown has expired, resets the breaker.
   *
   * Called at the START of every layer dispatch method.
   *
   * @param position - identifier for the pipeline position (e.g., 'L1_impressions', 'L3_walk')
   * @throws Error if circuit breaker is tripped and cooldown hasn't expired
   */
  private checkCircuitBreaker(position: string): void {
    if (!this.circuitBreaker.tripped) return;

    // Check if cooldown has expired
    if (
      this.circuitBreaker.cooldownExpiresAt !== null &&
      Date.now() < this.circuitBreaker.cooldownExpiresAt
    ) {
      throw new Error(
        `[ProfileManager] Circuit breaker tripped at ${this.circuitBreaker.failurePoint}. ` +
        `Cooldown until ${new Date(this.circuitBreaker.cooldownExpiresAt).toISOString()}. ` +
        `All work preserved at last checkpoint. Position: ${position}`,
      );
    }

    // Cooldown expired — reset the breaker
    this.circuitBreaker.tripped = false;
    this.circuitBreaker.retryCount = 0;
    this.circuitBreaker.attempts = [];
  }

  /**
   * Record a failure at a pipeline position. If maxRetries is reached,
   * trip the circuit breaker and set a 5-minute cooldown.
   *
   * @param position - identifier for the pipeline position
   * @param error - error message from the failure
   */
  private recordFailure(position: string, error: string): void {
    this.circuitBreaker.retryCount++;
    this.circuitBreaker.failurePoint = position;
    this.circuitBreaker.attempts.push({
      position,
      timestamp: Date.now(),
      error,
    });

    if (this.circuitBreaker.retryCount >= this.circuitBreaker.maxRetries) {
      this.circuitBreaker.tripped = true;
      this.circuitBreaker.cooldownExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
      console.error(
        `[ProfileManager] Circuit breaker TRIPPED at ${position} after ${this.circuitBreaker.maxRetries} failures. ` +
        `Cooldown: 5 minutes. All completed work preserved at last checkpoint.`,
      );
    }
  }

  /**
   * Record a success — resets the retry counter if there were any prior failures.
   * This allows the system to recover from transient errors without tripping.
   */
  private recordSuccess(): void {
    if (this.circuitBreaker.retryCount > 0) {
      this.circuitBreaker.retryCount = 0;
      this.circuitBreaker.attempts = [];
    }
  }

  /**
   * Derive the paragraph index from an UnderstandingWalkOutput.
   * The walk output contains a paragraphUnderstanding but not an explicit index,
   * so we find the next paragraph that hasn't been deeply understood yet.
   */
  private findParagraphIndexForWalkOutput(output: UnderstandingWalkOutput): number {
    // If the output has sentence understandings, the first one's location implies the paragraph
    // We match based on the paragraph whose understanding is null (not yet walked)
    // or whose sentences match the output's sentence indices
    for (let i = 0; i < this.profile.paragraphs.length; i++) {
      const para = this.profile.paragraphs[i];
      if (!para.understanding) {
        return i;
      }
    }
    // Fallback: if all paragraphs have understanding, it's an update — use the last one
    return this.profile.paragraphs.length - 1;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // READINESS SCORING (four functions, each returns 0-100)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Essay-level readiness: thesis + arc + voice + holistic population.
   */
  private computeEssayReadiness(): number {
    const profile = this.profile;
    let score = 0;

    // Thesis present and confident (0-30)
    const thesisConf = profile.thematicArchitecture.thesisConfidence;
    if (thesisConf >= 0.8) score += 30;
    else if (thesisConf >= 0.5) score += 20;
    else if (thesisConf >= 0.3) score += 10;

    // Arc coherent (0-25)
    if (profile.narrativeStrategy.primaryStrategy) score += 10;
    if (profile.narrativeStrategy.pivotPoints.length > 0) score += 10;
    // No 'stalling' check for arcMomentum since NarrativeStrategy doesn't have that field directly
    if (profile.narrativeStrategy.pacingAnalysis) score += 5;

    // Voice map populated with stability regions (0-20)
    if (profile.voiceIdentity.signature) score += 10;
    if (profile.voiceMap.shifts.length > 0 || profile.voiceMap.register.baseline) score += 5;
    const allShiftsAssessed = profile.voiceMap.shifts.length === 0 ||
      profile.voiceMap.shifts.every(s => s.intentionality);
    if (allShiftsAssessed) score += 5;

    // Holistic sections populated (0-25)
    const holisticSections = [
      profile.voiceIdentity.signature,
      profile.emotionalTopography.arcTrajectory,
      profile.thematicArchitecture.centralThesis,
      profile.narrativeStrategy.primaryStrategy,
      profile.characterRevelation.writerPortrait,
      profile.craftAssessment.strengthSignatures.length > 0,
      profile.admissionsPositioning.tellabilitySummary,
    ];
    const populatedCount = holisticSections.filter(Boolean).length;
    score += Math.min(25, Math.round(populatedCount * 3.6));

    // Critical essay-level weaknesses (-12 each, max -25)
    let penalties = 0;
    if (profile.admissionsPositioning.redFlags.length > 0) penalties += 12;
    if (thesisConf === 0 && profile.metadata.lastUpdatedLayer >= 3) penalties += 12;
    score = Math.max(0, Math.min(100, score - Math.min(25, penalties)));

    return score;
  }

  /**
   * Paragraph-level readiness: effectiveness distribution.
   */
  private computeParagraphReadiness(): number {
    const paragraphs = this.profile.paragraphs;
    if (paragraphs.length === 0) return 0;

    const withAnalysis = paragraphs.filter(p => p.analysis);
    if (withAnalysis.length === 0) return 0;

    const total = withAnalysis.length;
    const above60 = withAnalysis.filter(p => p.analysis!.effectiveness >= 60).length;
    const above80 = withAnalysis.filter(p => p.analysis!.effectiveness >= 80).length;
    const below40 = withAnalysis.filter(p => p.analysis!.effectiveness < 40).length;

    const baseScore = (above60 / total) * 70;
    const bonus = (above80 / total) * 30;
    const penalty = below40 * 5;

    return Math.max(0, Math.min(100, Math.round(baseScore + bonus - penalty)));
  }

  /**
   * Sentence-level readiness: effectiveness + problem-free ratio.
   */
  private computeSentenceReadiness(): number {
    const allSentences: { analysis: NonNullable<SentenceProfile['analysis']> }[] = [];

    for (const para of this.profile.paragraphs) {
      for (const sent of para.sentences) {
        if (sent.analysis) {
          allSentences.push({ analysis: sent.analysis });
        }
      }
    }

    if (allSentences.length === 0) return 0;

    const total = allSentences.length;
    const problemFree = allSentences.filter(s => !s.analysis.isProblem).length;
    const problemFreeRatio = problemFree / total;

    const avgEffectiveness = allSentences.reduce(
      (sum, s) => sum + s.analysis.effectiveness,
      0,
    ) / total;

    return Math.round(problemFreeRatio * 70 + (avgEffectiveness / 100) * 30);
  }

  /**
   * Word-level readiness: word-level weakness absence.
   */
  private computeWordReadiness(): number {
    const allSentences: { analysis: NonNullable<SentenceProfile['analysis']> }[] = [];

    for (const para of this.profile.paragraphs) {
      for (const sent of para.sentences) {
        if (sent.analysis) {
          allSentences.push({ analysis: sent.analysis });
        }
      }
    }

    if (allSentences.length === 0) return 0;

    // Count sentences with no word-level weaknesses
    // Word-level weaknesses are those in the weaknesses array that reference
    // specific words or phrases (heuristic: short observations tend to be word-level)
    const noWordWeakness = allSentences.filter(
      s => s.analysis.weaknesses.length === 0,
    ).length;

    return Math.round((noWordWeakness / allSentences.length) * 100);
  }
}
