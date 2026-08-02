

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "public"."achievement_impact" AS ENUM (
    'low',
    'medium',
    'high',
    'exceptional'
);


ALTER TYPE "public"."achievement_impact" OWNER TO "postgres";


CREATE TYPE "public"."achievement_scope" AS ENUM (
    'school',
    'local',
    'regional',
    'state',
    'national',
    'international'
);


ALTER TYPE "public"."achievement_scope" OWNER TO "postgres";


CREATE TYPE "public"."achievement_type" AS ENUM (
    'academic',
    'athletic',
    'artistic',
    'leadership',
    'service',
    'technical',
    'entrepreneurial',
    'competition',
    'certification',
    'publication',
    'personal'
);


ALTER TYPE "public"."achievement_type" OWNER TO "postgres";


CREATE TYPE "public"."analysis_depth" AS ENUM (
    'quick',
    'standard',
    'comprehensive'
);


ALTER TYPE "public"."analysis_depth" OWNER TO "postgres";


CREATE TYPE "public"."application_stage" AS ENUM (
    'exploring',
    'mid_application',
    'almost_done'
);


ALTER TYPE "public"."application_stage" OWNER TO "postgres";


CREATE TYPE "public"."course_level" AS ENUM (
    'regular',
    'honors',
    'ap',
    'ib',
    'dual_enrollment',
    'college'
);


ALTER TYPE "public"."course_level" OWNER TO "postgres";


