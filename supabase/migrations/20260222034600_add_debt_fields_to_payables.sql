-- Add debt tracking columns to payables table
ALTER TABLE payables 
ADD COLUMN IF NOT EXISTS is_debt_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS debt_id UUID REFERENCES debts(id) ON DELETE SET NULL;

-- Create an index for faster lookups when filtering by debt
CREATE INDEX IF NOT EXISTS payables_debt_id_idx ON payables(debt_id);
