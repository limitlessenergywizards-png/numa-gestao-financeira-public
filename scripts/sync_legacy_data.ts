import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

try {
    const envFile = fs.readFileSync('.env', 'utf-8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length > 1) {
            const key = parts[0].trim();
            if (!process.env[key]) {
                process.env[key] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
            }
        }
    });
} catch (e: any) {
    console.log("No .env file found or error reading it:", e.message);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_SECRET;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_SECRET in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching existing records to resolve stragglers...");

    // Fetch all transactions, payables, receivables
    const { data: transactions } = await supabase.from('transactions').select('id, forecast_basis, is_deleted');
    const { data: payables } = await supabase.from('payables').select('*');
    const { data: receivables } = await supabase.from('receivables').select('*');

    // Fetch valid foreign keys so we don't violate constraints
    const { data: validChartAccounts } = await supabase.from('chart_of_accounts').select('id');
    const validChartIds = new Set(validChartAccounts?.map(c => c.id) || []);

    const { data: validBankAccounts } = await supabase.from('bank_accounts').select('id, company_id');
    const validBankIds = new Set(validBankAccounts?.map(b => b.id) || []);

    const getFallbackBankAccountId = (companyId: string) => {
        const acc = validBankAccounts?.find(b => b.company_id === companyId);
        return acc ? acc.id : null;
    };

    const existingLinkedPayables = new Set();
    const existingLinkedReceivables = new Set();
    transactions?.forEach(t => {
        if (!t.is_deleted && t.forecast_basis) {
            if (t.forecast_basis.startsWith('payable:')) existingLinkedPayables.add(t.forecast_basis.replace('payable:', ''));
            if (t.forecast_basis.startsWith('receivable:')) existingLinkedReceivables.add(t.forecast_basis.replace('receivable:', ''));
        }
    });

    // 1. Payables missing Transactions
    let payablesSyncedToTx = 0;
    for (const p of (payables || [])) {
        if (existingLinkedPayables.has(p.id) || p.is_deleted) continue;

        const isPago = p.status === 'pago';

        let safeChartId = p.chart_account_id;
        if (safeChartId && !validChartIds.has(safeChartId)) safeChartId = null;

        let safeBankId = p.bank_account_id;
        if (!safeBankId || !validBankIds.has(safeBankId)) {
            safeBankId = getFallbackBankAccountId(p.company_id);
        }

        if (!safeBankId) {
            console.error(`Skipping payable ${p.id} due to no fallback bank account for company ${p.company_id}`);
            continue;
        }

        const txData = {
            company_id: p.company_id,
            bank_account_id: safeBankId,
            chart_account_id: safeChartId,
            category_id: p.category_id,
            supplier_id: p.supplier_id,
            type: 'saida',
            amount: p.total_amount,
            description: p.description,
            transaction_date: p.due_date,
            document_number: p.document_number,
            notes: p.notes,
            nature: isPago ? 'realizado' : 'previsao',
            forecast_basis: `payable:${p.id}`,
            payment_method: p.payment_method || 'transferencia'
        };

        const { error } = await supabase.from('transactions').insert(txData);
        if (error) {
            console.error("Failed to backfill tx for payable:", p.id, error);
            continue;
        }
        payablesSyncedToTx++;
        console.log(`Synced Straggler Payable ${p.id} -> Transaction (new)`);
    }

    // 2. Receivables missing Transactions
    let receivablesSyncedToTx = 0;
    for (const r of (receivables || [])) {
        if (existingLinkedReceivables.has(r.id) || r.is_deleted) continue;

        const isRecebido = r.status === 'recebido' || r.status === 'pago';

        let safeChartId = r.chart_account_id;
        if (safeChartId && !validChartIds.has(safeChartId)) safeChartId = null;

        let safeBankId = r.bank_account_id;
        if (!safeBankId || !validBankIds.has(safeBankId)) {
            safeBankId = getFallbackBankAccountId(r.company_id);
        }

        if (!safeBankId) {
            console.error(`Skipping receivable ${r.id} due to no fallback bank account for company ${r.company_id}`);
            continue;
        }

        const txData = {
            company_id: r.company_id,
            bank_account_id: safeBankId,
            chart_account_id: safeChartId,
            category_id: r.category_id,
            customer_id: r.customer_id,
            type: 'entrada',
            amount: r.total_amount,
            description: r.description,
            transaction_date: r.due_date,
            document_number: r.document_number,
            notes: r.notes,
            nature: isRecebido ? 'realizado' : 'previsao',
            forecast_basis: `receivable:${r.id}`,
            payment_method: r.payment_method || 'transferencia'
        };

        const { error } = await supabase.from('transactions').insert(txData);
        if (error) {
            console.error("Failed to backfill tx for receivable:", r.id, error);
            continue;
        }
        receivablesSyncedToTx++;
        console.log(`Synced Straggler Receivable ${r.id} -> Transaction (new)`);
    }

    console.log(`\n--- Straggler Backfill Complete ---`);
    console.log(`Payables pushed to Transactions: ${payablesSyncedToTx}`);
    console.log(`Receivables pushed to Transactions: ${receivablesSyncedToTx}`);
}

run().catch(console.error);