CREATE TYPE "public"."essay_type" AS ENUM (
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


ALTER TYPE "public"."essay_type" OWNER TO "postgres";


CREATE TYPE "public"."experience_type" AS ENUM (
    'work',
    'internship',
    'volunteer',
    'leadership',
    'project',
    'research',
    'creative',
    'athletic',
    'entrepreneurial',
    'caregiving',
    'self_directed'
);


ALTER TYPE "public"."experience_type" OWNER TO "postgres";


CREATE TYPE "public"."gpa_scale" AS ENUM (
    '4.0',
    '5.0',
    '100',
    'international'
);


ALTER TYPE "public"."gpa_scale" OWNER TO "postgres";


CREATE TYPE "public"."impression_label" AS ENUM (
    'arresting_deeply_human',
    'compelling_clear_voice',
    'competent_needs_texture',
    'readable_but_generic',
    'template_like_rebuild'
);


ALTER TYPE "public"."impression_label" OWNER TO "postgres";


CREATE TYPE "public"."profile_status" AS ENUM (
    'initial',
    'basic_complete',
    'enriched',
    'verified',
    'archived'
);


ALTER TYPE "public"."profile_status" OWNER TO "postgres";


CREATE TYPE "public"."time_commitment" AS ENUM (
    'minimal',
    'part_time',
    'significant',
    'full_time'
);


ALTER TYPE "public"."time_commitment" OWNER TO "postgres";


CREATE TYPE "public"."user_context" AS ENUM (
    'high_school_9th',
    'high_school_10th',
    'high_school_11th',
    'high_school_12th',
    'gap_year',
    'college_freshman',
    'college_sophomore',
    'college_junior',
    'college_senior'
);


ALTER TYPE "public"."user_context" OWNER TO "postgres";


CREATE TYPE "public"."version_source_type" AS ENUM (
    'autosave',
    'milestone',
    'analysis'
);


ALTER TYPE "public"."version_source_type" OWNER TO "postgres";


CREATE TYPE "public"."voice_style" AS ENUM (
    'concise_operator',
    'warm_reflective',
    'understated'
);


ALTER TYPE "public"."voice_style" OWNER TO "postgres";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "public"."achievements_update_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  txt text;
begin
  txt := coalesce(new.title,'') || ' ' ||
         coalesce(new.organization,'') || ' ' ||
         coalesce(new.description,'');
  new.search_vector := to_tsvector('english', txt);
  return new;
end$$;


ALTER FUNCTION "public"."achievements_update_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_fraud_risk"("check_user_id" "text") RETURNS numeric
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  risk NUMERIC := 0.00;
  user_ip INET;
  user_device TEXT;
  ip_count INTEGER;
  device_count INTEGER;
  essay_count INTEGER;
  shared_ip BOOLEAN;
BEGIN
  -- Get user's IP
  SELECT ip_address INTO user_ip
  FROM ip_usage_tracking
  WHERE user_id = check_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get user's device fingerprint
  SELECT fingerprint_hash INTO user_device
  FROM device_fingerprints
  WHERE user_id = check_user_id
  ORDER BY last_seen DESC
  LIMIT 1;

  -- Check if IP is shared (school/library)
  IF user_ip IS NOT NULL THEN
    shared_ip := is_shared_ip(user_ip);

    -- IP risk: +0.3 if multiple accounts from same IP (and not shared)
    IF NOT shared_ip THEN
      SELECT COUNT(DISTINCT user_id) INTO ip_count
      FROM ip_usage_tracking
      WHERE ip_address = user_ip;

      IF ip_count > 1 THEN
        risk := risk + 0.3;
      END IF;
    END IF;
  END IF;

  -- Device risk: +0.4 if multiple accounts on same device
  IF user_device IS NOT NULL THEN
    SELECT COUNT(DISTINCT user_id) INTO device_count
    FROM device_fingerprints
    WHERE fingerprint_hash = user_device;

    IF device_count > 1 THEN
      risk := risk + 0.4;
    END IF;
  END IF;

  -- Essay duplication risk: +0.4 if essays duplicated
  SELECT COUNT(*) INTO essay_count
  FROM essay_analyses ea
  WHERE ea.user_id = check_user_id
    AND EXISTS (
      SELECT 1 FROM essay_duplicates ed
      WHERE ed.essay_hash = ea.essay_hash
        AND ed.account_count > 1
    );

  IF essay_count > 0 THEN
    risk := risk + 0.4;
  END IF;

  -- Cap at 1.0
  RETURN LEAST(risk, 1.0);
END;
$$;


ALTER FUNCTION "public"."calculate_fraud_risk"("check_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_ip_signups"("check_ip" "inet") RETURNS integer
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  signup_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO signup_count
  FROM ip_usage_tracking
  WHERE ip_address = check_ip
    AND created_at >= NOW() - INTERVAL '30 days';

  RETURN signup_count;
END;
$$;


ALTER FUNCTION "public"."count_ip_signups"("check_ip" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_clerk_user_id"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    RETURN (select auth.jwt() ->> 'sub');
END;
$$;


ALTER FUNCTION "public"."current_clerk_user_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_clerk_user_id"() IS 'Helper function to get the current Clerk user ID from JWT. Use this in application code instead of repeatedly calling auth.jwt() ->> ''sub''';



CREATE OR REPLACE FUNCTION "public"."deduct_credits"("p_amount" integer, "p_type" "text", "p_description" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_caller  text := (auth.jwt() ->> 'sub');
  v_balance integer;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'deduct_credits: no authenticated caller';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'deduct_credits: amount must be a positive integer (got %)', p_amount;
  END IF;

  UPDATE public.profiles
     SET credits = credits - p_amount
   WHERE user_id = v_caller
     AND credits >= p_amount
  RETURNING credits INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'deduct_credits: insufficient credits' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (v_caller, -p_amount, p_type, p_description);

  RETURN v_balance;
END;
$$;


ALTER FUNCTION "public"."deduct_credits"("p_amount" integer, "p_type" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."experiences_set_is_ongoing"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.is_ongoing := (new.end_date is null);
  return new;
end$$;


ALTER FUNCTION "public"."experiences_set_is_ongoing"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."experiences_update_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  txt text;
begin
  txt := coalesce(new.title,'') || ' ' ||
         coalesce(new.organization,'') || ' ' ||
         coalesce(new.description,'');
  new.search_vector := to_tsvector('english', txt);
  return new;
end$$;


ALTER FUNCTION "public"."experiences_update_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."flag_user_for_fraud"("check_user_id" "text", "reason" "text", "severity" "text" DEFAULT 'high'::"text", "evidence_data" "jsonb" DEFAULT NULL::"jsonb", "essay_hash_val" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."flag_user_for_fraud"("check_user_id" "text", "reason" "text", "severity" "text", "evidence_data" "jsonb", "essay_hash_val" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_referral_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude ambiguous chars
  result text := '';
  i integer;
  code_exists boolean := true;
BEGIN
  WHILE code_exists LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM public.referral_codes WHERE code = result
    ) INTO code_exists;
  END LOOP;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_referral_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, user_context)
  VALUES (NEW.id, 'high_school_11th');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_essay_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.draft_current IS DISTINCT FROM OLD.draft_current THEN
    NEW.version = OLD.version + 1;
    -- Note: Revision history entries are now created explicitly by the application
    -- via saveAutosaveVersion, saveMilestoneVersion, or saveAnalysisVersion
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_essay_version"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_shared_ip"("check_ip" "inet") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  unique_user_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO unique_user_count
  FROM ip_usage_tracking
  WHERE ip_address = check_ip
    AND created_at >= NOW() - INTERVAL '7 days';

  RETURN unique_user_count > 15;
END;
$$;


ALTER FUNCTION "public"."is_shared_ip"("check_ip" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_banned"("check_user_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."is_user_banned"("check_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_flagged"("check_user_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."is_user_flagged"("check_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_rag_fragments"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 10, "filter_essay_type" "text" DEFAULT NULL::"text", "filter_dimension" "text" DEFAULT NULL::"text", "filter_technique" "text" DEFAULT NULL::"text", "filter_quality_tier" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "content" "text", "essay_type" "text", "prompt_type" "text", "dimension" "text", "quality_tier" "text", "college" "text", "technique" "text", "why_it_works" "text", "transferable_principle" "text", "source_info" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.content,
    f.essay_type,
    f.prompt_type,
    f.dimension,
    f.quality_tier,
    f.college,
    f.technique,
    f.why_it_works,
    f.transferable_principle,
    f.source_info,
    1 - (f.embedding <=> query_embedding) AS similarity
  FROM rag_essay_fragments f
  WHERE
    f.embedding IS NOT NULL
    AND 1 - (f.embedding <=> query_embedding) > match_threshold
    AND (filter_essay_type IS NULL OR f.essay_type = filter_essay_type)
    AND (filter_dimension IS NULL OR f.dimension = filter_dimension)
    AND (filter_technique IS NULL OR f.technique = filter_technique)
    AND (filter_quality_tier IS NULL OR f.quality_tier = filter_quality_tier)
  ORDER BY f.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_rag_fragments"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_essay_type" "text", "filter_dimension" "text", "filter_technique" "text", "filter_quality_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_rag_transformations"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.5, "match_count" integer DEFAULT 10, "filter_essay_type" "text" DEFAULT NULL::"text", "filter_dimension" "text" DEFAULT NULL::"text", "filter_technique" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "before_text" "text", "after_text" "text", "dimension" "text", "technique" "text", "essay_type" "text", "why_it_works" "text", "principle" "text", "effectiveness_score" double precision, "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.before_text,
    t.after_text,
    t.dimension,
    t.technique,
    t.essay_type,
    t.why_it_works,
    t.principle,
    t.effectiveness_score,
    1 - (t.before_embedding <=> query_embedding) AS similarity
  FROM rag_transformations t
  WHERE
    t.before_embedding IS NOT NULL
    AND 1 - (t.before_embedding <=> query_embedding) > match_threshold
    AND (filter_essay_type IS NULL OR t.essay_type = filter_essay_type)
    AND (filter_dimension IS NULL OR t.dimension = filter_dimension)
    AND (filter_technique IS NULL OR t.technique = filter_technique)
  ORDER BY t.before_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_rag_transformations"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_essay_type" "text", "filter_dimension" "text", "filter_technique" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."personal_growth_set_tsv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.search_vector := to_tsvector(
    'english',
    coalesce(new.meaningful_experiences::text, '') || ' ' || coalesce(new.additional_context::text, '')
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."personal_growth_set_tsv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."profiles_update_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  txt text;
begin
  txt := coalesce(new.narrative_summary,'') || ' ' ||
         coalesce(array_to_string(new.hidden_strengths,' '),'');
  new.search_vector := to_tsvector('english', txt);
  return new;
end$$;


ALTER FUNCTION "public"."profiles_update_search"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_completion_score"("p_profile_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  v_score numeric := 0.00;
  v_profile_row profiles%ROWTYPE;
  v_experiences_row experiences_activities%ROWTYPE;
  v_academic_row academic_journey%ROWTYPE;
  v_goals_row goals_aspirations%ROWTYPE;
  v_personal_info_row personal_information%ROWTYPE;
  v_family_row family_responsibilities%ROWTYPE;
  v_support_row support_network%ROWTYPE;
  v_growth_row personal_growth%ROWTYPE;
  v_activity_count integer := 0;
BEGIN
  -- Fetch profile data
  SELECT * INTO v_profile_row FROM profiles WHERE id = p_profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_profile_id;
  END IF;

  -- 1. Quick Start (0.10): profiles.onboarding_completed = true
  IF v_profile_row.onboarding_completed = true THEN
    v_score := v_score + 0.10;
  END IF;

  -- 2. Activities (0.25): experiences_activities with ≥2 total entries
  SELECT * INTO v_experiences_row 
  FROM experiences_activities 
  WHERE profile_id = p_profile_id;
  
  IF FOUND THEN
    -- Count total entries across all activity arrays
    v_activity_count := 0;
    
    IF v_experiences_row.work_experiences IS NOT NULL AND jsonb_typeof(v_experiences_row.work_experiences) = 'array' THEN
      v_activity_count := v_activity_count + jsonb_array_length(v_experiences_row.work_experiences);
    END IF;
    
    IF v_experiences_row.volunteer_service IS NOT NULL AND jsonb_typeof(v_experiences_row.volunteer_service) = 'array' THEN
      v_activity_count := v_activity_count + jsonb_array_length(v_experiences_row.volunteer_service);
    END IF;
    
    IF v_experiences_row.extracurriculars IS NOT NULL AND jsonb_typeof(v_experiences_row.extracurriculars) = 'array' THEN
      v_activity_count := v_activity_count + jsonb_array_length(v_experiences_row.extracurriculars);
    END IF;
    
    IF v_experiences_row.personal_projects IS NOT NULL AND jsonb_typeof(v_experiences_row.personal_projects) = 'array' THEN
      v_activity_count := v_activity_count + jsonb_array_length(v_experiences_row.personal_projects);
    END IF;
    
    IF v_experiences_row.leadership_roles IS NOT NULL AND jsonb_typeof(v_experiences_row.leadership_roles) = 'array' THEN
      v_activity_count := v_activity_count + jsonb_array_length(v_experiences_row.leadership_roles);
    END IF;
    
    IF v_experiences_row.academic_honors IS NOT NULL AND jsonb_typeof(v_experiences_row.academic_honors) = 'array' THEN
      v_activity_count := v_activity_count + jsonb_array_length(v_experiences_row.academic_honors);
    END IF;
    
    IF v_experiences_row.formal_recognition IS NOT NULL AND jsonb_typeof(v_experiences_row.formal_recognition) = 'array' THEN
      v_activity_count := v_activity_count + jsonb_array_length(v_experiences_row.formal_recognition);
    END IF;
    
    IF v_activity_count >= 2 THEN
      v_score := v_score + 0.25;
    END IF;
  END IF;

  -- 3. Academic (0.20): academic_journey.gpa IS NOT NULL
  SELECT * INTO v_academic_row 
  FROM academic_journey 
  WHERE profile_id = p_profile_id;
  
  IF FOUND AND v_academic_row.gpa IS NOT NULL THEN
    v_score := v_score + 0.20;
  END IF;

  -- 4. Goals (0.15): goals_aspirations with intended_major OR career_interests
  SELECT * INTO v_goals_row 
  FROM goals_aspirations 
  WHERE profile_id = p_profile_id;
  
  IF FOUND THEN
    IF v_goals_row.intended_major IS NOT NULL OR 
       (v_goals_row.career_interests IS NOT NULL AND 
        array_length(v_goals_row.career_interests, 1) > 0) THEN
      v_score := v_score + 0.15;
    END IF;
  END IF;

  -- 5. Identity (0.10): personal_information with first_name AND last_name
  SELECT * INTO v_personal_info_row 
  FROM personal_information 
  WHERE profile_id = p_profile_id;
  
  IF FOUND AND 
     v_personal_info_row.first_name IS NOT NULL AND 
     v_personal_info_row.last_name IS NOT NULL THEN
    v_score := v_score + 0.10;
  END IF;

  -- 6. Family (0.05): family_responsibilities row exists
  SELECT * INTO v_family_row 
  FROM family_responsibilities 
  WHERE profile_id = p_profile_id;
  
  IF FOUND THEN
    v_score := v_score + 0.05;
  END IF;

  -- 7. Support (0.05): support_network row exists
  SELECT * INTO v_support_row 
  FROM support_network 
  WHERE profile_id = p_profile_id;
  
  IF FOUND THEN
    v_score := v_score + 0.05;
  END IF;

  -- 8. Growth (0.10): personal_growth with non-empty meaningful_experiences
  SELECT * INTO v_growth_row 
  FROM personal_growth 
  WHERE profile_id = p_profile_id;
  
  IF FOUND AND 
     v_growth_row.meaningful_experiences IS NOT NULL AND
     jsonb_typeof(v_growth_row.meaningful_experiences) = 'object' AND
     (SELECT count(*) FROM jsonb_object_keys(v_growth_row.meaningful_experiences)) > 0 THEN
    v_score := v_score + 0.10;
  END IF;

  -- Update the profiles table with the calculated score
  UPDATE profiles 
  SET completion_score = v_score,
      updated_at = now()
  WHERE id = p_profile_id;

  -- Return the calculated score
  RETURN v_score;
END;
$$;


ALTER FUNCTION "public"."recalculate_completion_score"("p_profile_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."recalculate_completion_score"("p_profile_id" "uuid") IS 'Calculates profile completion score based on 8 weighted sections:
1. Quick Start (0.10) - onboarding_completed
2. Activities (0.25) - ≥2 activity entries
3. Academic (0.20) - GPA filled
4. Goals (0.15) - major or career interests
5. Identity (0.10) - first & last name
6. Family (0.05) - row exists
7. Support (0.05) - row exists
8. Growth (0.10) - non-empty meaningful_experiences
Updates profiles.completion_score and returns the score (0.00-1.00)';



CREATE OR REPLACE FUNCTION "public"."record_blocked_action"("check_user_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE fraud_flags
  SET
    actions_blocked = actions_blocked + 1,
    last_blocked_at = NOW()
  WHERE user_id = check_user_id;
END;
$$;


ALTER FUNCTION "public"."record_blocked_action"("check_user_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_bug_reports_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_bug_reports_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_essays_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_essays_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_fraud_risk"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO fraud_risk_scores (user_id, risk_score, last_updated)
  VALUES (NEW.user_id, calculate_fraud_risk(NEW.user_id), NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    risk_score = calculate_fraud_risk(NEW.user_id),
    last_updated = NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_fraud_risk"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_achievement_date"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.date_received > current_date then
    raise exception 'date_received cannot be in the future';
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."validate_achievement_date"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_experience_dates"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.start_date > coalesce(new.end_date, current_date) then
    raise exception 'start_date cannot be after end_date/current_date';
  end if;
  return new;
end$$;


ALTER FUNCTION "public"."validate_experience_dates"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."allow_only_operation"("expected_operation" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION "storage"."allow_only_operation"("expected_operation" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text", "sort_order" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."protect_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."protect_delete"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."academic_journey" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "current_school" "jsonb" DEFAULT '{}'::"jsonb",
    "current_grade" "text",
    "expected_grad_date" "date",
    "gpa" numeric,
    "gpa_scale" "text",
    "gpa_type" "text",
    "class_rank" "text",
    "class_size" integer,
    "other_schools" "jsonb" DEFAULT '{}'::"jsonb",
    "course_history" "jsonb" DEFAULT '[]'::"jsonb",
    "college_courses" "jsonb" DEFAULT '[]'::"jsonb",
    "standardized_tests" "jsonb" DEFAULT '{}'::"jsonb",
    "ap_exams" "jsonb" DEFAULT '[]'::"jsonb",
    "ib_exams" "jsonb" DEFAULT '[]'::"jsonb",
    "english_proficiency" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "will_graduate_from_school" boolean DEFAULT false NOT NULL,
    "is_boarding_school" boolean DEFAULT false NOT NULL,
    "studied_abroad" boolean DEFAULT false NOT NULL,
    "homeschooled" boolean DEFAULT false NOT NULL,
    "took_math_early" boolean DEFAULT false NOT NULL,
    "took_language_early" boolean DEFAULT false NOT NULL,
    "report_test_scores" boolean DEFAULT false NOT NULL,
    "taking_ap_exams" boolean DEFAULT false NOT NULL,
    "in_ib_programme" boolean DEFAULT false NOT NULL,
    "need_english_proficiency" boolean DEFAULT false NOT NULL,
    "rank_reporting_method" "text",
    "gpa_range" "text",
    CONSTRAINT "academic_journey_rank_reporting_method_chk" CHECK ((("rank_reporting_method" IS NULL) OR ("rank_reporting_method" = ANY (ARRAY['exact'::"text", 'decile'::"text", 'quartile'::"text", 'quintile'::"text", 'none'::"text"]))))
);


ALTER TABLE "public"."academic_journey" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_chat_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "activity_id" "text" NOT NULL,
    "conversation_state" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "phase" "text" DEFAULT 'opening'::"text" NOT NULL,
    "total_turns" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "token_usage" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_chat_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "activity_id" "text" NOT NULL,
    "activity_title" "text" NOT NULL,
    "profile_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "data_completeness" double precision DEFAULT 0,
    "profile_version" integer DEFAULT 1,
    "description_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bug_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "user_email" "text",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "severity" "text" DEFAULT 'medium'::"text",
    "page_url" "text",
    "browser_info" "text",
    "screen_size" "text",
    "credits_affected" integer,
    "compensation_status" "text" DEFAULT 'pending'::"text",
    "compensation_amount" integer,
    "compensation_notes" "text",
    "status" "text" DEFAULT 'new'::"text",
    "admin_notes" "text",
    "resolved_at" timestamp with time zone,
    "resolved_by" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bug_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."character_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "narrative_score" integer DEFAULT 50 NOT NULL,
    "impact_score" integer DEFAULT 50 NOT NULL,
    "academics_score" integer DEFAULT 50 NOT NULL,
    "curiosity_score" integer DEFAULT 50 NOT NULL,
    "network_score" integer DEFAULT 50 NOT NULL,
    "narrative_prev" integer DEFAULT 50 NOT NULL,
    "impact_prev" integer DEFAULT 50 NOT NULL,
    "academics_prev" integer DEFAULT 50 NOT NULL,
    "curiosity_prev" integer DEFAULT 50 NOT NULL,
    "network_prev" integer DEFAULT 50 NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "xp" integer DEFAULT 0 NOT NULL,
    "title" "text" DEFAULT 'Freshman Explorer'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "character_stats_academics_score_check" CHECK ((("academics_score" >= 0) AND ("academics_score" <= 100))),
    CONSTRAINT "character_stats_curiosity_score_check" CHECK ((("curiosity_score" >= 0) AND ("curiosity_score" <= 100))),
    CONSTRAINT "character_stats_impact_score_check" CHECK ((("impact_score" >= 0) AND ("impact_score" <= 100))),
    CONSTRAINT "character_stats_narrative_score_check" CHECK ((("narrative_score" >= 0) AND ("narrative_score" <= 100))),
    CONSTRAINT "character_stats_network_score_check" CHECK ((("network_score" >= 0) AND ("network_score" <= 100)))
);


ALTER TABLE "public"."character_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cip_interest_mapping" (
    "cip_code" "text" NOT NULL,
    "cip_title" "text" NOT NULL,
    "interest_tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."cip_interest_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."college_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text",
    "college_id" "uuid" NOT NULL,
    "report_type" "text" NOT NULL,
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved_at" timestamp with time zone,
    CONSTRAINT "college_reports_report_type_check" CHECK (("report_type" = ANY (ARRAY['incorrect_stat'::"text", 'outdated_info'::"text", 'missing_program'::"text", 'other'::"text"]))),
    CONSTRAINT "college_reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'fixed'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."college_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."colleges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "region" "text" NOT NULL,
    "campus_setting" "text",
    "type" "text" NOT NULL,
    "size" "text",
    "enrollment_size" integer,
    "acceptance_rate" numeric,
    "avg_gpa_min" numeric,
    "avg_gpa_max" numeric,
    "avg_sat_min" integer,
    "avg_sat_max" integer,
    "avg_act_min" integer,
    "avg_act_max" integer,
    "tuition_in_state" integer,
    "tuition_out_of_state" integer,
    "financial_aid_percentage" numeric,
    "website_url" "text",
    "logo_url" "text",
    "image_url" "text",
    "primary_color" "text",
    "secondary_color" "text",
    "popular_majors" "jsonb" DEFAULT '[]'::"jsonb",
    "program_strengths" "jsonb" DEFAULT '[]'::"jsonb",
    "interest_tags" "jsonb" DEFAULT '[]'::"jsonb",
    "student_demographics" "jsonb" DEFAULT '{}'::"jsonb",
    "application_deadlines" "jsonb" DEFAULT '{}'::"jsonb",
    "required_materials" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "scorecard_id" integer,
    "unitid" integer,
    "opeid" "text",
    "zip_code" "text",
    "latitude" numeric,
    "longitude" numeric,
    "school_type" "text",
    "setting" "text",
    "size_category" "text",
    "undergrad_enrollment" integer,
    "total_enrollment" integer,
    "designations" "jsonb" DEFAULT '{}'::"jsonb",
    "sat_reading_25" integer,
    "sat_reading_75" integer,
    "sat_math_25" integer,
    "sat_math_75" integer,
    "sat_total_25" integer,
    "sat_total_75" integer,
    "act_25" integer,
    "act_75" integer,
    "cost_of_attendance" integer,
    "net_price_average" integer,
    "pell_grant_rate" numeric,
    "graduation_rate" numeric,
    "retention_rate" numeric,
    "median_earnings_10yr" integer,
    "first_gen_pct" numeric,
    "demographics" "jsonb" DEFAULT '{}'::"jsonb",
    "program_breakdown" "jsonb" DEFAULT '{}'::"jsonb",
    "data_year" integer,
    "last_synced_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "colleges_acceptance_rate_check" CHECK ((("acceptance_rate" >= (0)::numeric) AND ("acceptance_rate" <= (100)::numeric))),
    CONSTRAINT "colleges_avg_act_max_check" CHECK ((("avg_act_max" >= 1) AND ("avg_act_max" <= 36))),
    CONSTRAINT "colleges_avg_act_min_check" CHECK ((("avg_act_min" >= 1) AND ("avg_act_min" <= 36))),
    CONSTRAINT "colleges_avg_gpa_max_check" CHECK ((("avg_gpa_max" >= (0)::numeric) AND ("avg_gpa_max" <= 4.0))),
    CONSTRAINT "colleges_avg_gpa_min_check" CHECK ((("avg_gpa_min" >= (0)::numeric) AND ("avg_gpa_min" <= 4.0))),
    CONSTRAINT "colleges_avg_sat_max_check" CHECK ((("avg_sat_max" >= 400) AND ("avg_sat_max" <= 1600))),
    CONSTRAINT "colleges_avg_sat_min_check" CHECK ((("avg_sat_min" >= 400) AND ("avg_sat_min" <= 1600))),
    CONSTRAINT "colleges_campus_setting_check" CHECK (("campus_setting" = ANY (ARRAY['urban'::"text", 'suburban'::"text", 'rural'::"text"]))),
    CONSTRAINT "colleges_region_check" CHECK (("region" = ANY (ARRAY['West'::"text", 'Northeast'::"text", 'South'::"text", 'Midwest'::"text"]))),
    CONSTRAINT "colleges_school_type_check" CHECK (("school_type" = ANY (ARRAY['four_year'::"text", 'two_year'::"text", 'less_than_two_year'::"text"]))),
    CONSTRAINT "colleges_setting_check" CHECK (("setting" = ANY (ARRAY['urban'::"text", 'suburban'::"text", 'town'::"text", 'rural'::"text"]))),
    CONSTRAINT "colleges_size_category_check" CHECK (("size_category" = ANY (ARRAY['very_small'::"text", 'small'::"text", 'medium'::"text", 'large'::"text", 'very_large'::"text"]))),
    CONSTRAINT "colleges_size_check" CHECK (("size" = ANY (ARRAY['small'::"text", 'medium'::"text", 'large'::"text"]))),
    CONSTRAINT "colleges_type_check" CHECK (("type" = ANY (ARRAY['public'::"text", 'private'::"text", 'community'::"text", 'private_nonprofit'::"text", 'private_for_profit'::"text"])))
);


ALTER TABLE "public"."colleges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "amount" integer NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "stripe_payment_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "idempotency_key" "text",
    CONSTRAINT "credit_transactions_type_check" CHECK (("type" = ANY (ARRAY['subscription_grant'::"text", 'addon_purchase'::"text", 'usage'::"text", 'bonus'::"text"])))
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_quests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "quest_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "quests" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "completed_count" integer DEFAULT 0 NOT NULL,
    "credits_earned" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."daily_quests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "event_date" timestamp with time zone NOT NULL,
    "event_type" "text" NOT NULL,
    "urgency" "text" DEFAULT 'upcoming'::"text" NOT NULL,
    "related_link" "text",
    "description" "text",
    "is_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "dashboard_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['deadline'::"text", 'milestone'::"text", 'appointment'::"text", 'reminder'::"text"]))),
    CONSTRAINT "dashboard_events_urgency_check" CHECK (("urgency" = ANY (ARRAY['overdue'::"text", 'today'::"text", 'this_week'::"text", 'upcoming'::"text"])))
);


ALTER TABLE "public"."dashboard_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."device_fingerprints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "fingerprint_hash" "text" NOT NULL,
    "user_agent" "text",
    "screen_resolution" "text",
    "timezone" "text",
    "canvas_hash" "text",
    "webgl_hash" "text",
    "audio_hash" "text",
    "first_seen" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."device_fingerprints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "ua" "text",
    "os" "text",
    "browser" "text",
    "ip_hash" "text",
    "country" "text",
    "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."essay_analyses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "essay_hash" "text" NOT NULL,
    "full_text_length" integer,
    "prompt_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."essay_analyses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."essay_analysis_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "essay_id" "uuid" NOT NULL,
    "rubric_version" "text" DEFAULT 'v1.0.0'::"text" NOT NULL,
    "analysis_depth" "public"."analysis_depth" DEFAULT 'standard'::"public"."analysis_depth" NOT NULL,
    "essay_quality_index" numeric(5,2) NOT NULL,
    "impression_label" "public"."impression_label" NOT NULL,
    "dimension_scores" "jsonb" NOT NULL,
    "weights" "jsonb" NOT NULL,
    "flags" "text"[] DEFAULT '{}'::"text"[],
    "prioritized_levers" "text"[] DEFAULT '{}'::"text"[],
    "elite_pattern_profile" "jsonb",
    "token_usage" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "voice_fingerprint" "jsonb",
    "experience_fingerprint" "jsonb",
    "workshop_items" "jsonb",
    "full_analysis_result" "jsonb",
    CONSTRAINT "dimension_scores_valid" CHECK (("jsonb_typeof"("dimension_scores") = 'array'::"text")),
    CONSTRAINT "essay_analysis_reports_essay_quality_index_check" CHECK ((("essay_quality_index" >= (0)::numeric) AND ("essay_quality_index" <= (100)::numeric))),
    CONSTRAINT "weights_valid" CHECK (("jsonb_typeof"("weights") = 'object'::"text"))
);


ALTER TABLE "public"."essay_analysis_reports" OWNER TO "postgres";


COMMENT ON COLUMN "public"."essay_analysis_reports"."voice_fingerprint" IS 'Voice Fingerprint data: sentence structure, vocabulary, pacing, and tone analysis from surgical workshop';



COMMENT ON COLUMN "public"."essay_analysis_reports"."experience_fingerprint" IS 'Experience Fingerprint data: uniqueness dimensions, anti-pattern detection, divergence requirements, and quality anchors';



COMMENT ON COLUMN "public"."essay_analysis_reports"."workshop_items" IS 'Array of surgical workshop items with problems, suggestions (polished_original, voice_amplifier, divergent_strategy), and rationales';



COMMENT ON COLUMN "public"."essay_analysis_reports"."full_analysis_result" IS 'Complete AnalysisResult object from backend for archival and debugging purposes';



CREATE TABLE IF NOT EXISTS "public"."essay_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "essay_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "message_timestamp" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "essay_chat_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."essay_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."essay_coaching_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "essay_id" "uuid" NOT NULL,
    "analysis_report_id" "uuid",
    "goal_statement" "text" NOT NULL,
    "coaching_depth" "public"."analysis_depth" DEFAULT 'standard'::"public"."analysis_depth" NOT NULL,
    "outline_variants" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "micro_edits" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "rewrites_by_style" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "elicitation_prompts" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "guardrails" "text"[] DEFAULT '{}'::"text"[],
    "word_budget_guidance" "text",
    "school_alignment_todo" "text"[],
    "token_usage" "jsonb",
    "accepted" boolean DEFAULT false,
    "student_feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "elicitation_valid" CHECK (("jsonb_typeof"("elicitation_prompts") = 'object'::"text")),
    CONSTRAINT "micro_edits_valid" CHECK (("jsonb_typeof"("micro_edits") = 'array'::"text")),
    CONSTRAINT "outline_variants_valid" CHECK (("jsonb_typeof"("outline_variants") = 'array'::"text")),
    CONSTRAINT "rewrites_valid" CHECK (("jsonb_typeof"("rewrites_by_style") = 'object'::"text"))
);


ALTER TABLE "public"."essay_coaching_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."essay_duplicates" (
    "essay_hash" "text" NOT NULL,
    "user_ids" "text"[] NOT NULL,
    "account_count" integer DEFAULT 1 NOT NULL,
    "first_seen" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "flagged_at" timestamp with time zone
);


ALTER TABLE "public"."essay_duplicates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."essay_revision_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "essay_id" "uuid" NOT NULL,
    "version" integer NOT NULL,
    "draft_content" "text" NOT NULL,
    "change_summary" "text",
    "coaching_plan_id" "uuid",
    "word_count" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "public"."version_source_type" DEFAULT 'autosave'::"public"."version_source_type" NOT NULL,
    "label" "text",
    "parent_version_id" "uuid",
    "score" numeric,
    "dimension_scores" "jsonb",
    "analysis_report_id" "uuid",
    "is_deleted" boolean DEFAULT false NOT NULL,
    CONSTRAINT "essay_revision_history_score_check" CHECK ((("score" IS NULL) OR (("score" >= (0)::numeric) AND ("score" <= (100)::numeric)))),
    CONSTRAINT "version_positive" CHECK (("version" > 0))
);


ALTER TABLE "public"."essay_revision_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."essays" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "profile_id" "uuid",
    "essay_type" "public"."essay_type" NOT NULL,
    "prompt_text" "text",
    "max_words" integer DEFAULT 650 NOT NULL,
    "target_school" "text",
    "draft_original" "text" NOT NULL,
    "draft_current" "text",
    "version" integer DEFAULT 1 NOT NULL,
    "context_constraints" "text",
    "intended_major" "text",
    "submitted_at" timestamp with time zone,
    "locked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "max_words_positive" CHECK (("max_words" > 0)),
    CONSTRAINT "version_positive" CHECK (("version" > 0))
);


ALTER TABLE "public"."essays" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experiences_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "work_experiences" "jsonb" DEFAULT '[]'::"jsonb",
    "volunteer_service" "jsonb" DEFAULT '[]'::"jsonb",
    "extracurriculars" "jsonb" DEFAULT '[]'::"jsonb",
    "personal_projects" "jsonb" DEFAULT '[]'::"jsonb",
    "academic_honors" "jsonb" DEFAULT '[]'::"jsonb",
    "formal_recognition" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "leadership_roles" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."experiences_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."family_responsibilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "responsibilities" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "circumstances" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "hours_per_week" smallint DEFAULT 0 NOT NULL,
    "other_responsibilities" "text" DEFAULT ''::"text",
    "challenging_circumstances" boolean DEFAULT false NOT NULL,
    "other_circumstances" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "family_responsibilities_hours_per_week_range_chk" CHECK ((("hours_per_week" >= 0) AND ("hours_per_week" <= 168)))
);


