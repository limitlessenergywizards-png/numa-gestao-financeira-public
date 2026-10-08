-- Create cost_type enum
CREATE TYPE public.cost_type AS ENUM ('fixed', 'variable');

-- Add cost_type column to chart_of_accounts table
ALTER TABLE public.chart_of_accounts ADD COLUMN cost_type cost_type NOT NULL DEFAULT 'variable';
