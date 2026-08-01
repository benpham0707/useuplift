begin;

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
  end if;
  return new;
end
$function$;

create trigger ingestion_jobs_reconcile_institution_cache
after update of status on college_ingest.ingestion_jobs
for each row execute function college_ingest.reconcile_institution_cache_after_promotion();

commit;
