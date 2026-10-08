import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Read .env file
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
    process.exit(1);
}

// Read migration SQL
const migrationPath = resolve(__dirname, '..', 'supabase', 'migrations', '20260216_fix_payment_triggers.sql');
const sql = readFileSync(migrationPath, 'utf-8');

console.log('📄 Migration file loaded:', migrationPath);
console.log('🔗 Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('\n🚀 Executing migration...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // If exec_sql doesn't exist, try via REST API
        console.log('⚠️  exec_sql RPC not available. Attempting via pgSQL...');

        // Split statements and run individually 
        const statements = sql
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
            console.log(`  [${i + 1}/${statements.length}] ${preview}...`);

            const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
            if (stmtError) {
                console.error(`  ❌ Error on statement ${i + 1}:`, stmtError.message);
            } else {
                console.log(`  ✅ OK`);
            }
        }
    } else {
        console.log('✅ Migration executed successfully!');
    }
}

runMigration().catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
