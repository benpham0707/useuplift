\set ON_ERROR_STOP on

do $test$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_college_list'
      and column_name = 'institution_id' and is_nullable = 'YES'
  ) or not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'college_reports'
      and column_name = 'institution_id' and is_nullable = 'YES'
  ) then
    raise exception 'legacy nullable bridge columns are missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_college_list'::regclass
      and conname = 'user_college_list_institution_id_fkey'
      and confdeltype = 'r'
  ) or not exists (
    select 1 from pg_constraint
    where conrelid = 'public.college_reports'::regclass
      and conname = 'college_reports_institution_id_fkey'
      and confdeltype = 'r'
  ) then
    raise exception 'legacy restrict foreign keys are missing';
  end if;

  if (select count(*) from public.user_college_list where user_id = 'legacy-user') <> 1
     or (select count(*) from public.college_reports where user_id = 'legacy-user') <> 1 then
    raise exception 'legacy rows were not preserved';
  end if;
end
$test$;

select 'legacy_bridge_tests=passed';
