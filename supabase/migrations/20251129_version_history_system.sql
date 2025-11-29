-- =============================================================================
-- Version History System Rebuild
-- Migration: 20251129_version_history_system.sql
-- 
-- Adds support for:
-- - Typed versions (autosave, milestone, analysis)
-- - Labels for milestone versions
-- - Direct score storage on versions
-- - Soft delete support
-- - Parent version tracking for future diffing
-- =============================================================================

-- 1. Create enum for version types
-- =============================================================================
DO $$ BEGIN
    CREATE TYPE version_source_type AS ENUM ('autosave', 'milestone', 'analysis');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add new columns to essay_revision_history
-- =============================================================================

-- Add created_by column (version type)
ALTER TABLE essay_revision_history
  ADD COLUMN IF NOT EXISTS created_by version_source_type NOT NULL DEFAULT 'autosave';

-- Add label for milestone versions
ALTER TABLE essay_revision_history
  ADD COLUMN IF NOT EXISTS label TEXT;

-- Add parent_version_id for diffing support
ALTER TABLE essay_revision_history
  ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES essay_revision_history(id);

-- Add score directly on version (for analysis versions)
ALTER TABLE essay_revision_history
  ADD COLUMN IF NOT EXISTS score NUMERIC CHECK (score IS NULL OR (score >= 0 AND score <= 100));

-- Add dimension_scores JSONB for full analysis breakdown
ALTER TABLE essay_revision_history
  ADD COLUMN IF NOT EXISTS dimension_scores JSONB;

-- Add direct link to analysis report
ALTER TABLE essay_revision_history
  ADD COLUMN IF NOT EXISTS analysis_report_id UUID REFERENCES essay_analysis_reports(id);

-- Add soft delete support
ALTER TABLE essay_revision_history
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Migrate existing source values to created_by
-- =============================================================================
-- Map old source values to new enum:
--   'analyze' -> 'analysis'
--   'save_draft', 'student' -> 'milestone'
--   'system_auto', 'coach_suggestion', NULL -> 'autosave'

UPDATE essay_revision_history 
SET created_by = 
  CASE 
    WHEN source = 'analyze' THEN 'analysis'::version_source_type
    WHEN source IN ('save_draft', 'student') THEN 'milestone'::version_source_type
    ELSE 'autosave'::version_source_type
  END
WHERE source IS NOT NULL;

-- 4. Add indexes for performance
-- =============================================================================

-- Index on created_by for filtering by version type
CREATE INDEX IF NOT EXISTS idx_revision_created_by 
  ON essay_revision_history(created_by);

-- Partial index for non-deleted versions (most common query)
CREATE INDEX IF NOT EXISTS idx_revision_not_deleted 
  ON essay_revision_history(essay_id, created_at DESC) 
  WHERE NOT is_deleted;

-- Index for parent version lookups (future diffing)
CREATE INDEX IF NOT EXISTS idx_revision_parent 
  ON essay_revision_history(parent_version_id) 
  WHERE parent_version_id IS NOT NULL;

-- Index for analysis report lookups
CREATE INDEX IF NOT EXISTS idx_revision_analysis_report 
  ON essay_revision_history(analysis_report_id) 
  WHERE analysis_report_id IS NOT NULL;

-- 5. Drop legacy source column
-- =============================================================================
ALTER TABLE essay_revision_history DROP COLUMN IF EXISTS source;

-- 6. Update the essay_version_increment trigger to use new schema
-- =============================================================================
-- The old trigger was inserting with the 'source' column which no longer exists.
-- We need to either update it or remove it. Since we're now managing versions
-- explicitly through the application code, we'll simplify the trigger to just
-- increment the version number without auto-creating revision history entries.

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS essay_version_increment ON essays;
DROP FUNCTION IF EXISTS increment_essay_version();

-- Recreate a simpler trigger that only increments version (no auto revision creation)
CREATE OR REPLACE FUNCTION increment_essay_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.draft_current IS DISTINCT FROM OLD.draft_current THEN
    NEW.version = OLD.version + 1;
    -- Note: Revision history entries are now created explicitly by the application
    -- via saveAutosaveVersion, saveMilestoneVersion, or saveAnalysisVersion
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER essay_version_increment
  BEFORE UPDATE ON essays
  FOR EACH ROW
  EXECUTE FUNCTION increment_essay_version();

-- 7. Update RLS policies to account for soft delete
-- =============================================================================

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can view own revision history" ON essay_revision_history;
DROP POLICY IF EXISTS "Clerk: Users can view own revision history" ON essay_revision_history;

-- Create new policy that filters out deleted versions
CREATE POLICY "Clerk: Users can view own non-deleted revision history"
  ON essay_revision_history FOR SELECT
  USING (
    NOT is_deleted 
    AND EXISTS (
      SELECT 1 FROM essays 
      WHERE essays.id = essay_id 
      AND essays.user_id = (SELECT auth.jwt() ->> 'sub')
    )
  );

-- Update insert policy (no change needed, just ensure it exists)
DROP POLICY IF EXISTS "Clerk: Users can insert own revision history" ON essay_revision_history;

CREATE POLICY "Clerk: Users can insert own revision history"
  ON essay_revision_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM essays 
      WHERE essays.id = essay_id 
      AND essays.user_id = (SELECT auth.jwt() ->> 'sub')
    )
  );

-- Add update policy for soft delete
DROP POLICY IF EXISTS "Clerk: Users can update own revision history" ON essay_revision_history;

CREATE POLICY "Clerk: Users can update own revision history"
  ON essay_revision_history FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM essays 
      WHERE essays.id = essay_id 
      AND essays.user_id = (SELECT auth.jwt() ->> 'sub')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM essays 
      WHERE essays.id = essay_id 
      AND essays.user_id = (SELECT auth.jwt() ->> 'sub')
    )
  );

-- Grant UPDATE permission
GRANT UPDATE ON essay_revision_history TO authenticated;

-- =============================================================================
-- Migration complete
-- =============================================================================


