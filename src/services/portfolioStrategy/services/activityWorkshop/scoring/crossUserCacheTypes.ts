/**
 * Cross-User Cache Types
 *
 * Type definitions for the Supabase-backed cross-user scoring cache.
 * This cache shares scoring results across users for identical activity
 * fingerprints, eliminating redundant LLM calls when different users
 * submit similar activity descriptions.
 *
 * SCOPE:
 * - Caches individual activity scores (description + activity + tier)
 * - Portfolio scoring and teaching ALWAYS run fresh (never cached here)
 * - Cache invalidation on KB version OR model version change
 *
 * PRIVACY:
 * - Fingerprints are SHA-256 hashes — no user data is recoverable
 * - No user IDs are stored in the cache
 * - The cache stores scoring RESULTS, not activity text
 */

import type { InternalTier, ExternalTier } from './types';

// ============================================================================
// FINGERPRINT TYPES
// ============================================================================

/**
 * Input fields used to compute an activity fingerprint.
 * Deliberately excludes user ID — the fingerprint represents the
 * activity content, not who submitted it.
 */
export interface ActivityFingerprintInput {
  /** Activity description text (primary input) */
  description: string;
  /** Role/position held */
  role?: string;
  /** Activity category (e.g., "STEM", "Community Service") */
  category?: string;
  /** Activity title (e.g., "Math Club", "Varsity Soccer") */
  title?: string;
  /** Hours per week committed */
  hoursPerWeek?: number;
  /** Number of years active */
  yearsActive?: number;
}

/**
 * A fingerprint is a hex-encoded SHA-256 hash of the normalized activity input.
 * Using the full 64-char hex string for collision resistance.
 */
export type ActivityFingerprint = string;

// ============================================================================
// CACHE ENTRY TYPES
// ============================================================================

/**
 * Score components stored in the cache.
 * These mirror the scoring pipeline output structure.
 */
export interface CachedScoreComponents {
  /** Description score — full DescriptionScore object round-tripped through JSONB */
  descriptionScore: {
    total: number;
    breakdown: Record<string, unknown>;
    strengths: string[];
    improvements: string[];
    overallRationale: string;
  };
  /** Activity score — full ActivityScore object round-tripped through JSONB */
  activityScore: {
    total: number;
    breakdown: Record<string, unknown>;
    tierJustification: string;
    comparisonBenchmarks: Record<string, unknown>;
    improvementPaths: string[];
    overallRationale: string;
  };
  /** Tier classification */
  tierClassification: {
    internalTier: InternalTier;
    externalTier: ExternalTier;
  };
}

/**
 * A single cache entry in the cross-user cache.
 * Corresponds to one row in the `activity_scoring_cache` Supabase table.
 */
export interface CrossUserCacheEntry {
  /** Database row ID */
  id: string;
  /** SHA-256 fingerprint of the activity input */
  fingerprint: ActivityFingerprint;
  /** Cached description score — full object round-tripped through JSONB */
  descriptionScore: {
    total: number;
    breakdown: Record<string, unknown>;
    strengths: string[];
    improvements: string[];
    overallRationale: string;
  };
  /** Cached activity score — full object round-tripped through JSONB */
  activityScore: {
    total: number;
    breakdown: Record<string, unknown>;
    tierJustification: string;
    comparisonBenchmarks: Record<string, unknown>;
    improvementPaths: string[];
    overallRationale: string;
  };
  /** Cached tier classification */
  tierClassification: {
    internalTier: InternalTier;
    externalTier: ExternalTier;
  };
  /** Knowledge base version when this entry was created */
  kbVersion: string;
  /** Model version used to produce these scores */
  modelVersion: string;
  /** When this cache entry was created */
  createdAt: Date;
  /** Number of times this entry has been served from cache */
  hitCount: number;
  /** When this entry was last served from cache */
  lastHitAt: Date;
}

// ============================================================================
// LOOKUP RESULT TYPES
// ============================================================================

/**
 * Result of a cross-user cache lookup.
 * Includes validity checks for KB and model version mismatches.
 */
export interface CrossUserCacheLookupResult {
  /** The cached entry */
  entry: CrossUserCacheEntry;
  /** Age of the cache entry in milliseconds */
  cacheAge: number;
  /**
   * Whether this entry is still valid.
   * False if kbVersion or modelVersion has changed since the entry was created,
   * or if the entry exceeds maxAgeMs.
   */
  isValid: boolean;
  /** Reason for invalidity, if isValid is false */
  invalidReason?: 'kb_version_mismatch' | 'model_version_mismatch' | 'expired';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for the cross-user cache service.
 */
export interface CrossUserCacheConfig {
  /** Whether the cross-user cache is enabled (default: true) */
  enabled: boolean;
  /** Maximum age of a cache entry before it's considered stale (default: 7 days) */
  maxAgeMs: number;
  /** Maximum number of entries to store (for cleanup, default: 10000) */
  maxEntries: number;
}

/**
 * Default configuration for the cross-user cache.
 */
export const DEFAULT_CROSS_USER_CACHE_CONFIG: CrossUserCacheConfig = {
  enabled: true,
  maxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEntries: 10_000,
};

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Aggregate statistics for the cross-user cache.
 */
export interface CrossUserCacheStats {
  /** Total number of entries in the cache */
  entryCount: number;
  /** Total number of cache hits across all entries */
  totalHits: number;
  /** Average age of cache entries in milliseconds */
  avgCacheAgeMs: number;
  /** Hit rate (hits / (hits + misses)) — -1 if no lookups yet */
  hitRate: number;
}

// ============================================================================
// SUPABASE ROW TYPE
// ============================================================================

/**
 * Shape of a row in the `activity_scoring_cache` Supabase table.
 * Used for type-safe Supabase queries.
 */
export interface ActivityScoringCacheRow {
  id: string;
  fingerprint: string;
  description_score: {
    total: number;
    breakdown: Record<string, unknown>;
    strengths: string[];
    improvements: string[];
    overallRationale: string;
  };
  activity_score: {
    total: number;
    breakdown: Record<string, unknown>;
    tierJustification: string;
    comparisonBenchmarks: Record<string, unknown>;
    improvementPaths: string[];
    overallRationale: string;
  };
  tier_classification: {
    internalTier: InternalTier;
    externalTier: ExternalTier;
  };
  kb_version: string;
  model_version: string;
  hit_count: number;
  created_at: string;
  last_hit_at: string;
}
