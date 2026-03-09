/**
 * HolisticMutator — Holistic Section Mutations (7 sections + entanglements)
 *
 * Two distinct modes of operation:
 *
 * 1. INCREMENTAL MERGE (during L3 walk):
 *    The walk produces holisticEvolution observations as the essay unfolds.
 *    Only 4 fields are updated incrementally: centralThesis, thesisConfidence,
 *    voiceSignature, arcMomentum. These are lightweight signals that accumulate
 *    as the walk progresses.
 *
 * 2. FULL SUPERSESSION (during L3.75 synthesis):
 *    L3.75's HolisticSynthesisOutput REPLACES all holistic sections entirely.
 *    This is the first time the holistic profile is comprehensively populated.
 *    The L3.75 output is authoritative — it reads ALL sentence-level understanding
 *    and synthesizes ALL 8 sections (including entanglements).
 *
 * Additionally supports:
 * - Craft assessment updates from L3.5 analysis pass
 * - Narrative strategy seeding from L2 structural cartography
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  HolisticSynthesisOutput,
  HolisticSectionType,
  ParagraphLocation,
  NarrativeStrategy,
  MutationType,
} from '../../profileTypes';

/**
 * Source tracking for insight-driven mutations.
 */
interface InsightSource {
  source: string;
  insightId: string;
}

// ============================================================================
// HOLISTIC MUTATOR
// ============================================================================

export class HolisticMutator {
  /**
   * INCREMENTAL MERGE — during L3 walk.
   *
   * The walk produces holisticEvolution observations (thesis crystallizing,
   * voice signature emerging). These are MERGED as additions/refinements.
   * Only 4 fields updated incrementally during walk.
   *
   * Only populated fields are updated. Omitted = unchanged.
   *
   * @returns MutationType[] for staleness propagation
   */
  mergeIncremental(
    profile: EssayProfile,
    evolution: {
      centralThesis?: string;
      thesisConfidence?: number;
      voiceSignature?: string;
      arcMomentum?: string;
    },
  ): MutationType[] {
    const mutations: MutationType[] = [];
    let changed = false;

    if (evolution.centralThesis !== undefined) {
      profile.thematicArchitecture.centralThesis = evolution.centralThesis;
      changed = true;
    }

    if (evolution.thesisConfidence !== undefined) {
      profile.thematicArchitecture.thesisConfidence = evolution.thesisConfidence;
      changed = true;
    }

    if (evolution.voiceSignature !== undefined) {
      profile.voiceIdentity.signature = evolution.voiceSignature;
      changed = true;
    }

    if (evolution.arcMomentum !== undefined) {
      profile.emotionalTopography.arcTrajectory = evolution.arcMomentum;
      changed = true;
    }

    if (changed) {
      mutations.push('holistic_section_updated');
    }

    return mutations;
  }

  /**
   * FULL SUPERSESSION — during L3.75 synthesis.
   *
   * L3.75's HolisticSynthesisOutput REPLACES all 8 holistic section types entirely.
   * The L3.75 output is the authoritative holistic profile.
   *
   * This replaces: voiceIdentity, voiceMap, emotionalTopography, momentEarnednessMap,
   * thematicArchitecture, narrativeStrategy, characterRevelation, craftAssessment,
   * entanglements, admissionsPositioning.
   *
   * @returns MutationType[] for staleness propagation
   */
  applyFullSupersession(
    profile: EssayProfile,
    synthesis: HolisticSynthesisOutput,
  ): MutationType[] {
    // Replace ALL holistic sections wholesale — L3.75 is authoritative
    profile.voiceIdentity = synthesis.voiceIdentity;
    profile.voiceMap = synthesis.voiceMap;
    profile.emotionalTopography = synthesis.emotionalTopography;
    profile.momentEarnednessMap = synthesis.momentEarnednessMap;
    profile.thematicArchitecture = synthesis.thematicArchitecture;
    profile.narrativeStrategy = synthesis.narrativeStrategy;
    profile.characterRevelation = synthesis.characterRevelation;
    profile.craftAssessment = synthesis.craftAssessment;
    profile.entanglements = synthesis.entanglements;
    profile.admissionsPositioning = synthesis.admissionsPositioning;

    // Full supersession always produces a holistic_section_updated mutation.
    // The coordinator will propagate staleness to all downstream consumers.
    return ['holistic_section_updated'];
  }

