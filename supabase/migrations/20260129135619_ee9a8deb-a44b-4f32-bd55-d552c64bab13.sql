-- Criar tabela de centros de custo
CREATE TABLE public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#C5A059',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- Adicionar coluna em transactions
ALTER TABLE public.transactions 
ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id);

-- Adicionar coluna em payables
ALTER TABLE public.payables 
ADD COLUMN cost_center_id UUID REFERENCES public.cost_centers(id);

-- RLS para cost_centers
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cost_centers of their companies"
ON public.cost_centers FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert cost_centers"
ON public.cost_centers FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins and editors can update cost_centers"
ON public.cost_centers FOR UPDATE
USING (user_belongs_to_company(auth.uid(), company_id) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'editor')));

CREATE POLICY "Admins can delete cost_centers"
ON public.cost_centers FOR DELETE
USING (user_belongs_to_company(auth.uid(), company_id) 
  AND has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();