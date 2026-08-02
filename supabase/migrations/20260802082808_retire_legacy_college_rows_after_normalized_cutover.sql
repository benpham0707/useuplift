do $retire$
begin
  if to_regclass('public.user_college_list') is not null then
    execute 'truncate table public.user_college_list';
  end if;
  if to_regclass('public.college_reports') is not null then
    execute 'truncate table public.college_reports';
  end if;
  if to_regclass('public.colleges') is not null then
    execute 'truncate table public.colleges';
    comment on table public.colleges is
      'Deprecated compatibility shell. Canonical college data is served from the versioned institutions and college_profiles foundation.';
  end if;
end
$retire$;

drop schema if exists college_legacy_backup cascade;
