\set ON_ERROR_STOP on

begin;

\i supabase/migrations/20260802080008_backup_legacy_college_catalog_before_normalized_cutover.sql
\i supabase/migrations/20260802082808_retire_legacy_college_rows_after_normalized_cutover.sql
\i supabase/migrations/20260802083129_ensure_college_source_releases_bucket.sql

do $assertions$
declare
  bucket_is_private boolean;
begin
  if to_regnamespace('college_legacy_backup') is not null then
    raise exception 'transient legacy backup schema was not retired';
  end if;
  if to_regclass('storage.buckets') is not null then
    execute $query$
      select exists (
        select 1 from storage.buckets
        where id = 'college-source-releases' and not public
      )
    $query$ into bucket_is_private;
    if not bucket_is_private then
      raise exception 'private college source bucket was not created';
    end if;
  end if;
end
$assertions$;

rollback;

select 'cutover_migration_replay=passed';
