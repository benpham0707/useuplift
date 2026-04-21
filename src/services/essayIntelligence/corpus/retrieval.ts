/**
 * retrieval.ts — Hybrid corpus retrieval API (Phase 2D). **LEGACY.**
 *
 * Status (2026-04-20): This OpenAI+pgvector retrieval path is retained as
 * legacy infrastructure. L3.5 production retrieval now uses the
 * Anthropic-native Claude Haiku in-context ranking path in `claudeRetrieval.ts`
 * — Uplift is Anthropic-only and must not depend on a second LLM-provider key.
 *
 * Keep this module available for a future scale scenario: if the corpus grows
 * past ~1000 entities, packing the full catalog into a cached system prompt
 * becomes unwieldy and pgvector's sub-linear retrieval becomes worthwhile.
 * Until then, do NOT import from this file in new pipeline code.
 *
 * Wraps the `match_corpus_embeddings` Supabase RPC + the on-disk derived
 * correlations + the structured corpus data into a single consumption surface
 * for Wave-3b pipeline layers (L3, L3.5, L3.75, L4, L5, L6).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Retrieval philosophy
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   Layer 1: Structured pre-filter (voice register, dimension, transferability)
 *   Layer 2: Semantic rank via pgvector cosine similarity
 *   Layer 3: Correlation re-rank (when applicable)
 *
 * Hard safety rails enforced OUTSIDE retrieval:
 *   - `forbidden` voice×archetype cells are never surfaced by archetype queries
 *   - Hard move-dependencies (moveDependencies.ts) are enforced at coaching time,
 *     not retrieval time
 *
 * All retrieval responses carry provenance: source essay ID, paragraph, and
 * the excerpt text where applicable, so coaching can cite corpus evidence.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Environment
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   OPENAI_API_KEY            — for query embedding at retrieval time
 *   SUPABASE_URL              — (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY — server-side only
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ═══════════════════════════════════════════════════════════════════════════
// SERVER-ONLY GUARD — audit finding from Phase 2F code audit (2026-04-20).
// This module reads SUPABASE_SERVICE_ROLE_KEY. Importing it from client-side
// code would leak the key into the browser bundle. Throw at import-time if
// we detect a browser environment so the issue surfaces immediately.
// ═══════════════════════════════════════════════════════════════════════════
if (typeof window !== 'undefined') {
  throw new Error(
    '[corpus/retrieval] This module must not be imported in client-side code. ' +
    'It requires SUPABASE_SERVICE_ROLE_KEY which must never reach the browser. ' +
    'Call it from server-side pipeline layers (L3.5, L4, L5, L6) only.',
  );
}

import { TOP_TIER_CRAFT_MOVES } from './topTierCraftMoves';
import { MOVE_EXCERPTS } from './moveExcerpts';
import { ESSAY_ARCHETYPES } from './essayArchetypes';
import { VOICE_ARCHETYPE_COMPATIBILITY } from './voiceArchetypeCompatibility';
import type {
  CorpusEssayId,
  CraftMove,
  EmbeddingEntityType,
  EssayArchetype,
  MoveDimension,
  MoveExcerpt,
  PerMoveCorrelationIndex,
  VoiceRegister,
} from './corpusTypes';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_MATCH_THRESHOLD = 0.3;
const DEFAULT_MATCH_COUNT = 10;

// ─────────────────────────────────────────────────────────────────────────
// Singleton clients (lazy)
// ─────────────────────────────────────────────────────────────────────────

let _supabase: SupabaseClient | null = null;
let _openai: OpenAI | null = null;
let _perMoveIndex: PerMoveCorrelationIndex | null = null;

function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      '[corpus/retrieval] Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY — required for corpus retrieval',
    );
  }
  _supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  return _supabase;
}

function getOpenAI(): OpenAI {
  if (_openai) return _openai;
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('[corpus/retrieval] Missing OPENAI_API_KEY — required for query embedding');
  }
  _openai = new OpenAI({ apiKey: key });
  return _openai;
}

/**
 * Lazy-load the per-move correlation index from disk. Cached in module state
 * so repeated retrievals within a process don't re-read the file.
 */
async function getPerMoveIndex(): Promise<PerMoveCorrelationIndex> {
  if (_perMoveIndex) return _perMoveIndex;
  const mod = await import('./derivedCorrelationsByMove.json', {
    with: { type: 'json' },
  });
  _perMoveIndex = mod.default as PerMoveCorrelationIndex;
  return _perMoveIndex;
}

// ─────────────────────────────────────────────────────────────────────────
// Types for retrieval results
// ─────────────────────────────────────────────────────────────────────────

export interface RetrievalResult<TEntity> {
  entity: TEntity;
  similarity: number;
  provenance: {
    essayId: CorpusEssayId | null;
    paragraph: number | null;
    excerpt?: string;
  };
}

export interface RetrievalFilters {
  voiceRegisters?: VoiceRegister[];
  dimensions?: MoveDimension[];
  transferability?: 'universal' | 'broad' | 'narrow' | 'specific';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  essayIds?: CorpusEssayId[];
}

