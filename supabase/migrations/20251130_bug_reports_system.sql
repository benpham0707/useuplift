-- Bug Reports System
-- Allows users to quickly report bugs/errors for early production stage

-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reporter info
    user_id TEXT, -- Clerk user ID (nullable for unauthenticated reports)
    user_email TEXT,
    
    -- Bug details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- 'general', 'credit_issue', 'ui_bug', 'feature_broken', 'data_issue'
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    
    -- Context
    page_url TEXT,
    browser_info TEXT,
    screen_size TEXT,
    
    -- Credit compensation tracking
    credits_affected INTEGER,
    compensation_status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'compensated', 'declined'
    compensation_amount INTEGER,
    compensation_notes TEXT,
    
    -- Admin tracking
    status TEXT DEFAULT 'new', -- 'new', 'in_progress', 'resolved', 'closed', 'wont_fix'
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON public.bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_compensation_status ON public.bug_reports(compensation_status);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can insert their own bug reports
CREATE POLICY "Users can create bug reports"
    ON public.bug_reports
    FOR INSERT
    TO public
    WITH CHECK (true); -- Allow anyone (including anonymous) to submit bug reports

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
    ON public.bug_reports
    FOR SELECT
    TO public
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_bug_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bug_reports_updated_at ON public.bug_reports;
CREATE TRIGGER bug_reports_updated_at
    BEFORE UPDATE ON public.bug_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_bug_reports_updated_at();

-- Grant necessary permissions
GRANT INSERT, SELECT ON public.bug_reports TO anon;
GRANT INSERT, SELECT ON public.bug_reports TO authenticated;

