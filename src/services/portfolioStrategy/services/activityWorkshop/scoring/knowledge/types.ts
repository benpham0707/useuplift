/**
 * Knowledge Base — Unified Type Definitions
 *
 * Consolidates two data sources into a single authoritative knowledge base:
 *   1. Achievement Intelligence (achievementIntelligence.ts) — 18 categories of
 *      benchmarks, subcategories, achievement ladders, role hierarchies, tier entries
 *   2. Expertise Signaling Library (expertiseSignaling/) — 12 domains of AO expectations,
 *      expertise signals, name-drop traps, proof-of-work patterns, transforms, verbs
 *
 * Each CategoryKnowledge entry is the COMPLETE knowledge about one activity category,
 * combining calibration data (for scoring) with expertise data (for teaching).
 *
 * Cost: $0.00 (pure data, no LLM calls)
 * Sources: Sara Harberson, College Board, MIT/Stanford/Harvard admissions blogs,
 * NACAC surveys, published AO insights, IEC best practices.
 */

import type { InternalTier } from '../types';

// ============================================================================
// RE-EXPORT EXISTING TYPES (backward compatibility)
// ============================================================================

// Achievement/calibration types — originally from nuanceCalibrationTypes.ts
export type {
  AchievementEntry,
  SubcategoryProfile,
  AchievementLadderEntry,
  RoleHierarchyEntry,
  AchievementCategory,
} from '../nuanceCalibrationTypes';

// Expertise signaling types — originally from expertiseSignaling/types.ts
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
// UNIFIED KNOWLEDGE BASE TYPES
// ============================================================================

/**
 * Complete knowledge about one activity category.
 * Combines achievement calibration data with expertise signaling data.
 *
 * Not all categories have both — some categories from achievementIntelligence
 * (e.g., hobby_gaming, religious_spiritual) lack expertise domains, and some
 * expertise domains (e.g., entrepreneurship) map to different achievement
 * category keys. The KB handles this via optional fields.
 */
export interface CategoryKnowledge {
  /** Canonical category ID (snake_case, matches ACHIEVEMENT_DATABASE keys) */
  categoryId: string;

  /** Display name */
  label: string;

  /** Keywords for category detection/matching */
  keywords: string[];

  /** Alternative names/aliases that map to this category */
  aliases: string[];

  /**
   * Expertise domain ID from expertiseSignaling, if this category has one.
   * Null for categories without expertise data (hobby_gaming, religious_spiritual, etc.)
   */
  expertiseDomainId: string | null;

  // --- Achievement/Calibration Data (from achievementIntelligence) ---

  /** Subcategories within this field (e.g., bench_science, computational for STEM Research) */
  subcategories: import('../nuanceCalibrationTypes').SubcategoryProfile[];

  /** Achievement ladder — ordered progression from beginner to elite */
  achievementLadder: import('../nuanceCalibrationTypes').AchievementLadderEntry[];

  /** Role hierarchy specific to this field */
  roleHierarchy: import('../nuanceCalibrationTypes').RoleHierarchyEntry[];

  /** Achievement benchmark entries by internal tier (1-6) */
  tiers: Partial<Record<InternalTier, import('../nuanceCalibrationTypes').AchievementEntry[]>>;

  // --- Expertise/Teaching Data (from expertiseSignaling) ---

  /** What AOs actually look for in this field. Null if no expertise domain. */
  aoExpectations: import('../expertiseSignaling/types').AOExpectations | null;

  /** Real expertise signals — language patterns proving genuine depth */
  realExpertiseSignals: import('../expertiseSignaling/types').ExpertiseSignal[];

  /** Name-drop traps — impressive-sounding filler */
  nameDropTraps: import('../expertiseSignaling/types').NameDropTrap[];

  /** Proof-of-work patterns — what genuine involvement looks like */
  proofOfWorkPatterns: import('../expertiseSignaling/types').ProofOfWorkPattern[];

  /** Field-specific description transformations */
  descriptionTransforms: import('../expertiseSignaling/types').DescriptionTransform[];

  /** Field-specific verb hierarchy (power/standard/weak) */
  verbHierarchy: import('../expertiseSignaling/types').VerbTier[];

  /** Role-specific expertise expectations */
  roleExpertise: import('../expertiseSignaling/types').RoleExpertise[];

  /** Exceptions where jargon/technology IS the achievement */
  jargonExceptions: import('../expertiseSignaling/types').JargonException[];
}

// ============================================================================
// RECOGNITION INDEX TYPES
// ============================================================================

/**
 * A single recognized award/competition/program with its tier classification.
 * Used for O(1) award lookup in the tier classifier.
 */
export interface RecognitionEntry {
  /** Canonical name of the award/competition/program */
  name: string;

  /** Alternative names, abbreviations, common misspellings */
  aliases: string[];

  /** Internal tier this recognition maps to */
  tier: InternalTier;

  /** Score range for this specific recognition at this tier */
  scoreRange: [number, number];

  /** Category this recognition belongs to */
  categoryId: string;

  /** Subcategory within the category */
  subcategory: string;

  /** Selection/acceptance ratio for context */
  selectivityRatio: string | null;

  /** Recognition scope level */
  scope: 'international' | 'national' | 'state' | 'regional' | 'school' | 'local';

  /** One-line context about what this recognition means */
  context: string;

  /** What differentiates levels within this recognition (e.g., AIME score 10+ vs bare qualifier) */
  differentiator: string;

  /** Keywords to detect this recognition in descriptions */
  detectionKeywords: string[];
}

// ============================================================================
// KNOWLEDGE BASE REGISTRY TYPES
// ============================================================================

/**
 * Result of resolving a category from an activity description/metadata.
 */
export interface CategoryResolution {
  /** Resolved category */
  category: CategoryKnowledge;

  /** How confident we are in this resolution */
  confidence: 'high' | 'medium' | 'low';

  /** What matched — keywords, alias, or fuzzy */
  matchType: 'exact' | 'alias' | 'keyword' | 'fuzzy';

  /** The specific match term that triggered resolution */
  matchedTerm: string;

  /** Resolved subcategory, if any */
  subcategory: import('../nuanceCalibrationTypes').SubcategoryProfile | null;
}

/**
 * Result of looking up a recognition in the index.
 */
export interface RecognitionLookupResult {
  /** The matched recognition entry */
  entry: RecognitionEntry;

  /** Match confidence */
  confidence: 'high' | 'medium' | 'low';

  /** The matched keyword/alias that triggered the lookup */
  matchedTerm: string;
}

// ============================================================================
// KNOWLEDGE BASE VERSION & METADATA
// ============================================================================

/**
 * Version metadata for the knowledge base.
 * Used for cache invalidation when KB data changes.
 */
export interface KnowledgeBaseVersion {
  /** Semantic version of the KB data (increment on data changes) */
  version: string;

  /** Date of last data update */
  lastUpdated: string;

  /** Number of categories in the registry */
  categoryCount: number;

  /** Number of recognition entries in the index */
  recognitionCount: number;

  /** Total achievement benchmark entries across all categories */
  totalBenchmarks: number;

  /** Total expertise signals across all domains */
  totalExpertiseSignals: number;
}
