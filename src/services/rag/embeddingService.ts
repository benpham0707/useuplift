/**
 * Embedding Service — OpenAI text-embedding-3-small wrapper
 *
 * Provides vector embeddings for RAG retrieval with:
 * - In-memory request-level dedup cache (keyed by text hash)
 * - Graceful error handling (returns null on failure)
 * - 1536-dimension vectors matching pgvector column config
 */

import OpenAI from 'openai';
import { createHash } from 'crypto';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export class EmbeddingService {
  private client: OpenAI | null = null;
  private cache: Map<string, number[]> = new Map();

  /** 500 entries × ~12KB per 1536-dim float64 vector = ~6MB max memory */
  private static readonly MAX_CACHE_SIZE = 500;

  /** Lazily initialize OpenAI client to avoid import-time crashes if key is missing */
  private getClient(): OpenAI | null {
    if (this.client) return this.client;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn('[EmbeddingService] OPENAI_API_KEY not set — embeddings disabled');
      return null;
    }

    this.client = new OpenAI({ apiKey });
    return this.client;
  }

  /** Hash text for cache key — fast SHA-256 */
  private hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  /**
   * Generate an embedding vector for the given text.
   * Returns null if the API call fails or the key is missing.
   */
  async embed(text: string): Promise<number[] | null> {
    if (!text.trim()) {
      console.warn('[EmbeddingService] Empty text provided, skipping');
      return null;
    }

    // Check dedup cache
    const hash = this.hashText(text);
    const cached = this.cache.get(hash);
    if (cached) return cached;

    const client = this.getClient();
    if (!client) return null;

    try {
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
        console.error('[EmbeddingService] Unexpected embedding shape:', embedding?.length);
        return null;
      }

      // Evict oldest entry if cache is at capacity
      if (this.cache.size >= EmbeddingService.MAX_CACHE_SIZE) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }

      // Cache for request-level dedup
      this.cache.set(hash, embedding);
      return embedding;
    } catch (error) {
      console.error(
        '[EmbeddingService] Embedding failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  /**
   * Generate embeddings for multiple texts in a single API call.
   * Returns an array aligned with inputs (null for any that failed).
   */
  async embedBatch(texts: string[]): Promise<(number[] | null)[]> {
    const client = this.getClient();
    if (!client) return texts.map(() => null);

    const results: (number[] | null)[] = new Array(texts.length).fill(null);
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    // Resolve from cache first
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (!text.trim()) continue;

      const hash = this.hashText(text);
      const cached = this.cache.get(hash);
      if (cached) {
        results[i] = cached;
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(text);
      }
    }

    if (uncachedTexts.length === 0) return results;

    try {
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: uncachedTexts,
        dimensions: EMBEDDING_DIMENSIONS,
      });

      for (const item of response.data) {
        const originalIndex = uncachedIndices[item.index];
        if (originalIndex !== undefined && item.embedding.length === EMBEDDING_DIMENSIONS) {
          results[originalIndex] = item.embedding;

          // Evict oldest entry if cache is at capacity
          if (this.cache.size >= EmbeddingService.MAX_CACHE_SIZE) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
              this.cache.delete(oldestKey);
            }
          }

          // Cache it
          const hash = this.hashText(uncachedTexts[item.index]);
          this.cache.set(hash, item.embedding);
        }
      }
    } catch (error) {
      console.error(
        '[EmbeddingService] Batch embedding failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return results;
  }

  /** Clear the in-memory dedup cache (call between requests if needed) */
  clearCache(): void {
    this.cache.clear();
  }

  /** Get cache stats for monitoring */
  getCacheStats(): { size: number } {
    return { size: this.cache.size };
  }
}

export const embeddingService = new EmbeddingService();
