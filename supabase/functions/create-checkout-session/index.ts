import Stripe from "https://esm.sh/stripe@14.21.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("CREATE-CHECKOUT");

const PayloadSchema = z.object({
  priceId: z.string().min(1, "Price ID is required").startsWith("price_"),
  email: z.string().email("Invalid email format").optional(),
  planName: z.string().min(1).optional(),
}).strict(); // THE GAUNTLET: Reject any unmapped keys

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    log("Stripe key verified");

    // 1. The Payload Barrier (Schema Validation)
    let rawBody;
    try {
      rawBody = await req.json();
    } catch (e) {
      return errorResponse("Malformed JSON payload", 400, corsHeaders);
    }

    const validation = PayloadSchema.safeParse(rawBody);
    if (!validation.success) {
      log("Schema validation failed", validation.error.format());
      return errorResponse("Invalid payload parameters", 400, corsHeaders);
    }

    const { priceId, email: guestEmail, planName } = validation.data;
    log("Request body parsed and sanitized", { priceId, isGuestEmailProvided: !!guestEmail });

    // 2. Authentication & Origin Validation
    // SPECIAL CASE: Optional auth — supports guest checkout
    const authHeader = req.headers.get("Authorization");
    let userEmail: string;
    let userId: string | null = null;
    let isGuest = false;

    if (authHeader) {
      log("Authorization header found, checking user");
      const supabaseClient = createAuthClient(authHeader);
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

      if (userError || !userData?.user?.email) {
        // Token invalid or expired, treat as guest if email provided
        if (guestEmail) {
          userEmail = guestEmail;
          isGuest = true;
          log("Token invalid, using guest email");
        } else {
          log("Authentication failed and no guest email provided");
          return errorResponse("Unauthorized access", 401, corsHeaders);
        }
      } else {
        userEmail = userData.user.email;
        userId = userData.user.id;
        log("User authenticated securely");
      }
    } else {
      // Guest checkout
      if (!guestEmail) {
        return errorResponse("Email is required for guest checkout", 400, corsHeaders);
      }
      userEmail = guestEmail;
      isGuest = true;
      log("Guest checkout mode");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      log("Found existing Stripe customer");
    } else {
      log("No existing customer, will create during checkout");
    }

    const origin = req.headers.get("origin") || "https://numagestaofinanceira.com";

    // Different success URLs for guest vs authenticated
    const successUrl = isGuest
      ? `${origin}/ativar-conta?session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/inicio?subscription=success`;

    const cancelUrl = `${origin}/?canceled=true`;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId || "",
        is_guest: isGuest ? "true" : "false",
        plan_name: planName || "",
      },
      subscription_data: {
        metadata: {
          user_id: userId || "",
          is_guest: isGuest ? "true" : "false",
          plan_name: planName || "",
        },
      },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    log("Checkout session created securely", { sessionId: session.id, isGuest });

    return successResponse({ url: session.url }, corsHeaders);
  } catch (error) {
    // 4. Error Isolation (Information Leakage Prevention)
    // Never leak stack traces or internal Stripe errors to the client
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logId = crypto.randomUUID();
    log(`CRITICAL ERROR [${logId}]`, { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });

    return errorResponse("Internal Server Error", 500, corsHeaders);
  }
});