// ─────────────────────────────────────────────────────────────────────────
// Core: embed a query string → vector
// ─────────────────────────────────────────────────────────────────────────

async function embedQuery(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  const vec = res.data[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error('Unexpected embedding shape from OpenAI');
  }
  return vec;
}

// ─────────────────────────────────────────────────────────────────────────
// Shared RPC caller
// ─────────────────────────────────────────────────────────────────────────

interface RpcMatchRow {
  id: string;
  entity_type: EmbeddingEntityType;
  entity_id: string;
  content_hash: string;
  source_essay_id: CorpusEssayId | null;
  source_paragraph: number | null;
  filters: Record<string, unknown>;
  embedding_text: string;
  similarity: number;
}

async function callMatchRpc(
  queryEmbedding: number[],
  opts: {
    entityTypes?: EmbeddingEntityType[];
    filters?: RetrievalFilters;
    k?: number;
    threshold?: number;
  },
): Promise<RpcMatchRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc('match_corpus_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: opts.threshold ?? DEFAULT_MATCH_THRESHOLD,
    match_count: opts.k ?? DEFAULT_MATCH_COUNT,
    filter_entity_types: opts.entityTypes ?? null,
    filter_voice_registers: opts.filters?.voiceRegisters ?? null,
    filter_dimensions: opts.filters?.dimensions ?? null,
    filter_transferability: opts.filters?.transferability ?? null,
    filter_difficulty: opts.filters?.difficulty ?? null,
    filter_essay_ids: opts.filters?.essayIds ?? null,
  });
  if (error) throw new Error(`match_corpus_embeddings RPC failed: ${error.message}`);
  return (data as RpcMatchRow[]) ?? [];
}

// ─────────────────────────────────────────────────────────────────────────
// Hydration: RPC row → full entity object from structured corpus data
// ─────────────────────────────────────────────────────────────────────────

const moveById = new Map(TOP_TIER_CRAFT_MOVES.map((m) => [m.id, m]));
const excerptById = new Map(MOVE_EXCERPTS.map((e) => [e.id, e]));
const archetypeById = new Map(ESSAY_ARCHETYPES.map((a) => [a.id, a]));

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Retrieve craft moves semantically similar to a text query.
 *
 * Hybrid: structured pre-filter (voice, dimension, transferability, difficulty)
 * then pgvector cosine rank. Returns fully-hydrated CraftMove objects with
 * provenance for coaching citation.
 */
export async function retrieveMovesBySignal(
  text: string,
  filters: RetrievalFilters = {},
  k: number = 10,
): Promise<RetrievalResult<CraftMove>[]> {
  const embedding = await embedQuery(text);
  const rows = await callMatchRpc(embedding, {
    entityTypes: ['move'],
    filters,
    k,
  });
  const results: RetrievalResult<CraftMove>[] = [];
  for (const row of rows) {
    const entity = moveById.get(row.entity_id);
    if (!entity) continue; // row for a move that's been removed — ignore
    results.push({
      entity,
      similarity: row.similarity,
      provenance: {
        essayId: row.source_essay_id,
        paragraph: row.source_paragraph,
      },
    });
  }
  return results;
}

/**
 * Retrieve atomized excerpts for a specific move. Intended as a few-shot anchor
 * source for L5 coaching prompts.
 *
 * Implementation: filters by move_id in JSONB filters column + returns the
 * anchor_level-ordered excerpts for that move.
 */
export async function retrieveExcerptsForMove(
  moveId: string,
  k: number = 3,
): Promise<RetrievalResult<MoveExcerpt>[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('corpus_embeddings')
    .select('*')
    .eq('entity_type', 'excerpt')
    .filter('filters->>move_id', 'eq', moveId)
    .limit(k * 3); // over-fetch in case some don't hydrate
  if (error) throw new Error(`retrieveExcerptsForMove failed: ${error.message}`);

  const rows = (data as RpcMatchRow[]) ?? [];
  const results: RetrievalResult<MoveExcerpt>[] = [];
  for (const row of rows) {
    const entity = excerptById.get(row.entity_id);
    if (!entity) continue;
    results.push({
      entity,
      similarity: 1.0, // not a semantic query; all matching excerpts are equally relevant
      provenance: {
        essayId: entity.essayId,
        paragraph: entity.paragraph,
        excerpt: entity.excerpt,
      },
    });
  }

  // Sort by anchorLevel desc (highest-calibration excerpts first)
  results.sort((a, b) => b.entity.anchorLevel - a.entity.anchorLevel);
  return results.slice(0, k);
}

/**
 * Retrieve essay archetypes matching a text description of a student draft's
 * structural shape.
 *
 * Applies the voice×archetype safety rail: if `excludeForbiddenForVoice` is
 * passed, archetypes whose compatibility cell for that voice is `forbidden`
 * are removed before return.
 */
