-- Fix security warning: Set search_path for the function
CREATE OR REPLACE FUNCTION save_original_dates()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
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