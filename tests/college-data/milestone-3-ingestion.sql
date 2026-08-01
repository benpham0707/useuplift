\set ON_ERROR_STOP on

begin;

do $test$
declare
  source_id uuid;
  release_id uuid;
  job_id uuid;
  attempt_id uuid;
  result jsonb;
  blocked_release_id uuid;
  blocked_job_id uuid;
begin
  if has_table_privilege('anon', 'college_ingest.staged_institutions', 'select')
     or has_table_privilege('authenticated', 'college_ingest.staged_metric_facts', 'insert') then
    raise exception 'client roles can access ingestion staging';
  end if;
  if not has_table_privilege('service_role', 'college_ingest.staged_institutions', 'insert')
     or has_table_privilege('service_role', 'college_ingest.staged_institutions', 'update') then
    raise exception 'staging service grants are incorrect';
  end if;

  insert into public.data_sources (source_key, producer_name, dataset_name, homepage_url)
  values ('test_ingest', 'Test', 'Test source', 'https://example.edu')
  returning id into source_id;

  insert into public.data_releases (
    data_source_id, source_release_name, release_type, source_url, retrieved_at,
    sha256, object_path, schema_version
  ) values (
    source_id, 'fixture-1', 'final', 'https://example.edu/fixture.zip', now(),
    repeat('b', 64), 'fixtures/fixture.zip', '1'
  ) returning id into release_id;

  insert into college_ingest.ingestion_jobs (
    release_id, pipeline_build_id, status, started_at, rows_read,
    rows_accepted, rows_rejected
  ) values (release_id, 'fixture-build', 'validating', now(), 1, 1, 0)
  returning id into job_id;

  insert into college_ingest.ingestion_attempts (
    ingestion_job_id, attempt_number, status, finished_at
  ) values (job_id, 1, 'succeeded', now()) returning id into attempt_id;

  insert into college_ingest.staged_institutions (
    ingestion_job_id, source_record_locator, unitid, official_name, status,
    institution_level, ownership, city, state, is_eligible
  ) values (
    job_id, 'fixture:999001', 999001, 'Fixture University', 'active',
    'four_year', 'public', 'Fixture', 'CA', true
  );

  insert into college_ingest.staged_metric_facts (
    ingestion_job_id, source_record_locator, unitid, metric_key, academic_year,
    cohort_key, value_numeric, unit
  ) values (job_id, 'fixture:999001', 999001, 'admission_rate', 2024, 'all', 0.5, 'ratio');

  select college_ingest.promote_ingestion_job(job_id) into result;
  if result->>'status' <> 'succeeded'
     or (select status from college_ingest.ingestion_jobs where id = job_id) <> 'succeeded'
     or (select count(*) from public.institutions where unitid = 999001) <> 1
     or (select count(*) from public.institution_metric_facts f join public.institutions i on i.id=f.institution_id where i.unitid=999001) <> 1 then
    raise exception 'promotion did not atomically publish accepted facts';
  end if;

  select college_ingest.promote_ingestion_job(job_id) into result;
  if result->>'status' <> 'already_succeeded'
     or (select count(*) from public.institution_metric_facts f join public.institutions i on i.id=f.institution_id where i.unitid=999001) <> 1
     or (select count(*) from college_ingest.ingestion_attempts where ingestion_job_id=job_id) <> 1 then
    raise exception 'idempotent promotion or attempt history failed';
  end if;

  insert into public.data_releases (
    data_source_id, source_release_name, release_type, source_url, retrieved_at,
    sha256, object_path, schema_version
  ) values (
    source_id, 'fixture-blocked', 'final', 'https://example.edu/blocked.zip', now(),
    repeat('c', 64), 'fixtures/blocked.zip', '1'
  ) returning id into blocked_release_id;
  insert into college_ingest.ingestion_jobs (
    release_id, pipeline_build_id, status, started_at, rows_read,
    rows_accepted, rows_rejected
  ) values (blocked_release_id, 'blocked-build', 'validating', now(), 1, 1, 0)
  returning id into blocked_job_id;
  insert into public.data_quality_issues (
    release_id, issue_type, severity, details
  ) values (blocked_release_id, 'unexpected_schema', 'blocking', '{"fixture":true}');

  begin
    perform college_ingest.promote_ingestion_job(blocked_job_id);
    raise exception 'blocking quality issue did not stop promotion';
  exception when raise_exception then
    if sqlerrm like 'blocking quality issue did not stop%' then raise; end if;
  end;
  if (select status from college_ingest.ingestion_jobs where id=blocked_job_id) <> 'validating' then
    raise exception 'blocked promotion changed job state';
  end if;
end
$test$;

rollback;

select 'milestone_3_ingestion_tests=passed';
