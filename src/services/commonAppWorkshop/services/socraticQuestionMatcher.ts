/**
 * Socratic Question Matcher Service
 *
 * Matches detected issues to relevant Socratic questions from college overlays.
 * Provides teaching-focused probes that guide students to think deeper rather
 * than just giving them polished text.
 *
 * Key Features:
 * - Matches issues to issue-specific questions (byIssue)
 * - Matches prompts to prompt-specific questions (byPrompt)
 * - Matches dimensions to purpose-based questions (byPurpose)
 * - Returns questions with expected outcomes
 *
 * Integration: Include in teaching section of suggestions to transform
 * feedback from "text fixes" to "thinking guidance".
 */

import { getCollegeResearch } from '../data';
import type { CollegeSocraticQuestionBank } from '../types/collegeResearch';

// ============================================================================
// TYPES
// ============================================================================

export interface SocraticQuestion {
  questionId: string;
  question: string;
  purpose: string;
  expectedOutcome: string;
  trigger?: {
    dimension?: string;
    issue?: string;
    flagDetected?: string;
  };
}

export interface SocraticQuestionSet {
  source: 'byIssue' | 'byPrompt' | 'byPurpose';
  triggerKey: string; // The issue/prompt/purpose that triggered these
  questions: SocraticQuestion[];
}

export interface SocraticMatcherInput {
  collegeId: string;
  promptId?: string;
  detectedIssues?: string[]; // e.g., ['CLASS_BASED_IV', 'NO_SPECIFICITY']
  detectedFlags?: string[]; // Red flag IDs detected
  weakDimensions?: string[]; // Dimensions with low scores
}

export interface SocraticMatcherOutput {
  questionSets: SocraticQuestionSet[];
  totalQuestions: number;
  formattedForPrompt: string;
  formattedForTeaching: string;
}

// ============================================================================
// ISSUE TO QUESTION MAPPINGS
// ============================================================================

// Map common issue patterns to socratic question triggers
const ISSUE_MAPPINGS: Record<string, string[]> = {
  // Red flag patterns
  CLASS_BASED_IV: ['lacks_self_direction', 'class_based_learning'],
  CLASS_BASED_ONLY: ['lacks_self_direction', 'class_based_learning'],
  NO_INTELLECTUAL_VITALITY: ['surface_interest', 'lacks_depth'],
  ACHIEVEMENT_CONFUSED_WITH_VITALITY: ['outcome_focused', 'lacks_process'],
  GENERIC_PASSION: ['surface_interest', 'lacks_specificity'],
  NO_SPECIFICITY: ['lacks_specificity', 'vague_claims'],
  RESUME_REHASH: ['outcome_focused', 'lacks_reflection'],
  RECYCLED_ESSAY: ['lacks_stanford_fit', 'generic_content'],

  // Dimension-based issues
  low_intellectual_vitality: ['lacks_self_direction', 'surface_interest'],
  low_authenticity: ['voice', 'vulnerability'],
  low_specificity: ['lacks_specificity', 'deepening'],
  low_reflection: ['lacks_reflection', 'vulnerability'],
  low_depth: ['deepening', 'connection'],
};

// ============================================================================
// SOCRATIC QUESTION MATCHER SERVICE
// ============================================================================

export class SocraticQuestionMatcher {
  /**
   * Match Socratic questions based on detected issues, flags, and dimensions
   */
  matchQuestions(input: SocraticMatcherInput): SocraticMatcherOutput {
    const college = getCollegeResearch(input.collegeId);
    if (!college || !college.socraticQuestions) {
      return {
        questionSets: [],
        totalQuestions: 0,
        formattedForPrompt: '',
        formattedForTeaching: '',
      };
    }

    const questionSets: SocraticQuestionSet[] = [];
    const addedQuestionIds = new Set<string>();

    // 1. Match by prompt (highest priority - most specific)
    if (input.promptId) {
      const promptQuestions = this.getPromptQuestions(
        college.socraticQuestions,
        input.promptId,
        addedQuestionIds
      );
      if (promptQuestions.questions.length > 0) {
        questionSets.push(promptQuestions);
      }
    }

    // 2. Match by detected issues/flags
    const issueKeys = this.getIssueKeys(input.detectedIssues, input.detectedFlags);
    for (const issueKey of issueKeys) {
      const issueQuestions = this.getIssueQuestions(
        college.socraticQuestions,
        issueKey,
        addedQuestionIds
      );
      if (issueQuestions.questions.length > 0) {
        questionSets.push(issueQuestions);
      }
    }

    // 3. Match by weak dimensions (fallback)
    if (input.weakDimensions) {
      for (const dimension of input.weakDimensions) {
        const purposeQuestions = this.getPurposeQuestions(
          college.socraticQuestions,
          dimension,
          addedQuestionIds
        );
        if (purposeQuestions.questions.length > 0) {
          questionSets.push(purposeQuestions);
        }
      }
    }

    // Count total unique questions
    const totalQuestions = questionSets.reduce((sum, set) => sum + set.questions.length, 0);

    return {
      questionSets,
      totalQuestions,
      formattedForPrompt: this.formatForPrompt(questionSets),
      formattedForTeaching: this.formatForTeaching(questionSets),
    };
  }

  /**
   * Get questions specific to a prompt
   */
  private getPromptQuestions(
    bank: CollegeSocraticQuestionBank,
    promptId: string,
    addedIds: Set<string>
  ): SocraticQuestionSet {
    const questions: SocraticQuestion[] = [];
    const promptQuestions = bank.byPrompt?.[promptId] || [];

    for (const q of promptQuestions) {
      if (!addedIds.has(q.questionId)) {
        questions.push({
          questionId: q.questionId,
          question: q.question,
          purpose: q.purpose,
          expectedOutcome: q.expectedOutcome,
          trigger: q.trigger,
        });
        addedIds.add(q.questionId);
      }
    }

    return {
      source: 'byPrompt',
      triggerKey: promptId,
      questions,
    };
  }