ALTER TABLE "public"."family_responsibilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fraud_flags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "flag_reason" "text" NOT NULL,
    "flag_severity" "text" DEFAULT 'high'::"text" NOT NULL,
    "evidence" "jsonb",
    "essay_hash" "text",
    "status" "text" DEFAULT 'flagged'::"text" NOT NULL,
    "is_banned" boolean DEFAULT false,
    "flagged_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "text",
    "actions_blocked" integer DEFAULT 0,
    "last_blocked_at" timestamp with time zone
);


ALTER TABLE "public"."fraud_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fraud_risk_scores" (
    "user_id" "text" NOT NULL,
    "risk_score" numeric(3,2) DEFAULT 0.00,
    "ip_risk" numeric(3,2) DEFAULT 0.00,
    "device_risk" numeric(3,2) DEFAULT 0.00,
    "essay_risk" numeric(3,2) DEFAULT 0.00,
    "is_shared_ip" boolean DEFAULT false,
    "ip_account_count" integer DEFAULT 0,
    "device_account_count" integer DEFAULT 0,
    "essay_duplicate_count" integer DEFAULT 0,
    "last_updated" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fraud_risk_scores_risk_score_check" CHECK ((("risk_score" >= (0)::numeric) AND ("risk_score" <= (1)::numeric)))
);


