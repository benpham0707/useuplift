/**
 * Portfolio Strategy Caching Utilities
 *
 * In-memory caching with TTL for expensive analysis operations.
 * Designed for API caching with Supabase integration support.
 *
 * QUALITY PRINCIPLES:
 * - Cache invalidation is explicit and traceable
 * - TTL prevents stale data
 * - Memory-efficient LRU eviction
 */

import { generateInputHash } from './scoring';

// ============================================================================
// CACHE TYPES
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
  inputHash: string;
  hitCount: number;
  lastAccessedAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: number;
}

export interface CacheConfig {
  maxSize: number;        // Maximum number of entries
  defaultTTLMs: number;   // Default time-to-live in milliseconds
  cleanupIntervalMs: number; // How often to clean expired entries
}

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

/**
 * LRU (Least Recently Used) Cache with TTL
 * Used for caching expensive analysis results
 */
export class AnalysisCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private stats: { hits: number; misses: number } = { hits: 0, misses: 0 };
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      defaultTTLMs: config.defaultTTLMs ?? 30 * 60 * 1000, // 30 minutes default
      cleanupIntervalMs: config.cleanupIntervalMs ?? 5 * 60 * 1000, // 5 minutes
    };

    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time and hit count
    entry.lastAccessedAt = Date.now();
    entry.hitCount++;
    this.stats.hits++;

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, inputHash: string, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      createdAt: now,
      expiresAt: now + (ttlMs ?? this.config.defaultTTLMs),
      inputHash,
      hitCount: 0,
      lastAccessedAt: now,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if cache has valid entry for key
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate entry by key
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate entries for a specific user
   */
  invalidateUser(userId: string): number {
    return this.invalidatePattern(new RegExp(`^${userId}:`));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  /**
   * Get entry metadata without updating access time
   */
  getMetadata(key: string): Omit<CacheEntry<T>, 'data'> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return {
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
      inputHash: entry.inputHash,
      hitCount: entry.hitCount,
      lastAccessedAt: entry.lastAccessedAt,
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cleanupTimer = setInterval(() => this.cleanup(), this.config.cleanupIntervalMs);
  }

  /**
   * Stop cleanup timer (call when shutting down)
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

// ============================================================================
// CACHE KEY UTILITIES
// ============================================================================

/**
 * Generate cache key for user analysis
 */
export function generateAnalysisCacheKey(userId: string, analysisType: string): string {
  return `${userId}:${analysisType}`;
}

/**
 * Generate cache key with data hash
 */
export function generateHashedCacheKey(
  userId: string,
  analysisType: string,
  inputData: unknown
): { key: string; hash: string } {
  const hash = generateInputHash(inputData);
  return {
    key: `${userId}:${analysisType}:${hash}`,
    hash,
  };
}

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Memoize an async function with caching
 */
export function memoizeAsync<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  keyFn: (...args: T) => string,
  cache: AnalysisCache<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const key = keyFn(...args);
    const cached = cache.get(key);

    if (cached !== null) {
      return cached;
    }

    const result = await fn(...args);
    const hash = generateInputHash(args);
    cache.set(key, result, hash);

    return result;
  };
}

// ============================================================================
// DEFAULT CACHE INSTANCES
// ============================================================================

// Cache for academic evaluations
export const academicEvaluationCache = new AnalysisCache<unknown>({
  maxSize: 200,
  defaultTTLMs: 60 * 60 * 1000, // 1 hour - academics change slowly
});

// Cache for activity analysis
export const activityAnalysisCache = new AnalysisCache<unknown>({
  maxSize: 200,
  defaultTTLMs: 30 * 60 * 1000, // 30 minutes
});

// Cache for award evaluations
export const awardEvaluationCache = new AnalysisCache<unknown>({
  maxSize: 200,
  defaultTTLMs: 60 * 60 * 1000, // 1 hour
});

// Cache for holistic synthesis
export const holisticSynthesisCache = new AnalysisCache<unknown>({
  maxSize: 100,
  defaultTTLMs: 15 * 60 * 1000, // 15 minutes - most dynamic
});

// Cache for school fit analysis
export const schoolFitCache = new AnalysisCache<unknown>({
  maxSize: 300, // More schools = more entries
  defaultTTLMs: 60 * 60 * 1000, // 1 hour
});

// Cache for full portfolio analysis
export const portfolioAnalysisCache = new AnalysisCache<unknown>({
  maxSize: 50,
  defaultTTLMs: 30 * 60 * 1000, // 30 minutes
});

// Cache for deep academic reports (~$0.13 per generation, static transcript data)
export const deepAcademicReportCache = new AnalysisCache<unknown>({
  maxSize: 50,
  defaultTTLMs: 2 * 60 * 60 * 1000, // 2 hours — expensive to generate, data doesn't change within session
});

// ============================================================================
// CACHE WARMING
// ============================================================================

/**
 * Pre-warm cache with commonly requested data
 */
export async function warmCache<T>(
  cache: AnalysisCache<T>,
  entries: Array<{ key: string; data: T; hash: string; ttlMs?: number }>
): Promise<void> {
  for (const entry of entries) {
    cache.set(entry.key, entry.data, entry.hash, entry.ttlMs);
  }
}

// ============================================================================
// CACHE PERSISTENCE HOOKS (for Supabase integration)
// ============================================================================

export interface CachePersistenceAdapter<T> {
  save(key: string, entry: CacheEntry<T>): Promise<void>;
  load(key: string): Promise<CacheEntry<T> | null>;
  delete(key: string): Promise<void>;
  loadAll(): Promise<Map<string, CacheEntry<T>>>;
}

/**
 * Create a cache that syncs with external storage
 */
export function createPersistentCache<T>(
  adapter: CachePersistenceAdapter<T>,
  config?: Partial<CacheConfig>
): AnalysisCache<T> & { syncFromStorage: () => Promise<void> } {
  const cache = new AnalysisCache<T>(config);

  // Extend with sync capability
  const extendedCache = cache as AnalysisCache<T> & { syncFromStorage: () => Promise<void> };

  extendedCache.syncFromStorage = async (): Promise<void> => {
    const entries = await adapter.loadAll();
    const now = Date.now();

    for (const [key, entry] of entries) {
      // Only restore non-expired entries
      if (entry.expiresAt > now) {
        cache.set(key, entry.data, entry.inputHash, entry.expiresAt - now);
      }
    }
  };

  return extendedCache;
}

// ============================================================================
// INVALIDATION STRATEGIES
// ============================================================================

export type InvalidationStrategy = 'immediate' | 'background' | 'lazy';

/**
 * Invalidate related caches when data changes
 */
export function invalidateRelatedCaches(
  userId: string,
  changedComponent: 'academic' | 'activities' | 'awards' | 'goals'
): void {
  // Always invalidate the specific component cache
  const cacheMap = {
    academic: academicEvaluationCache,
    activities: activityAnalysisCache,
    awards: awardEvaluationCache,
    goals: schoolFitCache,
  };

  cacheMap[changedComponent]?.invalidateUser(userId);

  // Synthesis and full portfolio depend on all components
  holisticSynthesisCache.invalidateUser(userId);
  portfolioAnalysisCache.invalidateUser(userId);

  // School fit depends on everything
  schoolFitCache.invalidateUser(userId);
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export const CacheUtils = {
  generateAnalysisCacheKey,
  generateHashedCacheKey,
  memoizeAsync,
  warmCache,
  invalidateRelatedCaches,
};
