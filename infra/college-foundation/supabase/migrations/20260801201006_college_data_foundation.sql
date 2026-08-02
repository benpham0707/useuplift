begin;

create extension if not exists btree_gist with schema extensions;

create schema if not exists college_ingest;
revoke all on schema college_ingest from public, anon, authenticated;
grant usage on schema college_ingest to service_role;

create table public.data_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  producer_name text not null,
  dataset_name text not null,
  homepage_url text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint data_sources_source_key_format check (source_key ~ '^[a-z0-9][a-z0-9_]*$'),
  constraint data_sources_homepage_https check (homepage_url ~ '^https://')
);

create table public.data_releases (
  id uuid primary key default gen_random_uuid(),
  data_source_id uuid not null references public.data_sources(id) on delete restrict,
  source_release_name text not null,
  release_type text not null,
  source_url text not null,
  source_published_at timestamptz,
  retrieved_at timestamptz not null,
  sha256 text not null,
  object_path text not null,
  schema_version text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint data_releases_release_type_check
    check (release_type in ('preliminary', 'provisional', 'final', 'rolling')),
  constraint data_releases_source_url_https check (source_url ~ '^https://'),
  constraint data_releases_sha256_format check (sha256 ~ '^[a-f0-9]{64}$'),
  constraint data_releases_object_path_check check (length(btrim(object_path)) > 0),
  constraint data_releases_source_sha256_key unique (data_source_id, sha256)
);

create index data_releases_source_published_idx
  on public.data_releases (data_source_id, source_published_at desc nulls last);

create table college_ingest.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.data_releases(id) on delete restrict,
  pipeline_build_id text not null,
  status text not null default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  rows_read bigint not null default 0,
  rows_accepted bigint not null default 0,
  rows_rejected bigint not null default 0,
  error_summary text,
  validation_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ingestion_jobs_release_pipeline_key unique (release_id, pipeline_build_id),
  constraint ingestion_jobs_status_check check (
    status in ('pending', 'downloading', 'validating', 'promoting', 'succeeded', 'failed')
  ),
  constraint ingestion_jobs_counts_nonnegative check (
    rows_read >= 0 and rows_accepted >= 0 and rows_rejected >= 0
  ),
  constraint ingestion_jobs_counts_reconcile check (
    status <> 'succeeded' or rows_read = rows_accepted + rows_rejected
  ),
  constraint ingestion_jobs_time_order check (
    finished_at is null or (started_at is not null and finished_at >= started_at)
  ),
  constraint ingestion_jobs_finished_state check (
    (status in ('succeeded', 'failed')) = (finished_at is not null)
  )
);

create index ingestion_jobs_release_status_idx
  on college_ingest.ingestion_jobs (release_id, status, created_at desc);

create table college_ingest.ingestion_attempts (
  id uuid primary key default gen_random_uuid(),
  ingestion_job_id uuid not null
    references college_ingest.ingestion_jobs(id) on delete restrict,
  attempt_number integer not null,
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  diagnostic_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ingestion_attempts_job_number_key unique (ingestion_job_id, attempt_number),
  constraint ingestion_attempts_number_positive check (attempt_number > 0),
  constraint ingestion_attempts_status_check check (status in ('running', 'succeeded', 'failed')),
  constraint ingestion_attempts_time_order check (finished_at is null or finished_at >= started_at),
  constraint ingestion_attempts_finished_state check (
    (status in ('succeeded', 'failed')) = (finished_at is not null)
  )
);

create index ingestion_attempts_job_started_idx
  on college_ingest.ingestion_attempts (ingestion_job_id, started_at desc);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  unitid integer not null unique,
  official_name text not null,
  status text not null default 'unknown',
  institution_level text not null,
  ownership text not null,
  city text,
  state text,
  zip text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint institutions_unitid_positive check (unitid > 0),
  constraint institutions_official_name_present check (length(btrim(official_name)) > 0),
  constraint institutions_status_check check (status in ('active', 'inactive', 'closed', 'merged', 'unknown')),
  constraint institutions_level_check check (
    institution_level in ('two_year', 'four_year', 'less_than_two_year', 'other')
  ),
  constraint institutions_ownership_check check (
    ownership in ('public', 'private_nonprofit', 'private_for_profit', 'other')
  ),
  constraint institutions_state_format check (state is null or state ~ '^[A-Z]{2}$'),
  constraint institutions_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint institutions_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint institutions_updated_order check (updated_at >= created_at)
);

