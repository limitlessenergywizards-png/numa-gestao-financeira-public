-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS update_bank_balance_payment ON public.payment_records;

CREATE OR REPLACE FUNCTION public.update_bank_balance_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
  ELSIF TG_OP = 'UPDATE' THEN
    -- First: Reverse the old record entirely
    IF OLD.receivable_id IS NOT NULL THEN
      UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
      UPDATE public.receivables 
      SET paid_amount = paid_amount - OLD.amount
      WHERE id = OLD.receivable_id;
    ELSE
      UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
      UPDATE public.payables 
      SET paid_amount = paid_amount - OLD.amount
      WHERE id = OLD.payable_id;
    END IF;

    -- Second: Apply the new record
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
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Note: We now watch UPDATE
CREATE TRIGGER update_bank_balance_payment
AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
FOR EACH ROW EXECUTE FUNCTION public.update_bank_balance_on_payment();
