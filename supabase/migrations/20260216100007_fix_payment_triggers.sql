-- Migration to robustly handle payment record changes (INSERT, UPDATE, DELETE)
-- Fixes issue where updating a payment record didn't update balances or statuses
-- Replaces incomplete update_bank_balance_on_payment function

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS update_bank_balance_payment ON public.payment_records;
DROP FUNCTION IF EXISTS public.update_bank_balance_on_payment();

-- 2. Create comprehensive function
CREATE OR REPLACE FUNCTION public.handle_payment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle DELETE or UPDATE (Revert OLD values)
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    IF OLD.receivable_id IS NOT NULL THEN
      -- 1. Revert Bank Balance (Incoming money removed -> Subtract)
      UPDATE public.bank_accounts 
      SET current_balance = current_balance - OLD.amount 
      WHERE id = OLD.bank_account_id;
      
      -- 2. Revert Receivable Paid Amount & Status
      UPDATE public.receivables
      SET paid_amount = paid_amount - OLD.amount,
          status = CASE 
            WHEN paid_amount - OLD.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount - OLD.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = OLD.receivable_id;
      
    ELSIF OLD.payable_id IS NOT NULL THEN
      -- 1. Revert Bank Balance (Outgoing money removed -> Add back)
      UPDATE public.bank_accounts 
      SET current_balance = current_balance + OLD.amount 
      WHERE id = OLD.bank_account_id;
      
      -- 2. Revert Payable Paid Amount & Status
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

  -- Handle INSERT or UPDATE (Apply NEW values)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.receivable_id IS NOT NULL THEN
      -- 1. Apply Bank Balance (Incoming money -> Add)
      UPDATE public.bank_accounts 
      SET current_balance = current_balance + NEW.amount 
      WHERE id = NEW.bank_account_id;
      
      -- 2. Apply Receivable Paid Amount & Status
      UPDATE public.receivables
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::receivable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::receivable_status
            ELSE 'pendente'::receivable_status
          END
      WHERE id = NEW.receivable_id;
      
    ELSIF NEW.payable_id IS NOT NULL THEN
      -- 1. Apply Bank Balance (Outgoing money -> Subtract)
      UPDATE public.bank_accounts 
      SET current_balance = current_balance - NEW.amount 
      WHERE id = NEW.bank_account_id;
      
      -- 2. Apply Payable Paid Amount & Status
      UPDATE public.payables
      SET paid_amount = paid_amount + NEW.amount,
          status = CASE 
            WHEN paid_amount + NEW.amount >= total_amount THEN 'pago'::payable_status
            WHEN paid_amount + NEW.amount > 0 THEN 'parcial'::payable_status
            ELSE 'pendente'::payable_status
          END
      WHERE id = NEW.payable_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Create new trigger covering INSERT, UPDATE, DELETE
CREATE TRIGGER handle_payment_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION public.handle_payment_changes();