ALTER TABLE "public"."fraud_risk_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals_aspirations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "intended_major" "text",
    "career_interests" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "highest_degree" "text",
    "college_environment" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "college_plans" "jsonb",
    "applying_to_uc" "text",
    "using_common_app" "text",
    "start_date" "text",
    "geographic_preferences" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "need_based_aid" "text",
    "merit_scholarships" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "goals_aspirations_applying_to_uc_chk" CHECK ((("applying_to_uc" IS NULL) OR ("applying_to_uc" = ANY (ARRAY['yes'::"text", 'no'::"text", 'maybe'::"text"])))),
    CONSTRAINT "goals_aspirations_highest_degree_chk" CHECK ((("highest_degree" IS NULL) OR ("highest_degree" = ANY (ARRAY['bachelors'::"text", 'masters'::"text", 'phd'::"text", 'md'::"text", 'jd'::"text", 'other_professional'::"text", 'undecided'::"text"])))),
    CONSTRAINT "goals_aspirations_merit_scholarships_chk" CHECK ((("merit_scholarships" IS NULL) OR ("merit_scholarships" = ANY (ARRAY['yes'::"text", 'no'::"text", 'unsure'::"text"])))),
    CONSTRAINT "goals_aspirations_need_based_aid_chk" CHECK ((("need_based_aid" IS NULL) OR ("need_based_aid" = ANY (ARRAY['yes'::"text", 'no'::"text", 'unsure'::"text"])))),
    CONSTRAINT "goals_aspirations_start_date_chk" CHECK ((("start_date" IS NULL) OR ("start_date" = ANY (ARRAY['fall_2025'::"text", 'spring_2026'::"text", 'fall_2026'::"text", 'gap_year'::"text", 'undecided'::"text"])))),
    CONSTRAINT "goals_aspirations_using_common_app_chk" CHECK ((("using_common_app" IS NULL) OR ("using_common_app" = ANY (ARRAY['yes'::"text", 'no'::"text", 'maybe'::"text"]))))
);


ALTER TABLE "public"."goals_aspirations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ip_usage_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "signup_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ip_usage_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_growth" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "meaningful_experiences" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "additional_context" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "search_vector" "tsvector",
    CONSTRAINT "personal_growth_ac_obj_chk" CHECK (("jsonb_typeof"("additional_context") = 'object'::"text")),
    CONSTRAINT "personal_growth_me_obj_chk" CHECK (("jsonb_typeof"("meaningful_experiences") = 'object'::"text"))
);


ALTER TABLE "public"."personal_growth" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_information" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "preferred_name" "text",
    "date_of_birth" "date",
    "primary_email" "text",
    "primary_phone" "text",
    "secondary_phone" "text",
    "pronouns" "text",
    "gender_identity" "text",
    "permanent_address" "jsonb",
    "alternate_address" "jsonb",
    "place_of_birth" "jsonb",
    "hispanic_latino" "text",
    "hispanic_background" "text",
    "race_ethnicity" "text"[],
    "citizenship_status" "text",
    "primary_language" "text",
    "other_languages" "jsonb",
    "years_in_us" integer,
    "former_names" "text"[],
    "living_situation" "text",
    "household_size" "text",
    "household_income" "text",
    "parent_guardians" "jsonb",
    "siblings" "jsonb",
    "first_gen" boolean,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."personal_information" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "input_signature" "text" NOT NULL,
    "overall" numeric NOT NULL,
    "dimensions" "jsonb" NOT NULL,
    "detailed" "jsonb" NOT NULL,
    "cached_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."portfolio_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_analytics_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "prev_overall" numeric,
    "new_overall" numeric NOT NULL,
    "prev_dimensions" "jsonb",
    "new_dimensions" "jsonb" NOT NULL,
    "changed_fields" "jsonb",
    "reason_summary" "text",
    "model_used" "text",
    "cost_cents" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."portfolio_analytics_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_guidance_cache" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "input_signature" "text" NOT NULL,
    "guidance_version" integer NOT NULL,
    "response" "jsonb" NOT NULL,
    "is_stale" boolean DEFAULT false NOT NULL,
    "cached_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."portfolio_guidance_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_suggestions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "category" "text" NOT NULL,
    "suggestion_text" "text" NOT NULL,
    "related_tool" "text" NOT NULL,
    "related_link" "text",
    "is_dismissed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."portfolio_suggestions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "user_context" "public"."user_context" NOT NULL,
    "status" "public"."profile_status" DEFAULT 'initial'::"public"."profile_status" NOT NULL,
    "goals" "jsonb" DEFAULT '{"primaryGoal": "exploring_options", "desiredOutcomes": [], "timelineUrgency": "flexible"}'::"jsonb" NOT NULL,
    "constraints" "jsonb" DEFAULT '{"needsFinancialAid": false}'::"jsonb" NOT NULL,
    "demographics" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "completion_score" numeric(3,2) DEFAULT 0.00 NOT NULL,
    "completion_details" "jsonb" DEFAULT '{"overall": 0, "sections": {"basic": 0, "goals": 0, "academic": 0, "enrichment": 0, "experience": 0}}'::"jsonb" NOT NULL,
    "extracted_skills" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "hidden_strengths" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "narrative_summary" "text",
    "last_enrichment_date" timestamp with time zone,
    "enrichment_priorities" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "search_vector" "tsvector",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "deleted_at" timestamp with time zone,
    "has_completed_assessment" boolean DEFAULT false NOT NULL,
    "credits" integer DEFAULT 10 NOT NULL,
    "stripe_customer_id" "text",
    "subscription_status" "text" DEFAULT 'none'::"text",
    "terms_accepted_at" timestamp with time zone,
    "referred_by" "text",
    "referral_discount_active" boolean DEFAULT false,
    "academic_path" "text",
    "school_name" "text",
    "graduation_year" integer,
    "gpa_range" "text",
    "major" "text",
    "has_test_scores" boolean DEFAULT false,
    "test_score_range" "text",
    "highest_education" "text",
    "years_experience" "text",
    "current_field" "text",
    "current_activities" "text"[] DEFAULT '{}'::"text"[],
    "college_plans" "text",
    "interest_areas" "text"[] DEFAULT '{}'::"text"[],
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_completed_at" timestamp with time zone,
    "current_onboarding_step" integer DEFAULT 1,
    "first_name" "text",
    "application_stage" "public"."application_stage",
    CONSTRAINT "profiles_academic_path_check" CHECK (("academic_path" = ANY (ARRAY['high_school'::"text", 'college'::"text", 'professional'::"text", 'gap_year'::"text"]))),
    CONSTRAINT "profiles_current_onboarding_step_check" CHECK ((("current_onboarding_step" >= 1) AND ("current_onboarding_step" <= 3))),
    CONSTRAINT "profiles_gpa_range_check" CHECK (("gpa_range" = ANY (ARRAY['below_2.5'::"text", '2.5_3.0'::"text", '3.0_3.5'::"text", '3.5_4.0'::"text", '4.0_plus'::"text"]))),
    CONSTRAINT "profiles_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'canceled'::"text", 'past_due'::"text", 'none'::"text"]))),
    CONSTRAINT "valid_completion_score" CHECK ((("completion_score" >= (0)::numeric) AND ("completion_score" <= (1)::numeric)))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."user_context" IS 'Grade/life context only. Application progress belongs in application_stage; profile facts belong in canonical child tables.';



