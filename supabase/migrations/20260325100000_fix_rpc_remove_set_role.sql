-- Fix: Remove SET role = 'postgres' from create_company_and_associate RPC
--
-- Problem: SET role = 'postgres' inside the function caused auth.uid() to return NULL,
-- because switching to the postgres role loses the JWT context. This made the
-- "Not authenticated" check always fail, which Supabase surfaced as:
--   "new row violates row-level security policy for table 'companies'"
--
-- Solution: Remove SET role, keep SECURITY DEFINER (which is sufficient for
-- bypassing RLS when the function owner is postgres).

CREATE OR REPLACE FUNCTION public.create_company_and_associate(
  p_name TEXT,
  p_trading_name TEXT DEFAULT NULL,
  p_document TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_mobile_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_number TEXT DEFAULT NULL,
  p_complement TEXT DEFAULT NULL,
  p_neighborhood TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_zip_code TEXT DEFAULT NULL,
  p_currency TEXT DEFAULT 'BRL',
  p_currency_symbol TEXT DEFAULT 'R$',
  p_tax_regime TEXT DEFAULT NULL,
  p_is_headquarters BOOLEAN DEFAULT FALSE,
  p_logo_url TEXT DEFAULT NULL,
  p_segment TEXT DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_uid UUID;
  v_company RECORD;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated.' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(TRIM(p_name), '') = '' THEN
    RAISE EXCEPTION 'Company name is required.' USING ERRCODE = '23502';
  END IF;

  INSERT INTO public.companies (
    name, trading_name, document, email, phone, mobile_phone,
    address, number, complement, neighborhood, city, state, zip_code,
    currency, currency_symbol, tax_regime, is_headquarters,
    logo_url, segment, created_by
  ) VALUES (
    TRIM(p_name), p_trading_name, p_document, p_email, p_phone, p_mobile_phone,
    p_address, p_number, p_complement, p_neighborhood, p_city, p_state, p_zip_code,
    p_currency, p_currency_symbol, p_tax_regime, p_is_headquarters,
    p_logo_url, p_segment, v_auth_uid
  ) RETURNING * INTO v_company;

  INSERT INTO public.user_companies (user_id, company_id, is_default, role)
  VALUES (v_auth_uid, v_company.id, p_is_default, 'admin');

  RETURN json_build_object(
    'id', v_company.id,
    'name', v_company.name,
    'created_by', v_company.created_by
  );
END;
$$;

ALTER FUNCTION public.create_company_and_associate(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, BOOLEAN
) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.create_company_and_associate(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, BOOLEAN
) TO authenticated;
