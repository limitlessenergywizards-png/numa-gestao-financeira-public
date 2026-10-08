import { getCorsHeaders } from "../_shared/cors.ts";
import { createAuthClient, createAdminClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { errorResponse, successResponse } from "../_shared/responses.ts";
import { createLogger } from "../_shared/logging.ts";

const log = createLogger("ADMIN-IMPERSONATE");

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = requireAuth(req, corsHeaders);
    if (authHeader instanceof Response) return authHeader;

    const supabaseAuth = createAuthClient(authHeader);
    const userResult = await extractUser(authHeader, supabaseAuth, corsHeaders);
    if (userResult instanceof Response) return userResult;

    const adminUserId = userResult.userId;
    log("Admin authenticated", { adminUserId });

    const supabaseAdmin = createAdminClient();

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      log("User is not admin", { error: roleError?.message });
      return errorResponse("Forbidden - Admin access required", 403, corsHeaders);
    }

    // Parse request body
    const body = await req.json();
    const { targetUserId, reason } = body;

    if (!targetUserId) {
      return errorResponse("Target user ID is required", 400, corsHeaders);
    }

    if (!reason || reason.trim().length < 10) {
      return errorResponse("A valid reason is required (min 10 characters)", 400, corsHeaders);
    }

    log("Impersonate request", {
      admin: adminUserId,
      target: targetUserId,
      reason: reason.substring(0, 50) + "...",
    });

    // Verify target user exists
    const { data: targetUser, error: targetError } =
      await supabaseAdmin.auth.admin.getUserById(targetUserId);

    if (targetError || !targetUser) {
      log("Target user not found", { error: targetError?.message });
      return errorResponse("Target user not found", 404, corsHeaders);
    }

    // Get target user's company for logging
    const { data: targetCompanies } = await supabaseAdmin
      .from("user_companies")
      .select("company_id")
      .eq("user_id", targetUserId)
      .limit(1);

    const targetCompanyId = targetCompanies?.[0]?.company_id || null;

    // Log the impersonation attempt
    const { error: logError } = await supabaseAdmin
      .from("impersonate_logs")
      .insert({
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        target_company_id: targetCompanyId,
        reason: reason.trim(),
        ip_address:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("cf-connecting-ip"),
        user_agent: req.headers.get("user-agent"),
      });

    if (logError) {
      console.error("[ADMIN-IMPERSONATE] Error logging impersonation:", logError);
    }

    log("Impersonation logged successfully");

    return successResponse(
      {
        success: true,
        message: "Impersonation logged. Feature in development.",
      },
      corsHeaders
    );
  } catch (error) {
    console.error("[ADMIN-IMPERSONATE] Unexpected error:", error);
    return errorResponse("Internal server error", 500, corsHeaders);
  }
});
