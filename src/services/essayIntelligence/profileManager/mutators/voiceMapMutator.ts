/**
 * VoiceMapMutator — Voice Map Spatial Field Operations
 *
 * The Voice Map tracks voice across 5 dimensions (register, vocabulary fingerprint,
 * sentence rhythm, perspective/distance, tonal disposition) with observations per
 * passage location. It is the spatial complement to VoiceIdentity (which is holistic).
 *
 * Key operations:
 * - Full voice map replacement from L3.75 synthesis
 * - Voice shift entry management (add/remove)
 * - Intentionality assessment updates (e.g., student confirms shift was intentional in L6)
 * - Code-switching event tracking
 * - Per-dimension observation management
 *
 * The voice map is the system's primary tool for distinguishing intentional voice
 * variation (strength) from unintentional drift (weakness). The intentionality
 * assessment on each shift is the map's most critical annotation.
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  VoiceMap,
  VoiceShift,
  VoiceObservation,
  VoiceDimension,
  CodeSwitchEvent,
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
// VOICE MAP MUTATOR
// ============================================================================

export class VoiceMapMutator {
  /**
   * Apply full voice map from L3.75 synthesis (replaces entire voice map).
   *
   * L3.75 produces the authoritative voice map after reading all sentence-level
   * understanding. This is a complete supersession of the entire VoiceMap structure.
   *
   * @returns MutationType[] for staleness propagation
   */
  applyVoiceMap(profile: EssayProfile, voiceMap: VoiceMap): MutationType[] {
    profile.voiceMap = voiceMap;
    return ['voice_shift_added'];
  }

  /**
   * Add a voice shift entry with intentionality assessment.
   *
   * If a shift already exists at the same location, it is replaced (supersession).
   * Each shift is annotated with intentionality and confidence — the critical
   * distinction between a strength (intentional variation) and a weakness
   * (unintentional drift).
   *
   * @returns MutationType[] for staleness propagation
   */
  addShift(profile: EssayProfile, shift: VoiceShift): MutationType[] {
    const errors = this.validateShiftLocation(profile, shift.location);
    if (errors.length > 0) {
      console.error(`[VoiceMapMutator] addShift validation failed:`, errors);
      return [];
    }

    // Check for existing shift at the same location — replace if found
    const existingIdx = profile.voiceMap.shifts.findIndex(
      (s) =>
        s.location.paragraph === shift.location.paragraph &&
        s.location.sentence === shift.location.sentence,
    );

    if (existingIdx >= 0) {
      profile.voiceMap.shifts[existingIdx] = shift;
    } else {
      profile.voiceMap.shifts.push(shift);
    }

    return ['voice_shift_added'];
  }

  /**
   * Remove a voice shift entry at the given location.
   *
   * Used when text containing a voice shift is deleted, or when re-analysis
   * determines the shift was misidentified.
   *
   * @returns MutationType[] for staleness propagation
   */
  removeShift(
    profile: EssayProfile,
    location: { paragraph: number; sentence?: number },
  ): MutationType[] {
    const idx = profile.voiceMap.shifts.findIndex(
      (s) =>
        s.location.paragraph === location.paragraph &&
        s.location.sentence === location.sentence,
    );

    if (idx < 0) {
      return []; // No shift at this location — no-op
    }

    profile.voiceMap.shifts.splice(idx, 1);
    return ['voice_shift_removed'];
  }

  /**
   * Update intentionality assessment for an existing shift by index.
   * Matches the IVoiceMapMutator interface signature.
   *
   * Typically called when the student confirms or denies a shift was intentional
   * during L6 coaching. The intentionality assessment is the most critical
   * annotation on a shift — it determines whether the shift is a strength
   * (intentional variation) or a weakness (unintentional drift).
   *
   * @param shiftIndex - index into profile.voiceMap.shifts[]
   * @returns MutationType[] for staleness propagation
   */
  updateIntentionality(
    profile: EssayProfile,
    shiftIndex: number,
    intentionality: {
      assessment: 'intentional' | 'unintentional' | 'ambiguous';
      confidence: number;
      reasoning: string;
    },
  ): MutationType[] {
    if (shiftIndex < 0 || shiftIndex >= profile.voiceMap.shifts.length) {
      console.error(
        `[VoiceMapMutator] updateIntentionality: shift index ${shiftIndex} out of range [0, ${profile.voiceMap.shifts.length - 1}]`,
      );
      return [];
    }

    const shift = profile.voiceMap.shifts[shiftIndex];
    shift.intentionality = intentionality;
    return ['voice_intentionality_updated'];
  }

  /**
   * Update intentionality assessment for an existing shift by location.
   * Preserved for external callers that have location-based lookup.
   *
   * @returns MutationType[] for staleness propagation
   */
  updateIntentionalityByLocation(
    profile: EssayProfile,
    location: { paragraph: number; sentence?: number },
    intentionality: VoiceShift['intentionality'],
  ): MutationType[] {
    const shift = profile.voiceMap.shifts.find(
      (s) =>
        s.location.paragraph === location.paragraph &&
        s.location.sentence === location.sentence,
    );

    if (!shift) {
      console.error(
        `[VoiceMapMutator] updateIntentionalityByLocation: no shift found at P${location.paragraph}${location.sentence !== undefined ? `S${location.sentence}` : ''}`,
      );
      return [];
    }

    shift.intentionality = intentionality;
    return ['voice_intentionality_updated'];
  }

  /**
   * Add a code-switching event.
   *
   * Code-switching carries cultural weight that generic "voice shift" notation
   * cannot capture. It is always treated as intentional and tracked separately.
   *
   * If a code-switch event already exists at the same location, it is replaced.
   *
   * @returns MutationType[] for staleness propagation
   */
  addCodeSwitchEvent(profile: EssayProfile, event: CodeSwitchEvent): MutationType[] {
    const p = event.location.paragraph;
    const s = event.location.sentence;

    if (p < 0 || p >= profile.paragraphs.length) {
      console.error(`[VoiceMapMutator] addCodeSwitchEvent: paragraph ${p} out of range`);
      return [];
    }
    if (s < 0 || s >= profile.paragraphs[p].sentences.length) {
      console.error(`[VoiceMapMutator] addCodeSwitchEvent: sentence ${s} out of range in paragraph ${p}`);
      return [];
    }

    // Scope 1 Phase 2: codeSwitching is optional — initialize if missing.
    // Mutator still supports writes for backward compat with any external
    // caller (deprecated but not removed).
    if (!profile.voiceMap.codeSwitching) {
      profile.voiceMap.codeSwitching = [];
    }

    // Check for existing code-switch at the same location — replace if found
    const existingIdx = profile.voiceMap.codeSwitching.findIndex(
      (cs) =>
        cs.location.paragraph === event.location.paragraph &&
        cs.location.sentence === event.location.sentence,
    );

    if (existingIdx >= 0) {
      profile.voiceMap.codeSwitching[existingIdx] = event;
    } else {
      profile.voiceMap.codeSwitching.push(event);
    }

    return ['voice_shift_added'];
  }

  /**
   * Add observation to a specific voice dimension.
   *
   * Observations are location-specific notes about voice characteristics at a
   * particular passage. They are additive — new observations are pushed, not
   * replacing existing ones (unless at the same location).
   *
   * @returns MutationType[] for staleness propagation
   */
  addDimensionObservation(
    profile: EssayProfile,
    dimension: VoiceDimension,
    observation: VoiceObservation,
  ): MutationType[] {
    const p = observation.location.paragraph;
    if (p < 0 || p >= profile.paragraphs.length) {
      console.error(`[VoiceMapMutator] addDimensionObservation: paragraph ${p} out of range`);
      return [];
    }

    // Map dimension to the correct VoiceMap field
    const dimensionField = this.getDimensionField(profile, dimension);
    if (!dimensionField) {
      console.error(`[VoiceMapMutator] addDimensionObservation: unknown dimension "${dimension}"`);
      return [];
    }

    // Check for existing observation at the same location — replace if found
    const existingIdx = dimensionField.observations.findIndex(
      (o) =>
        o.location.paragraph === observation.location.paragraph &&
        o.location.sentenceRange?.[0] === observation.location.sentenceRange?.[0] &&
        o.location.sentenceRange?.[1] === observation.location.sentenceRange?.[1],
    );

    if (existingIdx >= 0) {
      dimensionField.observations[existingIdx] = observation;
    } else {
      dimensionField.observations.push(observation);
    }

    return ['voice_shift_added'];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INSIGHT-DRIVEN CASCADE METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mark voice shifts at a given location as intentional.
   *
   * When a student says "I want to keep that informal voice" (preference insight),
   * all voice shifts at the specified paragraph are marked as 'deliberate'.
   * This is the critical distinction between a strength (intentional variation)
   * and a weakness (unintentional drift).
   *
   * Called by: 'preference' insight cascade
   *
   * @param dimension - which voice dimension to look for shifts on (e.g., 'register')
   * @param location - paragraph (and optionally sentence) where the shift occurs
   * @returns MutationType[] for staleness propagation
   */
  markIntentional(
    profile: EssayProfile,
    dimension: string,
    location: ParagraphLocation,
    _source?: InsightSource,
  ): MutationType[] {
    const mutations: MutationType[] = [];

    // Find all shifts at this location (may match multiple dimensions)
    const matchingShifts = profile.voiceMap.shifts.filter((shift) => {
      const locationMatch = shift.location.paragraph === location.paragraph &&
        (location.sentence === undefined || shift.location.sentence === location.sentence);

      // If a specific dimension was requested, also filter by that
      const dimensionMatch = !dimension || shift.dimensions.includes(dimension as VoiceDimension);

      return locationMatch && dimensionMatch;
    });

    if (matchingShifts.length === 0) {
      // No shifts at this location — check if there are ANY shifts at this paragraph
      // and mark them regardless of dimension (student preference applies broadly)
      const paragraphShifts = profile.voiceMap.shifts.filter(
        (s) => s.location.paragraph === location.paragraph,
      );

      for (const shift of paragraphShifts) {
        shift.intentionality = {
          assessment: 'intentional',
          confidence: 0.95,
          reasoning: 'Student confirmed this voice choice is deliberate',
        };
        if (!mutations.includes('voice_intentionality_updated')) {
          mutations.push('voice_intentionality_updated');
        }
      }
    } else {
      for (const shift of matchingShifts) {
        shift.intentionality = {
          assessment: 'intentional',
          confidence: 0.95,
          reasoning: 'Student confirmed this voice choice is deliberate',
        };
        if (!mutations.includes('voice_intentionality_updated')) {
          mutations.push('voice_intentionality_updated');
        }
      }
    }

    return mutations;
  }

  /**
   * Validate voice map: shift points reference valid paragraph boundaries.
   *
   * @returns Array of validation error messages (empty = valid)
   */
  validate(profile: EssayProfile): string[] {
    const errors: string[] = [];
    const paragraphCount = profile.paragraphs.length;

    // Validate shift locations
    for (let i = 0; i < profile.voiceMap.shifts.length; i++) {
      const shift = profile.voiceMap.shifts[i];
      const locationErrors = this.validateShiftLocation(profile, shift.location);
      for (const err of locationErrors) {
        errors.push(`VoiceMap shift[${i}]: ${err}`);
      }

      // Intentionality confidence should be 0-1
      if (shift.intentionality.confidence < 0 || shift.intentionality.confidence > 1) {
        errors.push(`VoiceMap shift[${i}]: intentionality confidence ${shift.intentionality.confidence} outside [0, 1]`);
      }

      // Shifts must reference at least one dimension
      if (shift.dimensions.length === 0) {
        errors.push(`VoiceMap shift[${i}]: no dimensions specified`);
      }
    }

    // Validate code-switching locations.
    // Scope 1 Phase 2: codeSwitching is optional on VoiceMap — iterate the
    // empty array fallback if the field is undefined (new profiles don't
    // emit it; legacy profiles still carry entries that must be validated).
    const codeSwitchingEvents = profile.voiceMap.codeSwitching ?? [];
    for (let i = 0; i < codeSwitchingEvents.length; i++) {
      const cs = codeSwitchingEvents[i];
      const p = cs.location.paragraph;
      const s = cs.location.sentence;
      if (p < 0 || p >= paragraphCount) {
        errors.push(`VoiceMap codeSwitching[${i}]: paragraph ${p} out of range`);
      } else if (s < 0 || s >= profile.paragraphs[p].sentences.length) {
        errors.push(`VoiceMap codeSwitching[${i}]: sentence ${s} out of range in paragraph ${p}`);
      }
    }

    // Validate dimension observations reference valid paragraphs
    const dimensions: VoiceDimension[] = ['register', 'vocabulary', 'rhythm', 'perspective', 'tonal_disposition'];
    for (const dim of dimensions) {
      const field = this.getDimensionField(profile, dim);
      if (!field) continue;

      for (let i = 0; i < field.observations.length; i++) {
        const obs = field.observations[i];
        if (obs.location.paragraph < 0 || obs.location.paragraph >= paragraphCount) {
          errors.push(`VoiceMap ${dim} observation[${i}]: paragraph ${obs.location.paragraph} out of range`);
        }
      }
    }

    return errors;
  }

  // ── PRIVATE HELPERS ──

  /**
   * Get the observation-bearing dimension field from the voice map.
   */
  private getDimensionField(
    profile: EssayProfile,
    dimension: VoiceDimension,
  ): { observations: VoiceObservation[] } | null {
    switch (dimension) {
      case 'register':
        return profile.voiceMap.register;
      case 'vocabulary':
        return profile.voiceMap.vocabularyFingerprint;
      case 'rhythm':
        return profile.voiceMap.sentenceRhythm;
      case 'perspective':
        return profile.voiceMap.perspectiveDistance;
      case 'tonal_disposition':
        return profile.voiceMap.tonalDisposition;
      default:
        return null;
    }
  }

  /**
   * Validate a shift location against the essay structure.
   */
  private validateShiftLocation(
    profile: EssayProfile,
    location: VoiceShift['location'],
  ): string[] {
    const errors: string[] = [];
    const p = location.paragraph;

    if (p < 0 || p >= profile.paragraphs.length) {
      errors.push(`paragraph ${p} out of range [0, ${profile.paragraphs.length - 1}]`);
      return errors;
    }

    if (location.sentence !== undefined) {
      const para = profile.paragraphs[p];
      if (location.sentence < 0 || location.sentence >= para.sentences.length) {
        errors.push(`sentence ${location.sentence} out of range [0, ${para.sentences.length - 1}] in paragraph ${p}`);
      }
    }

    return errors;
  }
}
