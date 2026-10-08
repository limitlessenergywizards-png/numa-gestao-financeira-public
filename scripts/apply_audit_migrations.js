
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.join(projectRoot, '.env');
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const env = {};
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                env[match[1].trim()] = value;
            }
        });
        return env;
    } catch (err) {
        console.error('Error loading .env:', err);
        return {};
    }
}

const env = loadEnv();
const connectionString = env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
}

const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const migrations = [
            'supabase/migrations/20260216_audit_soft_delete.sql',
            'supabase/migrations/20260216_audit_acid_procedures.sql'
        ];

        for (const migrationFile of migrations) {
            const filePath = path.join(projectRoot, migrationFile);
            console.log(`Reading migration: ${migrationFile}`);
            const sql = fs.readFileSync(filePath, 'utf-8');

            console.log(`Executing ${migrationFile}...`);
            await client.query(sql);
            console.log(`✅ Successfully applied ${migrationFile}`);
        }

        console.log('🎉 All migrations applied successfully!');
    } catch (err) {
        console.error('❌ Error executing migrations:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
