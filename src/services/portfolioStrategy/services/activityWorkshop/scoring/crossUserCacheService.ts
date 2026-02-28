/**
 * Cross-User Cache Service
 *
 * Supabase-backed cache that shares scoring results across users for identical
 * activity fingerprints. When two different users submit the same activity
 * description (e.g., "Math Club member"), the second user's scoring can be
 * served from cache instead of making redundant LLM calls.
 *
 * HOW IT WORKS:
 * 1. Compute a SHA-256 fingerprint from: description + role + category + hours + years
 * 2. Look up the fingerprint in the Supabase `activity_scoring_cache` table
 * 3. If found and valid (matching KB + model versions, within TTL), return cached scores
 * 4. If not found or invalid, return null — caller runs the full scoring pipeline
 * 5. After scoring, caller writes the result back to the cache
 *
 * WHAT'S CACHED:
 * - Individual description scores (total + breakdown)
 * - Individual activity scores (total + components)
 * - Tier classification (internal 6-tier + external 4-tier)
 *
 * WHAT'S NEVER CACHED:
 * - Portfolio-level scoring (depends on full activity ensemble)
 * - Teaching layer output (always fresh, personalized)
 *
 * CACHE INVALIDATION:
 * - Automatic on KB version change (KB_VERSION from knowledge/index.ts)
 * - Automatic on model version change (SCORING_MODEL_VERSIONS)
 * - Manual via invalidateAll() for emergency purges
 * - TTL-based expiry (default 7 days)
 *
 * PRIVACY:
 * - Fingerprints are one-way hashes — original text is NOT recoverable
 * - No user IDs are stored in the cache table
 * - Only scoring RESULTS are stored, not activity descriptions
 */

import * as crypto from 'crypto';

import { KB_VERSION } from './knowledge/index';
import { SCORING_MODEL_VERSIONS } from './scoringCacheTypes';
import type { InternalTier, ExternalTier } from './types';

import type {
  ActivityFingerprintInput,
  ActivityFingerprint,
  CrossUserCacheEntry,
  CrossUserCacheLookupResult,
  CrossUserCacheConfig,
  CrossUserCacheStats,
  ActivityScoringCacheRow,
} from './crossUserCacheTypes';

import { DEFAULT_CROSS_USER_CACHE_CONFIG } from './crossUserCacheTypes';

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Cross-User Cache Service
 *
 * Provides Supabase-backed caching for activity scoring results that can be
 * shared across all users. Uses content-based fingerprinting (SHA-256) to
 * match identical activity inputs regardless of who submitted them.
 */
export class CrossUserCacheService {
  private config: CrossUserCacheConfig;
  private lookupCount: number = 0;
  private hitCount: number = 0;

  constructor(config: Partial<CrossUserCacheConfig> = {}) {
    this.config = { ...DEFAULT_CROSS_USER_CACHE_CONFIG, ...config };

    // M8: Validate maxAgeMs — reject ≤0, NaN, non-finite
    if (
      typeof this.config.maxAgeMs !== 'number' ||
      !Number.isFinite(this.config.maxAgeMs) ||
      this.config.maxAgeMs <= 0
    ) {
      console.warn(
        `[CrossUserCache] Invalid maxAgeMs (${this.config.maxAgeMs}), falling back to default`
      );
      this.config.maxAgeMs = DEFAULT_CROSS_USER_CACHE_CONFIG.maxAgeMs;
    }

    // M8: Validate maxEntries — reject ≤0, NaN, non-finite
    if (
      typeof this.config.maxEntries !== 'number' ||
      !Number.isFinite(this.config.maxEntries) ||
      this.config.maxEntries <= 0
    ) {
      console.warn(
        `[CrossUserCache] Invalid maxEntries (${this.config.maxEntries}), falling back to default`
      );
      this.config.maxEntries = DEFAULT_CROSS_USER_CACHE_CONFIG.maxEntries;
    }
  }

  // ==========================================================================
  // FINGERPRINTING
  // ==========================================================================

