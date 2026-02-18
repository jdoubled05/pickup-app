-- =================================================================
-- DATABASE DIAGNOSTIC QUERIES
-- Run these in Supabase SQL Editor to check your current setup
-- =================================================================

-- Query 1: Check if courts table exists and see its structure
-- Expected: Should show table with UUID id if 001 migration was applied
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'courts'
ORDER BY ordinal_position;

-- Query 2: Check if any data exists in courts table
-- Expected: May be empty, or have some courts
SELECT COUNT(*) as court_count FROM public.courts;

-- Query 3: Check if check_ins table exists
-- Expected: Should NOT exist yet (we haven't run migration 003)
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'check_ins'
) as check_ins_exists;

-- Query 4: Check which RPC functions exist
-- Expected: May be none if only 001 was run
SELECT
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%court%'
  AND pronamespace = 'public'::regnamespace;

-- Query 5: Check PostGIS extension
-- Expected: Should exist (from 001 migration)
SELECT EXISTS (
    SELECT FROM pg_extension
    WHERE extname = 'postgis'
) as postgis_installed;

-- Query 6: If courts table exists, show sample data structure
-- Expected: Will show what columns actually contain
SELECT * FROM public.courts LIMIT 1;

-- Query 7: Check RLS policies on courts table
-- Expected: Should show courts_public_read and courts_authenticated_write
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'courts';

-- =================================================================
-- RESULT INTERPRETATION:
--
-- If courts table has UUID id:
--   → Old schema exists, need migration strategy A (ALTER)
--
-- If courts table has TEXT id or doesn't exist:
--   → Can run migrations 002, 003, 004 directly
--
-- If courts table has data:
--   → Need to preserve data during migration
--
-- If courts table doesn't exist:
--   → Safe to run all new migrations from scratch
-- =================================================================
