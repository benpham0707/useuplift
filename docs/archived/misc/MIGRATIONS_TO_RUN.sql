-- =============================================================================
-- COMPLETE MIGRATION DEPLOYMENT FILE
-- =============================================================================
--
-- INSTRUCTIONS:
-- 1. Copy this ENTIRE file
-- 2. Paste into Supabase SQL Editor (https://supabase.com/dashboard/project/zclaplpkuvxkrdwsgrul/sql/new)
-- 3. Click "Run" (or press Cmd+Enter)
-- 4. Wait for "Success" message
--
-- This file contains TWO migrations that will run in sequence:
--   A) Base Essay System (creates all tables with Supabase auth)
--   B) PIQ Enhancements (adds columns + converts to Clerk auth)
--
-- Both migrations are SAFE to run multiple times (idempotent)
-- =============================================================================

-- =============================================================================
-- MIGRATION A: Base Essay System
-- =============================================================================
-- This creates the core essay tables if they don't exist
-- =============================================================================

-- Create custom ENUM types for essays
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE essay_type AS ENUM (
      'personal_statement',
      'uc_piq',
      'why_us',
      'community',
      'challenge_adversity',
      'intellectual_vitality',
      'activity_to_essay',
      'identity_background',
      'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE impression_label AS ENUM (
      'arresting_deeply_human',     -- 90-100
      'compelling_clear_voice',     -- 80-89
      'competent_needs_texture',    -- 70-79
      'readable_but_generic',       -- 60-69
      'template_like_rebuild'       -- <60
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE voice_style AS ENUM (
      'concise_operator',
      'warm_reflective',
      'understated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE analysis_depth AS ENUM (
      'quick',
      'standard',
      'comprehensive'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================================================
-- TABLE: essays
-- =============================================================================

CREATE TABLE IF NOT EXISTS essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_id UUID,

  essay_type essay_type NOT NULL,
  prompt_text TEXT,
  max_words INTEGER NOT NULL DEFAULT 650,
  target_school TEXT,

  draft_original TEXT NOT NULL,
  draft_current TEXT,
  version INTEGER NOT NULL DEFAULT 1,

  context_constraints TEXT,
  intended_major TEXT,

  submitted_at TIMESTAMPTZ,
  locked BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT max_words_positive CHECK (max_words > 0),
  CONSTRAINT version_positive CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_essays_user_id ON essays(user_id);
CREATE INDEX IF NOT EXISTS idx_essays_type ON essays(essay_type);
CREATE INDEX IF NOT EXISTS idx_essays_created_at ON essays(created_at DESC);

-- =============================================================================
-- TABLE: essay_analysis_reports
-- =============================================================================

CREATE TABLE IF NOT EXISTS essay_analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL,

  rubric_version TEXT NOT NULL DEFAULT 'v1.0.0',
  analysis_depth analysis_depth NOT NULL DEFAULT 'standard',

  essay_quality_index NUMERIC(5,2) NOT NULL CHECK (essay_quality_index >= 0 AND essay_quality_index <= 100),
  impression_label impression_label NOT NULL,

  dimension_scores JSONB NOT NULL,
  weights JSONB NOT NULL,

  flags TEXT[] DEFAULT '{}',
  prioritized_levers TEXT[] DEFAULT '{}',

  elite_pattern_profile JSONB,
  token_usage JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT dimension_scores_valid CHECK (jsonb_typeof(dimension_scores) = 'array'),
  CONSTRAINT weights_valid CHECK (jsonb_typeof(weights) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_analysis_essay_id ON essay_analysis_reports(essay_id);
CREATE INDEX IF NOT EXISTS idx_analysis_eqi ON essay_analysis_reports(essay_quality_index DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON essay_analysis_reports(created_at DESC);

-- =============================================================================
-- TABLE: essay_coaching_plans
-- =============================================================================

CREATE TABLE IF NOT EXISTS essay_coaching_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL,
  analysis_report_id UUID,

  goal_statement TEXT NOT NULL,
  coaching_depth analysis_depth NOT NULL DEFAULT 'standard',

  outline_variants JSONB NOT NULL DEFAULT '[]',
  micro_edits JSONB NOT NULL DEFAULT '[]',
  rewrites_by_style JSONB NOT NULL DEFAULT '{}',

  elicitation_prompts JSONB NOT NULL DEFAULT '{}',

  guardrails TEXT[] DEFAULT '{}',
  word_budget_guidance TEXT,
  school_alignment_todo TEXT[],

  token_usage JSONB,

  accepted BOOLEAN DEFAULT FALSE,
  student_feedback TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT outline_variants_valid CHECK (jsonb_typeof(outline_variants) = 'array'),
  CONSTRAINT micro_edits_valid CHECK (jsonb_typeof(micro_edits) = 'array'),
  CONSTRAINT rewrites_valid CHECK (jsonb_typeof(rewrites_by_style) = 'object'),
  CONSTRAINT elicitation_valid CHECK (jsonb_typeof(elicitation_prompts) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_coaching_essay_id ON essay_coaching_plans(essay_id);
CREATE INDEX IF NOT EXISTS idx_coaching_created_at ON essay_coaching_plans(created_at DESC);

-- =============================================================================
-- TABLE: essay_revision_history
-- =============================================================================

CREATE TABLE IF NOT EXISTS essay_revision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL,

  version INTEGER NOT NULL,
  draft_content TEXT NOT NULL,

  change_summary TEXT,
  source TEXT,
  coaching_plan_id UUID,

  word_count INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT version_positive CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_revision_essay_id ON essay_revision_history(essay_id);
CREATE INDEX IF NOT EXISTS idx_revision_version ON essay_revision_history(essay_id, version DESC);

-- =============================================================================
-- TRIGGERS (only create if they don't exist)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_essays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS essays_updated_at ON essays;
CREATE TRIGGER essays_updated_at
  BEFORE UPDATE ON essays
  FOR EACH ROW
  EXECUTE FUNCTION update_essays_updated_at();

CREATE OR REPLACE FUNCTION increment_essay_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.draft_current IS DISTINCT FROM OLD.draft_current THEN
    NEW.version = OLD.version + 1;

    INSERT INTO essay_revision_history (essay_id, version, draft_content, source, word_count)
    VALUES (
      NEW.id,
      NEW.version,
      NEW.draft_current,
      'student',
      array_length(regexp_split_to_array(trim(NEW.draft_current), '\s+'), 1)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS essay_version_increment ON essays;
CREATE TRIGGER essay_version_increment
  BEFORE UPDATE ON essays
  FOR EACH ROW
  EXECUTE FUNCTION increment_essay_version();

-- =============================================================================
-- END OF MIGRATION A
-- =============================================================================




-- =============================================================================
-- MIGRATION B: PIQ Workshop Enhancements + Clerk Auth Migration
-- =============================================================================
-- This adds new columns and converts authentication to Clerk
-- =============================================================================

-- 1. ADD NEW COLUMNS TO essay_analysis_reports
-- =============================================================================

ALTER TABLE essay_analysis_reports
ADD COLUMN IF NOT EXISTS voice_fingerprint JSONB,
ADD COLUMN IF NOT EXISTS experience_fingerprint JSONB,
ADD COLUMN IF NOT EXISTS workshop_items JSONB,
ADD COLUMN IF NOT EXISTS full_analysis_result JSONB;

-- 2. ADD COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN essay_analysis_reports.voice_fingerprint IS
'Voice Fingerprint data: sentence structure, vocabulary, pacing, and tone analysis from surgical workshop';

COMMENT ON COLUMN essay_analysis_reports.experience_fingerprint IS
'Experience Fingerprint data: uniqueness dimensions, anti-pattern detection, divergence requirements, and quality anchors';

COMMENT ON COLUMN essay_analysis_reports.workshop_items IS
'Array of surgical workshop items with problems, suggestions (polished_original, voice_amplifier, divergent_strategy), and rationales';

COMMENT ON COLUMN essay_analysis_reports.full_analysis_result IS
'Complete AnalysisResult object from backend for archival and debugging purposes';

-- 3. CREATE INDEXES FOR JSONB QUERIES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_analysis_has_voice_fingerprint
ON essay_analysis_reports ((voice_fingerprint IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_analysis_has_experience_fingerprint
ON essay_analysis_reports ((experience_fingerprint IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_analysis_voice_fingerprint_gin
ON essay_analysis_reports USING gin(voice_fingerprint);

CREATE INDEX IF NOT EXISTS idx_analysis_experience_fingerprint_gin
ON essay_analysis_reports USING gin(experience_fingerprint);

CREATE INDEX IF NOT EXISTS idx_analysis_workshop_items_gin
ON essay_analysis_reports USING gin(workshop_items);

-- 4. UPDATE essays TABLE FOR CLERK AUTH
-- =============================================================================

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own essays" ON essays;
DROP POLICY IF EXISTS "Users can insert own essays" ON essays;
DROP POLICY IF EXISTS "Users can update own essays" ON essays;
DROP POLICY IF EXISTS "Users can delete own essays" ON essays;

-- Convert user_id to TEXT for Clerk compatibility
ALTER TABLE essays DROP CONSTRAINT IF EXISTS essays_user_id_fkey;
ALTER TABLE essays ALTER COLUMN user_id TYPE text USING user_id::text;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_essays_user_id ON essays(user_id);

-- Enable RLS
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;

-- Recreate policies using Clerk JWT
CREATE POLICY "Clerk: Users can view own essays" ON essays
    FOR SELECT TO authenticated
    USING (user_id = (select auth.jwt() ->> 'sub'));

CREATE POLICY "Clerk: Users can insert own essays" ON essays
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.jwt() ->> 'sub'));

CREATE POLICY "Clerk: Users can update own essays" ON essays
    FOR UPDATE TO authenticated
    USING (user_id = (select auth.jwt() ->> 'sub') AND locked = FALSE);

CREATE POLICY "Clerk: Users can delete own essays" ON essays
    FOR DELETE TO authenticated
    USING (user_id = (select auth.jwt() ->> 'sub') AND locked = FALSE);

-- 5. UPDATE essay_analysis_reports RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own essay analyses" ON essay_analysis_reports;
DROP POLICY IF EXISTS "System can insert analysis reports" ON essay_analysis_reports;
DROP POLICY IF EXISTS "Clerk: Users can view own essay analyses" ON essay_analysis_reports;
DROP POLICY IF EXISTS "Clerk: System can insert analysis reports" ON essay_analysis_reports;
DROP POLICY IF EXISTS "Clerk: Users can update own essay analyses" ON essay_analysis_reports;

ALTER TABLE essay_analysis_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clerk: Users can view own essay analyses" ON essay_analysis_reports
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_analysis_reports.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

CREATE POLICY "Clerk: System can insert analysis reports" ON essay_analysis_reports
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_analysis_reports.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

CREATE POLICY "Clerk: Users can update own essay analyses" ON essay_analysis_reports
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_analysis_reports.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

-- 6. UPDATE essay_revision_history RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own revision history" ON essay_revision_history;
DROP POLICY IF EXISTS "Clerk: Users can view own revision history" ON essay_revision_history;
DROP POLICY IF EXISTS "Clerk: System can insert revision history" ON essay_revision_history;

ALTER TABLE essay_revision_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clerk: Users can view own revision history" ON essay_revision_history
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_revision_history.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

CREATE POLICY "Clerk: System can insert revision history" ON essay_revision_history
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_revision_history.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

-- 7. UPDATE essay_coaching_plans RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view own coaching plans" ON essay_coaching_plans;
DROP POLICY IF EXISTS "System can insert coaching plans" ON essay_coaching_plans;
DROP POLICY IF EXISTS "Users can update own coaching plan feedback" ON essay_coaching_plans;
DROP POLICY IF EXISTS "Clerk: Users can view own coaching plans" ON essay_coaching_plans;
DROP POLICY IF EXISTS "Clerk: System can insert coaching plans" ON essay_coaching_plans;
DROP POLICY IF EXISTS "Clerk: Users can update own coaching plan feedback" ON essay_coaching_plans;

ALTER TABLE essay_coaching_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clerk: Users can view own coaching plans" ON essay_coaching_plans
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_coaching_plans.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

CREATE POLICY "Clerk: System can insert coaching plans" ON essay_coaching_plans
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_coaching_plans.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

CREATE POLICY "Clerk: Users can update own coaching plan feedback" ON essay_coaching_plans
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1 FROM essays
        WHERE essays.id = essay_coaching_plans.essay_id
        AND essays.user_id = (select auth.jwt() ->> 'sub')
    ));

-- 8. ADD HELPER FUNCTION FOR GETTING CLERK USER ID
-- =============================================================================

CREATE OR REPLACE FUNCTION current_clerk_user_id()
RETURNS text AS $$
BEGIN
    RETURN (select auth.jwt() ->> 'sub');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION current_clerk_user_id() IS
'Helper function to get the current Clerk user ID from JWT. Use this in application code instead of repeatedly calling auth.jwt() ->> ''sub''';

GRANT EXECUTE ON FUNCTION current_clerk_user_id() TO authenticated;

-- =============================================================================
-- END OF MIGRATION B
-- =============================================================================

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running, you can verify with these queries:

-- Check that essay tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%essay%' ORDER BY table_name;

-- Check new columns were added:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'essay_analysis_reports' AND column_name IN ('voice_fingerprint', 'experience_fingerprint', 'workshop_items', 'full_analysis_result');

-- Check RLS policies:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('essays', 'essay_analysis_reports') ORDER BY tablename, policyname;

-- =============================================================================
-- DEPLOYMENT COMPLETE!
-- =============================================================================
