-- =================================================================
-- Migration 008: Add court source tracking
--
-- The actual DB schema already has:
--   - latitude / longitude as real columns (trigger populates location from them)
--   - osm_type / osm_id as nullable text
--   - is_free / is_public / full_court columns
--
-- This migration only adds what's missing:
--   1. source text      — tracks data origin: 'osm' | 'google' | 'manual'
--   2. google_place_id  — Google Places place_id for dedup and attribution
--   3. Updates court_by_id and courts_nearby RPCs to expose the new columns
--      plus existing columns (is_free, is_public, full_court) that were
--      never added to the RPC return types
-- =================================================================

-- 1. Add missing columns
ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS source          text DEFAULT 'osm',
  ADD COLUMN IF NOT EXISTS google_place_id text;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS courts_google_place_id_idx
  ON public.courts (google_place_id)
  WHERE google_place_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS courts_source_idx
  ON public.courts (source);

-- 3. Backfill source for existing rows
UPDATE public.courts
  SET source = 'osm'
  WHERE source IS NULL AND osm_type IS NOT NULL;

UPDATE public.courts
  SET source = 'manual'
  WHERE source IS NULL;

-- 4. Update court_by_id to expose all relevant columns
--    Note: latitude/longitude are real columns; location is derived by trigger.
DROP FUNCTION IF EXISTS public.court_by_id(text);
CREATE OR REPLACE FUNCTION public.court_by_id(court_id text)
RETURNS TABLE (
  id               text,
  name             text,
  description      text,
  latitude         double precision,
  longitude        double precision,
  address          text,
  city             text,
  state            text,
  postal_code      text,
  country          text,
  timezone         text,
  indoor           boolean,
  full_court       boolean,
  surface_type     text,
  num_hoops        integer,
  lighting         boolean,
  open_24h         boolean,
  is_free          boolean,
  is_public        boolean,
  hours_json       jsonb,
  amenities_json   jsonb,
  photos_count     integer,
  created_at       timestamptz,
  updated_at       timestamptz,
  osm_type         text,
  osm_id           text,
  source           text,
  google_place_id  text
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
    c.full_court,
    c.surface_type,
    c.num_hoops,
    c.lighting,
    c.open_24h,
    c.is_free,
    c.is_public,
    c.hours_json,
    c.amenities_json,
    c.photos_count,
    c.created_at,
    c.updated_at,
    c.osm_type,
    c.osm_id,
    c.source,
    c.google_place_id
  FROM public.courts c
  WHERE c.id = court_id
  LIMIT 1;
$$;

-- 5. Update courts_nearby to expose all relevant columns
DROP FUNCTION IF EXISTS public.courts_nearby(double precision, double precision, integer, integer);
CREATE OR REPLACE FUNCTION public.courts_nearby(
  lat            double precision,
  lon            double precision,
  radius_meters  integer DEFAULT 50000,
  limit_count    integer DEFAULT 100
)
RETURNS TABLE (
  id               text,
  name             text,
  description      text,
  latitude         double precision,
  longitude        double precision,
  address          text,
  city             text,
  state            text,
  postal_code      text,
  country          text,
  timezone         text,
  indoor           boolean,
  full_court       boolean,
  surface_type     text,
  num_hoops        integer,
  lighting         boolean,
  open_24h         boolean,
  is_free          boolean,
  is_public        boolean,
  hours_json       jsonb,
  amenities_json   jsonb,
  photos_count     integer,
  created_at       timestamptz,
  updated_at       timestamptz,
  osm_type         text,
  osm_id           text,
  source           text,
  google_place_id  text,
  distance_meters  double precision
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
    c.full_court,
    c.surface_type,
    c.num_hoops,
    c.lighting,
    c.open_24h,
    c.is_free,
    c.is_public,
    c.hours_json,
    c.amenities_json,
    c.photos_count,
    c.created_at,
    c.updated_at,
    c.osm_type,
    c.osm_id,
    c.source,
    c.google_place_id,
    ST_Distance(
      c.location,
      ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
    ) AS distance_meters
  FROM public.courts c
  WHERE ST_DWithin(
    c.location,
    ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography,
    radius_meters
  )
  ORDER BY distance_meters
  LIMIT limit_count;
$$;

-- =================================================================
-- Migration complete.
-- Run scripts in order:
--   npm run import-courts -- --city="atlanta" --metro
--   npm run import-google-courts
-- =================================================================
