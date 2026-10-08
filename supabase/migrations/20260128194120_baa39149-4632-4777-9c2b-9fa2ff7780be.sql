-- Define DEFAULT para created_by como auth.uid()
ALTER TABLE public.companies
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Trigger para forçar created_by = auth.uid() mesmo se vier NULL explícito
CREATE OR REPLACE FUNCTION public.set_company_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sempre força created_by para o usuário autenticado
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_company_created_by
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_created_by();