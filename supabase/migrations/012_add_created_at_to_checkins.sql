-- Migration 012: Add created_at to check_ins
--
-- Migration 005 dropped the courts table CASCADE, which also dropped check_ins
-- (it had a FK to courts). When check_ins was recreated, the created_at column
-- was not included. This migration adds it back.
--
-- Existing rows get their created_at estimated from expires_at - 3 hours
-- (the standard check-in duration). New rows default to NOW().

ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Back-fill existing rows (expires_at = created_at + 3h by convention)
UPDATE check_ins
SET created_at = expires_at - INTERVAL '3 hours'
WHERE created_at = NOW();
