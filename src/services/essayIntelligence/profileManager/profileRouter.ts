/**
 * Profile Router — Context Assembly System
 *
 * Assembles precisely-scoped context for EVERY LLM call in the Essay Intelligence system.
 * The router is the quality multiplier: it ensures each API call sees exactly the profile
 * data it needs — no more (wasted tokens), no less (missing context).
 *
 * Connection-driven routing is PRIMARY: the connection graph determines which paragraphs
 * get full detail. Proximity is the FALLBACK for paragraphs without established connections.
 *
 * 16 routing rules, each tailored to a specific call type.
 *
 * Consumed by: every layer's prompt builder, coaching service, inline edit service,
 *              re-analysis pipeline, focused analysis pipeline.
 *
 * Spec: docs/plan-sections/04-profile-manager.md (Section 4-5)
 *       PLAN.md lines 3170-3212 (routing rules table)
 */

import type {
  EssayProfile,
  ParagraphProfile,
  Connection,
  EditDiff,
  StalenessSnapshot,
  ReadingStrategy,
} from '../profileTypes';

import type {
  DeclaredContextRequest,
  ContextSectionSpec,
  ContextRelevanceTracker,
  ContextDiagnosticStats,
} from './routerTypes';
import { InMemoryRelevanceTracker } from './routerTypes';

// Re-export declared context types for consumers
export type { DeclaredContextRequest, ContextSectionSpec, ContextDiagnosticStats } from './routerTypes';

// ============================================================================
// ROUTING RULE TYPES
// ============================================================================

/**
 * Routing rule identifiers — each maps to specific context assembly logic.
 */
export type RoutingRule =
  | 'l3_understanding_walk'
  | 'l3_5_analysis_pass'
  | 'l3_75_holistic_synthesis'
  | 'l3_75_synthesis_iteration'
  | 'l4_crystallization'
  | 'l5_feedback_annotations'
  | 'l6_coaching_voice'
  | 'l6_coaching_paragraph'
  | 'l6_coaching_overview'
  | 'inline_edit_sentence'
  | 'reanalysis_comprehensive'
  | 'focused_understanding'
  | 'focused_analysis'
  | 'impact_classification'
  | 'deep_dive'
  | 'full_context_reread';

/**
 * Context request — what the caller wants assembled.
 */
export interface ContextRequest {
  rule: RoutingRule;
  /** Target paragraph for paragraph-scoped rules */
  paragraphIndex?: number;
  /** Target sentence for sentence-scoped rules */
  sentenceIndex?: number;
  /** Search tags for tag-based lookup (coaching) */
  searchTags?: string[];
  /** Approximate token budget for context */
  tokenBudget?: number;
  /** Edit context for focused analysis / impact classification rules */
  editContext?: {
    diff: EditDiff;
    changedParagraphs: number[];
    stalenessSnapshot: StalenessSnapshot;
  };
  /** Required context section names for deep_dive rule (from prompt template) */
  requiredContext?: string[];
  /** Context priorities for ReadingStrategy-aware section ordering (most important first) */
  contextPriorities?: string[];
}

/**
 * Assembled context — what the router produces for the caller's prompt builder.
 */
export interface AssembledProfileContext {
  /** The profile sections to include in the LLM prompt */
  sections: ProfileSection[];
  /** Estimated total tokens */
  estimatedTokens: number;
  /** Which routing rule was applied */
  appliedRule: RoutingRule | 'declared';
  /** Any sections that were dropped due to token budget */
  droppedSections: string[];
}

/**
 * A single section of profile data assembled for inclusion in an LLM prompt.
 */
export interface ProfileSection {
  name: string;
  content: unknown;
  tokenEstimate: number;
  priority: 'always' | 'connection_driven' | 'proximity' | 'nice_to_have';
}

// ============================================================================
// ADAPTIVE OVERLAY SYSTEM (W8.1)
// ============================================================================

/**
 * Adaptive overlay — context adjustments computed from task + profile state.
 * ADDITIVE: when no overlay applies, all 13 rules work exactly as before.
 */
export interface AdaptiveOverlay {
  /** Additional profile sections to include beyond what the rule normally assembles */
  additionalSections: string[];
  /** Sections that should be promoted to higher priority in budget enforcement */
  prioritySections: string[];
  /** Override the computed token budget (takes precedence over per-rule budgets) */
  tokenBudgetOverride?: number;
  /** Why this overlay was applied — for diagnostics */
  reason: string;
}

/**
 * Examine the task context and profile state to compute an adaptive overlay.
 * Returns an overlay with adjustments, or a no-op overlay (empty arrays, no override).
 */
function computeAdaptiveOverlay(
  profile: Readonly<EssayProfile>,
  request: ContextRequest,
): AdaptiveOverlay {
  const additionalSections: string[] = [];
  const prioritySections: string[] = [];
  let tokenBudgetOverride: number | undefined;
  const reasons: string[] = [];

  // Multi-dimensional connections at target paragraph → include both narrative + voice sections
  if (request.paragraphIndex !== undefined) {
    const pIdx = request.paragraphIndex;
    const connectionsForPara = getConnectionsForParagraph(profile, pIdx);
    const routingTagsAtPara = new Set<string>();
    for (const conn of connectionsForPara) {
      for (const tag of conn.routingTags) {
        routingTagsAtPara.add(tag);
      }
    }

    // Multi-dimensional: connections spanning 2+ routing tag types at this paragraph
    if (routingTagsAtPara.size >= 2) {
      additionalSections.push('narrativeStrategy', 'voiceIdentity');
      reasons.push(
        `Multi-dimensional connections at P${pIdx} (${[...routingTagsAtPara].join(', ')}) — including narrative + voice`,
      );
    }

    // High connection density (>4 active connections) on focused_analysis → expand budget
    if (request.rule === 'focused_analysis' && connectionsForPara.length > 4) {
      tokenBudgetOverride = 12000;
      reasons.push(
        `High connection density (${connectionsForPara.length} connections) at P${pIdx} for focused_analysis — expanding budget to 12K`,
      );
    }
  }

  // All coaching rules → always prioritize NorthStar
  if (request.rule.startsWith('l6_coaching')) {
    prioritySections.push('northStar', 'northStarSummary', 'throughLineContext');
    reasons.push('Coaching rule — prioritizing NorthStar context');
  }

  return {
    additionalSections,
    prioritySections,
    tokenBudgetOverride,
    reason: reasons.length > 0 ? reasons.join('; ') : 'no overlay',
  };
}

// ============================================================================
// ADAPTIVE TOKEN BUDGETING (W8.2)
// ============================================================================

/** Per-rule base token budgets — tuned to each rule's typical context needs */
const RULE_BASE_BUDGETS: Record<RoutingRule, number> = {
  l3_understanding_walk: 8000,
  l3_5_analysis_pass: 8000,
  l3_75_holistic_synthesis: 8000,
  l3_75_synthesis_iteration: 14000,
  l4_crystallization: 8000,
  l5_feedback_annotations: 8000,
  l6_coaching_voice: 8000,
  l6_coaching_paragraph: 6000,
  l6_coaching_overview: 4000,
  inline_edit_sentence: 8000,
  reanalysis_comprehensive: 12000,
  focused_understanding: 8000,
  focused_analysis: 8000,
  impact_classification: 8000,
  deep_dive: 8000,
  full_context_reread: 8000,
};

/** Hard cap — no rule can exceed this regardless of scaling or overlay */
const TOKEN_BUDGET_HARD_CAP = 16000;

/**
 * Compute the effective token budget for a given rule + profile + overlay.
 *
 * 1. Start with per-rule base budget
 * 2. Apply profile density scaling (more connections = more context needed)
 * 3. Apply overlay override if set (takes precedence)
 * 4. Enforce hard cap
 */
function computeTokenBudget(
  rule: RoutingRule,
  profile: Readonly<EssayProfile>,
  overlay: AdaptiveOverlay,
): number {
  // Overlay override takes precedence when set
  if (overlay.tokenBudgetOverride !== undefined) {
    return Math.min(overlay.tokenBudgetOverride, TOKEN_BUDGET_HARD_CAP);
  }

  // Start with per-rule base
  let budget = RULE_BASE_BUDGETS[rule];

  // Profile density scaling: +1K per 5 active connections, capped at +4K
  const activeConnectionCount = profile.index.connectionGraph.filter(
    (c) => c.status === 'active',
  ).length;
  const densityBonus = Math.min(
    Math.floor(activeConnectionCount / 5) * 1000,
    4000,
  );
  budget += densityBonus;

  // Enforce hard cap
  return Math.min(budget, TOKEN_BUDGET_HARD_CAP);
}

// ============================================================================
// TASK PRIORITY REWEIGHTING (W8.3)
// ============================================================================

/**
 * Priority weight for a profile section — higher = more important for this task.
 * Used to influence section ordering/truncation when budget is tight.
 */
export interface TaskPriorityWeights {
  [sectionName: string]: number; // 0-10 scale, 5 = neutral/default
}

/**
 * Compute task-specific priority weights for profile sections based on routing rule.
 * Sections not listed get the default weight of 5 (balanced).
 *
 * Used by applyTokenBudget to break ties within the same priority tier
 * and to influence which sections survive truncation.
 */
function getTaskPriorities(rule: RoutingRule): TaskPriorityWeights {
  switch (rule) {
    // Voice coaching → prioritize voice sections
    case 'l6_coaching_voice':
      return {
        voiceIdentity: 10,
        voiceMap: 10,
        voiceContext: 9,
        emotionalTopography: 6,
        craftAssessment: 6,
      };

    // Paragraph coaching → prioritize local understanding/analysis/connections
    case 'l6_coaching_paragraph':
      return {
        // Dynamic keys (paragraph_P*_full, connected_P*_sentences) get boosted
        // via the _paragraph prefix match in resolveTaskWeight
        _paragraphLocal: 10,
        _connectedSentences: 9,
        voiceContext: 7,
        thematicContext: 7,
        throughLineContext: 8,
        structuralContext: 8,
      };

    // Overview coaching → prioritize holistic + northStar
    case 'l6_coaching_overview':
      return {
        holisticFull: 10,
        northStar: 10,
        paragraphDigests: 4,
      };

    // Focused analysis → prioritize sentence-level + connections
    case 'focused_analysis':
      return {
        _sentenceFull: 10,
        _paragraphAnalysis: 9,
        _connectedAnalysis: 8,
      };

    // Default: balanced (all sections get equal weight = 5)
    default:
      return {};
  }
}

/**
 * Resolve the effective weight for a section name given task priorities.
 * Supports both exact matches and prefix-based matching for dynamic section names.
 */
