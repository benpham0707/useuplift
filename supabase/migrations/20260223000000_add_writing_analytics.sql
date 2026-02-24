-- ============================================================================
-- Writing Analytics & Prompt Effectiveness Tables
-- Phase 4: Feedback loops and continuous improvement
-- ============================================================================

-- Event-based analytics tracking for writing improvements
CREATE TABLE IF NOT EXISTS writing_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,  -- 'suggestion_shown', 'suggestion_accepted', 'suggestion_rejected',
                             -- 'score_change', 'inline_edit', 'command_used'
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_writing_analytics_user ON writing_analytics(user_id);
CREATE INDEX idx_writing_analytics_session ON writing_analytics(session_id);
CREATE INDEX idx_writing_analytics_type ON writing_analytics(event_type);
CREATE INDEX idx_writing_analytics_created ON writing_analytics(created_at);
CREATE INDEX idx_writing_analytics_user_type ON writing_analytics(user_id, event_type);

-- Aggregated prompt effectiveness (updated by service on write)
CREATE TABLE IF NOT EXISTS prompt_effectiveness (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash TEXT NOT NULL UNIQUE,
  prompt_type TEXT,          -- 'suggestion', 'inline_edit', 'teaching'
  workshop TEXT,             -- 'common_app', 'piq', 'activity'
  total_shown INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  avg_score_improvement FLOAT DEFAULT 0,
  avg_satisfaction FLOAT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_prompt_effectiveness_type ON prompt_effectiveness(prompt_type);
CREATE INDEX idx_prompt_effectiveness_workshop ON prompt_effectiveness(workshop);

-- RLS policies
ALTER TABLE writing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_effectiveness ENABLE ROW LEVEL SECURITY;

-- Users can read their own analytics
CREATE POLICY "Users can read own analytics"
  ON writing_analytics FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Server (service role) can insert analytics for any user
CREATE POLICY "Service role can insert analytics"
  ON writing_analytics FOR INSERT
  WITH CHECK (true);

-- Prompt effectiveness is read-only for authenticated users, writable by service role
CREATE POLICY "Authenticated users can read prompt effectiveness"
  ON prompt_effectiveness FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage prompt effectiveness"
  ON prompt_effectiveness FOR ALL
  USING (true);
