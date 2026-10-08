
-- Function to cleanup transactions when parent payable is deleted
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_transaction_on_payable_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.transactions 
  WHERE forecast_basis = 'payable:' || OLD.id;
  RETURN OLD;
END;
$$;

-- Trigger for payables
DROP TRIGGER IF EXISTS tr_cleanup_tx_on_payable_delete ON public.payables;
CREATE TRIGGER tr_cleanup_tx_on_payable_delete
AFTER DELETE ON public.payables
FOR EACH ROW EXECUTE FUNCTION public.cleanup_orphaned_transaction_on_payable_delete();

-- Function to cleanup transactions when parent receivable is deleted
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_transaction_on_receivable_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.transactions 
  WHERE forecast_basis = 'receivable:' || OLD.id;
  RETURN OLD;
END;
$$;

-- Trigger for receivables
DROP TRIGGER IF EXISTS tr_cleanup_tx_on_receivable_delete ON public.receivables;
CREATE TRIGGER tr_cleanup_tx_on_receivable_delete
AFTER DELETE ON public.receivables
FOR EACH ROW EXECUTE FUNCTION public.cleanup_orphaned_transaction_on_receivable_delete();

-- Perform immediate cleanup of existing orphans for the specific company reported
-- This is a one-time cleanup that can be included in the migration safely
DO $$
BEGIN
  -- Cleanup transactions where the linked payable no longer exists
  DELETE FROM public.transactions t
  WHERE t.forecast_basis LIKE 'payable:%'
  AND NOT EXISTS (
    SELECT 1 FROM public.payables p 
    WHERE p.id = SUBSTRING(t.forecast_basis FROM 9)::UUID
  );

  -- Cleanup transactions where the linked receivable no longer exists
  DELETE FROM public.transactions t
  WHERE t.forecast_basis LIKE 'receivable:%'
  AND NOT EXISTS (
    SELECT 1 FROM public.receivables r 
    WHERE r.id = SUBSTRING(t.forecast_basis FROM 12)::UUID
  );
END $$;
