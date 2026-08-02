begin;

-- Milestone 4 keeps browser roles away from the foundation. Only the backend's
-- service-role client can build, activate, or read these versioned projections.

create index college_profiles_version_ownership_name_idx
  on public.college_profiles (projection_version_id, ownership, normalized_name, institution_id);
create index college_profiles_version_level_name_idx
  on public.college_profiles (projection_version_id, institution_level, normalized_name, institution_id);
create index college_profiles_version_state_name_idx
  on public.college_profiles (projection_version_id, state, normalized_name, institution_id);
create index college_profiles_version_admission_name_idx
  on public.college_profiles (projection_version_id, admission_rate, normalized_name, institution_id)
  where admission_rate is not null;

-- Earlier promotion stored names as facts but cached the remaining identity
-- fields only on institutions. Preserve field-level provenance for those values
-- from retained successful staging rows before serving them.
insert into public.institution_attribute_facts (
  institution_id, attribute_key, value_text, reporting_period_start,
  reporting_period_end, release_id, source_record_locator, quality_status
)
select i.id, values_to_backfill.attribute_key, values_to_backfill.value_text,
  coalesce(dr.source_published_at::date, dr.retrieved_at::date),
  coalesce(dr.source_published_at::date, dr.retrieved_at::date),
  j.release_id, s.source_record_locator, 'verified'
from college_ingest.ingestion_jobs j
join college_ingest.staged_institutions s on s.ingestion_job_id = j.id
join public.institutions i on i.unitid = s.unitid
join public.data_releases dr on dr.id = j.release_id
cross join lateral (values
  ('city', s.city),
  ('state', s.state),
  ('zip', s.zip),
  ('ownership', s.ownership),
  ('institution_level', s.institution_level),
  ('institution_status', s.status),
  ('website_url', s.website_url)
) as values_to_backfill(attribute_key, value_text)
where j.status = 'succeeded'
  and s.is_eligible
  and values_to_backfill.value_text is not null
on conflict do nothing;

