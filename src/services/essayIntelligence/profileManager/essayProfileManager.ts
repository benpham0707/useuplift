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
  ImprovementPhase,
  PatternInsight,
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
  ConnectionEndpoint,
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
  ParagraphScoreMatrix,
  CoherenceReport,
  Finding,
  FindingMaturity,
  FindingCoachingValue,
  DeltaSynthesisOutput,
  HolisticSectionType,
} from '../profileTypes';

import { FindingStore } from '../findings/findingStore';
import { ImprovementCandidateStore } from '../improvements/improvementCandidateStore';
import type {
  ImprovementCandidate,
  ImprovementCandidateStoreSnapshot,
} from '../profileTypes';
import { isPipelineError } from '../errors';
import { writeSnapshot } from '../history/snapshotStore';
import { computeRevisionIntelligence } from '../history/revisionIntelligence';
import { computeVoiceEvolution } from '../history/voiceEvolution';

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

// ── Real mutator implementations ──
import { SentenceMutator } from './mutators/sentenceMutator';
import { ParagraphMutator } from './mutators/paragraphMutator';
import { HolisticMutator } from './mutators/holisticMutator';
import { ConnectionMutator } from './mutators/connectionMutator';
import { VoiceMapMutator } from './mutators/voiceMapMutator';
import { EarnednessMutator } from './mutators/earnednessMutator';
import { NorthStarMutator } from './mutators/northStarMutator';
import { InsightMutator } from './mutators/insightMutator';

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

  /** W5.2: Section-level merge for delta synthesis — replace only listed sections */
  applySectionLevelMerge(
    profile: EssayProfile,
    partial: Partial<HolisticSynthesisOutput>,
    updatedSections: import('../profileTypes').HolisticSectionType[],
  ): MutationType[];
}

/**
 * IConnectionMutator — connection CRUD + referential integrity.
 * Owns: connections.all[], imageRecurrences, narrativeArcMap, redundancies.
 */
