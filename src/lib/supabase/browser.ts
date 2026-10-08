import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/integrations/supabase/types';

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Browser Supabase client (singleton).
 * Uses cookies for session management via @supabase/ssr.
 * Safe to call in 'use client' components.
 */
export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return client;
}
