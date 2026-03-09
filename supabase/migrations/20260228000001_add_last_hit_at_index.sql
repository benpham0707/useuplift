-- Index on last_hit_at for efficient cache eviction queries.
-- The cross-user cache service orders by last_hit_at ASC to find
-- the oldest entries when enforcing maxEntries. Without this index,
-- the ORDER BY requires a full table scan.

CREATE INDEX IF NOT EXISTS idx_activity_scoring_cache_last_hit_at
  ON public.activity_scoring_cache (last_hit_at);
