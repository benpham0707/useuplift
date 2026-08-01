\set ON_ERROR_STOP on

begin;

do $test$
declare
  source_id uuid;
  fixture_release_id uuid;
  job_id uuid;
  projection_id uuid;
  result jsonb;
begin
  if has_table_privilege('anon', 'public.college_profiles', 'select')
     or has_table_privilege('authenticated', 'public.college_profiles', 'select')
     or has_function_privilege('authenticated', 'college_ingest.build_college_projection(text,text)', 'execute')
     or has_function_privilege('anon', 'college_ingest.activate_college_projection(uuid)', 'execute') then
    raise exception 'browser roles can access private projection data or controls';
  end if;
  if not has_function_privilege('service_role', 'college_ingest.build_college_projection(text,text)', 'execute')
     or not has_function_privilege('service_role', 'college_ingest.activate_college_projection(uuid)', 'execute') then
    raise exception 'service role is missing projection controls';
  end if;

  insert into public.data_sources (source_key, producer_name, dataset_name, homepage_url)
  values ('test_projection', 'Fixture producer', 'Fixture source', 'https://example.edu')
  returning id into source_id;
  insert into public.data_releases (
    data_source_id, source_release_name, release_type, source_url,
    source_published_at, retrieved_at, sha256, object_path, schema_version
  ) values (
    source_id, 'fixture-2026', 'final', 'https://example.edu/fixture.zip',
    '2026-06-01Z', now(), repeat('d', 64), 'fixtures/2026.zip', '1'
  ) returning id into fixture_release_id;
  insert into college_ingest.ingestion_jobs (
    release_id, pipeline_build_id, status, started_at, rows_read,
    rows_accepted, rows_rejected
  ) values (fixture_release_id, 'm4-fixture-ingest', 'validating', now(), 1, 1, 0)
  returning id into job_id;
  insert into college_ingest.staged_institutions (
    ingestion_job_id, source_record_locator, unitid, official_name, status,
    institution_level, ownership, city, state, zip, website_url, is_eligible
  ) values (
    job_id, 'fixture:999004', 999004, 'Milestone Four University', 'active',
    'four_year', 'private_nonprofit', 'Oakland', 'CA', '94601',
    'https://example.edu', true
  );
  insert into college_ingest.staged_metric_facts (
    ingestion_job_id, source_record_locator, unitid, metric_key,
    academic_year, cohort_key, value_numeric, unit
  ) values
    (job_id, 'fixture:999004', 999004, 'undergraduate_enrollment', 2025, 'all', 4200, 'students'),
    (job_id, 'fixture:999004', 999004, 'admission_rate', 2025, 'all', 0.42, 'ratio'),
    (job_id, 'fixture:999004', 999004, 'net_price', 2025, 'all', 21000, 'usd'),
    (job_id, 'fixture:999004', 999004, 'cost_of_attendance', 2025, 'all', -10, 'usd');

  perform college_ingest.promote_ingestion_job(job_id);
  if not exists (
    select 1 from public.institution_metric_facts mf
    join public.metric_definitions md on md.id=mf.metric_definition_id
    where md.metric_key='cost_of_attendance' and mf.quality_status='rejected'
  ) or not exists (
    select 1 from public.data_quality_issues
    where data_quality_issues.release_id=fixture_release_id and issue_type='range_error'
      and field_key='cost_of_attendance' and severity='warning'
  ) then
    raise exception 'out-of-range facts were not retained as rejected quality evidence';
  end if;
  select college_ingest.build_college_projection('m4-fixture-projection', 'm0-provisional-v1') into result;
  projection_id := (result->>'projection_version_id')::uuid;

  if result->>'status' <> 'validated'
     or (result->>'profile_count')::integer <> 1
     or (select count(*) from public.college_profiles where projection_version_id=projection_id) <> 1
     or (select slug from public.college_profiles where projection_version_id=projection_id) <> 'milestone-four-university'
     or (select admission_rate from public.college_profiles where projection_version_id=projection_id) <> 0.42 then
    raise exception 'projection did not deterministically materialize the profile';
  end if;

  if not exists (
    select 1 from public.college_profile_facts
    where projection_version_id=projection_id and field_key='admission_rate'
      and display_value='0.42' and source_name='Fixture producer'
      and source_release='fixture-2026' and academic_year=2025
  ) or not exists (
    select 1 from public.college_profile_facts
    where projection_version_id=projection_id and field_key='city'
      and display_value='Oakland' and source_name='Fixture producer'
  ) then
    raise exception 'student-facing metric or identity provenance is incomplete';
  end if;

  select college_ingest.build_college_projection('m4-fixture-projection', 'm0-provisional-v1') into result;
  if result->>'status' <> 'already_exists'
     or (select count(*) from public.projection_versions where projection_build_id='m4-fixture-projection') <> 1 then
    raise exception 'projection build is not idempotent';
  end if;

  select college_ingest.activate_college_projection(projection_id) into result;
  if result->>'status' <> 'active'
     or (select active_projection_version_id from public.projection_control where singleton) <> projection_id
     or (select status from public.projection_versions where id=projection_id) <> 'active' then
    raise exception 'projection activation was not atomic';
  end if;
  select college_ingest.activate_college_projection(projection_id) into result;
  if result->>'status' <> 'already_active' then
    raise exception 'projection activation is not idempotent';
  end if;

  if not exists (
    select 1 from pg_indexes where schemaname='public'
      and indexname='college_profiles_version_state_name_idx'
  ) then raise exception 'serving filter index is missing'; end if;
end
$test$;

rollback;

select 'milestone_4_serving_tests=passed';
