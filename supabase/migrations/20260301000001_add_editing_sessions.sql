-- Editing sessions persistence for enhanced workshop
-- Supports write-behind caching from in-memory session service

CREATE TABLE IF NOT EXISTS public.editing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('essay', 'piq', 'activity_description')),
  current_text TEXT NOT NULL DEFAULT '',
  essay_type TEXT,
  prompt_text TEXT,
  college_id TEXT,
  edit_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_analysis JSONB,
  voice_profile_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  ended_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.editing_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own editing sessions"
  ON public.editing_sessions
  FOR ALL
  USING (user_id = (SELECT auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (SELECT auth.jwt() ->> 'sub'));

-- Indexes (session_id already has implicit unique index from UNIQUE constraint)
CREATE INDEX idx_editing_sessions_user_id ON public.editing_sessions(user_id);
CREATE INDEX idx_editing_sessions_expires_at ON public.editing_sessions(expires_at) WHERE ended_at IS NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_editing_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER editing_sessions_updated_at
  BEFORE UPDATE ON public.editing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_editing_session_timestamp();
