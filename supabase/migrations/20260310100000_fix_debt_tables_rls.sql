-- ═══════════════════════════════════════════════════════════════════════════════
-- IRON GATE FIX: Debt tables RLS policies were tautologies (always true)
--
-- VULNERABILITY: Original policies used:
--   USING (company_id IN (SELECT id FROM companies WHERE id = debts.company_id))
-- This is a circular reference that always evaluates to TRUE.
-- ANY authenticated user could read/write ALL companies' debt data.
--
-- FIX: Replace with user_belongs_to_company() — same pattern as transactions table
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. DROP broken policies for debts
DROP POLICY IF EXISTS "Users can view debts from their company" ON debts;
DROP POLICY IF EXISTS "Users can insert debts for their company" ON debts;
DROP POLICY IF EXISTS "Users can update debts for their company" ON debts;
DROP POLICY IF EXISTS "Users can delete debts for their company" ON debts;

-- 2. DROP broken policies for debt_payments
DROP POLICY IF EXISTS "Users can view debt_payments from their company" ON debt_payments;
DROP POLICY IF EXISTS "Users can insert debt_payments for their company" ON debt_payments;
DROP POLICY IF EXISTS "Users can update debt_payments for their company" ON debt_payments;
DROP POLICY IF EXISTS "Users can delete debt_payments for their company" ON debt_payments;

-- 3. DROP broken policies for debt_payoff_plans
DROP POLICY IF EXISTS "Users can view debt_payoff_plans from their company" ON debt_payoff_plans;
DROP POLICY IF EXISTS "Users can insert debt_payoff_plans for their company" ON debt_payoff_plans;
DROP POLICY IF EXISTS "Users can update debt_payoff_plans for their company" ON debt_payoff_plans;
DROP POLICY IF EXISTS "Users can delete debt_payoff_plans for their company" ON debt_payoff_plans;

-- ═══════════════════════════════════════════════════════════════════════════════
-- RECREATE with proper ownership verification via user_belongs_to_company()
-- ═══════════════════════════════════════════════════════════════════════════════

-- debts
CREATE POLICY "debts_select_own_company" ON debts
  FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debts_insert_own_company" ON debts
  FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debts_update_own_company" ON debts
  FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debts_delete_own_company" ON debts
  FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id));

-- debt_payments
CREATE POLICY "debt_payments_select_own_company" ON debt_payments
  FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debt_payments_insert_own_company" ON debt_payments
  FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debt_payments_update_own_company" ON debt_payments
  FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debt_payments_delete_own_company" ON debt_payments
  FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id));

-- debt_payoff_plans
CREATE POLICY "debt_payoff_plans_select_own_company" ON debt_payoff_plans
  FOR SELECT USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debt_payoff_plans_insert_own_company" ON debt_payoff_plans
  FOR INSERT WITH CHECK (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debt_payoff_plans_update_own_company" ON debt_payoff_plans
  FOR UPDATE USING (user_belongs_to_company(auth.uid(), company_id));

CREATE POLICY "debt_payoff_plans_delete_own_company" ON debt_payoff_plans
  FOR DELETE USING (user_belongs_to_company(auth.uid(), company_id));
