-- Create bank_statement_imports table to track import history
CREATE TABLE public.bank_statement_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  bank_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  filename text NOT NULL,
  import_date timestamptz DEFAULT now(),
  period_start date,
  period_end date,
  total_transactions int NOT NULL DEFAULT 0,
  total_credits numeric(15,2) DEFAULT 0,
  total_debits numeric(15,2) DEFAULT 0,
  imported_by uuid NOT NULL,
  detected_bank_name text,
  created_at timestamptz DEFAULT now()
);

-- Add import_id reference to bank_statements table
ALTER TABLE public.bank_statements ADD COLUMN import_id uuid REFERENCES public.bank_statement_imports(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.bank_statement_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank_statement_imports
CREATE POLICY "Users can view imports of their companies"
ON public.bank_statement_imports
FOR SELECT
USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "Admins and editors can insert imports"
ON public.bank_statement_imports
FOR INSERT
WITH CHECK (user_belongs_to_company(auth.uid(), company_id) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)));

CREATE POLICY "Admins can delete imports"
ON public.bank_statement_imports
FOR DELETE
USING (user_belongs_to_company(auth.uid(), company_id) AND has_role(auth.uid(), 'admin'::app_role));