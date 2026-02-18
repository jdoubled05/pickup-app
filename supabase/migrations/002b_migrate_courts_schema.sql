-- =================================================================
-- Migration 002b: Migrate existing courts schema to match app
-- This is an ALTER migration that updates the existing table from 001
-- =================================================================

-- NOTE: This migration assumes courts table exists from 001_create_courts.sql
-- If you're starting fresh, use 002_update_courts_schema.sql instead

-- Step 1: Add missing columns
ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS indoor boolean,
  ADD COLUMN IF NOT EXISTS open_24h boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hours_json jsonb,
  ADD COLUMN IF NOT EXISTS amenities_json jsonb,
  ADD COLUMN IF NOT EXISTS photos_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS osm_type text,
  ADD COLUMN IF NOT EXISTS osm_id text;

-- Step 2: Rename columns to match app expectations
ALTER TABLE public.courts
  RENAME COLUMN number_of_hoops TO num_hoops;

ALTER TABLE public.courts
  RENAME COLUMN geom TO location;

-- Step 3: Migrate court_type to indoor (if data exists)
-- court_type might be 'indoor' or 'outdoor'
UPDATE public.courts
SET indoor = (court_type = 'indoor')
WHERE court_type IS NOT NULL AND indoor IS NULL;

-- Step 4: Migrate open_hours to hours_json (if data exists)
-- Try to parse open_hours as JSON if it looks like JSON, otherwise store as string
UPDATE public.courts
SET hours_json =
  CASE
    WHEN open_hours IS NOT NULL AND open_hours ~ '^\{.*\}$' THEN
      open_hours::jsonb
    WHEN open_hours IS NOT NULL THEN
      jsonb_build_object('hours', open_hours)
    ELSE NULL
  END
WHERE open_hours IS NOT NULL AND hours_json IS NULL;

-- Step 5: Change id from UUID to text
-- This is the trickiest part - we need to preserve relationships

-- First, check if there's any data to preserve
DO $$
DECLARE
  row_count integer;
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.courts;

  IF row_count > 0 THEN
    RAISE NOTICE 'Found % courts to migrate. Converting IDs from UUID to TEXT...', row_count;

    -- Create temporary table with new schema
    CREATE TEMP TABLE courts_temp AS
    SELECT
      id::text as id,  -- Convert UUID to text
      name,
      description,
      location,
      latitude,
      longitude,
      address,
      city,
      state,
      postal_code,
      country,
      timezone,
      indoor,
      surface_type,
      num_hoops,
      lighting,
      open_24h,
      hours_json,
      amenities_json,
      photos_count,
      created_at,
      updated_at,
      osm_type,
      osm_id
    FROM public.courts;

    -- Drop and recreate the table with correct schema
    DROP TABLE public.courts CASCADE;

    CREATE TABLE public.courts (
      id text primary key,
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

    -- Restore data
    INSERT INTO public.courts SELECT * FROM courts_temp;

    RAISE NOTICE 'Successfully migrated % courts', row_count;
  ELSE
    RAISE NOTICE 'No existing courts found. Creating new table with correct schema...';

    -- No data to preserve, just recreate with new schema
    DROP TABLE IF EXISTS public.courts CASCADE;

    CREATE TABLE public.courts (
      id text primary key,
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
  END IF;
END $$;

-- Step 6: Recreate indexes
CREATE INDEX IF NOT EXISTS courts_location_gist ON public.courts USING gist (location);
CREATE INDEX IF NOT EXISTS courts_name_idx ON public.courts (name);
CREATE INDEX IF NOT EXISTS courts_city_idx ON public.courts (city);
CREATE INDEX IF NOT EXISTS courts_state_idx ON public.courts (state);

-- Step 7: Enable RLS
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Step 8: Recreate policies
DROP POLICY IF EXISTS "courts_public_read" ON public.courts;
DROP POLICY IF EXISTS "courts_authenticated_write" ON public.courts;

CREATE POLICY "Courts are viewable by everyone"
  ON public.courts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert courts"
  ON public.courts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update courts"
  ON public.courts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 9: Create trigger to auto-update location from lat/lon
CREATE OR REPLACE FUNCTION public.update_court_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_court_location_trigger ON public.courts;
CREATE TRIGGER update_court_location_trigger
  BEFORE INSERT OR UPDATE ON public.courts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_court_location();

-- Step 10: Update existing rows to populate location field
UPDATE public.courts
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Step 11: Create RPC functions
CREATE OR REPLACE FUNCTION public.courts_nearby(
  lat double precision,
  lon double precision,
  radius_meters integer DEFAULT 50000,
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
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
LANGUAGE sql
STABLE
AS $$
  SELECT
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
  FROM public.courts c
  WHERE ST_DWithin(
    c.location,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.court_by_id(court_id text)
RETURNS TABLE (
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
LANGUAGE sql
STABLE
AS $$
  SELECT
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
  FROM public.courts c
  WHERE c.id = court_id
  LIMIT 1;
$$;

-- =================================================================
-- Migration complete!
-- The courts table now matches the app's expected schema
-- =================================================================
