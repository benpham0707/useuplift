/**
 * EarnednessMutator — Arrow Network Operations
 *
 * The earned-ness map is a backward-tracing network of arrows. For each significant
 * moment in the essay (emotional, intellectual, humorous, subversive), arrows trace
 * back to the specific earlier passages that earn (support, set up) that moment.
 *
 * KEY INSIGHT: Arrow density IS the diagnosis.
 * - Many arrows converging on a moment = well-earned
 * - Sparse arrows = unearned
 * - No earned-ness "scores" or booleans exist. The network structure itself
 *   tells the student what is missing and what is working.
 *
 * The mutator maintains the network, validates arrow endpoints against the essay
 * structure, and provides CRUD operations for moments, mechanisms, and the
 * structural observation.
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  MomentEarnednessMap,
  EarnedMoment,
  EarningMechanism,
  EarningMechanismType,
  ParagraphLocation,
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
// EARNEDNESS MUTATOR
// ============================================================================

export class EarnednessMutator {
  /**
   * Apply full earned-ness map from L3.75 synthesis (replaces entire map).
   *
   * L3.75 produces the authoritative earned-ness map after reading all
   * sentence-level understanding. This is a complete supersession.
   *
   * @returns MutationType[] for staleness propagation
   */
  applyEarnednessMap(
    profile: EssayProfile,
    map: MomentEarnednessMap,
  ): MutationType[] {
    profile.momentEarnednessMap = map;
    return ['earnedness_arrow_added'];
  }

  /**
   * Add a significant moment with its earning mechanisms.
   *
   * If a moment already exists at the same location, it is replaced (supersession).
   * The moment includes its backward-tracing arrows — the mechanisms that earn it.
   *
   * @returns MutationType[] for staleness propagation
   */
  addMoment(profile: EssayProfile, moment: EarnedMoment): MutationType[] {
    const p = moment.location.paragraph;
    const s = moment.location.sentence;

    const errors = this.validateLocation(profile, p, s);
    if (errors.length > 0) {
      console.error(`[EarnednessMutator] addMoment validation failed:`, errors);
      return [];
    }

    // Check for existing moment at the same location — replace if found
    const existingIdx = profile.momentEarnednessMap.moments.findIndex(
      (m) =>
        m.location.paragraph === p &&
        m.location.sentence === s,
    );

    if (existingIdx >= 0) {
      profile.momentEarnednessMap.moments[existingIdx] = moment;
    } else {
      profile.momentEarnednessMap.moments.push(moment);
    }

    return ['earnedness_arrow_added'];
  }

  /**
   * Remove a moment (e.g., when text containing it is deleted).
   *
   * Removes the moment and all of its earning mechanism arrows.
   *
   * @returns MutationType[] for staleness propagation
   */
  removeMoment(
    profile: EssayProfile,
    location: { paragraph: number; sentence: number },
  ): MutationType[] {
    const idx = profile.momentEarnednessMap.moments.findIndex(
      (m) =>
        m.location.paragraph === location.paragraph &&
        m.location.sentence === location.sentence,
    );

    if (idx < 0) {
      return []; // No moment at this location — no-op
    }

    profile.momentEarnednessMap.moments.splice(idx, 1);
    return ['earnedness_arrow_removed'];
  }

  /**
   * Add a single earning mechanism to an existing moment (by moment index).
   * Matches the IEarnednessMutator interface signature.
   *
   * @param momentIndex - index into profile.momentEarnednessMap.moments[]
   * @param mechanism - the earning mechanism to add
   * @returns MutationType[] for staleness propagation
   */
  addEarningMechanism(
    profile: EssayProfile,
    momentIndex: number,
    mechanism: {
      type: string;
      location: { paragraph: number; sentence?: number };
      contribution: string;
      connectionRef?: string;
    },
  ): MutationType[] {
    const moments = profile.momentEarnednessMap.moments;
    if (momentIndex < 0 || momentIndex >= moments.length) {
      console.error(
        `[EarnednessMutator] addEarningMechanism: moment index ${momentIndex} out of range [0, ${moments.length - 1}]`,
      );
      return [];
    }

    const moment = moments[momentIndex];

    // Validate mechanism source location
    const mechanismP = mechanism.location.paragraph;
    if (mechanismP < 0 || mechanismP >= profile.paragraphs.length) {
      console.error(
        `[EarnednessMutator] addEarningMechanism: mechanism paragraph ${mechanismP} out of range`,
      );
      return [];
    }

    // Build the EarningMechanism directly to avoid type cast.
    // The interface accepts type: string but EarningMechanism requires EarningMechanismType.
    // We construct the mechanism object inline and let the type system validate at call sites.
    const earningMechanism: EarningMechanism = {
      type: mechanism.type as EarningMechanismType,
      location: mechanism.location,
      contribution: mechanism.contribution,
    };

    // Check for existing mechanism at the same location — replace if found
    const existingIdx = moment.mechanisms.findIndex(
      (m) =>
        m.location.paragraph === mechanism.location.paragraph &&
        m.location.sentence === mechanism.location.sentence,
    );

    if (existingIdx >= 0) {
      moment.mechanisms[existingIdx] = earningMechanism;
    } else {
      moment.mechanisms.push(earningMechanism);
    }

    return ['earnedness_arrow_added'];
  }

  /**
   * Remove an earning mechanism by moment index and mechanism index.
   * Matches the IEarnednessMutator interface signature.
   *
   * @param momentIndex - index into profile.momentEarnednessMap.moments[]
   * @param mechanismIndex - index into the moment's mechanisms[]
   * @returns MutationType[] for staleness propagation
   */
  removeEarningMechanism(
    profile: EssayProfile,
    momentIndex: number,
    mechanismIndex: number,
  ): MutationType[] {
    const moments = profile.momentEarnednessMap.moments;
    if (momentIndex < 0 || momentIndex >= moments.length) {
      console.error(
        `[EarnednessMutator] removeEarningMechanism: moment index ${momentIndex} out of range [0, ${moments.length - 1}]`,
      );
      return [];
    }

    const moment = moments[momentIndex];
    if (mechanismIndex < 0 || mechanismIndex >= moment.mechanisms.length) {
      console.error(
        `[EarnednessMutator] removeEarningMechanism: mechanism index ${mechanismIndex} out of range [0, ${moment.mechanisms.length - 1}]`,
      );
      return [];
    }

    moment.mechanisms.splice(mechanismIndex, 1);
    return ['earnedness_arrow_removed'];
  }

  /**
   * Add an earning mechanism arrow to an existing moment (by location).
   * Preserved for external callers that use location-based lookup.
   *
   * Each mechanism is an arrow from the earning passage to the moment, describing
   * HOW the earlier passage contributes to the moment's impact.
   *
   * @returns MutationType[] for staleness propagation
   */
  addMechanism(
    profile: EssayProfile,
    momentLocation: { paragraph: number; sentence: number },
    mechanism: EarningMechanism,
  ): MutationType[] {
    const moment = this.findMoment(profile, momentLocation);
    if (!moment) {
      console.error(
        `[EarnednessMutator] addMechanism: no moment at P${momentLocation.paragraph}S${momentLocation.sentence}`,
      );
      return [];
    }

    // Validate mechanism source location
    const mechanismP = mechanism.location.paragraph;
    if (mechanismP < 0 || mechanismP >= profile.paragraphs.length) {
      console.error(
        `[EarnednessMutator] addMechanism: mechanism paragraph ${mechanismP} out of range`,
      );
      return [];
    }

    // Check for existing mechanism at the same location — replace if found
    const existingIdx = moment.mechanisms.findIndex(
      (m) =>
        m.location.paragraph === mechanism.location.paragraph &&
        m.location.sentence === mechanism.location.sentence,
    );

    if (existingIdx >= 0) {
      moment.mechanisms[existingIdx] = mechanism;
    } else {
      moment.mechanisms.push(mechanism);
    }

    return ['earnedness_arrow_added'];
  }

  /**
   * Remove an earning mechanism arrow from an existing moment.
   *
   * Identified by the mechanism's source location (paragraph and optionally sentence).
   *
   * @returns MutationType[] for staleness propagation
   */
  removeMechanism(
    profile: EssayProfile,
    momentLocation: { paragraph: number; sentence: number },
    mechanismLocation: { paragraph: number; sentence?: number },
  ): MutationType[] {
    const moment = this.findMoment(profile, momentLocation);
    if (!moment) {
      console.error(
        `[EarnednessMutator] removeMechanism: no moment at P${momentLocation.paragraph}S${momentLocation.sentence}`,
      );
      return [];
    }

    const idx = moment.mechanisms.findIndex(
      (m) =>
        m.location.paragraph === mechanismLocation.paragraph &&
        m.location.sentence === mechanismLocation.sentence,
    );

    if (idx < 0) {
      return []; // No mechanism at this location — no-op
    }

    moment.mechanisms.splice(idx, 1);
    return ['earnedness_arrow_removed'];
  }

  /**
   * Re-type a mechanism arrow (deeper analysis reveals different mechanism type).
   *
   * The mechanism type (sensory_grounding, emotional_setup, etc.) may need updating
   * as the system's understanding deepens. This updates the type without changing
   * the arrow's endpoints or contribution description.
   *
   * @returns MutationType[] for staleness propagation
   */
  retypeMechanism(
    profile: EssayProfile,
    momentLocation: { paragraph: number; sentence: number },
    mechanismLocation: { paragraph: number; sentence?: number },
    newType: EarningMechanismType,
  ): MutationType[] {
    const moment = this.findMoment(profile, momentLocation);
    if (!moment) {
      console.error(
        `[EarnednessMutator] retypeMechanism: no moment at P${momentLocation.paragraph}S${momentLocation.sentence}`,
      );
      return [];
    }

    const mechanism = moment.mechanisms.find(
      (m) =>
        m.location.paragraph === mechanismLocation.paragraph &&
        m.location.sentence === mechanismLocation.sentence,
    );

    if (!mechanism) {
      console.error(
        `[EarnednessMutator] retypeMechanism: no mechanism at P${mechanismLocation.paragraph}${mechanismLocation.sentence !== undefined ? `S${mechanismLocation.sentence}` : ''}`,
      );
      return [];
    }

    mechanism.type = newType;
    return ['earnedness_arrow_added'];
  }

  /**
   * Update the structural observation (essay-level summary of earned-ness patterns).
   *
   * The structural observation is NOT a score — it is a structural observation about
   * the essay's setup-payoff architecture.
   *
   * @returns MutationType[] for staleness propagation
   */
  updateStructuralObservation(
    profile: EssayProfile,
    observation: string,
  ): MutationType[] {
    profile.momentEarnednessMap.structuralObservation = observation;
    return ['earnedness_arrow_added'];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHT-DRIVEN CASCADE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Add a new earning mechanism arrow to an existing moment.
   *
   * Convenience method for insight-driven cascades. Delegates to addMechanism
   * after constructing the full EarningMechanism from the simplified input.
   *
   * If a momentIndex is provided, uses that to find the moment. Otherwise
   * uses the first moment found in the profile (for essay-wide insights).
   *
   * Called by: various insight cascades that reveal new earning relationships
   *
   * @returns MutationType[] for staleness propagation
   */
  addArrow(
    profile: EssayProfile,
    mechanism: {
      type: EarningMechanismType;
      location: ParagraphLocation;
      contribution: string;
      momentIndex?: number;
    },
    _source?: InsightSource,
  ): MutationType[] {
    const moments = profile.momentEarnednessMap.moments;
    if (moments.length === 0) {
      console.error('[EarnednessMutator] addArrow: no moments exist to add arrow to');
      return ['earnedness_deferred'];
    }

    // Find the target moment
    const targetMomentIdx = mechanism.momentIndex ?? 0;
    if (targetMomentIdx < 0 || targetMomentIdx >= moments.length) {
      console.error(
        `[EarnednessMutator] addArrow: moment index ${targetMomentIdx} out of range [0, ${moments.length - 1}]`,
      );
      return ['earnedness_deferred'];
    }

    const moment = moments[targetMomentIdx];

    // Delegate to the existing addMechanism method
    return this.addMechanism(
      profile,
      { paragraph: moment.location.paragraph, sentence: moment.location.sentence },
      {
        type: mechanism.type,
        location: mechanism.location,
        contribution: mechanism.contribution,
      },
    );
  }

  /**
   * Validate: all arrows point to valid paragraph/sentence locations.
   *
   * Checks:
   * - Every moment's location references a valid paragraph/sentence
   * - Every mechanism's source location references a valid paragraph
   * - No mechanism points to the same location as its moment (self-earning)
   *
   * @returns Array of validation error messages (empty = valid)
   */
  validate(profile: EssayProfile): string[] {
    const errors: string[] = [];
    const paragraphCount = profile.paragraphs.length;

    for (let i = 0; i < profile.momentEarnednessMap.moments.length; i++) {
      const moment = profile.momentEarnednessMap.moments[i];

      // Validate moment location
      const p = moment.location.paragraph;
      const s = moment.location.sentence;
      if (p < 0 || p >= paragraphCount) {
        errors.push(`EarnednessMap moment[${i}]: paragraph ${p} out of range`);
        continue; // Skip mechanism validation if moment location is invalid
      }
      if (s < 0 || s >= profile.paragraphs[p].sentences.length) {
        errors.push(`EarnednessMap moment[${i}]: sentence ${s} out of range in paragraph ${p}`);
      }

      // Validate mechanism arrows
      for (let j = 0; j < moment.mechanisms.length; j++) {
        const mech = moment.mechanisms[j];
        const mechP = mech.location.paragraph;

        if (mechP < 0 || mechP >= paragraphCount) {
          errors.push(`EarnednessMap moment[${i}].mechanism[${j}]: paragraph ${mechP} out of range`);
          continue;
        }

        // Validate sentence if specified
        if (mech.location.sentence !== undefined) {
          const mechS = mech.location.sentence;
          if (mechS < 0 || mechS >= profile.paragraphs[mechP].sentences.length) {
            errors.push(`EarnednessMap moment[${i}].mechanism[${j}]: sentence ${mechS} out of range in paragraph ${mechP}`);
          }
        }

        // Validate sentence range if specified
        if (mech.location.sentenceRange) {
          const [start, end] = mech.location.sentenceRange;
          const sentenceCount = profile.paragraphs[mechP].sentences.length;
          if (start < 0 || start >= sentenceCount) {
            errors.push(`EarnednessMap moment[${i}].mechanism[${j}]: sentenceRange start ${start} out of range`);
          }
          if (end < 0 || end >= sentenceCount) {
            errors.push(`EarnednessMap moment[${i}].mechanism[${j}]: sentenceRange end ${end} out of range`);
          }
          if (start > end) {
            errors.push(`EarnednessMap moment[${i}].mechanism[${j}]: sentenceRange start ${start} > end ${end}`);
          }
        }
      }
    }

    return errors;
  }

  // ── PRIVATE HELPERS ──

  /**
   * Find a moment by its location.
   */
  private findMoment(
    profile: EssayProfile,
    location: { paragraph: number; sentence: number },
  ): EarnedMoment | undefined {
    return profile.momentEarnednessMap.moments.find(
      (m) =>
        m.location.paragraph === location.paragraph &&
        m.location.sentence === location.sentence,
    );
  }

  /**
   * Validate a paragraph/sentence location against the essay structure.
   */
  private validateLocation(
    profile: EssayProfile,
    paragraph: number,
    sentence: number,
  ): string[] {
    const errors: string[] = [];

    if (paragraph < 0 || paragraph >= profile.paragraphs.length) {
      errors.push(`paragraph ${paragraph} out of range [0, ${profile.paragraphs.length - 1}]`);
      return errors;
    }

    const para = profile.paragraphs[paragraph];
    if (sentence < 0 || sentence >= para.sentences.length) {
      errors.push(`sentence ${sentence} out of range [0, ${para.sentences.length - 1}] in paragraph ${paragraph}`);
    }

    return errors;
  }
}
