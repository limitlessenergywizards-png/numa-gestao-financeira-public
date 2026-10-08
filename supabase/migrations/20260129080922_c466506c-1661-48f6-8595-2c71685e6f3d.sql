-- Fix company_logos storage bucket RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company logos" ON storage.objects;

-- Create proper RLS policies that validate company membership
-- File path format: {company_id}/{filename}

-- SELECT: Users can view logos from companies they belong to
CREATE POLICY "Users can view logos from their companies"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- INSERT: Admins can upload logos to their companies
CREATE POLICY "Admins can upload logos to their companies"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid) AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- UPDATE: Admins can update logos in their companies
CREATE POLICY "Admins can update logos in their companies"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid) AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- DELETE: Admins can delete logos from their companies
CREATE POLICY "Admins can delete logos from their companies"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company_logos' AND
  public.user_belongs_to_company(auth.uid(), (storage.foldername(name))[1]::uuid) AND
  public.has_role(auth.uid(), 'admin'::app_role)
);