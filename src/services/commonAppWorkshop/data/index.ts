/**
 * College Research Data Index
 *
 * Central export for all college research data.
 * Each college has comprehensive data extracted from markdown overlays.
 *
 * **QUALITY PRINCIPLE**: All data is FULL, never compressed.
 * Every Dean quote, rubric criterion, and evidence source is preserved.
 */

import { CollegeResearch, CollegeResearchDatabase, EssayPattern } from '../types';

// Import individual college research
import { stanfordResearch } from './stanford';
// Future imports:
// import { mitResearch } from './mit';
// import { harvardResearch } from './harvard';
// import { brownResearch } from './brown';
// ... etc.

// ============================================================================
// COLLEGE RESEARCH DATABASE
// ============================================================================

/**
 * Complete college research database
 * Contains all extracted college data for the workshop system
 */
export const collegeResearchDatabase: CollegeResearchDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString().split('T')[0],

  colleges: {
    stanford: stanfordResearch,
    // Future colleges:
    // mit: mitResearch,
    // harvard: harvardResearch,
    // brown: brownResearch,
    // dartmouth: dartmouthResearch,
    // cornell: cornellResearch,
    // upenn: upennResearch,
    // caltech: caltechResearch,
    // cmu: cmuResearch,
    // northwestern: northwesternResearch,
    // nyu: nyuResearch,
    // uchicago: uchicagoResearch,
    // usc: uscResearch,
  },

  supportedPatterns: [
    'why_this_school',
    'community_contribution',
    'intellectual_curiosity',
    'diversity_perspective',
    'meaningful_activity',
    'career_goals',
    'challenge_overcome',
    'creative_work',
    'quirky_creative',
    'short_answer',
    'personal_statement',
  ] as EssayPattern[],

  collegePatternMatrix: {
    stanford: [
      'intellectual_curiosity',    // Essay 1: Intellectual Vitality
      'quirky_creative',           // Essay 2: Roommate Note
      'diversity_perspective',     // Essay 3: Distinctive Contribution
      'short_answer',              // Short answers (5)
    ],
    // Future colleges will have their patterns listed here
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get research for a specific college
 */
export function getCollegeResearch(collegeId: string): CollegeResearch | undefined {
  return collegeResearchDatabase.colleges[collegeId.toLowerCase()];
}

/**
 * Get all supported college IDs
 */
export function getSupportedColleges(): string[] {
  return Object.keys(collegeResearchDatabase.colleges);
}

/**
 * Check if a college is supported
 */
export function isCollegeSupported(collegeId: string): boolean {
  return collegeId.toLowerCase() in collegeResearchDatabase.colleges;
}

/**
 * Get patterns supported for a college
 */
export function getCollegePatterns(collegeId: string): EssayPattern[] {
  return collegeResearchDatabase.collegePatternMatrix[collegeId.toLowerCase()] || [];
}

/**
 * Get a specific essay prompt from a college
 */
export function getCollegeEssayPrompt(
  collegeId: string,
  promptId: string
) {
  const research = getCollegeResearch(collegeId);
  if (!research) return undefined;

  return research.essayPrompts.find(p => p.promptId === promptId);
}

/**
 * Get red flags for a specific prompt
 */
export function getPromptRedFlags(
  collegeId: string,
  promptId: string
) {
  const research = getCollegeResearch(collegeId);
  if (!research) return [];

  return research.redFlags.filter(
    flag => flag.applicablePrompts.length === 0 || flag.applicablePrompts.includes(promptId)
  );
}

/**
 * Get green flags for a specific prompt
 */
export function getPromptGreenFlags(
  collegeId: string,
  promptId: string
) {
  const research = getCollegeResearch(collegeId);
  if (!research) return [];

  return research.greenFlags.filter(
    flag => flag.applicablePrompts.length === 0 || flag.applicablePrompts.includes(promptId)
  );
}

/**
 * Get Socratic questions for a specific prompt
 */
export function getPromptSocraticQuestions(
  collegeId: string,
  promptId: string
) {
  const research = getCollegeResearch(collegeId);
  if (!research) return [];

  return research.socraticQuestions.byPrompt[promptId] || [];
}

/**
 * Get key quotes for teaching a specific dimension
 */
export function getDimensionQuotes(
  collegeId: string,
  dimensionId: string
) {
  const research = getCollegeResearch(collegeId);
  if (!research) return [];

  return research.keyQuotes.filter(quote =>
    quote.useCases.some(useCase => useCase.dimension === dimensionId)
  );
}

/**
 * Get quote for a specific red flag
 */
export function getRedFlagQuote(
  collegeId: string,
  flagId: string
) {
  const research = getCollegeResearch(collegeId);
  if (!research) return undefined;

  return research.keyQuotes.find(quote =>
    quote.useCases.some(useCase => useCase.flag === flagId)
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export individual college research for direct access
export { stanfordResearch };

// Export the complete database
export { collegeResearchDatabase as default };
