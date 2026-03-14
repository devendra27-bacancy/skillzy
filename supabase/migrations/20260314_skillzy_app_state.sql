create table if not exists public.skillzy_app_state (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.skillzy_app_state enable row level security;

create policy "service role full access on app state"
on public.skillzy_app_state
as permissive
for all
to service_role
using (true)
with check (true);
