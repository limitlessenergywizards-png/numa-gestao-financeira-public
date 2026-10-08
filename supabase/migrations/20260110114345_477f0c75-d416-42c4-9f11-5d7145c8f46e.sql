-- Tabela para metas/orçamento do DRE
CREATE TABLE public.dre_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  budgeted_value DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, period_year, period_month, category_code)
);

-- Enable RLS
ALTER TABLE public.dre_budget ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view budget for their companies
CREATE POLICY "Users can view budget for their companies"
  ON public.dre_budget FOR SELECT
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Policy: Users can insert budget for their companies
CREATE POLICY "Users can insert budget for their companies"
  ON public.dre_budget FOR INSERT
  WITH CHECK (public.user_belongs_to_company(auth.uid(), company_id));

-- Policy: Users can update budget for their companies
CREATE POLICY "Users can update budget for their companies"
  ON public.dre_budget FOR UPDATE
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Policy: Users can delete budget for their companies
CREATE POLICY "Users can delete budget for their companies"
  ON public.dre_budget FOR DELETE
  USING (public.user_belongs_to_company(auth.uid(), company_id));

-- Trigger for updated_at
CREATE TRIGGER update_dre_budget_updated_at
  BEFORE UPDATE ON public.dre_budget
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();