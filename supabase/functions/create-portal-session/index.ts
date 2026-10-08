import Stripe from "https://esm.sh/stripe@14.21.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("CUSTOMER-PORTAL");

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    log("Stripe key verified");

    const authResult = requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const authHeader = authResult;
    log("Authorization header found");

    const supabaseClient = createAuthClient(authHeader);

    const userResult = await extractUser(authHeader, supabaseClient, corsHeaders);
    if (userResult instanceof Response) return userResult;

    const { userId, email } = userResult;
    if (!email) {
      return errorResponse("User not authenticated or email not available", 401, corsHeaders);
    }
    log("User authenticated", { userId, email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      throw new Error("No Stripe customer found for this user");
    }

    const customerId = customers.data[0].id;
    log("Found Stripe customer", { customerId });

    const origin = req.headers.get("origin") || "https://numagestaofinanceira.com";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/configuracoes?tab=planos`,
    });

    log("Portal session created", { sessionId: portalSession.id, url: portalSession.url });

    return successResponse({ url: portalSession.url }, corsHeaders);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("ERROR in create-portal-session", { message: errorMessage });
    return errorResponse(errorMessage, 500, corsHeaders);
  }
});
