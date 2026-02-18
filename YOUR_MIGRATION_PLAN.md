# 🎯 Your Exact Migration Plan

Based on your database diagnostic results, here's your step-by-step migration plan.

---

## 📊 Your Database Status

✅ **What you have:**
- Courts table with **529 real courts** 🎉
- Correct column names (num_hoops, indoor, location)
- All new fields (description, city, state, etc.)
- PostGIS installed
- RLS policies configured

❌ **What needs fixing:**
- `id` is UUID (app expects text)
- `court_by_id()` function expects UUID
- No check_ins table yet

---

## 🚀 Migration Steps (In Order)

### Step 1: Convert UUID IDs to Text (CRITICAL)

**File:** `005_convert_uuid_to_text.sql`

**What it does:**
- ✅ Preserves all 529 courts
- ✅ Converts UUIDs → text IDs
- ✅ Updates RPC functions
- ✅ Creates backup table (safety)
- ✅ Extracts latitude/longitude from location field

**To run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase/migrations/005_convert_uuid_to_text.sql`
3. Paste and click **RUN**

**Expected output:**
```
NOTICE: Successfully migrated 529 courts from UUID to TEXT ids
NOTICE: Final court count: 529
NOTICE: Migration successful! All 529 courts migrated to TEXT ids
```

⚠️ **If you see an error**, STOP and share the error message with me.

---

### Step 2: Create Check-ins Table

**File:** `003_create_checkins.sql`

**What it does:**
- ✅ Creates check_ins table
- ✅ Sets up foreign key to courts
- ✅ Enables Realtime
- ✅ Creates helper functions

**To run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase/migrations/003_create_checkins.sql`
3. Paste and click **RUN**

**Expected output:**
```
Success. No rows returned
```

---

### Step 3: Enable Realtime for Check-ins (REQUIRED)

**Manual step in Dashboard:**

1. Go to **Database** → **Replication**
2. Find `check_ins` table in the list
3. Toggle **Realtime** to **ON** (green)
4. Ensure these events are checked:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE

**Verification:**
```sql
-- Run this query - should return 1 row
SELECT tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'check_ins';
```

---

### Step 4 (Optional): Add Sample Courts

**File:** `004_seed_courts.sql`

**Note:** You already have 529 real courts, so you probably **don't need this**. But if you want to add the 18 sample courts from other cities (SF, NYC, LA, Chicago):

1. Open `supabase/migrations/004_seed_courts.sql`
2. Copy and run in SQL Editor

This will add 18 more courts to your existing 529.

---

## ✅ Verification After Migration

Run these queries to verify everything worked:

### 1. Check ID is now text
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'courts' AND column_name = 'id';

-- Expected: data_type = 'text'
```

### 2. Verify all courts preserved
```sql
SELECT COUNT(*) FROM courts;

-- Expected: 529 (or 547 if you ran seed data)
```

### 3. Test court_by_id with text ID
```sql
-- Get a sample court ID first
SELECT id FROM courts LIMIT 1;

-- Then test the function (replace with actual ID)
SELECT * FROM court_by_id('your-court-id-here');

-- Expected: Returns 1 court with all fields
```

### 4. Test courts_nearby
```sql
-- Atlanta coordinates
SELECT
  name,
  city,
  distance_meters::integer as distance
FROM courts_nearby(33.7490, -84.3880, 50000, 5);

-- Expected: Returns up to 5 courts near Atlanta
```

### 5. Verify check_ins table exists
```sql
SELECT tablename
FROM pg_tables
WHERE tablename = 'check_ins';

-- Expected: 1 row
```

### 6. Test check-in functionality
```sql
-- Create a test check-in
INSERT INTO check_ins (court_id, anonymous_user_id)
VALUES (
  (SELECT id FROM courts LIMIT 1),
  'test-user-123'
);

-- View active check-ins
SELECT * FROM check_ins WHERE expires_at > now();

-- Expected: 1 row with your test check-in

-- Clean up
DELETE FROM check_ins WHERE anonymous_user_id = 'test-user-123';
```

### 7. Verify latitude/longitude are extracted
```sql
SELECT
  id,
  name,
  latitude,
  longitude
FROM court_by_id((SELECT id FROM courts LIMIT 1));

-- Expected: Should show numeric latitude and longitude, not null
```

---

## 🎯 Migration Checklist

- [ ] **Step 1:** Run `005_convert_uuid_to_text.sql`
- [ ] **Verify:** ID is text, count is 529
- [ ] **Step 2:** Run `003_create_checkins.sql`
- [ ] **Verify:** check_ins table exists
- [ ] **Step 3:** Enable Realtime in Dashboard
- [ ] **Verify:** Realtime query returns check_ins
- [ ] **Step 4 (Optional):** Run `004_seed_courts.sql`
- [ ] **Final Test:** Run all verification queries above

---

## 🚨 What If Something Goes Wrong?

### Scenario: Migration 005 fails

**You're safe!** The migration creates a backup table first.

**To rollback:**
```sql
-- Restore from backup
DROP TABLE IF EXISTS public.courts;
ALTER TABLE public.courts_backup RENAME TO courts;

-- Recreate indexes
CREATE INDEX courts_location_gist ON public.courts USING gist (location);
CREATE INDEX courts_name_idx ON public.courts (name);
```

Then share the error message with me and I'll create a fixed version.

---

### Scenario: App still not working after migrations

**Checklist:**
1. ✅ ID column is text? Run verification query #1
2. ✅ RPC functions exist? Run `SELECT proname FROM pg_proc WHERE proname LIKE '%court%'`
3. ✅ Realtime enabled? Run verification query for realtime
4. ✅ `.env` file has correct Supabase URL and key?

---

## 🎉 What Happens After Success

Once all migrations complete:

✅ **App will work with your 529 courts**
- Courts list will show real data
- Nearby search will work
- Court details will load
- Get Directions will work

✅ **Check-in feature will be live**
- "I'm Here" button will appear
- Real-time count updates
- Anonymous check-ins working

✅ **Ready for Phase 1 polish**
- Remove debug UI
- Fix Profile tab
- Format hours
- Add haptics

---

## 📞 Next Steps After Migration

1. **Run migrations** (Steps 1-3 above)
2. **Verify** using the SQL queries
3. **Test app** on simulator
   - Courts should load
   - Check-ins should work
4. **Report back** - Tell me if everything works!
5. **Continue development** - Phase 1 polish tasks

---

## 💡 Important Notes

**Backup Created:**
- Migration 005 creates `courts_backup` table
- Keep it for a week to be safe
- Drop it later: `DROP TABLE courts_backup;`

**Your 529 Courts:**
- Are real OSM (OpenStreetMap) data
- Will be preserved during migration
- Much better than our 18 sample courts!

**Check-ins:**
- Will be empty initially (no users yet)
- Will populate when users start checking in
- Expire after 3 hours automatically

---

## 🆘 Need Help?

If anything is unclear or fails:
1. **Share the exact error message**
2. **Tell me which step failed**
3. **Run this diagnostic:**
   ```sql
   SELECT
     (SELECT COUNT(*) FROM courts) as court_count,
     (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'courts' AND column_name = 'id') as id_type,
     (SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'check_ins')) as has_checkins;
   ```

I'll help you fix it immediately!

---

**You're ready to go! Start with Step 1. 🚀**
