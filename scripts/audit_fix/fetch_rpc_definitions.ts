
import pg from 'pg';
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

const { Pool } = pg;
const pool = new Pool({
    connectionString: env.DATABASE_URL,
});

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT 
        p.proname as name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      ORDER BY p.proname;
    `);

        let output = `Found ${res.rowCount} functions in public schema.\n`;
        res.rows.forEach(row => {
            output += `\n--- FUNCTION: ${row.name} ---\n`;
            output += row.definition + '\n';
            output += '--------------------------------\n';
        });

        fs.writeFileSync('rpc_dump.txt', output);
        console.log(`Dumped ${res.rowCount} functions to rpc_dump.txt`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
