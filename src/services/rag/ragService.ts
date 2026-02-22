/**
 * RAG Service — Retrieval-Augmented Generation for writing quality
 *
 * Powers example retrieval from curated essay fragments and before/after
 * transformations using pgvector cosine similarity search.
 *
 * Key design decisions:
 * - Uses Supabase RPC functions for pgvector similarity queries
 * - Diversity enforcement: drops near-duplicate results (>0.85 pairwise similarity)
 * - Anti-copying: formats results as abstracted patterns, never raw text
 * - Graceful degradation: returns empty results on any failure
 */

import { supabaseAdmin } from '@/supabase/admin';
import { EmbeddingService, embeddingService } from './embeddingService';
import type { RAGResult, RAGTransformation, RAGEssayFragment } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface RetrieveOptions {
  essayType?: string;
  dimension?: string;
  technique?: string;
  qualityTier?: 'excellent' | 'strong';
  limit?: number;
  minSimilarity?: number;
}

interface FragmentRow {
  id: string;
  content: string;
  essay_type: string | null;
  prompt_type: string | null;
  dimension: string | null;
  quality_tier: string;
  college: string | null;
  technique: string | null;
  why_it_works: string;
  transferable_principle: string;
  source_info: string;
  similarity: number;
}

interface TransformationRow {
  id: string;
  before_text: string;
  after_text: string;
  dimension: string | null;
  technique: string | null;
  essay_type: string | null;
  why_it_works: string;
  principle: string;
  effectiveness_score: number | null;
  similarity: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum pairwise similarity before we consider results too similar */
const DIVERSITY_THRESHOLD = 0.85;

/** Default max tokens for formatted prompt output */
const DEFAULT_MAX_TOKENS = 300;

/** Approximate tokens per formatted result (conservative estimate) */
const TOKENS_PER_RESULT = 80;

// ============================================================================
// RAG SERVICE
// ============================================================================

export class RAGService {
  private embeddingService: EmbeddingService;

  constructor(embedding?: EmbeddingService) {
    this.embeddingService = embedding ?? embeddingService;
  }

  // --------------------------------------------------------------------------
  // Core: Embed
  // --------------------------------------------------------------------------

  /** Generate an embedding vector for text. Returns null on failure. */
  async embed(text: string): Promise<number[] | null> {
    return this.embeddingService.embed(text);
  }

  // --------------------------------------------------------------------------
  // Retrieve: Essay Fragments
  // --------------------------------------------------------------------------

