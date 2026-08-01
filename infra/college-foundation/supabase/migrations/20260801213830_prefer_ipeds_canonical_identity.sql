begin;

create or replace function college_ingest.restore_ipeds_canonical_identity()
returns void
language sql
security invoker
set search_path = ''
as $function$
  with latest_ipeds as (
    select distinct on (s.unitid)
      s.unitid, s.official_name, s.status, s.institution_level, s.ownership,
      s.city, s.state, s.zip, s.latitude, s.longitude, s.website_url
    from college_ingest.staged_institutions s
    join college_ingest.ingestion_jobs j on j.id = s.ingestion_job_id
    join public.data_releases dr on dr.id = j.release_id
    join public.data_sources ds on ds.id = dr.data_source_id
    where j.status = 'succeeded' and ds.source_key = 'ipeds_hd'
    order by s.unitid, j.finished_at desc, j.id desc
  )
  update public.institutions i
  set official_name = s.official_name,
    status = s.status,
    institution_level = s.institution_level,
    ownership = s.ownership,
    city = s.city,
    state = s.state,
    zip = s.zip,
    latitude = s.latitude,
    longitude = s.longitude,
    website_url = s.website_url,
    updated_at = now()
  from latest_ipeds s
  where s.unitid = i.unitid
$function$;

create or replace function college_ingest.reconcile_institution_cache_after_promotion()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if new.status = 'succeeded' and old.status is distinct from new.status then
    update public.institutions i
    set official_name = s.official_name,
      status = s.status,
      institution_level = s.institution_level,
      ownership = s.ownership,
      city = s.city,
      state = s.state,
      zip = s.zip,
      latitude = s.latitude,
      longitude = s.longitude,
      website_url = s.website_url,
      updated_at = now()
    from college_ingest.staged_institutions s
    where s.ingestion_job_id = new.id and s.unitid = i.unitid;

    perform college_ingest.restore_ipeds_canonical_identity();
  end if;
  return new;
end
$function$;

-- Repair staging immediately; future promotions repeat this precedence step.
select college_ingest.restore_ipeds_canonical_identity();

revoke execute on function college_ingest.restore_ipeds_canonical_identity()
  from public, anon, authenticated;
grant execute on function college_ingest.restore_ipeds_canonical_identity() to service_role;

commit;