create index institutions_state_level_ownership_idx
  on public.institutions (state, institution_level, ownership);

create table public.institution_identifiers (
  institution_id uuid not null references public.institutions(id) on delete restrict,
  scheme text not null,
  value text not null,
  valid_from date not null,
  valid_to date,
  source_release_id uuid not null references public.data_releases(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (institution_id, scheme, value, valid_from),
  constraint institution_identifiers_scheme_check
    check (scheme in ('ipeds_unitid', 'opeid', 'scorecard_id', 'custom')),
  constraint institution_identifiers_value_present check (length(btrim(value)) > 0),
  constraint institution_identifiers_date_order check (valid_to is null or valid_to >= valid_from),
  constraint institution_identifiers_release_key
    unique (institution_id, scheme, value, source_release_id),
  constraint institution_identifiers_no_overlap
    exclude using gist (
      scheme with =,
      value with =,
      daterange(valid_from, coalesce(valid_to, 'infinity'::date), '[]') with &&
    )
);

create index institution_identifiers_scheme_value_idx
  on public.institution_identifiers (scheme, value);
create index institution_identifiers_institution_scheme_valid_idx
  on public.institution_identifiers (institution_id, scheme, valid_from desc);
create index institution_identifiers_release_idx
  on public.institution_identifiers (source_release_id);

create table public.institution_relationships (
  parent_institution_id uuid not null references public.institutions(id) on delete restrict,
  child_institution_id uuid not null references public.institutions(id) on delete restrict,
  relationship_type text not null,
  valid_from date not null,
  valid_to date,
  source_release_id uuid not null references public.data_releases(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (parent_institution_id, child_institution_id, relationship_type, valid_from),
  constraint institution_relationships_type_check check (
    relationship_type in ('system_member', 'parent_child_reporting', 'branch_campus', 'merged_into', 'successor')
  ),
  constraint institution_relationships_distinct_check check (parent_institution_id <> child_institution_id),
  constraint institution_relationships_date_order check (valid_to is null or valid_to >= valid_from)
);

create index institution_relationships_child_idx
  on public.institution_relationships (child_institution_id, relationship_type, valid_from desc);
create index institution_relationships_release_idx
  on public.institution_relationships (source_release_id);

create table public.institution_attribute_facts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  attribute_key text not null,
  value_text text,
  value_numeric numeric,
  value_boolean boolean,
  reporting_period_start date,
  reporting_period_end date,
  release_id uuid not null references public.data_releases(id) on delete restrict,
  source_record_locator text not null,
  quality_status text not null default 'provisional',
  created_at timestamptz not null default now(),
  constraint institution_attribute_facts_one_value check (
    num_nonnulls(value_text, value_numeric, value_boolean) = 1
  ),
  constraint institution_attribute_facts_period_order check (
    reporting_period_end is null or
    (reporting_period_start is not null and reporting_period_end >= reporting_period_start)
  ),
  constraint institution_attribute_facts_quality_check check (
    quality_status in ('verified', 'provisional', 'conflicted', 'rejected')
  ),
  constraint institution_attribute_facts_locator_present check (length(btrim(source_record_locator)) > 0),
  constraint institution_attribute_facts_source_key
    unique (institution_id, attribute_key, release_id, source_record_locator)
);

create index institution_attribute_facts_lookup_idx
  on public.institution_attribute_facts
  (institution_id, attribute_key, reporting_period_end desc nulls last, reporting_period_start desc nulls last);
create index institution_attribute_facts_release_idx
  on public.institution_attribute_facts (release_id);

create table public.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  metric_key text not null unique,
  value_type text not null default 'numeric',
  unit text not null,
  minimum_value numeric,
  maximum_value numeric,
  source_precedence jsonb not null,
  student_label text not null,
  cohort_semantics text not null,
  is_student_visible boolean not null default false,
  created_at timestamptz not null default now(),
  constraint metric_definitions_key_format check (metric_key ~ '^[a-z0-9][a-z0-9_]*$'),
  constraint metric_definitions_numeric_only check (value_type = 'numeric'),
  constraint metric_definitions_range_order check (
    minimum_value is null or maximum_value is null or maximum_value >= minimum_value
  ),
  constraint metric_definitions_precedence_array check (jsonb_typeof(source_precedence) = 'array')
);

