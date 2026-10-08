
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

async function checkUserCompanies() {
    const userId = '99cb3846-1ee2-4578-b657-a6b05f928159'; // thierresavio@gmail.com
    console.log(`Checking user_companies for user: ${userId}`);

    // 1. Try RPC
    console.log('\n--- RPC: get_user_context ---');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_context', {
        p_user_id: userId,
    });

    if (rpcError) {
        console.log('RPC Error:', rpcError.message);
    } else {
        console.log('RPC Data:', JSON.stringify(rpcData, null, 2));
        // If RPC data has companies, use them
        if (rpcData.companies && rpcData.companies.length > 0) {
            console.log(`Found ${rpcData.companies.length} companies via RPC.`);
            for (const c of rpcData.companies) {
                await verifyCompanyData(c.company_id, c.company?.name || 'Unknown');
            }
            return;
        }
    }

    // 2. Try Table Query
    console.log('\n--- Table: user_companies ---');
    const { data: ucData, error: ucError } = await supabase
        .from('user_companies')
        .select('company_id, company:companies(name, id)')
        .eq('user_id', userId);

    if (ucError) {
        console.log('Table Query Error (user_companies):', ucError.message);
    } else {
        if (ucData && ucData.length > 0) {
            console.log(`Found ${ucData.length} companies via table query.`);
            for (const uc of ucData) {
                const compName = uc.company?.name || 'Unknown';
                // @ts-ignore
                const compId = uc.company?.id || uc.company_id;
                await verifyCompanyData(compId, compName);
            }
        } else {
            console.log('No companies found in user_companies table.');
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

checkUserCompanies();
