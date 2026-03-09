/**
 * InsightMutator — Conversation Insight Operations with Per-Category Supersession
 *
 * The Conversation Insight system is the bridge between the student's inner world
 * and the system's analytical model. L6 is the only layer where information flows
 * INWARD — the student tells us something the text alone could never reveal.
 *
 * Each of the 8 insight categories has different mechanical behavior:
 *
 * | Category           | Supersession Behavior                                            |
 * |--------------------|------------------------------------------------------------------|
 * | confirmation       | Boosts confidence. NEVER supersedes. Additive only.              |
 * | reinterpretation   | Supersedes specific observations (inferredIntents, observedFn).  |
 * | new_context        | Supersedes observations that assumed different context.           |
 * | correction         | Supersedes specific inferredIntent. Lowers confidence in related.|
 * | preference         | Supersedes prior preferences on same dimension.                  |
 * | clarification      | Supersedes specific ambiguity. Refines understanding.            |
 * | emotional_reaction | NEVER supersedes. Additive — signals student's relationship.     |
 * | resistance         | NEVER supersedes. Signals disagreement — probe for reason.       |
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  ConversationInsight,
  PatternInsight,
  InsightCategory,
  MutationType,
} from '../../profileTypes';

// ============================================================================
// CATEGORY BEHAVIOR CONFIGURATION
// ============================================================================

/**
 * Which insight categories can supersede existing observations.
 * Categories not listed here are purely additive.
 */
const SUPERSEDING_CATEGORIES: Set<InsightCategory> = new Set<InsightCategory>([
  'reinterpretation',
  'new_context',
  'correction',
  'preference',
  'clarification',
]);

/**
 * Which insight categories are purely additive (never supersede anything).
 */
const ADDITIVE_CATEGORIES: Set<InsightCategory> = new Set<InsightCategory>([
  'confirmation',
  'emotional_reaction',
  'resistance',
]);

/**
 * Maps insight categories to the profile sections they typically affect.
 * Used to report which sections may need updating after an insight is applied.
 */
const CATEGORY_AFFECTED_SECTIONS: Record<InsightCategory, string[]> = {
  confirmation: [],
  reinterpretation: ['sentence_understanding', 'thematic_architecture', 'character_revelation'],
  new_context: ['sentence_understanding', 'thematic_architecture', 'narrative_strategy', 'character_revelation'],
  correction: ['sentence_understanding', 'voice_identity'],
  preference: ['voice_map', 'craft_assessment'],
  clarification: ['sentence_understanding', 'thematic_architecture'],
  emotional_reaction: [],
  resistance: [],
};

// ============================================================================
// INSIGHT MUTATOR
// ============================================================================

export class InsightMutator {
  /**
   * Apply a conversation insight. Routes based on category:
   *
   * - confirmation: boosts confidence, never supersedes
   * - reinterpretation: supersedes specific observations
   * - new_context: supersedes observations assuming different context
   * - correction: supersedes specific inferredIntent
   * - preference: supersedes prior preferences on same dimension
   * - clarification: supersedes specific ambiguity
   * - emotional_reaction: never supersedes — additive
   * - resistance: never supersedes — signals disagreement
   *
   * @returns mutations and which profile sections may need updating
   */
  applyInsight(
    profile: EssayProfile,
    insight: ConversationInsight,
  ): { mutations: MutationType[]; affectedSections: string[] } {
    const mutations: MutationType[] = [];
    const affectedSections: string[] = [];

    // Store the insight in the conversation insights array
    profile.conversationInsights.push(insight);
    profile.metadata.conversationInsightsCount = profile.conversationInsights.length;

    // Handle partial supersession if declared
    if (insight.partiallySupersedes) {
      const supersededId = insight.partiallySupersedes.insightId;
      const supersededInsight = profile.conversationInsights.find(
        (ci) => ci.id === supersededId,
      );
      if (supersededInsight) {
        // Mark the superseded insight with the partial supersession reference.
        // The superseded insight itself is NOT removed — it retains its confirmed
        // portions and is marked as partially superseded.
        // Consumers read both the original (for confirmed portion) and the new
        // insight (for revised portion).
        // No mutation on the original — the new insight's partiallySupersedes
        // field establishes the chain.
      }
    }

    // Route based on category
    if (SUPERSEDING_CATEGORIES.has(insight.category)) {
      affectedSections.push(...CATEGORY_AFFECTED_SECTIONS[insight.category]);
      mutations.push('conversation_insight_applied');
    } else if (ADDITIVE_CATEGORIES.has(insight.category)) {
      // Additive categories may still affect sections but don't trigger supersession
      if (insight.category === 'confirmation') {
        // Confirmation boosts confidence — no staleness, but the coordinator
        // may want to know about it for readiness scoring.
        // No affected sections reported — confirmations don't invalidate anything.
      }
      mutations.push('conversation_insight_applied');
    }

    return { mutations, affectedSections };
  }

