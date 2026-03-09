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
          weaknessMoment: null,
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
   * Update structural role from L2 cartography.
   * This updates the paragraph's understanding with structural context,
   * superseding any previous role assignment.
   */
  updateStructuralRole(
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
        `[ParagraphMutator] updateStructuralRole validation failed:`,
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
          weaknessMoment: null,
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
   * Update structural bookkeeping (sentence counts, boundaries).
   * This is a mechanical update, not an analytical judgment.
   */
  updateStructuralBookkeeping(
    profile: EssayProfile,
    paragraphIndex: number,
    sentenceCount: number,
  ): void {
    const errors = this.validate(profile, paragraphIndex);
    if (errors.length > 0) {
      console.error(
        `[ParagraphMutator] updateStructuralBookkeeping validation failed:`,
        errors,
      );
      return;
    }

    // Update the index digest for this paragraph
    const digest = profile.index.paragraphDigest.find(
      (d) => d.index === paragraphIndex,
    );
    if (digest) {
      digest.sentenceCount = sentenceCount;
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
