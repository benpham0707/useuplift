\set ON_ERROR_STOP on

begin;

do $test$
declare
  foundation_table_count integer;
  rls_table_count integer;
begin
  select count(*) into foundation_table_count
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'data_sources', 'data_releases', 'institutions',
      'institution_identifiers', 'institution_relationships',
      'institution_attribute_facts', 'metric_definitions',
      'institution_metric_facts', 'data_quality_issues',
      'projection_versions', 'projection_version_releases',
      'projection_control', 'college_profiles', 'college_profile_facts',
      'college_profile_fact_candidates', 'institution_lookup'
    );
  if foundation_table_count <> 16 then
    raise exception 'expected 16 public foundation tables, found %', foundation_table_count;
  end if;

  select count(*) into rls_table_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r'
    and c.relrowsecurity
    and (
      (n.nspname = 'public' and c.relname in (
        'data_sources', 'data_releases', 'institutions',
        'institution_identifiers', 'institution_relationships',
        'institution_attribute_facts', 'metric_definitions',
        'institution_metric_facts', 'data_quality_issues',
        'projection_versions', 'projection_version_releases',
        'projection_control', 'college_profiles', 'college_profile_facts',
        'college_profile_fact_candidates', 'institution_lookup'
      ))
      or (n.nspname = 'college_ingest' and c.relname in ('ingestion_jobs', 'ingestion_attempts'))
    );
  if rls_table_count <> 18 then
    raise exception 'expected RLS on 18 foundation tables, found %', rls_table_count;
  end if;

  if has_schema_privilege('anon', 'college_ingest', 'usage')
     or has_schema_privilege('authenticated', 'college_ingest', 'usage') then
    raise exception 'client role can use private ingestion schema';
  end if;

  if has_table_privilege('anon', 'public.college_profiles', 'select')
     or has_table_privilege('authenticated', 'public.college_profiles', 'select')
     or has_table_privilege('authenticated', 'public.institutions', 'insert') then
    raise exception 'client role has direct foundation access';
  end if;

  if not has_table_privilege('service_role', 'public.college_profiles', 'select')
     or not has_table_privilege('service_role', 'public.institution_metric_facts', 'insert')
     or has_table_privilege('service_role', 'public.institution_metric_facts', 'update') then
    raise exception 'service_role grant contract is incorrect';
  end if;

  if (select count(*) from public.projection_control) <> 1 then
    raise exception 'projection control must contain exactly one row';
  end if;
end
$test$;

do $fixtures$
declare
  source_id uuid;
  release_id uuid;
  institution_id uuid;
  definition_id uuid;
  metric_fact_id uuid;
  projection_id uuid;
begin
  insert into public.data_sources (
    source_key, producer_name, dataset_name, homepage_url
  ) values (
    'ipeds_hd', 'NCES', 'IPEDS HD', 'https://nces.ed.gov/ipeds/'
  ) returning id into source_id;

  insert into public.data_releases (
    data_source_id, source_release_name, release_type, source_url,
    source_published_at, retrieved_at, sha256, object_path, schema_version
  ) values (
    source_id, 'HD2023', 'final', 'https://nces.ed.gov/ipeds/datacenter/',
    '2024-01-01Z', now(), repeat('a', 64), 'ipeds/2023-final/HD2023.zip', '2023'
  ) returning id into release_id;

  insert into public.institutions (
    unitid, official_name, status, institution_level, ownership, city, state
  ) values (
    110635, 'University of California-Berkeley', 'active', 'four_year',
    'public', 'Berkeley', 'CA'
  ) returning id into institution_id;

  insert into public.institution_identifiers (
    institution_id, scheme, value, valid_from, source_release_id
  ) values (institution_id, 'ipeds_unitid', '110635', '2023-01-01', release_id);

  insert into public.institution_attribute_facts (
    institution_id, attribute_key, value_text, reporting_period_start,
    reporting_period_end, release_id, source_record_locator, quality_status
  ) values (
    institution_id, 'official_name', 'University of California-Berkeley',
    '2023-01-01', '2023-12-31', release_id, 'HD2023:110635', 'verified'
  );

  insert into public.metric_definitions (
    metric_key, unit, minimum_value, maximum_value, source_precedence,
    student_label, cohort_semantics, is_student_visible
  ) values (
    'admission_rate', 'ratio', 0, 1, '["ipeds_adm"]'::jsonb,
    'Admission rate', 'Fall admissions cohort', true
  ) on conflict (metric_key) do update set metric_key = excluded.metric_key
  returning id into definition_id;

  insert into public.institution_metric_facts (
    institution_id, metric_definition_id, release_id, academic_year,
    cohort_key, value_numeric, unit, source_record_locator, quality_status
  ) values (
    institution_id, definition_id, release_id, 2023, 'all', 0.113,
    'ratio', 'ADM2023:110635', 'verified'
  ) returning id into metric_fact_id;

  insert into public.projection_versions (
    projection_build_id, field_manifest_version, status, row_count,
    validated_at, activated_at
  ) values (
    'test-build', 'm0-v1', 'active', 1, now(), now()
  ) returning id into projection_id;

  insert into public.projection_version_releases (projection_version_id, release_id)
  values (projection_id, release_id);

  insert into public.college_profiles (
    projection_version_id, institution_id, unitid, name, normalized_name,
    slug, city, state, ownership, institution_level, admission_rate,
    coverage_score, search_document
  ) values (
    projection_id, institution_id, 110635,
    'University of California-Berkeley', 'university of california berkeley',
    'university-of-california-berkeley', 'Berkeley', 'CA', 'public',
    'four_year', 0.113, 0.5,
    to_tsvector('simple', 'University of California Berkeley CA')
  );

  insert into public.college_profile_facts (
    projection_version_id, institution_id, field_key, display_value,
    source_name, source_release, academic_year, cohort_key, cohort_label,
    quality_status, retrieved_at, source_record_locator, metric_fact_id
  ) values (
    projection_id, institution_id, 'admission_rate', '11.3%', 'IPEDS ADM',
    'ADM2023', 2023, 'all', 'Fall admissions cohort', 'verified', now(),
    'ADM2023:110635', metric_fact_id
  );

  insert into public.institution_lookup (
    projection_version_id, slug, institution_id, canonical_slug, known_status,
    search_document
  ) values (
    projection_id, 'university-of-california-berkeley', institution_id,
    'university-of-california-berkeley', 'active',
    to_tsvector('simple', 'University of California Berkeley')
  );

  update public.projection_control
  set active_projection_version_id = projection_id, updated_at = now()
  where singleton;

  begin
    insert into public.institution_metric_facts (
      institution_id, metric_definition_id, release_id, academic_year,
      cohort_key, value_numeric, unit, is_suppressed, source_record_locator
    ) values (
      institution_id, definition_id, release_id, 2024, 'all', 0.2,
      'ratio', true, 'invalid'
    );
    raise exception 'suppression/value constraint did not reject invalid row';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.institution_attribute_facts (
      institution_id, attribute_key, value_text, value_numeric, release_id,
      source_record_locator
    ) values (
      institution_id, 'invalid', 'text', 1, release_id, 'invalid'
    );
    raise exception 'one-value constraint did not reject invalid row';
  exception when check_violation then
    null;
  end;
end
$fixtures$;

rollback;

select 'milestone_2_foundation_tests=passed';
