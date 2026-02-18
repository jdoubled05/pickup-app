# ✅ Database Setup Complete!

All Supabase migrations are ready to deploy.

---

## 📦 What's Been Created

### Migration Files

| File | Purpose | Tables/Functions |
|------|---------|------------------|
| **002_update_courts_schema.sql** | Courts table & RPC functions | `courts` table, `courts_nearby()`, `court_by_id()` |
| **003_create_checkins.sql** | Check-ins with realtime | `check_ins` table, `get_active_checkins_count()` |
| **004_seed_courts.sql** | Sample data | 18 courts in 5 cities |

### Supporting Files

- **supabase/migrations/README.md** - Detailed migration documentation
- **supabase/apply-migrations.sh** - Automated migration script
- **SUPABASE_SETUP.md** - Updated with quick start guide

---

## 🚀 Next Steps - Choose Your Path

### Path A: Automated (Fastest - 2 minutes)

```bash
cd supabase
./apply-migrations.sh
```

This will:
1. ✅ Validate your `.env` file
2. ✅ Check for Supabase CLI
3. ✅ Apply all migrations in order
4. ✅ Provide verification steps

### Path B: Supabase CLI (Recommended)

```bash
# One-time setup
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push
```

### Path C: Manual via Dashboard

1. Go to your Supabase Dashboard → SQL Editor
2. Open each migration file in order:
   - `002_update_courts_schema.sql`
   - `003_create_checkins.sql`
   - `004_seed_courts.sql`
3. Copy contents and run each

---

## ✅ Verification Checklist

After applying migrations, verify in Supabase Dashboard:

### 1. Tables Created

```sql
-- Should show: courts, check_ins
select tablename from pg_tables where schemaname = 'public';
```

### 2. RPC Functions Exist

```sql
-- Should show: courts_nearby, court_by_id, get_active_checkins_count, delete_expired_checkins
select proname from pg_proc where proname like '%court%' or proname like '%checkin%';
```

### 3. Sample Data Loaded

```sql
-- Should return 18 courts
select count(*) from courts;

-- Test Atlanta courts (default location)
select name, city from courts where city = 'Atlanta';
```

### 4. Realtime Enabled

Dashboard → Database → Replication:
- [ ] Find `check_ins` table
- [ ] Toggle **Realtime** to ON
- [ ] Ensure INSERT, UPDATE, DELETE events are enabled

### 5. Test RPC Functions

```sql
-- Get courts near Atlanta (should return 3 courts)
select name, distance_meters
from courts_nearby(33.7490, -84.3880, 50000, 10);

-- Get specific court
select * from court_by_id('atlanta-1');
```

---

## 🗄️ Database Schema Overview

### Courts Table

**Purpose:** Store basketball court locations and details

**Key Fields:**
- `id` (text) - Unique identifier
- `name` - Court name
- `latitude`, `longitude` - Coordinates
- `location` (geography) - PostGIS point for spatial queries
- `indoor` - Indoor/outdoor flag
- `num_hoops` - Number of hoops
- `lighting` - Has lighting
- `hours_json` - Operating hours
- `amenities_json` - Array of amenities

**Indexes:**
- Location (GiST) for fast nearby searches
- Name, city, state for filtering

### Check-ins Table

**Purpose:** Track real-time court activity

**Key Fields:**
- `id` (uuid) - Unique identifier
- `court_id` (text) - Foreign key to courts
- `anonymous_user_id` (text) - Device-based user ID
- `created_at` - Check-in time
- `expires_at` - Auto-expiry (3 hours)

**Features:**
- ✅ Realtime subscriptions enabled
- ✅ Auto-expiry after 3 hours
- ✅ Anonymous (no auth required)
- ✅ Optimized indexes

---

## 📊 Sample Data Included

### 18 Courts Across 5 Cities

**Atlanta (3)** - Default location
- Piedmont Park Courts
- Washington Park
- Skyline Park (indoor)

