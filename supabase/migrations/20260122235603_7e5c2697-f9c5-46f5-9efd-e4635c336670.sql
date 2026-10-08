-- Add reconciliation columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reconciled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reconciled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reconciled_by uuid,
ADD COLUMN IF NOT EXISTS bank_statement_ref text;

-- Create index for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled 
ON public.transactions(company_id, bank_account_id, reconciled);

-- Create bank_statements table for imported OFX transactions
CREATE TABLE public.bank_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  
  -- OFX transaction data
  fitid text NOT NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  memo text,
  check_number text,
  
  -- Reconciliation status
  reconciled boolean DEFAULT false,
  reconciled_transaction_id uuid REFERENCES public.transactions(id),
  reconciled_at timestamp with time zone,
  reconciled_by uuid,
  
  -- Import metadata
  imported_at timestamp with time zone DEFAULT now(),
  imported_by uuid NOT NULL,
  source_file text,
  
  created_at timestamp with time zone DEFAULT now(),
  
  -- Prevent duplicate FITIDs for the same account
  UNIQUE(bank_account_id, fitid)
);

-- Enable RLS on bank_statements
ALTER TABLE public.bank_statements ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank_statements
CREATE POLICY "Users can view bank_statements of their companies"
ON public.bank_statements FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert bank_statements"
ON public.bank_statements FOR INSERT
WITH CHECK (
  user_belongs_to_company(auth.uid(), company_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins and editors can update bank_statements"
ON public.bank_statements FOR UPDATE
USING (
  user_belongs_to_company(auth.uid(), company_id) AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role))
);

CREATE POLICY "Admins can delete bank_statements"
ON public.bank_statements FOR DELETE
USING (
  user_belongs_to_company(auth.uid(), company_id) AND 
  has_role(auth.uid(), 'admin'::app_role)
);