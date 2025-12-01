-- Add RLS policies for skin-progress storage bucket
-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload own progress photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'skin-progress' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own progress photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'skin-progress' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view all files (since bucket is public)
CREATE POLICY "Public can view progress photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'skin-progress');

-- Allow users to delete their own files
CREATE POLICY "Users can delete own progress photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'skin-progress' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);