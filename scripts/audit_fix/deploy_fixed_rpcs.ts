
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { Pool } = pg;
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Deploying fixed RPCs and Triggers...');

    // 1. Fix get_financial_totals (Added nature='realizado' filter)
    await client.query(`
CREATE OR REPLACE FUNCTION public.get_financial_totals(p_company_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(receitas numeric, despesas numeric, receivables_total numeric, receivables_received numeric, payables_total numeric, payables_paid numeric, current_balance numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH 
    -- 1. Transactions Totals (REALIZED ONLY)
    tx_totals AS (
        SELECT
            COALESCE(SUM(CASE WHEN type = 'entrada' THEN amount ELSE 0 END), 0) as receitas,
            COALESCE(SUM(CASE WHEN type = 'saida' THEN amount ELSE 0 END), 0) as despesas
        FROM transactions
        WHERE company_id = p_company_id
        AND transaction_date BETWEEN p_start_date AND p_end_date
        AND is_deleted = false
        AND nature = 'realizado' -- FIX: Exclude forecasts
    ),
    -- 2. Receivables Totals
    rec_totals AS (
        SELECT
            COALESCE(SUM(total_amount), 0) as receivables_total,
            COALESCE(SUM(paid_amount), 0) as receivables_received
        FROM receivables
        WHERE company_id = p_company_id
        AND due_date BETWEEN p_start_date AND p_end_date
        AND status != 'cancelado'
    ),
    -- 3. Payables Totals
    pay_totals AS (
        SELECT
            COALESCE(SUM(total_amount), 0) as payables_total,
            COALESCE(SUM(paid_amount), 0) as payables_paid
        FROM payables
        WHERE company_id = p_company_id
        AND due_date BETWEEN p_start_date AND p_end_date
        AND status != 'cancelado'
    ),
    -- 4. Current Balance
    bal_totals AS (
        SELECT
            COALESCE(SUM(bank_accounts.current_balance), 0) as total_balance
        FROM bank_accounts
        WHERE company_id = p_company_id
        AND is_active = true
    )
    SELECT
        t.receitas,
        t.despesas,
        r.receivables_total,
        r.receivables_received,
        p.payables_total,
        p.payables_paid,
        b.total_balance
    FROM tx_totals t, rec_totals r, pay_totals p, bal_totals b;
END;
$function$;
    `);
    console.log('Fixed get_financial_totals');

    // 2. Fix update_bank_balance_on_transaction (Limit to realized)
    await client.query(`
CREATE OR REPLACE FUNCTION public.update_bank_balance_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Skip soft-deleted transactions (transition to deleted)
  IF TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false THEN
     -- Only reverse if it WAS affecting balance (realizado)
     IF OLD.nature = 'realizado' THEN
        IF OLD.type = 'entrada' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
        ELSIF OLD.type = 'saida' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
        END IF;
     END IF;
     RETURN NEW;
  END IF;
  
  -- Skip if already deleted (Insert/Update on deleted record)
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.is_deleted = true THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Only apply if realized
    IF NEW.nature = 'realizado' THEN
        IF NEW.type = 'entrada' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
        ELSIF NEW.type = 'saida' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
        END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Reverse OLD effect if it was realized
    IF OLD.nature = 'realizado' AND OLD.is_deleted = false THEN
        IF OLD.type = 'entrada' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
        ELSIF OLD.type = 'saida' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
        END IF;
    END IF;
    -- Apply NEW effect if realized
    IF NEW.nature = 'realizado' AND NEW.is_deleted = false THEN
        IF NEW.type = 'entrada' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance + NEW.amount WHERE id = NEW.bank_account_id;
        ELSIF NEW.type = 'saida' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance - NEW.amount WHERE id = NEW.bank_account_id;
        END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse OLD effect if realized
    IF OLD.nature = 'realizado' AND OLD.is_deleted = false THEN
        IF OLD.type = 'entrada' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance - OLD.amount WHERE id = OLD.bank_account_id;
        ELSIF OLD.type = 'saida' THEN
          UPDATE public.bank_accounts SET current_balance = current_balance + OLD.amount WHERE id = OLD.bank_account_id;
        END IF;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
    `);
    console.log('Fixed update_bank_balance_on_transaction');

    // 3. Recalculate Bank Balances to fix corrupt data
    console.log('Recalculating bank balances...');

    // Set user context
    await client.query("SET request.jwt.claim.sub = '99cb3846-1ee2-4578-b657-a6b05f928159';");

    // We update all bank accounts to be sum of their realized transactions
    // Initial balance is typically 0 or imported. Assuming 0 start + transactions.
    await client.query(`
      WITH calculated_balances AS (
        SELECT 
          bank_account_id,
          SUM(
            CASE 
              WHEN type = 'entrada' THEN amount 
              WHEN type = 'saida' THEN -amount 
              ELSE 0 
            END
          ) as new_balance
        FROM transactions
        WHERE is_deleted = false
          AND nature = 'realizado'
        GROUP BY bank_account_id
      )
      UPDATE bank_accounts b
      SET current_balance = COALESCE(cb.new_balance, 0)
      FROM calculated_balances cb
      WHERE b.id = cb.bank_account_id;
    `);
    console.log('Bank balances recalculated.');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