COMMENT ON COLUMN "public"."profiles"."credits" IS 'User credit balance. New users receive 10 free credits.';



COMMENT ON COLUMN "public"."profiles"."referred_by" IS 'User ID of the referrer (if this user was referred)';



COMMENT ON COLUMN "public"."profiles"."referral_discount_active" IS 'Whether this user gets 10% off credit packs (set when referral is claimed)';



COMMENT ON COLUMN "public"."profiles"."academic_path" IS 'Quick-start onboarding: User academic path (high_school, college, professional, gap_year)';



COMMENT ON COLUMN "public"."profiles"."onboarding_completed" IS 'Whether user has completed the mandatory quick-start onboarding flow';



COMMENT ON COLUMN "public"."profiles"."current_onboarding_step" IS 'Current step in onboarding flow (1-3) for resuming progress';



COMMENT ON COLUMN "public"."profiles"."first_name" IS 'User first name collected during quick-start onboarding';



COMMENT ON COLUMN "public"."profiles"."application_stage" IS 'Application-process progress only: exploring, mid_application, or almost_done.';



CREATE TABLE IF NOT EXISTS "public"."rag_essay_fragments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "essay_type" "text",
    "prompt_type" "text",
    "dimension" "text",
    "quality_tier" "text" DEFAULT 'strong'::"text" NOT NULL,
    "college" "text",
    "technique" "text",
    "why_it_works" "text" NOT NULL,
    "transferable_principle" "text" NOT NULL,
    "source_info" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rag_essay_fragments_quality_tier_check" CHECK (("quality_tier" = ANY (ARRAY['excellent'::"text", 'strong'::"text", 'needs_work'::"text"])))
);


ALTER TABLE "public"."rag_essay_fragments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rag_transformations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "before_text" "text" NOT NULL,
    "after_text" "text" NOT NULL,
    "before_embedding" "public"."vector"(1536),
    "after_embedding" "public"."vector"(1536),
    "dimension" "text",
    "technique" "text",
    "essay_type" "text",
    "why_it_works" "text" NOT NULL,
    "principle" "text" NOT NULL,
    "effectiveness_score" double precision DEFAULT 0.0,
    "source_info" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rag_transformations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_codes" (
    "user_id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "referral_codes_code_format" CHECK ((("length"("code") >= 6) AND ("length"("code") <= 20)))
);


ALTER TABLE "public"."referral_codes" OWNER TO "postgres";


COMMENT ON TABLE "public"."referral_codes" IS 'Stores unique referral codes for each user to share with friends';



CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "referee_user_id" "text" NOT NULL,
    "referrer_user_id" "text" NOT NULL,
    "referral_code" "text" NOT NULL,
    "claimed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "signup_bonus_granted_at" timestamp with time zone,
    "purchase_bonus_granted_at" timestamp with time zone,
    CONSTRAINT "referrals_no_self_referral" CHECK (("referee_user_id" <> "referrer_user_id"))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


COMMENT ON TABLE "public"."referrals" IS 'Tracks referral relationships and bonus grant status';



COMMENT ON COLUMN "public"."referrals"."signup_bonus_granted_at" IS 'Timestamp when referrer received +25 credits for signup';



COMMENT ON COLUMN "public"."referrals"."purchase_bonus_granted_at" IS 'Timestamp when referrer received +25 credits for first purchase';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "stripe_subscription_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_network" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "counselor" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "community_support_legacy" "jsonb",
    "portfolio_items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "documents" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "teachers" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "has_community_support" boolean DEFAULT false NOT NULL,
    "community_organizations" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "has_portfolio_items" boolean DEFAULT false NOT NULL,
    "wants_to_upload_documents" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."support_network" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_college_list" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "college_id" "uuid" NOT NULL,
    "category" "text",
    "status" "text" DEFAULT 'interested'::"text" NOT NULL,
    "notes" "text",
    "position" integer,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_college_list_category_check" CHECK ((("category" = ANY (ARRAY['reach'::"text", 'match'::"text", 'safety'::"text"])) OR ("category" IS NULL))),
    CONSTRAINT "user_college_list_status_check" CHECK (("status" = ANY (ARRAY['interested'::"text", 'researching'::"text", 'applying'::"text", 'applied'::"text", 'accepted'::"text", 'denied'::"text", 'waitlisted'::"text", 'enrolled'::"text"])))
);


ALTER TABLE "public"."user_college_list" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_streaks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "text" NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "last_quest_date" "date",
    "total_credits_earned" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_streaks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb",
    "metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "public"."academic_journey"
    ADD CONSTRAINT "academic_journey_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."academic_journey"
    ADD CONSTRAINT "academic_journey_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."activity_chat_conversations"
    ADD CONSTRAINT "activity_chat_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_profiles"
    ADD CONSTRAINT "activity_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_profiles"
    ADD CONSTRAINT "activity_profiles_profile_id_activity_id_key" UNIQUE ("profile_id", "activity_id");



ALTER TABLE ONLY "public"."bug_reports"
    ADD CONSTRAINT "bug_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_stats"
    ADD CONSTRAINT "character_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."character_stats"
    ADD CONSTRAINT "character_stats_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."cip_interest_mapping"
    ADD CONSTRAINT "cip_interest_mapping_pkey" PRIMARY KEY ("cip_code");



ALTER TABLE ONLY "public"."college_reports"
    ADD CONSTRAINT "college_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."colleges"
    ADD CONSTRAINT "colleges_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."colleges"
    ADD CONSTRAINT "colleges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."colleges"
    ADD CONSTRAINT "colleges_scorecard_id_key" UNIQUE ("scorecard_id");



ALTER TABLE ONLY "public"."colleges"
    ADD CONSTRAINT "colleges_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_quests"
    ADD CONSTRAINT "daily_quests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_quests"
    ADD CONSTRAINT "daily_quests_user_id_quest_date_key" UNIQUE ("user_id", "quest_date");



ALTER TABLE ONLY "public"."dashboard_events"
    ADD CONSTRAINT "dashboard_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."device_fingerprints"
    ADD CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."essay_analyses"
    ADD CONSTRAINT "essay_analyses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."essay_analysis_reports"
    ADD CONSTRAINT "essay_analysis_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."essay_chat_messages"
    ADD CONSTRAINT "essay_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."essay_coaching_plans"
    ADD CONSTRAINT "essay_coaching_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."essay_duplicates"
    ADD CONSTRAINT "essay_duplicates_pkey" PRIMARY KEY ("essay_hash");



