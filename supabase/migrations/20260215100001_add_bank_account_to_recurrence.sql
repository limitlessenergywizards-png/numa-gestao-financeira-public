-- Add bank_account_id to recurring_transactions
ALTER TABLE public.recurring_transactions 
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_recurring_bank_account ON public.recurring_transactions(bank_account_id);
