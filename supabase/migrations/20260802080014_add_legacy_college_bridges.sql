begin;

do $bridge$
begin
  if to_regclass('public.user_college_list') is not null then
    alter table public.user_college_list add column if not exists institution_id uuid;
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.user_college_list'::regclass
        and conname = 'user_college_list_institution_id_fkey'
    ) then
      alter table public.user_college_list
        add constraint user_college_list_institution_id_fkey
        foreign key (institution_id) references public.institutions(id) on delete restrict;
    end if;
    create index if not exists user_college_list_institution_id_idx
      on public.user_college_list (institution_id);
  end if;

  if to_regclass('public.college_reports') is not null then
    alter table public.college_reports add column if not exists institution_id uuid;
    if not exists (
      select 1 from pg_constraint
      where conrelid = 'public.college_reports'::regclass
        and conname = 'college_reports_institution_id_fkey'
    ) then
      alter table public.college_reports
        add constraint college_reports_institution_id_fkey
        foreign key (institution_id) references public.institutions(id) on delete restrict;
    end if;
    create index if not exists college_reports_institution_id_idx
      on public.college_reports (institution_id);
  end if;
end
$bridge$;

commit;
