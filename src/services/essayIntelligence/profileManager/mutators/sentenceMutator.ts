/**
 * SentenceMutator — Sentence Understanding + Analysis Mutations
 *
 * The SentenceMutator is the anti-repetition defense. It handles the most frequent
 * operation: updating sentence understanding during the L3 walk.
 *
 * SUPERSESSION MODEL:
 * - Array fields (observedFunctions, inferredIntents, narrativeContributions) are
 *   REPLACED entirely, never appended. Later paragraphs have more context = deeper
 *   understanding = the new array IS the better one.
 * - Scalar fields (paragraphContribution, rhythm, voiceAlignment) are overwritten.
 * - Collection fields (tags, connectionRefs, techniques) are ADDED with deduplication.
 *
 * Understanding and Analysis are NEVER mixed — separate sub-objects on SentenceProfile.
 * connectionRefs are string[] of IDs only — they point to entries in connections.all[].
 * The SentenceMutator does NOT create or modify connections themselves.
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  SentenceUnderstanding,
  SentenceAnalysis,
  SentenceProfile,
  ObservationEntry,
  MutationType,
} from '../../profileTypes';

/**
 * Source tracking for insight-driven mutations.
 * Links mutations back to the conversation insight that caused them.
 */
interface InsightSource {
  source: string;
  insightId: string;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Safely retrieve a sentence profile, or return null if indices are out of range.
 */
function getSentence(
  profile: EssayProfile,
  paragraphIndex: number,
  sentenceIndex: number,
): SentenceProfile | null {
  const para = profile.paragraphs[paragraphIndex];
  if (!para) return null;
  const sentence = para.sentences[sentenceIndex];
  return sentence ?? null;
}

/**
 * Ensure a sentence has an understanding sub-object. If null, create an empty one.
 * This is necessary because understanding starts as null until L3 walk reaches it.
 */
function ensureUnderstanding(sentence: SentenceProfile): SentenceUnderstanding {
  if (!sentence.understanding) {
    sentence.understanding = {
      observedFunctions: [],
      inferredIntents: [],
      narrativeContributions: [],
      rhetoricalFunctions: [],
      paragraphContribution: '',
      craft: {
        rhythm: '',
        voiceAlignment: '',
        techniques: [],
      },
      significantChoices: [],
      connectionRefs: [],
      tags: [],
    };
  }
  return sentence.understanding;
}

// ============================================================================
// SENTENCE MUTATOR
// ============================================================================

export class SentenceMutator {
  /**
   * Apply sentence understanding update (L3 walk).
   * SUPERSESSION: array fields (observedFunctions, inferredIntents, narrativeContributions)
   * are REPLACED entirely, never appended. Scalar fields are overwritten.
   *
   * @returns MutationType[] -- what changed (for staleness propagation)
   */
  applySentenceUnderstanding(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    update: Partial<SentenceUnderstanding>,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(
        `[SentenceMutator] applySentenceUnderstanding validation failed:`,
        errors,
      );
      return [];
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    const understanding = ensureUnderstanding(sentence);
    const mutations: MutationType[] = [];

    // ── SUPERSESSION FIELDS (entire array/value REPLACED) ──

    if (update.observedFunctions !== undefined) {
      understanding.observedFunctions = update.observedFunctions;
      mutations.push('sentence_understanding_updated');
    }

    if (update.inferredIntents !== undefined) {
      understanding.inferredIntents = update.inferredIntents;
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    if (update.narrativeContributions !== undefined) {
      understanding.narrativeContributions = update.narrativeContributions;
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    if (update.rhetoricalFunctions !== undefined) {
      understanding.rhetoricalFunctions = update.rhetoricalFunctions;
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    if (update.paragraphContribution !== undefined) {
      understanding.paragraphContribution = update.paragraphContribution;
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    // ── CRAFT OBSERVATIONS (supersession on sub-fields) ──

    if (update.craft !== undefined) {
      if (update.craft.rhythm !== undefined) {
        understanding.craft.rhythm = update.craft.rhythm;
      }
      if (update.craft.voiceAlignment !== undefined) {
        understanding.craft.voiceAlignment = update.craft.voiceAlignment;
      }
      if (update.craft.techniques !== undefined) {
        // techniques is a collection field -- additive, deduplicated
        for (const technique of update.craft.techniques) {
          if (!understanding.craft.techniques.includes(technique)) {
            understanding.craft.techniques.push(technique);
          }
        }
      }
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    // ── SIGNIFICANT CHOICES (deduplicated by word key) ──

    if (update.significantChoices !== undefined) {
      for (const choice of update.significantChoices) {
        const existing = understanding.significantChoices.findIndex(
          (sc) => sc.word === choice.word,
        );
        if (existing >= 0) {
          // Same word re-evaluated -- replace significance (supersession per word)
          understanding.significantChoices[existing] = choice;
        } else {
          understanding.significantChoices.push(choice);
        }
      }
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    // ── COLLECTION FIELDS (additive, deduplicated) ──

    if (update.connectionRefs !== undefined) {
      for (const ref of update.connectionRefs) {
        if (!understanding.connectionRefs.includes(ref)) {
          understanding.connectionRefs.push(ref);
        }
      }
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    if (update.tags !== undefined) {
      for (const tag of update.tags) {
        if (!understanding.tags.includes(tag)) {
          understanding.tags.push(tag);
        }
      }
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    return mutations;
  }

  /**
   * Apply sentence analysis (L3.5 pass).
   * Analysis is SEPARATE from understanding -- never mixed.
   *
   * @returns MutationType[] -- what changed
   */
  applySentenceAnalysis(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    analysis: SentenceAnalysis,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(
        `[SentenceMutator] applySentenceAnalysis validation failed:`,
        errors,
      );
      return [];
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;

    // Analysis is a complete supersession -- replace the entire analysis object
    sentence.analysis = analysis;

    return ['sentence_analysis_updated'];
  }

  /**
   * Apply back-propagation from a later paragraph.
   * Key: observedFunctions, inferredIntents, narrativeContributions arrays
   * are REPLACED entirely (supersession). Tags are ADDED (deduplicated).
   *
   * This is the primary anti-repetition mechanism. Later paragraphs have more
   * context, so their understanding of earlier sentences is BETTER. The entire
   * array is replaced, not appended.
   */
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
  ): MutationType[] {
    const errors = this.validate(profile, update.paragraph, update.sentence);
    if (errors.length > 0) {
      console.error(
        `[SentenceMutator] applyBackPropagation validation failed:`,
        errors,
      );
      return [];
    }

    const sentence = getSentence(profile, update.paragraph, update.sentence)!;
    const understanding = ensureUnderstanding(sentence);
    const mutations: MutationType[] = [];

    // ── SUPERSESSION: entire arrays REPLACED ──
    if (update.observedFunctions) {
      understanding.observedFunctions = update.observedFunctions;
      mutations.push('sentence_understanding_updated');
    }

    if (update.inferredIntents) {
      understanding.inferredIntents = update.inferredIntents;
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    if (update.narrativeContributions) {
      understanding.narrativeContributions = update.narrativeContributions;
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    // ── COLLECTION: tags ADDED (deduplicated) ──
    if (update.newTags) {
      for (const tag of update.newTags) {
        if (!understanding.tags.includes(tag)) {
          understanding.tags.push(tag);
        }
      }
      if (!mutations.includes('sentence_understanding_updated')) {
        mutations.push('sentence_understanding_updated');
      }
    }

    return mutations;
  }

  /**
   * Add connection reference ID to a sentence.
   * connectionRefs are IDs only -- they point to entries in connections.all[].
   * The SentenceMutator does NOT create or modify connections.
   */
  addConnectionRef(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    connectionId: string,
  ): void {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(
        `[SentenceMutator] addConnectionRef validation failed:`,
        errors,
      );
      return;
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    const understanding = ensureUnderstanding(sentence);

    if (!understanding.connectionRefs.includes(connectionId)) {
      understanding.connectionRefs.push(connectionId);
    }
  }

  /**
   * Remove a connection reference ID from a sentence.
   * Used by ConnectionMutator when removing a connection to clean up refs.
   */
  removeConnectionRef(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    connectionId: string,
  ): void {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(
        `[SentenceMutator] removeConnectionRef validation failed:`,
        errors,
      );
      return;
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    if (!sentence.understanding) return;

    const idx = sentence.understanding.connectionRefs.indexOf(connectionId);
    if (idx >= 0) {
      sentence.understanding.connectionRefs.splice(idx, 1);
    }
  }

  /**
   * Add tags to a sentence (deduplicated).
   */
  addTags(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    tags: string[],
  ): void {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(`[SentenceMutator] addTags validation failed:`, errors);
      return;
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    const understanding = ensureUnderstanding(sentence);

    for (const tag of tags) {
      if (!understanding.tags.includes(tag)) {
        understanding.tags.push(tag);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHT-DRIVEN CASCADE METHODS
  // ═══════════════════════════════════════════════════════════════════════════
  // Called by the coordinator when a conversation insight cascades into
  // sentence-level mutations. Each method is triggered by a specific insight
  // category (reinterpretation, correction, new_context, clarification).

  /**
   * Replace inferredIntents for a sentence based on student reinterpretation.
   *
   * When a student says "I wasn't showing sadness — I was showing numbness",
   * the entire inferredIntents array is REPLACED (supersession model).
   * The new intents come from the student's own words, not the LLM.
   *
   * Called by: 'reinterpretation' insight cascade
   *
   * @returns MutationType[] for staleness propagation
   */
  updateInferredIntents(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    newIntents: ObservationEntry[],
    _source?: InsightSource,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(`[SentenceMutator] updateInferredIntents validation failed:`, errors);
      return [];
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    const understanding = ensureUnderstanding(sentence);

    // SUPERSESSION: replace the entire inferredIntents array
    understanding.inferredIntents = newIntents;

    return ['sentence_understanding_updated'];
  }

  /**
   * Correct a specific inferred intent that the student says is wrong.
   *
   * When a student says "That's wrong — I didn't mean it ironically",
   * find the matching observation and replace it. Also lower confidence
   * on related observations that may have been inferred from the same
   * (now-known-wrong) assumption.
   *
   * Called by: 'correction' insight cascade
   *
   * @param correctedObservation - text of the observation being corrected
   * @param correctedTo - the replacement observation from the student
   * @returns MutationType[] for staleness propagation
   */
  correctInferredIntent(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    correctedObservation: string,
    correctedTo: ObservationEntry,
    _source?: InsightSource,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(`[SentenceMutator] correctInferredIntent validation failed:`, errors);
      return [];
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    const understanding = ensureUnderstanding(sentence);

    // Find and replace the corrected observation
    const idx = understanding.inferredIntents.findIndex(
      (intent) => intent.observation === correctedObservation,
    );

    if (idx >= 0) {
      understanding.inferredIntents[idx] = correctedTo;
    } else {
      // If exact match not found, append the correction as a new intent
      // (the original may have been superseded by a previous update)
      understanding.inferredIntents.push(correctedTo);
    }

    // Lower confidence on related observations — a correction suggests
    // the system's interpretation was off, so nearby inferences are suspect
    for (const intent of understanding.inferredIntents) {
      if (intent !== correctedTo && intent.confidence !== undefined && intent.confidence > 0.5) {
        intent.confidence = Math.max(0.3, intent.confidence - 0.2);
      }
    }

    return ['sentence_understanding_updated'];
  }

  /**
   * Enrich a sentence's narrative context with student-provided background.
   *
   * When a student says "My dad was deployed when this happened", that context
   * is added to narrativeContributions as an observation. This is additive —
   * it enriches without replacing existing contributions.
   *
   * Called by: 'new_context' insight cascade
   *
   * @returns MutationType[] for staleness propagation
   */
  enrichNarrativeContext(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    newContext: string,
    source?: InsightSource,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(`[SentenceMutator] enrichNarrativeContext validation failed:`, errors);
      return [];
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    const understanding = ensureUnderstanding(sentence);

    // Additive — push a new narrative contribution with student context
    understanding.narrativeContributions.push({
      observation: newContext,
      confidence: 0.95, // High confidence — student-provided context is authoritative
      evidence: source
        ? `Student-provided context (insight ${source.insightId})`
        : 'Student-provided context',
    });

    return ['sentence_understanding_updated'];
  }

  /**
   * Clarify an ambiguous observation without triggering staleness.
   *
   * When a student says "When I said 'they', I meant my parents", the
   * clarification refines an observation without changing its fundamental
   * meaning. Existing observations are kept; the clarification is added
   * as additional context.
   *
   * Called by: 'clarification' insight cascade
   * NOTE: Clarifications do NOT trigger staleness — they refine without changing meaning.
   *
   * @returns MutationType[] — returns empty array (no staleness propagation)
   */
  clarifyObservation(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
    clarification: string,
    source?: InsightSource,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex, sentenceIndex);
    if (errors.length > 0) {
      console.error(`[SentenceMutator] clarifyObservation validation failed:`, errors);
      return [];
    }

    const sentence = getSentence(profile, paragraphIndex, sentenceIndex)!;
    const understanding = ensureUnderstanding(sentence);

    // Add clarification as a tag so it's discoverable but doesn't change
    // the fundamental understanding observations
    const clarificationTag = source
      ? `clarification:${source.insightId}`
      : 'clarification:student';
    if (!understanding.tags.includes(clarificationTag)) {
      understanding.tags.push(clarificationTag);
    }

    // Also enrich inferredIntents with the clarified understanding
    // This is a refinement, not a replacement — push with high confidence
    understanding.inferredIntents.push({
      observation: `Clarified: ${clarification}`,
      confidence: 0.95,
      evidence: source
        ? `Student clarification (insight ${source.insightId})`
        : 'Student clarification',
    });

    // Return empty — clarifications do NOT propagate staleness
    return [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate sentence indices are in range.
   * @returns validation errors if any
   */
  validate(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceIndex: number,
  ): string[] {
    const errors: string[] = [];

    if (paragraphIndex < 0 || paragraphIndex >= profile.paragraphs.length) {
      errors.push(
        `Paragraph index ${paragraphIndex} out of range [0, ${profile.paragraphs.length - 1}]`,
      );
      return errors; // Can't validate sentence if paragraph is invalid
    }

    const para = profile.paragraphs[paragraphIndex];
    if (sentenceIndex < 0 || sentenceIndex >= para.sentences.length) {
      errors.push(
        `Sentence index ${sentenceIndex} out of range [0, ${para.sentences.length - 1}] in paragraph ${paragraphIndex}`,
      );
    }

    return errors;
  }
}
