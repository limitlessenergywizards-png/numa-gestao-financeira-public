-- Create status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed');

-- Add status column to transactions table
ALTER TABLE public.transactions ADD COLUMN status transaction_status NOT NULL DEFAULT 'completed';

-- Update trigger function to handle status
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle updates and deletes (Revert OLD effect if it was completed)
  IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
    IF OLD.status = 'completed' THEN
      IF OLD.type = 'entrada' THEN
        UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
      ELSE
        UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
      END IF;
    END IF;
  END IF;

  -- Handle inserts and updates (Apply NEW effect if it is completed)
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' THEN
      IF NEW.type = 'entrada' THEN
        UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
      ELSE
        UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;
