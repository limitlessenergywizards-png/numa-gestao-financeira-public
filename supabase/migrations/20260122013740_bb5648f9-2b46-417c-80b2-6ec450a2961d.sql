-- Add tax_regime column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS tax_regime text DEFAULT 'simples_nacional';

COMMENT ON COLUMN public.companies.tax_regime IS 'Regime tributario: simples_nacional, lucro_presumido, lucro_real, mei';