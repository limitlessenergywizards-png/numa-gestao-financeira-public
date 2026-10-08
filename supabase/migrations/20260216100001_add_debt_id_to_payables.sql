ALTER TABLE payables
ADD COLUMN debt_id UUID REFERENCES debts(id) ON DELETE SET NULL;

CREATE INDEX idx_payables_debt_id ON payables(debt_id);
