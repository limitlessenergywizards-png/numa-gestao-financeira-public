/**
 * Server-side prefetch helpers.
 *
 * Extracts the auth + company resolution logic shared by all
 * server-prefetched pages so each page.tsx stays clean.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

interface PrefetchContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  companyId: string;
}

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

/**
 * Resolve the authenticated user and their default company server-side.
 * Returns null if static export, no session, or no company — callers
 * should fall back to client-only rendering.
 */
export async function getServerPrefetchContext(): Promise<PrefetchContext | null> {
  if (isStaticExport) return null;

  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: ctx } = await supabase.rpc('get_user_context', {
      p_user_id: user.id,
    });

    const companyId = (ctx as Record<string, unknown> | null)?.default_company_id as string | null;
    if (!companyId) return null;

    return { supabase, userId: user.id, companyId };
  } catch {
    return null;
  }
}
