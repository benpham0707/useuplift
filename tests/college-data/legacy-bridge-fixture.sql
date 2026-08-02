\set ON_ERROR_STOP on

create table public.user_college_list (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  college_id uuid,
  created_at timestamptz not null default now()
);

create table public.college_reports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  college_id uuid,
  created_at timestamptz not null default now()
);

insert into public.user_college_list (user_id) values ('legacy-user');
insert into public.college_reports (user_id) values ('legacy-user');
