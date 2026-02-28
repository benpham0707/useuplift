/**
 * Knowledge Base — Public API
 *
 * Unified knowledge base for the activity scoring pipeline. Composes data from:
 *   1. Achievement Intelligence (achievementIntelligence.ts) — calibration benchmarks
 *   2. Expertise Signaling Library (expertiseSignaling/) — expertise patterns & AO expectations
 *
 * Provides:
 *   - CategoryKnowledge registry — unified category profiles with calibration + expertise data
 *   - Recognition index — O(1) lookup for known awards/competitions/programs
 *   - Category resolution — keyword-based activity-to-category matching
 *   - KB version metadata — for cache invalidation
 *
 * Cost: $0.00 (pure data + TypeScript logic, no LLM calls)
 * Latency: <1ms per lookup
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  CategoryKnowledge,
  RecognitionEntry,
  CategoryResolution,
  RecognitionLookupResult,
  KnowledgeBaseVersion,
} from './types';

// Re-export constituent types for convenience
export type {
  AchievementEntry,
  SubcategoryProfile,
  AchievementLadderEntry,
  RoleHierarchyEntry,
  AchievementCategory,
} from '../nuanceCalibrationTypes';

export type {
  ExpertiseSignal,
  NameDropTrap,
  ProofOfWorkPattern,
  DescriptionTransform,
  VerbTier,
  RoleExpertise,
  AOExpectations,
  JargonException,
  ExpertiseDomain,
  ExpertiseMatchResult,
  ExpertiseTeachingContext,
} from '../expertiseSignaling/types';

// ============================================================================
// CATEGORY REGISTRY
// ============================================================================

export {
  getCategory,
  getCategoryByAlias,
  resolveCategory,
  getAllCategories,
  getAllCategoryIds,
  getCategoryKeywordIndex,
  getCategoryCount,
  getCategoryAliases,
} from './categoryRegistry';

// ============================================================================
// RECOGNITION INDEX
// ============================================================================

export {
  lookupRecognitionByName,
  findRecognitionsInText,
  getRecognitionsByCategory,
  getRecognitionsByTier,
  getRecognitionCount,
  getAllRecognitions,
} from './recognitionIndex';

// ============================================================================
// KB VERSION
// ============================================================================

import { getCategoryCount } from './categoryRegistry';
import { getRecognitionCount } from './recognitionIndex';
import { getTotalEntryCount } from '../achievementIntelligence';
import { getLibraryStats } from '../expertiseSignaling';
import type { KnowledgeBaseVersion } from './types';

/**
 * Current KB version. Increment on data changes for cache invalidation.
 */
export const KB_VERSION = '2.0.0';

/**
 * Get full KB version metadata.
 */
export function getKnowledgeBaseVersion(): KnowledgeBaseVersion {
  const expertiseStats = getLibraryStats();
  return {
    version: KB_VERSION,
    lastUpdated: '2026-02-28',
    categoryCount: getCategoryCount(),
    recognitionCount: getRecognitionCount(),
    totalBenchmarks: getTotalEntryCount(),
    totalExpertiseSignals: expertiseStats.totalSignals,
  };
}
