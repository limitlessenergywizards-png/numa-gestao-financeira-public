
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

async function scanCompanies() {
    console.log('Scanning all companies for Feb 2026 payables...');

    const startDate = '2026-02-01';
    const endDate = '2026-02-28';

    // Get all companies
    const { data: companies } = await supabase.from('companies').select('id, name');

    if (!companies) return;

    console.log(`Checking ${companies.length} companies...`);

    for (const c of companies) {
        const { data: payables, error } = await supabase
            .from('payables')
            .select('total_amount, paid_amount')
            .eq('company_id', c.id)
            .gte('due_date', startDate)
            .lte('due_date', endDate)
            .neq('status', 'cancelled');

        if (payables && payables.length > 0) {
            const total = payables.reduce((sum, p) => sum + p.total_amount, 0);
            const count = payables.length;

            if (total > 9000 && total < 10000) {
                console.log(`\nMATCH FOUND: Company ${c.name} (${c.id})`);
                console.log(` - Payables: ${count}`);
                console.log(` - Total: R$ ${total.toFixed(2)}`);

                // Check owner
                const { data: owner } = await supabase.from('profiles').select('email').eq('id', c.created_by || '').single();
                // Try to find owner email via auth if profile fail
                console.log(` - Owner ID: ${c.created_by}`);
            }
        }
    }
}

scanCompanies();
