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

const ADMIN_EMAIL = 'admin@floreselopes.com';
const ADMIN_PASSWORD = '12345678';
const ADMIN_FULL_NAME = 'Super Admin';

async function createSuperAdmin() {
    console.log(`Creating superadmin user: ${ADMIN_EMAIL}`);

    try {
        // 1. Check if user already exists
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error('Error listing users:', listError.message);
            process.exit(1);
        }

        let userId: string;
        const existingUser = users.find(u => u.email === ADMIN_EMAIL);

        if (existingUser) {
            console.log(`User already exists with ID: ${existingUser.id}. Updating password...`);
            userId = existingUser.id;

            // Update password
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
                password: ADMIN_PASSWORD,
                email_confirm: true,
            });
            if (updateError) {
                console.error('Error updating user:', updateError.message);
                process.exit(1);
            }
            console.log('Password updated successfully.');
        } else {
            // 2. Create user via admin API
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                email_confirm: true,
                user_metadata: {
                    full_name: ADMIN_FULL_NAME,
                },
            });

            if (createError) {
                console.error('Error creating user:', createError.message);
                process.exit(1);
            }

            userId = newUser.user.id;
            console.log(`User created with ID: ${userId}`);
        }

        // 3. Ensure profile exists
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                user_id: userId,
                full_name: ADMIN_FULL_NAME,
            }, { onConflict: 'user_id' });

        if (profileError) {
            console.error('Error creating profile:', profileError.message);
        } else {
            console.log('Profile created/updated.');
        }

        // 4. Grant admin role (check first, then insert)
        const { data: existingRole } = await supabase
            .from('user_roles')
            .select('id')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

        if (existingRole) {
            console.log('Admin role already exists.');
        } else {
            const { error: roleError } = await supabase
                .from('user_roles')
                .insert({
                    user_id: userId,
                    role: 'admin',
                });

            if (roleError) {
                console.error('Error granting admin role:', roleError.message);
            } else {
                console.log('Admin role granted.');
            }
        }

        // 5. Grant empresarial plan
        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setFullYear(periodEnd.getFullYear() + 10); // 10 years

        const { error: subError } = await supabase
            .from('subscriptions')
            .upsert({
                user_id: userId,
                plan_name: 'empresarial',
                status: 'active',
                current_period_start: now.toISOString(),
                current_period_end: periodEnd.toISOString(),
                cancel_at_period_end: false,
                updated_at: now.toISOString(),
                stripe_subscription_id: null,
                stripe_price_id: null,
            }, { onConflict: 'user_id' });

        if (subError) {
            console.error('Error granting subscription:', subError.message);
        } else {
            console.log(`Empresarial plan granted until ${periodEnd.toISOString()}.`);
        }

        console.log(`\n✅ Superadmin setup complete!`);
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`   Role: admin`);
        console.log(`   Plan: empresarial (10 years)`);

    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

createSuperAdmin();
