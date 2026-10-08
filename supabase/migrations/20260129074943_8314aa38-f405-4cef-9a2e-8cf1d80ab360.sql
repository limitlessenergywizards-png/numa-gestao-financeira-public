-- Make ocr_images bucket private and add proper RLS policies
UPDATE storage.buckets SET public = false WHERE id = 'ocr_images';

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view ocr images" ON storage.objects;

-- Create proper RLS policies for ocr_images bucket
-- Users can view images from their company's OCR scans
CREATE POLICY "Authenticated users can view their company's ocr images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ocr_images'
  AND auth.role() = 'authenticated'
  AND (
    -- Check if the image belongs to a scan from the user's company
    EXISTS (
      SELECT 1 FROM public.ocr_scans os
      INNER JOIN public.user_companies uc ON uc.company_id = os.company_id
      WHERE uc.user_id = auth.uid()
      AND storage.objects.name LIKE os.company_id::text || '/%'
    )
    OR
    -- Or the user owns the scan directly
    EXISTS (
      SELECT 1 FROM public.ocr_scans os
      WHERE os.user_id = auth.uid()
      AND storage.objects.name LIKE os.company_id::text || '/%'
    )
  )
);

-- Users can upload images to their company's folder
CREATE POLICY "Authenticated users can upload ocr images to their company"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ocr_images'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid()
      AND (storage.foldername(name))[1] = uc.company_id::text
    )
  )
);

-- Users can delete images from their company's folder (admin/editor only)
CREATE POLICY "Admins can delete ocr images from their company"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ocr_images'
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin')
  AND (
    EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.user_id = auth.uid()
      AND (storage.foldername(name))[1] = uc.company_id::text
    )
  )
);