-- Devices table to track active devices/sessions summary
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ua text,
  os text,
  browser text,
  ip_hash text,
  country text,
  last_seen timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists devices_user_last_seen_idx on public.devices(user_id, last_seen desc);

alter table public.devices enable row level security;

drop policy if exists own_devices_select on public.devices;
create policy own_devices_select on public.devices for select
  using ( user_id = auth.uid() );

drop policy if exists own_devices_insert on public.devices;
create policy own_devices_insert on public.devices for insert
  with check ( user_id = auth.uid() );

drop policy if exists own_devices_update on public.devices;
create policy own_devices_update on public.devices for update
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

drop policy if exists own_devices_delete on public.devices;
create policy own_devices_delete on public.devices for delete
  using ( user_id = auth.uid() );

-- Profiles RLS (do not create table; assume exists). Ensure RLS and sane owner-only access.
alter table if exists public.profiles enable row level security;

drop policy if exists own_profiles_select on public.profiles;
create policy own_profiles_select on public.profiles for select
  using ( user_id = auth.uid() );

drop policy if exists own_profiles_update on public.profiles;
create policy own_profiles_update on public.profiles for update
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );


