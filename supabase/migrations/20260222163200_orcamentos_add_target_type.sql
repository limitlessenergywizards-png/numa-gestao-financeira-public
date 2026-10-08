ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) DEFAULT 'chart_account';
