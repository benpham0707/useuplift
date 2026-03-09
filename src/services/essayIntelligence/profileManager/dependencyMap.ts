/**
 * Staleness Dependency Map & Staleness Tracker
 *
 * Static configuration declaring cross-domain dependencies in the EssayProfile.
 * When a mutation occurs, the coordinator reads this map to propagate staleness
 * to dependent profile sections. Staleness is NEVER computed dynamically —
 * it follows the declared map, making propagation deterministic and testable.
 *
 * Depth-bounded propagation:
 *   Depth 0 = strong (the changed element itself — must refresh before LLM use)
 *   Depth 1 = moderate (directly connected — include in next relevant LLM call)
 *   Depth 2 = weak (two-hop — logged for information, never triggers refresh)
 *   No depth-3 staleness exists.
 *
 * Spec: docs/plan-sections/04-profile-manager.md Section 3
 */

import type {
  MutationType,
  StalenessEffect,
  StalenessDependencyMap,
  StalenessEntry,
  StalenessTarget,
  StalenessStrength,
  StalenessSnapshot,
  StalenessReport,
  StalenessTracker as IStalenessTracker,
} from '../profileTypes';

// ============================================================================
// STATIC DEPENDENCY MAP
// ============================================================================

/**
 * The complete dependency map. Each entry reads:
 * "When [mutation] occurs, mark [target] as [strength]-stale because [reason]."
 *
 * Dynamic targets (e.g., "paragraph P(n)" where n depends on the mutation context)
 * use placeholder values here. The propagateStaleness() function resolves them
 * at runtime using the mutation context.
 */
