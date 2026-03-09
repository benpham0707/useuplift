-- Prestige Research Cache
-- Permanent cache for JIT prestige research results (Sonnet assessments)
-- Each entity is researched once and cached for all users

CREATE TABLE IF NOT EXISTS prestige_research_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_name_normalized TEXT NOT NULL UNIQUE,
  research_result JSONB NOT NULL,
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Primary lookup by entity name
CREATE INDEX idx_prestige_cache_entity ON prestige_research_cache(entity_name_normalized);

-- For cache invalidation when model changes
CREATE INDEX idx_prestige_cache_model ON prestige_research_cache(model_version);

-- Enable RLS (admin-only access via service key)
ALTER TABLE prestige_research_cache ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed — accessed only via supabaseAdmin (service role key)
