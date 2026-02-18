# Supabase Setup Guide

This guide covers the database setup required for the Pickup app.

## Prerequisites

1. Supabase project created
2. Environment variables configured in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## Quick Start

The easiest way to set up the database is using the provided migrations:

### Option 1: Run Migration Script (Recommended)

```bash
cd supabase
./apply-migrations.sh
```

This will apply all migrations in the correct order.

### Option 2: Manual Setup via Dashboard

See the [Database Schema](#database-schema) section below for SQL to copy/paste.

### Option 3: Use Supabase CLI

```bash
supabase link --project-ref your-project-ref
supabase db push
```

For detailed migration information, see [supabase/migrations/README.md](supabase/migrations/README.md).

---

## Database Schema

### 1. Check-ins Table

**Purpose:** Track real-time user check-ins at courts

Run this SQL in your Supabase SQL Editor:

```sql
-- Create check_ins table
create table check_ins (
  id uuid primary key default uuid_generate_v4(),
  court_id text not null references courts(id) on delete cascade,
  anonymous_user_id text not null,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '3 hours')
);

-- Create indexes for performance
create index idx_check_ins_court on check_ins(court_id);
create index idx_check_ins_expires on check_ins(expires_at);
create index idx_check_ins_user on check_ins(anonymous_user_id);

-- Enable Row Level Security (RLS)
alter table check_ins enable row level security;

-- RLS Policies

-- Anyone can view check-ins
create policy "Check-ins are viewable by everyone"
on check_ins for select
using ( true );

-- Anyone can create check-ins (anonymous users)
create policy "Anyone can create check-ins"
on check_ins for insert
with check ( true );

-- Users can only delete their own check-ins
create policy "Users can delete their own check-ins"
on check_ins for delete
using ( anonymous_user_id = current_setting('request.jwt.claims', true)::json->>'sub' );

-- Enable realtime for check_ins table
alter publication supabase_realtime add table check_ins;
```

### 2. Clean Up Expired Check-ins (Optional)

To automatically remove expired check-ins, create a scheduled function:

```sql
-- Function to delete expired check-ins
create or replace function delete_expired_checkins()
returns void
language plpgsql
as $$
begin
  delete from check_ins
  where expires_at < now();
end;
$$;

-- Note: Set up a cron job in Supabase Dashboard to run this hourly:
-- Dashboard > Database > Cron Jobs
-- Schedule: 0 * * * * (every hour)
-- Function: delete_expired_checkins()
```

---

## Realtime Setup

### Enable Realtime for Check-ins

1. Go to **Database > Replication** in Supabase Dashboard
2. Find the `check_ins` table
3. Toggle **Realtime** to ON
4. Ensure these events are enabled:
   - INSERT
   - DELETE
   - UPDATE

This allows the app to receive real-time updates when users check in or out.

---

## Testing the Setup

### 1. Verify Table Creation

Run this query to verify the table exists:

```sql
select * from information_schema.tables
where table_name = 'check_ins';
```

### 2. Test Insert

```sql
insert into check_ins (court_id, anonymous_user_id)
values ('test-court-123', 'test-user-456');
```

### 3. Test Query

```sql
select * from check_ins
where expires_at > now();
```

### 4. Test Delete

```sql
delete from check_ins
where anonymous_user_id = 'test-user-456';
```

---

## RLS Policy Notes

**Important:** The delete policy currently checks JWT claims, but since we're using anonymous check-ins, users won't have JWT tokens.

For MVP, you may want to simplify the delete policy:

```sql
-- Simpler delete policy (allows anyone to delete any check-in)
drop policy "Users can delete their own check-ins" on check_ins;

create policy "Anyone can delete check-ins"
on check_ins for delete
using ( true );
```

⚠️ **Security Note:** This allows anyone to delete any check-in. For production, implement proper user authentication or use a server-side function to enforce deletion rules.

---

## Troubleshooting

### Check-ins not appearing in real-time

1. Verify realtime is enabled: Database > Replication
2. Check publication: `select * from pg_publication_tables where pubname = 'supabase_realtime';`
3. Ensure table is in publication: `alter publication supabase_realtime add table check_ins;`

### Can't insert check-ins

1. Verify courts table exists and has data
2. Check foreign key: `court_id` must reference existing court
3. Verify RLS policies allow insert

### Performance issues

1. Ensure indexes are created (run index creation SQL above)
2. Set up cron job to delete expired check-ins
3. Consider adding a `where expires_at > now()` filter to queries

---

## Next Steps

After setting up the database:

1. ✅ Check-ins table created
2. ✅ Indexes created
3. ✅ RLS policies configured
4. ✅ Realtime enabled
5. ⬜ Test in app (create a check-in from court detail page)
6. ⬜ Verify real-time updates work (open court on two devices)
7. ⬜ Set up cron job for cleanup (optional but recommended)

---

**Database Setup Complete!** 🎉

Your app should now support real-time check-ins.
