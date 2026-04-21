/**
 * tools/corpus/embedCorpus.ts
 *
 * Phase 2C: seed the `corpus_embeddings` Supabase pgvector table from the
 * structured TypeScript corpus files.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Content-addressable invalidation
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * For each corpus entity:
 *   1. Build embedding text via one of 6 text-construction functions
 *   2. SHA-256 hash the text
 *   3. Query Supabase: does an existing row match this hash?
 *   4. If yes → skip (text unchanged, embedding is current)
 *   5. If no → call OpenAI text-embedding-3-small, upsert row
 *
 * This makes the script idempotent and incremental. Re-running after corpus
 * edits re-embeds only the changed entities. Cost at steady state: near-zero.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * Environment requirements
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   OPENAI_API_KEY         — for embedding API
 *   SUPABASE_URL           — (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY — service-role write access
 *
 * Run:
 *   npx tsx tools/corpus/embedCorpus.ts
 *   npx tsx tools/corpus/embedCorpus.ts --dry-run          # preview without writing
 *   npx tsx tools/corpus/embedCorpus.ts --only move,excerpt # subset
 *   npx tsx tools/corpus/embedCorpus.ts --force            # re-embed all, ignore hash check
 */

import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

import {
  TOP_TIER_CRAFT_MOVES,
  MOVE_EXCERPTS,
  ESSAY_ARCHETYPES,
  ANTI_ARCHETYPES,
  DELIBERATE_ABSENCES,
} from '../../src/services/essayIntelligence/corpus';
import type {
  CraftMove,
  MoveExcerpt,
  EssayArchetype,
  AntiArchetype,
  DeliberateAbsence,
  EmbeddingEntityType,
} from '../../src/services/essayIntelligence/corpus/corpusTypes';
import {
  buildMoveEmbeddingText,
  buildExcerptEmbeddingText,
  buildArchetypeEmbeddingText,
  buildAntiPatternEmbeddingText,
  buildAbsenceEmbeddingText,
} from '../../src/services/essayIntelligence/corpus/embeddingText';

// ─────────────────────────────────────────────────────────────────────────
// Constants + CLI flags
// ─────────────────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const SCRIPT_VERSION = '3a.1.0';
const RATE_LIMIT_DELAY_MS = 50; // gentle pacing; OpenAI allows ~3k req/min

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const FORCE = args.has('--force');
const ONLY_ARG = process.argv.find((a) => a.startsWith('--only='));

// Valid entity types per EmbeddingEntityType union in corpusTypes.ts.
// Validate --only flag so typos fail loud instead of silently skipping everything.
const VALID_ENTITY_TYPES = new Set<EmbeddingEntityType>([
  'move',
  'excerpt',
  'archetype',
  'anti-pattern',
  'absence',
  'review-passage',
]);

const ONLY_TYPES = ONLY_ARG
  ? new Set(
      ONLY_ARG
        .replace('--only=', '')
        .split(',')
        .map((t) => {
          const trimmed = t.trim();
          if (!VALID_ENTITY_TYPES.has(trimmed as EmbeddingEntityType)) {
            throw new Error(
              `Invalid entity type in --only: "${trimmed}". ` +
                `Valid options: ${[...VALID_ENTITY_TYPES].join(', ')}`,
            );
          }
          return trimmed;
        }),
    )
  : null;

// ─────────────────────────────────────────────────────────────────────────
// Client setup
// ─────────────────────────────────────────────────────────────────────────

function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_URL');
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OPENAI_API_KEY');
  return new OpenAI({ apiKey: key });
}

// ─────────────────────────────────────────────────────────────────────────
// Embedding row shape
// ─────────────────────────────────────────────────────────────────────────

