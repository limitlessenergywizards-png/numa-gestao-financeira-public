-- Drop policies that failed to create (just in case they were partially created or we want to replace them if they existed)
DROP POLICY IF EXISTS "Users can view recurring transactions of their company" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can insert recurring transactions for their company" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can update recurring transactions of their company" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Users can delete recurring transactions of their company" ON public.recurring_transactions;

DROP POLICY IF EXISTS "Users can view occurrences of their company" ON public.recurring_occurrences;
DROP POLICY IF EXISTS "Users can insert occurrences for their company" ON public.recurring_occurrences;
DROP POLICY IF EXISTS "Users can update occurrences of their company" ON public.recurring_occurrences;

-- Re-create Policies for recurring_transactions using user_companies check
CREATE POLICY "Users can view recurring transactions of their company" 
ON public.recurring_transactions FOR SELECT 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert recurring transactions for their company" 
ON public.recurring_transactions FOR INSERT 
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update recurring transactions of their company" 
ON public.recurring_transactions FOR UPDATE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete recurring transactions of their company" 
ON public.recurring_transactions FOR DELETE 
USING (
  company_id IN (
    SELECT company_id 
    FROM public.user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Re-create Policies for recurring_occurrences (using join via recurring_transactions)
CREATE POLICY "Users can view occurrences of their company" 
ON public.recurring_occurrences FOR SELECT 
USING (
  recurring_id IN (
    SELECT id FROM public.recurring_transactions 
    WHERE company_id IN (
      SELECT company_id 
      FROM public.user_companies 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert occurrences for their company" 
ON public.recurring_occurrences FOR INSERT 
WITH CHECK (
  recurring_id IN (
    SELECT id FROM public.recurring_transactions 
    WHERE company_id IN (
      SELECT company_id 
      FROM public.user_companies 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can update occurrences of their company" 
ON public.recurring_occurrences FOR UPDATE 
USING (
  recurring_id IN (
    SELECT id FROM public.recurring_transactions 
    WHERE company_id IN (
      SELECT company_id 
      FROM public.user_companies 
      WHERE user_id = auth.uid()
    )
  )
);
