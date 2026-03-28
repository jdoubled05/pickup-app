-- Migration 009: User Accounts
-- Run this in the Supabase SQL editor before testing the feature branch.

-- ============================================================
-- 1. Profiles table
--    Auto-created for every new auth user via trigger below.
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT,
  avatar_url  TEXT,
  play_style          TEXT[],
  skill_level         TEXT CHECK (skill_level IN ('casual','intermediate','competitive')),
  username_updated_at  TIMESTAMPTZ,
  username_change_count INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns if migrating an existing table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS play_style          TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_level         TEXT CHECK (skill_level IN ('casual','intermediate','competitive'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_updated_at  TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_change_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. Saved courts table
--    Replaces AsyncStorage for authenticated users.
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_courts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  court_id   TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, court_id)
);

ALTER TABLE saved_courts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own saved courts" ON saved_courts;
CREATE POLICY "Users can manage own saved courts"
  ON saved_courts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. Anonymous → authenticated migration
--    Called on sign-in to transfer check-ins to the real user.
-- ============================================================
CREATE OR REPLACE FUNCTION migrate_anonymous_to_user(
  p_anonymous_id TEXT,
  p_user_id      UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Transfer any still-active anonymous check-ins to the authenticated user
  UPDATE check_ins
  SET anonymous_user_id = p_user_id::TEXT
  WHERE anonymous_user_id = p_anonymous_id
    AND expires_at > NOW();
END;
$$;