create or replace function college_ingest.build_college_projection(
  p_projection_build_id text,
  p_field_manifest_version text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  target_version_id uuid;
  target_status text;
  profile_count bigint;
  fact_count bigint;
  attribute_fact_count bigint;
begin
  if length(btrim(p_projection_build_id)) = 0
    or length(btrim(p_field_manifest_version)) = 0 then
    raise exception 'projection build and field manifest identifiers are required';
  end if;

  insert into public.projection_versions (
    projection_build_id, field_manifest_version, status
  ) values (p_projection_build_id, p_field_manifest_version, 'building')
  on conflict (projection_build_id) do nothing
  returning id, status into target_version_id, target_status;

  if target_version_id is null then
    select id, status into target_version_id, target_status
    from public.projection_versions
    where projection_build_id = p_projection_build_id;
    return jsonb_build_object(
      'status', 'already_exists',
      'projection_version_id', target_version_id,
      'projection_status', target_status
    );
  end if;

  -- Repeat the provenance backfill during each build so environments that apply
  -- this migration before their first ingestion receive the same guarantees.
  insert into public.institution_attribute_facts (
    institution_id, attribute_key, value_text, reporting_period_start,
    reporting_period_end, release_id, source_record_locator, quality_status
  )
  select i.id, values_to_backfill.attribute_key, values_to_backfill.value_text,
    coalesce(dr.source_published_at::date, dr.retrieved_at::date),
    coalesce(dr.source_published_at::date, dr.retrieved_at::date),
    j.release_id, s.source_record_locator, 'verified'
  from college_ingest.ingestion_jobs j
  join college_ingest.staged_institutions s on s.ingestion_job_id = j.id
  join public.institutions i on i.unitid = s.unitid
  join public.data_releases dr on dr.id = j.release_id
  cross join lateral (values
    ('city', s.city), ('state', s.state), ('zip', s.zip),
    ('ownership', s.ownership), ('institution_level', s.institution_level),
    ('institution_status', s.status), ('website_url', s.website_url)
  ) as values_to_backfill(attribute_key, value_text)
  where j.status = 'succeeded' and s.is_eligible
    and values_to_backfill.value_text is not null
  on conflict do nothing;

  insert into public.projection_version_releases (projection_version_id, release_id)
  select target_version_id, j.release_id
  from college_ingest.ingestion_jobs j
  where j.status = 'succeeded'
  group by j.release_id;

  with metric_ranked as (
    select mf.*, md.metric_key,
      row_number() over (
        partition by mf.institution_id, md.metric_key
        order by
          coalesce(array_position(
            array(select jsonb_array_elements_text(md.source_precedence)),
            ds.source_key
          ), 2147483647),
          mf.academic_year desc,
          dr.source_published_at desc nulls last,
          dr.retrieved_at desc,
          mf.id
      ) as choice
    from public.institution_metric_facts mf
    join public.metric_definitions md on md.id = mf.metric_definition_id
    join public.data_releases dr on dr.id = mf.release_id
    join public.data_sources ds on ds.id = dr.data_source_id
    where md.is_student_visible and mf.quality_status <> 'rejected'
  ), selected as (
    select * from metric_ranked where choice = 1
  ), base as (
    select i.*,
      max(s.value_numeric) filter (where s.metric_key = 'undergraduate_enrollment') as undergraduate_enrollment,
      max(s.value_numeric) filter (where s.metric_key = 'admission_rate') as admission_rate,
      max(s.value_numeric) filter (where s.metric_key = 'tuition_in_state') as tuition_in_state,
      max(s.value_numeric) filter (where s.metric_key = 'tuition_out_of_state') as tuition_out_of_state,
      max(s.value_numeric) filter (where s.metric_key = 'net_price') as net_price,
      count(s.id) filter (where not s.is_suppressed)::numeric / 10::numeric as coverage_score,
      regexp_replace(regexp_replace(lower(i.official_name), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g') as base_slug
    from public.institutions i
    left join selected s on s.institution_id = i.id
    where i.status = 'active' and i.institution_level = 'four_year'
    group by i.id
  ), slugged as (
    select base.*,
      case
        when base_slug = '' then 'college-' || unitid
        when count(*) over (partition by base_slug) > 1 then base_slug || '-' || unitid
        else base_slug
      end as final_slug
    from base
  )
  insert into public.college_profiles (
    projection_version_id, institution_id, unitid, name, normalized_name,
    slug, city, state, zip, ownership, institution_level,
    undergraduate_enrollment, admission_rate, tuition_in_state,
    tuition_out_of_state, net_price, coverage_score, search_document
  )
  select target_version_id, id, unitid, official_name, lower(official_name),
    final_slug, city, state, zip, ownership, institution_level,
    undergraduate_enrollment::integer, admission_rate, tuition_in_state,
    tuition_out_of_state, net_price, least(coverage_score, 1),
    to_tsvector('simple', coalesce(official_name, '') || ' ' ||
      coalesce(city, '') || ' ' || coalesce(state, ''))
  from slugged;
  get diagnostics profile_count = row_count;

  with metric_ranked as (
    select mf.*, md.metric_key, md.source_precedence, ds.producer_name,
      dr.source_release_name, dr.retrieved_at,
      row_number() over (
        partition by mf.institution_id, md.metric_key
        order by
          coalesce(array_position(
            array(select jsonb_array_elements_text(md.source_precedence)),
            ds.source_key
          ), 2147483647),
          mf.academic_year desc,
          dr.source_published_at desc nulls last,
          dr.retrieved_at desc,
          mf.id
      ) as choice
    from public.institution_metric_facts mf
    join public.metric_definitions md on md.id = mf.metric_definition_id
    join public.data_releases dr on dr.id = mf.release_id
    join public.data_sources ds on ds.id = dr.data_source_id
    where md.is_student_visible and mf.quality_status <> 'rejected'
  )
  insert into public.college_profile_facts (
    projection_version_id, institution_id, field_key, display_value,
    source_name, source_release, academic_year, cohort_key, cohort_label,
    quality_status, is_estimate, is_suppressed, retrieved_at,
    source_record_locator, metric_fact_id
  )
  select target_version_id, mr.institution_id, mr.metric_key,
    case when mr.is_suppressed then null else mr.value_numeric::text end,
    mr.producer_name, mr.source_release_name, mr.academic_year,
    mr.cohort_key, mr.cohort_key,
    case when mr.is_suppressed then 'suppressed' else mr.quality_status end,
    mr.quality_status = 'estimated', mr.is_suppressed, mr.retrieved_at,
    mr.source_record_locator, mr.id
  from metric_ranked mr
  join public.college_profiles cp
    on cp.projection_version_id = target_version_id
    and cp.institution_id = mr.institution_id
  where mr.choice = 1;
  get diagnostics fact_count = row_count;

  with attribute_ranked as (
    select af.*, ds.producer_name, dr.source_release_name, dr.retrieved_at,
      row_number() over (
        partition by af.institution_id, af.attribute_key
        order by dr.source_published_at desc nulls last, dr.retrieved_at desc, af.id
      ) as choice
    from public.institution_attribute_facts af
    join public.data_releases dr on dr.id = af.release_id
    join public.data_sources ds on ds.id = dr.data_source_id
    where af.attribute_key in (
      'official_name', 'city', 'state', 'zip', 'ownership',
      'institution_level', 'institution_status', 'website_url'
    ) and af.quality_status <> 'rejected'
  )
  insert into public.college_profile_facts (
    projection_version_id, institution_id, field_key, display_value,
    source_name, source_release, period_start, period_end, quality_status,
    retrieved_at, source_record_locator, attribute_fact_id
  )
  select target_version_id, ar.institution_id, ar.attribute_key,
    ar.value_text, ar.producer_name, ar.source_release_name,
    ar.reporting_period_start, ar.reporting_period_end, ar.quality_status,
    ar.retrieved_at, ar.source_record_locator, ar.id
  from attribute_ranked ar
  join public.college_profiles cp
    on cp.projection_version_id = target_version_id
    and cp.institution_id = ar.institution_id
  where ar.choice = 1
  on conflict (projection_version_id, institution_id, field_key) do nothing;
  get diagnostics attribute_fact_count = row_count;
  fact_count := fact_count + attribute_fact_count;

  insert into public.institution_lookup (
    projection_version_id, slug, institution_id, canonical_slug,
    known_status, search_document
  )
  select target_version_id, cp.slug, cp.institution_id, cp.slug,
    i.status, cp.search_document
  from public.college_profiles cp
  join public.institutions i on i.id = cp.institution_id
  where cp.projection_version_id = target_version_id;

  update public.projection_versions
  set status = 'validated', row_count = profile_count, validated_at = now(),
    build_summary = jsonb_build_object(
      'profile_count', profile_count,
      'displayed_fact_count', fact_count,
      'scope', 'active_four_year',
      'field_contract', 'provisional_pending_milestone_0'
    )
  where id = target_version_id;

  return jsonb_build_object(
    'status', 'validated',
    'projection_version_id', target_version_id,
    'profile_count', profile_count,
    'displayed_fact_count', fact_count
  );
exception when others then
  if target_version_id is not null then
    update public.projection_versions
    set status = 'failed', build_summary = jsonb_build_object('error', sqlerrm)
    where id = target_version_id and status = 'building';
  end if;
  raise;
end
$function$;

create or replace function college_ingest.activate_college_projection(
  p_projection_version_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  previous_version_id uuid;
  target_status text;
begin
  select active_projection_version_id into previous_version_id
  from public.projection_control where singleton for update;

  if previous_version_id = p_projection_version_id then
    return jsonb_build_object('status', 'already_active', 'projection_version_id', p_projection_version_id);
  end if;

  select status into target_status from public.projection_versions
  where id = p_projection_version_id for update;
  if not found then raise exception 'unknown projection version %', p_projection_version_id; end if;
  if target_status <> 'validated' then
    raise exception 'projection % must be validated, received %', p_projection_version_id, target_status;
  end if;

  if previous_version_id is not null then
    update public.projection_versions
    set status = 'retired', retired_at = now()
    where id = previous_version_id and status = 'active';
  end if;
  update public.projection_versions
  set status = 'active', activated_at = now()
  where id = p_projection_version_id;
  update public.projection_control
  set active_projection_version_id = p_projection_version_id, updated_at = now()
  where singleton;

  return jsonb_build_object(
    'status', 'active', 'projection_version_id', p_projection_version_id,
    'previous_projection_version_id', previous_version_id
  );
end
$function$;

revoke execute on function college_ingest.build_college_projection(text, text)
  from public, anon, authenticated;
revoke execute on function college_ingest.activate_college_projection(uuid)
  from public, anon, authenticated;
grant execute on function college_ingest.build_college_projection(text, text) to service_role;
grant execute on function college_ingest.activate_college_projection(uuid) to service_role;

commit;
