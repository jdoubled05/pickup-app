# 🗺️ Migration Strategy Guide

This guide helps you determine which migrations to run based on your current database state.

---

## 📋 Step 1: Diagnose Your Database

Run all queries in [DATABASE_DIAGNOSTIC_QUERIES.sql](DATABASE_DIAGNOSTIC_QUERIES.sql) to check your current state.

---

## 🔀 Step 2: Choose Your Migration Path

Based on the diagnostic results, follow ONE of these paths:

### Path A: Courts Table Exists with OLD Schema (UUID id)

**When to use:** Query 1 shows `id` column is `uuid` type

**Indicators:**
- Table has columns: `id` (uuid), `court_type`, `number_of_hoops`, `geom`
- Missing columns: `description`, `city`, `state`, `indoor`, `num_hoops`

**Migration Steps:**
```sql
-- Run these in order:
1. supabase/migrations/002b_migrate_courts_schema.sql  ← This one!
2. supabase/migrations/003_create_checkins.sql
3. supabase/migrations/004_seed_courts.sql (optional)
```

**What 002b does:**
- ✅ Adds missing columns
- ✅ Renames columns (number_of_hoops → num_hoops, geom → location)
- ✅ Converts `id` from UUID to TEXT
- ✅ Preserves existing data
- ✅ Creates RPC functions

---

### Path B: Courts Table Exists with NEW Schema (TEXT id)

**When to use:** Query 1 shows `id` column is `text` type and has columns like `num_hoops`, `indoor`

**Indicators:**
- Table already has correct schema
- Columns match app expectations

**Migration Steps:**
```sql
-- Skip 002, just run:
1. supabase/migrations/003_create_checkins.sql
2. supabase/migrations/004_seed_courts.sql (optional)
```

---

### Path C: No Courts Table (Fresh Start)

**When to use:** Query 1 returns no rows (table doesn't exist)

**Indicators:**
- `SELECT ... FROM courts` returns error
- Fresh Supabase project

**Migration Steps:**
```sql
-- Run these in order:
1. supabase/migrations/002_update_courts_schema.sql  ← Use this one
2. supabase/migrations/003_create_checkins.sql
3. supabase/migrations/004_seed_courts.sql
```

**What 002 does:**
- ✅ Creates courts table from scratch with correct schema
- ✅ Creates RPC functions
- ✅ Sets up indexes and RLS

---

### Path D: Courts Table Has Data You Want to Keep

**When to use:** Query 2 shows `court_count > 0` AND you have custom courts

**Migration Steps:**

1. **Backup your data first!**
   ```sql
   -- Export existing courts to CSV or JSON
   SELECT * FROM courts;
   ```

2. **Run migration with data preservation:**
   ```sql
   -- Run: 002b_migrate_courts_schema.sql
   -- This preserves your data during schema change
   ```

3. **Verify data after migration:**
   ```sql
   -- Should show same count as before
   SELECT COUNT(*) FROM courts;

   -- Check a sample row has all fields
   SELECT * FROM courts LIMIT 1;
   ```

4. **Continue with remaining migrations:**
   ```sql
   -- Run: 003_create_checkins.sql
   -- Skip: 004_seed_courts.sql (you have your own data)
   ```

---

## 🔍 Migration File Reference

| File | When to Use | What It Does |
|------|-------------|--------------|
| **001_create_courts.sql** | ⚠️ Legacy | Old schema, don't run if courts exists |
| **002_update_courts_schema.sql** | Path C (fresh start) | Creates new table from scratch |
| **002b_migrate_courts_schema.sql** | Path A (has old schema) | Migrates existing table, preserves data |
| **003_create_checkins.sql** | All paths | Creates check_ins table |
| **004_seed_courts.sql** | Paths A, B, C | Adds 18 sample courts |

---

## ⚠️ Common Issues & Solutions

### Issue: "relation courts already exists"

**Diagnosis:** You're running 002 but table already exists

**Solution:**
- Use Path A (002b) instead if old schema
- Use Path B (skip 002) if new schema already exists

### Issue: "column number_of_hoops does not exist"

**Diagnosis:** App expects `num_hoops` but database has `number_of_hoops`

**Solution:** Run 002b to rename column

### Issue: "function courts_nearby does not exist"

**Diagnosis:** RPC functions not created

**Solution:** Run either 002 or 002b (both create functions)

### Issue: Data lost after migration

**Diagnosis:** Ran wrong migration or didn't backup

**Solution:**
- Always backup first with `pg_dump` or export to CSV
- Use 002b for data preservation
- Check Supabase dashboard backups

---

## ✅ Post-Migration Verification

After running your migrations, verify everything works:

```sql
-- 1. Check table structure matches app expectations
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'courts'
ORDER BY ordinal_position;

-- Expected columns:
-- id (text), name (text), description (text), latitude (double precision),
-- longitude (double precision), location (geography), address (text),
-- city (text), state (text), postal_code (text), country (text),
-- timezone (text), indoor (boolean), surface_type (text), num_hoops (integer),
-- lighting (boolean), open_24h (boolean), hours_json (jsonb),
-- amenities_json (jsonb), photos_count (integer), created_at (timestamptz),
-- updated_at (timestamptz), osm_type (text), osm_id (text)

-- 2. Check RPC functions exist
SELECT proname FROM pg_proc
WHERE proname IN ('courts_nearby', 'court_by_id');

-- Expected: 2 rows

-- 3. Test courts_nearby function
SELECT name, distance_meters::integer
FROM courts_nearby(33.7490, -84.3880, 50000, 5);

-- Expected: Returns up to 5 courts near Atlanta

-- 4. Check check_ins table exists
SELECT tablename FROM pg_tables
WHERE tablename = 'check_ins';

-- Expected: 1 row

-- 5. Verify Realtime publication
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'check_ins';

-- Expected: 1 row (if you've enabled realtime)
```

---

## 🎯 Quick Decision Tree

```
Do you have a courts table?
├─ NO → Use Path C (002 + 003 + 004)
└─ YES
   └─ What type is the 'id' column?
      ├─ UUID → Use Path A (002b + 003 + 004)
      ├─ TEXT → Use Path B (003 + 004)
      └─ No 'id' column → Use Path C (002 + 003 + 004)
```

---

## 📞 Next Steps

1. **Run diagnostic queries** from DATABASE_DIAGNOSTIC_QUERIES.sql
2. **Identify your path** (A, B, C, or D)
3. **Backup data** if you have any
4. **Run migrations** in the specified order
5. **Verify** using post-migration queries
6. **Enable Realtime** in Supabase Dashboard for check_ins
7. **Test app** to ensure everything works

---

## 🆘 Need Help?

If you're unsure which path to follow:

1. Share the output of Query 1 and Query 2 from diagnostic queries
2. We'll determine the correct migration path together

The diagnostic queries are safe to run - they only READ data, never modify.
