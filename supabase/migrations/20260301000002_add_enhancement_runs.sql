-- Enhancement Runs — tracks each /enhance invocation and its results.
-- Enables: enhancement history, cost tracking, quality progression analytics.

CREATE TABLE IF NOT EXISTS enhancement_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES editing_sessions(session_id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  essay_type TEXT,

  -- Input/output text snapshots
  original_text TEXT NOT NULL,
  improved_text TEXT NOT NULL,

  -- Quality metrics
  eqi_before NUMERIC(5,1) NOT NULL,
  eqi_after NUMERIC(5,1) NOT NULL,
  eqi_gain NUMERIC(5,1) NOT NULL,
  dimension_scores_before JSONB NOT NULL DEFAULT '{}',
  dimension_scores_after JSONB NOT NULL DEFAULT '{}',

  -- Execution metadata
  steps_completed INTEGER NOT NULL DEFAULT 0,
  steps_rejected INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC(8,4) NOT NULL DEFAULT 0,
  total_time_ms INTEGER NOT NULL DEFAULT 0,

  -- Detailed step history
  steps JSONB NOT NULL DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX idx_enhancement_runs_user_id ON enhancement_runs(user_id);
CREATE INDEX idx_enhancement_runs_session_id ON enhancement_runs(session_id);
CREATE INDEX idx_enhancement_runs_created_at ON enhancement_runs(created_at DESC);

-- RLS
ALTER TABLE enhancement_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own enhancement runs"
  ON enhancement_runs FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "Service role can manage enhancement runs"
  ON enhancement_runs FOR ALL
  USING (true)
  WITH CHECK (true);
