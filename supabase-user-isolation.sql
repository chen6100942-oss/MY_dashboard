-- User isolation for the main dashboard and profiles.
-- Run once in Supabase Dashboard -> SQL Editor.

alter table public.dashboard_data enable row level security;

-- Policies are permissive in PostgreSQL, so one old broad policy could bypass
-- all new restrictions. Remove every existing policy before recreating the
-- exact owner-only set below.
do $$
declare policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'dashboard_data'
  loop
    execute format('drop policy if exists %I on public.dashboard_data', policy_row.policyname);
  end loop;
end $$;

create policy "Users read their own dashboard"
  on public.dashboard_data for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert their own dashboard"
  on public.dashboard_data for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update their own dashboard"
  on public.dashboard_data for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete their own dashboard"
  on public.dashboard_data for delete
  to authenticated
  using (auth.uid() = user_id);

alter table public.profiles enable row level security;

do $$
declare policy_row record;
begin
  for policy_row in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_row.policyname);
  end loop;
end $$;

create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);
