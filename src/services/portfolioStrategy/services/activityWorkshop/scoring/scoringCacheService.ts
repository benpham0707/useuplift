/**
 * Scoring Cache Service
 *
 * Intelligent caching system for activity scoring that:
 * - Caches individual description and activity scores
 * - Detects changes between scoring runs
 * - Preserves quality by always running holistic analysis fresh
 * - Provides clear visibility into cache hits/misses
 *
 * HOW IT WORKS WITH BATCH CALLS:
 * The scoring pipeline uses batch API calls (all descriptions in one call,
 * all activities in another call). This cache reduces the BATCH SIZE:
 *
 * Example with 10 activities, 9 unchanged:
 * - Without cache: 2 batch calls (10 desc + 10 act) + 1 portfolio = 3 calls
 * - With cache: 2 smaller batches (1 desc + 1 act) + 1 portfolio = 3 calls
 *
 * Savings come from:
 * 1. Smaller prompts = fewer input tokens = lower cost
 * 2. Smaller outputs = fewer output tokens = lower cost
 * 3. Faster responses = less latency
 *
 * QUALITY GUARANTEE:
 * This cache ONLY stores deterministic, per-activity scores.
 * Portfolio-level analysis and teaching are NEVER cached.
 * This ensures holistic quality while optimizing individual scoring.
 */

import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { DescriptionScore, DescriptionScoringInput } from './descriptionScoringService';
import { ActivityScore, ActivityScoringInput } from './activityScoringService';

import {
  ScoringSession,
  SessionCacheStats,
  ScoringCacheConfig,
  DEFAULT_CACHE_CONFIG,
  CacheLookupResult,
  DescriptionScoreCacheEntry,
  ActivityScoreCacheEntry,
  NormalizedDescriptionInput,
  NormalizedActivityInput,
  ActivityChangeDetection,
  PortfolioChangeDetection,
  CacheUsageInfo,
  SCORING_CACHE_VERSION,
  SCORING_MODEL_VERSIONS,
} from './scoringCacheTypes';

// ============================================================================
// SCORING CACHE SERVICE
// ============================================================================

