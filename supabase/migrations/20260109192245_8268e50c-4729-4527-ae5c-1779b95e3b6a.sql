-- Add new columns to companies table for complete address
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text;

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for logo uploads - authenticated users can upload
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company_logos');

-- RLS policy for viewing logos - anyone authenticated can view
CREATE POLICY "Authenticated users can view company logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'company_logos');

-- RLS policy for updating logos
CREATE POLICY "Authenticated users can update company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company_logos');

-- RLS policy for deleting logos
CREATE POLICY "Authenticated users can delete company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company_logos');