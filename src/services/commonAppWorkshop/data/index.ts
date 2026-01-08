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
import { uchicagoResearch } from './uchicago';
import { harvardResearch } from './harvard';
import { mitResearch } from './mit';
import { uscResearch } from './usc';
import { pennResearch } from './upenn';
import { northwesternResearch } from './northwestern';
import { nyuResearch } from './nyu';
import { cmuResearch } from './cmu';
import { brownResearch } from './brown';
import { cornellResearch } from './cornell';
import { caltechResearch } from './caltech';
import { dartmouthResearch } from './dartmouth';

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
    uchicago: uchicagoResearch,
    harvard: harvardResearch,
    mit: mitResearch,
    usc: uscResearch,
    upenn: pennResearch,
    northwestern: northwesternResearch,
    nyu: nyuResearch,
    cmu: cmuResearch,
    brown: brownResearch,
    cornell: cornellResearch,
    caltech: caltechResearch,
    dartmouth: dartmouthResearch,
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
    uchicago: [
      'personal_statement',        // Essay 1: Common App Personal Statement
      'quirky_creative',           // Essay 2: Extended Essay (unusual prompts)
      'why_this_school',           // Essay 3: Why UChicago?
    ],
    harvard: [
      'diversity_perspective',     // Essay 1: Background & Contribution
      'intellectual_curiosity',    // Essay 2: Intellectual Interest
      'meaningful_activity',       // Essay 3: Extracurricular/Employment
      'challenge_overcome',        // Essay 4: Disagreement
      'why_this_school',           // Essay 5: Future/Harvard Education
    ],
    mit: [
      'why_this_school',           // Essay 1: Why This Field of Study (100w)
      'meaningful_activity',       // Essay 2: For Pleasure (100w)
      'intellectual_curiosity',    // Essay 3: Blaze Your Own Trail (200w)
      'community_contribution',    // Essay 4: Collaboration/Community (225w)
      'challenge_overcome',        // Essay 5: Challenge/Unexpected (225w)
    ],
    usc: [
      'personal_statement',        // Common App Personal Statement
      'why_this_school',           // Why USC Short Essay (250w)
      'intellectual_curiosity',    // Dornsife/School-Specific Supplemental
      'short_answer',              // Short Answer Questions (10 x 100 chars)
    ],
    upenn: [
      'personal_statement',        // Common App Personal Statement
      'community_contribution',    // Thank You Note (150-200w) - tests accepting influence
      'community_contribution',    // Community at Penn (150-200w)
      'why_this_school',           // School-Specific Essays (CAS, Wharton, Engineering, Nursing)
    ],
    northwestern: [
      'diversity_perspective',     // Required: Background & Engagement (300w)
      'community_contribution',    // Optional: The Rock (200w)
      'intellectual_curiosity',    // Optional: Interdisciplinary Project (200w)
      'meaningful_activity',       // Optional: Co-curricular Community (200w)
      'intellectual_curiosity',    // Optional: What Keeps You Up (200w)
      'community_contribution',    // Optional: Residential Experience (200w)
    ],
    nyu: [
      'personal_statement',        // Common App Personal Statement
      'community_contribution',    // Bridge Builder (250w, "optional" but required)
    ],
    cmu: [
      'intellectual_curiosity',    // Why This Major (300w)
      'why_this_school',           // Successful Experience (300w) - hidden "Why CMU?"
      'diversity_perspective',     // About You (300w)
    ],
    brown: [
      'intellectual_curiosity',    // Open Curriculum (200-250w)
      'diversity_perspective',     // Background/Identity (200-250w)
      'meaningful_activity',       // Joy (200-250w)
      'short_answer',              // Three Words, EC, Teach, Why Brown
    ],
    cornell: [
      'community_contribution',    // University Essay: Community (350w)
      'intellectual_curiosity',    // A&S: Curiosity (650w)
      'why_this_school',           // Engineering/Business/ILR (650w)
    ],
    caltech: [
      'intellectual_curiosity',    // STEM Interest (100-200w)
      'meaningful_activity',       // STEM Experience (100-200w)
      'creative_work',             // Creativity/Innovation (100-200w) - REQUIRED
      'short_answer',              // Short Answers (250w total)
    ],
    dartmouth: [
      'why_this_school',           // Why Dartmouth (100w)
      'diversity_perspective',     // Be Yourself (250w)
      'community_contribution',    // Better World (250w)
      'intellectual_curiosity',    // Reading List (250w)
      'meaningful_activity',       // Major/Academic Curiosity (250w)
      'challenge_overcome',        // Turning Point (250w)
    ],
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
export { uchicagoResearch };
export { harvardResearch };
export { mitResearch };
export { uscResearch };
export { pennResearch };
export { northwesternResearch };
export { nyuResearch };
export { cmuResearch };
export { brownResearch };
export { cornellResearch };
export { caltechResearch };
export { dartmouthResearch };

