-- FASE 1: Remover políticas antigas para garantir estado limpo
DROP POLICY IF EXISTS "Users can create first company or admins can create any" ON public.companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;

-- FASE 2: Recriar a função com VOLATILE para evitar cache
CREATE OR REPLACE FUNCTION public.can_create_first_company(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
  )
$$;

-- FASE 3: Criar política de INSERT permitindo criação da primeira empresa
CREATE POLICY "Allow first company creation or admin insert"
  ON public.companies FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_create_first_company(auth.uid())
    OR
    public.has_role(auth.uid(), 'admin'::app_role)
  );

-- FASE 4: Garantir GRANT correto para authenticated
GRANT INSERT ON public.companies TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;