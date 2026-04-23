create table if not exists public.share_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('share', 'unfurl')),
  path text not null,
  resource_type text,
  resource_slug text,
  platform text,
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists share_events_path_idx on public.share_events(path);
create index if not exists share_events_event_type_idx on public.share_events(event_type);
create index if not exists share_events_created_at_idx on public.share_events(created_at desc);
create index if not exists share_events_user_id_idx on public.share_events(user_id) where user_id is not null;

alter table public.share_events enable row level security;

create policy "Anyone can insert share events"
  on public.share_events for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read all share events"
  on public.share_events for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));