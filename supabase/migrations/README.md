# Supabase Migrations

This directory contains all database migrations for the Pickup app.

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `001_create_courts.sql` | Initial courts table (legacy) | ⚠️ Replaced by 002 |
| `002_update_courts_schema.sql` | Updated courts schema matching app | ✅ Ready |
| `003_create_checkins.sql` | Check-ins table with realtime | ✅ Ready |
| `004_seed_courts.sql` | Sample courts data | ✅ Ready |

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)

If you have the Supabase CLI installed:

```bash
# Link to your project (first time only)
supabase link --project-ref your-project-ref

# Apply all pending migrations
supabase db push

# Or apply specific migration
supabase db push --file supabase/migrations/002_update_courts_schema.sql
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content
4. Run them **in order** (001 → 002 → 003 → 004)

**Order matters!** Run migrations sequentially.

### Option 3: Using the provided script

```bash
./apply-migrations.sh
```

## What Each Migration Does

### 002_update_courts_schema.sql

- ✅ Creates/updates `courts` table with correct schema
- ✅ Adds indexes for performance (location, name, city, state)
- ✅ Sets up Row Level Security (RLS)
- ✅ Creates `courts_nearby()` RPC function
- ✅ Creates `court_by_id()` RPC function
- ✅ Auto-updates location geography from lat/lon

**Key Features:**
- Uses PostGIS for geospatial queries
- Text-based `id` (not UUID) for compatibility
- JSONB fields for flexible hours and amenities
- Automatic `updated_at` timestamp

### 003_create_checkins.sql

- ✅ Creates `check_ins` table
- ✅ Foreign key to `courts` table
- ✅ Auto-expiry after 3 hours
- ✅ Indexes for fast queries
- ✅ RLS policies (public read/write)
- ✅ Enables Supabase Realtime
- ✅ Helper functions for counting active check-ins

**Key Features:**
- Anonymous user IDs (no auth required)
- Realtime updates for live check-in counts
- Automatic cleanup of expired check-ins
- Optimized indexes for common queries

### 004_seed_courts.sql

- ✅ Inserts 18 sample courts across 5 cities:
  - Atlanta (3 courts) - Default location
  - San Francisco (3 courts)
  - New York (3 courts)
  - Los Angeles (3 courts)
  - Chicago (3 courts)

**Note:** This is for development/testing. Comment out or remove for production.

## Verification

After applying migrations, verify everything is set up:

```sql
-- Check tables exist
select tablename from pg_tables where schemaname = 'public';

-- Check RPC functions exist
select proname from pg_proc where proname like 'court%';

-- Verify realtime is enabled
select * from pg_publication_tables where pubname = 'supabase_realtime';

-- Test courts_nearby function
select * from courts_nearby(33.7490, -84.3880, 50000, 10);

-- Test check-ins
select * from check_ins where expires_at > now();
```

## Rollback (if needed)

If you need to rollback migrations:

```sql
-- Drop check_ins table
drop table if exists public.check_ins cascade;

-- Drop courts table
drop table if exists public.courts cascade;

-- Drop functions
drop function if exists public.courts_nearby;
drop function if exists public.court_by_id;
drop function if exists public.get_active_checkins_count;
drop function if exists public.delete_expired_checkins;
```

## Troubleshooting

### "relation courts already exists"

The old `001_create_courts.sql` created a courts table with different schema. Options:

1. **Clean slate (dev only):** Drop the old table first
   ```sql
   drop table if exists public.courts cascade;
   ```
   Then run `002_update_courts_schema.sql`

2. **Migrate data:** Write a data migration to transform old schema to new

### "PostGIS extension not found"

Ensure PostGIS is enabled:
```sql
create extension if not exists postgis;
```

### Realtime not working

1. Check publication: `select * from pg_publication_tables;`
2. Add table: `alter publication supabase_realtime add table check_ins;`
3. Enable in Dashboard: Database → Replication → check_ins → Toggle ON

## Next Steps

After migrations are applied:

1. ✅ Verify tables exist
2. ✅ Test RPC functions
3. ✅ Enable Realtime in dashboard
4. ✅ Configure environment variables in app
5. ✅ Test app with live data

## Production Considerations

Before deploying to production:

- [ ] Remove or comment out seed data (migration 004)
- [ ] Review RLS policies for security
- [ ] Set up pg_cron for automatic cleanup of expired check-ins
- [ ] Add indexes based on query patterns
- [ ] Consider rate limiting for check-ins
- [ ] Set up database backups
