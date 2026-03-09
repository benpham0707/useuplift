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
 * 12 routing rules, each tailored to a specific call type.
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
} from '../profileTypes';

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
  | 'l4_crystallization'
  | 'l5_feedback_annotations'
  | 'l6_coaching_voice'
  | 'l6_coaching_paragraph'
  | 'l6_coaching_overview'
  | 'inline_edit_sentence'
  | 'reanalysis_comprehensive'
  | 'focused_understanding'
  | 'focused_analysis';

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
  appliedRule: RoutingRule;
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
// INTERNAL HELPERS
// ============================================================================

/** Default token budget when none specified (generous — most calls fit within this) */
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
    if (entry.from[0] === paragraphIndex) {
      connected.add(entry.to[0]);
    } else if (entry.to[0] === paragraphIndex) {
      connected.add(entry.from[0]);
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
): Array<{ from: [number, number]; to: [number, number]; type: string }> {
  return profile.index.connectionGraph.filter(
    (entry) =>
      (entry.from[0] === paragraphIndex && entry.from[1] === sentenceIndex) ||
      (entry.to[0] === paragraphIndex && entry.to[1] === sentenceIndex),
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
    (conn) => conn.from[0] === paragraphIndex || conn.to[0] === paragraphIndex,
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
      conn.confidence < 0.5 &&
      conn.discoveredByLayer === 'l2.5' &&
      (conn.from[0] === paragraphIndex || conn.to[0] === paragraphIndex),
  );
}

// ============================================================================
// PROFILE ROUTER
// ============================================================================