ALTER TABLE ONLY "public"."essay_revision_history"
    ADD CONSTRAINT "essay_revision_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."essays"
    ADD CONSTRAINT "essays_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experiences_activities"
    ADD CONSTRAINT "experiences_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experiences_activities"
    ADD CONSTRAINT "experiences_activities_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."family_responsibilities"
    ADD CONSTRAINT "family_responsibilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."family_responsibilities"
    ADD CONSTRAINT "family_responsibilities_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."fraud_flags"
    ADD CONSTRAINT "fraud_flags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fraud_flags"
    ADD CONSTRAINT "fraud_flags_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."fraud_risk_scores"
    ADD CONSTRAINT "fraud_risk_scores_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."goals_aspirations"
    ADD CONSTRAINT "goals_aspirations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."goals_aspirations"
    ADD CONSTRAINT "goals_aspirations_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."ip_usage_tracking"
    ADD CONSTRAINT "ip_usage_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_growth"
    ADD CONSTRAINT "personal_growth_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_growth"
    ADD CONSTRAINT "personal_growth_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."personal_information"
    ADD CONSTRAINT "personal_information_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_information"
    ADD CONSTRAINT "personal_information_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."portfolio_analytics_history"
    ADD CONSTRAINT "portfolio_analytics_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portfolio_analytics"
    ADD CONSTRAINT "portfolio_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portfolio_analytics"
    ADD CONSTRAINT "portfolio_analytics_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."portfolio_guidance_cache"
    ADD CONSTRAINT "portfolio_guidance_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."portfolio_guidance_cache"
    ADD CONSTRAINT "portfolio_guidance_cache_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."portfolio_suggestions"
    ADD CONSTRAINT "portfolio_suggestions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."rag_essay_fragments"
    ADD CONSTRAINT "rag_essay_fragments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rag_transformations"
    ADD CONSTRAINT "rag_transformations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."referral_codes"
    ADD CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("referee_user_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."support_network"
    ADD CONSTRAINT "support_network_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_network"
    ADD CONSTRAINT "support_network_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."user_college_list"
    ADD CONSTRAINT "user_college_list_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_college_list"
    ADD CONSTRAINT "user_college_list_user_id_college_id_key" UNIQUE ("user_id", "college_id");



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_streaks"
    ADD CONSTRAINT "user_streaks_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "academic_journey_profile_id_unique_idx" ON "public"."academic_journey" USING "btree" ("profile_id");



CREATE UNIQUE INDEX "credit_transactions_idempotency_key_unique" ON "public"."credit_transactions" USING "btree" ("idempotency_key") WHERE ("idempotency_key" IS NOT NULL);



CREATE INDEX "devices_user_last_seen_idx" ON "public"."devices" USING "btree" ("user_id", "last_seen" DESC);



CREATE UNIQUE INDEX "experiences_activities_profile_id_unique_idx" ON "public"."experiences_activities" USING "btree" ("profile_id");



CREATE INDEX "idx_activity_chat_conversations_active" ON "public"."activity_chat_conversations" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_activity_chat_conversations_profile_activity" ON "public"."activity_chat_conversations" USING "btree" ("profile_id", "activity_id");



CREATE INDEX "idx_activity_profiles_profile_id" ON "public"."activity_profiles" USING "btree" ("profile_id");



CREATE INDEX "idx_analysis_created_at" ON "public"."essay_analysis_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_analysis_eqi" ON "public"."essay_analysis_reports" USING "btree" ("essay_quality_index" DESC);



CREATE INDEX "idx_analysis_essay_id" ON "public"."essay_analysis_reports" USING "btree" ("essay_id");



CREATE INDEX "idx_analysis_experience_fingerprint_gin" ON "public"."essay_analysis_reports" USING "gin" ("experience_fingerprint");



CREATE INDEX "idx_analysis_has_experience_fingerprint" ON "public"."essay_analysis_reports" USING "btree" ((("experience_fingerprint" IS NOT NULL)));



CREATE INDEX "idx_analysis_has_voice_fingerprint" ON "public"."essay_analysis_reports" USING "btree" ((("voice_fingerprint" IS NOT NULL)));



CREATE INDEX "idx_analysis_voice_fingerprint_gin" ON "public"."essay_analysis_reports" USING "gin" ("voice_fingerprint");



CREATE INDEX "idx_analysis_workshop_items_gin" ON "public"."essay_analysis_reports" USING "gin" ("workshop_items");



CREATE INDEX "idx_bug_reports_compensation_status" ON "public"."bug_reports" USING "btree" ("compensation_status");



CREATE INDEX "idx_bug_reports_created_at" ON "public"."bug_reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_bug_reports_status" ON "public"."bug_reports" USING "btree" ("status");



CREATE INDEX "idx_bug_reports_user_id" ON "public"."bug_reports" USING "btree" ("user_id");



CREATE INDEX "idx_chat_messages_essay_id" ON "public"."essay_chat_messages" USING "btree" ("essay_id");



CREATE INDEX "idx_chat_messages_timestamp" ON "public"."essay_chat_messages" USING "btree" ("essay_id", "message_timestamp");



CREATE INDEX "idx_coaching_created_at" ON "public"."essay_coaching_plans" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_coaching_essay_id" ON "public"."essay_coaching_plans" USING "btree" ("essay_id");



CREATE INDEX "idx_college_reports_college" ON "public"."college_reports" USING "btree" ("college_id");



CREATE INDEX "idx_college_reports_status" ON "public"."college_reports" USING "btree" ("status");



CREATE INDEX "idx_colleges_acceptance_rate" ON "public"."colleges" USING "btree" ("acceptance_rate");



CREATE INDEX "idx_colleges_designations" ON "public"."colleges" USING "gin" ("designations");



CREATE INDEX "idx_colleges_interest_tags" ON "public"."colleges" USING "gin" ("interest_tags");



CREATE INDEX "idx_colleges_name" ON "public"."colleges" USING "btree" ("name");



CREATE INDEX "idx_colleges_program_breakdown" ON "public"."colleges" USING "gin" ("program_breakdown");



CREATE INDEX "idx_colleges_region" ON "public"."colleges" USING "btree" ("region");



CREATE INDEX "idx_colleges_scorecard_id" ON "public"."colleges" USING "btree" ("scorecard_id");



CREATE INDEX "idx_colleges_state" ON "public"."colleges" USING "btree" ("state");



CREATE INDEX "idx_colleges_type" ON "public"."colleges" USING "btree" ("type");



CREATE INDEX "idx_colleges_undergrad_enrollment" ON "public"."colleges" USING "btree" ("undergrad_enrollment");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_device_fingerprints_hash" ON "public"."device_fingerprints" USING "hash" ("fingerprint_hash");



CREATE INDEX "idx_device_fingerprints_user" ON "public"."device_fingerprints" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_device_user_unique" ON "public"."device_fingerprints" USING "btree" ("user_id", "fingerprint_hash");



CREATE INDEX "idx_devices_user_id" ON "public"."devices" USING "btree" ("user_id");



CREATE INDEX "idx_essay_analyses_date" ON "public"."essay_analyses" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_essay_analyses_hash" ON "public"."essay_analyses" USING "hash" ("essay_hash");



CREATE INDEX "idx_essay_analyses_user" ON "public"."essay_analyses" USING "btree" ("user_id");



CREATE INDEX "idx_essay_duplicates_flagged" ON "public"."essay_duplicates" USING "btree" ("flagged_at") WHERE ("flagged_at" IS NOT NULL);



CREATE INDEX "idx_essay_duplicates_users" ON "public"."essay_duplicates" USING "gin" ("user_ids");



CREATE INDEX "idx_essays_created_at" ON "public"."essays" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_essays_type" ON "public"."essays" USING "btree" ("essay_type");



CREATE INDEX "idx_essays_user_id" ON "public"."essays" USING "btree" ("user_id");



CREATE INDEX "idx_fraud_flags_active" ON "public"."fraud_flags" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['flagged'::"text", 'under_review'::"text"]));



CREATE INDEX "idx_fraud_flags_banned" ON "public"."fraud_flags" USING "btree" ("is_banned") WHERE ("is_banned" = true);



CREATE INDEX "idx_fraud_flags_user" ON "public"."fraud_flags" USING "btree" ("user_id");



CREATE INDEX "idx_fraud_risk_high" ON "public"."fraud_risk_scores" USING "btree" ("risk_score" DESC) WHERE ("risk_score" >= 0.6);



CREATE INDEX "idx_ip_usage_ip_date" ON "public"."ip_usage_tracking" USING "btree" ("ip_address", "created_at" DESC);



CREATE INDEX "idx_ip_usage_user" ON "public"."ip_usage_tracking" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_completion" ON "public"."profiles" USING "btree" ("completion_score") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_profiles_constraints_gin" ON "public"."profiles" USING "gin" ("constraints");



CREATE INDEX "idx_profiles_goals_gin" ON "public"."profiles" USING "gin" ("goals");



CREATE INDEX "idx_profiles_referral_discount" ON "public"."profiles" USING "btree" ("user_id", "referral_discount_active") WHERE ("referral_discount_active" = true);



CREATE INDEX "idx_profiles_search_gin" ON "public"."profiles" USING "gin" ("search_vector");



CREATE INDEX "idx_profiles_skills_gin" ON "public"."profiles" USING "gin" ("extracted_skills");



CREATE INDEX "idx_profiles_status" ON "public"."profiles" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_profiles_updated_desc" ON "public"."profiles" USING "btree" ("updated_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_profiles_user_context" ON "public"."profiles" USING "btree" ("user_context") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_rag_fragments_dimension" ON "public"."rag_essay_fragments" USING "btree" ("dimension");



CREATE INDEX "idx_rag_fragments_embedding" ON "public"."rag_essay_fragments" USING "hnsw" ("embedding" "public"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "idx_rag_fragments_essay_type" ON "public"."rag_essay_fragments" USING "btree" ("essay_type");



CREATE INDEX "idx_rag_fragments_quality" ON "public"."rag_essay_fragments" USING "btree" ("quality_tier");



CREATE INDEX "idx_rag_fragments_technique" ON "public"."rag_essay_fragments" USING "btree" ("technique");



CREATE INDEX "idx_rag_transformations_before" ON "public"."rag_transformations" USING "hnsw" ("before_embedding" "public"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "idx_rag_transformations_dimension" ON "public"."rag_transformations" USING "btree" ("dimension");



CREATE INDEX "idx_rag_transformations_technique" ON "public"."rag_transformations" USING "btree" ("technique");



CREATE INDEX "idx_referrals_pending_purchase_bonus" ON "public"."referrals" USING "btree" ("purchase_bonus_granted_at") WHERE ("purchase_bonus_granted_at" IS NULL);



CREATE INDEX "idx_referrals_referrer" ON "public"."referrals" USING "btree" ("referrer_user_id");



CREATE INDEX "idx_revision_analysis_report" ON "public"."essay_revision_history" USING "btree" ("analysis_report_id") WHERE ("analysis_report_id" IS NOT NULL);



CREATE INDEX "idx_revision_created_by" ON "public"."essay_revision_history" USING "btree" ("created_by");



CREATE INDEX "idx_revision_essay_id" ON "public"."essay_revision_history" USING "btree" ("essay_id");



CREATE INDEX "idx_revision_not_deleted" ON "public"."essay_revision_history" USING "btree" ("essay_id", "created_at" DESC) WHERE (NOT "is_deleted");



CREATE INDEX "idx_revision_parent" ON "public"."essay_revision_history" USING "btree" ("parent_version_id") WHERE ("parent_version_id" IS NOT NULL);



CREATE INDEX "idx_revision_version" ON "public"."essay_revision_history" USING "btree" ("essay_id", "version" DESC);



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_user_college_list_category" ON "public"."user_college_list" USING "btree" ("category");



CREATE INDEX "idx_user_college_list_status" ON "public"."user_college_list" USING "btree" ("status");



CREATE INDEX "idx_user_college_list_user" ON "public"."user_college_list" USING "btree" ("user_id");



CREATE INDEX "profiles_has_completed_assessment_idx" ON "public"."profiles" USING "btree" ("has_completed_assessment");



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_bucket_id_name_lower" ON "storage"."objects" USING "btree" ("bucket_id", "lower"("name") COLLATE "C");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");



CREATE OR REPLACE TRIGGER "academic_journey_set_timestamp" BEFORE UPDATE ON "public"."academic_journey" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "academic_journey_updated_at" BEFORE UPDATE ON "public"."academic_journey" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "activity_chat_conversations_set_timestamp" BEFORE UPDATE ON "public"."activity_chat_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "activity_profiles_set_timestamp" BEFORE UPDATE ON "public"."activity_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "bug_reports_updated_at" BEFORE UPDATE ON "public"."bug_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_bug_reports_updated_at"();



CREATE OR REPLACE TRIGGER "essay_version_increment" BEFORE UPDATE ON "public"."essays" FOR EACH ROW EXECUTE FUNCTION "public"."increment_essay_version"();



CREATE OR REPLACE TRIGGER "essays_updated_at" BEFORE UPDATE ON "public"."essays" FOR EACH ROW EXECUTE FUNCTION "public"."update_essays_updated_at"();



CREATE OR REPLACE TRIGGER "experiences_activities_set_timestamp" BEFORE UPDATE ON "public"."experiences_activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "experiences_activities_updated_at" BEFORE UPDATE ON "public"."experiences_activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "family_responsibilities_set_timestamp" BEFORE UPDATE ON "public"."family_responsibilities" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "goals_aspirations_set_timestamp" BEFORE UPDATE ON "public"."goals_aspirations" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "personal_growth_set_timestamp" BEFORE UPDATE ON "public"."personal_growth" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "personal_information_set_timestamp" BEFORE UPDATE ON "public"."personal_information" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "portfolio_analytics_set_timestamp" BEFORE UPDATE ON "public"."portfolio_analytics" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "portfolio_guidance_cache_set_timestamp" BEFORE UPDATE ON "public"."portfolio_guidance_cache" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "profiles_set_timestamp" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_family_responsibilities_updated_at" BEFORE UPDATE ON "public"."family_responsibilities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_goals_aspirations_updated_at" BEFORE UPDATE ON "public"."goals_aspirations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_personal_growth_tsv" BEFORE INSERT OR UPDATE ON "public"."personal_growth" FOR EACH ROW EXECUTE FUNCTION "public"."personal_growth_set_tsv"();



CREATE OR REPLACE TRIGGER "set_personal_growth_updated_at" BEFORE UPDATE ON "public"."personal_growth" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_support_network_updated_at" BEFORE UPDATE ON "public"."support_network" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "support_network_set_timestamp" BEFORE UPDATE ON "public"."support_network" FOR EACH ROW EXECUTE FUNCTION "public"."set_timestamp"();



CREATE OR REPLACE TRIGGER "trg_profiles_fts_ins" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_update_search"();



CREATE OR REPLACE TRIGGER "trg_profiles_fts_upd" BEFORE UPDATE OF "narrative_summary", "hidden_strengths" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."profiles_update_search"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_update_risk_on_device" AFTER INSERT OR UPDATE ON "public"."device_fingerprints" FOR EACH ROW EXECUTE FUNCTION "public"."update_fraud_risk"();



CREATE OR REPLACE TRIGGER "trg_update_risk_on_essay" AFTER INSERT OR UPDATE ON "public"."essay_analyses" FOR EACH ROW EXECUTE FUNCTION "public"."update_fraud_risk"();



CREATE OR REPLACE TRIGGER "trg_update_risk_on_ip" AFTER INSERT OR UPDATE ON "public"."ip_usage_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."update_fraud_risk"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "protect_buckets_delete" BEFORE DELETE ON "storage"."buckets" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "protect_objects_delete" BEFORE DELETE ON "storage"."objects" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "public"."academic_journey"
    ADD CONSTRAINT "academic_journey_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_chat_conversations"
    ADD CONSTRAINT "activity_chat_conversations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_profiles"
    ADD CONSTRAINT "activity_profiles_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."college_reports"
    ADD CONSTRAINT "college_reports_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."college_reports"
    ADD CONSTRAINT "college_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."essay_chat_messages"
    ADD CONSTRAINT "essay_chat_messages_essay_id_fkey" FOREIGN KEY ("essay_id") REFERENCES "public"."essays"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."essay_revision_history"
    ADD CONSTRAINT "essay_revision_history_analysis_report_id_fkey" FOREIGN KEY ("analysis_report_id") REFERENCES "public"."essay_analysis_reports"("id");



ALTER TABLE ONLY "public"."essay_revision_history"
    ADD CONSTRAINT "essay_revision_history_parent_version_id_fkey" FOREIGN KEY ("parent_version_id") REFERENCES "public"."essay_revision_history"("id");



ALTER TABLE ONLY "public"."experiences_activities"
    ADD CONSTRAINT "experiences_activities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."family_responsibilities"
    ADD CONSTRAINT "family_responsibilities_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."goals_aspirations"
    ADD CONSTRAINT "goals_aspirations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_growth"
    ADD CONSTRAINT "personal_growth_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_information"
    ADD CONSTRAINT "personal_information_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."portfolio_analytics_history"
    ADD CONSTRAINT "portfolio_analytics_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."portfolio_analytics"
    ADD CONSTRAINT "portfolio_analytics_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."portfolio_guidance_cache"
    ADD CONSTRAINT "portfolio_guidance_cache_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_code_fkey" FOREIGN KEY ("referral_code") REFERENCES "public"."referral_codes"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_network"
    ADD CONSTRAINT "support_network_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_college_list"
    ADD CONSTRAINT "user_college_list_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_college_list"
    ADD CONSTRAINT "user_college_list_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");



