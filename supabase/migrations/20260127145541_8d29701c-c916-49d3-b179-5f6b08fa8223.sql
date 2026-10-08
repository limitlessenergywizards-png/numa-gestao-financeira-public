-- Recria a policy de INSERT de forma mais direta (sem função) para evitar inconsistências
DROP POLICY IF EXISTS "Allow first company creation or admin insert" ON public.companies;

CREATE POLICY "Allow first company creation or admin insert"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      created_by = auth.uid()
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_companies uc
        WHERE uc.user_id = auth.uid()
      )
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