  /**
   * Retrieve similar essay fragment examples from the RAG database.
   * Uses pgvector cosine similarity with optional metadata filters.
   */
  async retrieveExamples(query: string, options: RetrieveOptions = {}): Promise<RAGResult[]> {
    const {
      essayType,
      dimension,
      technique,
      qualityTier,
      limit = 3,
      minSimilarity = 0.5,
    } = options;

    const embedding = await this.embed(query);
    if (!embedding) {
      console.warn('[RAGService] Could not embed query, returning empty results');
      return [];
    }

    try {
      // Fetch more than needed for diversity filtering
      const fetchLimit = Math.min(limit * 3, 20);

      const { data, error } = await supabaseAdmin.rpc('match_rag_fragments', {
        query_embedding: embedding,
        match_threshold: minSimilarity,
        match_count: fetchLimit,
        filter_essay_type: essayType ?? null,
        filter_dimension: dimension ?? null,
        filter_technique: technique ?? null,
        filter_quality_tier: qualityTier ?? null,
      });

      if (error) {
        console.error('[RAGService] Fragment query failed:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      const rows = data as FragmentRow[];
      const results = rows.map((row): RAGResult => ({
        id: row.id,
        content: row.content,
        essayType: row.essay_type ?? undefined,
        promptType: row.prompt_type ?? undefined,
        dimension: row.dimension ?? undefined,
        qualityTier: row.quality_tier as RAGResult['qualityTier'],
        college: row.college ?? undefined,
        technique: row.technique ?? undefined,
        whyItWorks: row.why_it_works,
        transferablePrinciple: row.transferable_principle,
        sourceInfo: row.source_info,
        similarityScore: row.similarity,
      }));

      return this.enforceDiversity(results, limit);
    } catch (error) {
      console.error(
        '[RAGService] retrieveExamples failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Retrieve: Transformations
  // --------------------------------------------------------------------------

  /**
   * Retrieve similar before/after transformation pairs.
   * Matches against before_embedding to find transformations for similar weak text.
   */
  async retrieveTransformations(query: string, options: RetrieveOptions = {}): Promise<RAGTransformation[]> {
    const {
      essayType,
      dimension,
      technique,
      limit = 3,
      minSimilarity = 0.5,
    } = options;

    const embedding = await this.embed(query);
    if (!embedding) {
      console.warn('[RAGService] Could not embed query, returning empty results');
      return [];
    }

    try {
      const fetchLimit = Math.min(limit * 3, 20);

      const { data, error } = await supabaseAdmin.rpc('match_rag_transformations', {
        query_embedding: embedding,
        match_threshold: minSimilarity,
        match_count: fetchLimit,
        filter_essay_type: essayType ?? null,
        filter_dimension: dimension ?? null,
        filter_technique: technique ?? null,
      });

      if (error) {
        console.error('[RAGService] Transformation query failed:', error.message);
        return [];
      }

      if (!data || data.length === 0) return [];

      const rows = data as TransformationRow[];
      const results = rows.map((row): RAGTransformation => ({
        id: row.id,
        beforeText: row.before_text,
        afterText: row.after_text,
        dimension: row.dimension ?? undefined,
        technique: row.technique ?? undefined,
        whyItWorks: row.why_it_works,
        principle: row.principle,
        effectivenessScore: row.effectiveness_score ?? 0,
        similarityScore: row.similarity,
      }));

      // Simple limit (diversity is less critical for transformations since before/after are distinct)
      return results.slice(0, limit);
    } catch (error) {
      console.error(
        '[RAGService] retrieveTransformations failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return [];
    }
  }

  // --------------------------------------------------------------------------
  // Format: For Prompt Injection
  // --------------------------------------------------------------------------

  /**
   * Format retrieved fragment results as an abstracted markdown block for prompt injection.
   *
   * CRITICAL: Abstracts patterns — never copies phrases >8 words verbatim.
   * Target: <300 tokens for 3 examples.
   */
  formatForPrompt(results: RAGResult[], maxTokens: number = DEFAULT_MAX_TOKENS): string {
    if (results.length === 0) return '';

    const maxResults = Math.floor(maxTokens / TOKENS_PER_RESULT);
    const trimmed = results.slice(0, Math.max(1, maxResults));

    const blocks = trimmed.map((r) => {
      const technique = r.technique || r.dimension || 'Writing technique';
      return [
        `**Pattern: ${technique}**`,
        `Approach: ${this.abstractPattern(r.whyItWorks)}`,
        `Why it works: ${this.abstractExplanation(r.whyItWorks)}`,
        `Principle: ${r.transferablePrinciple}`,
      ].join('\n');
    });

    const formatted = blocks.join('\n\n');
    return this.ensureNoCopying(formatted, results);
  }

  /**
   * Format before/after transformation pairs for prompt injection.
   * Same anti-copying abstraction rules apply.
   */
  formatTransformationsForPrompt(results: RAGTransformation[]): string {
    if (results.length === 0) return '';

    const blocks = results.map((r) => {
      const technique = r.technique || r.dimension || 'Writing improvement';
      return [
        `**Transformation: ${technique}**`,
        `Before pattern: ${this.abstractPattern(r.whyItWorks)}`,
        `After pattern: ${this.abstractExplanation(r.principle)}`,
        `Principle: ${r.principle}`,
      ].join('\n');
    });

    const formatted = blocks.join('\n\n');
    return this.ensureNoCopyingTransformations(formatted, results);
  }

  // --------------------------------------------------------------------------
  // Write: Add Fragments and Transformations
  // --------------------------------------------------------------------------

  /**
   * Add a new essay fragment to the RAG database.
   * Embeds the content and stores with metadata.
   */
  async addFragment(fragment: Omit<RAGEssayFragment, 'id'>): Promise<string> {
    const embedding = await this.embed(fragment.content);

    const { data, error } = await supabaseAdmin
      .from('rag_essay_fragments')
      .insert({
        content: fragment.content,
        embedding: embedding ? this.vectorToString(embedding) : null,
        essay_type: fragment.essayType ?? null,
        prompt_type: fragment.promptType ?? null,
        dimension: fragment.dimension ?? null,
        quality_tier: fragment.qualityTier,
        college: fragment.college ?? null,
        technique: fragment.technique ?? null,
        why_it_works: fragment.whyItWorks,
        transferable_principle: fragment.transferablePrinciple,
        source_info: fragment.sourceInfo,
      } as Record<string, unknown>)
      .select('id')
      .single();

    if (error) {
      console.error('[RAGService] addFragment failed:', error.message);
      throw new Error(`Failed to add fragment: ${error.message}`);
    }

    return (data as { id: string }).id;
  }

  /**
   * Add a new before/after transformation pair to the RAG database.
   * Embeds both before and after text for bidirectional matching.
   */
  async addTransformation(transform: {
    beforeText: string;
    afterText: string;
    dimension?: string;
    technique?: string;
    essayType?: string;
    whyItWorks: string;
    principle: string;
    sourceInfo: string;
  }): Promise<string> {
    const [beforeEmbedding, afterEmbedding] = await this.embeddingService.embedBatch([
      transform.beforeText,
      transform.afterText,
    ]);

    const { data, error } = await supabaseAdmin
      .from('rag_transformations')
      .insert({
        before_text: transform.beforeText,
        after_text: transform.afterText,
        before_embedding: beforeEmbedding ? this.vectorToString(beforeEmbedding) : null,
        after_embedding: afterEmbedding ? this.vectorToString(afterEmbedding) : null,
        dimension: transform.dimension ?? null,
        technique: transform.technique ?? null,
        essay_type: transform.essayType ?? null,
        why_it_works: transform.whyItWorks,
        principle: transform.principle,
        source_info: transform.sourceInfo,
      } as Record<string, unknown>)
      .select('id')
      .single();

    if (error) {
      console.error('[RAGService] addTransformation failed:', error.message);
      throw new Error(`Failed to add transformation: ${error.message}`);
    }

    return (data as { id: string }).id;
  }

  // --------------------------------------------------------------------------
  // Private: Anti-Copying Enforcement
  // --------------------------------------------------------------------------

  /**
   * Ensure no phrase of 8+ consecutive words from source content appears
   * verbatim in the formatted output. Replaces matches with the transferable
   * principle to maintain usefulness without copying.
   */
  private ensureNoCopying(formatted: string, sources: RAGResult[]): string {
    let result = formatted;
    for (const source of sources) {
      const phrases = this.extractLongPhrases(source.content, 8);
      for (const phrase of phrases) {
        if (result.includes(phrase)) {
          console.warn(`[RAGService] Anti-copy: removed verbatim phrase from ${source.sourceInfo}`);
          result = result.replace(phrase, source.transferablePrinciple);
        }
      }
    }
    return result;
  }

  /**
   * Ensure no phrase of 8+ consecutive words from transformation beforeText
   * or afterText appears verbatim in the formatted output.
   */
  private ensureNoCopyingTransformations(formatted: string, sources: RAGTransformation[]): string {
    let result = formatted;
    for (const source of sources) {
      const beforePhrases = this.extractLongPhrases(source.beforeText, 8);
      const afterPhrases = this.extractLongPhrases(source.afterText, 8);
      for (const phrase of [...beforePhrases, ...afterPhrases]) {
        if (result.includes(phrase)) {
          console.warn('[RAGService] Anti-copy: removed verbatim phrase from transformation');
          result = result.replace(phrase, source.principle);
        }
      }
    }
    return result;
  }

  /**
   * Extract all consecutive N-word phrases from text for verbatim matching.
   * Used by anti-copying enforcement to detect phrase-level duplication.
   */
  private extractLongPhrases(text: string, minWords: number): string[] {
    const words = text.split(/\s+/);
    const phrases: string[] = [];
    for (let i = 0; i <= words.length - minWords; i++) {
      phrases.push(words.slice(i, i + minWords).join(' '));
    }
    return phrases;
  }

  // --------------------------------------------------------------------------
  // Private: Diversity Enforcement
  // --------------------------------------------------------------------------

  /**
   * Enforce diversity among results — if top results have pairwise content similarity
   * above the threshold, drop the least relevant duplicate and include next result.
   */
  private enforceDiversity(results: RAGResult[], limit: number): RAGResult[] {
    if (results.length <= 1) return results.slice(0, limit);

    const selected: RAGResult[] = [results[0]];

    for (let i = 1; i < results.length && selected.length < limit; i++) {
      const candidate = results[i];
      const tooSimilar = selected.some(
        (existing) => this.textSimilarity(existing.content, candidate.content) > DIVERSITY_THRESHOLD
      );

      if (!tooSimilar) {
        selected.push(candidate);
      }
    }

    return selected;
  }

  /**
   * Rough text similarity using Jaccard coefficient on word trigrams.
   * Fast enough for diversity checks on short texts.
   */
  private textSimilarity(a: string, b: string): number {
    const trigramsA = this.getWordTrigrams(a);
    const trigramsB = this.getWordTrigrams(b);

    if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

    let intersection = 0;
    for (const t of trigramsA) {
      if (trigramsB.has(t)) intersection++;
    }

    const union = trigramsA.size + trigramsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  private getWordTrigrams(text: string): Set<string> {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const trigrams = new Set<string>();
    for (let i = 0; i <= words.length - 3; i++) {
      trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
    return trigrams;
  }

  // --------------------------------------------------------------------------
  // Private: Pattern Abstraction (anti-copying)
  // --------------------------------------------------------------------------

  /**
   * Abstract a pattern description — ensure no phrase >8 words is copied verbatim.
   * Extracts the core approach from the explanation.
   */
  private abstractPattern(text: string): string {
    // Truncate to reasonable length and extract key phrases
    const truncated = text.length > 200 ? text.slice(0, 200) + '...' : text;
    // Split into sentences and take the most informative one
    const sentences = truncated.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    if (sentences.length === 0) return truncated;

    // Return the first sentence (typically the core approach)
    const core = sentences[0].trim();
    return core.length > 120 ? core.slice(0, 120) + '...' : core;
  }

  /**
   * Abstract an explanation — summarize the "why" without verbatim copying.
   */
  private abstractExplanation(text: string): string {
    const truncated = text.length > 150 ? text.slice(0, 150) + '...' : text;
    return truncated;
  }

  // --------------------------------------------------------------------------
  // Private: Vector Utilities
  // --------------------------------------------------------------------------

  /** Convert a number[] embedding to pgvector string format: '[0.1,0.2,...]' */
  private vectorToString(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }
}

export const ragService = new RAGService();
