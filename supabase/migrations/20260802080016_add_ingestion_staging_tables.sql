begin;

create table college_ingest.staged_institutions (
  ingestion_job_id uuid not null
    references college_ingest.ingestion_jobs(id) on delete restrict,
  source_record_locator text not null,
  unitid integer not null,
  official_name text not null,
  status text not null,
  institution_level text not null,
  ownership text not null,
  city text,
  state text,
  zip text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  website_url text,
  is_eligible boolean not null,
  created_at timestamptz not null default now(),
  primary key (ingestion_job_id, source_record_locator),
  constraint staged_institutions_unitid_positive check (unitid > 0),
  constraint staged_institutions_name_present check (length(btrim(official_name)) > 0),
  constraint staged_institutions_status_check
    check (status in ('active', 'inactive', 'closed', 'merged', 'unknown')),
  constraint staged_institutions_level_check
    check (institution_level in ('two_year', 'four_year', 'less_than_two_year', 'other')),
  constraint staged_institutions_ownership_check
    check (ownership in ('public', 'private_nonprofit', 'private_for_profit', 'other')),
  constraint staged_institutions_state_format check (state is null or state ~ '^[A-Z]{2}$')
);

create unique index staged_institutions_job_unitid_idx
  on college_ingest.staged_institutions (ingestion_job_id, unitid);

create table college_ingest.staged_metric_facts (
  ingestion_job_id uuid not null
    references college_ingest.ingestion_jobs(id) on delete restrict,
  source_record_locator text not null,
  unitid integer not null,
  metric_key text not null,
  academic_year integer not null,
  cohort_key text not null default 'all',
  value_numeric numeric,
  unit text not null,
  is_suppressed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (ingestion_job_id, source_record_locator, metric_key, cohort_key),
  constraint staged_metric_facts_unitid_positive check (unitid > 0),
  constraint staged_metric_facts_year_range check (academic_year between 1900 and 2200),
  constraint staged_metric_facts_value_state check (
    (is_suppressed and value_numeric is null) or
    (not is_suppressed and value_numeric is not null)
  )
);

create index staged_metric_facts_job_unitid_idx
  on college_ingest.staged_metric_facts (ingestion_job_id, unitid);

alter table college_ingest.staged_institutions enable row level security;
alter table college_ingest.staged_metric_facts enable row level security;

revoke all on college_ingest.staged_institutions,
  college_ingest.staged_metric_facts from public, anon, authenticated, service_role;
grant select, insert, delete on college_ingest.staged_institutions,
  college_ingest.staged_metric_facts to service_role;

insert into public.metric_definitions (
  metric_key, unit, minimum_value, maximum_value, source_precedence,
  student_label, cohort_semantics, is_student_visible
) values
  ('undergraduate_enrollment', 'students', 0, null, '["scorecard_institution"]', 'Undergraduate enrollment', 'Reported undergraduate enrollment', true),
  ('admission_rate', 'ratio', 0, 1, '["scorecard_institution", "ipeds_adm"]', 'Admission rate', 'Fall admissions cohort', true),
  ('tuition_in_state', 'usd', 0, null, '["scorecard_institution", "ipeds_ic"]', 'In-state tuition', 'Published tuition and fees', true),
  ('tuition_out_of_state', 'usd', 0, null, '["scorecard_institution", "ipeds_ic"]', 'Out-of-state tuition', 'Published tuition and fees', true),
  ('cost_of_attendance', 'usd', 0, null, '["scorecard_institution"]', 'Cost of attendance', 'Academic-year cost of attendance', true),
  ('net_price', 'usd', 0, null, '["scorecard_institution"]', 'Average net price', 'Federal net-price cohort', true),
  ('pell_share', 'ratio', 0, 1, '["scorecard_institution", "ipeds_sfa"]', 'Pell Grant share', 'Federal aid award year', true),
  ('completion_150pct', 'ratio', 0, 1, '["scorecard_institution", "ipeds_gr"]', 'Completion rate', '150% normal-time cohort', true),
  ('retention_full_time', 'ratio', 0, 1, '["scorecard_institution"]', 'Full-time retention', 'First-time full-time cohort', true),
  ('median_earnings_10yr', 'usd', 0, null, '["scorecard_institution"]', 'Median earnings', '10 years after entry cohort', true)
on conflict (metric_key) do nothing;

