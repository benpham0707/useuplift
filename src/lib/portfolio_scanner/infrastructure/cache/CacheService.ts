// src/infrastructure/cache/RedisProfileCache.ts

import { injectable, inject } from 'inversify';
import { Redis, RedisOptions } from 'ioredis';
import { 
  CacheKeyGenerator, 
  PROFILE_CONSTANTS 
} from '../../shared/types/enhanced.types';
import { CacheError } from '../../shared/errors/ProfileErrors';
import { Logger } from '../../shared/utils/logger';
import { ConfigService } from '../config/ConfigService';

interface CacheOptions {
  ttl?: number;
  refresh?: boolean;
  namespace?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  avgResponseTime: number;
}

@injectable()
export class RedisProfileCache {
  private client: Redis;
  private readonly stats: CacheStats;
  private readonly warmupKeys: Set<string>;
  private readonly lockManager: LockManager;

  constructor(
    @inject(Logger) private logger: Logger,
    @inject(ConfigService) private config: ConfigService
  ) {
    this.client = this.createClient();
    this.stats = { hits: 0, misses: 0, errors: 0, avgResponseTime: 0 };
    this.warmupKeys = new Set();
    this.lockManager = new LockManager(this.client, this.logger);
    
    this.setupEventHandlers();
  }

  // Core Cache Operations

  public async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const value = await this.client.get(key);
      
      if (value) {
        this.stats.hits++;
        this.updateResponseTime(Date.now() - startTime);
        
        // Refresh TTL if requested
        if (options?.refresh) {
          const ttl = options.ttl || PROFILE_CONSTANTS.CACHE_TTL.PROFILE;
          await this.client.expire(key, ttl);
        }
        
        return JSON.parse(value);
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Cache get failed', { error, key });
      throw new CacheError('get', key, error);
    }
  }

  public async set<T>(
    key: string, 
    value: T, 
    ttl?: number,
    options?: CacheOptions
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const effectiveTTL = ttl || PROFILE_CONSTANTS.CACHE_TTL.PROFILE;
      
      if (options?.namespace) {
        key = `${options.namespace}:${key}`;
      }
      
      await this.client.setex(key, effectiveTTL, serialized);
      
      // Add to warmup set if it's a frequently accessed key
      if (this.shouldWarmup(key)) {
        this.warmupKeys.add(key);
      }
    } catch (error) {
      this.logger.error('Cache set failed', { error, key });
      throw new CacheError('set', key, error);
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
      this.warmupKeys.delete(key);
    } catch (error) {
      this.logger.error('Cache delete failed', { error, key });
      throw new CacheError('delete', key, error);
    }
  }

  // Batch Operations

  public async mget<T>(keys: string[]): Promise<Map<string, T>> {
    try {
      const values = await this.client.mget(keys);
      const result = new Map<string, T>();
      
      keys.forEach((key, index) => {
        if (values[index]) {
          result.set(key, JSON.parse(values[index]!));
          this.stats.hits++;
        } else {
          this.stats.misses++;
        }
      });
      
      return result;
    } catch (error) {
      this.logger.error('Cache mget failed', { error, keys });
      throw new CacheError('mget', keys.join(','), error);
    }
  }

  public async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    const pipeline = this.client.pipeline();
    
    try {
      entries.forEach(({ key, value, ttl }) => {
        const serialized = JSON.stringify(value);
        const effectiveTTL = ttl || PROFILE_CONSTANTS.CACHE_TTL.PROFILE;
        pipeline.setex(key, effectiveTTL, serialized);
      });
      
      await pipeline.exec();
    } catch (error) {
      this.logger.error('Cache mset failed', { error });
      throw new CacheError('mset', 'multiple', error);
    }
  }

  // Pattern-based Operations

  public async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      
      if (keys.length === 0) return 0;
      
      const pipeline = this.client.pipeline();
      keys.forEach(key => {
        pipeline.del(key);
        this.warmupKeys.delete(key);
      });
      
      await pipeline.exec();
      return keys.length;
    } catch (error) {
      this.logger.error('Cache delete pattern failed', { error, pattern });
      throw new CacheError('deletePattern', pattern, error);
    }
  }

  // Cache Warming

  public async warmup(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const missingKeys: string[] = [];
    
    // Check which keys are missing
    const cached = await this.mget(keys);
    keys.forEach(key => {
      if (!cached.has(key)) {
        missingKeys.push(key);
      }
    });
    
    // Fetch and cache missing keys
    const fetchPromises = missingKeys.map(async key => {
      try {
        const value = await fetcher(key);
        if (value) {
          await this.set(key, value);
        }
      } catch (error) {
        this.logger.warn('Warmup fetch failed', { error, key });
      }
    });
    
    await Promise.all(fetchPromises);
  }

  // Distributed Locking

  public async withLock<T>(
    key: string,
    fn: () => Promise<T>,
    options?: { ttl?: number; retries?: number }
  ): Promise<T> {
    const lockKey = `lock:${key}`;
    const lockId = `${Date.now()}_${Math.random()}`;
    
    try {
      const acquired = await this.lockManager.acquire(lockKey, lockId, options);
      
      if (!acquired) {
        throw new Error('Failed to acquire lock');
      }
      
      const result = await fn();
      
      await this.lockManager.release(lockKey, lockId);
      
      return result;
    } catch (error) {
      // Ensure lock is released on error
      await this.lockManager.release(lockKey, lockId).catch(() => {});
      throw error;
    }
  }

  // Cache Statistics

  public getStats(): CacheStats {
    return { ...this.stats };
  }

  public resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.errors = 0;
    this.stats.avgResponseTime = 0;
  }

  public async getInfo(): Promise<Record<string, any>> {
    const info = await this.client.info();
    const memory = await this.client.info('memory');
    
    return {
      connected: this.client.status === 'ready',
      stats: this.getStats(),
      warmupKeys: this.warmupKeys.size,
      serverInfo: {
        version: this.parseInfo(info, 'redis_version'),
        usedMemory: this.parseInfo(memory, 'used_memory_human'),
        connectedClients: this.parseInfo(info, 'connected_clients')
      }
    };
  }

  // Private Methods

  private createClient(): Redis {
    const options: RedisOptions = {
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      password: this.config.get('REDIS_PASSWORD'),
      db: this.config.get('REDIS_DB', 0),
      keyPrefix: this.config.get('REDIS_KEY_PREFIX', 'portfolio:'),
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      }
    };
    
    return new Redis(options);
  }

  private setupEventHandlers(): void {
    this.client.on('error', (error) => {
      this.logger.error('Redis error', { error });
    });
    
    this.client.on('connect', () => {
      this.logger.info('Redis connected');
    });
    
    this.client.on('ready', () => {
      this.logger.info('Redis ready');
    });
    
    this.client.on('close', () => {
      this.logger.info('Redis connection closed');
    });
  }

  private shouldWarmup(key: string): boolean {
    // Keys that should be warmed up
    const warmupPatterns = [
      /profile:[^:]+$/,  // Main profile keys
      /analysis:[^:]+$/, // Analysis results
      /skills:[^:]+$/    // Skill extractions
    ];
    
    return warmupPatterns.some(pattern => pattern.test(key));
  }

  private updateResponseTime(duration: number): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.avgResponseTime = 
      (this.stats.avgResponseTime * (totalRequests - 1) + duration) / totalRequests;
  }

  private parseInfo(info: string, key: string): string | null {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : null;
  }

  // Cleanup

  public async close(): Promise<void> {
    await this.client.quit();
  }
}

