/**
 * Scoring Cache Types
 *
 * Type definitions for the intelligent caching system that optimizes
 * repeated scoring requests by caching individual activity scores.
 *
 * CACHING PHILOSOPHY:
 * - Individual scores (description, activity) are deterministic given same input
 * - These can be safely cached without quality loss
 * - Holistic analysis (portfolio scoring, teaching) always runs fresh
 *   because they depend on the complete ensemble of activities
 *
 * QUALITY SAFEGUARDS:
 * - Cache keys include prompt/model versions to auto-invalidate on changes
 * - Portfolio and teaching NEVER cached - always fresh synthesis
 * - Users can force fresh analysis at any time
 * - Clear reporting of what was cached vs fresh
 */

import { DescriptionScore } from './descriptionScoringService';
import { ActivityScore } from './activityScoringService';

// ============================================================================
// VERSION CONSTANTS
// ============================================================================

/**
 * Increment this when making changes to prompts or rubrics
 * that would affect scoring results. This invalidates all cached scores.
 */
export const SCORING_CACHE_VERSION = '1.0.0';

/**
 * Model versions used for scoring.
 * Cache entries with different model versions are invalid.
 */
export const SCORING_MODEL_VERSIONS = {
  descriptionScoring: 'claude-haiku-4-5-20251001',
  activityScoring: 'claude-haiku-4-5-20251001',
  portfolioScoring: 'claude-haiku-4-5-20251001',
  teaching: 'claude-sonnet-4-5-20250514',
} as const;

// ============================================================================
// CACHE ENTRY TYPES
// ============================================================================

/**
 * Base cache entry with metadata
 */
interface BaseCacheEntry {
  /** SHA-256 hash of the input data */
  inputHash: string;
  /** When this entry was created */
  createdAt: Date;
  /** Cache version when entry was created */
  cacheVersion: string;
  /** Model version used for this score */
  modelVersion: string;
}

/**
 * Cached description score
 */
export interface DescriptionScoreCacheEntry extends BaseCacheEntry {
  type: 'description';
  /** The cached score result */
  score: DescriptionScore;
}

/**
 * Cached activity score
 */
export interface ActivityScoreCacheEntry extends BaseCacheEntry {
  type: 'activity';
  /** The cached score result */
  score: ActivityScore;
}

/**
 * Union type for all cache entries
 */
export type ScoringCacheEntry = DescriptionScoreCacheEntry | ActivityScoreCacheEntry;

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * A scoring session maintains cache state for a user's portfolio iteration
 *
 * Sessions are created when a user starts working on their portfolio
 * and maintain cached scores across multiple scoring requests.
 *
 * Key behaviors:
 * - Each activity has its own cache entry keyed by activity ID
 * - If the input hash changes, the cache entry is invalidated
 * - Sessions expire after inactivity (configurable)
 */
export interface ScoringSession {
  /** Unique session identifier */
  sessionId: string;
  /** When session was created */
  createdAt: Date;
  /** When session was last accessed */
  lastAccessedAt: Date;

  /**
   * Cached description scores by activity ID
   * Key: activityId
   * Value: Cache entry with hash and score
   */
  descriptionScores: Map<string, DescriptionScoreCacheEntry>;

  /**
   * Cached activity scores by activity ID
   * Key: activityId
   * Value: Cache entry with hash and score
   */
  activityScores: Map<string, ActivityScoreCacheEntry>;

  /**
   * Track which activities were analyzed in the last run
   * Used for detecting added/removed activities
   */
  lastActivityIds: Set<string>;

  /**
   * Accumulated statistics for this session
   */
  stats: SessionCacheStats;
}

/**
 * Statistics tracked per session
 */
export interface SessionCacheStats {
  /** Total scoring requests made in this session */
  totalRequests: number;
  /** Description scores served from cache */
  descriptionCacheHits: number;
  /** Description scores computed fresh */
  descriptionCacheMisses: number;
  /** Activity scores served from cache */
  activityCacheHits: number;
  /** Activity scores computed fresh */
  activityCacheMisses: number;
  /** Estimated cost saved by caching (USD) */
  estimatedCostSaved: number;
  /** Estimated time saved by caching (ms) */
  estimatedTimeSaved: number;
}

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * Configuration options for the scoring cache
 */
export interface ScoringCacheConfig {
  /** Whether caching is enabled (default: true) */
  enabled: boolean;

  /** Session timeout in milliseconds (default: 1 hour) */
  sessionTimeoutMs: number;

  /** Maximum number of sessions to keep in memory (default: 1000) */
  maxSessions: number;

  /** Maximum entries per session (default: 50) */
  maxEntriesPerSession: number;

