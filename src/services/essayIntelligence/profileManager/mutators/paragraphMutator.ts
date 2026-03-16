/**
 * ParagraphMutator — Paragraph-Level Mutations
 *
 * Handles paragraph-level understanding, analysis, structural role updates,
 * and structural bookkeeping (sentence counts, boundaries).
 *
 * Understanding and Analysis are separate sub-objects on ParagraphProfile,
 * never mixed in the same mutation call.
 *
 * Profile Manager spec: docs/plan-sections/04-profile-manager.md
 */

import type {
  EssayProfile,
  ParagraphUnderstanding,
  ParagraphAnalysis,
  ParagraphProfile,
  MutationType,
} from '../../profileTypes';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Safely retrieve a paragraph profile, or return null if index is out of range.
 */
function getParagraph(
  profile: EssayProfile,
  paragraphIndex: number,
): ParagraphProfile | null {
  const para = profile.paragraphs[paragraphIndex];
  return para ?? null;
}

// ============================================================================
// PARAGRAPH MUTATOR
// ============================================================================

export class ParagraphMutator {
  /**
   * Apply paragraph understanding (role, function, narrative contribution).
   * Full supersession -- the entire understanding object is replaced.
   */
  applyParagraphUnderstanding(
    profile: EssayProfile,
    paragraphIndex: number,
    understanding: Partial<ParagraphUnderstanding>,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex);
    if (errors.length > 0) {
      console.error(
        `[ParagraphMutator] applyParagraphUnderstanding validation failed:`,
        errors,
      );
      return [];
    }

    const para = getParagraph(profile, paragraphIndex)!;
    const mutations: MutationType[] = [];

    if (para.understanding) {
      // Merge partial update into existing understanding
      if (understanding.role !== undefined) {
        para.understanding.role = understanding.role;
      }
      if (understanding.function !== undefined) {
        para.understanding.function = understanding.function;
      }
      if (understanding.narrativeContribution !== undefined) {
        para.understanding.narrativeContribution = understanding.narrativeContribution;
      }
      if (understanding.emotionalRegister !== undefined) {
        para.understanding.emotionalRegister = understanding.emotionalRegister;
      }
      if (understanding.craftProfile !== undefined) {
        para.understanding.craftProfile = understanding.craftProfile;
      }
    } else {
      // First time -- create full understanding (fill missing fields with defaults)
      para.understanding = {
        role: understanding.role ?? '',
        function: understanding.function ?? '',
        narrativeContribution: understanding.narrativeContribution ?? '',
        emotionalRegister: understanding.emotionalRegister ?? {
          dominantEmotion: '',
          depth: '',
          authenticity: '',
          showVsTell: '',
          strongestMoment: null,
        },
        craftProfile: understanding.craftProfile ?? {
          rhythmPattern: '',
          imageUsage: '',
          voiceConsistency: '',
          standoutMoment: null,
        },
      };
    }

