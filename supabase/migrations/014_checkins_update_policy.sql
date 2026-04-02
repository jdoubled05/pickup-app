-- Migration 014: Add UPDATE policy for check_ins
--
-- checkOut() now sets expires_at = NOW() instead of deleting the row,
-- preserving check-in history for the profile activity feed.
-- This policy allows that update (mirrors the existing delete policy).

DROP POLICY IF EXISTS "Anyone can update check-ins" ON public.check_ins;
CREATE POLICY "Anyone can update check-ins"
  ON public.check_ins
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
