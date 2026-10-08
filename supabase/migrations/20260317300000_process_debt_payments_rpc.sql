-- RPC: process_debt_payments
-- Batch-processes debt payment records and updates debt balances atomically.
-- Replaces the N+1 frontend loop (3N round trips → 1).

CREATE OR REPLACE FUNCTION process_debt_payments(
  p_payments jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payment jsonb;
  debt_record record;
  new_balance numeric;
  new_paid numeric;
BEGIN
  FOR payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    -- Insert debt_payment record
    INSERT INTO debt_payments (
      debt_id, company_id, payment_date, due_date,
      principal_amount, interest_amount, total_amount, balance_after
    )
    VALUES (
      (payment->>'debt_id')::uuid,
      (payment->>'company_id')::uuid,
      (payment->>'payment_date')::date,
      (payment->>'due_date')::date,
      (payment->>'principal_amount')::numeric,
      0,
      (payment->>'total_amount')::numeric,
      0
    );

    -- Update debt balance atomically (FOR UPDATE prevents concurrent modifications)
    SELECT current_balance, paid_amount INTO debt_record
    FROM debts
    WHERE id = (payment->>'debt_id')::uuid
      AND company_id = (payment->>'company_id')::uuid
    FOR UPDATE;

    IF FOUND THEN
      new_balance := GREATEST(0, debt_record.current_balance - (payment->>'total_amount')::numeric);
      new_paid := COALESCE(debt_record.paid_amount, 0) + (payment->>'total_amount')::numeric;

      UPDATE debts SET
        current_balance = new_balance,
        paid_amount = new_paid,
        updated_at = NOW()
      WHERE id = (payment->>'debt_id')::uuid
        AND company_id = (payment->>'company_id')::uuid;
    END IF;
  END LOOP;
END;
$$;
