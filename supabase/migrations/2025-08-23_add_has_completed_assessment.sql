-- Add a boolean flag to indicate if the user finished the starting assessment
alter table if exists public.profiles
  add column if not exists has_completed_assessment boolean not null default false;

-- Optional: backfill existing rows to false (redundant due to default + not null)
update public.profiles set has_completed_assessment = coalesce(has_completed_assessment, false);

-- Helpful index for queries by user state
create index if not exists profiles_has_completed_assessment_idx
  on public.profiles (has_completed_assessment);

