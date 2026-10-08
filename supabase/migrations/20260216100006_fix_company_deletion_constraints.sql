
-- Fix company deletion by deferring foreign key constraints and removing blocking constraints
-- This allows deleting a company (which cascades to all tables) without being blocked by 
-- internal dependencies (e.g. transactions -> bank_accounts) check order.

-- 1. transactions -> bank_accounts
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_bank_account_id_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_bank_account_id_fkey
FOREIGN KEY (bank_account_id)
REFERENCES public.bank_accounts(id)
ON DELETE NO ACTION
DEFERRABLE INITIALLY DEFERRED;

-- 2. receivables -> customers
ALTER TABLE public.receivables
DROP CONSTRAINT IF EXISTS receivables_customer_id_fkey;

ALTER TABLE public.receivables
ADD CONSTRAINT receivables_customer_id_fkey
FOREIGN KEY (customer_id)
REFERENCES public.customers(id)
ON DELETE NO ACTION
DEFERRABLE INITIALLY DEFERRED;

-- 3. payables -> suppliers
ALTER TABLE public.payables
DROP CONSTRAINT IF EXISTS payables_supplier_id_fkey;

ALTER TABLE public.payables
ADD CONSTRAINT payables_supplier_id_fkey
FOREIGN KEY (supplier_id)
REFERENCES public.suppliers(id)
ON DELETE NO ACTION
DEFERRABLE INITIALLY DEFERRED;

-- 4. payment_records -> bank_accounts
ALTER TABLE public.payment_records
DROP CONSTRAINT IF EXISTS payment_records_bank_account_id_fkey;

ALTER TABLE public.payment_records
ADD CONSTRAINT payment_records_bank_account_id_fkey
FOREIGN KEY (bank_account_id)
REFERENCES public.bank_accounts(id)
ON DELETE NO ACTION
DEFERRABLE INITIALLY DEFERRED;

-- 5. audit_logs -> companies
-- The error "insert or update on table audit_logs violates foreign key constraint" happens because
-- triggers insert deletion logs while the company is also being deleted. The FK requires the company 
-- to exist, but the log essentially references a 'dying' company.
-- We must remove the FK requirement to allow logging the deletion of the company and its children.
ALTER TABLE public.audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_company_id_fkey;

-- We also make it nullable just in case, though preserving the ID is useful for history.
ALTER TABLE public.audit_logs
ALTER COLUMN company_id DROP NOT NULL;
