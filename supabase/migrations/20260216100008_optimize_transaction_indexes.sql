-- Add specialized indexes for financial dashboard queries

-- Index for "Recent Transactions" widget (usually sorts by created_at desc)
CREATE INDEX IF NOT EXISTS idx_transactions_company_created_at 
ON public.transactions(company_id, created_at DESC);

-- Index for "Pending Transactions" widgets (filters by status)
CREATE INDEX IF NOT EXISTS idx_transactions_company_status_date
ON public.transactions(company_id, status, transaction_date);

-- Index for "Cash Flow" and "DRE" reports (filters by type and date)
CREATE INDEX IF NOT EXISTS idx_transactions_company_type_date
ON public.transactions(company_id, type, transaction_date);

-- Index for "By Category" reports
CREATE INDEX IF NOT EXISTS idx_transactions_company_category
ON public.transactions(company_id, category_id);

-- Composite index for bank account reconciliation (often filters by bank_account and date)
CREATE INDEX IF NOT EXISTS idx_transactions_account_date
ON public.transactions(bank_account_id, transaction_date);
