
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');
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
        console.log('Updating RPC get_financial_totals Projection Logic...');

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
        AND nature = 'realizado'
    ),
    -- 2. Receivables Pending (Provisioned but not Paid)
    rec_pending AS (
        SELECT
            COALESCE(SUM(total_amount - paid_amount), 0) as pending
        FROM receivables
        WHERE company_id = p_company_id
        AND due_date BETWEEN p_start_date AND p_end_date
        AND status != 'cancelado'
    ),
    -- 3. Payables Pending (Provisioned but not Paid)
    pay_pending AS (
        SELECT
            COALESCE(SUM(total_amount - paid_amount), 0) as pending
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
        -- Projection = Realized + Pending
        (t.receitas + r.pending) as receivables_total,
        t.receitas as receivables_received, 
        
        -- Projection = Realized + Pending
        (t.despesas + p.pending) as payables_total,
        t.despesas as payables_paid,
        
        b.total_balance
    FROM tx_totals t, rec_pending r, pay_pending p, bal_totals b;
END;
$function$;
    `);
        console.log('Updated get_financial_totals with correct projection logic.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