  /**
   * Compute a SHA-256 fingerprint for an activity input.
   *
   * The fingerprint is a full 64-character hex string derived from the
   * normalized, sorted JSON representation of the input fields. Normalization
   * ensures that trivial differences (case, whitespace) don't create
   * separate cache entries.
   *
   * Fields included: description, role, category, hoursPerWeek, yearsActive
   * Fields excluded: user ID, activity ID, timestamps, anything user-specific
   */
  computeFingerprint(activity: ActivityFingerprintInput): ActivityFingerprint {
    const normalized: Record<string, string | number> = {
      category: this.normalizeString(activity.category || ''),
      description: this.normalizeString(activity.description),
      hoursPerWeek: activity.hoursPerWeek ?? 0,
      role: this.normalizeString(activity.role || ''),
      yearsActive: activity.yearsActive ?? 0,
    };

    // M4: Include title in fingerprint if present
    if (activity.title !== undefined) {
      normalized.title = this.normalizeString(activity.title);
    }

    // Keys are already sorted alphabetically in the object literal above,
    // but we use sorted keys in stringify for determinism guarantee
    const json = JSON.stringify(normalized, Object.keys(normalized).sort());
    return crypto.createHash('sha256').update(json).digest('hex');
  }

  // ==========================================================================
  // LOOKUP
  // ==========================================================================

