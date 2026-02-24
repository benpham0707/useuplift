-- Migration: add_vector_match_functions
-- Created: 2026-02-21
-- Purpose: Create RPC functions for semantic similarity search on RAG tables.
--          These are called from the application via supabase.rpc() to find
--          relevant essay fragments and transformations for teaching.

-- =============================================================================
-- 1. match_rag_fragments
--    Finds essay fragments semantically similar to a query embedding.
--    Supports optional filters by essay_type, dimension, technique, quality_tier.
--    Returns results ordered by cosine similarity (descending).
-- =============================================================================
CREATE OR REPLACE FUNCTION match_rag_fragments(
  query_embedding     vector,
  match_threshold     double precision DEFAULT 0.5,
  match_count         integer          DEFAULT 10,
  filter_essay_type   text             DEFAULT NULL,
  filter_dimension    text             DEFAULT NULL,
  filter_technique    text             DEFAULT NULL,
  filter_quality_tier text             DEFAULT NULL
)
RETURNS TABLE (
  id                    uuid,
  content               text,
  essay_type            text,
  prompt_type           text,
  dimension             text,
  quality_tier          text,
  college               text,
  technique             text,
  why_it_works          text,
  transferable_principle text,
  source_info           text,
  similarity            double precision
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.content,
    f.essay_type,
    f.prompt_type,
    f.dimension,
    f.quality_tier,
    f.college,
    f.technique,
    f.why_it_works,
    f.transferable_principle,
    f.source_info,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM rag_essay_fragments f
  WHERE
    f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
    AND (filter_essay_type IS NULL OR f.essay_type = filter_essay_type)
    AND (filter_dimension IS NULL OR f.dimension = filter_dimension)
    AND (filter_technique IS NULL OR f.technique = filter_technique)
    AND (filter_quality_tier IS NULL OR f.quality_tier = filter_quality_tier)
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- =============================================================================
-- 2. match_rag_transformations
--    Finds before/after transformation pairs where the "before" text is
--    semantically similar to the query. Used to show students how similar
--    passages were improved.
--    Supports optional filters by essay_type, dimension, technique.
-- =============================================================================
CREATE OR REPLACE FUNCTION match_rag_transformations(
  query_embedding   vector,
  match_threshold   double precision DEFAULT 0.5,
  match_count       integer          DEFAULT 10,
  filter_essay_type text             DEFAULT NULL,
  filter_dimension  text             DEFAULT NULL,
  filter_technique  text             DEFAULT NULL
)
RETURNS TABLE (
  id                  uuid,
  before_text         text,
  after_text          text,
  dimension           text,
  technique           text,
  essay_type          text,
  why_it_works        text,
  principle           text,
  effectiveness_score double precision,
  similarity          double precision
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.before_text,
    t.after_text,
    t.dimension,
    t.technique,
    t.essay_type,
    t.why_it_works,
    t.principle,
    t.effectiveness_score,
    1 - (t.before_embedding <=> query_embedding) AS similarity
  FROM rag_transformations t
  WHERE
    t.before_embedding IS NOT NULL
    AND 1 - (t.before_embedding <=> query_embedding) > match_threshold
    AND (filter_essay_type IS NULL OR t.essay_type = filter_essay_type)
    AND (filter_dimension IS NULL OR t.dimension = filter_dimension)
    AND (filter_technique IS NULL OR t.technique = filter_technique)
  ORDER BY t.before_embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;