  /**
   * Mark an insight as partially superseded.
   *
   * Used when a later insight refines an earlier one. The original insight
   * retains its confirmed portions while the revised portions are tracked.
   *
   * "Yes, it's about imperfection, but specifically how imperfection makes
   * things MORE valuable" — the core insight (imperfection) is confirmed
   * while the framing (negative vs. positive) is revised.
   */
  markPartiallySuperseded(
    profile: EssayProfile,
    insightId: string,
    supersededBy: {
      insightId: string;
      confirmedPortion: string;
      revisedPortion: string;
    },
  ): void {
    const supersedingInsight = profile.conversationInsights.find(
      (ci) => ci.id === supersededBy.insightId,
    );

    if (!supersedingInsight) {
      console.error(
        `[InsightMutator] markPartiallySuperseded: superseding insight ${supersededBy.insightId} not found`,
      );
      return;
    }

    // Set the partial supersession on the superseding insight
    supersedingInsight.partiallySupersedes = {
      insightId,
      confirmedPortion: supersededBy.confirmedPortion,
      revisedPortion: supersededBy.revisedPortion,
    };
  }

  /**
   * Add a pattern insight — meta-observations about the coaching process.
   *
   * Pattern insights inform coaching strategy without polluting the essay profile.
   * They are stored separately from conversation insights.
   *
   * Examples:
   * - "Student keeps circling back to P3 — may indicate unresolved concern"
   * - "Student agrees with feedback but never implements changes in this area"
   */
  addPatternInsight(profile: EssayProfile, pattern: PatternInsight): void {
    // Check for existing pattern with the same ID — update if found
    const existingIdx = profile.patternInsights.findIndex(
      (pi) => pi.id === pattern.id,
    );

    if (existingIdx >= 0) {
      profile.patternInsights[existingIdx] = pattern;
    } else {
      profile.patternInsights.push(pattern);
    }
  }

  /**
   * Get insights by category and scope.
   *
   * Returns all conversation insights matching the specified category,
   * ordered by timestamp (newest first).
   */
  getInsightsByCategory(
    profile: EssayProfile,
    category: InsightCategory,
  ): ConversationInsight[] {
    return profile.conversationInsights
      .filter((ci) => ci.category === category)
      .sort((a, b) => {
        // Newest first
        return b.timestamp.localeCompare(a.timestamp);
      });
  }

  /**
   * Invalidate ephemeral insights affected by text edits.
   *
   * Ephemeral insights are tied to specific text and are invalidated when
   * that text changes. Draft-durable insights survive minor edits but are
   * invalidated by structural rewrites. Essay-durable and student-durable
   * insights are never invalidated by text edits.
   *
   * This method removes insights whose scope overlaps with the edited locations
   * and whose durability level makes them subject to invalidation.
   */
  invalidateEphemeralInsights(
    profile: EssayProfile,
    editedLocations: Array<{ paragraph: number; sentence?: number }>,
  ): void {
    // Build a set of affected paragraph/sentence pairs for fast lookup
    const affectedParagraphs = new Set<number>();
    const affectedSentences = new Set<string>();

    for (const loc of editedLocations) {
      affectedParagraphs.add(loc.paragraph);
      if (loc.sentence !== undefined) {
        affectedSentences.add(`${loc.paragraph}:${loc.sentence}`);
      }
    }

    // Filter out insights that are invalidated by these edits
    profile.conversationInsights = profile.conversationInsights.filter((insight) => {
      // Essay-durable and student-durable insights survive all text edits
      if (insight.durability === 'essay_durable' || insight.durability === 'student_durable') {
        return true;
      }

      // Check if this insight's scope overlaps with edited locations
      const overlaps = this.insightOverlapsLocations(
        insight,
        affectedParagraphs,
        affectedSentences,
      );

      if (!overlaps) {
        return true; // No overlap — keep the insight
      }

      // Ephemeral insights are always invalidated by overlapping edits
      if (insight.durability === 'ephemeral') {
        return false;
      }

      // Draft-durable insights survive minor edits — but since this method
      // is called for ALL edits, the caller is responsible for only calling
      // this on structural rewrites for draft-durable invalidation.
      // For now, we keep draft-durable insights and let the caller decide.
      return true;
    });

    // Update the count
    profile.metadata.conversationInsightsCount = profile.conversationInsights.length;
  }