export class ProfileRouter {
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
    const budget = request.tokenBudget ?? DEFAULT_TOKEN_BUDGET;

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
      default: {
        const _exhaustive: never = request.rule;
        throw new Error(`Unknown routing rule: ${_exhaustive}`);
      }
    }

    // Apply token budget — drop lowest priority sections first
    return this.applyTokenBudget(sections, budget, request.rule);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ROUTING RULE IMPLEMENTATIONS
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Rule 1: L3 understanding walk for paragraph P
   *
   * ALWAYS: ProfileIndex + holistic understanding (incremental so far) + scout leads for P
   * CONNECTION-DRIVEN: FULL understanding for paragraphs connected to P (from connectionGraph)
   * PROXIMITY: P(N-1) full understanding
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
        tokenEstimate: profile.index.sectionTokens.paragraphs[connIdx] ?? estimateTokens(para.understanding),
        priority: 'connection_driven',
      });
    }

    // PROXIMITY: P(N-1) full understanding (if not already included as connection-driven)
    const prevIdx = pIdx - 1;
    if (prevIdx >= 0 && !connectedParas.has(prevIdx)) {
      const prevPara = profile.paragraphs[prevIdx];
      if (prevPara?.understanding) {
        sections.push({
          name: `proximity_P${prevIdx}_understanding`,
          content: {
            index: prevIdx,
            understanding: prevPara.understanding,
            sentences: prevPara.sentences
              .filter((s) => s.understanding)
              .map((s) => ({ index: s.index, understanding: s.understanding })),
          },
          tokenEstimate: profile.index.sectionTokens.paragraphs[prevIdx] ?? estimateTokens(prevPara.understanding),
          priority: 'proximity',
        });
      }
    }

    // FALLBACK: Earlier paragraphs get digests only
    for (let i = 0; i < prevIdx; i++) {
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
        tokenEstimate: profile.index.sectionTokens.paragraphs[para.index] ?? estimateTokens(para),
        priority: 'always',
      });
    }

    // ALWAYS: Connections (understanding layer — needed for context)
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokens.connections,
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
        tokenEstimate: profile.index.sectionTokens.paragraphs[para.index] ?? estimateTokens(para),
        priority: 'always',
      });
    }

    // ALWAYS: All connections
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokens.connections,
      priority: 'always',
    });

    // ALWAYS: Walk's holistic evolution (incremental observations from L3)
    const holisticEvolution = {
      voiceIdentity: profile.voiceIdentity,
      thematicArchitecture: profile.thematicArchitecture,
      narrativeStrategy: profile.narrativeStrategy,
    };
    sections.push({
      name: 'holisticEvolution',
      content: holisticEvolution,
      tokenEstimate: estimateTokens(holisticEvolution),
      priority: 'always',
    });

    // ALWAYS: Scout leads (all — for holistic connection verification)
    const allScoutLeads = profile.connections.all.filter(
      (c) => c.confidence < 0.5 && c.discoveredByLayer === 'l2.5',
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
      tokenEstimate: profile.index.sectionTokens.connections,
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
      tokenEstimate: profile.index.sectionTokens.northStar,
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
        tokenEstimate: profile.index.sectionTokens.paragraphs[para.index] ?? estimateTokens(para),
        priority: 'always',
      });
    }

    // ALWAYS: Connections
    sections.push({
      name: 'connections',
      content: profile.connections,
      tokenEstimate: profile.index.sectionTokens.connections,
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
      tokenEstimate: profile.index.sectionTokens.voiceIdentity,
      priority: 'always',
    });

    sections.push({
      name: 'voiceMap',
      content: profile.voiceMap,
      tokenEstimate: profile.index.sectionTokens.voiceMap,
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
        tokenEstimate: profile.index.sectionTokens.paragraphs[pIdx] ?? estimateTokens(targetPara),
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

    // CONNECTION-DRIVEN: connected paragraphs' full understanding + analysis for connected sentences
    const connectedParas = findConnectedParagraphs(profile, pIdx);
    for (const connIdx of connectedParas) {
      const para = profile.paragraphs[connIdx];
      if (!para) continue;

      // Find which specific sentences are connected to target paragraph
      const connectedSentenceIndices = new Set<number>();
      for (const conn of profile.connections.all) {
        if (conn.from[0] === pIdx && conn.to[0] === connIdx) {
          connectedSentenceIndices.add(conn.to[1]);
        } else if (conn.to[0] === pIdx && conn.from[0] === connIdx) {
          connectedSentenceIndices.add(conn.from[1]);
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
      tokenEstimate: profile.index.sectionTokens.northStar,
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
      const otherLoc = entry.from[0] === pIdx && entry.from[1] === sIdx
        ? entry.to
        : entry.from;
      const otherPara = profile.paragraphs[otherLoc[0]];
      const otherSentence = otherPara?.sentences[otherLoc[1]];
      if (!otherSentence) continue;

      sections.push({
        name: `connected_P${otherLoc[0]}S${otherLoc[1]}`,
        content: {
          paragraphIndex: otherLoc[0],
          sentenceIndex: otherLoc[1],
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
        tokenEstimate: profile.index.sectionTokens.paragraphs[pIdx] ?? estimateTokens(changedPara),
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
        tokenEstimate: profile.index.sectionTokens.paragraphs[connIdx] ?? estimateTokens(para),
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
      const otherLoc = entry.from[0] === pIdx && entry.from[1] === sIdx
        ? entry.to
        : entry.from;
      const otherPara = profile.paragraphs[otherLoc[0]];
      const otherSentence = otherPara?.sentences[otherLoc[1]];
      if (!otherSentence?.understanding) continue;

      sections.push({
        name: `connected_P${otherLoc[0]}S${otherLoc[1]}_understanding`,
        content: {
          paragraphIndex: otherLoc[0],
          sentenceIndex: otherLoc[1],
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
      const otherLoc = entry.from[0] === pIdx && entry.from[1] === sIdx
        ? entry.to
        : entry.from;
      const otherPara = profile.paragraphs[otherLoc[0]];
      const otherSentence = otherPara?.sentences[otherLoc[1]];
      if (!otherSentence?.analysis) continue;

      sections.push({
        name: `connected_P${otherLoc[0]}S${otherLoc[1]}_analysis`,
        content: {
          paragraphIndex: otherLoc[0],
          sentenceIndex: otherLoc[1],
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

  // ════════════════════════════════════════════════════════════════════════════
  // TOKEN BUDGET ENFORCEMENT
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Apply token budget by dropping lowest-priority sections first.
   * Priority order: always > connection_driven > proximity > nice_to_have.
   */
  private applyTokenBudget(
    sections: ProfileSection[],
    budget: number,
    rule: RoutingRule,
  ): AssembledProfileContext {
    const priorityOrder: Record<ProfileSection['priority'], number> = {
      always: 0,
      connection_driven: 1,
      proximity: 2,
      nice_to_have: 3,
    };

    // Sort by priority (lowest priority number = highest importance)
    const sorted = [...sections].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );

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
}
