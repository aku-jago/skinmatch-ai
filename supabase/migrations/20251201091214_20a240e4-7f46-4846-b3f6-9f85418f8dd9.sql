-- Create storage bucket for skin progress photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('skin-progress', 'skin-progress', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload own progress photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'skin-progress' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Allow users to view their own photos
CREATE POLICY "Users can view own progress photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'skin-progress' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Allow users to delete their own photos
CREATE POLICY "Users can delete own progress photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'skin-progress' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Allow public access to view photos (since bucket is public)
CREATE POLICY "Public can view progress photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'skin-progress');