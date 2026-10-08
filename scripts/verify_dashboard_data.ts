
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_SECRET);

async function verifyData() {
    const email = 'thierresavio@gmail.com';
    console.log(`\nSearching for user: ${email}`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find((u) => u.email === email);
    if (!user) { console.error('User not found.'); return; }
    const userId = user.id;
    console.log(`Found User ID: ${userId}`);

    // Find ALL Companies by created_by
    const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .eq('created_by', userId);

    if (!companies || companies.length === 0) {
        console.error('User has no companies.');
        return;
    }

    console.log(`Found ${companies.length} companies.`);

    for (const company of companies) {
        await verifyCompanyData(company);
    }
}

async function verifyCompanyData(company: { id: string, name: string }) {
    const startDate = '2026-02-01';
    const endDate = '2026-02-28';

    console.log(`\n---------------------------------------------------`);
    console.log(`Verifying Company: ${company.name} (${company.id})`);

    // --- 1. RECEIVABLES ---
    const { data: receivables } = await supabase
        .from('receivables')
        .select('total_amount, paid_amount, status')
        .eq('company_id', company.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .neq('status', 'cancelled');

    // Widget Logic:
    // Receivables Projection = sum of total_amount
    // Recebido = Transactions 'entrada' (usually) OR paid_amount logic.

    const projReceiv = receivables?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

    console.log(`[RECEIVABLES] Count: ${receivables?.length}, Proj: R$ ${projReceiv.toFixed(2)}`);

    // --- 2. PAYABLES ---
    const { data: payables } = await supabase
        .from('payables')
        .select('total_amount, paid_amount, status')
        .eq('company_id', company.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .neq('status', 'cancelled');

    const projPayables = payables?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;

    // Widget "Pago" usually comes from Transactions 'saida' OR paid_amount of payables.
    // But let's check payables paid_amount too.
    const paidPayablesWithPaidAmount = payables?.reduce((sum, p) => sum + (p.paid_amount || 0), 0) || 0;

    console.log(`[PAYABLES] Count: ${payables?.length}, Proj: R$ ${projPayables.toFixed(2)}`);
    console.log(`[PAYABLES] Paid Amount (from records): R$ ${paidPayablesWithPaidAmount.toFixed(2)}`);

    // --- 3. TRANSACTIONS ---
    const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('company_id', company.id)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

    const entrada = transactions
        ?.filter(t => t.type === 'entrada')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const saida = transactions
        ?.filter(t => t.type === 'saida')
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    console.log(`[TRANSACTIONS] Realizado (Entrada): R$ ${entrada.toFixed(2)}`);
    console.log(`[TRANSACTIONS] Realizado (Saída): R$ ${saida.toFixed(2)}`);

    // Totals for user matching
    console.log(`\nMATCH CHECK:`);
    console.log(`Validating against User Report:`);
    console.log(` - User sees Proj Pag: ~9.5k. We found: ${projPayables.toFixed(2)}`);
    console.log(` - User sees Paid: ~1.9k. We found (Trans): ${saida.toFixed(2)} OR (Payables): ${paidPayablesWithPaidAmount.toFixed(2)}`);
}

verifyData();
