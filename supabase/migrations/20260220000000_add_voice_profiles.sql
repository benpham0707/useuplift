-- Voice Profiles table
-- Stores persistent voice fingerprints for students across all workshops.
-- The profile column holds the full StudentVoiceProfile JSON.

CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own voice profile"
  ON voice_profiles FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');
