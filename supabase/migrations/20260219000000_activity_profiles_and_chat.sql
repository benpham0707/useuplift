-- =====================================================
-- ACTIVITY PROFILES & CHAT CONVERSATIONS MIGRATION
-- Phase 1: Database persistence for activity chat system
--
-- Creates two tables:
-- 1. activity_profiles — Rich structured data about each activity
-- 2. activity_chat_conversations — Conversation state for ongoing/resumable chats
--
-- Auth: Clerk JWT via auth.jwt() ->> 'sub', matching profiles.user_id
-- =====================================================

-- =====================================================
-- 1. ACTIVITY PROFILES TABLE
-- Stores the full ActivityProfile JSONB for each activity
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  activity_title TEXT NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}',
  data_completeness FLOAT DEFAULT 0,
  profile_version INT DEFAULT 1,
  description_hash TEXT,  -- hash of description when profile was last built
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, activity_id)
);

-- =====================================================
-- 2. ACTIVITY CHAT CONVERSATIONS TABLE
-- Stores conversation state for ongoing/resumable chats
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  conversation_state JSONB NOT NULL DEFAULT '{}',
  phase TEXT NOT NULL DEFAULT 'opening',
  total_turns INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  token_usage JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- activity_profiles: profile_id index for listing all profiles for a user
CREATE INDEX IF NOT EXISTS idx_activity_profiles_profile_id
  ON public.activity_profiles(profile_id);

-- activity_chat_conversations: composite index for finding conversations by user + activity
CREATE INDEX IF NOT EXISTS idx_activity_chat_conversations_profile_activity
  ON public.activity_chat_conversations(profile_id, activity_id);

-- activity_chat_conversations: partial index for finding active conversations
CREATE INDEX IF NOT EXISTS idx_activity_chat_conversations_active
  ON public.activity_chat_conversations(is_active)
  WHERE is_active = true;

-- =====================================================
-- 4. UPDATED_AT TRIGGERS
-- Re-use existing set_timestamp() or update_updated_at_column() function
-- =====================================================

-- Ensure the trigger function exists (safe to re-create)
CREATE OR REPLACE FUNCTION public.set_timestamp() RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$ BEGIN
  CREATE TRIGGER activity_profiles_set_timestamp
  BEFORE UPDATE ON public.activity_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER activity_chat_conversations_set_timestamp
  BEFORE UPDATE ON public.activity_chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- Pattern: profile_id IN (SELECT id FROM profiles WHERE user_id = jwt sub)
-- =====================================================

ALTER TABLE public.activity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_chat_conversations ENABLE ROW LEVEL SECURITY;

-- ----- activity_profiles RLS -----

CREATE POLICY "Clerk: Users can view own activity profiles" ON public.activity_profiles
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can insert own activity profiles" ON public.activity_profiles
  FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can update own activity profiles" ON public.activity_profiles
  FOR UPDATE TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can delete own activity profiles" ON public.activity_profiles
  FOR DELETE TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- ----- activity_chat_conversations RLS -----

CREATE POLICY "Clerk: Users can view own activity chat conversations" ON public.activity_chat_conversations
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can insert own activity chat conversations" ON public.activity_chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can update own activity chat conversations" ON public.activity_chat_conversations
  FOR UPDATE TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

CREATE POLICY "Clerk: Users can delete own activity chat conversations" ON public.activity_chat_conversations
  FOR DELETE TO authenticated
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')));

-- ----- Service role bypass (for Edge Functions / server-side) -----

CREATE POLICY "Service role full access - activity profiles" ON public.activity_profiles
  FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access - activity chat conversations" ON public.activity_chat_conversations
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 6. GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_chat_conversations TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- - activity_profiles table with JSONB profile data
-- - activity_chat_conversations table with JSONB conversation state
-- - Composite unique constraint on (profile_id, activity_id) for profiles
-- - Indexes for efficient lookups
-- - updated_at triggers for automatic timestamp management
-- - Clerk-compatible RLS policies (auth.jwt() ->> 'sub')
-- - Service role bypass for server-side operations
-- =====================================================
