-- ============================================================
-- Migration: Chart of Accounts — Full Balance Sheet + Templates
-- ============================================================

-- 1. Expand enum with balance sheet account types
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction block
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'ativo';
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'passivo';
ALTER TYPE public.account_entry_type ADD VALUE IF NOT EXISTS 'patrimonio';

-- 2. Add new columns to chart_of_accounts
ALTER TABLE public.chart_of_accounts
  ADD COLUMN IF NOT EXISTS nature TEXT DEFAULT 'devedora',
  ADD COLUMN IF NOT EXISTS is_analytical BOOLEAN DEFAULT true;

-- Add CHECK constraint for nature (separate statement for IF NOT EXISTS safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chart_of_accounts_nature_check'
  ) THEN
    ALTER TABLE public.chart_of_accounts
      ADD CONSTRAINT chart_of_accounts_nature_check
      CHECK (nature IN ('devedora', 'credora'));
  END IF;
END $$;

-- 3. Create chart_account_templates table
CREATE TABLE IF NOT EXISTS public.chart_account_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  segment TEXT NOT NULL DEFAULT 'geral',
  version TEXT DEFAULT '1.0',
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_account_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system templates"
  ON public.chart_account_templates FOR SELECT
  USING (is_system = true);

CREATE TRIGGER update_chart_account_templates_updated_at
  BEFORE UPDATE ON public.chart_account_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create chart_account_template_items table
CREATE TABLE IF NOT EXISTS public.chart_account_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.chart_account_templates(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type public.account_entry_type NOT NULL,
  nature TEXT NOT NULL DEFAULT 'devedora' CHECK (nature IN ('devedora', 'credora')),
  level INTEGER NOT NULL DEFAULT 1,
  parent_code TEXT,
  is_analytical BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  dre_category TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(template_id, code)
);

ALTER TABLE public.chart_account_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system template items"
  ON public.chart_account_template_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chart_account_templates t
    WHERE t.id = template_id AND t.is_system = true
  ));

-- 5. Create chart_account_template_dre_mapping table
CREATE TABLE IF NOT EXISTS public.chart_account_template_dre_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.chart_account_templates(id) ON DELETE CASCADE,
  dre_line_id TEXT NOT NULL,
  dre_line_name TEXT NOT NULL,
  account_codes TEXT[] NOT NULL DEFAULT '{}',
  operation TEXT NOT NULL DEFAULT 'sum' CHECK (operation IN ('sum', 'subtract', 'calculated')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chart_account_template_dre_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view system template DRE mapping"
  ON public.chart_account_template_dre_mapping FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chart_account_templates t
    WHERE t.id = template_id AND t.is_system = true
  ));

-- 6. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_template_items_template_id
  ON public.chart_account_template_items(template_id);

CREATE INDEX IF NOT EXISTS idx_template_items_code
  ON public.chart_account_template_items(template_id, code);

CREATE INDEX IF NOT EXISTS idx_template_dre_mapping_template_id
  ON public.chart_account_template_dre_mapping(template_id);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_nature
  ON public.chart_of_accounts(nature);

CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_is_analytical
  ON public.chart_of_accounts(is_analytical);