**San Francisco (3)**
- Mission Playground
- Dolores Park Court
- Panhandle Courts

**New York (3)**
- Rucker Park (legendary)
- West 4th Street Courts (The Cage)
- Chelsea Recreation Center (indoor)

**Los Angeles (3)**
- Venice Beach Courts (famous)
- Pan Pacific Park
- Rancho Cienega Recreation Center

**Chicago (3)**
- Malcolm X College Court
- Seward Park
- UIC Recreation Center (indoor)

---

## 🧪 Testing Your Setup

### 1. Test in Supabase SQL Editor

```sql
-- Test courts_nearby (Atlanta)
select name, city, distance_meters::integer as distance_m
from courts_nearby(33.7490, -84.3880, 50000, 5)
order by distance_meters;

-- Create a test check-in
insert into check_ins (court_id, anonymous_user_id)
values ('atlanta-1', 'test-user-123');

-- View active check-ins
select
  c.name,
  count(ci.*) as people_here
from courts c
left join check_ins ci on ci.court_id = c.id and ci.expires_at > now()
group by c.id, c.name
having count(ci.*) > 0;
```

### 2. Test in Your App

1. Ensure `.env` has correct Supabase credentials
2. Run app: `npx expo start`
3. Navigate to any court detail page
4. Should see court info loaded from database
5. If Supabase configured: Should see check-in UI

---

## 🔧 Troubleshooting

### "Function courts_nearby does not exist"

**Fix:** Run `002_update_courts_schema.sql` again

### "Table check_ins does not exist"

**Fix:** Run `003_create_checkins.sql`

### "No courts showing in app"

**Checklist:**
1. Verify tables created: `select * from courts;`
2. Check seed data loaded: `select count(*) from courts;` (should be 18)
3. Verify RPC function works: `select * from courts_nearby(33.7490, -84.3880, 50000);`
4. Check app `.env` has correct Supabase URL and key

### "Check-ins not updating in real-time"

**Fix:**
1. Dashboard → Database → Replication
2. Find `check_ins` table
3. Toggle Realtime ON
4. Or run: `alter publication supabase_realtime add table check_ins;`

### "Permission denied for table courts"

**Fix:** RLS policies should allow public read. Verify:
```sql
select * from pg_policies where tablename = 'courts';
```

Should show policy: "Courts are viewable by everyone"

---

## 🎯 Migration Status

- [x] **002_update_courts_schema.sql** - Courts table ready
- [x] **003_create_checkins.sql** - Check-ins table ready
- [x] **004_seed_courts.sql** - Sample data ready
- [ ] **Applied to Supabase** - Run migrations now!
- [ ] **Realtime enabled** - Toggle in Dashboard
- [ ] **Tested** - Verify queries work

---

## 📝 Post-Setup Tasks

After migrations are applied:

### Required
1. [ ] Enable Realtime for `check_ins` table in Dashboard
2. [ ] Test courts_nearby RPC function
3. [ ] Verify app can load courts
4. [ ] Test check-in feature in app

### Optional but Recommended
1. [ ] Set up pg_cron to auto-delete expired check-ins:
   ```sql
   -- Run delete_expired_checkins() every hour
   ```
2. [ ] Review RLS policies for production
3. [ ] Set up database backups
4. [ ] Add monitoring/alerts

---

## 🎉 You're Ready!

Once migrations are applied and realtime is enabled:

✅ Courts database is populated
✅ RPC functions for nearby search
✅ Check-ins table with realtime
✅ Sample data for testing
✅ All indexes optimized
✅ RLS policies configured

**Your app is ready to show real-time basketball court activity!**

---

## 📚 Reference Documentation

- [Supabase Migrations README](supabase/migrations/README.md) - Detailed migration docs
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Complete setup guide
- [PRODUCT_SPEC.md](PRODUCT_SPEC.md) - Full product specification

---

**Need help?** Check the troubleshooting section or review the migration files directly in `supabase/migrations/`.
