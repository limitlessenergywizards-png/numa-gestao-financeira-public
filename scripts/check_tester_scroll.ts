
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

async function checkTesterScroll() {
    const userId = 'fd726016-063a-45c6-a1c3-1bf000311a66'; // Tester Scroll
    console.log(`Checking data for 'Tester Scroll' (${userId})`);

    // 1. Get Companies
    const { data: rpcData } = await supabase.rpc('get_user_context', {
        p_user_id: userId,
    });

    if (rpcData && rpcData.companies) {
        console.log(`Found ${rpcData.companies.length} companies for Tester Scroll.`);
        for (const c of rpcData.companies) {
            await verifyCompanyData(c.company_id, c.company?.name || 'Unknown');
        }
    } else {
        console.log('No companies found via RPC for Tester Scroll.');
        // fallback to user_companies
        const { data: uc } = await supabase.from('user_companies').select('company_id').eq('user_id', userId);
        if (uc) {
            console.log(`Found ${uc.length} companies via table.`);
            for (const u of uc) await verifyCompanyData(u.company_id, 'Unknown');
        }
    }
}

async function verifyCompanyData(companyId: string, companyName: string) {
    const startDate = '2026-02-01';
    const endDate = '2026-02-28';

    console.log(`\n---------------------------------------------------`);
    console.log(`Verifying Company: ${companyName} (${companyId})`);

    // PAYABLES
    const { data: payables } = await supabase
        .from('payables')
        .select('id, description, total_amount, paid_amount, status, due_date')
        .eq('company_id', companyId)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .neq('status', 'cancelled');

    const projPayables = payables?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
    console.log(`PAYABLES Proj: R$ ${projPayables.toFixed(2)} (Count: ${payables?.length})`);

    if (payables && payables.length > 0) {
        payables.forEach(p => console.log(` - ${p.description}: R$ ${p.total_amount} (Due: ${p.due_date})`));
    }
}

checkTesterScroll();
