
DO $$
DECLARE
  v_user_id uuid := 'f6a03b88-1b6c-4d57-8b4e-b602f8c591f9';
  v_company_id uuid := 'a1111111-1111-1111-1111-111111111111';
  v_bank_account_id uuid := '843580f8-5086-44c1-ba1b-35b78e1ba666';
  v_tx_id uuid;
  v_payable_count int;
  v_test_desc text := 'TEST_FORECAST_SQL_' || extract(epoch from now())::text;
BEGIN
  -- 1. Simulate Auth User
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  
  -- 2. Insert Transaction (Forecast)
  INSERT INTO transactions (
    description,
    amount,
    type,
    transaction_date,
    nature,
    company_id,
    bank_account_id,
    payment_method
  ) VALUES (
    v_test_desc,
    100.00,
    'saida',
    now(),
    'previsao',
    v_company_id,
    v_bank_account_id,
    'dinheiro'
  ) RETURNING id INTO v_tx_id;
  
  RAISE NOTICE 'Created Transaction ID: %', v_tx_id;
  
  -- 3. Check Payables
  SELECT count(*) INTO v_payable_count
  FROM payables
  WHERE description = v_test_desc
  AND company_id = v_company_id;
  
  IF v_payable_count > 0 THEN
    RAISE EXCEPTION 'FAIL: Found % payable(s) for a forecast transaction!', v_payable_count;
  ELSE
    RAISE NOTICE 'SUCCESS: No payables found for forecast transaction.';
  END IF;

  -- 4. Cleanup (Rollback via exception to be safe, or just delete)
  -- To verify it really persisted temporary state, we can just delete it now.
  DELETE FROM transactions WHERE id = v_tx_id;
  RAISE NOTICE 'Cleanup complete.';

END $$;