  /**
   * Get questions for a specific issue
   */
  private getIssueQuestions(
    bank: CollegeSocraticQuestionBank,
    issueKey: string,
    addedIds: Set<string>
  ): SocraticQuestionSet {
    const questions: SocraticQuestion[] = [];
    const issueQuestions = bank.byIssue?.[issueKey] || [];

    for (const q of issueQuestions) {
      if (!addedIds.has(q.questionId)) {
        questions.push({
          questionId: q.questionId,
          question: q.question,
          purpose: q.purpose,
          expectedOutcome: q.expectedOutcome,
          trigger: q.trigger,
        });
        addedIds.add(q.questionId);
      }
    }

    return {
      source: 'byIssue',
      triggerKey: issueKey,
      questions,
    };
  }

  /**
   * Get questions by purpose (for dimension-based matching)
   */
  private getPurposeQuestions(
    bank: CollegeSocraticQuestionBank,
    dimension: string,
    addedIds: Set<string>
  ): SocraticQuestionSet {
    const questions: SocraticQuestion[] = [];

    // Map dimension to purpose category
    const purposeMap: Record<string, string> = {
      intellectual_vitality: 'deepening',
      authenticity: 'voice',
      specificity: 'specificity',
      reflection: 'vulnerability',
      depth: 'deepening',
      connection: 'connection',
    };

    const purpose = purposeMap[dimension] || 'deepening';
    const purposeQuestions = bank.byPurpose?.[purpose] || [];

    for (const q of purposeQuestions) {
      if (!addedIds.has(q.questionId)) {
        questions.push({
          questionId: q.questionId,
          question: q.question,
          purpose: q.purpose,
          expectedOutcome: q.expectedOutcome,
          trigger: q.trigger,
        });
        addedIds.add(q.questionId);
      }
    }

    return {
      source: 'byPurpose',
      triggerKey: purpose,
      questions,
    };
  }

  /**
   * Convert detected issues/flags to issue keys for lookup
   */
  private getIssueKeys(
    detectedIssues?: string[],
    detectedFlags?: string[]
  ): string[] {
    const keys = new Set<string>();

    // Map detected issues to question bank keys
    for (const issue of detectedIssues || []) {
      const mappings = ISSUE_MAPPINGS[issue];
      if (mappings) {
        mappings.forEach((k) => keys.add(k));
      }
    }

    // Map detected flags to question bank keys
    for (const flag of detectedFlags || []) {
      const mappings = ISSUE_MAPPINGS[flag];
      if (mappings) {
        mappings.forEach((k) => keys.add(k));
      }
    }

    return Array.from(keys);
  }

  /**
   * Format questions for injection into suggestion prompt
   */
  formatForPrompt(questionSets: SocraticQuestionSet[]): string {
    if (questionSets.length === 0 || questionSets.every((s) => s.questions.length === 0)) {
      return '';
    }

    let output = `
═══════════════════════════════════════════════════════════
SOCRATIC PROBES (Include in Teaching Section)
═══════════════════════════════════════════════════════════

These questions help the student think deeper rather than just fixing text.
Include 1-2 relevant probes in the teaching section of each suggestion.
`;

    for (const set of questionSets) {
      if (set.questions.length === 0) continue;

      output += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Triggered by: ${set.triggerKey} (${set.source})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      for (let i = 0; i < Math.min(set.questions.length, 3); i++) {
        const q = set.questions[i];
        output += `
PROBE ${i + 1}:
"${q.question}"

Purpose: ${q.purpose}
Expected Outcome: ${q.expectedOutcome}
`;
      }
    }

    return output;
  }

  /**
   * Format questions for the teaching section of suggestions
   */
  formatForTeaching(questionSets: SocraticQuestionSet[]): string {
    if (questionSets.length === 0 || questionSets.every((s) => s.questions.length === 0)) {
      return '';
    }

    // Get top 2 most relevant questions
    const allQuestions = questionSets.flatMap((s) => s.questions);
    const topQuestions = allQuestions.slice(0, 2);

    if (topQuestions.length === 0) return '';

    let output = `
QUESTIONS TO CONSIDER:
`;

    for (const q of topQuestions) {
      output += `• "${q.question}"
  → ${q.expectedOutcome}
`;
    }

    return output;
  }

  /**
   * Get a single most relevant question for an issue
   */
  getMostRelevantQuestion(
    collegeId: string,
    issueOrFlag: string
  ): SocraticQuestion | null {
    const result = this.matchQuestions({
      collegeId,
      detectedIssues: [issueOrFlag],
      detectedFlags: [issueOrFlag],
    });

    if (result.questionSets.length === 0) return null;

    // Return first question from first set
    const firstSet = result.questionSets.find((s) => s.questions.length > 0);
    return firstSet?.questions[0] || null;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const socraticQuestionMatcher = new SocraticQuestionMatcher();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick function to get Socratic questions for detected issues
 */
export function getSocraticQuestions(
  collegeId: string,
  promptId?: string,
  detectedIssues?: string[],
  detectedFlags?: string[]
): SocraticMatcherOutput {
  return socraticQuestionMatcher.matchQuestions({
    collegeId,
    promptId,
    detectedIssues,
    detectedFlags,
  });
}

/**
 * Get a single probe for a specific issue
 */
export function getSingleProbe(
  collegeId: string,
  issueOrFlag: string
): string | null {
  const question = socraticQuestionMatcher.getMostRelevantQuestion(collegeId, issueOrFlag);
  return question?.question || null;
}
