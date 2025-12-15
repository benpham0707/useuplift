-- =====================================================
-- FRAUD FLAGS TABLE - ZERO TOLERANCE FOR DUPLICATES
-- Tracks accounts flagged for fraud review
-- =====================================================

CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,

  -- Flag details
  flag_reason TEXT NOT NULL, -- 'duplicate_essay', 'multiple_devices', 'ip_abuse', etc.
  flag_severity TEXT NOT NULL DEFAULT 'high', -- 'low', 'medium', 'high', 'critical'

  -- Evidence
  evidence JSONB, -- Store details about the fraud
  essay_hash TEXT, -- If duplicate essay, store the hash

  -- Status
  status TEXT NOT NULL DEFAULT 'flagged', -- 'flagged', 'under_review', 'cleared', 'banned'
  is_banned BOOLEAN DEFAULT FALSE,

  -- Timestamps
  flagged_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT, -- Admin user ID

  -- Actions taken
  actions_blocked INTEGER DEFAULT 0, -- Count of blocked actions
  last_blocked_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_fraud_flags_user
  ON fraud_flags(user_id);

-- Index for active flags
CREATE INDEX IF NOT EXISTS idx_fraud_flags_active
  ON fraud_flags(status)
  WHERE status IN ('flagged', 'under_review');

-- Index for banned users
CREATE INDEX IF NOT EXISTS idx_fraud_flags_banned
  ON fraud_flags(is_banned)
  WHERE is_banned = TRUE;

-- =====================================================
-- FUNCTION: Check if user is flagged/banned
-- =====================================================

CREATE OR REPLACE FUNCTION is_user_flagged(check_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_flagged BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM fraud_flags
    WHERE user_id = check_user_id
      AND status IN ('flagged', 'under_review', 'banned')
  ) INTO user_flagged;

  RETURN user_flagged;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: Check if user is banned
-- =====================================================

CREATE OR REPLACE FUNCTION is_user_banned(check_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_banned BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM fraud_flags
    WHERE user_id = check_user_id
      AND is_banned = TRUE
  ) INTO user_banned;

  RETURN user_banned;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCTION: Flag user for fraud
-- =====================================================

CREATE OR REPLACE FUNCTION flag_user_for_fraud(
  check_user_id TEXT,
  reason TEXT,
  severity TEXT DEFAULT 'high',
  evidence_data JSONB DEFAULT NULL,
  essay_hash_val TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO fraud_flags (
    user_id,
    flag_reason,
    flag_severity,
    evidence,
    essay_hash,
    status,
    is_banned
  )
  VALUES (
    check_user_id,
    reason,
    severity,
    evidence_data,
    essay_hash_val,
    'flagged',
    FALSE
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    flag_reason = EXCLUDED.flag_reason,
    flag_severity = EXCLUDED.flag_severity,
    evidence = EXCLUDED.evidence,
    essay_hash = COALESCE(EXCLUDED.essay_hash, fraud_flags.essay_hash),
    flagged_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Record blocked action
-- =====================================================

CREATE OR REPLACE FUNCTION record_blocked_action(check_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE fraud_flags
  SET
    actions_blocked = actions_blocked + 1,
    last_blocked_at = NOW()
  WHERE user_id = check_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;

-- Service role can access all data
CREATE POLICY "Service role full access - fraud flags"
  ON fraud_flags
  FOR ALL
  USING (auth.role() = 'service_role');

-- Users can only see if they are flagged (not details)
CREATE POLICY "Users can check own flag status"
  ON fraud_flags
  FOR SELECT
  USING (auth.uid()::TEXT = user_id);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON fraud_flags TO authenticated;
GRANT ALL ON fraud_flags TO service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Summary:
-- - fraud_flags table for tracking flagged accounts
-- - Functions for checking flag/ban status
-- - Function for flagging users
-- - Function for recording blocked actions
-- - Zero tolerance: Any duplicate essay = immediate flag
-- =====================================================
