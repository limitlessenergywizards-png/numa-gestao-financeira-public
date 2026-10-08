-- Create categories table for personal organization
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('receita', 'despesa', 'ambos')),
  color VARCHAR(7) DEFAULT '#6366f1',
  icon VARCHAR(50) DEFAULT 'tag',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_categories_company ON public.categories(company_id);
CREATE INDEX idx_categories_type ON public.categories(company_id, type);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies using security definer functions (avoid recursion)
CREATE POLICY "Users can view categories of their company"
  ON public.categories FOR SELECT
  USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Owners, admins and editors can insert categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    user_belongs_to_company(auth.uid(), company_id) AND 
    (has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'editor'::app_role) OR 
     is_company_owner(auth.uid(), company_id))
  );

CREATE POLICY "Owners, admins and editors can update categories"
  ON public.categories FOR UPDATE
  USING (
    user_belongs_to_company(auth.uid(), company_id) AND 
    (has_role(auth.uid(), 'admin'::app_role) OR 
     has_role(auth.uid(), 'editor'::app_role) OR 
     is_company_owner(auth.uid(), company_id))
  );

CREATE POLICY "Owners and admins can delete categories"
  ON public.categories FOR DELETE
  USING (
    user_belongs_to_company(auth.uid(), company_id) AND 
    (has_role(auth.uid(), 'admin'::app_role) OR 
     is_company_owner(auth.uid(), company_id))
  );

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();