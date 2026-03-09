-- Essay Understanding Portfolio (EUP) table
-- Stores the 5-level hierarchical understanding model as JSONB
-- One row per essay version, with incremental update support

CREATE TABLE IF NOT EXISTS essay_understanding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  essay_type TEXT NOT NULL,
  text_hash TEXT NOT NULL,

  -- The full EUP JSONB document (~150-200KB at full depth)
  understanding JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Extracted top-level fields for querying without JSONB traversal
  overall_eqi INTEGER,
  impression_label TEXT,
  readiness_level TEXT,
  total_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,

  -- Analysis metadata
  analysis_passes JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_analysis_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active understanding per essay per user
  CONSTRAINT essay_understanding_unique_active UNIQUE (essay_id, user_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_essay_understanding_user_id ON essay_understanding(user_id);
CREATE INDEX IF NOT EXISTS idx_essay_understanding_essay_id ON essay_understanding(essay_id);
CREATE INDEX IF NOT EXISTS idx_essay_understanding_text_hash ON essay_understanding(text_hash);
CREATE INDEX IF NOT EXISTS idx_essay_understanding_updated_at ON essay_understanding(updated_at DESC);

-- GIN index for JSONB queries (e.g., finding essays by readiness level)
CREATE INDEX IF NOT EXISTS idx_essay_understanding_jsonb ON essay_understanding USING gin (understanding jsonb_path_ops);

-- Row Level Security
ALTER TABLE essay_understanding ENABLE ROW LEVEL SECURITY;

-- Users can only access their own understanding records
CREATE POLICY "Users can view own essay understanding"
  ON essay_understanding FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own essay understanding"
  ON essay_understanding FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own essay understanding"
  ON essay_understanding FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own essay understanding"
  ON essay_understanding FOR DELETE
  USING (auth.uid()::text = user_id);

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role full access to essay understanding"
  ON essay_understanding FOR ALL
  USING (auth.role() = 'service_role');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_essay_understanding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_essay_understanding_updated_at
  BEFORE UPDATE ON essay_understanding
  FOR EACH ROW
  EXECUTE FUNCTION update_essay_understanding_updated_at();
