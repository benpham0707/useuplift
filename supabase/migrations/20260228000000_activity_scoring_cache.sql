-- =====================================================
-- ACTIVITY SCORING CACHE — CROSS-USER CACHE TABLE
--
-- Stores scoring results keyed by activity fingerprint
-- (SHA-256 hash of description + role + category + hours + years).
-- Shared across ALL users — identical activities get the same scores.
--
-- No RLS needed: this table is server-side only, accessed via
-- supabaseAdmin (service role key). No user-facing queries.
--
-- Cache invalidation is handled at the application layer:
--   - KB version mismatch → stale, re-score
--   - Model version mismatch → stale, re-score
--   - TTL expiry (default 7 days) → stale, re-score
--   - Manual invalidateAll() → deletes all rows
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_scoring_cache (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- SHA-256 fingerprint of activity input (64 hex chars)
  -- Unique constraint ensures one cache entry per distinct activity
  fingerprint TEXT UNIQUE NOT NULL,

  -- Cached description score (total + breakdown JSONB)
  description_score JSONB NOT NULL,

  -- Cached activity score (total + components JSONB)
  activity_score JSONB NOT NULL,

  -- Cached tier classification (internalTier + externalTier JSONB)
  tier_classification JSONB NOT NULL,

  -- Version metadata for cache invalidation
  kb_version TEXT NOT NULL,
  model_version TEXT NOT NULL,

  -- Hit tracking
  hit_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  last_hit_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- O(1) fingerprint lookup (backed by UNIQUE constraint, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_activity_scoring_cache_fingerprint
  ON public.activity_scoring_cache (fingerprint);

-- Cleanup queries: find oldest entries for TTL eviction
CREATE INDEX IF NOT EXISTS idx_activity_scoring_cache_created_at
  ON public.activity_scoring_cache (created_at);

-- Version-based queries: find entries with stale KB/model versions
CREATE INDEX IF NOT EXISTS idx_activity_scoring_cache_versions
  ON public.activity_scoring_cache (kb_version, model_version);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.activity_scoring_cache IS
  'Cross-user scoring cache. Stores scoring results keyed by activity fingerprint (SHA-256). Server-side only, no RLS.';

COMMENT ON COLUMN public.activity_scoring_cache.fingerprint IS
  'SHA-256 hex hash of normalized activity input (description + role + category + hoursPerWeek + yearsActive)';

COMMENT ON COLUMN public.activity_scoring_cache.description_score IS
  'Cached DescriptionScore: { total: number, breakdown: {...} }';

COMMENT ON COLUMN public.activity_scoring_cache.activity_score IS
  'Cached ActivityScore: { total: number, components: {...} }';

COMMENT ON COLUMN public.activity_scoring_cache.tier_classification IS
  'Cached tier: { internalTier: 1-6, externalTier: 1-4 }';

COMMENT ON COLUMN public.activity_scoring_cache.kb_version IS
  'Knowledge Base version (KB_VERSION) when this entry was created. Mismatches invalidate the entry.';

COMMENT ON COLUMN public.activity_scoring_cache.model_version IS
  'Claude model ID used to produce these scores. Mismatches invalidate the entry.';

COMMENT ON COLUMN public.activity_scoring_cache.hit_count IS
  'Number of times this entry has been served from cache';
