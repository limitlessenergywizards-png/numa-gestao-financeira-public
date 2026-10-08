import Stripe from "https://esm.sh/stripe@14.21.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createAuthClient, createAdminClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { errorResponse, successResponse } from "../_shared/responses.ts";
import { createLogger } from "../_shared/logging.ts";

const log = createLogger("CHECK-SUBSCRIPTION");

// Price ID to plan name mapping - Todos os períodos
const priceToPlan: Record<string, string> = {
  // Iniciante (apenas mensal)
  "price_1SunF5JmzYB7IIyoSxzDn6bA": "basico",

  // Estrategista (todos os períodos)
  "price_1SunF7JmzYB7IIyo2YhUB8pQ": "profissional",      // mensal
  "price_1SunJaJmzYB7IIyoYkWRo500": "profissional",      // trimestral
  "price_1SunJbJmzYB7IIyoKPSMszCQ": "profissional",      // semestral
  "price_1SunJcJmzYB7IIyo7QWZf7Ut": "profissional",      // anual

  // Mestre (todos os períodos)
  "price_1SxArAJmzYB7IIyodzTRDiU6": "empresarial",       // mensal
  "price_1SxArBJmzYB7IIyoZBYoowd1": "empresarial",       // trimestral
  "price_1SxArCJmzYB7IIyoHmnaW8AW": "empresarial",       // semestral
  "price_1SxArDJmzYB7IIyoOX13puCC": "empresarial",       // anual
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    log("Stripe key verified");

    const authHeader = requireAuth(req, corsHeaders);
    if (authHeader instanceof Response) return authHeader;
    log("Authorization header found");

    const supabaseClient = createAuthClient(authHeader);
    const userResult = await extractUser(authHeader, supabaseClient, corsHeaders);
    if (userResult instanceof Response) return userResult;

    const { userId, email: userEmail } = userResult;
    log("User authenticated", { userId, email: userEmail });

    const supabaseAdmin = createAdminClient();

    // FIRST: Check if user has a manual subscription (active but no stripe_subscription_id)
    const { data: currentSubscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (
      currentSubscription &&
      currentSubscription.status === "active" &&
      !currentSubscription.stripe_subscription_id
    ) {
      log("Found manual/legacy subscription, skipping Stripe sync", {
        plan: currentSubscription.plan_name,
      });

      return successResponse(
        {
          subscribed: true,
          plan_name: currentSubscription.plan_name,
          status: "active",
          current_period_end: currentSubscription.current_period_end,
          cancel_at_period_end: false,
        },
        corsHeaders
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find customer
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      log("No Stripe customer found");
      return successResponse(
        { subscribed: false, plan_name: "free", status: "inactive" },
        corsHeaders
      );
    }

    const customerId = customers.data[0].id;
    log("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      log("No active subscription found");

      await supabaseAdmin
        .from("subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            status: "inactive",
            plan_name: "free",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      return successResponse(
        { subscribed: false, plan_name: "free", status: "inactive" },
        corsHeaders
      );
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const planName = priceToPlan[priceId] || "unknown";

    log("Active subscription found", {
      subscriptionId: subscription.id,
      priceId,
      planName,
      status: subscription.status,
    });

    // Update subscription in database
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          plan_name: planName,
          status: subscription.status,
          current_period_start: new Date(
            subscription.current_period_start * 1000
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    log("Subscription synced to database");

    return successResponse(
      {
        subscribed: true,
        plan_name: planName,
        status: subscription.status,
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      corsHeaders
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("ERROR in check-subscription", { message: errorMessage });

    // Handle JWT expiration errors with 401 to trigger client token refresh
    const isAuthError =
      errorMessage.toLowerCase().includes("jwt") ||
      errorMessage.toLowerCase().includes("token") ||
      errorMessage.toLowerCase().includes("expired") ||
      errorMessage.toLowerCase().includes("invalid");

    if (isAuthError) {
      return errorResponse("Token expired or invalid", 401, corsHeaders);
    }

    return errorResponse(errorMessage, 500, corsHeaders);
  }
});