create or replace function college_ingest.promote_ingestion_job(p_ingestion_job_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_job college_ingest.ingestion_jobs%rowtype;
  institution_count bigint;
  metric_count bigint;
begin
  select * into target_job
  from college_ingest.ingestion_jobs
  where id = p_ingestion_job_id
  for update;

  if not found then
    raise exception 'unknown ingestion job %', p_ingestion_job_id;
  end if;
  if target_job.status = 'succeeded' then
    return jsonb_build_object('status', 'already_succeeded', 'job_id', target_job.id);
  end if;
  if target_job.status <> 'validating' then
    raise exception 'job % must be validating, received %', target_job.id, target_job.status;
  end if;
  if target_job.rows_read <> target_job.rows_accepted + target_job.rows_rejected then
    raise exception 'job % counts do not reconcile', target_job.id;
  end if;
  if exists (
    select 1 from public.data_quality_issues
    where release_id = target_job.release_id
      and severity = 'blocking' and status in ('open', 'acknowledged')
  ) then
    raise exception 'job % release has blocking quality issues', target_job.id;
  end if;

  update college_ingest.ingestion_jobs
  set status = 'promoting'
  where id = target_job.id;

  insert into public.institutions (
    unitid, official_name, status, institution_level, ownership,
    city, state, zip, latitude, longitude, website_url
  )
  select unitid, official_name, status, institution_level, ownership,
    city, state, zip, latitude, longitude, website_url
  from college_ingest.staged_institutions
  where ingestion_job_id = target_job.id and is_eligible
  on conflict (unitid) do update set
    official_name = excluded.official_name,
    status = excluded.status,
    institution_level = excluded.institution_level,
    ownership = excluded.ownership,
    city = excluded.city,
    state = excluded.state,
    zip = excluded.zip,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    website_url = excluded.website_url,
    updated_at = now();
  get diagnostics institution_count = row_count;

  insert into public.institution_identifiers (
    institution_id, scheme, value, valid_from, source_release_id
  )
  select i.id, 'ipeds_unitid', i.unitid::text,
    coalesce(dr.source_published_at::date, dr.retrieved_at::date), target_job.release_id
  from public.institutions i
  join college_ingest.staged_institutions s on s.unitid = i.unitid
  join public.data_releases dr on dr.id = target_job.release_id
  where s.ingestion_job_id = target_job.id and s.is_eligible
  on conflict do nothing;

  insert into public.institution_attribute_facts (
    institution_id, attribute_key, value_text, reporting_period_start,
    reporting_period_end, release_id, source_record_locator, quality_status
  )
  select i.id, 'official_name', s.official_name,
    dr.source_published_at::date, dr.source_published_at::date,
    target_job.release_id, s.source_record_locator, 'verified'
  from college_ingest.staged_institutions s
  join public.institutions i on i.unitid = s.unitid
  join public.data_releases dr on dr.id = target_job.release_id
  where s.ingestion_job_id = target_job.id and s.is_eligible
  on conflict do nothing;

  insert into public.institution_metric_facts (
    institution_id, metric_definition_id, release_id, academic_year,
    cohort_key, value_numeric, unit, is_suppressed, quality_status,
    source_record_locator
  )
  select i.id, md.id, target_job.release_id, sm.academic_year,
    sm.cohort_key, sm.value_numeric, sm.unit, sm.is_suppressed,
    case when sm.is_suppressed then 'provisional' else 'verified' end,
    sm.source_record_locator
  from college_ingest.staged_metric_facts sm
  join public.institutions i on i.unitid = sm.unitid
  join public.metric_definitions md on md.metric_key = sm.metric_key
  where sm.ingestion_job_id = target_job.id
  on conflict do nothing;
  get diagnostics metric_count = row_count;

  update college_ingest.ingestion_jobs
  set status = 'succeeded', finished_at = now(),
    validation_summary = validation_summary || jsonb_build_object(
      'promoted_institutions', institution_count,
      'promoted_metrics', metric_count
    )
  where id = target_job.id;

  return jsonb_build_object(
    'status', 'succeeded',
    'job_id', target_job.id,
    'promoted_institutions', institution_count,
    'promoted_metrics', metric_count
  );
end
$function$;

revoke execute on function college_ingest.promote_ingestion_job(uuid)
  from public, anon, authenticated;
grant execute on function college_ingest.promote_ingestion_job(uuid) to service_role;

commit;