// Lock Manager for Distributed Locking

class LockManager {
  constructor(
    private client: Redis,
    private logger: Logger
  ) {}

  public async acquire(
    key: string, 
    id: string, 
    options?: { ttl?: number; retries?: number }
  ): Promise<boolean> {
    const ttl = options?.ttl || 30000; // 30 seconds default
    const retries = options?.retries || 3;
    
    for (let i = 0; i < retries; i++) {
      const result = await this.client.set(
        key,
        id,
        'PX',
        ttl,
        'NX'
      );
      
      if (result === 'OK') {
        return true;
      }
      
      // Wait before retry
      await this.sleep(100 * Math.pow(2, i)); // Exponential backoff
    }
    
    return false;
  }

  public async release(key: string, id: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await this.client.eval(script, 1, key, id);
    return result === 1;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Cache Warmer Service

@injectable()
export class CacheWarmerService {
  private warmupInterval: NodeJS.Timeout | null = null;

  constructor(
    @inject(RedisProfileCache) private cache: RedisProfileCache,
    @inject('IPortfolioRepository') private repository: any,
    @inject(Logger) private logger: Logger,
    @inject(ConfigService) private config: ConfigService
  ) {}

  public start(): void {
    const interval = this.config.get('CACHE_WARMUP_INTERVAL', 300000); // 5 minutes
    
    this.warmupInterval = setInterval(() => {
      this.performWarmup().catch(error => {
        this.logger.error('Cache warmup failed', { error });
      });
    }, interval);
    
    // Initial warmup
    this.performWarmup();
  }

  public stop(): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
    }
  }

  private async performWarmup(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Get recently active profiles
      const recentProfiles = await this.repository.searchProfiles(
        { lastUpdatedAfter: new Date(Date.now() - 86400000) }, // Last 24 hours
        { limit: 100 }
      );
      
      // Warm up profile data
      const profileKeys = recentProfiles.profiles.map(p => 
        CacheKeyGenerator.profile(p.id)
      );
      
      await this.cache.warmup(profileKeys, async (key) => {
        const profileId = key.split(':').pop()!;
        return this.repository.getProfile(profileId);
      });
      
      const duration = Date.now() - startTime;
      this.logger.info('Cache warmup completed', {
        profiles: recentProfiles.profiles.length,
        duration
      });
    } catch (error) {
      this.logger.error('Cache warmup error', { error });
    }
  }
}

// Export all cache-related services
export { CacheWarmerService, CacheOptions, CacheStats };