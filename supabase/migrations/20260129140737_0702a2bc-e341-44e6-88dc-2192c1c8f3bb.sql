-- Criar funcao helper para verificar se o usuario e dono da empresa
CREATE OR REPLACE FUNCTION public.is_company_owner(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies
    WHERE id = _company_id
      AND created_by = _user_id
  )
$$;

-- =============================================
-- COST_CENTERS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert cost_centers" ON public.cost_centers;
DROP POLICY IF EXISTS "Admins and editors can update cost_centers" ON public.cost_centers;
DROP POLICY IF EXISTS "Admins can delete cost_centers" ON public.cost_centers;

CREATE POLICY "Owners, admins and editors can insert cost_centers"
ON public.cost_centers FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update cost_centers"
ON public.cost_centers FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete cost_centers"
ON public.cost_centers FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- CHART_OF_ACCOUNTS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Admins and editors can update chart_of_accounts" ON public.chart_of_accounts;
DROP POLICY IF EXISTS "Admins can delete chart_of_accounts" ON public.chart_of_accounts;

CREATE POLICY "Owners, admins and editors can insert chart_of_accounts"
ON public.chart_of_accounts FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update chart_of_accounts"
ON public.chart_of_accounts FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete chart_of_accounts"
ON public.chart_of_accounts FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- TRANSACTIONS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins and editors can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;

CREATE POLICY "Owners, admins and editors can insert transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update transactions"
ON public.transactions FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete transactions"
ON public.transactions FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- PAYABLES - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert payables" ON public.payables;
DROP POLICY IF EXISTS "Admins and editors can update payables" ON public.payables;
DROP POLICY IF EXISTS "Admins can delete payables" ON public.payables;

CREATE POLICY "Owners, admins and editors can insert payables"
ON public.payables FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update payables"
ON public.payables FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete payables"
ON public.payables FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- RECEIVABLES - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert receivables" ON public.receivables;
DROP POLICY IF EXISTS "Admins and editors can update receivables" ON public.receivables;
DROP POLICY IF EXISTS "Admins can delete receivables" ON public.receivables;

CREATE POLICY "Owners, admins and editors can insert receivables"
ON public.receivables FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update receivables"
ON public.receivables FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete receivables"
ON public.receivables FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- CUSTOMERS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Admins and editors can update customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete customers" ON public.customers;

CREATE POLICY "Owners, admins and editors can insert customers"
ON public.customers FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update customers"
ON public.customers FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete customers"
ON public.customers FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- SUPPLIERS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins and editors can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;

CREATE POLICY "Owners, admins and editors can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update suppliers"
ON public.suppliers FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete suppliers"
ON public.suppliers FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);

-- =============================================
-- BANK_ACCOUNTS - Atualizar politicas
-- =============================================
DROP POLICY IF EXISTS "Admins and editors can insert bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins and editors can update bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Admins can delete bank_accounts" ON public.bank_accounts;

CREATE POLICY "Owners, admins and editors can insert bank_accounts"
ON public.bank_accounts FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners, admins and editors can update bank_accounts"
ON public.bank_accounts FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin') 
    OR has_role(auth.uid(), 'editor')
    OR is_company_owner(auth.uid(), company_id)
  )
);

CREATE POLICY "Owners and admins can delete bank_accounts"
ON public.bank_accounts FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) 
  AND (
    has_role(auth.uid(), 'admin')
    OR is_company_owner(auth.uid(), company_id)
  )
);