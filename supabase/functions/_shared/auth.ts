import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "./responses.ts";

/**
 * Extracts and validates the Authorization header from a request.
 * Returns the header string on success, or a 401 Response on failure.
 */
export function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>
): string | Response {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Unauthorized", 401, corsHeaders);
  }
  return authHeader;
}

/**
 * Validates the JWT and extracts the user ID from claims.
 * Returns `{ userId, email }` on success, or a 401 Response on failure.
 */
export async function extractUser(
  authHeader: string,
  supabaseClient: SupabaseClient,
  corsHeaders: Record<string, string>
): Promise<{ userId: string; email: string } | Response> {
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return errorResponse("Invalid or expired token", 401, corsHeaders);
  }

  return { userId: user.id, email: user.email || "" };
}
