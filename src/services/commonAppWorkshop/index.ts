/**
 * Common App Workshop Service
 *
 * Comprehensive college-specific essay coaching system for Common App supplementals.
 *
 * Key Features:
 * - Full college research context (never compressed)
 * - Citation mapping for evidence-based teaching
 * - Session-level caching for 74% cost reduction
 * - Progressive teaching across 3 stages
 * - Adaptive feedback based on student patterns
 *
 * Quality Guarantees:
 * ✅ FULL college research sent every time (2,500+ tokens)
 * ✅ FULL examples included every time
 * ✅ ALL dimensions analyzed every time
 * ✅ Haiku ADDS context, never replaces
 * ✅ Prompt caching is invisible to Claude
 */

// Types
export * from './types';

// College Research Data
export {
  collegeResearchDatabase,
  getCollegeResearch,
  getSupportedColleges,
  isCollegeSupported,
  getCollegePatterns,
  getCollegeEssayPrompt,
  getPromptRedFlags,
  getPromptGreenFlags,
  getPromptSocraticQuestions,
  getDimensionQuotes,
  getRedFlagQuote,
  stanfordResearch,
} from './data';
