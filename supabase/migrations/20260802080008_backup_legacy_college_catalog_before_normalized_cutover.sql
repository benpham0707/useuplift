create schema if not exists college_legacy_backup;
revoke all on schema college_legacy_backup from public, anon, authenticated;

do $backup$
begin
  if to_regclass('public.colleges') is not null then
    execute 'create table college_legacy_backup.colleges_20260802 as table public.colleges';
  end if;
  if to_regclass('public.user_college_list') is not null then
    execute 'create table college_legacy_backup.user_college_list_20260802 as table public.user_college_list';
  end if;
  if to_regclass('public.college_reports') is not null then
    execute 'create table college_legacy_backup.college_reports_20260802 as table public.college_reports';
  end if;
end
$backup$;

comment on schema college_legacy_backup is
  'Rollback snapshot before normalized college foundation cutover on 2026-08-02';
