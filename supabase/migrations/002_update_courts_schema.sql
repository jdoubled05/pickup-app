-- Migration: Update courts table to match app schema
-- This aligns the database with the Court TypeScript type

-- Drop old table if exists (only safe for development)
-- Comment this out if you have production data
-- drop table if exists public.courts cascade;

-- Recreate courts table with correct schema
create table if not exists public.courts (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  location geography(Point, 4326),
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  state text,
  postal_code text,
  country text default 'US',
  timezone text default 'America/New_York',
  indoor boolean,
  surface_type text,
  num_hoops integer,
  lighting boolean,
  open_24h boolean default false,
  hours_json jsonb,
  amenities_json jsonb,
  photos_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  osm_type text,
  osm_id text
);

-- Create indexes
create index if not exists courts_location_gist on public.courts using gist (location);
create index if not exists courts_name_idx on public.courts (name);
create index if not exists courts_city_idx on public.courts (city);
create index if not exists courts_state_idx on public.courts (state);

-- Enable RLS
alter table public.courts enable row level security;

-- RLS Policies
create policy "Courts are viewable by everyone"
  on public.courts
  for select
  using (true);

create policy "Authenticated users can insert courts"
  on public.courts
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update courts"
  on public.courts
  for update
  to authenticated
  using (true)
  with check (true);

-- Function to automatically update location from lat/lon
create or replace function public.update_court_location()
returns trigger as $$
begin
  if NEW.latitude is not null and NEW.longitude is not null then
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  end if;
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- Trigger to update location automatically
drop trigger if exists update_court_location_trigger on public.courts;
create trigger update_court_location_trigger
  before insert or update on public.courts
  for each row
  execute function public.update_court_location();

-- Function to get courts nearby
create or replace function public.courts_nearby(
  lat double precision,
  lon double precision,
  radius_meters integer default 50000,
  limit_count integer default 100
)
returns table (
  id text,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  timezone text,
  indoor boolean,
  surface_type text,
  num_hoops integer,
  lighting boolean,
  open_24h boolean,
  hours_json jsonb,
  amenities_json jsonb,
  photos_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  osm_type text,
  osm_id text,
  distance_meters double precision
)
language sql
stable
as $$
  select
    c.id,
    c.name,
    c.description,
    c.latitude,
    c.longitude,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.timezone,
    c.indoor,
    c.surface_type,
    c.num_hoops,
    c.lighting,
    c.open_24h,
    c.hours_json,
    c.amenities_json,
    c.photos_count,
    c.created_at,
    c.updated_at,
    c.osm_type,
    c.osm_id,
    ST_Distance(
      c.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) as distance_meters
  from public.courts c
  where ST_DWithin(
    c.location,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters
  limit limit_count;
$$;

-- Function to get court by ID
create or replace function public.court_by_id(court_id text)
returns table (
  id text,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  address text,
  city text,
  state text,
  postal_code text,
  country text,
  timezone text,
  indoor boolean,
  surface_type text,
  num_hoops integer,
  lighting boolean,
  open_24h boolean,
  hours_json jsonb,
  amenities_json jsonb,
  photos_count integer,
  created_at timestamptz,
  updated_at timestamptz,
  osm_type text,
  osm_id text
)
language sql
stable
as $$
  select
    c.id,
    c.name,
    c.description,
    c.latitude,
    c.longitude,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.timezone,
    c.indoor,
    c.surface_type,
    c.num_hoops,
    c.lighting,
    c.open_24h,
    c.hours_json,
    c.amenities_json,
    c.photos_count,
    c.created_at,
    c.updated_at,
    c.osm_type,
    c.osm_id
  from public.courts c
  where c.id = court_id
  limit 1;
$$;
