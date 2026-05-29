-- =====================================================
-- ESSAY CHAT CONVERSATIONS — Phase 0 D-0.6
-- =====================================================
-- Spec: docs/pipeline-evolution/04-pipeline-architecture/L5/L5_E2E_INTEGRITY_AUDIT.md §4.6
--   ("Schema mirrors activity-side" — see migration 20260219000000).
-- Contract: INTEGRATED_BUILD_SEQUENCE.md D-0.6 / L5_IMPLEMENTATION_PLAN §2 D-0.6.
--
-- Stores the full Conversator chat session per (essay, profile). Capped
-- to 50 turns in the conversation_state JSONB (vs activity's 20; essays
-- warrant longer dialogue history).
--
-- Auth: Clerk JWT via auth.jwt() ->> 'sub', matching profiles.user_id
-- (same pattern as activity_chat_conversations).
--
-- Spec divergences from build-sequence prose, applied to mirror activity
-- precedent:
--   - profile_id is UUID FK → profiles.id (build-sequence prose said
--     "text fk to profiles.user_id"; activity precedent + spec language
--     "Schema mirrors activity-side" both call for UUID FK to id).
--   - essay_id is UUID FK → essays.id (build-sequence prose said "text
--     fk to essays.id"; essays.id is UUID per 2025-11-05_create_essay_system.sql,
--     and essay_understanding.essay_id already follows the UUID pattern).
-- =====================================================

-- =====================================================
-- 1. TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.essay_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  conversation_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- 'foundation' is the first improvementPhase per phaseAssessment;
  -- the Conversator's phase tracks the analysis-side phase, not
  -- activity-side's chat opening/middle/closing.
  phase TEXT NOT NULL DEFAULT 'foundation',
  total_turns INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  token_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Spec at §4.6: "one row per (essayId, profileId)". Encode as
  -- constraint to prevent UI bugs from creating duplicate active
  -- conversations per essay. Mirrors activity precedent's
  -- UNIQUE(profile_id, activity_id).
  UNIQUE (profile_id, essay_id)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

-- Composite index for finding conversations by user + essay (the primary
-- read path for the continuous-chat handler).
CREATE INDEX IF NOT EXISTS idx_essay_chat_conversations_profile_essay
  ON public.essay_chat_conversations(profile_id, essay_id);

-- Partial index for finding active conversations per user.
CREATE INDEX IF NOT EXISTS idx_essay_chat_conversations_active
  ON public.essay_chat_conversations(profile_id, is_active)
  WHERE is_active = true;

-- =====================================================
-- 3. UPDATED_AT TRIGGER
-- Re-uses the set_timestamp() function defined by 20260219000000_activity_profiles_and_chat.sql.
-- =====================================================

DO $$ BEGIN
  CREATE TRIGGER essay_chat_conversations_set_timestamp
  BEFORE UPDATE ON public.essay_chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- Pattern: profile_id IN (SELECT id FROM profiles WHERE user_id = jwt sub)
-- The (select ...) wrapper marks the auth lookup as InitPlan (per Supabase
-- Postgres best practices for performance — see activity precedent).
-- =====================================================

ALTER TABLE public.essay_chat_conversations ENABLE ROW LEVEL SECURITY;

-- Tenancy guard: profile_id AND essay_id must both belong to the caller.
-- The two-check shape closes a cross-tenant existence-oracle that would
-- otherwise let an attacker INSERT with their own profile_id but a
-- victim's essay_id (security review S2). The (select ...) wrapper marks
-- each subquery as InitPlan so it runs once per query, not per row.

CREATE POLICY "Clerk: Users can view own essay chat conversations" ON public.essay_chat_conversations
  FOR SELECT TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY "Clerk: Users can insert own essay chat conversations" ON public.essay_chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY "Clerk: Users can update own essay chat conversations" ON public.essay_chat_conversations
  FOR UPDATE TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  )
  WITH CHECK (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

CREATE POLICY "Clerk: Users can delete own essay chat conversations" ON public.essay_chat_conversations
  FOR DELETE TO authenticated
  USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    AND essay_id IN (
      SELECT e.id FROM public.essays e
      WHERE e.profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub'))
    )
  );

-- Service role bypass for Edge Functions / server-side admin client.
-- service_role has bypassrls so this policy is mostly cosmetic, but the
-- USING + WITH CHECK pair survives accidental bypassrls revocation
-- (security review B1).
CREATE POLICY "Service role full access - essay chat conversations" ON public.essay_chat_conversations
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 5. GRANTS
-- =====================================================

-- Defense-in-depth: explicit REVOKE of public/anon access. RLS already
-- enforces this, but encoding the deny explicitly survives schema-level
-- grant changes (security review S4).
REVOKE ALL ON public.essay_chat_conversations FROM PUBLIC;
REVOKE ALL ON public.essay_chat_conversations FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.essay_chat_conversations TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.essay_chat_conversations IS
  'Conversator chat session state per (essay, profile). conversation_state JSONB capped to 50 turns at the application layer. Spec: L5_E2E_INTEGRITY_AUDIT §4.6.';

COMMENT ON COLUMN public.essay_chat_conversations.conversation_state IS
  'Recent ConversatorSessionEntry[] (D-0.4). Capped client-side to ~50 turns. Full historical log derivable by reading multiple rows over time + the in-profile compact log.';

COMMENT ON COLUMN public.essay_chat_conversations.phase IS
  'Analysis-side improvementPhase the Conversator session is operating in. Default ''foundation'' per phaseAssessment first phase.';

COMMENT ON COLUMN public.essay_chat_conversations.token_usage IS
  'Cumulative LLM token usage for the session — { inputTokens, outputTokens, cacheReadTokens?, cacheWriteTokens?, costUsd }. Updated on each Conversator API call.';
