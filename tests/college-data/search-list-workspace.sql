\set ON_ERROR_STOP on

begin;

do $assert_schema$
begin
  if to_regclass('public.college_program_areas') is null then
    raise exception 'college_program_areas is missing';
  end if;
  if to_regclass('public.user_college_list_items') is null then
    raise exception 'user_college_list_items is missing';
  end if;
end
$assert_schema$;

insert into public.data_sources (id, source_key, producer_name, dataset_name, homepage_url)
values ('71000000-0000-4000-8000-000000000001', 'workspace_fixture', 'NCES', 'Fixture completions', 'https://nces.ed.gov')
on conflict do nothing;
insert into public.data_releases (id, data_source_id, source_release_name, release_type, source_url, retrieved_at, sha256, object_path, schema_version)
values ('71000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000001', 'fixture-2023', 'final', 'https://nces.ed.gov/fixture', now(), repeat('a', 64), 'fixture/programs.zip', '2023')
on conflict do nothing;
insert into public.institutions (id, unitid, official_name, status, institution_level, ownership)
values ('71000000-0000-4000-8000-000000000003', 971000, 'Workspace Fixture University', 'active', 'four_year', 'public')
on conflict do nothing;
insert into public.projection_versions (id, projection_build_id, field_manifest_version, status)
values ('71000000-0000-4000-8000-000000000004', 'workspace-fixture', 'workspace-fixture', 'building')
on conflict do nothing;
insert into public.college_program_areas (institution_id, release_id, academic_year, cip_area_code, cip_area_label, completions)
values ('71000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000002', 2023, '11', 'Computer Science', 12);
insert into public.college_profiles (
  projection_version_id, institution_id, unitid, name, normalized_name, slug,
  ownership, institution_level, undergraduate_enrollment, net_price,
  coverage_score, search_document
) values (
  '71000000-0000-4000-8000-000000000004', '71000000-0000-4000-8000-000000000003',
  971000, 'Workspace Fixture University', 'workspace fixture university', 'workspace-fixture-university',
  'public', 'four_year', 4200, 21000, 0.5, to_tsvector('simple', 'Workspace Fixture University')
);

do $assert_program_projection$
begin
  if not exists (
    select 1 from public.college_profiles
    where institution_id = '71000000-0000-4000-8000-000000000003'
      and program_area_codes = array['11']::text[]
      and program_area_labels = array['Computer Science']::text[]
  ) then
    raise exception 'program areas were not projected';
  end if;
end
$assert_program_projection$;

insert into public.user_college_list_items (user_id, institution_id)
values ('user_workspace_fixture', '71000000-0000-4000-8000-000000000003');

do $assert_list_defaults$
begin
  if not exists (
    select 1 from public.user_college_list_items
    where user_id = 'user_workspace_fixture' and category is null and status = 'interested'
  ) then
    raise exception 'saved-list defaults are incorrect';
  end if;
  begin
    insert into public.user_college_list_items (user_id, institution_id)
    values ('user_workspace_fixture', '71000000-0000-4000-8000-000000000003');
    raise exception 'duplicate saved item was accepted';
  exception when unique_violation then null;
  end;
  begin
    update public.user_college_list_items set category = 'calculated_match'
    where user_id = 'user_workspace_fixture';
    raise exception 'invalid category was accepted';
  exception when check_violation then null;
  end;
end
$assert_list_defaults$;

rollback;
select 'search_list_workspace=passed';