CREATE POLICY "Clerk: System can insert analysis reports" ON "public"."essay_analysis_reports" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_analysis_reports"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: System can insert coaching plans" ON "public"."essay_coaching_plans" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_coaching_plans"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: System can insert revision history" ON "public"."essay_revision_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_revision_history"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can delete own activity chat conversations" ON "public"."activity_chat_conversations" FOR DELETE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can delete own activity profiles" ON "public"."activity_profiles" FOR DELETE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can delete own chat messages" ON "public"."essay_chat_messages" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_chat_messages"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can delete own essays" ON "public"."essays" FOR DELETE TO "authenticated" USING ((("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))) AND ("locked" = false)));



CREATE POLICY "Clerk: Users can insert own activity chat conversations" ON "public"."activity_chat_conversations" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can insert own activity profiles" ON "public"."activity_profiles" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can insert own chat messages" ON "public"."essay_chat_messages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_chat_messages"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can insert own coaching plans" ON "public"."essay_coaching_plans" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_coaching_plans"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can insert own essay analyses" ON "public"."essay_analysis_reports" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_analysis_reports"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can insert own essays" ON "public"."essays" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "Clerk: Users can insert own revision history" ON "public"."essay_revision_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_revision_history"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can modify own academic journey" ON "public"."academic_journey" TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can modify own devices" ON "public"."devices" TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "Clerk: Users can update own activity chat conversations" ON "public"."activity_chat_conversations" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can update own activity profiles" ON "public"."activity_profiles" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can update own coaching plan feedback" ON "public"."essay_coaching_plans" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_coaching_plans"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can update own coaching plans" ON "public"."essay_coaching_plans" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_coaching_plans"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can update own essay analyses" ON "public"."essay_analysis_reports" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_analysis_reports"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can update own essays" ON "public"."essays" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))) AND ("locked" = false)));



CREATE POLICY "Clerk: Users can update own revision history" ON "public"."essay_revision_history" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_revision_history"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_revision_history"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can view own academic journey" ON "public"."academic_journey" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can view own activity chat conversations" ON "public"."activity_chat_conversations" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can view own activity profiles" ON "public"."activity_profiles" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "Clerk: Users can view own chat messages" ON "public"."essay_chat_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_chat_messages"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can view own coaching plans" ON "public"."essay_coaching_plans" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_coaching_plans"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can view own devices" ON "public"."devices" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "Clerk: Users can view own essay analyses" ON "public"."essay_analysis_reports" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_analysis_reports"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))))));



CREATE POLICY "Clerk: Users can view own essays" ON "public"."essays" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "Clerk: Users can view own non-deleted revision history" ON "public"."essay_revision_history" FOR SELECT USING (((NOT "is_deleted") AND (EXISTS ( SELECT 1
   FROM "public"."essays"
  WHERE (("essays"."id" = "essay_revision_history"."essay_id") AND ("essays"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))))));



CREATE POLICY "Clerk: Users can view own subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "Clerk: Users can view own transactions" ON "public"."credit_transactions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "Colleges are publicly viewable" ON "public"."colleges" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Colleges are viewable by authenticated users" ON "public"."colleges" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Service role full access - activity chat conversations" ON "public"."activity_chat_conversations" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access - activity profiles" ON "public"."activity_profiles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can insert own academic_journey" ON "public"."academic_journey" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert own experiences_activities" ON "public"."experiences_activities" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert own family_responsibilities" ON "public"."family_responsibilities" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert own goals_aspirations" ON "public"."goals_aspirations" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert own personal_growth" ON "public"."personal_growth" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert own personal_information" ON "public"."personal_information" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can insert own support_network" ON "public"."support_network" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own academic_journey" ON "public"."academic_journey" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own experiences_activities" ON "public"."experiences_activities" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own family_responsibilities" ON "public"."family_responsibilities" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own goals_aspirations" ON "public"."goals_aspirations" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own personal_growth" ON "public"."personal_growth" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own personal_information" ON "public"."personal_information" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can update own support_network" ON "public"."support_network" FOR UPDATE TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own academic_journey" ON "public"."academic_journey" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own experiences_activities" ON "public"."experiences_activities" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own family_responsibilities" ON "public"."family_responsibilities" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own goals_aspirations" ON "public"."goals_aspirations" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own personal_growth" ON "public"."personal_growth" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own personal_information" ON "public"."personal_information" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



CREATE POLICY "Users can view own referral code" ON "public"."referral_codes" FOR SELECT USING (("user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")));



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT USING ((("referrer_user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text")) OR ("referee_user_id" = (("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text"))));



CREATE POLICY "Users can view own support_network" ON "public"."support_network" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ("auth"."jwt"() ->> 'sub'::"text")))));



ALTER TABLE "public"."academic_journey" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_chat_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bug_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bug_reports_insert_own" ON "public"."bug_reports" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "bug_reports_select_own" ON "public"."bug_reports" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "bug_reports_service_all" ON "public"."bug_reports" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."character_stats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "character_stats_delete_own" ON "public"."character_stats" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "character_stats_insert_own" ON "public"."character_stats" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "character_stats_select_own" ON "public"."character_stats" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "character_stats_service_all" ON "public"."character_stats" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "character_stats_update_own" ON "public"."character_stats" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "public"."cip_interest_mapping" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cip_interest_mapping_read" ON "public"."cip_interest_mapping" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "cip_interest_mapping_service_all" ON "public"."cip_interest_mapping" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."college_reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "college_reports_insert_own" ON "public"."college_reports" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "college_reports_select_own" ON "public"."college_reports" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "college_reports_service_all" ON "public"."college_reports" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."colleges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_quests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "daily_quests_delete_own" ON "public"."daily_quests" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "daily_quests_insert_own" ON "public"."daily_quests" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "daily_quests_select_own" ON "public"."daily_quests" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "daily_quests_service_all" ON "public"."daily_quests" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "daily_quests_update_own" ON "public"."daily_quests" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "public"."dashboard_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dashboard_events_delete_own" ON "public"."dashboard_events" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "dashboard_events_insert_own" ON "public"."dashboard_events" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "dashboard_events_select_own" ON "public"."dashboard_events" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "dashboard_events_service_all" ON "public"."dashboard_events" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "dashboard_events_update_own" ON "public"."dashboard_events" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "public"."device_fingerprints" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "device_fingerprints_select_own" ON "public"."device_fingerprints" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "device_fingerprints_service_all" ON "public"."device_fingerprints" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."essay_analyses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "essay_analyses_delete_own" ON "public"."essay_analyses" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "essay_analyses_insert_own" ON "public"."essay_analyses" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "essay_analyses_select_own" ON "public"."essay_analyses" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "essay_analyses_service_all" ON "public"."essay_analyses" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "essay_analyses_update_own" ON "public"."essay_analyses" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "public"."essay_analysis_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."essay_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."essay_coaching_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."essay_duplicates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "essay_duplicates_service_all" ON "public"."essay_duplicates" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."essay_revision_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."essays" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."experiences_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."family_responsibilities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fraud_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fraud_flags_select_own" ON "public"."fraud_flags" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "fraud_flags_service_all" ON "public"."fraud_flags" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."fraud_risk_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fraud_risk_scores_select_own" ON "public"."fraud_risk_scores" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "fraud_risk_scores_service_all" ON "public"."fraud_risk_scores" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."goals_aspirations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ip_usage_tracking" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ip_usage_tracking_service_all" ON "public"."ip_usage_tracking" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."personal_growth" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_information" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolio_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."portfolio_analytics_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "portfolio_analytics_history_select_own" ON "public"."portfolio_analytics_history" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "portfolio_analytics_history_service_all" ON "public"."portfolio_analytics_history" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "portfolio_analytics_select_own" ON "public"."portfolio_analytics" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "portfolio_analytics_service_all" ON "public"."portfolio_analytics" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."portfolio_guidance_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "portfolio_guidance_cache_select_own" ON "public"."portfolio_guidance_cache" FOR SELECT TO "authenticated" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))))));



