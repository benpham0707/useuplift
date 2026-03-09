/**
 * NorthStarMutator — Essay-Type Scaling Validation
 *
 * The North Star is the system's understanding of how an essay MEANS — not what
 * it says or how well, but the architecture by which individual moments compose
 * into a unified act of self-revelation.
 *
 * Five dimensions, scaled by essay type:
 * - Supplement (<250 words): 2 dims — structuralRolesMap + distinctivenessSignature
 * - PIQ (~350 words): 3 dims — + trajectory
 * - Personal Statement (~650 words): all 5 dims — + throughLineMap + intentBridge
 *
 * CRITICAL: The mutator validates essay-type scaling. Supplements MUST NOT have
 * throughLineMap, trajectory, or intentBridge. PIQs MUST NOT have throughLineMap
 * or intentBridge. Violations are rejected.
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  EssayNorthStar,
  NorthStarScale,
  IntentBridge,
  EssayTrajectory,
  MutationType,
} from '../../profileTypes';

// Type alias for the L4 output (same shape as EssayNorthStar)
type NorthStarOutput = EssayNorthStar;

// ============================================================================
// ACTIVE DIMENSION CONFIGURATION
// ============================================================================

/**
 * Defines which North Star dimensions are active for each essay type.
 * This is the authoritative scaling rule.
 */
const ACTIVE_DIMENSIONS: Record<NorthStarScale, string[]> = {
  supplement: ['structuralRolesMap', 'distinctivenessSignature'],
  piq: ['structuralRolesMap', 'distinctivenessSignature', 'trajectory'],
  personal_statement: [
    'throughLineMap',
    'structuralRolesMap',
    'trajectory',
    'distinctivenessSignature',
    'intentBridge',
  ],
};

// ============================================================================
// NORTH STAR MUTATOR
// ============================================================================

export class NorthStarMutator {
  /**
   * Apply North Star crystallization from L4.
   *
   * Validates that dimensions present match the essay type:
   * - supplement: throughLineMap=null, trajectory=null, intentBridge=null
   * - piq: throughLineMap=null, intentBridge=null
   * - personal_statement: all 5 dimensions allowed
   *
   * If the output contains dimensions invalid for the essay type, those dimensions
   * are forcibly nulled and a warning is logged. The valid dimensions are still applied.
   *
   * @returns MutationType[] for staleness propagation
   */
  applyNorthStar(profile: EssayProfile, output: NorthStarOutput): MutationType[] {
    const scale = output.activeScale;
    const activeDims = ACTIVE_DIMENSIONS[scale];

    // Apply the North Star with scaling validation
    profile.northStar.activeScale = scale;
    profile.northStar.confidence = output.confidence;
    profile.northStar.lastUpdatedBy = output.lastUpdatedBy;

    // Always apply dimensions that are active for all essay types
    profile.northStar.structuralRolesMap = output.structuralRolesMap;
    profile.northStar.distinctivenessSignature = output.distinctivenessSignature;

    // Conditionally apply through-line map
    if (activeDims.includes('throughLineMap')) {
      profile.northStar.throughLineMap = output.throughLineMap;
    } else if (output.throughLineMap !== null) {
      console.warn(
        `[NorthStarMutator] throughLineMap provided for ${scale} essay — forcibly nulled (only personal_statement supports this dimension)`,
      );
      profile.northStar.throughLineMap = null;
    } else {
      profile.northStar.throughLineMap = null;
    }

    // Conditionally apply trajectory
    if (activeDims.includes('trajectory')) {
      profile.northStar.trajectory = output.trajectory;
    } else if (output.trajectory !== null) {
      console.warn(
        `[NorthStarMutator] trajectory provided for ${scale} essay — forcibly nulled (only piq and personal_statement support this dimension)`,
      );
      profile.northStar.trajectory = null;
    } else {
      profile.northStar.trajectory = null;
    }

    // Conditionally apply intent bridge
    if (activeDims.includes('intentBridge')) {
      profile.northStar.intentBridge = output.intentBridge;
    } else if (output.intentBridge !== null) {
      console.warn(
        `[NorthStarMutator] intentBridge provided for ${scale} essay — forcibly nulled (only personal_statement supports this dimension)`,
      );
      profile.northStar.intentBridge = null;
    } else {
      profile.northStar.intentBridge = null;
    }

    return ['north_star_updated'];
  }

