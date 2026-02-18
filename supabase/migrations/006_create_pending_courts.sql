-- Migration 006: Create pending_courts table for user submissions
-- This table stores court submissions from users that need admin approval

CREATE TABLE IF NOT EXISTS pending_courts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Court details (same as courts table)
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'United States',
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,

  -- Court attributes
  indoor BOOLEAN,
  surface_type TEXT,
  num_hoops INTEGER,
  lighting BOOLEAN,
  open_24h BOOLEAN,
  hours_json JSONB,
  amenities_json JSONB,

  -- Submission metadata
  submitted_by TEXT NOT NULL, -- anonymous_user_id
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT, -- Admin notes

  -- Future: photo uploads
  photo_url TEXT
);

-- Indexes
CREATE INDEX idx_pending_courts_status ON pending_courts(status);
CREATE INDEX idx_pending_courts_submitted_at ON pending_courts(submitted_at DESC);
CREATE INDEX idx_pending_courts_submitted_by ON pending_courts(submitted_by);

-- Enable Row Level Security
ALTER TABLE pending_courts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can submit a court (insert)
CREATE POLICY "Allow anyone to submit courts"
  ON pending_courts FOR INSERT
  WITH CHECK (true);

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
  ON pending_courts FOR SELECT
  USING (submitted_by = current_setting('request.headers', true)::json->>'x-user-id' OR status = 'approved');

-- TODO: Add admin policy for approve/reject
-- For now, use Supabase dashboard or service role key

-- Comments
COMMENT ON TABLE pending_courts IS 'Court submissions from users pending admin review';
COMMENT ON COLUMN pending_courts.status IS 'pending, approved, or rejected';
COMMENT ON COLUMN pending_courts.submitted_by IS 'Anonymous user ID who submitted this court';