export class ScoringCacheService {
  private sessions: Map<string, ScoringSession> = new Map();
  private config: ScoringCacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ScoringCacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };

    // Start cleanup interval to expire old sessions
    if (this.config.enabled) {
      this.cleanupInterval = setInterval(
        () => this.cleanupExpiredSessions(),
        5 * 60 * 1000 // Every 5 minutes
      );
    }
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new scoring session
   */
  createSession(): string {
    const sessionId = uuidv4();
    const now = new Date();

    const session: ScoringSession = {
      sessionId,
      createdAt: now,
      lastAccessedAt: now,
      descriptionScores: new Map(),
      activityScores: new Map(),
      lastActivityIds: new Set(),
      stats: this.createEmptyStats(),
    };

    // Enforce max sessions limit
    if (this.sessions.size >= this.config.maxSessions) {
      this.evictOldestSession();
    }

    this.sessions.set(sessionId, session);
    console.log(`[ScoringCache] Created session ${sessionId}`);

    return sessionId;
  }

  /**
   * Get an existing session or create a new one
   */
  getOrCreateSession(sessionId?: string): ScoringSession {
    if (sessionId && this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId)!;
      session.lastAccessedAt = new Date();
      return session;
    }

    // Create new session if not found or not provided
    const newSessionId = sessionId || this.createSession();
    return this.sessions.get(newSessionId) || this.sessions.get(this.createSession())!;
  }

  /**
   * Get session without creating
   */
  getSession(sessionId: string): ScoringSession | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessedAt = new Date();
    }
    return session;
  }

  /**
   * Invalidate a session (clear all cached data)
   */
  invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.descriptionScores.clear();
      session.activityScores.clear();
      session.lastActivityIds.clear();
      console.log(`[ScoringCache] Invalidated session ${sessionId}`);
    }
  }

  /**
   * Delete a session entirely
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`[ScoringCache] Deleted session ${sessionId}`);
  }

  // ==========================================================================
  // DESCRIPTION SCORE CACHING
  // ==========================================================================

  /**
   * Look up a cached description score
   */
  getDescriptionScore(
    sessionId: string,
    activityId: string,
    input: DescriptionScoringInput
  ): CacheLookupResult<DescriptionScore> {
    if (!this.config.enabled) {
      return {
        hit: false,
        inputHash: this.computeDescriptionHash(input),
        missReason: 'cache_disabled',
      };
    }

    const session = this.getSession(sessionId);
    if (!session) {
      return {
        hit: false,
        inputHash: this.computeDescriptionHash(input),
        missReason: 'not_found',
      };
    }

    const inputHash = this.computeDescriptionHash(input);
    const entry = session.descriptionScores.get(activityId);

    if (!entry) {
      return { hit: false, inputHash, missReason: 'not_found' };
    }

    // Check hash match
    if (entry.inputHash !== inputHash) {
      return { hit: false, inputHash, missReason: 'hash_mismatch' };
    }

    // Check version match
    if (
      this.config.invalidateOnVersionChange &&
      entry.cacheVersion !== SCORING_CACHE_VERSION
    ) {
      return { hit: false, inputHash, missReason: 'version_mismatch' };
    }

    // Cache hit!
    session.stats.descriptionCacheHits++;
    session.stats.estimatedCostSaved += this.config.costEstimates.descriptionScoringPerActivity;
    session.stats.estimatedTimeSaved += this.config.timingEstimates.descriptionScoringMs;

    return { hit: true, value: entry.score, inputHash };
  }

  /**
   * Store a description score in cache
   */
  setDescriptionScore(
    sessionId: string,
    activityId: string,
    input: DescriptionScoringInput,
    score: DescriptionScore
  ): void {
    if (!this.config.enabled) return;

    const session = this.getOrCreateSession(sessionId);

    // Enforce max entries per session
    if (session.descriptionScores.size >= this.config.maxEntriesPerSession) {
      // Remove oldest entry
      const oldestKey = session.descriptionScores.keys().next().value;
      if (oldestKey) session.descriptionScores.delete(oldestKey);
    }

    const entry: DescriptionScoreCacheEntry = {
      type: 'description',
      inputHash: this.computeDescriptionHash(input),
      createdAt: new Date(),
      cacheVersion: SCORING_CACHE_VERSION,
      modelVersion: SCORING_MODEL_VERSIONS.descriptionScoring,
      score,
    };

    session.descriptionScores.set(activityId, entry);
    session.stats.descriptionCacheMisses++; // This was a miss that led to caching
  }

  // ==========================================================================
  // ACTIVITY SCORE CACHING
  // ==========================================================================

  /**
   * Look up a cached activity score
   */
  getActivityScore(
    sessionId: string,
    activityId: string,
    input: ActivityScoringInput
  ): CacheLookupResult<ActivityScore> {
    if (!this.config.enabled) {
      return {
        hit: false,
        inputHash: this.computeActivityHash(input),
        missReason: 'cache_disabled',
      };
    }

    const session = this.getSession(sessionId);
    if (!session) {
      return {
        hit: false,
        inputHash: this.computeActivityHash(input),
        missReason: 'not_found',
      };
    }

    const inputHash = this.computeActivityHash(input);
    const entry = session.activityScores.get(activityId);

    if (!entry) {
      return { hit: false, inputHash, missReason: 'not_found' };
    }

    // Check hash match
    if (entry.inputHash !== inputHash) {
      return { hit: false, inputHash, missReason: 'hash_mismatch' };
    }

    // Check version match
    if (
      this.config.invalidateOnVersionChange &&
      entry.cacheVersion !== SCORING_CACHE_VERSION
    ) {
      return { hit: false, inputHash, missReason: 'version_mismatch' };
    }

    // Cache hit!
    session.stats.activityCacheHits++;
    session.stats.estimatedCostSaved += this.config.costEstimates.activityScoringPerActivity;
    session.stats.estimatedTimeSaved += this.config.timingEstimates.activityScoringMs;

    return { hit: true, value: entry.score, inputHash };
  }

  /**
   * Store an activity score in cache
   */
  setActivityScore(
    sessionId: string,
    activityId: string,
    input: ActivityScoringInput,
    score: ActivityScore
  ): void {
    if (!this.config.enabled) return;

    const session = this.getOrCreateSession(sessionId);

    // Enforce max entries per session
    if (session.activityScores.size >= this.config.maxEntriesPerSession) {
      // Remove oldest entry
      const oldestKey = session.activityScores.keys().next().value;
      if (oldestKey) session.activityScores.delete(oldestKey);
    }

    const entry: ActivityScoreCacheEntry = {
      type: 'activity',
      inputHash: this.computeActivityHash(input),
      createdAt: new Date(),
      cacheVersion: SCORING_CACHE_VERSION,
      modelVersion: SCORING_MODEL_VERSIONS.activityScoring,
      score,
    };

    session.activityScores.set(activityId, entry);
    session.stats.activityCacheMisses++; // This was a miss that led to caching
  }

  // ==========================================================================
  // CHANGE DETECTION
  // ==========================================================================

  /**
   * Detect what changed between the last scoring run and current input
   * This helps users understand what will be re-scored
   */
  detectChanges(
    sessionId: string,
    activities: { id: string; descriptionInput: DescriptionScoringInput; activityInput: ActivityScoringInput }[]
  ): PortfolioChangeDetection {
    const session = this.getSession(sessionId);
    const currentIds = new Set(activities.map((a) => a.id));
    const previousIds = session?.lastActivityIds || new Set();

    const result: PortfolioChangeDetection = {
      newActivities: [],
      removedActivities: [],
      changedDescriptions: [],
      changedDetails: [],
      unchanged: [],
      portfolioCompositionChanged: false,
      perActivity: new Map(),
    };

    // Detect new activities
    for (const id of currentIds) {
      if (!previousIds.has(id)) {
        result.newActivities.push(id);
      }
    }

    // Detect removed activities
    for (const id of previousIds) {
      if (!currentIds.has(id)) {
        result.removedActivities.push(id);
      }
    }

    result.portfolioCompositionChanged =
      result.newActivities.length > 0 || result.removedActivities.length > 0;

    // Analyze each activity
    for (const activity of activities) {
      const descriptionHash = this.computeDescriptionHash(activity.descriptionInput);
      const activityHash = this.computeActivityHash(activity.activityInput);

      const previousDescEntry = session?.descriptionScores.get(activity.id);
      const previousActEntry = session?.activityScores.get(activity.id);

      const detection: ActivityChangeDetection = {
        activityId: activity.id,
        isNew: !previousIds.has(activity.id),
        isRemoved: false,
        descriptionChanged: !previousDescEntry || previousDescEntry.inputHash !== descriptionHash,
        activityDetailsChanged: !previousActEntry || previousActEntry.inputHash !== activityHash,
        previousDescriptionHash: previousDescEntry?.inputHash,
        currentDescriptionHash: descriptionHash,
        previousActivityHash: previousActEntry?.inputHash,
        currentActivityHash: activityHash,
      };

      result.perActivity.set(activity.id, detection);

      if (detection.isNew) {
        // Already in newActivities
      } else if (detection.descriptionChanged) {
        result.changedDescriptions.push(activity.id);
      } else if (detection.activityDetailsChanged) {
        result.changedDetails.push(activity.id);
      } else {
        result.unchanged.push(activity.id);
      }
    }

    return result;
  }

  /**
   * Update session with current activity IDs for next comparison
   */
  updateLastActivityIds(sessionId: string, activityIds: string[]): void {
    const session = this.getSession(sessionId);
    if (session) {
      session.lastActivityIds = new Set(activityIds);
    }
  }

  // ==========================================================================
  // STATISTICS & REPORTING
  // ==========================================================================

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string): SessionCacheStats | undefined {
    return this.getSession(sessionId)?.stats;
  }

  /**
   * Build cache usage info for inclusion in scoring result
   */
  buildCacheUsageInfo(
    sessionId: string,
    activities: { id: string; title: string }[],
    descriptionCacheResults: Map<string, boolean>,
    activityCacheResults: Map<string, boolean>,
    forcedFresh: boolean,
    teachingRequested: boolean
  ): CacheUsageInfo {
    const session = this.getSession(sessionId);

    let descriptionsCached = 0;
    let descriptionsFresh = 0;
    let activitiesCached = 0;
    let activitiesFresh = 0;

    const activityCacheStatus: CacheUsageInfo['activityCacheStatus'] = [];

    for (const activity of activities) {
      const descHit = descriptionCacheResults.get(activity.id) || false;
      const actHit = activityCacheResults.get(activity.id) || false;

      if (descHit) descriptionsCached++;
      else descriptionsFresh++;

      if (actHit) activitiesCached++;
      else activitiesFresh++;

      activityCacheStatus.push({
        activityId: activity.id,
        activityTitle: activity.title,
        descriptionScoreStatus: descHit ? 'cached' : 'fresh',
        activityScoreStatus: actHit ? 'cached' : 'fresh',
        changeDetected: !descHit || !actHit,
      });
    }

    // Note: We use batch calls, so "activities not scored" is more accurate than "API calls saved"
    // The savings come from smaller batches = fewer tokens = lower cost
    const activitiesSkipped = descriptionsCached + activitiesCached;
    const estimatedCostSaved =
      descriptionsCached * this.config.costEstimates.descriptionScoringPerActivity +
      activitiesCached * this.config.costEstimates.activityScoringPerActivity;
    const estimatedTimeSaved =
      descriptionsCached * this.config.timingEstimates.descriptionScoringMs +
      activitiesCached * this.config.timingEstimates.activityScoringMs;

    return {
      sessionId,
      cacheEnabled: this.config.enabled,
      forcedFresh,
      activityCacheStatus,
      summary: {
        totalActivities: activities.length,
        descriptionsCached,
        descriptionsFresh,
        activitiesCached,
        activitiesFresh,
        portfolioScoringStatus: 'fresh',
        teachingStatus: teachingRequested ? 'fresh' : 'skipped',
      },
      savings: {
        // apiCallsSaved is kept for backwards compatibility, but represents
        // "activity scores served from cache" not actual API calls (we use batching)
        apiCallsSaved: activitiesSkipped,
        estimatedCostSaved,
        estimatedTimeSaved,
      },
    };
  }

  // ==========================================================================
  // HASH COMPUTATION
  // ==========================================================================

  /**
   * Compute hash for description scoring input
   */
  computeDescriptionHash(input: DescriptionScoringInput): string {
    const normalized: NormalizedDescriptionInput = {
      description: this.normalizeString(input.description),
      activityTitle: this.normalizeString(input.activityTitle || ''),
      activityType: this.normalizeString(input.activityType || ''),
      position: this.normalizeString(input.position || ''),
    };

    return this.hashObject({
      ...normalized,
      cacheVersion: SCORING_CACHE_VERSION,
      modelVersion: SCORING_MODEL_VERSIONS.descriptionScoring,
    });
  }

  /**
   * Compute hash for activity scoring input
   */
  computeActivityHash(input: ActivityScoringInput): string {
    const normalized: NormalizedActivityInput = {
      title: this.normalizeString(input.title),
      description: this.normalizeString(input.description),
      type: this.normalizeString(input.type || ''),
      position: this.normalizeString(input.position || ''),
      organization: this.normalizeString(input.organization || ''),
      grades: [...(input.grades || [])].sort(),
      hoursPerWeek: input.hoursPerWeek || 0,
      weeksPerYear: input.weeksPerYear || 0,
      honors: this.normalizeString(input.honors || ''),
      // Note: intendedMajor intentionally NOT included
      // Individual scores are absolute, major alignment is at portfolio level
    };

    return this.hashObject({
      ...normalized,
      cacheVersion: SCORING_CACHE_VERSION,
      modelVersion: SCORING_MODEL_VERSIONS.activityScoring,
    });
  }

  /**
   * Hash an object deterministically
   */
  private hashObject(obj: unknown): string {
    const json = JSON.stringify(obj, Object.keys(obj as object).sort());
    return crypto.createHash('sha256').update(json).digest('hex').substring(0, 16);
  }

  /**
   * Normalize a string for consistent hashing
   */
  private normalizeString(str: string): string {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // ==========================================================================
  // INTERNAL HELPERS
  // ==========================================================================

  private createEmptyStats(): SessionCacheStats {
    return {
      totalRequests: 0,
      descriptionCacheHits: 0,
      descriptionCacheMisses: 0,
      activityCacheHits: 0,
      activityCacheMisses: 0,
      estimatedCostSaved: 0,
      estimatedTimeSaved: 0,
    };
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastAccessedAt.getTime() > this.config.sessionTimeoutMs) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.sessions.delete(sessionId);
      console.log(`[ScoringCache] Expired session ${sessionId}`);
    }

    if (expiredSessions.length > 0) {
      console.log(`[ScoringCache] Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  private evictOldestSession(): void {
    let oldestSession: string | null = null;
    let oldestTime = Infinity;

    for (const [sessionId, session] of this.sessions) {
      if (session.lastAccessedAt.getTime() < oldestTime) {
        oldestTime = session.lastAccessedAt.getTime();
        oldestSession = sessionId;
      }
    }

    if (oldestSession) {
      this.sessions.delete(oldestSession);
      console.log(`[ScoringCache] Evicted oldest session ${oldestSession}`);
    }
  }

  /**
   * Cleanup resources (call when shutting down)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
  }
}

// Export singleton instance
export const scoringCacheService = new ScoringCacheService();
