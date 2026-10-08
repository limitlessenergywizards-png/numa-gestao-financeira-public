
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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_SECRET, {
    auth: { persistSession: false }
});

async function inspectSchema() {
    console.log('Inspecting companies table (first row)...');
    const { data: companies, error: cError } = await supabase.from('companies').select('*').limit(1);
    if (cError) console.error(cError); else console.log('Companies columns:', companies && companies.length > 0 ? Object.keys(companies[0]) : 'Empty table');

    console.log('\nInspecting profiles table (first row)...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*').limit(1);
    if (pError) console.error(pError); else console.log('Profiles columns:', profiles && profiles.length > 0 ? Object.keys(profiles[0]) : 'Empty table');

    console.log('\nChecking for company_users table...');
    const { data: cu, error: cuError } = await supabase.from('company_users').select('*').limit(1);
    if (cuError) {
        console.log('company_users table error (likely does not exist):', cuError.message);
    } else {
        console.log('company_users exists. Columns:', cu && cu.length > 0 ? Object.keys(cu[0]) : 'Empty table');
    }

    // Specific user check
    const userId = '99cb3846-1ee2-4578-b657-a6b05f928159';
    console.log(`\nLooking for user ${userId} in potential join tables...`);

    if (!cuError) {
        const { data: links } = await supabase.from('company_users').select('*').eq('user_id', userId);
        console.log('company_users records for user:', links);
    }
}

inspectSchema();