export const STALENESS_DEPENDENCY_MAP: StalenessDependencyMap = {
  // ── Sentence understanding changes ──
  sentence_understanding_updated: [
    {
      target: { type: 'paragraph', index: -1 }, // -1 = resolve to the mutated paragraph's index
      strength: 'strong',
      reason: 'Paragraph summary needs refresh after sentence understanding changed',
    },
    {
      target: { type: 'connections', connectionIds: [] }, // [] = resolve to connections involving this sentence
      strength: 'moderate',
      reason: 'Connection descriptions may need updating',
    },
    {
      target: { type: 'holistic', section: 'moment_earnedness_map' },
      strength: 'moderate',
      reason: 'Earned-ness arrows pointing to this sentence may need reassessment — mechanism contribution may have changed',
    },
    {
      target: { type: 'holistic', section: 'voice_identity' },
      strength: 'weak',
      reason: 'Voice signature evidence may have shifted',
    },
  ],

  // ── Sentence analysis changes ──
  sentence_analysis_updated: [
    {
      target: { type: 'paragraph', index: -1 },
      strength: 'moderate',
      reason: 'Paragraph effectiveness may shift after sentence analysis update',
    },
    {
      target: { type: 'holistic', section: 'craft_assessment' },
      strength: 'weak',
      reason: 'Craft strength signatures may need updating',
    },
  ],

  // ── Paragraph role changes ──
  paragraph_role_updated: [
    {
      target: { type: 'holistic', section: 'narrative_strategy' },
      strength: 'moderate',
      reason: 'Role change may affect narrative arc structure',
    },
    {
      target: { type: 'north_star' },
      strength: 'moderate',
      reason: 'Structural roles map may need revision',
    },
    {
      target: { type: 'entanglements' },
      strength: 'weak',
      reason: 'Paragraph role change may affect dimension intersections',
    },
  ],

  // ── Holistic section changes ──
  holistic_section_updated: [
    {
      target: { type: 'entanglements' },
      strength: 'moderate',
      reason: 'Section change may create or invalidate entanglements',
    },
    {
      target: { type: 'holistic', section: 'admissions_positioning' },
      strength: 'weak',
      reason: 'Positioning synthesis draws from all holistic sections',
    },
  ],

  // ── Connection changes ──
  connection_added: [
    {
      target: { type: 'holistic', section: 'narrative_strategy' },
      strength: 'moderate',
      reason: 'New connection may reveal arc structure',
    },
    {
      target: { type: 'holistic', section: 'thematic_architecture' },
      strength: 'moderate',
      reason: 'Connection may carry thematic thread',
    },
    {
      target: { type: 'entanglements' },
      strength: 'moderate',
      reason: 'New entanglement possible between connected elements',
    },
  ],

  connection_removed: [
    {
      target: { type: 'holistic', section: 'narrative_strategy' },
      strength: 'moderate',
      reason: 'Structural understanding may need revision',
    },
    {
      target: { type: 'holistic', section: 'thematic_architecture' },
      strength: 'moderate',
      reason: 'Structural understanding may need revision',
    },
    {
      target: { type: 'entanglements' },
      strength: 'moderate',
      reason: 'Structural understanding may need revision',
    },
  ],

  // ── Voice map changes ──
  voice_shift_added: [
    {
      target: { type: 'holistic', section: 'emotional_topography' },
      strength: 'moderate',
      reason: 'Voice shift may coincide with emotional transition',
    },
    {
      target: { type: 'holistic', section: 'thematic_architecture' },
      strength: 'moderate',
      reason: 'Voice shift may carry thematic weight',
    },
    {
      target: { type: 'holistic', section: 'craft_assessment' },
      strength: 'moderate',
      reason: 'New craft pattern detected',
    },
    {
      target: { type: 'entanglements' },
      strength: 'strong',
      reason: 'Voice-theme or voice-emotion entanglement may exist',
    },
  ],

  voice_shift_removed: [
    {
      target: { type: 'holistic', section: 'emotional_topography' },
      strength: 'moderate',
      reason: 'Entanglement that depended on this shift may be invalid',
    },
    {
      target: { type: 'holistic', section: 'thematic_architecture' },
      strength: 'moderate',
      reason: 'Entanglement that depended on this shift may be invalid',
    },
    {
      target: { type: 'holistic', section: 'craft_assessment' },
      strength: 'moderate',
      reason: 'Entanglement that depended on this shift may be invalid',
    },
    {
      target: { type: 'entanglements' },
      strength: 'moderate',
      reason: 'Entanglement that depended on this shift may be invalid',
    },
  ],

  voice_intentionality_updated: [
    {
      target: { type: 'holistic', section: 'admissions_positioning' },
      strength: 'weak',
      reason: 'Intentional voice choices affect memorability assessment',
    },
  ],

  // ── Earned-ness arrow changes ──
  earnedness_arrow_added: [
    {
      target: { type: 'holistic', section: 'character_revelation' },
      strength: 'moderate',
      reason: 'Earning mechanism may reveal character values',
    },
    {
      target: { type: 'holistic', section: 'admissions_positioning' },
      strength: 'moderate',
      reason: 'Earned moments affect memorability assessment',
    },
    {
      target: { type: 'holistic', section: 'emotional_topography' },
      strength: 'moderate',
      reason: 'Earning mechanism is part of emotional progression',
    },
  ],

  earnedness_arrow_removed: [
    {
      target: { type: 'holistic', section: 'character_revelation' },
      strength: 'moderate',
      reason: 'Emotional progression understanding may need revision',
    },
    {
      target: { type: 'holistic', section: 'admissions_positioning' },
      strength: 'moderate',
      reason: 'Emotional progression understanding may need revision',
    },
    {
      target: { type: 'holistic', section: 'emotional_topography' },
      strength: 'moderate',
      reason: 'Emotional progression understanding may need revision',
    },
  ],

  // ── North Star changes ──
  north_star_updated: [
    {
      target: { type: 'holistic', section: 'voice_identity' },
      strength: 'moderate',
      reason: 'North Star reframes how every dimension is interpreted',
    },
    {
      target: { type: 'holistic', section: 'emotional_topography' },
      strength: 'moderate',
      reason: 'North Star reframes how every dimension is interpreted',
    },
    {
      target: { type: 'holistic', section: 'thematic_architecture' },
      strength: 'moderate',
      reason: 'North Star reframes how every dimension is interpreted',
    },
    {
      target: { type: 'holistic', section: 'narrative_strategy' },
      strength: 'moderate',
      reason: 'North Star reframes how every dimension is interpreted',
    },
    {
      target: { type: 'holistic', section: 'character_revelation' },
      strength: 'moderate',
      reason: 'North Star reframes how every dimension is interpreted',
    },
    {
      target: { type: 'holistic', section: 'craft_assessment' },
      strength: 'moderate',
      reason: 'North Star reframes how every dimension is interpreted',
    },
    {
      target: { type: 'holistic', section: 'admissions_positioning' },
      strength: 'moderate',
      reason: 'North Star reframes how every dimension is interpreted',
    },
    {
      target: { type: 'entanglements' },
      strength: 'strong',
      reason: 'Through-line reinterpretation may invalidate existing entanglements',
    },
  ],

  // ── Conversation insight applied ──
  // Note: The actual staleness effects depend on the insight category.
  // For reinterpretation: affected sentences are strong-stale, holistic sections moderate-stale.
  // For confirmation: no staleness (confidence boosted, nothing invalidated).
  // For new_context: related holistic sections moderate-stale.
  // The coordinator resolves these at runtime based on the insight's category and scope.
  conversation_insight_applied: [
    {
      target: { type: 'holistic', section: 'thematic_architecture' },
      strength: 'moderate',
      reason: 'New student insight may enrich holistic understanding',
    },
    {
      target: { type: 'holistic', section: 'character_revelation' },
      strength: 'moderate',
      reason: 'New student insight may enrich holistic understanding',
    },
  ],
};