create table public.institution_metric_facts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete restrict,
  metric_definition_id uuid not null references public.metric_definitions(id) on delete restrict,
  release_id uuid not null references public.data_releases(id) on delete restrict,
  academic_year integer not null,
  cohort_key text not null default 'all',
  value_numeric numeric,
  unit text not null,
  is_suppressed boolean not null default false,
  quality_status text not null default 'provisional',
  source_record_locator text not null,
  created_at timestamptz not null default now(),
  constraint institution_metric_facts_year_range check (academic_year between 1900 and 2200),
  constraint institution_metric_facts_cohort_present check (length(btrim(cohort_key)) > 0),
  constraint institution_metric_facts_value_state check (
    (is_suppressed and value_numeric is null) or
    (not is_suppressed and value_numeric is not null)
  ),
  constraint institution_metric_facts_quality_check check (
    quality_status in ('verified', 'provisional', 'estimated', 'conflicted', 'rejected')
  ),
  constraint institution_metric_facts_locator_present check (length(btrim(source_record_locator)) > 0),
  constraint institution_metric_facts_source_key unique (
    institution_id, metric_definition_id, release_id, academic_year, cohort_key
  )
);

create index institution_metric_facts_lookup_idx
  on public.institution_metric_facts
  (institution_id, metric_definition_id, academic_year desc, cohort_key);
create index institution_metric_facts_release_idx
  on public.institution_metric_facts (release_id);
create index institution_metric_facts_definition_idx
  on public.institution_metric_facts (metric_definition_id);

create table public.data_quality_issues (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete restrict,
  release_id uuid not null references public.data_releases(id) on delete restrict,
  issue_type text not null,
  severity text not null,
  field_key text,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint data_quality_issues_type_check check (
    issue_type in ('identity_conflict', 'range_error', 'source_conflict', 'missing_required', 'unexpected_schema', 'stale_source')
  ),
  constraint data_quality_issues_severity_check check (severity in ('info', 'warning', 'blocking')),
  constraint data_quality_issues_status_check check (status in ('open', 'acknowledged', 'resolved', 'accepted')),
  constraint data_quality_issues_resolution_state check (
    (status in ('resolved', 'accepted')) = (resolved_at is not null)
  ),
  constraint data_quality_issues_resolution_order check (resolved_at is null or resolved_at >= created_at)
);

create index data_quality_issues_release_severity_status_idx
  on public.data_quality_issues (release_id, severity, status);
create index data_quality_issues_institution_idx
  on public.data_quality_issues (institution_id) where institution_id is not null;

create table public.projection_versions (
  id uuid primary key default gen_random_uuid(),
  projection_build_id text not null unique,
  field_manifest_version text not null,
  status text not null default 'building',
  row_count bigint not null default 0,
  build_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  activated_at timestamptz,
  retired_at timestamptz,
  constraint projection_versions_status_check check (
    status in ('building', 'validated', 'active', 'retired', 'failed')
  ),
  constraint projection_versions_row_count_nonnegative check (row_count >= 0),
  constraint projection_versions_validated_state check (
    status in ('building', 'failed') or validated_at is not null
  ),
  constraint projection_versions_activated_state check (
    status not in ('active', 'retired') or activated_at is not null
  ),
  constraint projection_versions_retired_state check (
    status <> 'retired' or retired_at is not null
  ),
  constraint projection_versions_time_order check (
    (validated_at is null or validated_at >= created_at) and
    (activated_at is null or (validated_at is not null and activated_at >= validated_at)) and
    (retired_at is null or (activated_at is not null and retired_at >= activated_at))
  )
);

