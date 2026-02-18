-- Migration: Create check_ins table for real-time court activity tracking
-- This enables the core differentiator feature: seeing who's at courts right now

-- Create check_ins table
create table if not exists public.check_ins (
  id uuid primary key default gen_random_uuid(),
  court_id text not null references public.courts(id) on delete cascade,
  anonymous_user_id text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 hours')
);

-- Create indexes for performance
create index if not exists check_ins_court_id_idx on public.check_ins(court_id);
create index if not exists check_ins_expires_at_idx on public.check_ins(expires_at);
create index if not exists check_ins_anonymous_user_id_idx on public.check_ins(anonymous_user_id);

-- Composite index for common queries (court + expiry together)
-- Note: No partial index with now() as it's not immutable
create index if not exists check_ins_court_expires_idx
  on public.check_ins(court_id, expires_at);

-- Enable Row Level Security
alter table public.check_ins enable row level security;

-- RLS Policies
-- Drop existing policies first to make this migration idempotent
drop policy if exists "Check-ins are viewable by everyone" on public.check_ins;
drop policy if exists "Anyone can create check-ins" on public.check_ins;
drop policy if exists "Anyone can delete check-ins" on public.check_ins;

-- Anyone can view check-ins (public data)
create policy "Check-ins are viewable by everyone"
  on public.check_ins
  for select
  using (true);

-- Anyone can create check-ins (anonymous users)
create policy "Anyone can create check-ins"
  on public.check_ins
  for insert
  with check (true);

-- Anyone can delete check-ins (since we're anonymous for MVP)
-- In production, you'd want to restrict this to the user who created it
create policy "Anyone can delete check-ins"
  on public.check_ins
  for delete
  using (true);

-- Enable Realtime for check_ins
-- This allows the app to receive live updates when check-ins change
-- Only add if not already in publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and tablename = 'check_ins'
  ) then
    alter publication supabase_realtime add table public.check_ins;
  end if;
end $$;

-- Helper function to get active check-ins count for a court
create or replace function public.get_active_checkins_count(p_court_id text)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.check_ins
  where court_id = p_court_id
    and expires_at > now();
$$;

-- Helper function to clean up expired check-ins
-- Run this periodically via cron job or pg_cron
create or replace function public.delete_expired_checkins()
returns integer
language plpgsql
as $$
declare
  deleted_count integer;
begin
  delete from public.check_ins
  where expires_at < now();

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Comments for documentation
comment on table public.check_ins is 'Tracks real-time user check-ins at basketball courts. Check-ins expire after 3 hours.';
comment on column public.check_ins.court_id is 'Reference to the court where the user checked in';
comment on column public.check_ins.anonymous_user_id is 'Anonymous identifier for the user (device-based, no authentication required)';
comment on column public.check_ins.expires_at is 'When this check-in automatically expires (default: 3 hours from creation)';