  /**
   * Update specific craft assessment fields (for L3.5 analysis evolution).
   *
   * The L3.5 analysis pass may discover new strength signatures or growth edges
   * that evolved from analyzing individual paragraphs. These are MERGED into
   * the existing craft assessment, not a full replacement.
   *
   * @returns MutationType[] for staleness propagation
   */
  updateCraftAssessment(
    profile: EssayProfile,
    update: {
      strengthSignatures?: Array<{ quality: string; evidence: string; paragraphs: number[] }>;
      growthEdges?: Array<{ quality: string; description: string; paragraphs: number[] }>;
    },
  ): MutationType[] {
    let changed = false;

    if (update.strengthSignatures !== undefined) {
      // Merge strength signatures — deduplicate by quality name
      for (const sig of update.strengthSignatures) {
        const existingIdx = profile.craftAssessment.strengthSignatures.findIndex(
          (s) => s.quality === sig.quality,
        );
        if (existingIdx >= 0) {
          // Supersede the existing entry with updated evidence and paragraphs
          profile.craftAssessment.strengthSignatures[existingIdx] = sig;
        } else {
          profile.craftAssessment.strengthSignatures.push(sig);
        }
      }
      changed = true;
    }

    if (update.growthEdges !== undefined) {
      // Merge growth edges — deduplicate by quality name
      for (const edge of update.growthEdges) {
        const existingIdx = profile.craftAssessment.growthEdges.findIndex(
          (e) => e.quality === edge.quality,
        );
        if (existingIdx >= 0) {
          // Supersede the existing entry with updated description and paragraphs
          profile.craftAssessment.growthEdges[existingIdx] = edge;
        } else {
          profile.craftAssessment.growthEdges.push(edge);
        }
      }
      changed = true;
    }

    return changed ? ['holistic_section_updated'] : [];
  }

