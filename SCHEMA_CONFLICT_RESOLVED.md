# ⚠️ Schema Conflict Identified & Resolved

## 🔍 The Problem

Your codebase has a **schema mismatch** between:
1. **Old migration (001)** - UUID-based schema
2. **App code** - Expects text-based schema with different columns
3. **My new migrations (002, 003, 004)** - Match app expectations

---

## 📊 Schema Comparison

### Old Schema (001_create_courts.sql)
```sql
id                uuid               ← Problem: App expects text
name              text
latitude          double precision
longitude         double precision
address           text
court_type        text               ← Problem: App expects 'indoor' (boolean)
surface_type      text               ✅ Correct
number_of_hoops   integer            ← Problem: App expects 'num_hoops'
lighting          boolean            ✅ Correct
open_hours        text               ← Problem: App expects 'hours_json' (jsonb)
last_verified_at  timestamptz        ← Not used by app
created_at        timestamptz        ✅ Correct
geom              geography          ← Problem: App expects 'location'
```

**Missing in old schema:**
- description, city, state, postal_code, country, timezone
- indoor, open_24h, amenities_json, photos_count
- updated_at, osm_type, osm_id

### Expected Schema (What App Needs)
```sql
id                text               ← Need text, not UUID
name              text
description       text
location          geography          ← Not 'geom'
latitude          double precision
longitude         double precision
address           text
city              text
state             text
postal_code       text
country           text
timezone          text
indoor            boolean            ← Not 'court_type'
surface_type      text
num_hoops         integer            ← Not 'number_of_hoops'
lighting          boolean
open_24h          boolean
hours_json        jsonb              ← Not 'open_hours' text
amenities_json    jsonb
photos_count      integer
created_at        timestamptz
updated_at        timestamptz
osm_type          text
osm_id            text
```

---

## ✅ The Solution

I've created **3 migration strategies** to handle any scenario:

### 📁 New Files Created

1. **[DATABASE_DIAGNOSTIC_QUERIES.sql](DATABASE_DIAGNOSTIC_QUERIES.sql)**
   - Safe queries to check your current database state
   - Tells you which migration path to use
   - No modifications, read-only

2. **[002b_migrate_courts_schema.sql](supabase/migrations/002b_migrate_courts_schema.sql)**
   - **ALTER migration** for existing tables
   - Preserves your data
   - Converts UUID → TEXT
   - Renames columns
   - Adds missing columns
   - Creates RPC functions

3. **[MIGRATION_STRATEGY.md](MIGRATION_STRATEGY.md)**
   - Decision tree for which migrations to run
   - 4 different paths based on your situation
   - Verification steps
   - Troubleshooting guide

---

## 🎯 What You Need to Do

### Step 1: Run Diagnostic Queries

Copy/paste all queries from [DATABASE_DIAGNOSTIC_QUERIES.sql](DATABASE_DIAGNOSTIC_QUERIES.sql) into your Supabase SQL Editor and run them.

**This is safe** - they only read data, never modify.

### Step 2: Check Results

Look at the output of **Query 1** (column list):

#### Scenario A: You see columns like `number_of_hoops`, `court_type`, `geom`
**Your situation:** Old schema exists (001 migration was run)

**What to do:** Use **Path A** from MIGRATION_STRATEGY.md
```
Run migrations in this order:
1. 002b_migrate_courts_schema.sql ← This one preserves data
2. 003_create_checkins.sql
3. 004_seed_courts.sql
```

#### Scenario B: You see columns like `num_hoops`, `indoor`, `location`
**Your situation:** New schema already exists somehow

**What to do:** Use **Path B** from MIGRATION_STRATEGY.md
```
Skip 002/002b, just run:
1. 003_create_checkins.sql
2. 004_seed_courts.sql
```

#### Scenario C: Table doesn't exist
**Your situation:** Fresh database

**What to do:** Use **Path C** from MIGRATION_STRATEGY.md
```
Run migrations in this order:
1. 002_update_courts_schema.sql ← Creates from scratch
2. 003_create_checkins.sql
3. 004_seed_courts.sql
```

---

## 📋 Migration File Guide

| File | Purpose | When to Use |
|------|---------|-------------|
| ~~001_create_courts.sql~~ | Legacy, outdated | **Don't use** |
| **002_update_courts_schema.sql** | Creates new table | Fresh database only (Path C) |
| **002b_migrate_courts_schema.sql** | Migrates existing table | Old schema exists (Path A) |
| **003_create_checkins.sql** | Creates check-ins | All paths |
| **004_seed_courts.sql** | Sample data | All paths (optional) |

---

## 🔐 Why This Matters

The app's TypeScript code expects:
```typescript
interface Court {
  id: string;  // ← TEXT, not UUID
  indoor: boolean;  // ← Not court_type
  num_hoops: number;  // ← Not number_of_hoops
  // ... many other fields
}
```

If the database doesn't match, you'll get:
- ❌ Courts won't load
- ❌ RPC functions won't work
- ❌ Type errors in app
- ❌ Queries will fail

---

## ✨ After Migration

Once you run the correct migrations:

✅ Courts table matches app expectations
✅ RPC functions work (`courts_nearby`, `court_by_id`)
✅ Check-ins table ready for real-time
✅ 18 sample courts loaded (if you run 004)
✅ App can query and display courts
✅ Check-in feature fully functional

---

## 🆘 I'm Here to Help

**Tell me the results of Query 1 and Query 2** from the diagnostic queries, and I'll tell you exactly which migrations to run and in what order.

The diagnostic queries are:
1. Safe to run (read-only)
2. Quick (takes seconds)
3. Tell us exactly what state your database is in

---

## 📌 Summary

**The Issue:** Schema mismatch between old migration and app code

**The Fix:** Created 3 migration paths to handle any scenario

**Next Step:** Run diagnostic queries and tell me the results

**Result:** Database will perfectly match what your app expects