create table public.projection_version_releases (
  projection_version_id uuid not null references public.projection_versions(id) on delete restrict,
  release_id uuid not null references public.data_releases(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (projection_version_id, release_id)
);

create index projection_version_releases_release_idx
  on public.projection_version_releases (release_id);

create table public.projection_control (
  singleton boolean primary key default true,
  active_projection_version_id uuid references public.projection_versions(id) on delete restrict,
  updated_at timestamptz not null default now(),
  constraint projection_control_singleton check (singleton)
);

insert into public.projection_control (singleton) values (true);

create table public.college_profiles (
  projection_version_id uuid not null references public.projection_versions(id) on delete restrict,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  unitid integer not null,
  name text not null,
  normalized_name text not null,
  slug text not null,
  aliases text[] not null default '{}'::text[],
  city text,
  state text,
  zip text,
  ownership text not null,
  institution_level text not null,
  setting text,
  undergraduate_enrollment integer,
  admission_rate numeric,
  tuition_in_state numeric,
  tuition_out_of_state numeric,
  net_price numeric,
  coverage_score numeric not null default 0,
  generated_at timestamptz not null default now(),
  search_document tsvector not null,
  primary key (projection_version_id, institution_id),
  constraint college_profiles_version_slug_key unique (projection_version_id, slug),
  constraint college_profiles_version_unitid_key unique (projection_version_id, unitid),
  constraint college_profiles_unitid_positive check (unitid > 0),
  constraint college_profiles_name_present check (length(btrim(name)) > 0),
  constraint college_profiles_normalized_name_present check (length(btrim(normalized_name)) > 0),
  constraint college_profiles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint college_profiles_enrollment_nonnegative check (
    undergraduate_enrollment is null or undergraduate_enrollment >= 0
  ),
  constraint college_profiles_admission_rate_range check (
    admission_rate is null or admission_rate between 0 and 1
  ),
  constraint college_profiles_tuition_nonnegative check (
    (tuition_in_state is null or tuition_in_state >= 0) and
    (tuition_out_of_state is null or tuition_out_of_state >= 0) and
    (net_price is null or net_price >= 0)
  ),
  constraint college_profiles_coverage_range check (coverage_score between 0 and 1)
);

create index college_profiles_search_idx on public.college_profiles using gin (search_document);
create index college_profiles_version_name_idx
  on public.college_profiles (projection_version_id, normalized_name, institution_id);
create index college_profiles_version_filters_idx
  on public.college_profiles (projection_version_id, state, institution_level, ownership);
create index college_profiles_institution_idx on public.college_profiles (institution_id);

create table public.college_profile_facts (
  projection_version_id uuid not null,
  institution_id uuid not null,
  field_key text not null,
  display_value text,
  source_name text,
  source_release text,
  period_start date,
  period_end date,
  academic_year integer,
  cohort_key text,
  cohort_label text,
  quality_status text not null,
  is_estimate boolean not null default false,
  is_suppressed boolean not null default false,
  retrieved_at timestamptz,
  source_record_locator text,
  metric_fact_id uuid references public.institution_metric_facts(id) on delete restrict,
  attribute_fact_id uuid references public.institution_attribute_facts(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (projection_version_id, institution_id, field_key),
  foreign key (projection_version_id, institution_id)
    references public.college_profiles(projection_version_id, institution_id) on delete restrict,
  constraint college_profile_facts_quality_check check (
    quality_status in ('verified', 'provisional', 'estimated', 'suppressed', 'conflicted', 'rejected')
  ),
  constraint college_profile_facts_selection_state check (
    (quality_status = 'conflicted' and display_value is null and metric_fact_id is null and attribute_fact_id is null)
    or
    (quality_status <> 'conflicted' and num_nonnulls(metric_fact_id, attribute_fact_id) = 1)
  ),
  constraint college_profile_facts_suppression_state check (
    not is_suppressed or display_value is null
  ),
  constraint college_profile_facts_period_order check (
    period_end is null or (period_start is not null and period_end >= period_start)
  )
);

create index college_profile_facts_metric_idx
  on public.college_profile_facts (metric_fact_id) where metric_fact_id is not null;
create index college_profile_facts_attribute_idx
  on public.college_profile_facts (attribute_fact_id) where attribute_fact_id is not null;

create table public.college_profile_fact_candidates (
  projection_version_id uuid not null,
  institution_id uuid not null,
  field_key text not null,
  candidate_ordinal integer not null,
  metric_fact_id uuid references public.institution_metric_facts(id) on delete restrict,
  attribute_fact_id uuid references public.institution_attribute_facts(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (projection_version_id, institution_id, field_key, candidate_ordinal),
  foreign key (projection_version_id, institution_id, field_key)
    references public.college_profile_facts(projection_version_id, institution_id, field_key) on delete restrict,
  constraint college_profile_fact_candidates_ordinal_positive check (candidate_ordinal > 0),
  constraint college_profile_fact_candidates_one_fact check (
    num_nonnulls(metric_fact_id, attribute_fact_id) = 1
  )
);

create index college_profile_fact_candidates_metric_idx
  on public.college_profile_fact_candidates (metric_fact_id) where metric_fact_id is not null;
create index college_profile_fact_candidates_attribute_idx
  on public.college_profile_fact_candidates (attribute_fact_id) where attribute_fact_id is not null;

create table public.institution_lookup (
  projection_version_id uuid not null references public.projection_versions(id) on delete restrict,
  slug text not null,
  institution_id uuid not null references public.institutions(id) on delete restrict,
  canonical_slug text not null,
  aliases text[] not null default '{}'::text[],
  known_status text not null,
  search_document tsvector not null,
  created_at timestamptz not null default now(),
  primary key (projection_version_id, slug),
  constraint institution_lookup_status_check check (
    known_status in ('active', 'inactive', 'closed', 'merged', 'unknown')
  ),
  constraint institution_lookup_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint institution_lookup_canonical_slug_format check (
    canonical_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  )
);

create index institution_lookup_search_idx on public.institution_lookup using gin (search_document);
create index institution_lookup_institution_idx
  on public.institution_lookup (institution_id, projection_version_id);

alter table public.data_sources enable row level security;
alter table public.data_releases enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_identifiers enable row level security;
alter table public.institution_relationships enable row level security;
alter table public.institution_attribute_facts enable row level security;
alter table public.metric_definitions enable row level security;
alter table public.institution_metric_facts enable row level security;
alter table public.data_quality_issues enable row level security;
alter table public.projection_versions enable row level security;
alter table public.projection_version_releases enable row level security;
alter table public.projection_control enable row level security;
alter table public.college_profiles enable row level security;
alter table public.college_profile_facts enable row level security;
alter table public.college_profile_fact_candidates enable row level security;
alter table public.institution_lookup enable row level security;
alter table college_ingest.ingestion_jobs enable row level security;
alter table college_ingest.ingestion_attempts enable row level security;

revoke all on all tables in schema college_ingest from public, anon, authenticated;
revoke all on public.data_sources, public.data_releases, public.institutions,
  public.institution_identifiers, public.institution_relationships,
  public.institution_attribute_facts, public.metric_definitions,
  public.institution_metric_facts, public.data_quality_issues,
  public.projection_versions, public.projection_version_releases,
  public.projection_control, public.college_profiles, public.college_profile_facts,
  public.college_profile_fact_candidates, public.institution_lookup
from public, anon, authenticated;

revoke all on all tables in schema college_ingest from service_role;
revoke all on public.data_sources, public.data_releases, public.institutions,
  public.institution_identifiers, public.institution_relationships,
  public.institution_attribute_facts, public.metric_definitions,
  public.institution_metric_facts, public.data_quality_issues,
  public.projection_versions, public.projection_version_releases,
  public.projection_control, public.college_profiles, public.college_profile_facts,
  public.college_profile_fact_candidates, public.institution_lookup
from service_role;

grant select, insert, update on college_ingest.ingestion_jobs,
  college_ingest.ingestion_attempts to service_role;

grant select, insert on public.data_sources, public.data_releases,
  public.institution_identifiers, public.institution_relationships,
  public.institution_attribute_facts, public.metric_definitions,
  public.institution_metric_facts, public.data_quality_issues
to service_role;

grant select, insert, update on public.institutions to service_role;
grant select, insert, update, delete on public.projection_versions,
  public.projection_version_releases, public.projection_control,
  public.college_profiles, public.college_profile_facts,
  public.college_profile_fact_candidates, public.institution_lookup
to service_role;

alter default privileges in schema college_ingest revoke all on tables from public, anon, authenticated;
alter default privileges in schema college_ingest grant select, insert, update on tables to service_role;

commit;