  /**
   * Whether to auto-invalidate on version changes (default: true)
   * When true, cached entries with different cacheVersion are ignored
   */
  invalidateOnVersionChange: boolean;

  /**
   * Estimated costs for savings calculations
   */
  costEstimates: {
    descriptionScoringPerActivity: number;  // ~$0.003
    activityScoringPerActivity: number;     // ~$0.004
    portfolioScoring: number;               // ~$0.02
    teaching: number;                       // ~$0.06
  };

  /**
   * Estimated timing for savings calculations
   */
  timingEstimates: {
    descriptionScoringMs: number;  // ~500ms
    activityScoringMs: number;     // ~800ms
  };
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: ScoringCacheConfig = {
  enabled: true,
  sessionTimeoutMs: 60 * 60 * 1000, // 1 hour
  maxSessions: 1000,
  maxEntriesPerSession: 50,
  invalidateOnVersionChange: true,
  costEstimates: {
    descriptionScoringPerActivity: 0.003,
    activityScoringPerActivity: 0.004,
    portfolioScoring: 0.02,
    teaching: 0.06,
  },
  timingEstimates: {
    descriptionScoringMs: 500,
    activityScoringMs: 800,
  },
};

// ============================================================================
// CACHE RESULT TYPES
// ============================================================================

/**
 * Result of a cache lookup
 */
export interface CacheLookupResult<T> {
  /** Whether a valid cached entry was found */
  hit: boolean;
  /** The cached value (if hit is true) */
  value?: T;
  /** The computed hash for this input */
  inputHash: string;
  /** Reason for miss (if hit is false) */
  missReason?: 'not_found' | 'hash_mismatch' | 'version_mismatch' | 'expired' | 'cache_disabled';
}

/**
 * Information about cache usage in a scoring run
 * This is included in the orchestrator result for transparency
 */
export interface CacheUsageInfo {
  /** Session ID used */
  sessionId: string;

  /** Whether caching was enabled for this run */
  cacheEnabled: boolean;

  /** Whether fresh analysis was forced (ignoring cache) */
  forcedFresh: boolean;

  /** Per-activity cache status */
  activityCacheStatus: {
    activityId: string;
    activityTitle: string;
    descriptionScoreStatus: 'cached' | 'fresh';
    activityScoreStatus: 'cached' | 'fresh';
    changeDetected: boolean;
  }[];

  /** Summary counts */
  summary: {
    totalActivities: number;
    descriptionsCached: number;
    descriptionsFresh: number;
    activitiesCached: number;
    activitiesFresh: number;
    /** Portfolio scoring is always fresh */
    portfolioScoringStatus: 'fresh';
    /** Teaching status (fresh or skipped if not requested) */
    teachingStatus: 'fresh' | 'skipped';
  };

  /** Estimated savings from caching */
  savings: {
    apiCallsSaved: number;
    estimatedCostSaved: number;
    estimatedTimeSaved: number;
  };
}

// ============================================================================
// INPUT NORMALIZATION TYPES
// ============================================================================

/**
 * Normalized input for description scoring cache
 * These are the fields that affect the score
 */
export interface NormalizedDescriptionInput {
  description: string;
  activityTitle: string;
  activityType: string;
  position: string;
}

/**
 * Normalized input for activity scoring cache
 * These are the fields that affect the score
 */
export interface NormalizedActivityInput {
  title: string;
  description: string;
  type: string;
  position: string;
  organization: string;
  grades: number[];
  hoursPerWeek: number;
  weeksPerYear: number;
  honors: string;
  // Note: intendedMajor is NOT included because individual activity
  // scores are absolute, not relative to major. Major alignment
  // is computed at the portfolio level.
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Activity change detection result
 */
export interface ActivityChangeDetection {
  activityId: string;
  isNew: boolean;
  isRemoved: boolean;
  descriptionChanged: boolean;
  activityDetailsChanged: boolean;
  previousDescriptionHash?: string;
  currentDescriptionHash: string;
  previousActivityHash?: string;
  currentActivityHash: string;
}

/**
 * Batch change detection result
 */
export interface PortfolioChangeDetection {
  /** Activities that are new (not in previous run) */
  newActivities: string[];
  /** Activities that were removed (in previous run but not current) */
  removedActivities: string[];
  /** Activities with changed descriptions */
  changedDescriptions: string[];
  /** Activities with changed details (hours, grades, etc.) */
  changedDetails: string[];
  /** Activities with no changes */
  unchanged: string[];
  /** Whether the overall portfolio composition changed */
  portfolioCompositionChanged: boolean;
  /** Per-activity breakdown */
  perActivity: Map<string, ActivityChangeDetection>;
}
