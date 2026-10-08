-- Add trial_started_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.trial_started_at IS 
  'Data de início do período de trial gratuito de 3 dias';