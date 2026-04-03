-- Migration 010: Friends
-- Depends on: 009_user_accounts.sql (profiles table must exist)

-- ============================================================
-- 1. Open profiles for search
--    Authenticated users need to read others' profiles to
--    search by username and see friend activity.
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read any profile" ON profiles;
CREATE POLICY "Authenticated users can read any profile"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 2. Friendships table
-- ============================================================
CREATE TABLE IF NOT EXISTS friendships (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status    ON friendships(status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can see any friendship they are part of
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests (must be the requester)
DROP POLICY IF EXISTS "Users can send friend requests" ON friendships;
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Either party can update (accept/decline by addressee, cancel by requester)
DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
CREATE POLICY "Users can update friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Either party can remove the friendship
DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
