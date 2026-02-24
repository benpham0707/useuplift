-- Migration: add_rag_embeddings
-- Created: 2026-02-21
-- Purpose: Create RAG (Retrieval-Augmented Generation) tables for essay fragment
--          and transformation storage with pgvector embeddings for semantic search.
--          Part of the Writing Quality Improvement initiative (Phase 3).

-- =============================================================================
-- 1. Enable pgvector extension for embedding storage and similarity search
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- 2. Table: rag_essay_fragments
--    Stores exemplary essay excerpts with embeddings for semantic retrieval.
--    Used to back teaching with real examples ("Here's how a strong essay handles this...").
-- =============================================================================
CREATE TABLE IF NOT EXISTS rag_essay_fragments (
  id                    uuid        NOT NULL DEFAULT gen_random_uuid(),
  content               text        NOT NULL,
  embedding             vector(1536),                         -- OpenAI text-embedding-3-small dimension
  essay_type            text,                                 -- e.g. 'common_app', 'piq', 'activity'
  prompt_type           text,                                 -- e.g. specific prompt identifier
  dimension             text,                                 -- analysis dimension (e.g. 'narrative_arc', 'voice')
  quality_tier          text        NOT NULL DEFAULT 'strong', -- 'strong', 'exceptional', etc.
  college               text,                                 -- target college if relevant
  technique             text,                                 -- writing technique demonstrated
  why_it_works          text        NOT NULL,                 -- explanation of effectiveness
  transferable_principle text       NOT NULL,                 -- abstracted principle students can apply
  source_info           text        NOT NULL,                 -- provenance/attribution
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),

  CONSTRAINT rag_essay_fragments_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- 3. Table: rag_transformations
--    Stores before/after transformation pairs showing how text was improved.
--    Used for inline editing examples and teaching.
-- =============================================================================
CREATE TABLE IF NOT EXISTS rag_transformations (
  id                    uuid             NOT NULL DEFAULT gen_random_uuid(),
  before_text           text             NOT NULL,
  after_text            text             NOT NULL,
  before_embedding      vector(1536),                         -- embedding of the "before" text
  after_embedding       vector(1536),                         -- embedding of the "after" text
  dimension             text,                                 -- analysis dimension
  technique             text,                                 -- transformation technique applied
  essay_type            text,                                 -- essay type context
  why_it_works          text             NOT NULL,            -- explanation of the improvement
  principle             text             NOT NULL,            -- transferable editing principle
  effectiveness_score   double precision DEFAULT 0.0,         -- quality rating of the transformation
  source_info           text             NOT NULL,            -- provenance/attribution
  created_at            timestamptz      DEFAULT now(),
  updated_at            timestamptz      DEFAULT now(),

  CONSTRAINT rag_transformations_pkey PRIMARY KEY (id)
);

-- =============================================================================
-- 4. HNSW indexes for fast approximate nearest neighbor vector search
--    Using cosine distance (vector_cosine_ops) with m=16, ef_construction=64
-- =============================================================================
CREATE INDEX idx_rag_fragments_embedding
  ON rag_essay_fragments
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_rag_transformations_before
  ON rag_transformations
  USING hnsw (before_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- =============================================================================
-- 5. B-tree metadata indexes for filtered queries
-- =============================================================================
CREATE INDEX idx_rag_fragments_essay_type  ON rag_essay_fragments (essay_type);
CREATE INDEX idx_rag_fragments_dimension   ON rag_essay_fragments (dimension);
CREATE INDEX idx_rag_fragments_technique   ON rag_essay_fragments (technique);
CREATE INDEX idx_rag_fragments_quality     ON rag_essay_fragments (quality_tier);

CREATE INDEX idx_rag_transformations_dimension ON rag_transformations (dimension);
CREATE INDEX idx_rag_transformations_technique ON rag_transformations (technique);

-- =============================================================================
-- 6. Row Level Security
--    Fragments and transformations are public reference data (read by all users).
--    Only the service role can insert/update/delete (seeded by backend pipeline).
-- =============================================================================
ALTER TABLE rag_essay_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_transformations ENABLE ROW LEVEL SECURITY;

-- Read policies: anyone can read (these are curated teaching examples, not user data)
CREATE POLICY "Anyone can read essay fragments"
  ON rag_essay_fragments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read transformations"
  ON rag_transformations FOR SELECT
  USING (true);

-- Write policies: only service_role (backend) can manage content
CREATE POLICY "Service role can manage fragments"
  ON rag_essay_fragments FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage transformations"
  ON rag_transformations FOR ALL
  USING (auth.role() = 'service_role');
