-- Migration 015: Username profanity / policy enforcement
--
-- Two parts:
--   1. blocked_username_patterns table — editable list of regex patterns;
--      add new rows to extend the blocklist without a new migration.
--   2. check_username_policy trigger — fires on INSERT/UPDATE of profiles,
--      rejects any username matching a blocked pattern or failing basic rules.
--
-- The client-side filter (src/utils/profanity.ts) gives immediate UX feedback.
-- This trigger is the authoritative backstop that cannot be bypassed via direct API calls.

-- ─── Blocked patterns table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.blocked_username_patterns (
  id      SERIAL PRIMARY KEY,
  pattern TEXT NOT NULL UNIQUE,   -- PostgreSQL regex (case-insensitive)
  reason  TEXT                    -- optional human-readable note
);

-- Only admins / service role can manage this table
ALTER TABLE public.blocked_username_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only" ON public.blocked_username_patterns;
CREATE POLICY "Service role only"
  ON public.blocked_username_patterns
  USING (false);  -- blocks all access; service role bypasses RLS

-- Seed with common profanity and slurs (regex patterns, case-insensitive)
INSERT INTO public.blocked_username_patterns (pattern, reason) VALUES
  ('f+u+c+k',          'sexual profanity'),
  ('s+h+i+t',          'profanity'),
  ('c+u+n+t',          'profanity'),
  ('b+i+t+c+h',        'profanity'),
  ('a+s+s+h+o+l+e',    'profanity'),
  ('d+i+c+k',          'sexual'),
  ('c+o+c+k',          'sexual'),
  ('p+u+s+s+y',        'sexual'),
  ('s+l+u+t',          'sexual'),
  ('w+h+o+r+e',        'sexual'),
  ('n+i+g+g+[ae]r?',   'racial slur'),
  ('f+a+g+g?o+t?',     'homophobic slur'),
  ('k+i+k+e',          'antisemitic slur'),
  ('c+h+i+n+k',        'racial slur'),
  ('s+p+i+c+k?',       'racial slur'),
  ('g+o+o+k',          'racial slur'),
  ('r+e+t+a+r+d',      'ableist slur'),
  ('r+a+p+i+s?t',      'violent'),
  ('h+i+t+l+e+r',      'hate'),
  ('n+a+z+i',          'hate')
ON CONFLICT (pattern) DO NOTHING;

-- ─── Trigger function ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_username_policy()
RETURNS trigger AS $$
DECLARE
  normalised TEXT;
  blocked    TEXT;
BEGIN
  -- Only run when username is being set or changed
  IF NEW.username IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.username = NEW.username THEN
    RETURN NEW;
  END IF;

  -- Basic length / character rules
  IF char_length(NEW.username) < 2 THEN
    RAISE EXCEPTION 'Username must be at least 2 characters';
  END IF;
  IF char_length(NEW.username) > 30 THEN
    RAISE EXCEPTION 'Username must be 30 characters or fewer';
  END IF;

  -- Normalise: lowercase, collapse repeated punctuation used as leet substitutes
  normalised := lower(NEW.username);
  normalised := regexp_replace(normalised, '[4@]', 'a', 'g');
  normalised := regexp_replace(normalised, '[3]',  'e', 'g');
  normalised := regexp_replace(normalised, '[1!]', 'i', 'g');
  normalised := regexp_replace(normalised, '[0]',  'o', 'g');
  normalised := regexp_replace(normalised, '[$5]', 's', 'g');
  normalised := regexp_replace(normalised, '[^a-z0-9]', '', 'g');

  -- Check against blocked patterns
  SELECT pattern INTO blocked
  FROM public.blocked_username_patterns
  WHERE normalised ~ pattern
  LIMIT 1;

  IF blocked IS NOT NULL THEN
    RAISE EXCEPTION 'Username contains inappropriate content';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Attach trigger to profiles ───────────────────────────────────────────────

DROP TRIGGER IF EXISTS enforce_username_policy ON public.profiles;
CREATE TRIGGER enforce_username_policy
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_username_policy();