interface EmbeddingRow {
  entity_type: EmbeddingEntityType;
  entity_id: string;
  content_hash: string;
  embedding_text: string;
  embedding: number[];
  source_essay_id: string | null;
  source_paragraph: number | null;
  filters: Record<string, unknown>;
  script_version: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Content hashing
// ─────────────────────────────────────────────────────────────────────────

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────
// Filter extraction per entity type
// ─────────────────────────────────────────────────────────────────────────

function extractMoveFilters(move: CraftMove): Record<string, unknown> {
  return {
    voice_registers: move.compatibleRegisters,
    dimensions: move.dimensions,
    transferability: move.transferability,
    difficulty: move.difficulty,
  };
}

function extractExcerptFilters(excerpt: MoveExcerpt): Record<string, unknown> {
  return {
    move_id: excerpt.moveId,
    retrieval_tags: excerpt.retrievalTags,
    anchor_level: excerpt.anchorLevel,
  };
}

function extractArchetypeFilters(
  archetype: EssayArchetype,
): Record<string, unknown> {
  return {
    voice_registers: archetype.voiceRequirements,
    provenance: archetype.provenance,
  };
}

function extractAntiPatternFilters(
  ap: AntiArchetype,
): Record<string, unknown> {
  return {
    corpus_alternative_archetype_id: ap.corpusAlternativeArchetypeId,
  };
}

function extractAbsenceFilters(
  abs: DeliberateAbsence,
): Record<string, unknown> {
  return {
    applies_to_archetype_ids: abs.appliesToArchetypeIds,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Row builders per entity type
// ─────────────────────────────────────────────────────────────────────────

function buildMoveRows(
  embedFn: (text: string) => Promise<number[]>,
  existingHashes: Set<string>,
): Array<() => Promise<EmbeddingRow | null>> {
  return TOP_TIER_CRAFT_MOVES.map((move) => async () => {
    const text = buildMoveEmbeddingText(move);
    const hash = sha256(text);
    if (!FORCE && existingHashes.has(hash)) return null;

    const embedding = await embedFn(text);
    return {
      entity_type: 'move',
      entity_id: move.id,
      content_hash: hash,
      embedding_text: text,
      embedding,
      source_essay_id: move.sourceEssays[0]?.essayId ?? null,
      source_paragraph: move.sourceEssays[0]?.paragraph ?? null,
      filters: extractMoveFilters(move),
      script_version: SCRIPT_VERSION,
    };
  });
}

function buildExcerptRows(
  embedFn: (text: string) => Promise<number[]>,
  existingHashes: Set<string>,
): Array<() => Promise<EmbeddingRow | null>> {
  return MOVE_EXCERPTS.map((excerpt) => async () => {
    const text = buildExcerptEmbeddingText(excerpt);
    const hash = sha256(text);
    if (!FORCE && existingHashes.has(hash)) return null;

    const embedding = await embedFn(text);
    return {
      entity_type: 'excerpt',
      entity_id: excerpt.id,
      content_hash: hash,
      embedding_text: text,
      embedding,
      source_essay_id: excerpt.essayId,
      source_paragraph: excerpt.paragraph,
      filters: extractExcerptFilters(excerpt),
      script_version: SCRIPT_VERSION,
    };
  });
}

function buildArchetypeRows(
  embedFn: (text: string) => Promise<number[]>,
  existingHashes: Set<string>,
): Array<() => Promise<EmbeddingRow | null>> {
  return ESSAY_ARCHETYPES.filter((a) => a.provenance === 'fully-attested').map(
    (archetype) => async () => {
      const text = buildArchetypeEmbeddingText(archetype);
      const hash = sha256(text);
      if (!FORCE && existingHashes.has(hash)) return null;

      const embedding = await embedFn(text);
      return {
        entity_type: 'archetype',
        entity_id: archetype.id,
        content_hash: hash,
        embedding_text: text,
        embedding,
        source_essay_id: archetype.exemplarEssayId,
        source_paragraph: null,
        filters: extractArchetypeFilters(archetype),
        script_version: SCRIPT_VERSION,
      };
    },
  );
}

function buildAntiPatternRows(
  embedFn: (text: string) => Promise<number[]>,
  existingHashes: Set<string>,
): Array<() => Promise<EmbeddingRow | null>> {
  return ANTI_ARCHETYPES.map((ap) => async () => {
    const text = buildAntiPatternEmbeddingText(ap);
    const hash = sha256(text);
    if (!FORCE && existingHashes.has(hash)) return null;

    const embedding = await embedFn(text);
    return {
      entity_type: 'anti-pattern',
      entity_id: ap.id,
      content_hash: hash,
      embedding_text: text,
      embedding,
      source_essay_id: null,
      source_paragraph: null,
      filters: extractAntiPatternFilters(ap),
      script_version: SCRIPT_VERSION,
    };
  });
}

function buildAbsenceRows(
  embedFn: (text: string) => Promise<number[]>,
  existingHashes: Set<string>,
): Array<() => Promise<EmbeddingRow | null>> {
  return DELIBERATE_ABSENCES.map((abs) => async () => {
    const text = buildAbsenceEmbeddingText(abs);
    const hash = sha256(text);
    if (!FORCE && existingHashes.has(hash)) return null;

    const embedding = await embedFn(text);
    return {
      entity_type: 'absence',
      entity_id: abs.id,
      content_hash: hash,
      embedding_text: text,
      embedding,
      source_essay_id: abs.exemplars[0]?.essayId ?? null,
      source_paragraph: null,
      filters: extractAbsenceFilters(abs),
      script_version: SCRIPT_VERSION,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Main seed pipeline
// ─────────────────────────────────────────────────────────────────────────

async function fetchExistingHashes(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('corpus_embeddings')
    .select('content_hash');
  if (error) {
    console.warn('[embedCorpus] Could not fetch existing hashes:', error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.content_hash));
}

async function upsertRow(
  supabase: SupabaseClient,
  row: EmbeddingRow,
): Promise<void> {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from('corpus_embeddings')
    .upsert(row, { onConflict: 'entity_type,entity_id' });
  if (error) {
    throw new Error(
      `Upsert failed for ${row.entity_type}:${row.entity_id} — ${error.message}`,
    );
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  console.log(
    `[embedCorpus] v${SCRIPT_VERSION} — ${DRY_RUN ? 'DRY RUN' : 'LIVE'} ${FORCE ? '(force re-embed)' : ''}`,
  );

  const supabase = DRY_RUN ? (null as unknown as SupabaseClient) : getSupabaseAdmin();
  const openai = DRY_RUN ? null : getOpenAI();

  async function embed(text: string): Promise<number[]> {
    if (DRY_RUN || !openai) {
      // Dry-run mode: return a deterministic fake vector so downstream row-shape validation
      // still works. Not a real embedding — just a placeholder the same length.
      return new Array(EMBEDDING_DIMENSIONS).fill(0);
    }
    const res = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    const vec = res.data[0]?.embedding;
    if (!vec || vec.length !== EMBEDDING_DIMENSIONS) {
      throw new Error('Unexpected embedding shape');
    }
    return vec;
  }

  const existingHashes = DRY_RUN
    ? new Set<string>()
    : await fetchExistingHashes(supabase);
  console.log(`[embedCorpus] existing-row hashes: ${existingHashes.size}`);

  const allBuilders: Array<{
    type: EmbeddingEntityType;
    builders: Array<() => Promise<EmbeddingRow | null>>;
  }> = [
    { type: 'move', builders: buildMoveRows(embed, existingHashes) },
    { type: 'excerpt', builders: buildExcerptRows(embed, existingHashes) },
    { type: 'archetype', builders: buildArchetypeRows(embed, existingHashes) },
    { type: 'anti-pattern', builders: buildAntiPatternRows(embed, existingHashes) },
    { type: 'absence', builders: buildAbsenceRows(embed, existingHashes) },
  ];

  let totalEmbedded = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const { type, builders } of allBuilders) {
    if (ONLY_TYPES && !ONLY_TYPES.has(type)) {
      console.log(`[embedCorpus] skipping type=${type} (not in --only)`);
      continue;
    }

    console.log(`[embedCorpus] processing ${builders.length} ${type} entities...`);
    let embeddedForType = 0;
    let skippedForType = 0;

    for (const build of builders) {
      try {
        const row = await build();
        if (row === null) {
          skippedForType++;
          continue;
        }
        if (!DRY_RUN) await upsertRow(supabase, row);
        embeddedForType++;
        await sleep(RATE_LIMIT_DELAY_MS);
      } catch (err) {
        totalFailed++;
        console.error(`[embedCorpus] ${type} entity failed:`, (err as Error).message);
      }
    }

    console.log(
      `[embedCorpus]   ${type}: embedded=${embeddedForType} skipped=${skippedForType}`,
    );
    totalEmbedded += embeddedForType;
    totalSkipped += skippedForType;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(
    `[embedCorpus] done. embedded=${totalEmbedded} skipped=${totalSkipped} failed=${totalFailed}`,
  );
  console.log('═══════════════════════════════════════════════════════════════');

  if (totalFailed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('[embedCorpus] FATAL:', err);
  process.exit(1);
});
