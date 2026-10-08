
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

async function globalSearch() {
    console.log('Searching globally for payables near 9556 or 1945...');

    // Search for payables with value ~9556 or ~1945
    // We can't do approximate match easily, so let's list latest payables

    const { data: payables, error } = await supabase
        .from('payables')
        .select('id, description, total_amount, paid_amount, company_id, due_date')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) { console.error(error); return; }

    console.log(`Found ${payables.length} recent payables.`);

    // Filter locally
    const targets = payables.filter(p =>
        (p.total_amount > 9000 && p.total_amount < 10000) ||
        (p.paid_amount > 1900 && p.paid_amount < 2000) ||
        (p.total_amount > 1900 && p.total_amount < 2000)
    );

    if (targets.length > 0) {
        console.log('Potential matches:');
        targets.forEach(t => console.log(JSON.stringify(t, null, 2)));

        // If we find a match, check its company
        const companyId = targets[0].company_id;
        const { data: c } = await supabase.from('companies').select('name, created_by').eq('id', companyId).single();
        console.log(`Belongs to company: ${c?.name} (created_by: ${c?.created_by})`);
    } else {
        console.log('No recent payables match the values.');
    }

}

globalSearch();