    mutations.push('paragraph_role_updated');
    return mutations;
  }

  /**
   * Apply paragraph analysis (effectiveness, verdict).
   * Full supersession -- the entire analysis object is replaced.
   */
  applyParagraphAnalysis(
    profile: EssayProfile,
    paragraphIndex: number,
    analysis: ParagraphAnalysis,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex);
    if (errors.length > 0) {
      console.error(
        `[ParagraphMutator] applyParagraphAnalysis validation failed:`,
        errors,
      );
      return [];
    }

    const para = getParagraph(profile, paragraphIndex)!;
    para.analysis = analysis;

    return ['sentence_analysis_updated'];
  }

  /**
   * Update structural role from a simple role string.
   * Matches the IParagraphMutator interface signature.
   *
   * Called by the coordinator during L1 impressions and L2 cartography
   * where only a role string is available. Sets the paragraph's role
   * in understanding, creating a default understanding object if needed.
   */
  updateStructuralRole(
    profile: EssayProfile,
    paragraphIndex: number,
    role: string,
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex);
    if (errors.length > 0) {
      console.error(
        `[ParagraphMutator] updateStructuralRole validation failed:`,
        errors,
      );
      return [];
    }

    const para = getParagraph(profile, paragraphIndex)!;

    if (para.understanding) {
      para.understanding.role = role;
    } else {
      para.understanding = {
        role,
        function: '',
        narrativeContribution: '',
        emotionalRegister: {
          dominantEmotion: '',
          depth: '',
          authenticity: '',
          showVsTell: '',
          strongestMoment: null,
        },
        craftProfile: {
          rhythmPattern: '',
          imageUsage: '',
          voiceConsistency: '',
          standoutMoment: null,
        },
      };
    }

    return ['paragraph_role_updated'];
  }

  /**
   * Update structural role from rich L2 cartography data.
   * Preserves the full domain logic for role updates that include
   * narrative function, strength contribution, and weakness flags.
   *
   * Can be called directly by external consumers that have richer
   * structural data (e.g., L2 cartography with full role objects).
   */
  updateStructuralRoleRich(
    profile: EssayProfile,
    paragraphIndex: number,
    role: {
      role: string;
      narrativeFunction: string;
      strengthContribution: string;
      weaknessFlag: string | null;
    },
  ): MutationType[] {
    const errors = this.validate(profile, paragraphIndex);
    if (errors.length > 0) {
      console.error(
        `[ParagraphMutator] updateStructuralRoleRich validation failed:`,
        errors,
      );
      return [];
    }

    const para = getParagraph(profile, paragraphIndex)!;

    if (para.understanding) {
      para.understanding.role = role.role;
      para.understanding.function = role.narrativeFunction;
    } else {
      para.understanding = {
        role: role.role,
        function: role.narrativeFunction,
        narrativeContribution: '',
        emotionalRegister: {
          dominantEmotion: '',
          depth: '',
          authenticity: '',
          showVsTell: '',
          strongestMoment: null,
        },
        craftProfile: {
          rhythmPattern: '',
          imageUsage: '',
          voiceConsistency: '',
          standoutMoment: null,
        },
      };
    }

    // Add structural tags based on the role
    if (role.weaknessFlag) {
      if (!para.tags.includes(`weakness:${role.weaknessFlag}`)) {
        para.tags.push(`weakness:${role.weaknessFlag}`);
      }
    }
    if (role.strengthContribution) {
      if (!para.tags.includes(`strength:${role.strengthContribution}`)) {
        para.tags.push(`strength:${role.strengthContribution}`);
      }
    }

    return ['paragraph_role_updated'];
  }

  /**
   * Update paragraph tags (deduplicated).
   * Matches the IParagraphMutator interface signature.
   */
  updateParagraphTags(
    profile: EssayProfile,
    paragraphIndex: number,
    tags: string[],
  ): void {
    const errors = this.validate(profile, paragraphIndex);
    if (errors.length > 0) {
      console.error(
        `[ParagraphMutator] updateParagraphTags validation failed:`,
        errors,
      );
      return;
    }

    const para = getParagraph(profile, paragraphIndex)!;

    for (const tag of tags) {
      if (!para.tags.includes(tag)) {
        para.tags.push(tag);
      }
    }
  }

  /**
   * Update structural bookkeeping (sentence counts, boundaries).
   * Matches the IParagraphMutator interface signature.
   *
   * Accepts the total paragraph count and an array of sentence counts
   * (one per paragraph). Updates the index digest for each paragraph.
   */
  updateStructuralBookkeeping(
    profile: EssayProfile,
    paragraphCount: number,
    sentenceCounts: number[],
  ): void {
    for (let i = 0; i < Math.min(paragraphCount, sentenceCounts.length); i++) {
      const digest = profile.index.paragraphDigest.find(
        (d) => d.index === i,
      );
      if (digest) {
        digest.sentenceCount = sentenceCounts[i];
      }
    }
  }

  /**
   * Validate paragraph index in range.
   */
  validate(profile: EssayProfile, paragraphIndex: number): string[] {
    const errors: string[] = [];

    if (paragraphIndex < 0 || paragraphIndex >= profile.paragraphs.length) {
      errors.push(
        `Paragraph index ${paragraphIndex} out of range [0, ${profile.paragraphs.length - 1}]`,
      );
    }

    return errors;
  }
}
