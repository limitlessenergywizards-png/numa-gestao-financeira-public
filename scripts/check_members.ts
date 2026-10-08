
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

async function checkMembers() {
    const userId = '99cb3846-1ee2-4578-b657-a6b05f928159'; // thierresavio@gmail.com

    console.log(`Checking members table for user: ${userId}`);

    const { data: members, error } = await supabase
        .from('members')
        .select('company_id, role, companies(name)')
        .eq('user_id', userId);

    if (error) {
        console.log('Error or table members does not exist:', error.message);
        return;
    }

    if (members && members.length > 0) {
        console.log('Found member records:');
        console.log(JSON.stringify(members, null, 2));

        // If found, verify data for these companies
        for (const m of members) {
            if (m.company_id) {
                await verifyCompanyData({ id: m.company_id, name: m.companies?.name || 'Unknown' });
            }
        }
    } else {
        console.log('User is not in members table.');
    }

}

async function verifyCompanyData(company: { id: string, name: string }) {
    const startDate = '2026-02-01';
    const endDate = '2026-02-28';

    console.log(`\n---------------------------------------------------`);
    console.log(`Verifying Company: ${company.name} (${company.id})`);

    // PAYABLES
    const { data: payables } = await supabase
        .from('payables')
        .select('total_amount')
        .eq('company_id', company.id)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .neq('status', 'cancelled');

    const projPayables = payables?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
    console.log(`PAYABLES Proj: R$ ${projPayables.toFixed(2)} (Count: ${payables?.length})`);
}

checkMembers();