export async function retrieveArchetypeMatches(
  draftDescription: string,
  options: {
    k?: number;
    excludeForbiddenForVoice?: VoiceRegister;
  } = {},
): Promise<RetrievalResult<EssayArchetype>[]> {
  const embedding = await embedQuery(draftDescription);
  const rows = await callMatchRpc(embedding, {
    entityTypes: ['archetype'],
    k: options.k ?? 5,
  });

  const forbiddenSet = options.excludeForbiddenForVoice
    ? getForbiddenArchetypesForVoice(options.excludeForbiddenForVoice)
    : new Set<string>();

  const results: RetrievalResult<EssayArchetype>[] = [];
  for (const row of rows) {
    if (forbiddenSet.has(row.entity_id)) continue;
    const entity = archetypeById.get(row.entity_id);
    if (!entity) continue;
    results.push({
      entity,
      similarity: row.similarity,
      provenance: {
        essayId: entity.exemplarEssayId,
        paragraph: null,
      },
    });
  }
  return results;
}

/**
 * Look up strongly-paired moves for a given move, using the on-disk derived
 * correlation index. Zero-cost (no LLM, no DB query after first load).
 *
 * Returns moves sorted by totalScore DESC. `minConfidence` defaults to strong-tier.
 */
export async function retrievePairedMoves(
  moveId: string,
  opts: { k?: number; minTier?: 'strong' | 'any' } = {},
): Promise<
  Array<{
    move: CraftMove;
    totalScore: number;
    archetypeScore: number;
    sharedArchetypes: string[];
  }>
> {
  const k = opts.k ?? 5;
  const minTier = opts.minTier ?? 'strong';
  const index = await getPerMoveIndex();
  const entry = index.byMove[moveId];
  if (!entry) return [];

  const pool =
    minTier === 'strong'
      ? entry.strongCorrelations
      : [...entry.strongCorrelations, ...entry.suggestedCorrelations];

  const results: Array<{
    move: CraftMove;
    totalScore: number;
    archetypeScore: number;
    sharedArchetypes: string[];
  }> = [];
  for (const e of pool.slice(0, k)) {
    const move = moveById.get(e.moveId);
    if (!move) continue;
    results.push({
      move,
      totalScore: e.totalScore,
      archetypeScore: e.archetypeScore,
      sharedArchetypes: e.sharedArchetypes,
    });
  }
  return results;
}

/**
 * Retrieve review-passage embeddings matching a student query. Used by L6
 * conversational grounding — ground the LLM's response in specific review text.
 *
 * NOTE (Phase 2 status, 2026-04-20): Review-passage seeding is DEFERRED to
 * Phase 2b. Until the review-passage seeder lands (parses v2.1 reviews into
 * paragraph-level embeddings), this function returns an empty array against
 * a production database. L6 conversational grounding should fall back to
 * move/archetype/excerpt retrieval in the meantime.
 */
export async function retrieveReviewPassages(
  query: string,
  opts: { essayId?: CorpusEssayId; k?: number } = {},
): Promise<
  Array<{
    text: string;
    essayId: CorpusEssayId | null;
    paragraph: number | null;
    similarity: number;
  }>
> {
  const embedding = await embedQuery(query);
  const rows = await callMatchRpc(embedding, {
    entityTypes: ['review-passage'],
    filters: opts.essayId ? { essayIds: [opts.essayId] } : undefined,
    k: opts.k ?? 5,
  });
  return rows.map((row) => ({
    text: row.embedding_text,
    essayId: row.source_essay_id,
    paragraph: row.source_paragraph,
    similarity: row.similarity,
  }));
}

/**
 * Retrieve anti-patterns whose diagnostic signals semantically match a student
 * draft. Used for L5 failure-mode detection.
 */
export async function retrieveAntiPatterns(
  draftText: string,
  k: number = 5,
): Promise<
  Array<{
    id: string;
    description: string;
    similarity: number;
  }>
> {
  const embedding = await embedQuery(draftText);
  const rows = await callMatchRpc(embedding, {
    entityTypes: ['anti-pattern'],
    k,
  });
  return rows.map((row) => ({
    id: row.entity_id,
    description: row.embedding_text,
    similarity: row.similarity,
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// Safety-rail helpers (voice × archetype forbidden cells)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Compute set of archetype IDs that coaching MUST NEVER suggest to a student
 * with the given voice register. Enforces the hand-curated safety rail.
 */
export function getForbiddenArchetypesForVoice(
  voice: VoiceRegister,
): Set<string> {
  const forbidden = new Set<string>();
  const voiceBlock = VOICE_ARCHETYPE_COMPATIBILITY.find(
    (v) => v.voiceRegister === voice,
  );
  if (!voiceBlock) return forbidden;
  for (const cell of voiceBlock.archetypeCompatibility) {
    if (cell.fit === 'forbidden') forbidden.add(cell.archetypeId);
  }
  return forbidden;
}

// ─────────────────────────────────────────────────────────────────────────
// Module metadata
// ─────────────────────────────────────────────────────────────────────────

export const RETRIEVAL_API_VERSION = '3a.1.0';
