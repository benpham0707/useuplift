-- Milestone 1 remote schema inventory.
-- READ ONLY: this file must contain SELECT/SHOW statements only.

select
  current_database() as database_name,
  current_user as connected_role,
  current_setting('server_version') as postgres_version,
  current_setting('transaction_read_only') as transaction_read_only;

select
  n.nspname as schema_name,
  c.relname as relation_name,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned_table'
    when 'v' then 'view'
    when 'm' then 'materialized_view'
    when 'S' then 'sequence'
    else c.relkind::text
  end as relation_type,
  c.reltuples::bigint as estimated_rows,
  c.relrowsecurity as rls_enabled,
  pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname in ('public', 'storage')
  and c.relkind in ('r', 'p', 'v', 'm', 'S')
order by n.nspname, c.relname;

select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and (
    table_name ilike '%college%'
    or table_name ilike '%institution%'
    or table_name in ('user_college_list', 'college_reports')
  )
order by table_name, ordinal_position;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname in ('public', 'storage')
  and (
    schemaname = 'storage'
    or tablename ilike '%college%'
    or tablename ilike '%institution%'
    or tablename in ('user_college_list', 'college_reports')
  )
order by schemaname, tablename, policyname;

select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  case when p.prosecdef then 'definer' else 'invoker' end as security,
  pg_get_userbyid(p.proowner) as owner
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind in ('f', 'p')
  and (
    p.proname ilike '%college%'
    or p.proname ilike '%institution%'
    or pg_get_functiondef(p.oid) ilike '%college%'
    or pg_get_functiondef(p.oid) ilike '%institution%'
  )
order by p.proname, arguments;

select
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname as constraint_name,
  case con.contype
    when 'p' then 'primary_key'
    when 'f' then 'foreign_key'
    when 'u' then 'unique'
    when 'c' then 'check'
    else con.contype::text
  end as constraint_type,
  pg_get_constraintdef(con.oid, true) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and (
    c.relname ilike '%college%'
    or c.relname ilike '%institution%'
    or pg_get_constraintdef(con.oid, true) ilike '%college%'
    or pg_get_constraintdef(con.oid, true) ilike '%institution%'
  )
order by c.relname, con.conname;

select
  b.id as bucket_id,
  b.name,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types,
  count(o.id) as object_count,
  coalesce(sum((o.metadata ->> 'size')::bigint), 0) as recorded_bytes
from storage.buckets b
left join storage.objects o on o.bucket_id = b.id
group by b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types
order by b.id;