export interface IConnectionMutator {
  /** Add V2 connections (from L3 walk, L2.5 scout, or conversation) */
  addConnections(
    profile: EssayProfile,
    connections: Array<{
      from: ConnectionEndpoint;
      to: ConnectionEndpoint;
      description: string;
      reverseIllumination: string | null;
      significance: string;
      strengthCategory: import('../profileTypes').ConnectionStrengthCategory;
      directionality: import('../profileTypes').ConnectionDirectionality;
      discoveredBy: import('../profileTypes').ConnectionSource;
      routingTags?: import('../profileTypes').ConnectionRoutingTag[];
      relatedFindings?: string[];
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

  /** Store a detected pattern insight from coaching */
  addPatternInsight(
    profile: EssayProfile,
    pattern: PatternInsight,
  ): void;
}

// ============================================================================
// DEPRECATED: PLACEHOLDER MUTATORS (no-op implementations)
// ============================================================================
// These are DEPRECATED — real implementations in mutators/ are now wired by default.
// Kept for reference and for test overrides where a no-op is intentionally desired.
// Real mutators: SentenceMutator, ParagraphMutator, HolisticMutator,
// ConnectionMutator, VoiceMapMutator, EarnednessMutator, NorthStarMutator, InsightMutator.

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
  applySectionLevelMerge(_p: EssayProfile, _partial: any, _sections: any[]): MutationType[] { return ['holistic_section_updated']; }
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
  addPatternInsight(_p: EssayProfile, _pattern: PatternInsight): void {}
}

// ============================================================================
// FINDING ↔ SENTENCE SYNC — W3.2 Bidirectional Sync
// ============================================================================

/**
 * Recompute `findingRefs` on SentenceUnderstanding from the FindingStore.
 *
 * This is the FindingStore → sentence sync direction. When findings are added,
 * superseded, or evolved, the sentence-level `findingRefs` arrays must reflect
 * the current set of active findings that scope to each sentence.
 *
 * The function REPLACES `findingRefs` entirely (not additive) because the
 * FindingStore is the source of truth — stale refs from superseded findings
 * must be removed, and new findings must appear.
 *
 * Scoping rules:
 * - A finding with `scope.paragraph === P` and `scope.sentences` including `S`
 *   → applies to sentence P:S
 * - A finding with `scope.paragraph === P` and no `scope.sentences` (or empty)
 *   → applies to ALL sentences in paragraph P
 * - A finding with `scope.paragraphs` including `P` (cross_paragraph)
 *   → applies to ALL sentences in paragraph P
 * - A finding with `scope.type === 'essay_level'`
 *   → NOT pushed to individual sentences (too noisy; use FindingStore queries)
 *
 * @param profile - The essay profile to update
 * @param findingStore - The FindingStore to read active findings from
 * @param affectedParagraphs - If provided, only recompute for these paragraphs (optimization)
 */
function recomputeFindingRefsForSentences(
  profile: EssayProfile,
  findingStore: FindingStore,
  affectedParagraphs?: number[],
): void {
  const activeFindings = findingStore.getActive();
  if (activeFindings.length === 0) {
    // Fast path: clear all findingRefs if no active findings
    const paragraphs = affectedParagraphs
      ? profile.paragraphs.filter(p => affectedParagraphs.includes(p.index))
      : profile.paragraphs;
    for (const para of paragraphs) {
      for (const sent of para.sentences) {
        if (sent.understanding) {
          sent.understanding.findingRefs = [];
        }
      }
    }
    return;
  }

  // Pre-index findings by paragraph for O(F + P*S) instead of O(F * P * S)
  // Map<paragraphIndex, Finding[]> — findings that scope to each paragraph
  const findingsByParagraph = new Map<number, Finding[]>();
  // Findings that scope to all paragraphs (cross-paragraph with explicit paragraphs list)
  // We skip essay_level scope — too broad for sentence-level refs

  for (const f of activeFindings) {
    if (f.scope.type === 'essay_level') continue;

    if (f.scope.paragraph !== undefined) {
      const bucket = findingsByParagraph.get(f.scope.paragraph) ?? [];
      bucket.push(f);
      findingsByParagraph.set(f.scope.paragraph, bucket);
    }

    if (f.scope.paragraphs) {
      for (const pIdx of f.scope.paragraphs) {
        // Avoid double-adding if paragraph === one of paragraphs[]
        if (pIdx === f.scope.paragraph) continue;
        const bucket = findingsByParagraph.get(pIdx) ?? [];
        bucket.push(f);
        findingsByParagraph.set(pIdx, bucket);
      }
    }
  }

  const paragraphs = affectedParagraphs
    ? profile.paragraphs.filter(p => affectedParagraphs.includes(p.index))
    : profile.paragraphs;

  for (const para of paragraphs) {
    const paraFindings = findingsByParagraph.get(para.index) ?? [];

    for (const sent of para.sentences) {
      if (!sent.understanding) continue;

      const refs: string[] = [];
      for (const f of paraFindings) {
        // Check if finding scopes to this specific sentence
        if (f.scope.sentences && f.scope.sentences.length > 0) {
          // Finding has explicit sentence scope — only match if this sentence is listed
          if (f.scope.paragraph === para.index && f.scope.sentences.includes(sent.index)) {
            refs.push(f.id);
          }
        } else {
          // Finding scopes to the paragraph broadly (no sentence restriction) —
          // applies to all sentences in the paragraph
          refs.push(f.id);
        }
      }

      sent.understanding.findingRefs = refs;
    }
  }
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
  /**
   * Target college identifier for supplement / PIQ essays. Normalized
   * lowercase (e.g. "stanford"). Leave undefined for common_app essays.
   * Threaded through to `EssayProfile.collegeId` so research enrichment
   * can look up college-specific guidance on every coaching turn.
   */
  collegeId?: string;
}): EssayProfile {
  const { paragraphTexts, sentenceTexts, metadata, collegeId } = input;

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
      readinessAssessment: 'No analysis has been performed yet.',
      legacyReadiness: { essayLevel: 0, paragraphLevel: 0, sentenceLevel: 0, wordLevel: 0 },
      dimensionPhases: [],
      coachingLens: 'Initial profile. Full phase assessment will be determined after analysis.',
      transition: null,
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
      stabilityRegions: [],
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
      aoTakeaway: '',
    },

    // Essay Understanding — empty (Gap 1)
    essayUnderstanding: {
      prose: '',
      centralTension: '',
      confirmedInsights: [],
      activeHypotheses: [],
      maturity: 'initial',
      growthLog: [],
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
      graphSummary: '',
      structuralIslands: [],
      imageRecurrences: [],
      narrativeArcMap: [],
      redundancies: [],
    },

    // Edit history — empty
    editHistory: [],

    // Findings — empty (W1.2)
    findings: [],

    // Persistent question queue — empty (Gap 2)
    questionQueue: [],

    // Conversation insights — empty
    conversationInsights: [],
    patternInsights: [],
    studentDeclaredContext: '',

    // College target (supplement/PIQ only; undefined for common_app) — consumed
    // by researchEnrichment for college-specific coachingNote lookups.
    collegeId,

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

  // ── FindingStore (W1.2) ──
  private findingStore: FindingStore;

  // ── ImprovementCandidateStore (Scope 2 Phase 4) ──
  // Append-only lifecycle store for improvement candidates emitted inline by
  // L3/L3.5/L3.75 layers. L4 consolidates these into CoachingMap priorities;
  // L5 materializes consolidated targets with rewrite examples; manifest
  // projection finalizes them. Phase 1.5 already defined the type contract
  // (ImprovementCandidate + ImprovementCandidateStoreSnapshot) so this class
  // slots in without disturbing the existing profileMigration backfill path.
  private candidateStore: ImprovementCandidateStore;

  // ── Revision History (Phase 1 — cross-session snapshot chain) ──
  // Stable per-coordinator session identifier. The current profile layer
  // lacks an explicit session-id field, so we synthesize one deterministically
  // at coordinator construction: createdAt + a construction-time epoch. The
  // id is stable for the coordinator's lifetime, which matches how the
  // coordinator maps to a single session in the current layering. Re-hydrated
  // coordinators (fromCheckpoint) get a fresh id — that's the correct
  // boundary behavior (a new server-side session).
  private readonly revisionSessionId: string;
  // Cached essay text captured at the last writeSnapshot call, kept in
  // memory so detectResetCondition can compute token-overlap against a
  // known-prior essay text (we intentionally don't persist full text on
  // snapshots — only the hash — to keep snapshot size minimal).
  private priorSnapshotEssayText: string | null = null;

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

    // Synthesize a stable session id for revision-history snapshots.
    // Combines profile createdAt (stable for profile lifetime) with
    // construction epoch — uniqueness across coordinator instances,
    // stability across writes within one coordinator.
    const createdAtStamp =
      profile.metadata && typeof profile.metadata.createdAt === 'string'
        ? profile.metadata.createdAt
        : new Date().toISOString();
    this.revisionSessionId = `${createdAtStamp}-${Date.now()}`;

    // W1.2: Initialize FindingStore from persisted findings (or empty)
    if (profile.findings.length > 0) {
      // Determine nextId from existing findings
      let maxId = 0;
      for (const f of profile.findings) {
        const num = parseInt(f.id.replace('F', ''), 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
      this.findingStore = FindingStore.deserialize({
        findings: profile.findings,
        nextId: maxId + 1,
      });
    } else {
      this.findingStore = new FindingStore();
    }

    // Scope 2 Phase 4: Initialize ImprovementCandidateStore from the
    // persisted snapshot (if any) or empty. Phase 1.5's fromCheckpoint()
    // migration hook ensures legacy profiles get a backfilled snapshot
    // before the constructor runs, so by this point
    // `profile.improvementCandidateSnapshot` is either (a) a genuine
    // snapshot from a post-Phase-4 run, (b) a migration-built snapshot
    // from Phase 1.5 for legacy profiles, or (c) undefined only if
    // `index.requiresReanalysis === true` (migration found nothing).
    if (profile.improvementCandidateSnapshot) {
      this.candidateStore = ImprovementCandidateStore.deserialize(
        profile.improvementCandidateSnapshot,
      );
    } else {
      this.candidateStore = new ImprovementCandidateStore();
    }

    // Inject mutators — use real implementations by default, allow overrides for testing
    const realSentenceMutator = new SentenceMutator();
    this.sentenceMutator = mutators?.sentence ?? realSentenceMutator;
    this.paragraphMutator = mutators?.paragraph ?? new ParagraphMutator();
    this.holisticMutator = mutators?.holistic ?? new HolisticMutator();
    // ConnectionMutator requires a SentenceMutator for referential integrity
    // (adding/removing connectionRefs on endpoint sentences).
    // If the sentence mutator was overridden, the connection mutator still uses the real one
    // for its internal ref management — this is intentional (connection refs are mechanical).
    this.connectionMutator = mutators?.connection ?? new ConnectionMutator(realSentenceMutator);
    this.voiceMapMutator = mutators?.voiceMap ?? new VoiceMapMutator();
    this.earnednessMutator = mutators?.earnedness ?? new EarnednessMutator();
    this.northStarMutator = mutators?.northStar ?? new NorthStarMutator();
    this.insightMutator = mutators?.insight ?? new InsightMutator();
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
    /** Target college (supplement/PIQ only). Normalized lowercase. */
    collegeId?: string;
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
      collegeId: input.collegeId,
    });
    return new EssayProfileCoordinator(profile, input.checkpointStore, input.mutators);
  }

  /**
   * Create a coordinator from a persisted profile (resume from checkpoint).
   *
   * PHASE 1.5 MIGRATION HOOK: If the persisted profile lacks an
   * `improvementCandidateSnapshot`, runs the one-shot deterministic migration
   * from legacy data shapes (findings, coachingMap.priorities, growthEdges,
   * redFlags). Zero LLM calls — pure data-shape conversion.
   *
   * Three outcomes:
   *   1. Snapshot was already populated → migration skipped (idempotent).
   *   2. Migration succeeds → snapshot populated, requiresReanalysis cleared.
   *   3. Migration finds zero source data → profile flagged
   *      `index.requiresReanalysis = true`; the coaching gate in
   *      `processCoachingTurn()` throws CoachingBlockedError so the UI can
   *      prompt the user for re-analysis. No silent degradation.
   *
   * Only PipelineError.noMigrationSource is caught here — any other error
   * propagates unmodified (fail-fast for real bugs).
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
    // ── Phase 1.5: Legacy profile migration hook ──────────────────────────
    if (!profile.improvementCandidateSnapshot) {
      try {
        // Lazy require to avoid circular-import risk: profileMigration imports
        // from profileTypes (which essayProfileManager also imports). A
        // top-level `import` can trigger circular module initialization in
        // some bundler configurations. require() defers resolution to call
        // time, sidestepping the cycle. Phase 4 may refactor to a top-level
        // import if the import graph is confirmed clean.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { migrateLegacyProfileToCandidateStore } =
          require('../improvements/profileMigration') as {
            migrateLegacyProfileToCandidateStore: typeof import('../improvements/profileMigration').migrateLegacyProfileToCandidateStore;
          };
        profile.improvementCandidateSnapshot =
          migrateLegacyProfileToCandidateStore(profile);

        // Migration succeeded — clear any stale reanalysis flag.
        if (profile.index) {
          profile.index.requiresReanalysis = false;
        }
        console.log(
          `[EssayProfileCoordinator.fromCheckpoint] Legacy profile migrated: ` +
            `${profile.improvementCandidateSnapshot.candidates.length} candidates`,
        );
      } catch (err: unknown) {
        // ONLY PipelineError with layer='profile_migration' should land here.
        // That means migration ran but found zero source data across all 4
        // legacy sources. The profile is usable for non-coaching features
        // but the coaching gate will block until re-analysis runs.
        //
        // ANY OTHER error is a real bug (type mismatch, missing import, etc.)
        // and must propagate — fail-fast, not silent.
        if (isPipelineError(err) && err.layer === 'profile_migration') {
          console.warn(
            `[EssayProfileCoordinator.fromCheckpoint] Migration found no source data. ` +
              `Profile flagged requiresReanalysis=true. Coaching will be blocked.`,
          );
          if (profile.index) {
            profile.index.requiresReanalysis = true;
          }
          // Leave improvementCandidateSnapshot undefined — the coaching
          // gate reads requiresReanalysis directly. The profile still
          // constructs and loads successfully; only coaching is blocked.
        } else {
          throw err;
        }
      }
    }

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
            observedFunctions: [{ observation: sentenceImpression.apparentPurpose, confidence: 0.5, evidence: '' }],
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

    // ParagraphMutator: update paragraph roles with FULL structural context (supersession).
    // Uses updateStructuralRoleRich to pass narrativeFunction, strengthContribution, weaknessFlag
    // from L2 — not just the role string. This gives L3 richer structural context.
    for (const role of cartography.paragraphRoles) {
      const mutations = this.paragraphMutator.updateStructuralRoleRich(
        this.profile,
        role.index,
        {
          role: role.role,
          narrativeFunction: role.narrativeFunction,
          strengthContribution: role.strengthContribution,
          weaknessFlag: role.weaknessFlag,
        },
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

    // Flatten the categorized scout output into provisional V2 connection leads.
    // Each category maps to a connection that L3 will later confirm or reject.
    const flattenedLeads: Array<{
      from: ConnectionEndpoint;
      to: ConnectionEndpoint;
      description: string;
      reverseIllumination: string | null;
      significance: string;
      strengthCategory: 'tentative';
      directionality: 'forward';
      discoveredBy: 'scout';
    }> = [];

    // Repeated elements: create connections between each pair of occurrences
    for (const elem of scout.repeatedElements) {
      for (let i = 0; i < elem.occurrences.length; i++) {
        for (let j = i + 1; j < elem.occurrences.length; j++) {
          const from = elem.occurrences[i];
          const to = elem.occurrences[j];
          flattenedLeads.push({
            from: { paragraph: from.paragraphIndex, sentence: from.sentenceIndex, label: `P${from.paragraphIndex}S${from.sentenceIndex}` } as ConnectionEndpoint,
            to: { paragraph: to.paragraphIndex, sentence: to.sentenceIndex, label: `P${to.paragraphIndex}S${to.sentenceIndex}` } as ConnectionEndpoint,
            description: `Repeated element "${elem.element}": ${elem.potentialSignificance}`,
            reverseIllumination: null,
            significance: elem.potentialSignificance,
            strengthCategory: 'tentative' as const,
            directionality: 'forward' as const,
            discoveredBy: 'scout' as const,
          });
        }
      }
    }

    // Tonal shifts: create connection from the shift point to the START of the next paragraph.
    // A tonal shift is a between-paragraph signal — it connects the sentence where voice
    // changes to what comes after it. Self-connections (from===to) are meaningless.
    for (const shift of scout.tonalShifts) {
      const fromPara = shift.location.paragraphIndex;
      const nextPara = fromPara + 1;
      // Only create the connection if the next paragraph exists
      if (nextPara < this.profile.paragraphs.length) {
        flattenedLeads.push({
          from: { paragraph: fromPara, sentence: shift.location.sentenceIndex, label: `P${fromPara}S${shift.location.sentenceIndex}` } as ConnectionEndpoint,
          to: { paragraph: nextPara, sentence: 0, label: `P${nextPara}S0` } as ConnectionEndpoint,
          description: `Tonal shift from "${shift.fromTone}" to "${shift.toTone}" (${shift.abruptness})`,
          reverseIllumination: null,
          significance: `Tonal shift: ${shift.fromTone} → ${shift.toTone}`,
          strengthCategory: 'tentative' as const,
          directionality: 'forward' as const,
          discoveredBy: 'scout' as const,
        });
      }
    }

    // Structural echoes: connect source to echo
    for (const echo of scout.structuralEchoes) {
      flattenedLeads.push({
        from: { paragraph: echo.source.paragraphIndex, sentence: echo.source.sentenceIndex, label: `P${echo.source.paragraphIndex}S${echo.source.sentenceIndex}` } as ConnectionEndpoint,
        to: { paragraph: echo.echo.paragraphIndex, sentence: echo.echo.sentenceIndex, label: `P${echo.echo.paragraphIndex}S${echo.echo.sentenceIndex}` } as ConnectionEndpoint,
        description: `Structural echo: ${echo.echoType}`,
        reverseIllumination: null,
        significance: `Structural echo detected: ${echo.echoType}`,
        strengthCategory: 'tentative' as const,
        directionality: 'forward' as const,
        discoveredBy: 'scout' as const,
      });
    }

    // ConnectionMutator: create provisional connections from flattened leads
    // Note: addConnections internally adds connectionRefs to both endpoint sentences —
    // no manual connectionRef loop needed here (that would double-add).
    const { mutations: connMutations } = this.connectionMutator.addConnections(
      this.profile,
      flattenedLeads,
    );
    allMutations.push(...connMutations);

    this.afterMutation(allMutations, {});
  }

  /**
   * L3: Apply one paragraph's understanding walk output.
   * The most complex entry point — touches 3 mutators.
   */
  applyUnderstandingWalkStep(output: UnderstandingWalkOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L3_walk');
    const allMutations: MutationType[] = [];

    // Use explicit paragraph index from the walk output (not heuristic)
    const pIdx = output.paragraphIndex;

    // 1. SentenceMutator: store sentence understandings for this paragraph
    for (const su of output.sentenceUnderstandings) {
      const mutations = this.sentenceMutator.applySentenceUnderstanding(
        this.profile,
        pIdx,
        su.index,
        su.understanding,
      );
      allMutations.push(...mutations);
    }

    // 2. ParagraphMutator: store paragraph understanding
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
    // Note: addConnections internally adds connectionRefs to both endpoint sentences —
    // no manual connectionRef loop needed here (that would double-add).
    if (output.newConnections.length > 0) {
      const { mutations: connMutations } = this.connectionMutator.addConnections(
        this.profile,
        output.newConnections.map(conn => ({
          from: conn.from,
          to: conn.to,
          description: conn.description,
          reverseIllumination: conn.reverseIllumination,
          significance: conn.significance,
          strengthCategory: conn.strengthCategory,
          directionality: conn.directionality,
          discoveredBy: 'walk' as const,
        })),
      );
      allMutations.push(...connMutations);
    }

    // 5. HolisticMutator: merge incremental holistic evolution
    if (output.holisticEvolution) {
      const hMutations = this.holisticMutator.mergeHolisticEvolution(
        this.profile,
        output.holisticEvolution,
      );
      allMutations.push(...hMutations);
    }

    // 6. W1.3: Process new findings from walk output
    if (output.newFindings && output.newFindings.length > 0) {
      for (const nf of output.newFindings) {
        const id = this.findingStore.generateId();
        const now = new Date().toISOString();
        const finding: Finding = {
          id,
          claim: nf.claim,
          scope: nf.scope,
          maturity: nf.maturity,
          maturityReasoning: nf.maturityReasoning,
          coachingValue: nf.coachingValue,
          dimensions: nf.dimensions,
          buildsOn: (nf.buildsOn ?? []).filter(ref => this.findingStore.has(ref)),
          relatedTo: (nf.relatedTo ?? []).filter(ref => this.findingStore.has(ref)),
          source: 'walk',
          deepeningPotential: nf.deepeningPotential,
          raisesQuestions: nf.raisesQuestions,
          evidence: nf.evidence,
          lineage: [{
            timestamp: now,
            previousMaturity: 'hypothesis',
            newMaturity: nf.maturity,
            trigger: `walk_P${pIdx}`,
            reasoning: nf.maturityReasoning,
          }],
          createdAt: now,
          lastUpdated: now,
        };
        try {
          this.findingStore.add(finding);
        } catch (e) {
          console.warn(`[EssayProfileCoordinator] Failed to add finding from walk: ${(e as Error).message}`);
        }
      }
    }

    // W1.3: Process finding evolutions from walk output
    if (output.findingEvolutions && output.findingEvolutions.length > 0) {
      for (const evo of output.findingEvolutions) {
        try {
          this.findingStore.updateMaturity(
            evo.findingId,
            evo.newMaturity,
            evo.reasoning,
            `walk_P${pIdx}`,
            evo.supersedes,
          );
        } catch (e) {
          console.warn(`[EssayProfileCoordinator] Failed to evolve finding ${evo.findingId}: ${(e as Error).message}`);
        }
      }
    }

    // W3.2: Targeted finding ref recompute for the walked paragraph.
    // afterMutation will also do a full recompute, but this targeted call
    // ensures refs are correct for the walked paragraph immediately in case
    // any code reads them between here and afterMutation.
    recomputeFindingRefsForSentences(this.profile, this.findingStore, [pIdx]);

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

    // V2: Apply L3.75-discovered connections
    if (synthesis.newConnections && synthesis.newConnections.length > 0) {
      const { mutations: connMutations } = this.connectionMutator.addConnections(
        this.profile,
        synthesis.newConnections.map(conn => ({
          from: conn.from,
          to: conn.to,
          description: conn.description,
          reverseIllumination: conn.reverseIllumination,
          significance: conn.significance,
          strengthCategory: conn.strengthCategory,
          directionality: conn.directionality,
          discoveredBy: 'holistic_synthesis' as const,
        })),
      );
      allMutations.push(...connMutations);
    }

    // V2: Apply graph summary
    if (synthesis.connectionGraphSummary) {
      this.profile.connections.graphSummary = synthesis.connectionGraphSummary;
    }

    // V2: Apply connection upgrades from L3.75
    if (synthesis.connectionUpgrades && synthesis.connectionUpgrades.length > 0) {
      for (const upgrade of synthesis.connectionUpgrades) {
        const existing = this.profile.connections.all.find(c => c.id === upgrade.connectionId);
        if (existing && existing.status === 'active') {
          if (upgrade.strengthCategory) existing.strengthCategory = upgrade.strengthCategory;
          if (upgrade.reverseIllumination) existing.reverseIllumination = upgrade.reverseIllumination;
          if (upgrade.routingTags) existing.routingTags = upgrade.routingTags;
          if (upgrade.significance) existing.significance = upgrade.significance;
        }
      }
    }

    // W1.4: Process new findings from holistic synthesis
    if (synthesis.newFindings && synthesis.newFindings.length > 0) {
      for (const nf of synthesis.newFindings) {
        const id = this.findingStore.generateId();
        const now = new Date().toISOString();
        const finding: Finding = {
          id,
          claim: nf.claim,
          scope: nf.scope,
          maturity: nf.maturity,
          maturityReasoning: nf.maturityReasoning,
          coachingValue: nf.coachingValue,
          dimensions: nf.dimensions,
          buildsOn: (nf.buildsOn ?? []).filter(ref => this.findingStore.has(ref)),
          relatedTo: (nf.relatedTo ?? []).filter(ref => this.findingStore.has(ref)),
          source: 'holistic_synthesis',
          deepeningPotential: nf.deepeningPotential,
          raisesQuestions: nf.raisesQuestions,
          evidence: nf.evidence,
          lineage: [{
            timestamp: now,
            previousMaturity: 'hypothesis',
            newMaturity: nf.maturity,
            trigger: 'holistic_synthesis',
            reasoning: nf.maturityReasoning,
          }],
          createdAt: now,
          lastUpdated: now,
        };
        try {
          this.findingStore.add(finding);
        } catch (e) {
          console.warn(`[EssayProfileCoordinator] Failed to add finding from synthesis: ${(e as Error).message}`);
        }
      }
    }

    // W1.4: Process finding evolutions from holistic synthesis
    if (synthesis.findingEvolutions && synthesis.findingEvolutions.length > 0) {
      for (const evo of synthesis.findingEvolutions) {
        try {
          this.findingStore.updateMaturity(
            evo.findingId,
            evo.newMaturity,
            evo.reasoning,
            'holistic_synthesis',
            evo.supersedes,
          );
        } catch (e) {
          console.warn(`[EssayProfileCoordinator] Failed to evolve finding ${evo.findingId}: ${(e as Error).message}`);
        }
      }
    }

    // W3.2: Full recompute after holistic synthesis finding mutations.
    // Holistic synthesis creates cross-paragraph findings, so all sentences
    // need their findingRefs updated. afterMutation will also recompute,
    // but this ensures correctness before the structural islands computation.
    recomputeFindingRefsForSentences(this.profile, this.findingStore);

    // V2: Compute structural islands from connection graph
    const connectedParagraphs = new Set<number>();
    for (const c of this.profile.connections.all.filter(c => c.status === 'active')) {
      if (c.strengthCategory === 'foundational' || c.strengthCategory === 'significant') {
        connectedParagraphs.add(c.from.paragraph);
        connectedParagraphs.add(c.to.paragraph);
      }
    }
    this.profile.connections.structuralIslands = [];
    for (let i = 0; i < this.profile.paragraphs.length; i++) {
      if (!connectedParagraphs.has(i)) {
        this.profile.connections.structuralIslands.push(i);
      }
    }

    this.afterMutation(allMutations, {});

    // Checkpoint after L3.75 (first comprehensive holistic understanding)
    this.checkpoint('after_l3_75');
  }

  /**
   * W5.2: Apply section-level delta synthesis output.
   *
   * Only replaces the holistic sections that were re-synthesized by the delta
   * synthesis call. All other sections remain untouched.
   *
   * Called by: orchestrators after delta synthesis completes (W5.4 triggers).
   */
  applySectionLevelSynthesis(output: DeltaSynthesisOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('delta_synthesis');

    if (!output.isSubstantive || output.updatedSections.length === 0) {
      console.log('[EssayProfileCoordinator] Delta synthesis produced no substantive changes — skipping');
      return;
    }

    const mutations = this.holisticMutator.applySectionLevelMerge(
      this.profile,
      output.partialSynthesis,
      output.updatedSections,
    );

    if (mutations.length > 0) {
      this.afterMutation(mutations, {});
      console.log(
        `[EssayProfileCoordinator] Delta synthesis applied — ` +
        `sections: [${output.updatedSections.join(', ')}], ` +
        `changes: ${output.changeLog.length}`,
      );
    }
  }

  /**
   * L3.5: Apply one paragraph's analysis pass output.
   */
  applyAnalysisPassResult(result: AnalysisPassOutput): void {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L3_5_analysis');
    const allMutations: MutationType[] = [];

    // SentenceMutator: store analysis for each sentence
    // Scope 2 Phase 5: also harvest inline improvementCandidates into the
    // candidate store so L4 consolidation sees them. The field is propagated
    // into SentenceAnalysis for checkpoint persistence.
    const harvestedL35Candidates: ImprovementCandidate[] = [];
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
          improvementCandidate: sa.improvementCandidate,
        },
      );
      allMutations.push(...mutations);

      if (sa.improvementCandidate) {
        harvestedL35Candidates.push(sa.improvementCandidate);
      }
    }

    if (harvestedL35Candidates.length > 0) {
      this.addImprovementCandidates(harvestedL35Candidates, { source: 'L3.5' });
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

    // Note: aoTakeaway is written by L3.75 (holisticSynthesis), not here.
    // L3.5's per-paragraph aoTakeaway is part of holisticAnalysisEvolution but is not routed
    // to the profile — it's used as working context only. L3.75 sees the whole essay and
    // generates the authoritative essay-level AO impression.

    this.afterMutation(allMutations, { paragraphIndex: result.paragraphIndex });

    // Phase 1 revision-history hook. Snapshot failures MUST NOT break the
    // analysis cycle — wrap in try/catch, log, and return. Idempotent when
    // writeSnapshot is called multiple times within one session (same
    // revisionSessionId replaces in place).
    this.captureRevisionSnapshot();
  }

  /**
   * Capture a cross-session revision snapshot of the current profile.
   *
   * Called at the end of each L3.5 analysis pass. Uses the stable
   * `revisionSessionId` for idempotency — multiple writes within one
   * coordinator lifetime REPLACE a single stored entry rather than
   * stacking duplicates. The revision-history cap (10) and reset
   * semantics (substantial_rewrite / topic_change / manual_reset) are
   * enforced by `writeSnapshot`.
   *
   * Failure policy: any extraction / write failure is caught and logged.
   * The analysis cycle never fails because of a snapshot.
   */
  private captureRevisionSnapshot(): void {
    try {
      const currentEssayText = (this.profile.paragraphs ?? [])
        .map((p) => (typeof p.text === 'string' ? p.text : ''))
        .join('\n\n');

      const result = writeSnapshot({
        history: this.profile.revisionHistory,
        profile: this.profile,
        sessionId: this.revisionSessionId,
        version: this.writeVersion,
        priorEssayText: this.priorSnapshotEssayText,
      });

      this.profile.revisionHistory = result.history;
      // Cache this snapshot's essay text so the NEXT write can honestly
      // compute token overlap against the prior snapshot's content.
      this.priorSnapshotEssayText = currentEssayText;

      if (result.resetSignal.triggered) {
        console.log(
          `[EssayProfileCoordinator] revision reset fired: ` +
            `reason=${result.resetSignal.reason}` +
            (typeof result.resetSignal.tokenOverlap === 'number'
              ? ` overlap=${result.resetSignal.tokenOverlap.toFixed(3)}`
              : ''),
        );
      }

      // Phase 2 — Derive cross-session intelligence from the snapshot chain
      // PLUS the live profile. Both computes tolerate history.length < 2 by
      // returning null (session one, or post-reset). The intelligence is
      // attached to the profile so the coaching prompt can read it. Wrap in
      // try/catch at the outer layer (this try) — compute failures are
      // non-fatal, identical to snapshot write failures.
      //
      // Ordering note: these run AFTER the snapshot write so
      // `result.history` contains the current-session snapshot at its tail.
      // computeRevisionIntelligence / computeVoiceEvolution strip the
      // current-session entry by essayTextHash match before comparing.
      const snapshotsForCompute = result.history.snapshots;
      const revIntel = computeRevisionIntelligence(this.profile, snapshotsForCompute);
      const voiceEvo = computeVoiceEvolution(this.profile, snapshotsForCompute);
      this.profile.revisionIntelligence = revIntel;
      this.profile.voiceEvolution = voiceEvo;
    } catch (err) {
      console.error(
        '[EssayProfileCoordinator] revision snapshot write failed (non-fatal):',
        err instanceof Error ? err.message : err,
      );
    }
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
   * L4: Apply paragraph score matrix (wholesale L4 output).
   * No mutator needed — direct assignment for complete L4 artifact.
   */
  applyScoreMatrix(matrix: ParagraphScoreMatrix): void {
    this.checkSessionBoundary();
    this.profile.scoreMatrix = matrix;
  }

  /**
   * L4: Apply coherence report (wholesale L4 output).
   * No mutator needed — direct assignment for complete L4 artifact.
   */
  applyCoherenceReport(report: CoherenceReport): void {
    this.checkSessionBoundary();
    this.profile.coherenceReport = report;
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
            { observation: insight.sourceText, confidence: 0.7, evidence: `Student emotional reaction: "${insight.sourceText}"` },
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
   * Update the accumulated student-declared context prose string.
   * Called by Stage 4 new_context handler when the student reveals background information.
   */
  updateStudentDeclaredContext(context: string): void {
    this.profile.studentDeclaredContext = context;
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

    // W3.2: Sync finding refs on light-touch path (bypasses afterMutation)
    recomputeFindingRefsForSentences(this.profile, this.findingStore);

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

  /**
   * Update the improvement phase in the profile index.
   * Called after focused analysis recomputes the phase.
   */
  updateImprovementPhase(phase: ImprovementPhase): void {
    this.checkSessionBoundary();
    this.profile.index.improvementPhase = phase;
    console.log(`[EssayProfileCoordinator] Improvement phase updated: ${phase.level}`);

    // Manually perform afterMutation bookkeeping:
    // - Increment writeVersion for optimistic concurrency tracking
    // - Update lastMutatedAt timestamp
    // - Recompute the ProfileIndex
    // Note: No staleness propagation needed — improvement phase has no downstream
    // dependencies in the dependency map.
    this.writeVersion++;
    this.profile.metadata.lastMutatedAt = new Date().toISOString();
    this.sessionBoundary.lastMutationAt = Date.now();
    this.recomputeIndex();
  }

  /**
   * Add a detected pattern insight to the profile.
   * Called after coaching turn detectPatterns().
   */
  addPatternInsight(pattern: PatternInsight): void {
    this.checkSessionBoundary();
    this.insightMutator.addPatternInsight(this.profile, pattern);
    this.afterMutation(['conversation_insight_applied'], {});
  }

  /**
   * Add connections via the ConnectionMutator (public entry point).
   *
   * Used by the orchestrator's growth cycle to properly route re-read
   * connections through the ConnectionMutator instead of directly pushing
   * to profile.connections.all[]. This ensures:
   * - Duplicate detection (isDuplicate check)
   * - connectionRef management on endpoint sentences
   * - Proper mutation tracking for staleness propagation
   *
   * @returns connectionIds (parallel array with input) and mutations
   */
  addConnections(
    connections: Array<{
      from: ConnectionEndpoint;
      to: ConnectionEndpoint;
      description: string;
      reverseIllumination: string | null;
      significance: string;
      strengthCategory: import('../profileTypes').ConnectionStrengthCategory;
      directionality: import('../profileTypes').ConnectionDirectionality;
      discoveredBy: import('../profileTypes').ConnectionSource;
      routingTags?: import('../profileTypes').ConnectionRoutingTag[];
      relatedFindings?: string[];
    }>,
  ): { mutations: MutationType[]; connectionIds: string[] } {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('addConnections');

    const result = this.connectionMutator.addConnections(this.profile, connections);

    if (result.mutations.length > 0) {
      this.afterMutation(result.mutations, {});
    }

    return result;
  }

  /**
   * W3.1: Apply sentence understanding update directly.
   *
   * Public entry point for reverse-propagation from finding supersession.
   * When findings are superseded during coaching, the sentence-level
   * inferredIntents must be rebuilt from remaining active findings.
   * This method wraps the sentenceMutator with proper afterMutation bookkeeping.
   *
   * @returns MutationType[] from the sentenceMutator
   */
  applySentenceUnderstandingDirect(
    paragraphIndex: number,
    sentenceIndex: number,
    update: Partial<SentenceUnderstanding>,
  ): MutationType[] {
    this.checkSessionBoundary();
    this.checkCircuitBreaker('L6_reverse_propagation');

    const mutations = this.sentenceMutator.applySentenceUnderstanding(
      this.profile,
      paragraphIndex,
      sentenceIndex,
      update,
    );

    if (mutations.length > 0) {
      this.afterMutation(mutations, {
        paragraphIndex,
        affectedSentences: [{ paragraph: paragraphIndex, sentence: sentenceIndex }],
      });
    }

    return mutations;
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
   * W1.2: Get the FindingStore for direct access by pipeline stages.
   */
  getFindingStore(): FindingStore {
    return this.findingStore;
  }

  /**
   * Return a fresh serialization of the candidate store. Used by the
   * orchestrator immediately before `buildImprovementManifest()` so that
   * L4 priority → candidate technique resolution (via `consolidatedFrom`
   * IDs) has a guaranteed-non-stale view of the store — without waiting
   * for the next full checkpoint.
   *
   * Root cause of the S3/V14/S6/partial-S5 audit failures: the manifest
   * builder reads `profile.improvementCandidateSnapshot`, which is only
   * synced inside `checkpoint()`. When the checkpoint cadence and the
   * manifest-build timing drift, manifest items end up with
   * `technique: null` despite every candidate in the store carrying one.
   */
  snapshotCandidateStore(): ImprovementCandidateStoreSnapshot {
    return this.candidateStore.serialize();
  }

  // ══════════════════════════════════════════════════════════════════════
  // Scope 2 Phase 4: ImprovementCandidateStore accessors + lifecycle methods
  //
  // These methods parallel the existing applyInsight/applyScoreMatrix style:
  // delegate to the store, log with [Coordinator] layer prefix, and keep
  // the field private so the orchestrator can't mutate candidates directly.
  //
  // Phase 5 will call addImprovementCandidates() after each L3/L3.5/L3.75
  // apply. Phase 6 will call applyConsolidation() after L4 and
  // markImprovementsFinalized() after L5.
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Scope 2 Phase 4: Add improvement candidates harvested from a layer result.
   *
   * Called by analysisOrchestrator immediately after L3, L3.5, or L3.75
   * applies its output. Idempotent — duplicate IDs are skipped with a
   * debug log inside the store (not an error; re-runs produce stable IDs).
   */
  addImprovementCandidates(
    candidates: ImprovementCandidate[],
    options: { source: 'L3' | 'L3.5' | 'L3.75' },
  ): void {
    this.candidateStore.addAll(candidates);
    console.log(
      `[Coordinator] ${options.source}: added ${candidates.length} improvement candidates ` +
        `(total active: ${this.candidateStore.getActive().length})`,
    );
  }

  /**
   * Scope 2 Phase 4: Direct read access to the candidate store.
   * Orchestrator uses this when it needs lifecycle-state-aware queries
   * (e.g., getBySource, markConsolidated) that the convenience methods
   * don't expose directly.
   */
  getImprovementCandidateStore(): ImprovementCandidateStore {
    return this.candidateStore;
  }

  /**
   * Scope 2 Phase 4: Get active (non-superseded) candidates sorted by
   * coachingValue. Convenience reader for downstream consumers that want
   * a pre-sorted list.
   */
  getImprovementCandidates(): ImprovementCandidate[] {
    return this.candidateStore.getActiveSortedByCoachingValue();
  }

  /**
   * Scope 2 Phase 4: Build the L4 prompt context block from active
   * candidates. Called by the orchestrator when assembling the L4b
   * crystallization prompt in Phase 6.
   */
  getImprovementCandidateContextBlock(): string {
    return this.candidateStore.toL4ContextBlock();
  }

  /**
   * Scope 2 Phase 4: Apply L4's consolidation decisions to the candidate store.
   * Called by orchestrator after the L4 result is parsed in Phase 6.
   *
   * For each CoachingMap priority:
   *   - Candidates in priority.consolidatedFrom → lifecycleState='consolidated'
   *   - Candidates NOT referenced by any priority → lifecycleState='superseded'
   *     (L4 saw them and chose not to use them; they are dominated by other
   *     candidates or the priority list L4 generated.)
   *
   * Callers supply the full set of IDs for each transition group — this
   * method is a pure bookkeeping helper, not a policy maker.
   */
  applyConsolidation(consolidatedIds: string[], supersededIds: string[]): void {
    this.candidateStore.markConsolidated(consolidatedIds);
    this.candidateStore.markSuperseded(supersededIds);
    console.log(
      `[Coordinator] Consolidation applied: ${consolidatedIds.length} consolidated, ` +
        `${supersededIds.length} superseded. Remaining active: ${this.candidateStore.getActive().length}`,
    );
  }

  /**
   * Scope 2 Phase 4: Mark candidates as finalized (L5 wrote rewriteExamples).
   * Called by orchestrator after the L5 result is harvested into the manifest
   * in Phase 6.
   */
  markImprovementsFinalized(ids: string[]): void {
    this.candidateStore.markFinalized(ids);
    console.log(
      `[Coordinator] Finalized ${ids.length} improvement candidates (active: ${this.candidateStore.getActive().length})`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════

  /**
   * Seed prior findings for comprehensive re-analysis evolution.
   *
   * Must be called immediately after coordinator creation, before any
   * layer runs. The walk will see these findings in its prompt context
   * and can produce findingEvolutions against them.
   */
  seedPriorFindings(priorFindings: Finding[]): void {
    const { seeded, skipped } = this.findingStore.seedForReanalysis(priorFindings);
    if (seeded > 0) {
      console.log(
        `[EssayProfileCoordinator] Seeded ${seeded} prior findings for re-analysis evolution` +
        (skipped > 0 ? ` (${skipped} skipped — duplicate IDs)` : ''),
      );
    }
  }

  /**
   * W3.2: Recompute all sentence findingRefs from the FindingStore.
   *
   * Public method for callers to force a full sync after batch operations
   * (growth cycles, re-analysis, deep dives). Internally called by
   * afterMutation, but exposed for explicit use when FindingStore is
   * mutated outside the coordinator's dispatch methods.
   *
   * @param affectedParagraphs - If provided, only recompute for these paragraphs
   */
  recomputeAllFindingRefs(affectedParagraphs?: number[]): void {
    recomputeFindingRefsForSentences(this.profile, this.findingStore, affectedParagraphs);
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
    // W1.2: Sync findings back to profile before persisting
    this.profile.findings = this.findingStore.serialize().findings;

    // Scope 2 Phase 4: Sync improvement candidate store back to profile
    // before persisting. Mirrors the findings-sync pattern above. Enables
    // the Phase 5+ candidate lifecycle to survive checkpoint boundaries
    // and the migration backfill from Phase 1.5 to persist cleanly.
    this.profile.improvementCandidateSnapshot = this.candidateStore.serialize();

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

    // 4. W3.2: Recompute finding → sentence refs (bidirectional sync)
    // This ensures findingRefs on SentenceUnderstanding always reflect
    // the current FindingStore state after any mutation.
    recomputeFindingRefsForSentences(this.profile, this.findingStore);

    // 5. Recompute ProfileIndex
    this.recomputeIndex();

    // 6. Quick validation (logged, does not block)
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

    // Rebuild digests if count mismatch (defensive — should not happen)
    if (profile.paragraphs.length !== index.paragraphDigest.length) {
      console.warn(
        `[ProfileIndex] Paragraph count mismatch: ${profile.paragraphs.length} paragraphs but ` +
        `${index.paragraphDigest.length} digests. Rebuilding.`,
      );
      index.paragraphDigest = profile.paragraphs.map((_, idx) => ({
        index: idx,
        roleSummary: '',
        tags: [],
        themes: [],
        sentenceCount: 0,
        hasStrengths: false,
        hasWeaknesses: false,
        connectionCount: 0,
        improvementPriority: 0,
      }));
    }

    // Pre-compute connection counts per paragraph (O(C) instead of O(N×C))
    // Only count active connections
    const connectionsByParagraph = new Map<number, number>();
    for (const conn of profile.connections.all.filter(c => c.status === 'active')) {
      connectionsByParagraph.set(conn.from.paragraph, (connectionsByParagraph.get(conn.from.paragraph) ?? 0) + 1);
      if (conn.from.paragraph !== conn.to.paragraph) {
        connectionsByParagraph.set(conn.to.paragraph, (connectionsByParagraph.get(conn.to.paragraph) ?? 0) + 1);
      }
    }

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
        digest.connectionCount = connectionsByParagraph.get(i) ?? 0;
      }
    }

    // Update connection graph from connections store
    index.connectionGraph = profile.connections.all.map(c => ({
      id: c.id,
      from: { paragraph: c.from.paragraph, sentence: c.from.sentence },
      to: { paragraph: c.to.paragraph, sentence: c.to.sentence },
      routingTags: c.routingTags,
      strengthCategory: c.strengthCategory,
      status: c.status,
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

    // --- FIX 1: Populate the 5 previously-empty ProfileIndex fields ---

    // 1. topicTags: Collect content-descriptive tags from all levels
    const tagSet = new Set<string>();
    const wordOccurrences = new Map<string, number>();
    for (const para of profile.paragraphs) {
      for (const tag of para.tags) {
        tagSet.add(tag.toLowerCase());
      }
      for (const sent of para.sentences) {
        if (sent.understanding) {
          for (const tag of sent.understanding.tags) {
            tagSet.add(tag.toLowerCase());
          }
          // Track significant word occurrences across sentences
          if (sent.understanding?.significantChoices) {
            for (const choice of sent.understanding.significantChoices) {
              const word = choice.word.toLowerCase();
              wordOccurrences.set(word, (wordOccurrences.get(word) ?? 0) + 1);
            }
          }
        }
      }
    }
    // Add thematic thread names
    if (profile.thematicArchitecture?.threads) {
      for (const thread of profile.thematicArchitecture.threads) {
        tagSet.add(thread.thread.toLowerCase());
      }
    }
    // Add significant words that appear in multiple sentences
    for (const [word, count] of wordOccurrences) {
      if (count >= 2) {
        tagSet.add(word);
      }
    }
    index.topicTags = Array.from(tagSet);

    // 2. sectionTokenCounts: Estimate tokens via JSON.stringify char count / 4
    const estimateTokens = (obj: unknown): number => Math.ceil(JSON.stringify(obj).length / 4);
    index.sectionTokenCounts = {
      voiceIdentity: estimateTokens(profile.voiceIdentity),
      voiceMap: estimateTokens(profile.voiceMap),
      emotionalTopography: estimateTokens(profile.emotionalTopography),
      momentEarnednessMap: estimateTokens(profile.momentEarnednessMap),
      thematicArchitecture: estimateTokens(profile.thematicArchitecture),
      narrativeStrategy: estimateTokens(profile.narrativeStrategy),
      characterRevelation: estimateTokens(profile.characterRevelation),
      craftAssessment: estimateTokens(profile.craftAssessment),
      entanglements: estimateTokens(profile.entanglements),
      admissionsPositioning: estimateTokens(profile.admissionsPositioning),
      northStar: estimateTokens(profile.northStar),
      connections: estimateTokens(profile.connections),
      paragraphs: profile.paragraphs.map(p => {
        // Estimate tokens WITHOUT paragraph text (text is injected separately, not from profile)
        const profileData = {
          understanding: p.understanding,
          analysis: p.analysis,
          sentences: p.sentences.map(s => ({
            understanding: s.understanding,
            analysis: s.analysis,
          })),
        };
        return estimateTokens(profileData);
      }),
    };

    // 3. northStarSummary: Compact summary from profile.northStar
    if (profile.northStar) {
      const ns = profile.northStar;
      let throughLineSummary: string | null = null;
      if (ns.throughLineMap) {
        if (ns.throughLineMap.centralElement && ns.throughLineMap.transformation) {
          throughLineSummary = `${ns.throughLineMap.centralElement} — ${ns.throughLineMap.transformation}`;
        } else if (ns.throughLineMap.centralElement) {
          throughLineSummary = ns.throughLineMap.centralElement;
        }
      }
      // Flatten structural roles: one entry per paragraph covered
      const structuralRoles: Array<{ paragraphIndex: number; role: string; significance: 'load_bearing' | 'supporting' | 'transitional' }> = [];
      for (const sr of ns.structuralRolesMap) {
        const sig = sr.weight === 'decorative' ? 'transitional' as const : sr.weight;
        for (const pIdx of sr.paragraphs) {
          if (pIdx < 0 || pIdx >= profile.paragraphs.length) continue;
          structuralRoles.push({ paragraphIndex: pIdx, role: sr.role, significance: sig });
        }
      }
      // Compute maturity: count populated North Star dimensions
      let dimensionCount = 0;
      if (ns.throughLineMap) dimensionCount++;
      if (ns.structuralRolesMap.length > 0) dimensionCount++;
      if (ns.trajectory) dimensionCount++;
      if (ns.distinctivenessSignature.articulation) dimensionCount++;
      if (ns.intentBridge) dimensionCount++;
      const maturity: 'absent' | 'sketch' | 'emerging' | 'full' =
        dimensionCount === 0 ? 'absent' :
        dimensionCount <= 2 ? 'sketch' :
        dimensionCount === 3 ? 'emerging' : 'full';
      index.northStarSummary = { throughLineSummary, structuralRoles, maturity };
    } else {
      index.northStarSummary = { throughLineSummary: null, structuralRoles: [], maturity: 'absent' };
    }

    // 4. activeConcerns: Walk L3.5 analysis results for problems
    const concerns: Array<{ location: [number, number | null]; concern: string; severity: 'critical' | 'significant' | 'minor' }> = [];
    for (let pIdx = 0; pIdx < profile.paragraphs.length; pIdx++) {
      const para = profile.paragraphs[pIdx];
      // Sentence-level concerns from analysis
      for (let sIdx = 0; sIdx < para.sentences.length; sIdx++) {
        const analysis = para.sentences[sIdx].analysis;
        if (analysis?.isProblem) {
          const severity: 'critical' | 'significant' | 'minor' =
            analysis.priorityForImprovement >= 4 ? 'critical' :
            analysis.priorityForImprovement >= 2 ? 'significant' : 'minor';
          concerns.push({
            location: [pIdx, sIdx],
            concern: analysis.effectivenessReasoning,
            severity,
          });
        }
      }
      // Paragraph-level concerns from growthEdges
      if (para.analysis) {
        for (const edge of para.analysis.growthEdges) {
          concerns.push({
            location: [pIdx, null],
            concern: edge.description,
            severity: 'significant',
          });
        }
      }
    }
    // Cap concerns at 30, prioritized by severity
    if (concerns.length > 30) {
      const severityRank: Record<string, number> = { critical: 0, significant: 1, minor: 2 };
      concerns.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
      index.activeConcerns = concerns.slice(0, 30);
    } else {
      index.activeConcerns = concerns;
    }

    // 5. improvementPriority and themes in paragraph digests
    for (let i = 0; i < profile.paragraphs.length; i++) {
      if (i < index.paragraphDigest.length) {
        const para = profile.paragraphs[i];
        const digest = index.paragraphDigest[i];
        const sentencePriorities = para.sentences
          .map(s => s.analysis?.priorityForImprovement ?? 0);
        digest.improvementPriority = sentencePriorities.length > 0
          ? Math.max(...sentencePriorities)
          : 0;

        // Populate themes from thematic thread appearances
        if (profile.thematicArchitecture?.threads) {
          digest.themes = profile.thematicArchitecture.threads
            .filter(t => t.appearances.some(a => a.paragraph === i) ||
                         (t.introducedAt.paragraph === i))
            .map(t => t.thread);
        } else {
          digest.themes = [];
        }
      }
    }

    // W1.2: Compute finding summary from FindingStore
    const activeFindings = this.findingStore.getActive();
    if (activeFindings.length > 0) {
      const byMaturity: Partial<Record<FindingMaturity, number>> = {};
      for (const f of activeFindings) {
        byMaturity[f.maturity] = (byMaturity[f.maturity] ?? 0) + 1;
      }
      const topFindings = this.findingStore.getActiveSortedByCoachingValue()
        .slice(0, 10)
        .map(f => ({
          id: f.id,
          claim: f.claim,
          maturity: f.maturity,
          coachingValue: f.coachingValue,
        }));
      index.findingSummary = {
        totalActive: activeFindings.length,
        byMaturity,
        topFindings,
      };
    } else {
      index.findingSummary = undefined;
    }
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

  // REMOVED: findParagraphIndexForWalkOutput heuristic.
  // UnderstandingWalkOutput now carries an explicit paragraphIndex field.
  // The old heuristic ("first paragraph without understanding") broke on re-analysis
  // because all paragraphs already have understanding, causing every walk step to
  // overwrite the last paragraph.

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
