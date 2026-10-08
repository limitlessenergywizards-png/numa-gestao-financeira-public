-- FASE 1: Corrigir Onboarding - Permitir criação da primeira empresa

-- 1.1 Adicionar coluna created_by na tabela companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1.2 Criar função para verificar se usuário pode criar primeira empresa
CREATE OR REPLACE FUNCTION public.can_create_first_company(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_companies
    WHERE user_id = _user_id
  )
$$;

-- 1.3 Atualizar política RLS para INSERT em companies
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;

CREATE POLICY "Users can create first company or admins can create any"
  ON public.companies FOR INSERT
  WITH CHECK (
    public.can_create_first_company(auth.uid())
    OR
    public.has_role(auth.uid(), 'admin')
  );

-- 1.4 Atualizar políticas RLS para user_companies
DROP POLICY IF EXISTS "Admins can manage user company associations" ON public.user_companies;

-- Permitir usuário associar-se a empresa que ele criou OU admins gerenciarem
CREATE POLICY "Users can join their created company or admins can manage"
  ON public.user_companies FOR INSERT
  WITH CHECK (
    (
      auth.uid() = user_id 
      AND EXISTS (
        SELECT 1 FROM public.companies 
        WHERE id = company_id 
        AND created_by = auth.uid()
      )
    )
    OR
    public.has_role(auth.uid(), 'admin')
  );

-- Admins podem fazer UPDATE/DELETE em user_companies
CREATE POLICY "Admins can update user company associations"
  ON public.user_companies FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user company associations"
  ON public.user_companies FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));