-- Add missing fields to receivables
ALTER TABLE public.receivables 
ADD COLUMN IF NOT EXISTS recurrence TEXT,
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method PAYMENT_METHOD;

-- Add missing fields to payables (for symmetry and future use)
ALTER TABLE public.payables 
ADD COLUMN IF NOT EXISTS recurrence TEXT,
ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_method PAYMENT_METHOD;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_receivables_bank_account ON public.receivables(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_payables_bank_account ON public.payables(bank_account_id);
