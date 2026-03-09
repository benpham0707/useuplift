-- Scoring Telemetry Table
--
-- Captures detailed traces of every scoring pipeline run for:
--   1. Calibration drift detection (LLM vs rule scorer divergence)
--   2. Coverage gap analysis (which domains lack KB data)
--   3. Domain-level score distribution analytics
--
-- Upsert key: fingerprint (re-scoring same activity overwrites)
-- Privacy: fingerprints are SHA-256 hashes, no user IDs stored

CREATE TABLE IF NOT EXISTS public.scoring_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL,
  activity_category TEXT NOT NULL,
  activity_title TEXT,
  scored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  kb_version TEXT NOT NULL,
  model_version TEXT NOT NULL,
  internal_tier INTEGER NOT NULL CHECK (internal_tier BETWEEN 1 AND 6),
  domain_resolution JSONB NOT NULL,
  rule_score_total NUMERIC(5,2) NOT NULL,
  llm_adjustment_trace JSONB NOT NULL,
  final_score_total NUMERIC(5,2) NOT NULL,
  description_score_total NUMERIC(5,2),
  expertise_confidence TEXT CHECK (expertise_confidence IN ('high','medium','low')),
  expertise_domain TEXT,
  overall_signal_strength TEXT CHECK (overall_signal_strength IN ('strong','moderate','weak')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index on fingerprint for upsert
CREATE UNIQUE INDEX idx_scoring_telemetry_fingerprint ON scoring_telemetry(fingerprint);

-- Category + time for domain-level analytics queries
CREATE INDEX idx_scoring_telemetry_category_time ON scoring_telemetry(activity_category, scored_at DESC);

-- Resolution confidence for coverage gap queries (JSONB path extraction)
CREATE INDEX idx_scoring_telemetry_confidence ON scoring_telemetry((domain_resolution->>'resolutionConfidence'));

-- Final score for distribution queries
CREATE INDEX idx_scoring_telemetry_final_score ON scoring_telemetry(final_score_total);