  /**
   * Look up a fingerprint in the cross-user cache.
   *
   * Returns null if:
   * - Cache is disabled
   * - No entry exists for this fingerprint
   * - Supabase query fails (graceful degradation)
   *
   * Returns a CrossUserCacheLookupResult with isValid=false if:
   * - KB version has changed since the entry was created
   * - Model version has changed since the entry was created
   * - Entry exceeds the configured maxAgeMs TTL
   *
   * On a valid hit, increments the entry's hit_count and last_hit_at
   * in the background (fire-and-forget, doesn't block the response).
   */
  async lookup(fingerprint: ActivityFingerprint): Promise<CrossUserCacheLookupResult | null> {
    if (!this.config.enabled) {
      return null;
    }

    this.lookupCount++;

    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('activity_scoring_cache')
        .select('*')
        .eq('fingerprint', fingerprint)
        .single();

      if (error || !data) {
        // No entry found — not an error, just a cache miss
        return null;
      }

      const row = data as unknown as ActivityScoringCacheRow;
      const entry = this.rowToEntry(row);
      const cacheAge = Date.now() - entry.createdAt.getTime();

      // Validate KB version
      if (entry.kbVersion !== KB_VERSION) {
        return {
          entry,
          cacheAge,
          isValid: false,
          invalidReason: 'kb_version_mismatch',
        };
      }

      // Validate model version (use description scoring model as reference)
      if (entry.modelVersion !== SCORING_MODEL_VERSIONS.descriptionScoring) {
        return {
          entry,
          cacheAge,
          isValid: false,
          invalidReason: 'model_version_mismatch',
        };
      }

      // Validate TTL
      if (cacheAge > this.config.maxAgeMs) {
        return {
          entry,
          cacheAge,
          isValid: false,
          invalidReason: 'expired',
        };
      }

      // Valid hit — increment counters in the background
      this.hitCount++;
      this.incrementHitCount(fingerprint).catch((err) => {
        console.warn('[CrossUserCache] Failed to increment hit count:', err);
      });

      return {
        entry,
        cacheAge,
        isValid: true,
      };
    } catch (error) {
      // Graceful degradation — cache failure should never block scoring
      console.error('[CrossUserCache] Lookup failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  // ==========================================================================
  // WRITE
  // ==========================================================================

  /**
   * Write a scoring result to the cross-user cache.
   *
   * Uses upsert (ON CONFLICT fingerprint) so that re-scoring an activity
   * updates the existing entry rather than creating a duplicate.
   *
   * Stores the current KB_VERSION and model version so that future lookups
   * can detect when the cache entry was produced by an outdated pipeline.
   */
  async write(
    fingerprint: ActivityFingerprint,
    scores: {
      descriptionTotal: number;
      descriptionBreakdown: Record<string, unknown>;
      activityTotal: number;
      activityComponents: Record<string, unknown>;
      internalTier: InternalTier;
      externalTier: ExternalTier;
    }
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    // H4: Validate scores before writing
    if (
      !this.validateScores({
        activityScore: {
          total: scores.activityTotal,
          components: scores.activityComponents,
        },
        descriptionScore: {
          total: scores.descriptionTotal,
          breakdown: scores.descriptionBreakdown,
        },
        tierClassification: {
          internalTier: scores.internalTier,
          externalTier: scores.externalTier,
        },
      })
    ) {
      return false;
    }

    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      const row = {
        fingerprint,
        description_score: {
          total: scores.descriptionTotal,
          breakdown: scores.descriptionBreakdown,
        },
        activity_score: {
          total: scores.activityTotal,
          components: scores.activityComponents,
        },
        tier_classification: {
          internalTier: scores.internalTier,
          externalTier: scores.externalTier,
        },
        kb_version: KB_VERSION,
        model_version: SCORING_MODEL_VERSIONS.descriptionScoring,
        hit_count: 0,
        last_hit_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from('activity_scoring_cache')
        .upsert(row, { onConflict: 'fingerprint' });

      if (error) {
        console.error('[CrossUserCache] Write failed:', error.message);
        return false;
      }

      console.log(`[CrossUserCache] Wrote entry for fingerprint ${fingerprint.substring(0, 12)}...`);

      // M2: Enforce max entries after successful write (fire-and-forget)
      this.enforceMaxEntries().catch((err) => {
        console.warn('[CrossUserCache] Failed to enforce max entries:', err);
      });

      return true;
    } catch (error) {
      console.error('[CrossUserCache] Write failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // ==========================================================================
  // INVALIDATION
  // ==========================================================================

  /**
   * Invalidate all cache entries.
   *
   * Use this for emergency purges or when a fundamental change to the
   * scoring pipeline makes all cached results unreliable. For routine
   * version bumps, the lookup-time validation handles invalidation
   * automatically without needing to delete rows.
   *
   * Returns the number of entries deleted.
   */
  async invalidateAll(): Promise<number> {
    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      // Delete all rows — Supabase requires a filter, so we use a truthy condition
      const { data, error } = await supabaseAdmin
        .from('activity_scoring_cache')
        .delete()
        .neq('fingerprint', '')
        .select('id');

      if (error) {
        console.error('[CrossUserCache] Invalidation failed:', error.message);
        return 0;
      }

      const count = data?.length ?? 0;
      console.log(`[CrossUserCache] Invalidated all ${count} entries`);

      // Reset local counters
      this.lookupCount = 0;
      this.hitCount = 0;

      return count;
    } catch (error) {
      console.error('[CrossUserCache] Invalidation failed:', error instanceof Error ? error.message : 'Unknown error');
      return 0;
    }
  }

  /**
   * Invalidate a single cache entry by its fingerprint.
   *
   * Returns true if the entry was found and deleted, false otherwise.
   */
  async invalidateByFingerprint(fingerprint: string): Promise<boolean> {
    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      const { data, error } = await supabaseAdmin
        .from('activity_scoring_cache')
        .delete()
        .eq('fingerprint', fingerprint)
        .select('id');

      if (error) {
        console.error('[CrossUserCache] Invalidate by fingerprint failed:', error.message);
        return false;
      }

      const deleted = data?.length ?? 0;
      if (deleted > 0) {
        console.log(`[CrossUserCache] Invalidated entry for fingerprint ${fingerprint.substring(0, 12)}...`);
      }
      return deleted > 0;
    } catch (error) {
      console.error('[CrossUserCache] Invalidate by fingerprint failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  /**
   * Get aggregate cache statistics.
   *
   * Returns entry count, total hits, average cache age, and hit rate.
   * The hit rate is computed from the in-memory lookup/hit counters
   * for the current process lifetime.
   */
  async getStats(): Promise<CrossUserCacheStats> {
    try {
      const { supabaseAdmin } = await this.getSupabaseAdmin();

      // H5: Use count query instead of fetching all rows into memory
      const { count, error: countError } = await supabaseAdmin
        .from('activity_scoring_cache')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('[CrossUserCache] Stats count query failed:', countError.message);
        return this.emptyStats();
      }

      const entryCount = count ?? 0;

      if (entryCount === 0) {
        return this.emptyStats();
      }

      // H5: Use capped sample (max 1000 rows) for hit/age estimates
      const { data, error: sampleError } = await supabaseAdmin
        .from('activity_scoring_cache')
        .select('hit_count, created_at, last_hit_at')
        .limit(1000);

      if (sampleError || !data) {
        console.error('[CrossUserCache] Stats sample query failed:', sampleError?.message);
        return this.emptyStats();
      }

      const rows = data as unknown as Array<{ hit_count: number; created_at: string; last_hit_at: string }>;
      const sampleSize = rows.length;

      const now = Date.now();
      let sampleHits = 0;
      let sampleAgeMs = 0;

      for (const row of rows) {
        sampleHits += row.hit_count;
        sampleAgeMs += now - new Date(row.created_at).getTime();
      }

      // Extrapolate total hits from sample if we're sampling a subset
      const totalHits = sampleSize < entryCount
        ? Math.round(sampleHits * (entryCount / sampleSize))
        : sampleHits;

      const avgCacheAgeMs = Math.round(sampleAgeMs / sampleSize);
      const hitRate = this.lookupCount > 0 ? this.hitCount / this.lookupCount : -1;

      return {
        entryCount,
        totalHits,
        avgCacheAgeMs,
        hitRate,
      };
    } catch (error) {
      console.error('[CrossUserCache] Stats failed:', error instanceof Error ? error.message : 'Unknown error');
      return this.emptyStats();
    }
  }

  // ==========================================================================
  // INTERNAL HELPERS
  // ==========================================================================

  /**
   * Normalize a string for consistent fingerprinting.
   * Trims, lowercases, and collapses whitespace.
   */
  private normalizeString(str: string): string {
    return str.trim().toLowerCase().replace(/\s+/g, ' ').normalize('NFC');
  }

  /**
   * Lazily import the Supabase admin client.
   * Uses dynamic import to avoid loading Supabase at module init time,
   * which would throw if env vars aren't configured (e.g., in tests).
   */
  private async getSupabaseAdmin(): Promise<{ supabaseAdmin: import('@supabase/supabase-js').SupabaseClient }> {
    const { supabaseAdmin } = await import('@/supabase/admin');
    return { supabaseAdmin };
  }

  /**
   * Increment hit_count and update last_hit_at for a cache entry.
   * Fire-and-forget — errors are logged but don't affect the caller.
   */
  private async incrementHitCount(fingerprint: ActivityFingerprint): Promise<void> {
    const { supabaseAdmin } = await this.getSupabaseAdmin();

    // Supabase doesn't support atomic increment, so we read-then-write.
    // This is fine for hit counting — minor races don't matter.
    const { data } = await supabaseAdmin
      .from('activity_scoring_cache')
      .select('hit_count')
      .eq('fingerprint', fingerprint)
      .single();

    if (data) {
      const row = data as unknown as { hit_count: number };
      await supabaseAdmin
        .from('activity_scoring_cache')
        .update({
          hit_count: row.hit_count + 1,
          last_hit_at: new Date().toISOString(),
        })
        .eq('fingerprint', fingerprint);
    }
  }

  /**
   * Convert a Supabase row to a CrossUserCacheEntry.
   */
  private rowToEntry(row: ActivityScoringCacheRow): CrossUserCacheEntry {
    return {
      id: row.id,
      fingerprint: row.fingerprint,
      descriptionScore: row.description_score,
      activityScore: row.activity_score,
      tierClassification: row.tier_classification,
      kbVersion: row.kb_version,
      modelVersion: row.model_version,
      hitCount: row.hit_count,
      createdAt: new Date(row.created_at),
      lastHitAt: new Date(row.last_hit_at),
    };
  }

  /**
   * H4: Validate scores before writing to cache.
   * Rejects entries with out-of-range totals, invalid tiers, or NaN values.
   */
  private validateScores(scores: {
    activityScore: { total: number; components: Record<string, unknown> };
    descriptionScore: { total: number; breakdown: Record<string, unknown> };
    tierClassification: { internalTier: number; externalTier: number };
  }): boolean {
    const { activityScore, descriptionScore, tierClassification } = scores;

    // Reject NaN values
    if (
      Number.isNaN(activityScore.total) ||
      Number.isNaN(descriptionScore.total) ||
      Number.isNaN(tierClassification.internalTier) ||
      Number.isNaN(tierClassification.externalTier)
    ) {
      console.warn('[CrossUserCache] Score validation failed: NaN value detected');
      return false;
    }

    // Reject totals outside 0-10
    if (activityScore.total < 0 || activityScore.total > 10) {
      console.warn(`[CrossUserCache] Score validation failed: activityScore.total (${activityScore.total}) outside 0-10`);
      return false;
    }

    if (descriptionScore.total < 0 || descriptionScore.total > 10) {
      console.warn(`[CrossUserCache] Score validation failed: descriptionScore.total (${descriptionScore.total}) outside 0-10`);
      return false;
    }

    // Reject internalTier outside 1-6
    if (tierClassification.internalTier < 1 || tierClassification.internalTier > 6) {
      console.warn(`[CrossUserCache] Score validation failed: internalTier (${tierClassification.internalTier}) outside 1-6`);
      return false;
    }

    // Reject externalTier outside 1-4
    if (tierClassification.externalTier < 1 || tierClassification.externalTier > 4) {
      console.warn(`[CrossUserCache] Score validation failed: externalTier (${tierClassification.externalTier}) outside 1-4`);
      return false;
    }

    return true;
  }

  /**
   * M2: Enforce maximum cache entries by deleting oldest rows.
   * Called after successful writes (fire-and-forget).
   */
  private async enforceMaxEntries(): Promise<void> {
    const { supabaseAdmin } = await this.getSupabaseAdmin();

    // Get total count via count query
    const { count, error: countError } = await supabaseAdmin
      .from('activity_scoring_cache')
      .select('*', { count: 'exact', head: true });

    if (countError || count === null) {
      return;
    }

    if (count <= this.config.maxEntries) {
      return;
    }

    const deleteCount = count - this.config.maxEntries;

    // Find the oldest entries by last_hit_at
    const { data: oldestRows, error: selectError } = await supabaseAdmin
      .from('activity_scoring_cache')
      .select('id')
      .order('last_hit_at', { ascending: true })
      .limit(deleteCount);

    if (selectError || !oldestRows || oldestRows.length === 0) {
      return;
    }

    const idsToDelete = (oldestRows as unknown as Array<{ id: string }>).map((r) => r.id);

    const { error: deleteError } = await supabaseAdmin
      .from('activity_scoring_cache')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.warn(`[CrossUserCache] Failed to enforce max entries: ${deleteError.message}`);
    } else {
      console.log(`[CrossUserCache] Evicted ${idsToDelete.length} oldest entries (max: ${this.config.maxEntries})`);
    }
  }

  /**
   * Return empty stats for error/empty cases.
   */
  private emptyStats(): CrossUserCacheStats {
    return {
      entryCount: 0,
      totalHits: 0,
      avgCacheAgeMs: 0,
      hitRate: this.lookupCount > 0 ? this.hitCount / this.lookupCount : -1,
    };
  }
}

// Export singleton instance
export const crossUserCacheService = new CrossUserCacheService();
