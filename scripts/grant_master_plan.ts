
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envConfig: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        envConfig[key] = value;
    }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_SECRET;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_SECRET environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const args = process.argv.slice(2);
const TARGET_EMAILS = args.length > 0 ? args : [
    'thiago@floreselopes.com',
    'thierresavio@gmail.com'
];

const PLAN_NAME = 'empresarial'; // Internal key matching frontend planDisplayNames/planLimits
const DURATION_YEARS = 1;

async function grantMasterPlan() {
    console.log(`Starting process to grant '${PLAN_NAME}' plan to users...`);

    for (const email of TARGET_EMAILS) {
        try {
            console.log(`Processing user: ${email}`);

            // 1. Get user by email
            const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

            if (userError) {
                console.error(`Error listing users: ${userError.message}`);
                continue;
            }

            const user = users.find(u => u.email === email);

            if (!user) {
                console.error(`User not found: ${email}`);
                continue;
            }

            console.log(`Found user ${email} with ID: ${user.id}`);

            // 2. Check existing subscription
            const { data: existingSubscription, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (subError && subError.code !== 'PGRST116') { // PGRST116 is 'Row not found'
                console.error(`Error checking subscription for ${email}: ${subError.message}`);
                continue;
            }

            // 3. Prepare subscription data
            const now = new Date();
            const currentPeriodEnd = new Date(now);
            currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + DURATION_YEARS);

            const subscriptionData = {
                user_id: user.id,
                plan_name: PLAN_NAME,
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: currentPeriodEnd.toISOString(),
                cancel_at_period_end: false,
                updated_at: now.toISOString(),
                stripe_subscription_id: null,
                stripe_price_id: null
            };

            // 4. Upsert subscription
            const { error: upsertError } = await supabase
                .from('subscriptions')
                .upsert(subscriptionData, { onConflict: 'user_id' });

            if (upsertError) {
                console.error(`Error granting plan to ${email}: ${upsertError.message}`);
            } else {
                console.log(`Successfully granted '${PLAN_NAME}' plan to ${email} until ${currentPeriodEnd.toISOString()}`);
            }

        } catch (err) {
            console.error(`Unexpected error processing ${email}:`, err);
        }
    }
}

grantMasterPlan();
