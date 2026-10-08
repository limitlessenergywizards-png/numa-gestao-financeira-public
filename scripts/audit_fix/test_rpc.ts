
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_SECRET);

async function testRpc() {
    const companyId = 'c4e27efd-e6b8-4244-98da-fc046bb29374';
    const startDate = '2026-02-01';
    const endDate = '2026-02-28';

    console.log(`Testing RPC get_financial_totals for company ${companyId}...`);

    const { data, error } = await supabase.rpc('get_financial_totals', {
        p_company_id: companyId,
        p_start_date: startDate,
        p_end_date: endDate
    });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('RPC Result:', data);
}

testRpc();