// ============================================================================
// STALENESS TARGET KEY HELPERS
// ============================================================================

/**
 * Produces a stable string key for a StalenessTarget, used as the Map key
 * in StalenessTracker.entries.
 */
export function targetKey(target: StalenessTarget): string {
  switch (target.type) {
    case 'holistic':
      return `holistic.${target.section}`;
    case 'paragraph':
      return `p${target.index}`;
    case 'sentence':
      return `p${target.paragraph}.s${target.sentence}`;
    case 'connections':
      return `connections.${target.connectionIds.sort().join(',')}`;
    case 'north_star':
      return 'north_star';
    case 'entanglements':
      return 'entanglements';
  }
}

/**
 * Extracts a domain string from a StalenessTarget, used for byDomain grouping
 * in StalenessReport.
 */
function targetDomain(target: StalenessTarget): string {
  switch (target.type) {
    case 'holistic':
      return 'holistic';
    case 'paragraph':
      return 'paragraph';
    case 'sentence':
      return 'sentence';
    case 'connections':
      return 'connections';
    case 'north_star':
      return 'north_star';
    case 'entanglements':
      return 'entanglements';
  }
}

// ============================================================================
// STALENESS STRENGTH HELPERS
// ============================================================================

const STRENGTH_ORDER: Record<StalenessStrength, number> = {
  strong: 2,
  moderate: 1,
  weak: 0,
};

function isStrongerOrEqual(a: StalenessStrength, b: StalenessStrength): boolean {
  return STRENGTH_ORDER[a] >= STRENGTH_ORDER[b];
}

// ============================================================================
// STALENESS TRACKER IMPLEMENTATION
// ============================================================================

/**
 * StalenessTracker — tracks which profile sections need refreshing.
 *
 * Implementation of the IStalenessTracker interface from profileTypes.
 * Maintains a Map of StalenessEntry objects keyed by target location.
 * Enforces the upgrade-only rule: if a target is already stale at equal
 * or greater strength, new markings at weaker strength are no-ops.
 */
export class StalenessTrackerImpl implements IStalenessTracker {
  entries: Map<string, StalenessEntry> = new Map();
  private lastClearedAt: number | null = null;

  /**
   * Mark an element as stale.
   * If already stale at equal or greater strength, this is a no-op.
   * If stale at weaker strength, upgrades to the stronger marking.
   */
  markStale(
    target: StalenessTarget,
    strength: StalenessStrength,
    reason: string,
    trigger: MutationType,
    depth: 0 | 1 | 2 = 0,
  ): void {
    const key = targetKey(target);
    const existing = this.entries.get(key);

    // If already stale at equal or greater strength, no-op
    if (existing && isStrongerOrEqual(existing.strength, strength)) {
      return;
    }

    this.entries.set(key, {
      target,
      strength,
      reason,
      markedAt: Date.now(),
      triggeredBy: trigger,
      depth,
    });
  }

  /**
   * Clear staleness for a specific element (after it has been refreshed).
   */
  clearStaleness(target: StalenessTarget): void {
    const key = targetKey(target);
    this.entries.delete(key);
    this.lastClearedAt = Date.now();
  }

  /**
   * Clear all staleness of a given strength or weaker.
   * Used for bulk clearing after comprehensive re-analysis.
   */
  clearByStrength(maxStrength: StalenessStrength): void {
    const maxOrder = STRENGTH_ORDER[maxStrength];
    for (const [key, entry] of this.entries) {
      if (STRENGTH_ORDER[entry.strength] <= maxOrder) {
        this.entries.delete(key);
      }
    }
    this.lastClearedAt = Date.now();
  }