function resolveTaskWeight(sectionName: string, weights: TaskPriorityWeights): number {
  const DEFAULT_WEIGHT = 5;

  // Exact match first
  if (weights[sectionName] !== undefined) return weights[sectionName];

  // Prefix-based matching for dynamic section names:
  // _paragraphLocal matches paragraph_P*_full, paragraph_P*_understanding, etc.
  if (weights._paragraphLocal !== undefined && sectionName.startsWith('paragraph_P')) {
    return weights._paragraphLocal;
  }
  // _connectedSentences matches connected_P*_sentences
  if (weights._connectedSentences !== undefined && sectionName.startsWith('connected_P') && sectionName.includes('_sentences')) {
    return weights._connectedSentences;
  }
  // _sentenceFull matches sentence_P*S*_full
  if (weights._sentenceFull !== undefined && sectionName.startsWith('sentence_P') && sectionName.includes('_full')) {
    return weights._sentenceFull;
  }
  // _paragraphAnalysis matches paragraph_P*_analysis
  if (weights._paragraphAnalysis !== undefined && sectionName.startsWith('paragraph_P') && sectionName.includes('_analysis')) {
    return weights._paragraphAnalysis;
  }
  // _connectedAnalysis matches connected_P*S*_analysis
  if (weights._connectedAnalysis !== undefined && sectionName.startsWith('connected_P') && sectionName.includes('_analysis')) {
    return weights._connectedAnalysis;
  }

  return DEFAULT_WEIGHT;
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/** Default token budget — fallback only (per-rule budgets via computeTokenBudget preferred) */
const DEFAULT_TOKEN_BUDGET = 8000;

/** Rough tokens-per-character ratio for estimating content size */
const TOKENS_PER_CHAR = 0.3;

/**
 * Estimate tokens for an arbitrary object by serializing to JSON.
 * Fast heuristic, not exact — errs on the high side for safety.
 */
function estimateTokens(content: unknown): number {
  if (content === null || content === undefined) return 0;
  const json = JSON.stringify(content);
  return Math.ceil(json.length * TOKENS_PER_CHAR);
}

/**
 * Build a paragraph digest (compact summary) from a ParagraphProfile.
 */
function buildParagraphDigest(para: ParagraphProfile): {
  index: number;
  role: string | null;
  tags: string[];
  sentenceCount: number;
} {
  return {
    index: para.index,
    role: para.understanding?.role ?? null,
    tags: para.tags,
    sentenceCount: para.sentences.length,
  };
}

/**
 * Find all paragraph indices connected to a given paragraph via the connection graph.
 * Returns the set of paragraph indices that have a connection to/from paragraphIndex.
 */
function findConnectedParagraphs(
  profile: Readonly<EssayProfile>,
  paragraphIndex: number,
): Set<number> {
  const connected = new Set<number>();
  for (const entry of profile.index.connectionGraph) {
    if (entry.status !== 'active') continue;
    if (entry.from.paragraph === paragraphIndex) {
      connected.add(entry.to.paragraph);
    } else if (entry.to.paragraph === paragraphIndex) {
      connected.add(entry.from.paragraph);
    }
  }
  connected.delete(paragraphIndex); // Don't include self
  return connected;
}

/**
 * Find all sentence-level connections involving a specific sentence.
 * Returns connection entries where either endpoint matches (paragraphIndex, sentenceIndex).
 */
function findConnectedSentences(
  profile: Readonly<EssayProfile>,
  paragraphIndex: number,
  sentenceIndex: number,
): typeof profile.index.connectionGraph {
  return profile.index.connectionGraph.filter(
    (entry) =>
      entry.status === 'active' &&
      ((entry.from.paragraph === paragraphIndex && entry.from.sentence === sentenceIndex) ||
      (entry.to.paragraph === paragraphIndex && entry.to.sentence === sentenceIndex)),
  );
}

/**
 * Get full connection objects for connections involving a paragraph.
 */
function getConnectionsForParagraph(
  profile: Readonly<EssayProfile>,
  paragraphIndex: number,
): Connection[] {
  return profile.connections.all.filter(
    (conn) => conn.status === 'active' && (conn.from.paragraph === paragraphIndex || conn.to.paragraph === paragraphIndex),
  );
}

/**
 * Tag-based lookup: scan ProfileIndex paragraph digests for matching tags.
 * Returns matching paragraph indices and sentence indices.
 */
function findByTags(
  profile: Readonly<EssayProfile>,
  searchTags: string[],
): Array<{ paragraphIndex: number; sentenceIndices: number[] }> {
  const results: Array<{ paragraphIndex: number; sentenceIndices: number[] }> = [];
  const lowerTags = searchTags.map((t) => t.toLowerCase());

  for (const digest of profile.index.paragraphDigest) {
    const matchingTags = digest.tags.filter((tag) =>
      lowerTags.some((st) => tag.toLowerCase().includes(st)),
    );

    if (matchingTags.length > 0) {
      // Find which sentences in this paragraph match
      const para = profile.paragraphs[digest.index];
      if (!para) continue;

      const sentenceIndices: number[] = [];
      for (const sentence of para.sentences) {
        if (!sentence.understanding) continue;
        const hasSentenceTagMatch = sentence.understanding.tags.some((tag) =>
          lowerTags.some((st) => tag.toLowerCase().includes(st)),
        );
        if (hasSentenceTagMatch) {
          sentenceIndices.push(sentence.index);
        }
      }

      results.push({
        paragraphIndex: digest.index,
        sentenceIndices: sentenceIndices.length > 0
          ? sentenceIndices
          : para.sentences.map((s) => s.index), // If no sentence-level match, include all
      });
    }
  }

  return results;
}

/**
 * Get scout leads for a specific paragraph from the connections store.
 * Scout leads are low-confidence connections discovered by L2.5.
 */
function getScoutLeadsForParagraph(
  profile: Readonly<EssayProfile>,
  paragraphIndex: number,
): Connection[] {
  return profile.connections.all.filter(
    (conn) =>
      conn.status === 'active' &&
      conn.discoveredBy === 'scout' &&
      conn.strengthCategory === 'tentative' &&
      (conn.from.paragraph === paragraphIndex || conn.to.paragraph === paragraphIndex),
  );
}

// ============================================================================
// PROFILE ROUTER
// ============================================================================

export class ProfileRouter {
  private relevanceTracker: ContextRelevanceTracker;

  constructor() {
    this.relevanceTracker = new InMemoryRelevanceTracker();
  }

  /**
   * Assemble context for an LLM call based on the routing rule.
   *
   * Connection-driven routing is PRIMARY: check connectionGraph for semantic links.
   * Proximity is FALLBACK: adjacent paragraphs get lighter context.
   */
  assembleContext(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): AssembledProfileContext {
    // W8.1: Compute adaptive overlay from task context + profile state
    const overlay = computeAdaptiveOverlay(profile, request);

    // W8.2: Compute effective token budget (per-rule base + density scaling + overlay override)
    // Caller-specified budget takes precedence over computed budget
    const computedBudget = computeTokenBudget(request.rule, profile, overlay);
    const budget = request.tokenBudget ?? computedBudget;

    // W8.3: Get task-specific priority weights for section ordering/truncation
    const taskPriorities = getTaskPriorities(request.rule);

    let sections: ProfileSection[];

    switch (request.rule) {
      case 'l3_understanding_walk':
        sections = this.assembleL3UnderstandingWalk(profile, request);
        break;
      case 'l3_5_analysis_pass':
        sections = this.assembleL35AnalysisPass(profile, request);
        break;
      case 'l3_75_holistic_synthesis':
        sections = this.assembleL375HolisticSynthesis(profile);
        break;
      case 'l3_75_synthesis_iteration':
        sections = this.assembleL375SynthesisIteration(profile);
        break;
      case 'l4_crystallization':
        sections = this.assembleL4Crystallization(profile);
        break;
      case 'l5_feedback_annotations':
        sections = this.assembleL5FeedbackAnnotations(profile);
        break;
      case 'l6_coaching_voice':
        sections = this.assembleL6CoachingVoice(profile, request);
        break;
      case 'l6_coaching_paragraph':
        sections = this.assembleL6CoachingParagraph(profile, request);
        break;
      case 'l6_coaching_overview':
        sections = this.assembleL6CoachingOverview(profile);
        break;
      case 'inline_edit_sentence':
        sections = this.assembleInlineEditSentence(profile, request);
        break;
      case 'reanalysis_comprehensive':
        sections = this.assembleReanalysisComprehensive(profile, request);
        break;
      case 'focused_understanding':
        sections = this.assembleFocusedUnderstanding(profile, request);
        break;
      case 'focused_analysis':
        sections = this.assembleFocusedAnalysis(profile, request);
        break;
      case 'impact_classification':
        sections = this.assembleImpactClassification(profile, request);
        break;
      case 'deep_dive':
        sections = this.assembleDeepDive(profile, request);
        break;
      case 'full_context_reread':
        sections = this.assembleFullContextReread(profile, request);
        break;
      default: {
        const _exhaustive: never = request.rule;
        throw new Error(`Unknown routing rule: ${_exhaustive}`);
      }
    }

    // W8.1: Apply overlay — add additional sections from profile if not already present
    sections = this.applyAdaptiveOverlay(sections, profile, overlay);

    // W8.1: Promote priority sections from overlay (boost their priority tier)
    sections = this.applyOverlayPriorityPromotions(sections, overlay);

    // ReadingStrategy-aware context ordering: if contextPriorities are provided,
    // reorder sections so the most important ones come first (cache efficiency).
    if (request.contextPriorities && request.contextPriorities.length > 0) {
      sections = this.applyContextPriorityOrdering(sections, request.contextPriorities);
    }

    // Apply token budget with task-priority-aware ordering (W8.3)
    const result = this.applyTokenBudget(sections, budget, request.rule, taskPriorities);

    // Track what was assembled (bookkeeping — Rule 6)
    this.relevanceTracker.recordAssembly({
      source: request.rule,
      sectionsProvided: result.sections.map(s => s.name),
      totalTokens: result.estimatedTokens,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ROUTING RULE IMPLEMENTATIONS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Rule 1: L3 understanding walk for paragraph P
   *
   * ALWAYS: ProfileIndex + holistic understanding (incremental so far) + scout leads for P
   * CONNECTION-DRIVEN: FULL understanding for paragraphs connected to P (from connectionGraph)
   * PROXIMITY: P(N-1) and P(N-2) full understanding (2-paragraph sliding window)
   * FALLBACK: earlier paragraphs get digests only
   * NEVER: analysis (understanding-only layer), future paragraphs
   */
  private assembleL3UnderstandingWalk(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const pIdx = request.paragraphIndex ?? 0;
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Holistic understanding (incremental so far — what's been built during the walk)
    const holisticContext = {
      voiceIdentity: profile.voiceIdentity,
      emotionalTopography: profile.emotionalTopography,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
      characterRevelation: profile.characterRevelation,
    };
    sections.push({
      name: 'holisticUnderstanding',
      content: holisticContext,
      tokenEstimate: estimateTokens(holisticContext),
      priority: 'always',
    });

    // ALWAYS: Scout leads for this paragraph
    const scoutLeads = getScoutLeadsForParagraph(profile, pIdx);
    if (scoutLeads.length > 0) {
      sections.push({
        name: `scoutLeads_P${pIdx}`,
        content: scoutLeads,
        tokenEstimate: estimateTokens(scoutLeads),
        priority: 'always',
      });
    }

    // CONNECTION-DRIVEN: Full understanding for connected paragraphs
    const connectedParas = findConnectedParagraphs(profile, pIdx);
    for (const connIdx of connectedParas) {
      if (connIdx >= pIdx) continue; // Never include future paragraphs
      const para = profile.paragraphs[connIdx];
      if (!para?.understanding) continue;

      sections.push({
        name: `connectedParagraph_P${connIdx}_understanding`,
        content: {
          index: connIdx,
          understanding: para.understanding,
          sentences: para.sentences
            .filter((s) => s.understanding)
            .map((s) => ({ index: s.index, understanding: s.understanding })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[connIdx] ?? estimateTokens(para.understanding),
        priority: 'connection_driven',
      });
    }

    // PROXIMITY: P(N-1) and P(N-2) full understanding (if not already included as connection-driven)
    // Two-paragraph sliding window: during the walk, the connection graph is still being
    // built — we don't yet know what connects to the current paragraph. A wider proximity
    // window lets the LLM discover deep connections (e.g., P1→P3 returning themes) that
    // the connection graph can't signal yet and scout leads may have missed.
    const proximityWindow = [pIdx - 1, pIdx - 2];
    for (const proxIdx of proximityWindow) {
      if (proxIdx < 0 || connectedParas.has(proxIdx)) continue;
      const proxPara = profile.paragraphs[proxIdx];
      if (proxPara?.understanding) {
        sections.push({
          name: `proximity_P${proxIdx}_understanding`,
          content: {
            index: proxIdx,
            understanding: proxPara.understanding,
            sentences: proxPara.sentences
              .filter((s) => s.understanding)
              .map((s) => ({ index: s.index, understanding: s.understanding })),
          },
          tokenEstimate: profile.index.sectionTokenCounts.paragraphs[proxIdx] ?? estimateTokens(proxPara.understanding),
          priority: 'proximity',
        });
      }
    }

    // FALLBACK: Earlier paragraphs get digests only
    const earliestProximity = Math.max(0, pIdx - 2);
    for (let i = 0; i < earliestProximity; i++) {
      if (connectedParas.has(i)) continue; // Already included as full
      const para = profile.paragraphs[i];
      if (!para) continue;

      sections.push({
        name: `digest_P${i}`,
        content: buildParagraphDigest(para),
        tokenEstimate: estimateTokens(buildParagraphDigest(para)),
        priority: 'nice_to_have',
      });
    }

    return sections;
  }

  /**
   * Rule 2: L3.5 analysis for paragraph P
   *
   * ALWAYS: ProfileIndex + FULL understanding profile (ALL paragraphs)
   * NEVER: prior analysis (fresh evaluation)
   * Understanding is prompt-cached across parallel calls.
   */
  private assembleL35AnalysisPass(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Full holistic understanding
    const holisticFull = {
      voiceIdentity: profile.voiceIdentity,
      voiceMap: profile.voiceMap,
      emotionalTopography: profile.emotionalTopography,
      momentEarnednessMap: profile.momentEarnednessMap,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
      characterRevelation: profile.characterRevelation,
      craftAssessment: profile.craftAssessment,
      entanglements: profile.entanglements,
      admissionsPositioning: profile.admissionsPositioning,
    };
    sections.push({
      name: 'holisticUnderstanding',
      content: holisticFull,
      tokenEstimate: estimateTokens(holisticFull),
      priority: 'always',
    });

    // ALWAYS: Full understanding for ALL paragraphs (prompt-cached across parallel calls)
    for (const para of profile.paragraphs) {
      if (!para.understanding) continue;

      sections.push({
        name: `paragraph_P${para.index}_understanding`,
        content: {
          index: para.index,
          understanding: para.understanding,
          sentences: para.sentences
            .filter((s) => s.understanding)
            .map((s) => ({ index: s.index, understanding: s.understanding })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[para.index] ?? estimateTokens(para),
        priority: 'always',
      });
    }

    // ALWAYS: Connections (understanding layer — needed for context)
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokenCounts.connections,
      priority: 'always',
    });

    // NEVER: analysis — fresh evaluation, no prior analysis included

    return sections;
  }

  /**
   * Rule 3: L3.75 holistic synthesis
   *
   * ALWAYS: ProfileIndex + all paragraph understanding + all connections +
   *         walk's holisticEvolution + scout leads
   */
  private assembleL375HolisticSynthesis(
    profile: Readonly<EssayProfile>,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: All paragraph understanding
    for (const para of profile.paragraphs) {
      sections.push({
        name: `paragraph_P${para.index}_full`,
        content: {
          index: para.index,
          text: para.text,
          understanding: para.understanding,
          sentences: para.sentences.map((s) => ({
            index: s.index,
            text: s.text,
            understanding: s.understanding,
          })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[para.index] ?? estimateTokens(para),
        priority: 'always',
      });
    }

    // ALWAYS: All connections
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokenCounts.connections,
      priority: 'always',
    });

    // ALWAYS: ALL populated holistic sections (L3.75 needs the full accumulated
    // holistic observations to synthesize — not just the 3 the walk tracked)
    const holisticFields = [
      { name: 'voiceIdentity', data: profile.voiceIdentity },
      { name: 'voiceMap', data: profile.voiceMap },
      { name: 'emotionalTopography', data: profile.emotionalTopography },
      { name: 'momentEarnednessMap', data: profile.momentEarnednessMap },
      { name: 'thematicArchitecture', data: profile.thematicArchitecture },
      { name: 'narrativeStrategy', data: profile.narrativeStrategy },
      { name: 'characterRevelation', data: profile.characterRevelation },
      { name: 'craftAssessment', data: profile.craftAssessment },
      { name: 'admissionsPositioning', data: profile.admissionsPositioning },
    ] as const;

    for (const { name, data } of holisticFields) {
      if (data) {
        sections.push({
          name: `holistic_evolution_${name}`,
          content: data,
          tokenEstimate: estimateTokens(data),
          priority: 'always',
        });
      }
    }

    // ALWAYS: Entanglements (separate because it's an array, not a section object)
    if (profile.entanglements && profile.entanglements.length > 0) {
      sections.push({
        name: 'holistic_evolution_entanglements',
        content: profile.entanglements,
        tokenEstimate: estimateTokens(profile.entanglements),
        priority: 'always',
      });
    }

    // NICE_TO_HAVE: North Star summary if available from prior analysis round
    if (profile.northStar?.throughLineMap || profile.index.northStarSummary) {
      sections.push({
        name: 'northStarSummary',
        content: profile.index.northStarSummary ?? {
          throughLineSummary: null,
          structuralRoles: [],
          maturity: 'initial' as const,
        },
        tokenEstimate: estimateTokens(profile.index.northStarSummary ?? {}),
        priority: 'nice_to_have',
      });
    }

    // ALWAYS: Scout leads (all — for holistic connection verification)
    const allScoutLeads = profile.connections.all.filter(
      (c) => c.status === 'active' && c.discoveredBy === 'scout' && c.strengthCategory === 'tentative',
    );
    if (allScoutLeads.length > 0) {
      sections.push({
        name: 'scoutLeads_all',
        content: allScoutLeads,
        tokenEstimate: estimateTokens(allScoutLeads),
        priority: 'always',
      });
    }

    return sections;
  }

  /**
   * Rule 4: L4 crystallization
   *
   * ALWAYS: ProfileIndex + holistic understanding + analysis
   * INCLUDE: paragraph digests + strength/weakness map
   * EXCLUDE: full sentence maps (too much detail)
   */
  private assembleL4Crystallization(
    profile: Readonly<EssayProfile>,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Full holistic understanding + analysis
    const holisticFull = {
      voiceIdentity: profile.voiceIdentity,
      voiceMap: profile.voiceMap,
      emotionalTopography: profile.emotionalTopography,
      momentEarnednessMap: profile.momentEarnednessMap,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
      characterRevelation: profile.characterRevelation,
      craftAssessment: profile.craftAssessment,
      entanglements: profile.entanglements,
      admissionsPositioning: profile.admissionsPositioning,
    };
    sections.push({
      name: 'holisticFull',
      content: holisticFull,
      tokenEstimate: estimateTokens(holisticFull),
      priority: 'always',
    });

    // INCLUDE: Paragraph digests (not full sentence maps)
    const paragraphDigests = profile.paragraphs.map((p) => ({
      index: p.index,
      role: p.understanding?.role ?? null,
      function: p.understanding?.function ?? null,
      effectiveness: p.analysis?.effectiveness ?? null,
      verdict: p.analysis?.verdict ?? null,
      tags: p.tags,
      strengthSignatures: p.analysis?.strengthSignatures ?? [],
      growthEdges: p.analysis?.growthEdges ?? [],
    }));
    sections.push({
      name: 'paragraphDigests',
      content: paragraphDigests,
      tokenEstimate: estimateTokens(paragraphDigests),
      priority: 'always',
    });

    // INCLUDE: Connections for structural understanding
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokenCounts.connections,
      priority: 'nice_to_have',
    });

    // EXCLUDE: full sentence maps

    return sections;
  }

  /**
   * Rule 5: L5 feedback/annotations
   *
   * ALWAYS: ProfileIndex + holistic understanding + analysis +
   *         all paragraph understanding + analysis (full context)
   */
  private assembleL5FeedbackAnnotations(
    profile: Readonly<EssayProfile>,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Full holistic understanding + analysis
    const holisticFull = {
      voiceIdentity: profile.voiceIdentity,
      voiceMap: profile.voiceMap,
      emotionalTopography: profile.emotionalTopography,
      momentEarnednessMap: profile.momentEarnednessMap,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
      characterRevelation: profile.characterRevelation,
      craftAssessment: profile.craftAssessment,
      entanglements: profile.entanglements,
      admissionsPositioning: profile.admissionsPositioning,
    };
    sections.push({
      name: 'holisticFull',
      content: holisticFull,
      tokenEstimate: estimateTokens(holisticFull),
      priority: 'always',
    });

    // ALWAYS: North Star
    sections.push({
      name: 'northStar',
      content: profile.northStar,
      tokenEstimate: profile.index.sectionTokenCounts.northStar,
      priority: 'always',
    });

    // ALWAYS: All paragraph understanding + analysis
    for (const para of profile.paragraphs) {
      sections.push({
        name: `paragraph_P${para.index}_full`,
        content: {
          index: para.index,
          understanding: para.understanding,
          analysis: para.analysis,
          sentences: para.sentences.map((s) => ({
            index: s.index,
            understanding: s.understanding,
            analysis: s.analysis,
          })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[para.index] ?? estimateTokens(para),
        priority: 'always',
      });
    }

    // ALWAYS: Connections
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokenCounts.connections,
      priority: 'always',
    });

    return sections;
  }

  /**
   * Rule 6: L6 coaching — voice question
   *
   * ALWAYS: ProfileIndex + voiceIdentity + voiceMap
   * TARGETED: understanding+analysis for voice-tagged sentences ONLY
   * Target: ~400-600 tokens
   */
  private assembleL6CoachingVoice(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: VoiceIdentity + VoiceMap
    sections.push({
      name: 'voiceIdentity',
      content: profile.voiceIdentity,
      tokenEstimate: profile.index.sectionTokenCounts.voiceIdentity,
      priority: 'always',
    });

    sections.push({
      name: 'voiceMap',
      content: profile.voiceMap,
      tokenEstimate: profile.index.sectionTokenCounts.voiceMap,
      priority: 'always',
    });

    // TARGETED: voice-tagged sentences + their understanding/analysis
    // Use searchTags if provided, otherwise search for 'voice' tag
    const voiceTags = request.searchTags?.length ? request.searchTags : ['voice'];
    const tagMatches = findByTags(profile, voiceTags);

    for (const match of tagMatches) {
      const para = profile.paragraphs[match.paragraphIndex];
      if (!para) continue;

      const targetSentences = para.sentences.filter((s) =>
        match.sentenceIndices.includes(s.index),
      );

      if (targetSentences.length > 0) {
        sections.push({
          name: `voiceTagged_P${match.paragraphIndex}`,
          content: {
            paragraphIndex: match.paragraphIndex,
            sentences: targetSentences.map((s) => ({
              index: s.index,
              text: s.text,
              understanding: s.understanding,
              analysis: s.analysis,
            })),
          },
          tokenEstimate: estimateTokens(targetSentences),
          priority: 'connection_driven',
        });
      }
    }

    return sections;
  }

  /**
   * Rule 7: L6 coaching — specific paragraph question
   *
   * ALWAYS: ProfileIndex + that paragraph's full understanding + analysis
   * CONNECTION-DRIVEN: connected sentences' full detail
   * PROXIMITY: adjacent digests
   */
  private assembleL6CoachingParagraph(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const pIdx = request.paragraphIndex ?? 0;
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Target paragraph's full understanding + analysis
    const targetPara = profile.paragraphs[pIdx];
    if (targetPara) {
      sections.push({
        name: `paragraph_P${pIdx}_full`,
        content: {
          index: targetPara.index,
          text: targetPara.text,
          understanding: targetPara.understanding,
          analysis: targetPara.analysis,
          sentences: targetPara.sentences.map((s) => ({
            index: s.index,
            text: s.text,
            understanding: s.understanding,
            analysis: s.analysis,
          })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[pIdx] ?? estimateTokens(targetPara),
        priority: 'always',
      });
    }

    // If searchTags provided, also find tag-matched content
    if (request.searchTags?.length) {
      const tagMatches = findByTags(profile, request.searchTags);
      for (const match of tagMatches) {
        if (match.paragraphIndex === pIdx) continue; // Already included
        const para = profile.paragraphs[match.paragraphIndex];
        if (!para) continue;

        const targetSentences = para.sentences.filter((s) =>
          match.sentenceIndices.includes(s.index),
        );
        sections.push({
          name: `tagMatch_P${match.paragraphIndex}`,
          content: {
            paragraphIndex: match.paragraphIndex,
            sentences: targetSentences.map((s) => ({
              index: s.index,
              text: s.text,
              understanding: s.understanding,
              analysis: s.analysis,
            })),
          },
          tokenEstimate: estimateTokens(targetSentences),
          priority: 'connection_driven',
        });
      }
    }

    // HOLISTIC CONTEXT: compact voice, thematic, and through-line context
    // Enough for the coach to connect paragraph-level observations to essay-wide patterns.

    // Compact voice identity — just enough for the coach to reference voice patterns
    // Only add voiceContext if there's actual content
    if (profile.voiceIdentity.signature || profile.voiceIdentity.distinctivePatterns.length > 0) {
      sections.push({
        name: 'voiceContext',
        content: {
          signature: profile.voiceIdentity.signature,
          register: profile.voiceMap.register.baseline,
          distinctivePatterns: profile.voiceIdentity.distinctivePatterns,
        },
        tokenEstimate: estimateTokens(profile.voiceIdentity.signature) + 50,
        priority: 'always',
      });
    }

    // Compact thematic architecture — thesis + threads without full evidence arrays
    // Only add thematicContext if there are threads
    if (profile.thematicArchitecture.centralThesis || profile.thematicArchitecture.threads.length > 0) {
      sections.push({
        name: 'thematicContext',
        content: {
          centralThesis: profile.thematicArchitecture.centralThesis,
          thesisConfidence: profile.thematicArchitecture.thesisConfidence,
          threads: profile.thematicArchitecture.threads.map(t => ({
            thread: t.thread,
            strength: t.strength,
          })),
        },
        tokenEstimate: estimateTokens(profile.thematicArchitecture.centralThesis) + 80,
        priority: 'always',
      });
    }

    // North Star through-line — only if present (personal statements only)
    if (profile.northStar.throughLineMap) {
      sections.push({
        name: 'throughLineContext',
        content: {
          centralElement: profile.northStar.throughLineMap.centralElement,
          transformation: profile.northStar.throughLineMap.transformation,
        },
        tokenEstimate: 80,
        priority: 'always',
      });
    }

    // Structural role for this paragraph — what it IS in the essay's architecture
    const relevantRoles = profile.northStar.structuralRolesMap
      ?.filter(r => r.paragraphs.includes(pIdx));
    if (relevantRoles && relevantRoles.length > 0) {
      sections.push({
        name: 'structuralContext',
        content: relevantRoles.map(r => ({ role: r.role, weight: r.weight })),
        tokenEstimate: estimateTokens(relevantRoles) + 20,
        priority: 'always',
      });
    }

    // CONNECTION-DRIVEN: connected paragraphs' full understanding + analysis for connected sentences
    const connectedParas = findConnectedParagraphs(profile, pIdx);
    for (const connIdx of connectedParas) {
      const para = profile.paragraphs[connIdx];
      if (!para) continue;

      // Find which specific sentences are connected to target paragraph
      const connectedSentenceIndices = new Set<number>();
      for (const conn of profile.connections.all) {
        if (conn.status !== 'active') continue;
        if (conn.from.paragraph === pIdx && conn.to.paragraph === connIdx) {
          if (conn.to.sentence !== undefined) connectedSentenceIndices.add(conn.to.sentence);
        } else if (conn.to.paragraph === pIdx && conn.from.paragraph === connIdx) {
          if (conn.from.sentence !== undefined) connectedSentenceIndices.add(conn.from.sentence);
        }
      }

      const connectedSentences = para.sentences.filter((s) =>
        connectedSentenceIndices.has(s.index),
      );

      if (connectedSentences.length > 0) {
        sections.push({
          name: `connected_P${connIdx}_sentences`,
          content: {
            paragraphIndex: connIdx,
            sentences: connectedSentences.map((s) => ({
              index: s.index,
              text: s.text,
              understanding: s.understanding,
              analysis: s.analysis,
            })),
          },
          tokenEstimate: estimateTokens(connectedSentences),
          priority: 'connection_driven',
        });
      }
    }

    // PROXIMITY: adjacent paragraph digests
    for (const adjIdx of [pIdx - 1, pIdx + 1]) {
      if (adjIdx < 0 || adjIdx >= profile.paragraphs.length) continue;
      if (connectedParas.has(adjIdx)) continue; // Already included as connection-driven
      const adjPara = profile.paragraphs[adjIdx];
      if (!adjPara) continue;

      sections.push({
        name: `adjacent_P${adjIdx}_digest`,
        content: buildParagraphDigest(adjPara),
        tokenEstimate: estimateTokens(buildParagraphDigest(adjPara)),
        priority: 'proximity',
      });
    }

    return sections;
  }

  /**
   * Rule 8: L6 coaching — overview question
   *
   * ALWAYS: ProfileIndex + all holistic sections
   * EXCLUDE: paragraph details (digests only)
   */
  private assembleL6CoachingOverview(
    profile: Readonly<EssayProfile>,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: All holistic sections
    const holisticFull = {
      voiceIdentity: profile.voiceIdentity,
      voiceMap: profile.voiceMap,
      emotionalTopography: profile.emotionalTopography,
      momentEarnednessMap: profile.momentEarnednessMap,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
      characterRevelation: profile.characterRevelation,
      craftAssessment: profile.craftAssessment,
      entanglements: profile.entanglements,
      admissionsPositioning: profile.admissionsPositioning,
    };
    sections.push({
      name: 'holisticFull',
      content: holisticFull,
      tokenEstimate: estimateTokens(holisticFull),
      priority: 'always',
    });

    // ALWAYS: North Star
    sections.push({
      name: 'northStar',
      content: profile.northStar,
      tokenEstimate: profile.index.sectionTokenCounts.northStar,
      priority: 'always',
    });

    // Paragraph digests only (not full details)
    const digests = profile.paragraphs.map((p) => buildParagraphDigest(p));
    sections.push({
      name: 'paragraphDigests',
      content: digests,
      tokenEstimate: estimateTokens(digests),
      priority: 'nice_to_have',
    });

    return sections;
  }

  /**
   * Rule 9: Inline edit — specific sentence
   *
   * ALWAYS: ProfileIndex + sentence understanding + analysis +
   *         connected sentences + paragraph craft profile
   */
  private assembleInlineEditSentence(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const pIdx = request.paragraphIndex ?? 0;
    const sIdx = request.sentenceIndex ?? 0;
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Target sentence understanding + analysis
    const para = profile.paragraphs[pIdx];
    const sentence = para?.sentences[sIdx];
    if (sentence) {
      sections.push({
        name: `sentence_P${pIdx}S${sIdx}`,
        content: {
          paragraphIndex: pIdx,
          sentenceIndex: sIdx,
          text: sentence.text,
          understanding: sentence.understanding,
          analysis: sentence.analysis,
        },
        tokenEstimate: estimateTokens(sentence),
        priority: 'always',
      });
    }

    // ALWAYS: Paragraph craft profile
    if (para?.understanding?.craftProfile) {
      sections.push({
        name: `paragraph_P${pIdx}_craft`,
        content: {
          paragraphIndex: pIdx,
          craftProfile: para.understanding.craftProfile,
          role: para.understanding.role,
        },
        tokenEstimate: estimateTokens(para.understanding.craftProfile),
        priority: 'always',
      });
    }

    // CONNECTION-DRIVEN: All sentences connected to this sentence
    const connectedEntries = findConnectedSentences(profile, pIdx, sIdx);
    for (const entry of connectedEntries) {
      const otherLoc = entry.from.paragraph === pIdx && entry.from.sentence === sIdx
        ? entry.to
        : entry.from;
      const otherPara = profile.paragraphs[otherLoc.paragraph];
      const otherSentence = otherLoc.sentence !== undefined ? otherPara?.sentences[otherLoc.sentence] : undefined;
      if (!otherSentence) continue;

      sections.push({
        name: `connected_P${otherLoc.paragraph}S${otherLoc.sentence}`,
        content: {
          paragraphIndex: otherLoc.paragraph,
          sentenceIndex: otherLoc.sentence,
          text: otherSentence.text,
          understanding: otherSentence.understanding,
          analysis: otherSentence.analysis,
        },
        tokenEstimate: estimateTokens(otherSentence),
        priority: 'connection_driven',
      });
    }

    return sections;
  }

  /**
   * Rule 10: Re-analysis (comprehensive)
   *
   * ALWAYS: ProfileIndex + changed paragraph full + connected paragraphs full +
   *         adjacent digests
   */
  private assembleReanalysisComprehensive(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const pIdx = request.paragraphIndex ?? 0;
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Changed paragraph full (understanding + analysis + sentences)
    const changedPara = profile.paragraphs[pIdx];
    if (changedPara) {
      sections.push({
        name: `paragraph_P${pIdx}_full`,
        content: {
          index: changedPara.index,
          text: changedPara.text,
          understanding: changedPara.understanding,
          analysis: changedPara.analysis,
          sentences: changedPara.sentences.map((s) => ({
            index: s.index,
            text: s.text,
            understanding: s.understanding,
            analysis: s.analysis,
          })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[pIdx] ?? estimateTokens(changedPara),
        priority: 'always',
      });
    }

    // ALWAYS: Holistic context
    const holisticContext = {
      voiceIdentity: profile.voiceIdentity,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
    };
    sections.push({
      name: 'holisticContext',
      content: holisticContext,
      tokenEstimate: estimateTokens(holisticContext),
      priority: 'always',
    });

    // CONNECTION-DRIVEN: Connected paragraphs full
    const connectedParas = findConnectedParagraphs(profile, pIdx);
    for (const connIdx of connectedParas) {
      const para = profile.paragraphs[connIdx];
      if (!para) continue;

      sections.push({
        name: `connected_P${connIdx}_full`,
        content: {
          index: para.index,
          text: para.text,
          understanding: para.understanding,
          analysis: para.analysis,
          sentences: para.sentences.map((s) => ({
            index: s.index,
            text: s.text,
            understanding: s.understanding,
            analysis: s.analysis,
          })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[connIdx] ?? estimateTokens(para),
        priority: 'connection_driven',
      });
    }

    // PROXIMITY: Adjacent paragraph digests
    for (const adjIdx of [pIdx - 1, pIdx + 1]) {
      if (adjIdx < 0 || adjIdx >= profile.paragraphs.length) continue;
      if (connectedParas.has(adjIdx)) continue;
      const adjPara = profile.paragraphs[adjIdx];
      if (!adjPara) continue;

      sections.push({
        name: `adjacent_P${adjIdx}_digest`,
        content: buildParagraphDigest(adjPara),
        tokenEstimate: estimateTokens(buildParagraphDigest(adjPara)),
        priority: 'proximity',
      });
    }

    return sections;
  }

  /**
   * Rule 11: Focused understanding — specific sentence
   *
   * ALWAYS: ProfileIndex + sentence understanding + connected sentences' understanding +
   *         paragraph understanding
   */
  private assembleFocusedUnderstanding(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const pIdx = request.paragraphIndex ?? 0;
    const sIdx = request.sentenceIndex ?? 0;
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Target sentence understanding
    const para = profile.paragraphs[pIdx];
    const sentence = para?.sentences[sIdx];
    if (sentence?.understanding) {
      sections.push({
        name: `sentence_P${pIdx}S${sIdx}_understanding`,
        content: {
          paragraphIndex: pIdx,
          sentenceIndex: sIdx,
          text: sentence.text,
          understanding: sentence.understanding,
        },
        tokenEstimate: estimateTokens(sentence.understanding),
        priority: 'always',
      });
    }

    // ALWAYS: Paragraph understanding
    if (para?.understanding) {
      sections.push({
        name: `paragraph_P${pIdx}_understanding`,
        content: {
          index: pIdx,
          understanding: para.understanding,
        },
        tokenEstimate: estimateTokens(para.understanding),
        priority: 'always',
      });
    }

    // CONNECTION-DRIVEN: Connected sentences' understanding
    const connectedEntries = findConnectedSentences(profile, pIdx, sIdx);
    for (const entry of connectedEntries) {
      const otherLoc = entry.from.paragraph === pIdx && entry.from.sentence === sIdx
        ? entry.to
        : entry.from;
      const otherPara = profile.paragraphs[otherLoc.paragraph];
      const otherSentence = otherLoc.sentence !== undefined ? otherPara?.sentences[otherLoc.sentence] : undefined;
      if (!otherSentence?.understanding) continue;

      sections.push({
        name: `connected_P${otherLoc.paragraph}S${otherLoc.sentence}_understanding`,
        content: {
          paragraphIndex: otherLoc.paragraph,
          sentenceIndex: otherLoc.sentence,
          text: otherSentence.text,
          understanding: otherSentence.understanding,
        },
        tokenEstimate: estimateTokens(otherSentence.understanding),
        priority: 'connection_driven',
      });
    }

    // PROXIMITY: Paragraph-level holistic voice/craft context
    const voiceCraftContext = {
      voiceIdentity: profile.voiceIdentity,
      craftAssessment: profile.craftAssessment,
    };
    sections.push({
      name: 'voiceCraftContext',
      content: voiceCraftContext,
      tokenEstimate: estimateTokens(voiceCraftContext),
      priority: 'proximity',
    });

    return sections;
  }

  /**
   * Rule 12: Focused analysis — specific sentence
   *
   * ALWAYS: ProfileIndex + sentence updated understanding + previous analysis +
   *         connected sentences' analysis + paragraph analysis
   */
  private assembleFocusedAnalysis(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const pIdx = request.paragraphIndex ?? 0;
    const sIdx = request.sentenceIndex ?? 0;
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Target sentence understanding (updated) + previous analysis
    const para = profile.paragraphs[pIdx];
    const sentence = para?.sentences[sIdx];
    if (sentence) {
      sections.push({
        name: `sentence_P${pIdx}S${sIdx}_full`,
        content: {
          paragraphIndex: pIdx,
          sentenceIndex: sIdx,
          text: sentence.text,
          understanding: sentence.understanding,
          analysis: sentence.analysis,
        },
        tokenEstimate: estimateTokens(sentence),
        priority: 'always',
      });
    }

    // ALWAYS: Paragraph analysis
    if (para?.analysis) {
      sections.push({
        name: `paragraph_P${pIdx}_analysis`,
        content: {
          index: pIdx,
          understanding: para.understanding,
          analysis: para.analysis,
        },
        tokenEstimate: estimateTokens(para.analysis),
        priority: 'always',
      });
    }

    // CONNECTION-DRIVEN: Connected sentences' analysis
    const connectedEntries = findConnectedSentences(profile, pIdx, sIdx);
    for (const entry of connectedEntries) {
      const otherLoc = entry.from.paragraph === pIdx && entry.from.sentence === sIdx
        ? entry.to
        : entry.from;
      const otherPara = profile.paragraphs[otherLoc.paragraph];
      const otherSentence = otherLoc.sentence !== undefined ? otherPara?.sentences[otherLoc.sentence] : undefined;
      if (!otherSentence?.analysis) continue;

      sections.push({
        name: `connected_P${otherLoc.paragraph}S${otherLoc.sentence}_analysis`,
        content: {
          paragraphIndex: otherLoc.paragraph,
          sentenceIndex: otherLoc.sentence,
          text: otherSentence.text,
          understanding: otherSentence.understanding,
          analysis: otherSentence.analysis,
        },
        tokenEstimate: estimateTokens(otherSentence),
        priority: 'connection_driven',
      });
    }

    return sections;
  }

  /**
   * Rule 13: Impact classification — Haiku classifies edit impact scope.
   *
   * Intentionally light context — this is a classification call, not analysis.
   * ALWAYS: ProfileIndex + paragraph digests for changed paragraphs + staleness snapshot
   * CONNECTION-DRIVEN: Digests for paragraphs connected to changed paragraphs
   * PROXIMITY: Adjacent paragraph digests
   * SKIPPED: Full sentence maps, holistic sections (too much for classification)
   */
  private assembleImpactClassification(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];
    const changedParagraphs = request.editContext?.changedParagraphs ?? [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Paragraph digests for changed paragraphs
    for (const pIdx of changedParagraphs) {
      const para = profile.paragraphs[pIdx];
      if (para) {
        sections.push({
          name: `changed_paragraph_${pIdx}_digest`,
          content: buildParagraphDigest(para),
          tokenEstimate: estimateTokens(buildParagraphDigest(para)),
          priority: 'always',
        });
      }
    }

    // CONNECTION-DRIVEN: Digests for paragraphs connected to changed paragraphs
    const connectedParas = new Set<number>();
    for (const pIdx of changedParagraphs) {
      const connected = findConnectedParagraphs(profile, pIdx);
      for (const cp of connected) {
        if (!changedParagraphs.includes(cp)) {
          connectedParas.add(cp);
        }
      }
    }

    for (const cpIdx of connectedParas) {
      const para = profile.paragraphs[cpIdx];
      if (para) {
        sections.push({
          name: `connected_paragraph_${cpIdx}_digest`,
          content: buildParagraphDigest(para),
          tokenEstimate: estimateTokens(buildParagraphDigest(para)),
          priority: 'connection_driven',
        });
      }
    }

    // PROXIMITY: Adjacent paragraph digests
    for (const pIdx of changedParagraphs) {
      for (const adjIdx of [pIdx - 1, pIdx + 1]) {
        if (
          adjIdx >= 0 &&
          adjIdx < profile.paragraphs.length &&
          !changedParagraphs.includes(adjIdx) &&
          !connectedParas.has(adjIdx)
        ) {
          const para = profile.paragraphs[adjIdx];
          if (para) {
            sections.push({
              name: `adjacent_paragraph_${adjIdx}_digest`,
              content: buildParagraphDigest(para),
              tokenEstimate: estimateTokens(buildParagraphDigest(para)),
              priority: 'proximity',
            });
          }
        }
      }
    }

    // ALWAYS: Staleness snapshot if available
    if (request.editContext?.stalenessSnapshot) {
      sections.push({
        name: 'stalenessSnapshot',
        content: request.editContext.stalenessSnapshot,
        tokenEstimate: estimateTokens(request.editContext.stalenessSnapshot),
        priority: 'always',
      });
    }

    return sections;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // L3.75 GROWTH CYCLE ROUTING RULES
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Rule 14: L3.75 synthesis iteration N
   *
   * Context for L3.75 iteration N (needs prior synthesis + new findings).
   * This is the most expensive context assembly — L3.75 needs everything.
   *
   * ALWAYS: ProfileIndex + all paragraph understandings + all holistic sections +
   *         connections graph + finding summary
   */
  private assembleL375SynthesisIteration(
    profile: Readonly<EssayProfile>,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: All paragraph understandings (L3.75 needs full picture)
    for (const para of profile.paragraphs) {
      sections.push({
        name: `paragraph_P${para.index}_full`,
        content: {
          index: para.index,
          text: para.text,
          understanding: para.understanding,
          sentences: para.sentences.map((s) => ({
            index: s.index,
            text: s.text,
            understanding: s.understanding,
          })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[para.index] ?? estimateTokens(para),
        priority: 'always',
      });
    }

    // ALWAYS: All holistic sections (for iteration > 0, the prior synthesis is passed separately)
    const holisticFields = [
      { name: 'voiceIdentity', data: profile.voiceIdentity },
      { name: 'voiceMap', data: profile.voiceMap },
      { name: 'emotionalTopography', data: profile.emotionalTopography },
      { name: 'momentEarnednessMap', data: profile.momentEarnednessMap },
      { name: 'thematicArchitecture', data: profile.thematicArchitecture },
      { name: 'narrativeStrategy', data: profile.narrativeStrategy },
      { name: 'characterRevelation', data: profile.characterRevelation },
      { name: 'craftAssessment', data: profile.craftAssessment },
      { name: 'admissionsPositioning', data: profile.admissionsPositioning },
    ] as const;

    for (const { name, data } of holisticFields) {
      if (data) {
        sections.push({
          name: `holistic_${name}`,
          content: data,
          tokenEstimate: estimateTokens(data),
          priority: 'always',
        });
      }
    }

    // ALWAYS: Entanglements (separate because it's an array, not a section object)
    if (profile.entanglements && profile.entanglements.length > 0) {
      sections.push({
        name: 'holistic_entanglements',
        content: profile.entanglements,
        tokenEstimate: estimateTokens(profile.entanglements),
        priority: 'always',
      });
    }

    // ALWAYS: Connections graph
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokenCounts.connections,
      priority: 'always',
    });

    // ALWAYS: Finding summary (compact finding summary from ProfileIndex)
    if (profile.index.findingSummary) {
      sections.push({
        name: 'findingSummary',
        content: profile.index.findingSummary,
        tokenEstimate: estimateTokens(profile.index.findingSummary),
        priority: 'always',
      });
    }

    return sections;
  }

  /**
   * Rule 15: Deep dive prompt — context varies by prompt's requiredContext
   *
   * Only includes the sections listed in requiredContext from the prompt template.
   * ALWAYS: ProfileIndex + essay text markers
   * DYNAMIC: Only sections listed in requiredContext
   *
   * Example: if requiredContext = ['voiceIdentity', 'voiceMap', 'paragraphs'],
   * only those sections are included (plus profileIndex always).
   */
  private assembleDeepDive(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const sections: ProfileSection[] = [];
    const requiredContext = request.requiredContext ?? [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // Map of section names to profile data extractors for deep dive
    const sectionExtractors: Record<string, () => { content: unknown; tokenEstimate: number } | null> = {
      voiceIdentity: () => profile.voiceIdentity ? {
        content: profile.voiceIdentity,
        tokenEstimate: profile.index.sectionTokenCounts.voiceIdentity,
      } : null,
      voiceMap: () => profile.voiceMap ? {
        content: profile.voiceMap,
        tokenEstimate: profile.index.sectionTokenCounts.voiceMap,
      } : null,
      emotionalTopography: () => profile.emotionalTopography ? {
        content: profile.emotionalTopography,
        tokenEstimate: profile.index.sectionTokenCounts.emotionalTopography,
      } : null,
      momentEarnednessMap: () => profile.momentEarnednessMap ? {
        content: profile.momentEarnednessMap,
        tokenEstimate: estimateTokens(profile.momentEarnednessMap),
      } : null,
      thematicArchitecture: () => profile.thematicArchitecture ? {
        content: profile.thematicArchitecture,
        tokenEstimate: estimateTokens(profile.thematicArchitecture),
      } : null,
      narrativeStrategy: () => profile.narrativeStrategy ? {
        content: profile.narrativeStrategy,
        tokenEstimate: estimateTokens(profile.narrativeStrategy),
      } : null,
      characterRevelation: () => profile.characterRevelation ? {
        content: profile.characterRevelation,
        tokenEstimate: profile.index.sectionTokenCounts.characterRevelation,
      } : null,
      craftAssessment: () => profile.craftAssessment ? {
        content: profile.craftAssessment,
        tokenEstimate: profile.index.sectionTokenCounts.craftAssessment,
      } : null,
      admissionsPositioning: () => profile.admissionsPositioning ? {
        content: profile.admissionsPositioning,
        tokenEstimate: estimateTokens(profile.admissionsPositioning),
      } : null,
      entanglements: () => (profile.entanglements && profile.entanglements.length > 0) ? {
        content: profile.entanglements,
        tokenEstimate: estimateTokens(profile.entanglements),
      } : null,
      connections: () => ({
        content: profile.connections,
        tokenEstimate: profile.index.sectionTokenCounts.connections,
      }),
      northStar: () => profile.northStar ? {
        content: profile.northStar,
        tokenEstimate: profile.index.sectionTokenCounts.northStar,
      } : null,
      findingSummary: () => profile.index.findingSummary ? {
        content: profile.index.findingSummary,
        tokenEstimate: estimateTokens(profile.index.findingSummary),
      } : null,
    };

    // DYNAMIC: Include only sections listed in requiredContext
    for (const sectionName of requiredContext) {
      // Special case: 'paragraphs' means include all paragraph understandings
      if (sectionName === 'paragraphs') {
        for (const para of profile.paragraphs) {
          sections.push({
            name: `paragraph_P${para.index}_full`,
            content: {
              index: para.index,
              text: para.text,
              understanding: para.understanding,
              sentences: para.sentences.map((s) => ({
                index: s.index,
                text: s.text,
                understanding: s.understanding,
              })),
            },
            tokenEstimate: profile.index.sectionTokenCounts.paragraphs[para.index] ?? estimateTokens(para),
            priority: 'always',
          });
        }
        continue;
      }

      const extractor = sectionExtractors[sectionName];
      if (!extractor) continue;

      const extracted = extractor();
      if (!extracted) continue;

      sections.push({
        name: sectionName,
        content: extracted.content,
        tokenEstimate: extracted.tokenEstimate,
        priority: 'always',
      });
    }

    return sections;
  }

  /**
   * Rule 16: Full context re-read for a targeted paragraph
   *
   * Context for re-reading a paragraph with full essay awareness.
   * ALWAYS: ProfileIndex + target paragraph's current understanding +
   *         connections involving target paragraph + neighbor understandings (±1)
   * Essay text is passed externally (not from profile), not assembled here.
   */
  private assembleFullContextReread(
    profile: Readonly<EssayProfile>,
    request: ContextRequest,
  ): ProfileSection[] {
    const pIdx = request.paragraphIndex ?? 0;
    const sections: ProfileSection[] = [];

    // ALWAYS: ProfileIndex
    sections.push({
      name: 'profileIndex',
      content: profile.index,
      tokenEstimate: estimateTokens(profile.index),
      priority: 'always',
    });

    // ALWAYS: Target paragraph's current understanding
    const targetPara = profile.paragraphs[pIdx];
    if (targetPara) {
      sections.push({
        name: `paragraph_P${pIdx}_full`,
        content: {
          index: targetPara.index,
          text: targetPara.text,
          understanding: targetPara.understanding,
          sentences: targetPara.sentences.map((s) => ({
            index: s.index,
            text: s.text,
            understanding: s.understanding,
          })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[pIdx] ?? estimateTokens(targetPara),
        priority: 'always',
      });
    }

    // ALWAYS: Connections involving the target paragraph
    const connectionsForTarget = getConnectionsForParagraph(profile, pIdx);
    if (connectionsForTarget.length > 0) {
      sections.push({
        name: `connections_P${pIdx}`,
        content: connectionsForTarget,
        tokenEstimate: estimateTokens(connectionsForTarget),
        priority: 'always',
      });
    }

    // ALWAYS: Neighbor paragraph understandings (±1 paragraph)
    for (const neighborIdx of [pIdx - 1, pIdx + 1]) {
      if (neighborIdx < 0 || neighborIdx >= profile.paragraphs.length) continue;
      const neighborPara = profile.paragraphs[neighborIdx];
      if (!neighborPara?.understanding) continue;

      sections.push({
        name: `neighbor_P${neighborIdx}_understanding`,
        content: {
          index: neighborPara.index,
          text: neighborPara.text,
          understanding: neighborPara.understanding,
          sentences: neighborPara.sentences
            .filter((s) => s.understanding)
            .map((s) => ({ index: s.index, text: s.text, understanding: s.understanding })),
        },
        tokenEstimate: profile.index.sectionTokenCounts.paragraphs[neighborIdx] ?? estimateTokens(neighborPara),
        priority: 'proximity',
      });
    }

    return sections;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CONTEXT PRIORITY ORDERING (ReadingStrategy-aware)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Reorder sections based on ReadingStrategy contextPriorities.
   * Sections matching priorities come first (in priority order), then remaining
   * sections in their original order. This improves prompt cache hit rates by
   * placing the most important sections earliest in the context window.
   *
   * Does NOT change priority tiers — only positional ordering within the array.
   */
  private applyContextPriorityOrdering(
    sections: ProfileSection[],
    contextPriorities: string[],
  ): ProfileSection[] {
    if (contextPriorities.length === 0) return sections;

    // Build priority index map: section name → priority position (lower = more important)
    const priorityIndex = new Map<string, number>();
    for (let i = 0; i < contextPriorities.length; i++) {
      priorityIndex.set(contextPriorities[i], i);
    }

    // Partition sections into prioritized (matched by name) and non-prioritized
    const prioritized: Array<{ section: ProfileSection; order: number }> = [];
    const remaining: ProfileSection[] = [];

    for (const section of sections) {
      const matchedPriority = priorityIndex.get(section.name);
      if (matchedPriority !== undefined) {
        prioritized.push({ section, order: matchedPriority });
      } else {
        remaining.push(section);
      }
    }

    // Sort prioritized sections by their priority order (most important first)
    prioritized.sort((a, b) => a.order - b.order);

    // Prioritized sections first, then remaining in original order
    return [...prioritized.map((p) => p.section), ...remaining];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ADAPTIVE OVERLAY APPLICATION (W8.1)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Apply adaptive overlay — inject additional profile sections that the overlay
   * determined are needed but the base rule didn't include.
   * Only adds sections not already present (by name).
   */
  private applyAdaptiveOverlay(
    sections: ProfileSection[],
    profile: Readonly<EssayProfile>,
    overlay: AdaptiveOverlay,
  ): ProfileSection[] {
    if (overlay.additionalSections.length === 0) return sections;

    const existingNames = new Set(sections.map((s) => s.name));
    const result = [...sections];

    // Map of overlay section names to profile data extractors
    const sectionExtractors: Record<string, () => { content: unknown; tokenEstimate: number } | null> = {
      narrativeStrategy: () => profile.narrativeStrategy ? {
        content: profile.narrativeStrategy,
        tokenEstimate: estimateTokens(profile.narrativeStrategy),
      } : null,
      voiceIdentity: () => profile.voiceIdentity ? {
        content: profile.voiceIdentity,
        tokenEstimate: profile.index.sectionTokenCounts.voiceIdentity,
      } : null,
      voiceMap: () => profile.voiceMap ? {
        content: profile.voiceMap,
        tokenEstimate: profile.index.sectionTokenCounts.voiceMap,
      } : null,
      emotionalTopography: () => profile.emotionalTopography ? {
        content: profile.emotionalTopography,
        tokenEstimate: profile.index.sectionTokenCounts.emotionalTopography,
      } : null,
      thematicArchitecture: () => profile.thematicArchitecture ? {
        content: profile.thematicArchitecture,
        tokenEstimate: estimateTokens(profile.thematicArchitecture),
      } : null,
      characterRevelation: () => profile.characterRevelation ? {
        content: profile.characterRevelation,
        tokenEstimate: profile.index.sectionTokenCounts.characterRevelation,
      } : null,
      craftAssessment: () => profile.craftAssessment ? {
        content: profile.craftAssessment,
        tokenEstimate: profile.index.sectionTokenCounts.craftAssessment,
      } : null,
      northStar: () => profile.northStar ? {
        content: profile.northStar,
        tokenEstimate: profile.index.sectionTokenCounts.northStar,
      } : null,
    };

    for (const sectionName of overlay.additionalSections) {
      // Skip if already present (check both exact name and common aliases)
      if (existingNames.has(sectionName)) continue;
      // Also check for sections that embed this data under different names
      // e.g., 'voiceIdentity' might be in a section named 'voiceContext'
      if (sectionName === 'voiceIdentity' && existingNames.has('voiceContext')) continue;
      if (sectionName === 'narrativeStrategy' && existingNames.has('holisticUnderstanding')) continue;
      if (sectionName === 'narrativeStrategy' && existingNames.has('holisticFull')) continue;
      if (sectionName === 'voiceIdentity' && existingNames.has('holisticFull')) continue;

      const extractor = sectionExtractors[sectionName];
      if (!extractor) continue;

      const extracted = extractor();
      if (!extracted) continue;

      result.push({
        name: sectionName,
        content: extracted.content,
        tokenEstimate: extracted.tokenEstimate,
        priority: 'nice_to_have', // Overlay additions start as nice_to_have
      });
      existingNames.add(sectionName);
    }

    return result;
  }

  /**
   * Promote sections listed in the overlay's prioritySections to 'always' priority.
   * This ensures overlay-important sections survive budget enforcement.
   */
  private applyOverlayPriorityPromotions(
    sections: ProfileSection[],
    overlay: AdaptiveOverlay,
  ): ProfileSection[] {
    if (overlay.prioritySections.length === 0) return sections;

    const prioritySet = new Set(overlay.prioritySections);

    return sections.map((section) => {
      if (prioritySet.has(section.name) && section.priority !== 'always') {
        return { ...section, priority: 'always' as const };
      }
      return section;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TOKEN BUDGET ENFORCEMENT
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Apply token budget by dropping lowest-priority sections first.
   * Priority order: always > connection_driven > proximity > nice_to_have.
   * Within the same priority tier, task-specific weights (W8.3) break ties —
   * higher-weighted sections are kept, lower-weighted sections are dropped first.
   */
  private applyTokenBudget(
    sections: ProfileSection[],
    budget: number,
    rule: RoutingRule,
    taskPriorities: TaskPriorityWeights = {},
  ): AssembledProfileContext {
    const priorityOrder: Record<ProfileSection['priority'], number> = {
      always: 0,
      connection_driven: 1,
      proximity: 2,
      nice_to_have: 3,
    };

    // Warn if always-priority items alone exceed the budget
    const alwaysTokens = sections
      .filter((s) => s.priority === 'always')
      .reduce((sum, s) => sum + s.tokenEstimate, 0);

    if (alwaysTokens > budget) {
      console.warn(
        `[ProfileRouter] Always-priority items (${alwaysTokens} tokens) exceed budget ` +
        `(${budget} tokens) for ${rule}. LLM context will be larger than intended.`,
      );
    }

    // Sort by priority tier first (lowest number = highest importance),
    // then by task weight within the same tier (higher weight = more important)
    const sorted = [...sections].sort((a, b) => {
      const tierDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (tierDiff !== 0) return tierDiff;
      // Within same tier: higher task weight comes first
      const weightA = resolveTaskWeight(a.name, taskPriorities);
      const weightB = resolveTaskWeight(b.name, taskPriorities);
      return weightB - weightA; // descending — higher weight = higher priority
    });

    const included: ProfileSection[] = [];
    const dropped: string[] = [];
    let totalTokens = 0;

    for (const section of sorted) {
      if (totalTokens + section.tokenEstimate <= budget) {
        included.push(section);
        totalTokens += section.tokenEstimate;
      } else if (section.priority === 'always') {
        // Always-priority sections are never dropped
        included.push(section);
        totalTokens += section.tokenEstimate;
      } else {
        dropped.push(section.name);
      }
    }

    return {
      sections: included,
      estimatedTokens: totalTokens,
      appliedRule: rule,
      droppedSections: dropped,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // DECLARED CONTEXT ASSEMBLY (Adaptive Router)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * New entry point — declared context assembly.
   * Used by deep dives, growth cycle iterations, re-reads, and any future
   * consumer that knows what context it needs.
   *
   * Exists alongside assembleContext() — zero breaking changes.
   * All 16 existing rules continue to work unchanged.
   */
  assembleDeclared(
    profile: Readonly<EssayProfile>,
    request: DeclaredContextRequest,
  ): AssembledProfileContext {
    const sections: ProfileSection[] = [];

    // ── Step 1: Resolve required sections ──
    for (const spec of request.required) {
      const resolved = this.resolveSection(profile, spec);
      if (resolved) {
        resolved.priority = 'always';
        sections.push(resolved);
      }
    }

    // ── Step 2: Resolve desired sections ──
    for (const spec of request.desired) {
      const resolved = this.resolveSection(profile, spec);
      if (resolved) {
        resolved.priority = spec.priority ?? 'nice_to_have';
        sections.push(resolved);
      }
    }

    // ── Step 3: Apply Reading Strategy ordering ──
    if (request.readingStrategy) {
      this.applyReadingStrategyOrderingForDeclared(sections, request.readingStrategy);
    }

    // ── Step 4: Apply token budget with compression ──
    const droppedSections: string[] = [];
    const result = this.applyTokenBudgetWithCompression(
      sections,
      request.tokenBudget,
      request.purpose,
      droppedSections,
    );

    // Track assembly (bookkeeping — Rule 6)
    this.relevanceTracker.recordAssembly({
      source: `declared:${request.purpose}`,
      sectionsProvided: result.sections.map(s => s.name),
      totalTokens: result.estimatedTokens,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  /**
   * Record which sections the LLM actually used in its response.
   * Called by the caller after parsing the LLM's output.
   *
   * This enables three-layer diagnostics:
   * 1. What was provided (logged at assembly time)
   * 2. What was referenced (logged here from output scanning)
   * 3. What was missing (logged here from "I would need X" phrases)
   */
  recordContextUsage(
    source: string,
    referenced: string[],
    missing: string[],
  ): void {
    this.relevanceTracker.recordUsage(source, referenced, missing);
  }

  /**
   * Get diagnostic statistics about context usage patterns.
   *
   * Example usage:
   *   const stats = router.getContextDiagnostics();
   *   // "voiceMap provided 12 times, referenced 11 times" — high utility
   *   // "admissionsPositioning provided 12 times, referenced 2 times" — low utility
   *   // "essayText requested 3 times but not provided" — context gap
   */
  getContextDiagnostics(): ContextDiagnosticStats {
    return this.relevanceTracker.getStats();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION RESOLUTION (for declared context)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Resolve a ContextSectionSpec into a ProfileSection.
   * Handles named sections, paragraph-scoped, sentence-scoped,
   * connection-scoped, and free-form selectors.
   */
  private resolveSection(
    profile: Readonly<EssayProfile>,
    spec: ContextSectionSpec,
  ): ProfileSection | null {
    const { section, presentation } = spec;

    // ── Named holistic sections ──
    const NAMED_SECTIONS: Record<string, unknown> = {
      profileIndex: profile.index,
      voiceIdentity: profile.voiceIdentity,
      voiceMap: profile.voiceMap,
      emotionalTopography: profile.emotionalTopography,
      momentEarnednessMap: profile.momentEarnednessMap,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
      characterRevelation: profile.characterRevelation,
      craftAssessment: profile.craftAssessment,
      admissionsPositioning: profile.admissionsPositioning,
      entanglements: profile.entanglements,
      northStar: profile.northStar,
      connections: profile.connections,
      findingSummary: profile.index.findingSummary,
    };

    if (section in NAMED_SECTIONS) {
      const content = NAMED_SECTIONS[section];
      if (content === null || content === undefined) return null;

      const presentedContent = presentation === 'summary'
        ? this.summarizeSectionContent(section, content)
        : content;

      return {
        name: section,
        content: presentedContent,
        tokenEstimate: estimateTokens(presentedContent),
        priority: 'always',
      };
    }

    // ── Paragraph-scoped: 'paragraph:3' or 'paragraph:3:understanding' or 'paragraph:3:analysis' ──
    const paraMatch = section.match(/^paragraph:(\d+)(?::(\w+))?$/);
    if (paraMatch) {
      const pIdx = parseInt(paraMatch[1]);
      const aspect = paraMatch[2]; // 'understanding', 'analysis', or undefined (full)
      const para = profile.paragraphs[pIdx];
      if (!para) return null;

      let content: unknown;
      if (aspect === 'understanding') {
        content = {
          index: pIdx,
          text: para.text,
          understanding: para.understanding,
          sentences: para.sentences
            .filter(s => s.understanding)
            .map(s => ({ index: s.index, text: s.text, understanding: s.understanding })),
        };
      } else if (aspect === 'analysis') {
        content = {
          index: pIdx,
          analysis: para.analysis,
          sentences: para.sentences
            .filter(s => s.analysis)
            .map(s => ({ index: s.index, analysis: s.analysis })),
        };
      } else {
        content = {
          index: pIdx,
          text: para.text,
          understanding: para.understanding,
          analysis: para.analysis,
          sentences: para.sentences.map(s => ({
            index: s.index,
            text: s.text,
            understanding: s.understanding,
            analysis: s.analysis,
          })),
        };
      }

      if (presentation === 'digest') {
        content = buildParagraphDigest(para);
      }

      return {
        name: `paragraph_P${pIdx}${aspect ? '_' + aspect : ''}`,
        content,
        tokenEstimate: estimateTokens(content),
        priority: 'always',
      };
    }

    // ── Sentence-scoped: 'sentence:3:2' ──
    const sentMatch = section.match(/^sentence:(\d+):(\d+)$/);
    if (sentMatch) {
      const pIdx = parseInt(sentMatch[1]);
      const sIdx = parseInt(sentMatch[2]);
      const sentence = profile.paragraphs[pIdx]?.sentences[sIdx];
      if (!sentence) return null;

      return {
        name: `sentence_P${pIdx}S${sIdx}`,
        content: {
          paragraphIndex: pIdx,
          sentenceIndex: sIdx,
          text: sentence.text,
          understanding: sentence.understanding,
          analysis: sentence.analysis,
        },
        tokenEstimate: estimateTokens(sentence),
        priority: 'always',
      };
    }

    // ── Connection-scoped: 'connections:paragraph:3' ──
    const connMatch = section.match(/^connections:paragraph:(\d+)$/);
    if (connMatch) {
      const pIdx = parseInt(connMatch[1]);
      const conns = getConnectionsForParagraph(profile, pIdx);
      if (conns.length === 0) return null;

      return {
        name: `connections_P${pIdx}`,
        content: conns,
        tokenEstimate: estimateTokens(conns),
        priority: 'connection_driven',
      };
    }

    // ── All paragraphs: 'paragraphs:all' or 'paragraphs:all:digests' ──
    if (section === 'paragraphs:all' || section === 'paragraphs:all:digests') {
      const isDigest = section.endsWith(':digests');
      const content = profile.paragraphs.map(p =>
        isDigest
          ? buildParagraphDigest(p)
          : {
              index: p.index,
              text: p.text,
              understanding: p.understanding,
              sentences: p.sentences.map(s => ({
                index: s.index,
                text: s.text,
                understanding: s.understanding,
              })),
            },
      );
      return {
        name: isDigest ? 'paragraphs_digests' : 'paragraphs_full',
        content,
        tokenEstimate: estimateTokens(content),
        priority: 'always',
      };
    }

    // ── Essay text: 'essayText' (reconstructed from paragraph texts) ──
    if (section === 'essayText') {
      const essayText = profile.paragraphs.map(p => p.text).join('\n\n');
      return {
        name: 'essayText',
        content: essayText,
        tokenEstimate: estimateTokens(essayText),
        priority: 'always',
      };
    }

    // ── Essay text for specific paragraph: 'essayText:paragraph:3' ──
    const essayParaMatch = section.match(/^essayText:paragraph:(\d+)$/);
    if (essayParaMatch) {
      const pIdx = parseInt(essayParaMatch[1]);
      const text = profile.paragraphs[pIdx]?.text ?? '';
      if (!text) return null;

      return {
        name: `essayText_P${pIdx}`,
        content: text,
        tokenEstimate: estimateTokens(text),
        priority: 'always',
      };
    }

    // ── Unknown section: log warning, return null ──
    console.warn(`[ProfileRouter] Unknown section spec: '${section}' — skipping`);
    return null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // READING STRATEGY ORDERING (for declared context)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Reorder sections based on ReadingStrategy's contextPriorities.
   *
   * L3.75 produces contextPriorities as an explicit routing signal —
   * no keyword matching, no closed taxonomy (Rules 3 & 7).
   *
   * Guard rail: required sections ('always' priority) precede desired
   * sections. The strategy reorders WITHIN tiers, not across them.
   * This prevents a strategy emphasizing voice from pushing essential
   * structural data after the token budget cutoff.
   */
  private applyReadingStrategyOrderingForDeclared(
    sections: ProfileSection[],
    strategy: ReadingStrategy,
  ): void {
    if (!strategy.contextPriorities?.length) return;

    const priorityIndex = new Map(
      strategy.contextPriorities.map((name, i) => [name, i]),
    );

    sections.sort((a, b) => {
      // 'always' priority stays first
      if (a.priority === 'always' && b.priority !== 'always') return -1;
      if (a.priority !== 'always' && b.priority === 'always') return 1;

      // Within same priority tier, sort by L3.75's contextPriorities ordering
      const aIdx = priorityIndex.get(a.name) ?? 999;
      const bIdx = priorityIndex.get(b.name) ?? 999;
      return aIdx - bIdx;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // TOKEN BUDGET WITH COMPRESSION (for declared context)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Apply token budget by compressing before dropping (Rule 2).
   *
   * When budget is tight, the choice is: fewer sections at full fidelity
   * OR more sections at compressed fidelity. The DeclaredContextRequest's
   * 'presentation' field handles per-section decisions. This method handles
   * budget overflow by progressively compressing lowest-priority sections.
   *
   * Compression order: nice_to_have → proximity → connection_driven → always
   * Only drops sections that cannot be compressed further AND are not 'always'.
   */
  private applyTokenBudgetWithCompression(
    sections: ProfileSection[],
    budget: number,
    _purpose: string,
    droppedSections: string[],
  ): AssembledProfileContext {
    let totalTokens = sections.reduce((sum, s) => sum + s.tokenEstimate, 0);

    if (totalTokens <= budget) {
      return {
        sections,
        estimatedTokens: totalTokens,
        appliedRule: 'declared',
        droppedSections: [],
      };
    }

    // Progressive compression: compress lowest-priority sections first
    const compressionOrder: ProfileSection['priority'][] = [
      'nice_to_have',
      'proximity',
      'connection_driven',
      'always',
    ];

    for (const tier of compressionOrder) {
      if (totalTokens <= budget) break;

      // Collect indices of sections in this tier (iterate backward for safe splice)
      const tierIndices: number[] = [];
      for (let i = 0; i < sections.length; i++) {
        if (sections[i].priority === tier) {
          tierIndices.push(i);
        }
      }

      // Process in reverse order to maintain valid indices during splice
      for (let j = tierIndices.length - 1; j >= 0; j--) {
        if (totalTokens <= budget) break;
        const idx = tierIndices[j];
        const section = sections[idx];

        const compressed = this.compressSection(section);
        if (compressed) {
          const saved = section.tokenEstimate - compressed.tokenEstimate;
          totalTokens -= saved;
          sections[idx] = compressed;
        } else if (section.priority !== 'always') {
          // Can't compress further and not required — drop
          totalTokens -= section.tokenEstimate;
          sections.splice(idx, 1);
          droppedSections.push(section.name);
        }
      }
    }

    return {
      sections,
      estimatedTokens: totalTokens,
      appliedRule: 'declared',
      droppedSections,
    };
  }

  /**
   * Compress a section by summarizing its content.
   * Returns null if the section is already at minimum fidelity.
   */
  private compressSection(section: ProfileSection): ProfileSection | null {
    const content = section.content;
    if (typeof content === 'string') return null; // Already minimal
    if (content === null || content === undefined) return null;

    const summary = this.summarizeSectionContent(section.name, content);
    if (!summary || summary === content) return null;

    const newEstimate = estimateTokens(summary);
    // Only compress if it actually saves tokens
    if (newEstimate >= section.tokenEstimate) return null;

    return {
      ...section,
      content: summary,
      tokenEstimate: newEstimate,
    };
  }

  /**
   * Produce a compact summary of a profile section.
   * Used for compression and for 'summary' presentation mode.
   *
   * Section-specific strategies preserve the most important signals
   * while reducing token footprint. Each summary includes a _note
   * indicating that full data is available (Rule 2: never discard).
   */
  private summarizeSectionContent(name: string, content: unknown): unknown {
    if (!content || typeof content !== 'object') return content;

    const obj = content as Record<string, unknown>;

    switch (name) {
      case 'voiceMap': {
        // Keep baselines and shift locations, drop individual observations
        const register = obj['register'] as Record<string, unknown> | undefined;
        const vocabFp = obj['vocabularyFingerprint'] as Record<string, unknown> | undefined;
        const rhythm = obj['sentenceRhythm'] as Record<string, unknown> | undefined;
        const perspective = obj['perspectiveDistance'] as Record<string, unknown> | undefined;
        const tonal = obj['tonalDisposition'] as Record<string, unknown> | undefined;
        return {
          register: register ? { baseline: register['baseline'] } : null,
          vocabularyFingerprint: vocabFp ? { baseline: vocabFp['baseline'] } : null,
          sentenceRhythm: rhythm ? { baseline: rhythm['baseline'] } : null,
          perspectiveDistance: perspective ? { baseline: perspective['baseline'] } : null,
          tonalDisposition: tonal ? { baseline: tonal['baseline'] } : null,
          shifts: obj['shifts'],
          _compressed: true,
          _note: 'Full voice map observations available — summary shows baselines + shifts only',
        };
      }

      case 'connections': {
        // Keep count, graph summary, and high-confidence connections only
        const all = (obj['all'] as Array<Record<string, unknown>>) ?? [];
        const highConf = all.filter(c =>
          c['strengthCategory'] === 'foundational' || c['strengthCategory'] === 'significant',
        );
        return {
          connectionCount: all.length,
          graphSummary: obj['graphSummary'],
          highConfidence: highConf,
          _compressed: true,
          _note: `${all.length} total connections — showing ${highConf.length} foundational/significant only`,
        };
      }

      case 'voiceIdentity': {
        return {
          signature: obj['signature'],
          register: obj['register'],
          distinctivePatterns: obj['distinctivePatterns'],
          _compressed: true,
          _note: 'Full voice identity available — summary omits authenticVsPerformed + evolution',
        };
      }

      case 'emotionalTopography': {
        return {
          arcTrajectory: obj['arcTrajectory'],
          peakMoments: obj['peakMoments'],
          authenticityAssessment: obj['authenticityAssessment'],
          _compressed: true,
          _note: 'Full emotional topography available — summary omits undertones, progression, showVsTell',
        };
      }

      case 'thematicArchitecture': {
        return {
          centralThesis: obj['centralThesis'],
          thesisConfidence: obj['thesisConfidence'],
          threads: Array.isArray(obj['threads'])
            ? (obj['threads'] as Array<Record<string, unknown>>).map(t => ({
                thread: t['thread'],
                strength: t['strength'],
              }))
            : [],
          _compressed: true,
          _note: 'Full thematic architecture available — summary omits subtext, contradictions, thread spans',
        };
      }

      case 'narrativeStrategy': {
        return {
          primaryStrategy: obj['primaryStrategy'],
          arcType: obj['arcType'],
          arcMomentum: obj['arcMomentum'],
          turningPoint: obj['turningPoint'],
          _compressed: true,
          _note: 'Full narrative strategy available — summary omits pivotPoints, pacingAnalysis, structuralChoices',
        };
      }

      case 'characterRevelation': {
        return {
          writerPortrait: obj['writerPortrait'],
          valuesRevealed: obj['valuesRevealed'],
          growthArc: obj['growthArc'],
          _compressed: true,
          _note: 'Full character revelation available — summary omits intellectualFingerprint, blindSpots, revealedQualities',
        };
      }

      case 'craftAssessment': {
        return {
          strengthSignatures: obj['strengthSignatures'],
          imageSystem: obj['imageSystem'],
          _compressed: true,
          _note: 'Full craft assessment available — summary omits growthEdges, sentencePatterns, wordPatterns',
        };
      }

      case 'admissionsPositioning': {
        return {
          tellabilitySummary: obj['tellabilitySummary'],
          distinctivenessFactors: obj['distinctivenessFactors'],
          memorability: obj['memorability'],
          _compressed: true,
          _note: 'Full admissions positioning available — summary omits institutionalFit, redFlags, portfolioPosition, aoTakeaway',
        };
      }

      default: {
        // Generic: keep scalars, truncate large arrays
        const summary: Record<string, unknown> = { _compressed: true };
        for (const [key, val] of Object.entries(obj)) {
          if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
            summary[key] = val;
          } else if (Array.isArray(val) && val.length <= 3) {
            summary[key] = val;
          } else if (Array.isArray(val)) {
            summary[key] = `[${val.length} items]`;
          }
        }
        return summary;
      }
    }
  }
}
