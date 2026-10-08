import Stripe from "https://esm.sh/stripe@14.21.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { successResponse, errorResponse, jsonResponse } from "../_shared/responses.ts";

const log = createLogger("STRIPE-WEBHOOK");

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    log("Secrets verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }
    log("Signature found");

    // Get raw body for signature verification
    const body = await req.text();

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      log("Signature verification failed", { error: message });
      return errorResponse(`Webhook signature verification failed: ${message}`, 400, corsHeaders);
    }

    log("Event verified", { type: event.type, id: event.id });

    // Initialize Supabase client with service role for database updates
    const supabaseAdmin = createAdminClient();

    // Handle the event
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        log("Processing subscription update", {
          subscriptionId: subscription.id,
          status: subscription.status,
          customerId: stripeCustomerId
        });

        // First, try to find user via existing subscription record (most efficient)
        let userId: string | null = null;

        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .maybeSingle();

        if (existingSub?.user_id) {
          userId = existingSub.user_id;
          log("Found user via subscription table", { userId });
        } else {
          // Fallback: Get customer email from Stripe and find user
          const customer = await stripe.customers.retrieve(stripeCustomerId);
          if (customer.deleted) {
            log("Customer deleted, skipping");
            break;
          }

          const email = customer.email;
          if (!email) {
            log("No customer email found, skipping");
            break;
          }

          log("Customer found", { email });

          // Find user by email via profiles table (indexed, more efficient than listUsers)
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('user_id')
            .eq('user_id', (
              await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })
            ).data?.users?.find(u => u.email === email)?.id || '')
            .maybeSingle();

          if (!profile) {
            // Last resort: search all users (expensive)
            const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
            if (userError) {
              log("Error listing users", { error: userError.message });
              break;
            }

            const user = users.users.find(u => u.email === email);
            if (!user) {
              log("No user found for email", { email });
              break;
            }
            userId = user.id;
          } else {
            userId = profile.user_id;
          }
        }

        if (!userId) {
          log("Could not find user ID");
          break;
        }

        log("User found", { userId });

        // Get plan name from price metadata or product
        const priceId = subscription.items.data[0]?.price?.id;
        let planName = "Premium";

        // Map price IDs to plan names (synced with useSubscription.ts STRIPE_PLANS)
        if (priceId) {
          const priceToplan: Record<string, string> = {
            // Iniciante (mensal)
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
          planName = priceToplan[priceId] || "Premium";
        }

        // Upsert subscription record
        const subscriptionData = {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId || null,
          plan_name: planName,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabaseAdmin
          .from("subscriptions")
          .upsert(subscriptionData, {
            onConflict: "user_id",
            ignoreDuplicates: false
          });

        if (upsertError) {
          log("Error upserting subscription", { error: upsertError.message });
        } else {
          log("Subscription upserted successfully", { userId, status: subscription.status });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        log("Processing subscription deletion", { subscriptionId: subscription.id });

        // Try to find user via existing subscription record (most efficient)
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .maybeSingle();

        if (existingSub?.user_id) {
          // Update subscription status to canceled
          const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString()
            })
            .eq("user_id", existingSub.user_id);

          if (updateError) {
            log("Error updating subscription to canceled", { error: updateError.message });
          } else {
            log("Subscription marked as canceled", { userId: existingSub.user_id });
          }
        } else {
          log("No subscription record found for customer", { customerId: stripeCustomerId });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        log("Payment succeeded", {
          invoiceId: invoice.id,
          amount: invoice.amount_paid,
          customerId: invoice.customer
        });
        // Subscription updates are handled by customer.subscription.updated
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        log("Payment failed", {
          invoiceId: invoice.id,
          customerId: stripeCustomerId
        });

        // Try to find user via existing subscription record (most efficient)
        const { data: existingSub } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', stripeCustomerId)
          .maybeSingle();

        if (existingSub?.user_id) {
          // Update subscription status to past_due
          const { error: updateError } = await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString()
            })
            .eq("user_id", existingSub.user_id);

          if (updateError) {
            log("Error updating subscription to past_due", { error: updateError.message });
          } else {
            log("Subscription marked as past_due", { userId: existingSub.user_id });
          }
        } else {
          log("No subscription record found for customer", { customerId: stripeCustomerId });
        }
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }

    return successResponse({ received: true }, corsHeaders);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logId = crypto.randomUUID();
    log(`CRITICAL ERROR [${logId}]`, { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return jsonResponse({ error: "Internal Server Error", reference: logId }, 500, corsHeaders);
  }
});
