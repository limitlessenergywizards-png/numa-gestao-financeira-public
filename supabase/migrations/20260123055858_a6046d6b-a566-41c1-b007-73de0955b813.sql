-- Add columns for tracking original dates
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS original_transaction_date date,
ADD COLUMN IF NOT EXISTS original_created_at timestamptz;

-- Create function to save original dates on first edit
CREATE OR REPLACE FUNCTION save_original_dates()
RETURNS TRIGGER AS $$
BEGIN
  -- Save original transaction_date on first change
  IF OLD.original_transaction_date IS NULL 
     AND NEW.transaction_date IS DISTINCT FROM OLD.transaction_date THEN
    NEW.original_transaction_date = OLD.transaction_date;
  END IF;
  
  -- Save original created_at if changed (rare but tracked)
  IF OLD.original_created_at IS NULL 
     AND NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    NEW.original_created_at = OLD.created_at;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to save original dates
DROP TRIGGER IF EXISTS tr_save_original_dates ON transactions;
CREATE TRIGGER tr_save_original_dates
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION save_original_dates();