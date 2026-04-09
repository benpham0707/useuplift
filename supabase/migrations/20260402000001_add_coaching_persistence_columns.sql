-- Cross-Session Coaching Persistence
-- Adds coaching_state and profile_cache columns to essay_understanding.
-- coaching_state: persists CoachingSessionMemory between sessions.
-- profile_cache: caches EssayProfile to skip re-analysis on unchanged text.

ALTER TABLE essay_understanding
  ADD COLUMN IF NOT EXISTS coaching_state JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS profile_cache JSONB DEFAULT NULL;

COMMENT ON COLUMN essay_understanding.coaching_state IS
  'Full CoachingSessionMemory + LearningStyleObservations. Persisted per coaching turn.';
COMMENT ON COLUMN essay_understanding.profile_cache IS
  'Cached EssayProfile from last analysis pipeline. Used to skip re-analysis when text_hash matches.';
