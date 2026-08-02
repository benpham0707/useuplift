-- Legacy projects created this shared timestamp trigger outside the recorded
-- migration ledger. Establish it here so an empty Git preview can replay the
-- cache migration faithfully.
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.portfolio_guidance_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  input_signature text NOT NULL,
  guidance_version integer NOT NULL,
  response jsonb NOT NULL,
  is_stale boolean NOT NULL DEFAULT false,
  cached_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_guidance_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portfolio_guidance_cache_select_own" ON public.portfolio_guidance_cache
  FOR SELECT TO authenticated
  USING (profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = (select auth.jwt() ->> 'sub')
  ));

CREATE POLICY "portfolio_guidance_cache_service_all" ON public.portfolio_guidance_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS portfolio_guidance_cache_set_timestamp ON public.portfolio_guidance_cache;
CREATE TRIGGER portfolio_guidance_cache_set_timestamp
  BEFORE UPDATE ON public.portfolio_guidance_cache
  FOR EACH ROW EXECUTE FUNCTION public.set_timestamp();