CREATE POLICY "portfolio_guidance_cache_service_all" ON "public"."portfolio_guidance_cache" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."portfolio_suggestions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "portfolio_suggestions_delete_own" ON "public"."portfolio_suggestions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "portfolio_suggestions_insert_own" ON "public"."portfolio_suggestions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "portfolio_suggestions_select_own" ON "public"."portfolio_suggestions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "portfolio_suggestions_service_all" ON "public"."portfolio_suggestions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "portfolio_suggestions_update_own" ON "public"."portfolio_suggestions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "profiles_service_all" ON "public"."profiles" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "public"."rag_essay_fragments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rag_fragments_service_all" ON "public"."rag_essay_fragments" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."rag_transformations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rag_transformations_service_all" ON "public"."rag_transformations" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."referral_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_network" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_college_list" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_college_list_delete_own" ON "public"."user_college_list" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "user_college_list_insert_own" ON "public"."user_college_list" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "user_college_list_select_own" ON "public"."user_college_list" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "user_college_list_service_all" ON "public"."user_college_list" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "user_college_list_update_own" ON "public"."user_college_list" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "public"."user_streaks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_streaks_delete_own" ON "public"."user_streaks" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "user_streaks_insert_own" ON "public"."user_streaks" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "user_streaks_select_own" ON "public"."user_streaks" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



CREATE POLICY "user_streaks_service_all" ON "public"."user_streaks" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "user_streaks_update_own" ON "public"."user_streaks" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text")))) WITH CHECK (("user_id" = ( SELECT ("auth"."jwt"() ->> 'sub'::"text"))));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."achievements_update_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."achievements_update_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."achievements_update_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_fraud_risk"("check_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_fraud_risk"("check_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_fraud_risk"("check_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."count_ip_signups"("check_ip" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."count_ip_signups"("check_ip" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_ip_signups"("check_ip" "inet") TO "service_role";



REVOKE ALL ON FUNCTION "public"."current_clerk_user_id"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."current_clerk_user_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_clerk_user_id"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."deduct_credits"("p_amount" integer, "p_type" "text", "p_description" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."deduct_credits"("p_amount" integer, "p_type" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_credits"("p_amount" integer, "p_type" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."experiences_set_is_ongoing"() TO "anon";
GRANT ALL ON FUNCTION "public"."experiences_set_is_ongoing"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."experiences_set_is_ongoing"() TO "service_role";



GRANT ALL ON FUNCTION "public"."experiences_update_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."experiences_update_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."experiences_update_search"() TO "service_role";



GRANT ALL ON FUNCTION "public"."flag_user_for_fraud"("check_user_id" "text", "reason" "text", "severity" "text", "evidence_data" "jsonb", "essay_hash_val" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."flag_user_for_fraud"("check_user_id" "text", "reason" "text", "severity" "text", "evidence_data" "jsonb", "essay_hash_val" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."flag_user_for_fraud"("check_user_id" "text", "reason" "text", "severity" "text", "evidence_data" "jsonb", "essay_hash_val" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_referral_code"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_essay_version"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_essay_version"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_essay_version"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_shared_ip"("check_ip" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."is_shared_ip"("check_ip" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_shared_ip"("check_ip" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_banned"("check_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_banned"("check_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_banned"("check_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_flagged"("check_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_flagged"("check_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_flagged"("check_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_rag_fragments"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_essay_type" "text", "filter_dimension" "text", "filter_technique" "text", "filter_quality_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_rag_fragments"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_essay_type" "text", "filter_dimension" "text", "filter_technique" "text", "filter_quality_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_rag_transformations"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_essay_type" "text", "filter_dimension" "text", "filter_technique" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_rag_transformations"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer, "filter_essay_type" "text", "filter_dimension" "text", "filter_technique" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."personal_growth_set_tsv"() TO "anon";
GRANT ALL ON FUNCTION "public"."personal_growth_set_tsv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."personal_growth_set_tsv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."profiles_update_search"() TO "anon";
GRANT ALL ON FUNCTION "public"."profiles_update_search"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."profiles_update_search"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."recalculate_completion_score"("p_profile_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recalculate_completion_score"("p_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_completion_score"("p_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_blocked_action"("check_user_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_blocked_action"("check_user_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_blocked_action"("check_user_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_bug_reports_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_bug_reports_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_bug_reports_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_essays_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_essays_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_essays_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_fraud_risk"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_fraud_risk"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_fraud_risk"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_achievement_date"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_achievement_date"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_achievement_date"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_experience_dates"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_experience_dates"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_experience_dates"() TO "service_role";



GRANT ALL ON TABLE "public"."academic_journey" TO "anon";
GRANT ALL ON TABLE "public"."academic_journey" TO "authenticated";
GRANT ALL ON TABLE "public"."academic_journey" TO "service_role";



GRANT ALL ON TABLE "public"."activity_chat_conversations" TO "anon";
GRANT ALL ON TABLE "public"."activity_chat_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_chat_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."activity_profiles" TO "anon";
GRANT ALL ON TABLE "public"."activity_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."bug_reports" TO "anon";
GRANT ALL ON TABLE "public"."bug_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."bug_reports" TO "service_role";



GRANT ALL ON TABLE "public"."character_stats" TO "anon";
GRANT ALL ON TABLE "public"."character_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."character_stats" TO "service_role";



GRANT ALL ON TABLE "public"."cip_interest_mapping" TO "anon";
GRANT ALL ON TABLE "public"."cip_interest_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."cip_interest_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."college_reports" TO "anon";
GRANT ALL ON TABLE "public"."college_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."college_reports" TO "service_role";



GRANT ALL ON TABLE "public"."colleges" TO "anon";
GRANT ALL ON TABLE "public"."colleges" TO "authenticated";
GRANT ALL ON TABLE "public"."colleges" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."daily_quests" TO "anon";
GRANT ALL ON TABLE "public"."daily_quests" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_quests" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_events" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_events" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_events" TO "service_role";



GRANT ALL ON TABLE "public"."device_fingerprints" TO "anon";
GRANT ALL ON TABLE "public"."device_fingerprints" TO "authenticated";
GRANT ALL ON TABLE "public"."device_fingerprints" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."essay_analyses" TO "anon";
GRANT ALL ON TABLE "public"."essay_analyses" TO "authenticated";
GRANT ALL ON TABLE "public"."essay_analyses" TO "service_role";



GRANT ALL ON TABLE "public"."essay_analysis_reports" TO "anon";
GRANT ALL ON TABLE "public"."essay_analysis_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."essay_analysis_reports" TO "service_role";



GRANT ALL ON TABLE "public"."essay_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."essay_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."essay_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."essay_coaching_plans" TO "anon";
GRANT ALL ON TABLE "public"."essay_coaching_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."essay_coaching_plans" TO "service_role";



GRANT ALL ON TABLE "public"."essay_duplicates" TO "service_role";



GRANT ALL ON TABLE "public"."essay_revision_history" TO "anon";
GRANT ALL ON TABLE "public"."essay_revision_history" TO "authenticated";
GRANT ALL ON TABLE "public"."essay_revision_history" TO "service_role";



GRANT ALL ON TABLE "public"."essays" TO "anon";
GRANT ALL ON TABLE "public"."essays" TO "authenticated";
GRANT ALL ON TABLE "public"."essays" TO "service_role";



GRANT ALL ON TABLE "public"."experiences_activities" TO "anon";
GRANT ALL ON TABLE "public"."experiences_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."experiences_activities" TO "service_role";



GRANT ALL ON TABLE "public"."family_responsibilities" TO "anon";
GRANT ALL ON TABLE "public"."family_responsibilities" TO "authenticated";
GRANT ALL ON TABLE "public"."family_responsibilities" TO "service_role";



GRANT ALL ON TABLE "public"."fraud_flags" TO "anon";
GRANT ALL ON TABLE "public"."fraud_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."fraud_flags" TO "service_role";



GRANT ALL ON TABLE "public"."fraud_risk_scores" TO "anon";
GRANT ALL ON TABLE "public"."fraud_risk_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."fraud_risk_scores" TO "service_role";



GRANT ALL ON TABLE "public"."goals_aspirations" TO "anon";
GRANT ALL ON TABLE "public"."goals_aspirations" TO "authenticated";
GRANT ALL ON TABLE "public"."goals_aspirations" TO "service_role";



GRANT ALL ON TABLE "public"."ip_usage_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."personal_growth" TO "anon";
GRANT ALL ON TABLE "public"."personal_growth" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_growth" TO "service_role";



GRANT ALL ON TABLE "public"."personal_information" TO "anon";
GRANT ALL ON TABLE "public"."personal_information" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_information" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_analytics" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_analytics_history" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_analytics_history" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_analytics_history" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_guidance_cache" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_guidance_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_guidance_cache" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_suggestions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT UPDATE("id") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("user_id") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("user_context") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("status") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("goals") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("constraints") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("demographics") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("completion_score") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("completion_details") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("extracted_skills") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("hidden_strengths") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("narrative_summary") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("last_enrichment_date") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("enrichment_priorities") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("search_vector") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("created_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("updated_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("archived_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("deleted_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("has_completed_assessment") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("terms_accepted_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("referred_by") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("academic_path") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("school_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("graduation_year") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("gpa_range") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("major") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("has_test_scores") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("test_score_range") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("highest_education") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("years_experience") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("current_field") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("current_activities") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("college_plans") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("interest_areas") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("onboarding_completed") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("onboarding_completed_at") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("current_onboarding_step") ON TABLE "public"."profiles" TO "authenticated";



GRANT UPDATE("first_name") ON TABLE "public"."profiles" TO "authenticated";



GRANT ALL ON TABLE "public"."rag_essay_fragments" TO "service_role";



GRANT ALL ON TABLE "public"."rag_transformations" TO "service_role";



GRANT ALL ON TABLE "public"."referral_codes" TO "anon";
GRANT ALL ON TABLE "public"."referral_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_codes" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."support_network" TO "anon";
GRANT ALL ON TABLE "public"."support_network" TO "authenticated";
GRANT ALL ON TABLE "public"."support_network" TO "service_role";



GRANT ALL ON TABLE "public"."user_college_list" TO "anon";
GRANT ALL ON TABLE "public"."user_college_list" TO "authenticated";
GRANT ALL ON TABLE "public"."user_college_list" TO "service_role";



GRANT ALL ON TABLE "public"."user_streaks" TO "anon";
GRANT ALL ON TABLE "public"."user_streaks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_streaks" TO "service_role";



REVOKE ALL ON TABLE "storage"."buckets" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."buckets" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";



REVOKE ALL ON TABLE "storage"."objects" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."objects" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";



