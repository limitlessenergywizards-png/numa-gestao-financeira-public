// Re-export the singleton SSR browser client.
// This ensures ALL code uses the same Supabase instance with cookie-based auth.
import { createClient } from '@/lib/supabase/browser';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lazy proxy — defers createClient() until first property access.
// This prevents crashes during SSR prerender and in test environments
// where env vars may not be available at module load time.
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const client = createClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
