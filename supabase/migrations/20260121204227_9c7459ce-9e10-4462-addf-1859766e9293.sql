-- Add mobile_phone column to companies table
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS mobile_phone TEXT;