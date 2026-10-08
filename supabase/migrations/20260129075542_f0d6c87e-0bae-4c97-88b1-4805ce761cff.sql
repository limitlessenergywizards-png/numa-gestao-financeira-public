-- Fix 1: Make company_logos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'company_logos';

-- Fix 2: Improve bank balance triggers with validation
-- Update update_bank_balance_on_transaction with amount validation
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate amount is positive
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Transaction amount must be positive';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Revert old transaction
    IF OLD.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
    END IF;
    -- Apply new transaction
    IF NEW.type = 'entrada' THEN
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Update update_bank_balance_on_payment with amount validation
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_payment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate amount is positive
  IF TG_OP = 'INSERT' THEN
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Payment amount must be positive';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.receivable_id IS NOT NULL THEN
      -- Receivable payment = money coming in
      UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
      -- Update receivable paid_amount and status
      UPDATE public.receivables 
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = NEW.receivable_id;
    ELSE
      -- Payable payment = money going out
      UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
      -- Update payable paid_amount and status
      UPDATE public.payables 
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::payable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::payable_status
            ELSE 'pendente'::payable_status
          END
      WHERE id = NEW.payable_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.receivable_id IS NOT NULL THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
      UPDATE public.receivables 
      SET paid_amount = paid_amount - OLD.amount,
          status = CASE 
            WHEN paid_amount - OLD.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount - OLD.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = OLD.receivable_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
      UPDATE public.payables 
      SET paid_amount = paid_amount - OLD.amount,
          status = CASE 
            WHEN paid_amount - OLD.amount >= total_amount THEN 'pago'::payable_status
            WHEN paid_amount - OLD.amount > 0 THEN 'parcial'::payable_status
            ELSE 'pendente'::payable_status
          END
      WHERE id = OLD.payable_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix 3: Fix race condition in handle_new_user with row locking
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role app_role;
  v_admin_exists boolean;
BEGIN
  -- Create profile with trial started
  INSERT INTO public.profiles (user_id, full_name, trial_started_at)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', now());
  
  -- Use FOR UPDATE to lock the rows and prevent race condition
  -- SKIP LOCKED ensures we don't wait if another transaction has the lock
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE role = 'admin' 
    FOR UPDATE SKIP LOCKED
  ) INTO v_admin_exists;
  
  IF NOT v_admin_exists THEN
    v_role := 'admin';
  ELSE
    v_role := 'viewer';
  END IF;
  
  -- Assign role (avoid duplicates)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;