create extension if not exists pgcrypto;
create extension if not exists postgis;

create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  court_type text,
  surface_type text,
  number_of_hoops integer,
  lighting boolean,
  open_hours text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  geom geography(Point, 4326)
);

-- Note: Spatial index creation moved to migration 002 which uses updated 'location' column
-- create index if not exists courts_geom_gist on public.courts using gist (geom);
create index if not exists courts_name_idx on public.courts (name);

alter table public.courts enable row level security;

create policy "courts_public_read"
  on public.courts
  for select
  using (true);

create policy "courts_authenticated_write"
  on public.courts
  for all
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