// Export the complete database
export { collegeResearchDatabase as default };

// ============================================================================
// V2: LABELED SOURCE EXPORTS
// ============================================================================

// Export universal sources
export { UNIVERSAL_SOURCES, getUniversalSources, getUniversalSourcesForIssue, getUniversalSourcesByAdviceType, getUniversalSourcesByAuthority, getUniversalSourcesForSection, isUniversalSourceApplicable, getUniversalSourceStats } from './universalSources';

// Export prompt-type sources
export { PROMPT_TYPE_SOURCES, getSourcesForPromptType, getSourcesForPromptAndIssue, isSourceSafeForPromptType, getPromptTypeSourceStats } from './promptTypeSpecificSources';

// Export labeled sources (college-specific)
export { LABELED_SOURCES, getSourceById, getSourcesByAuthor, getSourceCountByCategory, getUniqueAuthors, getCollegesWithPrimarySources } from './labeledSources';

// Export Show Don't Tell deep research sources
export {
  ALL_SHOW_DONT_TELL_SOURCES,
  SHOW_DONT_TELL_AO_SOURCES,
  SHOW_DONT_TELL_FRAMEWORK_SOURCES,
  SHOW_DONT_TELL_NEURO_SOURCES,
  SHOW_DONT_TELL_CONTEXT_SOURCES,
  SHOW_DONT_TELL_SHORT_FORM_SOURCES,
  SHOW_DONT_TELL_ADVANCED_SOURCES,
  getShowDontTellSources,
  getShowDontTellStats,
} from './showDontTellSources';

// Export transformation examples (Before/After teaching material)
export {
  TRANSFORMATION_EXAMPLES,
  TELLING_PHRASE_PATTERNS,
  getAllTransformationExamples,
  getExamplesByCategory,
  getExamplesByCraftMove,
  getExamplesForPromptType,
  getExamplesByWordCount,
  getRandomExample,
  findExampleMatchingPhrase,
  getTransformationStats,
  getAllTellingPhrases,
} from './transformationExamples';

export type {
  TransformationExample,
  TransformationCategory,
  CraftMove,
} from './transformationExamples';

// Export Emotional Intelligence deep research sources
export {
  ALL_EMOTIONAL_INTELLIGENCE_SOURCES,
  EMOTIONAL_MATURITY_SOURCES,
  VULNERABILITY_SOURCES,
  TRAUMA_STRUGGLE_SOURCES,
  EMPATHY_SOURCES,
  SELF_AWARENESS_SOURCES,
  EMOTIONAL_COMPLEXITY_SOURCES,
  NEUROSCIENCE_EMOTION_SOURCES,
  getEmotionalIntelligenceSources,
  getEmotionalIntelligenceStats,
} from './emotionalIntelligenceSources';

// Export Essay Openings and First Impressions deep research sources
export {
  ESSAY_OPENINGS_SOURCES,
  getEssayOpeningsSources,
  getOpeningSourcesForIssue,
  getAdmissionsOfficerOpeningInsights,
  getOpeningTechniqueExamples,
  getOpeningWarnings,
  getOpeningScienceData,
  getOpeningGuidanceForPromptType,
  getOpeningsSourceStats,
} from './essayOpeningsSources';

// ============================================================================
// V3: SOURCE REGISTRY EXPORTS (Scalable Integration)
// ============================================================================

// Export source registry for centralized management
export {
  ALL_DEEP_RESEARCH_SOURCES,
  ALL_ENHANCED_DEEP_RESEARCH_SOURCES,
  RESEARCH_BATCHES,
  getSourcesByBatch,
  getBatchMetadata,
  getIntegratedBatches,
  getPendingBatches,
  validateRegistry,
  getRegistryStats,
  convertToLabeledSource,
  convertBatchToLabeledSources,
} from './sourceRegistry';

export type { ResearchBatchMetadata } from './sourceRegistry';

// Export labeled source stats and validation
export { getLabeledSourceStats, validateLabeledSources } from './labeledSources';
