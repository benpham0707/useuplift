/**
 * archetypeTypes.ts — Round 7c Phase 1: Archetype Baseline Library (types).
 *
 * Type surface for the archetype library + resolver. Consumed by:
 *   - archetypeLibrary.ts (baseline data)
 *   - archetypeDistance.ts (distance computation)
 *   - future coaching / prompt surfaces
 *
 * Design:
 *   - Closed set of 20 archetype IDs + 'other' escape hatch.
 *   - Baselines are HUMAN-CURATED. LLM-assisted expansion deferred to a
 *     future round (see review note in archetypeLibrary.ts).
 *   - `typicalDevices[]` MUST use values from the Round 7b `RhetoricalDeviceType`
 *     canonical union — enforced at build time via the type system AND
 *     re-checked at runtime by the unit test.
 *
 * Philosophy: specificity over coverage. An archetype baseline is a lens
 * for the coach to point at, not a scoring rubric. Fields like
 * `commonFailureModes` and `rareDifferentiators` are what the coach cites
 * verbatim — they must be *specific and earned*, not platitudes.
 */

// === Round 7c: Archetype Distance ===

import type { RhetoricalDeviceType } from '../profileTypes';

/**
 * Closed set of archetype IDs. 'other' is the ONLY escape hatch; the
 * resolver is deliberately conservative and prefers 'other' to a wrong
 * specific match.
 */
export type ArchetypeId =
  | 'immigrant_parent_sacrifice'
  | 'stem_epiphany'
  | 'sports_injury_comeback'
  | 'identity_discovery'
  | 'grief_processing'
  | 'activism_awakening'
  | 'family_illness'
  | 'arts_breakthrough'
  | 'refugee_resettlement'
  | 'bilingual_code_switching'
  | 'first_gen_navigation'
  | 'mental_health_journey'
  | 'coming_out'
  | 'religious_evolution'
  | 'entrepreneurial_origin'
  | 'tutor_mentor_revelation'
  | 'failure_and_rebuild'
  | 'travel_awakening'
  | 'community_loss'
  | 'hidden_talent_reveal'
  | 'other';

/**
 * ArchetypeBaseline — the canonical reference essay for an archetype.
 *
 * Drives distance computation: an essay's claim/craft/voice/arc/structure
 * signals are compared against this baseline to quantify how far the essay
 * is from a textbook rendering of the archetype.
 *
 * NULL SEMANTICS: there is no null baseline. The 'other' id has a stub
 * baseline with empty arrays — callers that resolve to 'other' MUST short-
 * circuit distance computation (see computeArchetypeDistance).
 */
export interface ArchetypeBaseline {
  /** Canonical ID */
  id: ArchetypeId;
  /** Human-readable display name for UI / logs */
  displayName: string;
  /** One sentence describing the archetype. */
  oneLineDescription: string;
  /**
   * 3-6 canonical claim patterns a textbook rendering asserts. Compared
   * against the essay's claimEarnednessMap.assessments[].claimText via
   * token-overlap Jaccard similarity.
   *
   * For the 'other' baseline this is an empty array.
   */
  typicalClaims: string[];
  /**
   * 2-4 rhetorical devices commonly wielded by this archetype. Every entry
   * MUST be a valid RhetoricalDeviceType (enforced by the unit test against
   * the taxonomy map).
   *
   * For the 'other' baseline this is an empty array.
   */
  typicalDevices: RhetoricalDeviceType[];
  /**
   * 4-7 beat sequence describing the archetype's emotional arc. Compared
   * to the essay's beat sequence via normalized Levenshtein edit distance.
   *
   * For the 'other' baseline this is an empty array.
   */
  typicalEmotionalArc: string[];
  /** Typical structural shape — categorical match vs essay's detected shape. */
  typicalStructuralShape:
    | 'linear'
    | 'circular'
    | 'flashback_anchored'
    | 'dual_timeline'
    | 'fragmented';
  /**
   * Typical voice register. Matched against profile.voiceIdentity.register
   * (with fallbacks documented in archetypeDistance.ts).
   */
  typicalVoiceRegister:
    | 'intimate'
    | 'reflective'
    | 'urgent'
    | 'wry'
    | 'ceremonial'
    | 'plainspoken';
  /**
   * 2-4 common failure modes — specific craft failures the coach will cite
   * verbatim when an essay exhibits them. NOT generic ("add more detail") —
   * must name the exact beat or rhetorical misstep ("breaks the gratitude
   * beat by interrogating whether the sacrifice was necessary" — but as
   * what to *avoid*).
   *
   * For the 'other' baseline this is an empty array.
   */
  commonFailureModes: string[];
  /**
   * 2-4 rare differentiators — what transcends the archetype. The coach
   * cites these when flagging breakout moves the essay is making.
   *
   * For the 'other' baseline this is an empty array.
   */
  rareDifferentiators: string[];
  /**
   * 1-2 sentences on how a committee files this essay in the first 30
   * seconds. Used to frame AO-pattern-matching guidance in coaching.
   */
  aoTypicalReaction: string;
}

// === /Round 7c: Archetype Distance ===