  /**
   * Seed narrative strategy from L2 structural cartography.
   *
   * L2 produces a structural skeleton that provides initial hypotheses about
   * narrative strategy. This is a SEED, not a full replacement — only provided
   * fields are set.
   *
   * @returns MutationType[] for staleness propagation
   */
  seedNarrativeStrategy(
    profile: EssayProfile,
    seed: Partial<NarrativeStrategy>,
  ): MutationType[] {
    let changed = false;

    if (seed.primaryStrategy !== undefined) {
      profile.narrativeStrategy.primaryStrategy = seed.primaryStrategy;
      changed = true;
    }

    if (seed.strategyRationale !== undefined) {
      profile.narrativeStrategy.strategyRationale = seed.strategyRationale;
      changed = true;
    }

    if (seed.pivotPoints !== undefined) {
      profile.narrativeStrategy.pivotPoints = seed.pivotPoints;
      changed = true;
    }

    if (seed.pacingAnalysis !== undefined) {
      profile.narrativeStrategy.pacingAnalysis = seed.pacingAnalysis;
      changed = true;
    }

    if (seed.structuralChoices !== undefined) {
      profile.narrativeStrategy.structuralChoices = seed.structuralChoices;
      changed = true;
    }

    return changed ? ['holistic_section_updated'] : [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHT-DRIVEN CASCADE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enrich the emotional topography with student-revealed emotional data.
   *
   * When a student says "Reading this back makes me feel anxious" (emotional_reaction),
   * the system captures this as an observation in the emotional topography. These
   * are always additive — student emotions NEVER supersede system observations.
   *
   * Called by: 'emotional_reaction' insight cascade
   *
   * @param emotionalData - location, emotion name, and/or observation text
   * @returns MutationType[] for staleness propagation
   */
  enrichEmotionalTopography(
    profile: EssayProfile,
    emotionalData: {
      location?: ParagraphLocation;
      emotion?: string;
      observation?: string;
    },
    _source?: InsightSource,
  ): MutationType[] {
    // Add to undertones if it's a general emotional observation
    if (emotionalData.observation) {
      const undertone = emotionalData.emotion
        ? `${emotionalData.emotion}: ${emotionalData.observation}`
        : emotionalData.observation;

      if (!profile.emotionalTopography.undertones.includes(undertone)) {
        profile.emotionalTopography.undertones.push(undertone);
      }
    }

    // If a specific location and emotion were provided, add as a peak moment
    // (student-identified emotional significance)
    if (emotionalData.location && emotionalData.emotion) {
      const paragraph = emotionalData.location.paragraph;
      const sentence = emotionalData.location.sentence ?? 0;

      // Check if this location already has a peak moment
      const existing = profile.emotionalTopography.peakMoments.find(
        (pm) => pm.location[0] === paragraph && pm.location[1] === sentence,
      );

      if (!existing) {
        profile.emotionalTopography.peakMoments.push({
          location: [paragraph, sentence],
          emotion: emotionalData.emotion,
          intensity: 'moderate', // Default — student mentioned it, so it's at least moderate
        });
      }
    }

    return ['holistic_section_updated'];
  }

  /**
   * Enrich a holistic section with student-provided context.
   *
   * Generic enrichment method that adds context strings to the appropriate
   * holistic section. Used when the student provides background information
   * that applies to a specific holistic dimension.
   *
   * Called by: various insight cascades that need to enrich holistic understanding
   *
   * @param sectionType - which holistic section to enrich
   * @param contextString - the context to add
   * @returns MutationType[] for staleness propagation
   */
  enrichWithContext(
    profile: EssayProfile,
    sectionType: HolisticSectionType,
    contextString: string,
    _source?: InsightSource,
  ): MutationType[] {
    switch (sectionType) {
      case 'voice_identity':
        // Add to distinctive patterns
        if (!profile.voiceIdentity.distinctivePatterns.includes(contextString)) {
          profile.voiceIdentity.distinctivePatterns.push(contextString);
        }
        break;

      case 'emotional_topography':
        // Add to undertones
        if (!profile.emotionalTopography.undertones.includes(contextString)) {
          profile.emotionalTopography.undertones.push(contextString);
        }
        break;

      case 'thematic_architecture':
        // Add to subtext (thematic context that isn't in the essay)
        if (profile.thematicArchitecture.subtext) {
          profile.thematicArchitecture.subtext += `; ${contextString}`;
        } else {
          profile.thematicArchitecture.subtext = contextString;
        }
        break;

      case 'narrative_strategy':
        // Add to structural choices
        profile.narrativeStrategy.structuralChoices.push(contextString);
        break;

      case 'character_revelation':
        // Add to values revealed
        if (!profile.characterRevelation.valuesRevealed.includes(contextString)) {
          profile.characterRevelation.valuesRevealed.push(contextString);
        }
        break;

      case 'craft_assessment':
        // No simple string field — skip
        break;

      case 'admissions_positioning':
        // Add to distinctiveness factors
        if (!profile.admissionsPositioning.distinctivenessFactors.includes(contextString)) {
          profile.admissionsPositioning.distinctivenessFactors.push(contextString);
        }
        break;

      default:
        // voice_map, moment_earnedness_map, cross_dimension_entanglements
        // handled by their own mutators
        break;
    }

    return ['holistic_section_updated'];
  }

  /**
   * Validate holistic section internal consistency.
   *
   * Checks:
   * - Voice identity authentic/performed locations reference valid paragraphs/sentences
   * - Emotional topography peak moment locations are valid
   * - Thematic architecture thread locations are valid
   * - Craft assessment paragraph references are valid
   * - Entanglement IDs are unique
   * - Entanglement locations reference valid paragraphs
   *
   * @returns Array of validation error messages (empty = valid)
   */
  validate(profile: EssayProfile): string[] {
    const errors: string[] = [];
    const paragraphCount = profile.paragraphs.length;

    // Voice identity: authentic/performed locations
    for (const entry of profile.voiceIdentity.authenticVsPerformed) {
      const [p, s] = entry.location;
      if (p < 0 || p >= paragraphCount) {
        errors.push(`VoiceIdentity authenticVsPerformed: paragraph ${p} out of range`);
      } else if (s < 0 || s >= profile.paragraphs[p].sentences.length) {
        errors.push(`VoiceIdentity authenticVsPerformed: sentence ${s} out of range in paragraph ${p}`);
      }
    }

    // Emotional topography: peak moment locations
    for (const peak of profile.emotionalTopography.peakMoments) {
      const [p, s] = peak.location;
      if (p < 0 || p >= paragraphCount) {
        errors.push(`EmotionalTopography peakMoment: paragraph ${p} out of range`);
      } else if (s < 0 || s >= profile.paragraphs[p].sentences.length) {
        errors.push(`EmotionalTopography peakMoment: sentence ${s} out of range in paragraph ${p}`);
      }
    }

    // Thematic architecture: thread locations
    for (const thread of profile.thematicArchitecture.threads) {
      const introP = thread.introducedAt.paragraph;
      if (introP < 0 || introP >= paragraphCount) {
        errors.push(`ThematicArchitecture thread "${thread.thread}": introducedAt paragraph ${introP} out of range`);
      }
      for (const appearance of thread.appearances) {
        if (appearance.paragraph < 0 || appearance.paragraph >= paragraphCount) {
          errors.push(`ThematicArchitecture thread "${thread.thread}": appearance paragraph ${appearance.paragraph} out of range`);
        }
      }
    }

    // Craft assessment: paragraph references
    for (const sig of profile.craftAssessment.strengthSignatures) {
      for (const p of sig.paragraphs) {
        if (p < 0 || p >= paragraphCount) {
          errors.push(`CraftAssessment strength "${sig.quality}": paragraph ${p} out of range`);
        }
      }
    }
    for (const edge of profile.craftAssessment.growthEdges) {
      for (const p of edge.paragraphs) {
        if (p < 0 || p >= paragraphCount) {
          errors.push(`CraftAssessment growthEdge "${edge.quality}": paragraph ${p} out of range`);
        }
      }
    }

    // Entanglements: unique IDs and valid locations
    const entanglementIds = new Set<string>();
    for (const ent of profile.entanglements) {
      if (entanglementIds.has(ent.id)) {
        errors.push(`Entanglement ID "${ent.id}" is not unique`);
      }
      entanglementIds.add(ent.id);

      if (ent.location.paragraph < 0 || ent.location.paragraph >= paragraphCount) {
        errors.push(`Entanglement "${ent.id}": paragraph ${ent.location.paragraph} out of range`);
      }
    }

    return errors;
  }
}
