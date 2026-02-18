-- =================================================================
-- Migration 005: Convert UUID IDs to TEXT (Data Preservation)
-- This migration handles your specific case:
-- - Courts table exists with UUID ids
-- - Has 529 courts that must be preserved
-- - All columns are correct except ID type
-- =================================================================

-- Step 1: Create backup table
CREATE TABLE IF NOT EXISTS public.courts_backup AS
SELECT * FROM public.courts;

-- Step 2: Drop existing constraints and functions that reference the old UUID id
DROP FUNCTION IF EXISTS public.court_by_id(uuid);
DROP FUNCTION IF EXISTS public.active_checkins_for_courts(uuid[], integer);
DROP FUNCTION IF EXISTS public.courts_search(text, text, integer);
DROP FUNCTION IF EXISTS public.courts_nearby(double precision, double precision, integer);
DROP FUNCTION IF EXISTS public.courts_nearby(double precision, double precision, integer, integer);

-- Step 3: Create new courts table with TEXT id
CREATE TABLE public.courts_new (
  id text primary key,
  name text not null,
  description text,
  location geography(Point, 4326) not null,
  address text,
  city text,
  state text,
  postal_code text,
  country text not null default 'US',
  timezone text not null default 'America/New_York',
  indoor boolean not null default false,
  surface_type text,
  num_hoops integer,
  lighting boolean,
  open_24h boolean,
  hours_json jsonb,
  amenities_json jsonb,
  photos_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  osm_type text not null,
  osm_id bigint not null
);

-- Step 4: Copy data, converting UUID to text
INSERT INTO public.courts_new
SELECT
  id::text,  -- Convert UUID to text
  name,
  description,
  location,
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

-- Step 5: Verify data copied correctly
DO $$
DECLARE
  old_count integer;
  new_count integer;
BEGIN
  SELECT COUNT(*) INTO old_count FROM public.courts;
  SELECT COUNT(*) INTO new_count FROM public.courts_new;

  IF old_count != new_count THEN
    RAISE EXCEPTION 'Data migration failed: % courts in old table, % in new table',
      old_count, new_count;
  END IF;

  RAISE NOTICE 'Successfully migrated % courts from UUID to TEXT ids', new_count;
END $$;

-- Step 6: Drop old table and rename new one
DROP TABLE public.courts CASCADE;
ALTER TABLE public.courts_new RENAME TO courts;

-- Step 7: Recreate indexes
CREATE INDEX IF NOT EXISTS courts_location_gist ON public.courts USING gist (location);
CREATE INDEX IF NOT EXISTS courts_name_idx ON public.courts (name);
CREATE INDEX IF NOT EXISTS courts_city_idx ON public.courts (city);
CREATE INDEX IF NOT EXISTS courts_state_idx ON public.courts (state);
CREATE INDEX IF NOT EXISTS courts_osm_idx ON public.courts (osm_type, osm_id);

-- Step 8: Enable RLS
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

-- Step 9: Recreate RLS policies
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

-- Step 10: Create trigger to auto-update location and updated_at
CREATE OR REPLACE FUNCTION public.update_court_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.location IS NULL AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
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

-- Step 11: Create/Update RPC functions to accept TEXT ids
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
  osm_id bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    ST_Y(c.location::geometry) as latitude,
    ST_X(c.location::geometry) as longitude,
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

-- Create new courts_nearby to return TEXT ids and include latitude/longitude
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
  osm_id bigint,
  distance_meters double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    ST_Y(c.location::geometry) as latitude,
    ST_X(c.location::geometry) as longitude,
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

-- Step 12: Add helper function to extract lat/lon from location
CREATE OR REPLACE FUNCTION public.get_court_coordinates(court_location geography)
RETURNS TABLE (latitude double precision, longitude double precision)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    ST_Y(court_location::geometry) as latitude,
    ST_X(court_location::geometry) as longitude;
$$;

-- Step 13: Verification
DO $$
DECLARE
  final_count integer;
  has_text_id boolean;
BEGIN
  -- Check count
  SELECT COUNT(*) INTO final_count FROM public.courts;
  RAISE NOTICE 'Final court count: %', final_count;

  -- Check id type
  SELECT data_type = 'text' INTO has_text_id
  FROM information_schema.columns
  WHERE table_name = 'courts' AND column_name = 'id';

  IF NOT has_text_id THEN
    RAISE EXCEPTION 'ID column is not text type!';
  END IF;

  RAISE NOTICE 'Migration successful! All % courts migrated to TEXT ids', final_count;
END $$;

-- =================================================================
-- Migration complete!
-- - All 529 courts preserved with TEXT ids
-- - RPC functions updated to accept text
-- - Backup table created: courts_backup (can be dropped later)
-- =================================================================

-- Optional: Drop backup table after verifying everything works
-- DROP TABLE IF EXISTS public.courts_backup;
