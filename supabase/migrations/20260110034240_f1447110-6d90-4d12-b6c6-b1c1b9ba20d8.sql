-- Create ocr_scans table for storing OCR history
CREATE TABLE public.ocr_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  extracted_text TEXT NOT NULL,
  extracted_data JSONB DEFAULT '{}',
  source_type TEXT NOT NULL CHECK (source_type IN ('receivable', 'payable')),
  linked_record_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ocr_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ocr_scans of their companies"
ON public.ocr_scans
FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert ocr_scans"
ON public.ocr_scans
FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins can delete ocr_scans"
ON public.ocr_scans
FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage bucket for OCR images
INSERT INTO storage.buckets (id, name, public) VALUES ('ocr_images', 'ocr_images', true);

-- Storage policies for ocr_images bucket
CREATE POLICY "Anyone can view ocr images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ocr_images');

CREATE POLICY "Authenticated users can upload ocr images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ocr_images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own ocr images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ocr_images' AND auth.uid()::text = (storage.foldername(name))[1]);