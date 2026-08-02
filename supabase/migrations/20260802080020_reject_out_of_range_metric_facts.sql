begin;

insert into public.data_quality_issues (
  institution_id, release_id, issue_type, severity, field_key, details
)
select mf.institution_id, mf.release_id, 'range_error', 'warning', md.metric_key,
  jsonb_build_object(
    'value', mf.value_numeric,
    'minimum', md.minimum_value,
    'maximum', md.maximum_value,
    'source_record_locator', mf.source_record_locator
  )
from public.institution_metric_facts mf
join public.metric_definitions md on md.id = mf.metric_definition_id
where not mf.is_suppressed
  and (
    (md.minimum_value is not null and mf.value_numeric < md.minimum_value)
    or (md.maximum_value is not null and mf.value_numeric > md.maximum_value)
  )
  and not exists (
    select 1 from public.data_quality_issues dqi
    where dqi.institution_id = mf.institution_id
      and dqi.release_id = mf.release_id
      and dqi.issue_type = 'range_error'
      and dqi.field_key = md.metric_key
      and dqi.details->>'source_record_locator' = mf.source_record_locator
  );

update public.institution_metric_facts mf
set quality_status = 'rejected'
from public.metric_definitions md
where md.id = mf.metric_definition_id
  and not mf.is_suppressed
  and (
    (md.minimum_value is not null and mf.value_numeric < md.minimum_value)
    or (md.maximum_value is not null and mf.value_numeric > md.maximum_value)
  );

create or replace function college_ingest.reject_out_of_range_metric_fact()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  definition public.metric_definitions%rowtype;
begin
  if new.is_suppressed then return new; end if;
  select * into definition from public.metric_definitions
  where id = new.metric_definition_id;

  if (definition.minimum_value is not null and new.value_numeric < definition.minimum_value)
     or (definition.maximum_value is not null and new.value_numeric > definition.maximum_value) then
    new.quality_status := 'rejected';
    if not exists (
      select 1 from public.data_quality_issues dqi
      where dqi.institution_id = new.institution_id
        and dqi.release_id = new.release_id
        and dqi.issue_type = 'range_error'
        and dqi.field_key = definition.metric_key
        and dqi.details->>'source_record_locator' = new.source_record_locator
    ) then
      insert into public.data_quality_issues (
        institution_id, release_id, issue_type, severity, field_key, details
      ) values (
        new.institution_id, new.release_id, 'range_error', 'warning', definition.metric_key,
        jsonb_build_object(
          'value', new.value_numeric,
          'minimum', definition.minimum_value,
          'maximum', definition.maximum_value,
          'source_record_locator', new.source_record_locator
        )
      );
    end if;
  end if;
  return new;
end
$function$;

create trigger institution_metric_facts_reject_out_of_range
before insert or update of metric_definition_id, value_numeric, is_suppressed
on public.institution_metric_facts
for each row execute function college_ingest.reject_out_of_range_metric_fact();

commit;
