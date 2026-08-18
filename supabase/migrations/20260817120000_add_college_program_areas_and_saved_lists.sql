begin;

create table public.college_program_areas (
  institution_id uuid not null references public.institutions(id) on delete restrict,
  release_id uuid not null references public.data_releases(id) on delete restrict,
  academic_year integer not null,
  cip_area_code text not null,
  cip_area_label text not null,
  completions integer not null,
  created_at timestamptz not null default now(),
  primary key (institution_id, release_id, academic_year, cip_area_code),
  constraint college_program_areas_code_check check (cip_area_code ~ '^[0-9]{2}$'),
  constraint college_program_areas_label_check check (length(btrim(cip_area_label)) > 0),
  constraint college_program_areas_completions_check check (completions > 0)
);

create index college_program_areas_filter_idx
  on public.college_program_areas (cip_area_code, institution_id);

alter table public.college_profiles
  add column program_area_codes text[] not null default '{}'::text[],
  add column program_area_labels text[] not null default '{}'::text[];

create index college_profiles_program_area_codes_idx
  on public.college_profiles using gin (program_area_codes);
create index college_profiles_version_net_price_idx
  on public.college_profiles (projection_version_id, net_price, slug)
  where net_price is not null;
create index college_profiles_version_enrollment_idx
  on public.college_profiles (projection_version_id, undergraduate_enrollment, slug)
  where undergraduate_enrollment is not null;

create or replace function public.college_program_arrays(p_institution_id uuid)
returns table(codes text[], labels text[])
language sql
stable
set search_path = ''
as $function$
  select
    coalesce(array_agg(program.cip_area_code order by program.cip_area_label), '{}'::text[]),
    coalesce(array_agg(program.cip_area_label order by program.cip_area_label), '{}'::text[])
  from (
    select distinct on (area.cip_area_code)
      area.cip_area_code, area.cip_area_label
    from public.college_program_areas area
    where area.institution_id = p_institution_id
    order by area.cip_area_code, area.academic_year desc, area.cip_area_label
  ) program;
$function$;

create or replace function public.set_college_profile_program_arrays()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  select arrays.codes, arrays.labels
    into new.program_area_codes, new.program_area_labels
  from public.college_program_arrays(new.institution_id) arrays;
  return new;
end
$function$;

create trigger set_college_profile_program_arrays
before insert or update of institution_id on public.college_profiles
for each row execute function public.set_college_profile_program_arrays();

create or replace function public.refresh_college_program_areas(p_institution_id uuid default null)
returns bigint
language plpgsql
set search_path = ''
as $function$
declare
  affected bigint;
begin
  update public.college_profiles profile
  set program_area_codes = (select arrays.codes from public.college_program_arrays(profile.institution_id) arrays),
      program_area_labels = (select arrays.labels from public.college_program_arrays(profile.institution_id) arrays)
  where p_institution_id is null or profile.institution_id = p_institution_id;
  get diagnostics affected = row_count;
  return affected;
end
$function$;

create table public.user_college_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  category text,
  status text not null default 'interested',
  notes text,
  position integer,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_college_list_items_user_institution_key unique (user_id, institution_id),
  constraint user_college_list_items_category_check check (
    category is null or category in ('reach', 'match', 'safety')
  ),
  constraint user_college_list_items_status_check check (
    status in ('interested', 'researching', 'applying', 'applied', 'accepted', 'denied', 'waitlisted', 'enrolled')
  ),
  constraint user_college_list_items_position_check check (position is null or position >= 0)
);

create index user_college_list_items_user_added_idx
  on public.user_college_list_items (user_id, added_at desc);

create or replace function public.touch_user_college_list_item()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end
$function$;

create trigger touch_user_college_list_item
before update on public.user_college_list_items
for each row execute function public.touch_user_college_list_item();

alter table public.college_program_areas enable row level security;
alter table public.user_college_list_items enable row level security;

revoke all on public.college_program_areas, public.user_college_list_items
  from public, anon, authenticated;
grant select, insert, update, delete on public.college_program_areas,
  public.user_college_list_items to service_role;
grant execute on function public.college_program_arrays(uuid),
  public.refresh_college_program_areas(uuid) to service_role;

commit;