  /**
   * Validate: insight references valid profile locations.
   *
   * Checks:
   * - Insight scope paragraph/sentence indices are valid
   * - Partial supersession references point to existing insights
   * - Pattern insight IDs are unique
   *
   * @returns Array of validation error messages (empty = valid)
   */
  validate(profile: EssayProfile): string[] {
    const errors: string[] = [];
    const paragraphCount = profile.paragraphs.length;

    // Validate conversation insight scopes
    for (let i = 0; i < profile.conversationInsights.length; i++) {
      const insight = profile.conversationInsights[i];

      // Validate paragraph scope references
      for (const ps of insight.scope.paragraphs) {
        if (ps.index < 0 || ps.index >= paragraphCount) {
          errors.push(`Insight "${insight.id}": scope paragraph ${ps.index} out of range`);
        }
      }

      // Validate sentence scope references
      for (const ss of insight.scope.sentences) {
        if (ss.paragraph < 0 || ss.paragraph >= paragraphCount) {
          errors.push(`Insight "${insight.id}": scope sentence paragraph ${ss.paragraph} out of range`);
        } else if (ss.sentence < 0 || ss.sentence >= profile.paragraphs[ss.paragraph].sentences.length) {
          errors.push(`Insight "${insight.id}": scope sentence ${ss.sentence} out of range in paragraph ${ss.paragraph}`);
        }
      }

      // Validate partial supersession references
      if (insight.partiallySupersedes) {
        const supersededExists = profile.conversationInsights.some(
          (ci) => ci.id === insight.partiallySupersedes!.insightId,
        );
        if (!supersededExists) {
          errors.push(`Insight "${insight.id}": partiallySupersedes references non-existent insight "${insight.partiallySupersedes.insightId}"`);
        }
      }
    }

    // Validate pattern insight IDs are unique
    const patternIds = new Set<string>();
    for (const pi of profile.patternInsights) {
      if (patternIds.has(pi.id)) {
        errors.push(`PatternInsight ID "${pi.id}" is not unique`);
      }
      patternIds.add(pi.id);
    }

    // Validate conversation insight IDs are unique
    const insightIds = new Set<string>();
    for (const ci of profile.conversationInsights) {
      if (insightIds.has(ci.id)) {
        errors.push(`ConversationInsight ID "${ci.id}" is not unique`);
      }
      insightIds.add(ci.id);
    }

    return errors;
  }

  // ── PRIVATE HELPERS ──

  /**
   * Check if an insight's scope overlaps with a set of edited locations.
   */
  private insightOverlapsLocations(
    insight: ConversationInsight,
    affectedParagraphs: Set<number>,
    affectedSentences: Set<string>,
  ): boolean {
    // Check essay-level probability — high essay probability means the insight
    // spans broadly; it overlaps if any paragraph was edited
    if (insight.scope.essayProbability > 0.5 && affectedParagraphs.size > 0) {
      return true;
    }

    // Check paragraph-level overlap
    for (const ps of insight.scope.paragraphs) {
      if (affectedParagraphs.has(ps.index) && ps.probability > 0.3) {
        return true;
      }
    }

    // Check sentence-level overlap
    for (const ss of insight.scope.sentences) {
      if (
        affectedSentences.has(`${ss.paragraph}:${ss.sentence}`) &&
        ss.probability > 0.3
      ) {
        return true;
      }
    }

    return false;
  }
}
