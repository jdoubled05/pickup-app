-- Migration 011: Add user_id to check_ins for reliable friend activity queries
--
-- The existing anonymous_user_id (TEXT) works for anonymous users, but comparing
-- UUIDs stored as text is fragile for friend lookups. This adds a proper typed
-- UUID column populated when an authenticated user checks in.

ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS check_ins_user_id_idx ON check_ins(user_id);