  /**
   * Get count of strong-stale entries.
   * Used to determine whether re-analysis should be suggested.
   */
  getStrongStaleCount(): number {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.strength === 'strong') count++;
    }
    return count;
  }

  /**
   * Get a compact staleness snapshot for the Profile Router.
   * Used to decide what to include in LLM context assembly.
   */
  getSnapshot(): StalenessSnapshot {
    const strongEntries: StalenessEntry[] = [];
    const moderateEntries: StalenessEntry[] = [];
    let weakCount = 0;

    for (const entry of this.entries.values()) {
      switch (entry.strength) {
        case 'strong':
          strongEntries.push(entry);
          break;
        case 'moderate':
          moderateEntries.push(entry);
          break;
        case 'weak':
          weakCount++;
          break;
      }
    }

    return {
      strongCount: strongEntries.length,
      moderateCount: moderateEntries.length,
      weakCount,
      strongEntries,
      moderateEntries,
    };
  }

  /**
   * Get full staleness report for external consumers (UI, debugging).
   * Includes domain breakdown and re-analysis suggestion.
   */
  getReport(): StalenessReport {
    const snapshot = this.getSnapshot();
    const weakEntries: StalenessEntry[] = [];
    const byDomain: Record<string, { strong: number; moderate: number; weak: number }> = {};

    for (const entry of this.entries.values()) {
      if (entry.strength === 'weak') {
        weakEntries.push(entry);
      }

      const domain = targetDomain(entry.target);
      if (!byDomain[domain]) {
        byDomain[domain] = { strong: 0, moderate: 0, weak: 0 };
      }
      byDomain[domain][entry.strength]++;
    }

    return {
      snapshot,
      weakEntries,
      reanalysisSuggested: snapshot.strongCount >= 3,
      byDomain,
      lastClearedAt: this.lastClearedAt,
    };
  }
}

// ============================================================================
// STALENESS PROPAGATION
// ============================================================================

/**
 * Context provided to propagateStaleness to resolve dynamic targets.
 * The coordinator fills in the specifics of what was mutated.
 */
export interface PropagationContext {
  /** The paragraph index of the mutated element (for resolving -1 placeholder) */
  paragraphIndex?: number;
  /** The sentence index within the paragraph */
  sentenceIndex?: number;
  /** Connection IDs involved in the mutation */
  connectionIds?: string[];
  /** The insight category (for conversation_insight_applied) */
  insightCategory?: string;
  /** Sentences affected by a conversation insight (for reinterpretation) */
  affectedSentences?: Array<{ paragraph: number; sentence: number }>;
}

/**
 * Propagate staleness based on mutation types and context.
 *
 * 1. Looks up each MutationType in the dependency map.
 * 2. Resolves dynamic targets (paragraph indices, connection endpoints).
 * 3. Calls stalenessTracker.markStale() for each effect.
 * 4. Enforces depth limits: depth 0 = strong, depth 1 = moderate, depth 2 = weak.
 *    No depth-3 staleness is ever created.
 */
export function propagateStaleness(
  tracker: StalenessTrackerImpl,
  mutationTypes: MutationType[],
  context: PropagationContext,
): void {
  for (const mutation of mutationTypes) {
    const effects = STALENESS_DEPENDENCY_MAP[mutation];
    if (!effects) continue;

    for (const effect of effects) {
      const resolvedTarget = resolveTarget(effect.target, context);
      if (!resolvedTarget) continue;

      // Map effect strength to propagation depth
      // Depth 0 = strong (the mutation itself), depth 1 = moderate (direct deps), depth 2 = weak
      const depth = strengthToDepth(effect.strength);

      tracker.markStale(
        resolvedTarget,
        effect.strength,
        effect.reason,
        mutation,
        depth,
      );
    }
  }

  // Handle special case: conversation insight with reinterpretation
  // marks affected sentences as strong-stale
  if (
    mutationTypes.includes('conversation_insight_applied') &&
    context.insightCategory === 'reinterpretation' &&
    context.affectedSentences
  ) {
    for (const loc of context.affectedSentences) {
      tracker.markStale(
        { type: 'sentence', paragraph: loc.paragraph, sentence: loc.sentence },
        'strong',
        'Student explicitly corrected understanding',
        'conversation_insight_applied',
        0,
      );
    }
  }
}

/**
 * Resolve dynamic targets in the dependency map to concrete targets.
 * Returns null if the target cannot be resolved (missing context).
 */
function resolveTarget(
  target: StalenessTarget,
  context: PropagationContext,
): StalenessTarget | null {
  // Paragraph with index -1 means "the mutated paragraph"
  if (target.type === 'paragraph' && target.index === -1) {
    if (context.paragraphIndex === undefined) return null;
    return { type: 'paragraph', index: context.paragraphIndex };
  }

  // Connections with empty connectionIds means "connections involving the mutated sentence"
  if (target.type === 'connections' && target.connectionIds.length === 0) {
    if (!context.connectionIds || context.connectionIds.length === 0) return null;
    return { type: 'connections', connectionIds: context.connectionIds };
  }

  // All other targets are static — return as-is
  return target;
}

/**
 * Map staleness strength to propagation depth.
 * Strong = depth 0 (the changed element), moderate = depth 1 (direct), weak = depth 2 (two-hop).
 */
function strengthToDepth(strength: StalenessStrength): 0 | 1 | 2 {
  switch (strength) {
    case 'strong': return 0;
    case 'moderate': return 1;
    case 'weak': return 2;
  }
}
