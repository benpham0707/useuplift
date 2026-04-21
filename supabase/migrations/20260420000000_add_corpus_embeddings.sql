-- Migration: add_corpus_embeddings
-- Created: 2026-04-20
-- Purpose: Wave-3a Architecture C — corpus embeddings for hybrid retrieval.
--          Stores vectors of craft moves, excerpts, archetypes, anti-archetypes,
--          deliberate absences, and review passages from the essay-intelligence
--          corpus. Consumed by Wave-3b pipeline layers (L3, L3.5, L3.75, L4, L5, L6).
--
-- Data scale at seed time (2026-04-20):
--   190 craft moves + 53 excerpts + 14 archetypes + 11 anti-archetypes +
--   16 deliberate absences + ~150 review passages ≈ 444 rows, ~130K tokens to embed.
--   Cost at text-embedding-3-small ($0.02/M tokens): ~$0.003 one-time.
--
-- Design guarantees:
--   - Content-addressable invalidation via SHA-256 hashes (no unnecessary re-embedding)
--   - Hybrid retrieval: structured pre-filter + semantic rank
--   - All 6 entity types supported via discriminated union
--   - Server-only write, authenticated read (RLS)
--   - HNSW params (m=16, ef_construction=64) consistent with existing rag_embeddings

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. Enable pgvector extension (idempotent — already enabled for rag_embeddings)
-- ═════════════════════════════════════════════════════════════════════════════
CREATE EXTENSION IF NOT EXISTS vector;

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. Table: corpus_embeddings
-- ═════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS corpus_embeddings (
  id                  uuid              NOT NULL DEFAULT gen_random_uuid(),

  -- Discriminator routing retrieval to appropriate coaching layer
  entity_type         text              NOT NULL CHECK (entity_type IN (
    'move',
    'excerpt',
    'archetype',
    'anti-pattern',
    'absence',
    'review-passage'
  )),

  -- Corpus-side entity identifier (move ID, excerpt ID, archetype ID, etc.)
  entity_id           text              NOT NULL,

  -- SHA-256 of source text for content-addressable invalidation
  content_hash        varchar(64)       NOT NULL,

  -- Raw embedded text — retained for debugging + re-embedding without API call
  embedding_text      text,

  -- OpenAI text-embedding-3-small (1536 dims) — matches rag_embeddings convention
  embedding           vector(1536)      NOT NULL,

  -- Provenance for result citation at retrieval time
  source_essay_id     text,
  source_paragraph    integer,

  -- Structured pre-filter fields (JSONB for flexibility; GIN-indexed below)
  -- Shape: { voice_registers: string[], dimensions: string[], archetype_ids: string[],
  --          transferability: string, difficulty: string }
  filters             jsonb             NOT NULL DEFAULT '{}'::jsonb,

  created_at          timestamptz       NOT NULL DEFAULT now(),
  updated_at          timestamptz       NOT NULL DEFAULT now(),

  -- Tracks which embedding-script version produced this row (schema drift debugging)
  script_version      text,

  CONSTRAINT corpus_embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT corpus_embeddings_unique_entity UNIQUE (entity_type, entity_id)
);

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. Column-level documentation
-- ═════════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE corpus_embeddings IS
  'Wave-3a Architecture C corpus embeddings. Stores semantic vectors for craft moves, excerpts, archetypes, anti-patterns, deliberate absences, and review passages from tests/calibration/top-tier-reference. Consumed by Wave-3b pipeline layers via hybrid retrieval API.';

COMMENT ON COLUMN corpus_embeddings.entity_type IS
  'Discriminator: move | excerpt | archetype | anti-pattern | absence | review-passage. Routes retrieval to appropriate coaching layer.';

COMMENT ON COLUMN corpus_embeddings.entity_id IS
  'Corpus-side identifier matching the source TypeScript data (e.g. CraftMove.id, MoveExcerpt.id, EssayArchetype.id).';

COMMENT ON COLUMN corpus_embeddings.content_hash IS
  'SHA-256 of source text. Enables content-addressable skip-embed: query by hash, skip re-embedding if unchanged.';

COMMENT ON COLUMN corpus_embeddings.embedding_text IS
  'Source text that was embedded. Retained for debugging and for re-embedding without recomputing from structured data.';

COMMENT ON COLUMN corpus_embeddings.embedding IS
  'OpenAI text-embedding-3-small vector (1536 dims). Matches project rag_embeddings convention.';

COMMENT ON COLUMN corpus_embeddings.filters IS
  'JSONB pre-filter fields. Supported keys: voice_registers (string[]), dimensions (string[]), archetype_ids (string[]), transferability (string), difficulty (string). GIN-indexed for fast @> and ?| queries.';

COMMENT ON COLUMN corpus_embeddings.script_version IS
  'Version of tools/corpus/embedCorpus.ts that produced this row. Tracks schema drift across corpus regenerations.';

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. HNSW index for semantic similarity search (cosine distance)
--    Params m=16, ef_construction=64 match existing rag_embeddings migration
--    (20260221172252_add_rag_embeddings.sql) for consistency.
-- ═════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_corpus_embeddings_embedding
  ON corpus_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. B-tree indexes for structured pre-filtering
