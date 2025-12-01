-- Update storage RLS policies for skin-progress bucket to handle all user uploads

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own progress photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view progress photos" ON storage.objects;

-- Create updated policies
-- Allow public read access for all photos in skin-progress bucket
CREATE POLICY "Public read access for skin-progress"
ON storage.objects FOR SELECT
USING (bucket_id = 'skin-progress');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'skin-progress' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'skin-progress'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'skin-progress'
  AND auth.uid()::text = (storage.foldername(name))[1]
);