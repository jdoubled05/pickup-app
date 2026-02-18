-- Court Photos Table and Storage
-- Allows users to upload photos for courts

-- Create court_photos table
CREATE TABLE IF NOT EXISTS court_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Anonymous device ID
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  thumbnail_path TEXT, -- Optional thumbnail path
  file_size INTEGER, -- Size in bytes
  width INTEGER, -- Image width in pixels
  height INTEGER, -- Image height in pixels
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_primary BOOLEAN DEFAULT false, -- Primary photo for court card
  CONSTRAINT unique_storage_path UNIQUE (storage_path)
);

-- Create index for fast court photo lookups
CREATE INDEX idx_court_photos_court_id ON court_photos(court_id);
CREATE INDEX idx_court_photos_user_id ON court_photos(user_id);
CREATE INDEX idx_court_photos_uploaded_at ON court_photos(uploaded_at DESC);

-- RLS Policies
ALTER TABLE court_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos
CREATE POLICY "Anyone can view court photos"
  ON court_photos
  FOR SELECT
  USING (true);

-- Anyone can upload photos
CREATE POLICY "Anyone can upload court photos"
  ON court_photos
  FOR INSERT
  WITH CHECK (true);

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
  ON court_photos
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

-- Create Storage Bucket for court photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('court-photos', 'court-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Anyone can view photos (bucket is public)
CREATE POLICY "Anyone can view court photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'court-photos');

-- Anyone can upload photos (max 10MB)
CREATE POLICY "Anyone can upload court photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'court-photos'
    AND (storage.foldername(name))[1] IN (SELECT id FROM courts)
    AND octet_length(decode(encode(content, 'escape'), 'base64')) < 10485760
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'court-photos');

-- Update courts table to track primary photo
ALTER TABLE courts ADD COLUMN IF NOT EXISTS primary_photo_url TEXT;

-- Function to update court's primary_photo_url when a photo is marked primary
CREATE OR REPLACE FUNCTION update_court_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    -- Unset other primary photos for this court
    UPDATE court_photos
    SET is_primary = false
    WHERE court_id = NEW.court_id AND id != NEW.id;

    -- Update court's primary photo URL
    UPDATE courts
    SET primary_photo_url = 'https://' || current_setting('app.settings.supabase_url', true) || '/storage/v1/object/public/court-photos/' || NEW.storage_path
    WHERE id = NEW.court_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_court_primary_photo
  AFTER INSERT OR UPDATE ON court_photos
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION update_court_primary_photo();

-- Function to clean up storage when photo record is deleted
CREATE OR REPLACE FUNCTION delete_photo_from_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete from storage bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'court-photos' AND name = OLD.storage_path;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_delete_photo_from_storage
  BEFORE DELETE ON court_photos
  FOR EACH ROW
  EXECUTE FUNCTION delete_photo_from_storage();