-- ═════════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_corpus_embeddings_entity_type
  ON corpus_embeddings (entity_type);

CREATE INDEX IF NOT EXISTS idx_corpus_embeddings_content_hash
  ON corpus_embeddings (content_hash);

CREATE INDEX IF NOT EXISTS idx_corpus_embeddings_source_essay
  ON corpus_embeddings (source_essay_id)
  WHERE source_essay_id IS NOT NULL;

-- GIN index on JSONB filters for @> (contains) and ?| (any-of) queries
CREATE INDEX IF NOT EXISTS idx_corpus_embeddings_filters_gin
  ON corpus_embeddings
  USING gin (filters);

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. Row Level Security: authenticated-read, service-role-write
-- ═════════════════════════════════════════════════════════════════════════════
ALTER TABLE corpus_embeddings ENABLE ROW LEVEL SECURITY;

-- Pre-drop existing policies if migration is re-run (idempotency)
DROP POLICY IF EXISTS "Authenticated users can read corpus embeddings"
  ON corpus_embeddings;
DROP POLICY IF EXISTS "Service role can manage corpus embeddings"
  ON corpus_embeddings;

-- Authenticated pipeline sessions can SELECT for retrieval
CREATE POLICY "Authenticated users can read corpus embeddings"
  ON corpus_embeddings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Backend embedding pipeline (embedCorpus.ts) writes via service role
CREATE POLICY "Service role can manage corpus embeddings"
  ON corpus_embeddings
  FOR ALL
  USING (auth.role() = 'service_role');

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. Auto-update updated_at on row modifications
-- ═════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION corpus_embeddings_update_timestamp()
RETURNS TRIGGER AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS corpus_embeddings_timestamp_trigger ON corpus_embeddings;
CREATE TRIGGER corpus_embeddings_timestamp_trigger
  BEFORE UPDATE ON corpus_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION corpus_embeddings_update_timestamp();

-- ═════════════════════════════════════════════════════════════════════════════
-- 8. RPC helper: match_corpus_embeddings (hybrid retrieval)
--    Semantic rank + structured pre-filter in a single callable function.
--    Called by src/services/essayIntelligence/corpus/retrieval.ts.
-- ═════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION match_corpus_embeddings(
  query_embedding          vector,
  match_threshold          double precision DEFAULT 0.3,
  match_count              integer          DEFAULT 10,
  filter_entity_types      text[]           DEFAULT NULL,
  filter_voice_registers   text[]           DEFAULT NULL,
  filter_dimensions        text[]           DEFAULT NULL,
  filter_transferability   text             DEFAULT NULL,
  filter_difficulty        text             DEFAULT NULL,
  filter_essay_ids         text[]           DEFAULT NULL
)
RETURNS TABLE (
  id               uuid,
  entity_type      text,
  entity_id        text,
  content_hash     varchar(64),
  source_essay_id  text,
  source_paragraph integer,
  filters          jsonb,
  embedding_text   text,
  similarity       double precision
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.entity_type,
    e.entity_id,
    e.content_hash,
    e.source_essay_id,
    e.source_paragraph,
    e.filters,
    e.embedding_text,
    (1 - (e.embedding <=> query_embedding))::double precision AS similarity
  FROM corpus_embeddings e
  WHERE
    (1 - (e.embedding <=> query_embedding)) > match_threshold
    AND (filter_entity_types IS NULL OR e.entity_type = ANY(filter_entity_types))
    AND (
      filter_voice_registers IS NULL
      OR e.filters -> 'voice_registers' ?| filter_voice_registers
    )
    AND (
      filter_dimensions IS NULL
      OR e.filters -> 'dimensions' ?| filter_dimensions
    )
    AND (
      filter_transferability IS NULL
      OR e.filters ->> 'transferability' = filter_transferability
    )
    AND (
      filter_difficulty IS NULL
      OR e.filters ->> 'difficulty' = filter_difficulty
    )
    AND (filter_essay_ids IS NULL OR e.source_essay_id = ANY(filter_essay_ids))
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

COMMENT ON FUNCTION match_corpus_embeddings IS
  'Hybrid retrieval RPC: pre-filters by entity_type/voice/dimension/transferability/difficulty/essay, then ranks by cosine similarity. Used by corpus/retrieval.ts.';

-- ═════════════════════════════════════════════════════════════════════════════
-- 9. RPC helper: check_corpus_embedding_exists (content-hash skip check)
-- ═════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION check_corpus_embedding_exists(
  hash_value varchar(64)
)
RETURNS uuid
LANGUAGE sql
STABLE
AS $function$
  SELECT id FROM corpus_embeddings WHERE content_hash = hash_value LIMIT 1;
$function$;

COMMENT ON FUNCTION check_corpus_embedding_exists IS
  'Content-addressable skip check. Returns row id if hash exists; NULL otherwise. Used by embedCorpus.ts to avoid re-embedding unchanged entries.';