  /**
   * Update intent bridge from L6 conversation.
   *
   * The intent bridge holds the student's stated understanding alongside the
   * system's understanding. It is populated primarily through L6 conversation.
   * Only valid for personal_statement essays.
   *
   * @returns MutationType[] for staleness propagation
   */
  updateIntentBridge(profile: EssayProfile, bridge: IntentBridge): MutationType[] {
    if (profile.northStar.activeScale !== 'personal_statement') {
      console.warn(
        `[NorthStarMutator] updateIntentBridge called for ${profile.northStar.activeScale} essay — intentBridge only valid for personal_statement`,
      );
      return [];
    }

    profile.northStar.intentBridge = bridge;
    profile.northStar.lastUpdatedBy = 'L6';
    return ['north_star_updated'];
  }

  /**
   * Update trajectory (e.g., after student reveals new context).
   *
   * Only valid for piq and personal_statement essays.
   *
   * @returns MutationType[] for staleness propagation
   */
  updateTrajectory(profile: EssayProfile, trajectory: EssayTrajectory): MutationType[] {
    if (profile.northStar.activeScale === 'supplement') {
      console.warn(
        `[NorthStarMutator] updateTrajectory called for supplement essay — trajectory not supported for supplements`,
      );
      return [];
    }

    profile.northStar.trajectory = trajectory;
    return ['north_star_updated'];
  }

  /**
   * Get active dimensions for the current essay type.
   *
   * Returns the list of dimension names that are active for this essay type.
   * Used by consumers to know which North Star fields to expect to be populated.
   */
  getActiveDimensions(activeScale: NorthStarScale): string[] {
    return ACTIVE_DIMENSIONS[activeScale] ?? [];
  }

  /**
   * Validate: dimensions match essay type. Reject invalid dimensions.
   *
   * Checks:
   * - Null dimensions that SHOULD be null for the essay type ARE null
   * - Non-null dimensions that should be null for the essay type are flagged
   * - Structural roles reference valid paragraph indices
   * - Through-line map journey points reference valid locations
   * - Trajectory unrealized connections reference valid locations
   *
   * @returns Array of validation error messages (empty = valid)
   */
  validate(profile: EssayProfile): string[] {
    const errors: string[] = [];
    const scale = profile.northStar.activeScale;
    const activeDims = ACTIVE_DIMENSIONS[scale];
    const paragraphCount = profile.paragraphs.length;

    // Check null constraints based on essay type
    if (!activeDims.includes('throughLineMap') && profile.northStar.throughLineMap !== null) {
      errors.push(`NorthStar: throughLineMap should be null for ${scale} essay, but is populated`);
    }
    if (!activeDims.includes('trajectory') && profile.northStar.trajectory !== null) {
      errors.push(`NorthStar: trajectory should be null for ${scale} essay, but is populated`);
    }
    if (!activeDims.includes('intentBridge') && profile.northStar.intentBridge !== null) {
      errors.push(`NorthStar: intentBridge should be null for ${scale} essay, but is populated`);
    }

    // Validate structural roles reference valid paragraphs
    for (let i = 0; i < profile.northStar.structuralRolesMap.length; i++) {
      const role = profile.northStar.structuralRolesMap[i];
      for (const p of role.paragraphs) {
        if (p < 0 || p >= paragraphCount) {
          errors.push(`NorthStar structuralRole[${i}] "${role.role}": paragraph ${p} out of range`);
        }
      }
    }

    // Validate through-line map journey points (if present)
    if (profile.northStar.throughLineMap) {
      for (let i = 0; i < profile.northStar.throughLineMap.journey.length; i++) {
        const point = profile.northStar.throughLineMap.journey[i];
        const p = point.location.paragraph;
        if (p < 0 || p >= paragraphCount) {
          errors.push(`NorthStar throughLineMap journey[${i}]: paragraph ${p} out of range`);
        }
      }
    }

    // Validate trajectory unrealized connections (if present)
    if (profile.northStar.trajectory) {
      for (let i = 0; i < profile.northStar.trajectory.unrealizedConnections.length; i++) {
        const conn = profile.northStar.trajectory.unrealizedConnections[i];
        for (const [p, s] of conn.locations) {
          if (p < 0 || p >= paragraphCount) {
            errors.push(`NorthStar trajectory unrealizedConnection[${i}]: paragraph ${p} out of range`);
          } else if (s < 0 || s >= profile.paragraphs[p].sentences.length) {
            errors.push(`NorthStar trajectory unrealizedConnection[${i}]: sentence ${s} out of range in paragraph ${p}`);
          }
        }
      }
    }

    return errors;
  }
}
