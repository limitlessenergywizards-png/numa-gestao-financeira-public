import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("HOTMART-WEBHOOK");

// deno-lint-ignore no-explicit-any
type SupabaseAdminClient = SupabaseClient<any>;

// 1. Zod Schema for strict payload validation
const HotmartPayloadSchema = z.object({
  event: z.string().min(1),
  data: z.object({
    buyer: z.object({
      email: z.string().email(),
      name: z.string().min(1),
      phone: z.string().optional(),
      document: z.string().optional(),
    }),
    purchase: z.object({
      transaction: z.string().min(1),
      status: z.string().min(1),
      approved_date: z.number().optional(),
    }),
    subscription: z.object({
      subscriber_code: z.string(),
      status: z.string(),
      plan: z.object({
        name: z.string(),
      }),
    }).optional(),
    product: z.object({
      id: z.number(),
      name: z.string(),
    }),
  }),
}).strict(); // THE GAUNTLET: Reject any unmapped keys

// Types extracted directly from Zod
type HotmartWebhookPayload = z.infer<typeof HotmartPayloadSchema>;
type HotmartBuyer = HotmartWebhookPayload["data"]["buyer"];
type HotmartPurchase = HotmartWebhookPayload["data"]["purchase"];
type HotmartSubscription = HotmartWebhookPayload["data"]["subscription"];
type HotmartProduct = HotmartWebhookPayload["data"]["product"];

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, corsHeaders);
  }

  try {
    // 2. The Payload Barrier (Schema Validation)
    let rawBody;
    try {
      rawBody = await req.json();
    } catch (e) {
      return errorResponse("Malformed JSON payload", 400, corsHeaders);
    }

    const validation = HotmartPayloadSchema.safeParse(rawBody);
    if (!validation.success) {
      log("Schema validation failed", validation.error.format());
      return errorResponse("Invalid payload parameters", 400, corsHeaders);
    }

    const payload = validation.data;

    log("Webhook Hotmart recebido", payload.event);

    // Auth Validation (Anti-Spoofing): Verify Hotmart Token secretly
    const hottok = req.headers.get("x-hotmart-hottok");
    const expectedHottok = Deno.env.get("HOTMART_HOTTOK");
    if (!hottok || hottok !== expectedHottok) {
      log("Invalid Hotmart Token", hottok);
      return errorResponse("Unauthorized payload signature", 401, corsHeaders);
    }

    const supabase = createAdminClient();

    const { buyer, purchase, subscription, product } = payload.data;

    switch (payload.event) {
      case "PURCHASE_APPROVED":
        await handlePurchaseApproved(supabase, buyer, purchase, subscription, product);
        break;

      case "PURCHASE_CANCELED":
      case "PURCHASE_REFUNDED":
      case "SUBSCRIPTION_CANCELLATION":
        await handleSubscriptionCanceled(supabase, buyer);
        break;

      case "PURCHASE_DELAYED":
        await handlePurchaseDelayed(supabase, buyer);
        break;

      case "PLAN_CHANGE":
        await handlePlanChange(supabase, buyer, subscription);
        break;

      default:
        log("Evento não tratado", payload.event);
    }

    // Log do webhook para auditoria
    await supabase.from("hotmart_webhook_logs").insert({
      event: payload.event,
      payload: payload.data,
      buyer_email: buyer.email,
      status: "processed",
    });

    return successResponse({ success: true, event: payload.event }, corsHeaders);

  } catch (error: unknown) {
    // 3. Error Isolation (Information Leakage Prevention)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logId = crypto.randomUUID();
    log(`CRITICAL ERROR [${logId}]`, errorMessage);

    return errorResponse("Internal Server Error", 500, corsHeaders);
  }
});

// ============================================
// HANDLERS PARA CADA EVENTO
// ============================================

async function handlePurchaseApproved(
  supabase: SupabaseAdminClient,
  buyer: HotmartBuyer,
  purchase: HotmartPurchase,
  subscription: HotmartSubscription | undefined,
  product: HotmartProduct
) {
  log("Processando compra aprovada para", buyer.email);

  // 1. Verificar se usuário já existe
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, user_id")
    .ilike("full_name", `%${buyer.email}%`)
    .maybeSingle();

  // Verificar por auth.users
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  // deno-lint-ignore no-explicit-any
  const existingAuthUser = existingUsers?.users?.find((u: any) => u.email === buyer.email);

  if (existingAuthUser) {
    // Usuário existe - apenas reativar subscription
    log("Usuário já existe, reativando", buyer.email);

    await supabase
      .from("subscriptions")
      .upsert({
        user_id: existingAuthUser.id,
        plan_name: mapHotmartPlanToInternal(subscription?.plan?.name),
        status: "active",
        stripe_customer_id: null, // Hotmart não usa Stripe
        stripe_subscription_id: subscription?.subscriber_code || purchase.transaction,
        current_period_start: new Date().toISOString(),
        current_period_end: calculatePeriodEnd(subscription?.plan?.name),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    // Atualizar profile com dados Hotmart
    await supabase
      .from("profiles")
      .update({
        hotmart_transaction: purchase.transaction,
        hotmart_subscriber_code: subscription?.subscriber_code,
        hotmart_status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", existingAuthUser.id);

    log("Usuário reativado", buyer.email);
    return;
  }

  // 2. Criar novo usuário no Auth
  const tempPassword = generateTempPassword();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: buyer.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: buyer.name,
      phone: buyer.phone,
      source: "hotmart",
    },
  });

  if (authError) {
    log("Erro ao criar usuário", authError);
    throw authError;
  }

  const userId = authData.user.id;
  log("Usuário criado no Auth", userId);

  // 3. O trigger handle_new_user já cria o profile e user_roles
  // Mas vamos atualizar com dados do Hotmart
  await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar trigger

  await supabase
    .from("profiles")
    .update({
      full_name: buyer.name,
      phone: buyer.phone,
      hotmart_transaction: purchase.transaction,
      hotmart_subscriber_code: subscription?.subscriber_code,
      hotmart_status: "active",
    })
    .eq("user_id", userId);

  // 4. Criar subscription
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    plan_name: mapHotmartPlanToInternal(subscription?.plan?.name),
    status: "active",
    stripe_subscription_id: subscription?.subscriber_code || purchase.transaction,
    current_period_start: new Date().toISOString(),
    current_period_end: calculatePeriodEnd(subscription?.plan?.name),
  }, {
    onConflict: "user_id",
  });

  // 5. Criar empresa padrão para o usuário
  const { data: empresa, error: empresaError } = await supabase
    .from("companies")
    .insert({
      name: `Empresa de ${buyer.name}`,
      created_by: userId,
      currency: "BRL",
      currency_symbol: "R$",
    })
    .select()
    .single();

  if (empresaError) {
    log("Erro ao criar empresa", empresaError);
  } else {
    // Associar usuário à empresa
    await supabase.from("user_companies").insert({
      user_id: userId,
      company_id: empresa.id,
      role: "admin",
      is_default: true,
    });

    // Criar plano de contas padrão
    await createDefaultChartOfAccounts(supabase, empresa.id);

    // Criar conta bancária padrão
    await supabase.from("bank_accounts").insert({
      company_id: empresa.id,
      name: "Conta Principal",
      account_type: "corrente",
      initial_balance: 0,
      current_balance: 0,
      is_active: true,
    });
  }

  // 6. Enviar email de boas-vindas
  await sendWelcomeEmail(buyer.email, buyer.name, tempPassword);

  log("Onboarding completo para", buyer.email);
}

async function handleSubscriptionCanceled(
  supabase: SupabaseAdminClient,
  buyer: HotmartBuyer
) {
  log("Cancelando assinatura para", buyer.email);

  const { data: users } = await supabase.auth.admin.listUsers();
  // deno-lint-ignore no-explicit-any
  const user = users?.users?.find((u: any) => u.email === buyer.email);

  if (user) {
    await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    await supabase
      .from("profiles")
      .update({
        hotmart_status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  log("Assinatura cancelada para", buyer.email);
}

async function handlePurchaseDelayed(
  supabase: SupabaseAdminClient,
  buyer: HotmartBuyer
) {
  log("Pagamento atrasado para", buyer.email);

  const { data: users } = await supabase.auth.admin.listUsers();
  // deno-lint-ignore no-explicit-any
  const user = users?.users?.find((u: any) => u.email === buyer.email);

  if (user) {
    await supabase
      .from("subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    await supabase
      .from("profiles")
      .update({
        hotmart_status: "overdue",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  log("Status atualizado para overdue", buyer.email);
}

async function handlePlanChange(
  supabase: SupabaseAdminClient,
  buyer: HotmartBuyer,
  subscription: HotmartSubscription | undefined
) {
  log("Mudança de plano para", buyer.email);

  const { data: users } = await supabase.auth.admin.listUsers();
  // deno-lint-ignore no-explicit-any
  const user = users?.users?.find((u: any) => u.email === buyer.email);

  if (user && subscription) {
    await supabase
      .from("subscriptions")
      .update({
        plan_name: mapHotmartPlanToInternal(subscription.plan.name),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  log("Plano atualizado para", subscription?.plan?.name);
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join("");
}

function mapHotmartPlanToInternal(hotmartPlan: string | undefined): string {
  if (!hotmartPlan) return "Iniciante";

  const planMap: Record<string, string> = {
    "plano essencial": "Iniciante",
    "plano profissional": "Estrategista",
    "plano empresarial": "Mestre",
    "plano anual": "Estrategista",
    "essencial": "Iniciante",
    "profissional": "Estrategista",
    "empresarial": "Mestre",
  };

  return planMap[hotmartPlan.toLowerCase()] || "Iniciante";
}

function calculatePeriodEnd(planName: string | undefined): string {
  const now = new Date();

  if (planName?.toLowerCase().includes("anual")) {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }

  return now.toISOString();
}

async function createDefaultChartOfAccounts(
  supabase: SupabaseAdminClient,
  companyId: string
) {
  const defaultAccounts = [
    { code: "1", name: "RECEITAS", type: "receita" as const },
    { code: "1.1", name: "Receita de Vendas", type: "receita" as const },
    { code: "1.2", name: "Receita de Serviços", type: "receita" as const },
    { code: "1.3", name: "Outras Receitas", type: "receita" as const },
    { code: "2", name: "CUSTOS", type: "custo" as const },
    { code: "2.1", name: "Custo de Mercadorias Vendidas", type: "custo" as const },
    { code: "2.2", name: "Custo de Serviços Prestados", type: "custo" as const },
    { code: "3", name: "DESPESAS OPERACIONAIS", type: "despesa" as const },
    { code: "3.1", name: "Despesas com Pessoal", type: "despesa" as const },
    { code: "3.2", name: "Despesas Administrativas", type: "despesa" as const },
    { code: "3.3", name: "Despesas Comerciais", type: "despesa" as const },
    { code: "3.4", name: "Despesas Financeiras", type: "despesa" as const },
    { code: "3.5", name: "Impostos e Taxas", type: "despesa" as const },
  ];

  for (const account of defaultAccounts) {
    await supabase.from("chart_of_accounts").insert({
      company_id: companyId,
      code: account.code,
      name: account.name,
      type: account.type,
      is_active: true,
    });
  }
}

async function sendWelcomeEmail(email: string, name: string, password: string) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  if (!RESEND_API_KEY) {
    log("RESEND_API_KEY não configurada, email não enviado");
    return;
  }

  const firstName = name.split(" ")[0];
  const loginUrl = `https://numagestaofinanceira.com/ativar-conta?email=${encodeURIComponent(email)}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Numa Gestão Financeira <ativarconta@numagestaofinanceira.com>",
        to: email,
        subject: `Bem-vindo ao Numa, ${firstName}! Aqui estão suas credenciais`,
        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Bem-vindo ao Numa</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; background-color: #0A1612; color: #E5E7EB; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0A1612;">
    <tr>
      <td align="center" style="padding: 0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

          <!-- Top Gold Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #0A1612, #C5A059 20%, #E8D5A3 50%, #C5A059 80%, #0A1612); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <tr><td style="height: 48px; background-color: #0A1612;"></td></tr>

          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 0 32px; background-color: #0A1612;">
              <img src="https://numagestaofinanceira.com/numa-logo.png" alt="Numa Gestão Financeira" width="200" style="display: block; margin: 0 auto; max-width: 200px; height: auto;" />
            </td>
          </tr>

          <tr><td style="height: 40px; background-color: #0A1612;"></td></tr>

          <!-- Hero Card -->
          <tr>
            <td style="padding: 0 24px; background-color: #0A1612;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(160deg, #1B3B34 0%, #17322C 40%, #142B26 100%); border-radius: 20px; overflow: hidden; border: 1px solid rgba(197, 160, 89, 0.15);">

                <!-- Gold shimmer -->
                <tr>
                  <td style="height: 1px; background: linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.4), transparent); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>

                <!-- Success Badge -->
                <tr>
                  <td align="center" style="padding: 40px 32px 0 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%); border-radius: 50px; padding: 10px 24px; border: 1px solid rgba(16, 185, 129, 0.2);">
                          <span style="color: #34D399; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">COMPRA CONFIRMADA</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td align="center" style="padding: 28px 32px 0 32px;">
                    <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #F9FAFB; line-height: 1.3;">
                      Olá, ${firstName}!
                    </h2>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 12px 40px 0 40px;">
                    <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #9CA3AF;">
                      Sua jornada rumo ao <span style="color: #D4B96A; font-weight: 600;">controle financeiro total</span> começa agora. Sua conta está pronta — siga os passos abaixo para começar.
                    </p>
                  </td>
                </tr>

                <tr><td style="height: 32px;"></td></tr>

                <!-- Credentials Card -->
                <tr>
                  <td style="padding: 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(10, 22, 18, 0.7); border-radius: 14px; border: 1px solid rgba(197, 160, 89, 0.12);">
                      <tr>
                        <td style="padding: 20px 24px 14px 24px; border-bottom: 1px solid rgba(197, 160, 89, 0.08);">
                          <span style="font-size: 13px; font-weight: 700; color: #C5A059; text-transform: uppercase; letter-spacing: 1.5px;">Suas Credenciais</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 18px 24px 0 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="70" style="vertical-align: top; padding-top: 2px;">
                                <span style="color: #6B7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Email</span>
                              </td>
                              <td style="vertical-align: top;">
                                <span style="color: #F3F4F6; font-size: 15px; font-weight: 500; word-break: break-all;">${email}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 24px 20px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="70" style="vertical-align: middle;">
                                <span style="color: #6B7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Senha</span>
                              </td>
                              <td style="vertical-align: middle;">
                                <span style="display: inline-block; background: linear-gradient(135deg, #0F1F1C, #142B26); color: #E8D5A3; padding: 8px 16px; border-radius: 8px; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; font-size: 16px; font-weight: 600; letter-spacing: 1.5px; border: 1px solid rgba(197, 160, 89, 0.25);">${password}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Warning -->
                <tr>
                  <td style="padding: 14px 24px 0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(251, 191, 36, 0.06); border-radius: 10px; border-left: 3px solid #F59E0B;">
                      <tr>
                        <td style="padding: 12px 16px;">
                          <span style="color: #FBBF24; font-size: 12px; font-weight: 500;">Por segurança, altere sua senha no primeiro acesso</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height: 32px;"></td></tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 0 24px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #C5A059 0%, #D4B96A 40%, #E8D5A3 60%, #D4B96A 80%, #C5A059 100%);">
                          <a href="${loginUrl}" target="_blank" style="display: block; padding: 18px 32px; font-size: 17px; font-weight: 700; color: #0F1F1C; text-decoration: none; text-align: center; letter-spacing: 0.3px;">
                            Ativar minha conta
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Fallback link -->
                <tr>
                  <td align="center" style="padding: 14px 24px 0 24px;">
                    <span style="color: #6B7280; font-size: 12px;">
                      Ou acesse: <a href="https://numagestaofinanceira.com/ativar-conta" style="color: #C5A059; text-decoration: underline;">numagestaofinanceira.com/ativar-conta</a>
                    </span>
                  </td>
                </tr>

                <tr><td style="height: 36px;"></td></tr>

                <!-- Bottom shimmer -->
                <tr>
                  <td style="height: 1px; background: linear-gradient(90deg, transparent, rgba(197, 160, 89, 0.2), transparent); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height: 28px; background-color: #0A1612;"></td></tr>

          <!-- Onboarding Steps -->
          <tr>
            <td style="padding: 0 24px; background-color: #0A1612;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(23, 50, 44, 0.4); border-radius: 16px; border: 1px solid rgba(107, 166, 115, 0.08);">
                <tr>
                  <td style="padding: 24px 28px 6px 28px;">
                    <span style="font-size: 14px; font-weight: 700; color: #D1D5DB; letter-spacing: -0.2px;">Seu onboarding em 3 passos</span>
                  </td>
                </tr>
                <!-- Step 1 -->
                <tr>
                  <td style="padding: 14px 28px 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, rgba(197, 160, 89, 0.2), rgba(197, 160, 89, 0.05)); border: 1px solid rgba(197, 160, 89, 0.3); text-align: center; line-height: 32px; font-size: 13px; font-weight: 700; color: #C5A059;">1</div>
                        </td>
                        <td style="vertical-align: top; padding-top: 2px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #E5E7EB;">Faça login com suas credenciais</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280; line-height: 1.5;">Use o email e senha acima para acessar</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="padding: 0 28px 0 44px;"><div style="width: 1px; height: 16px; background: rgba(197, 160, 89, 0.15);"></div></td></tr>
                <!-- Step 2 -->
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, rgba(197, 160, 89, 0.2), rgba(197, 160, 89, 0.05)); border: 1px solid rgba(197, 160, 89, 0.3); text-align: center; line-height: 32px; font-size: 13px; font-weight: 700; color: #C5A059;">2</div>
                        </td>
                        <td style="vertical-align: top; padding-top: 2px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #E5E7EB;">Configure sua empresa</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280; line-height: 1.5;">Preencha os dados da sua empresa e contas bancárias</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="padding: 0 28px 0 44px;"><div style="width: 1px; height: 16px; background: rgba(197, 160, 89, 0.15);"></div></td></tr>
                <!-- Step 3 -->
                <tr>
                  <td style="padding: 0 28px 24px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="40" style="vertical-align: top;">
                          <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05)); border: 1px solid rgba(16, 185, 129, 0.3); text-align: center; line-height: 32px; font-size: 13px; font-weight: 700; color: #34D399;">3</div>
                        </td>
                        <td style="vertical-align: top; padding-top: 2px;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #E5E7EB;">Comece a controlar!</p>
                          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280; line-height: 1.5;">Registre receitas, despesas e acompanhe tudo em tempo real</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height: 28px; background-color: #0A1612;"></td></tr>

          <!-- Feature Icons -->
          <tr>
            <td style="padding: 0 24px; background-color: #0A1612;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33%" style="padding: 0 4px 0 0; vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(23, 50, 44, 0.3); border-radius: 12px; border: 1px solid rgba(107, 166, 115, 0.06);">
                      <tr><td align="center" style="padding: 20px 12px;">
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #D1D5DB; line-height: 1.4;">Dashboard<br>Inteligente</p>
                      </td></tr>
                    </table>
                  </td>
                  <td width="33%" style="padding: 0 2px; vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(23, 50, 44, 0.3); border-radius: 12px; border: 1px solid rgba(107, 166, 115, 0.06);">
                      <tr><td align="center" style="padding: 20px 12px;">
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #D1D5DB; line-height: 1.4;">IA<br>Financeira</p>
                      </td></tr>
                    </table>
                  </td>
                  <td width="33%" style="padding: 0 0 0 4px; vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(23, 50, 44, 0.3); border-radius: 12px; border: 1px solid rgba(107, 166, 115, 0.06);">
                      <tr><td align="center" style="padding: 20px 12px;">
                        <p style="margin: 0; font-size: 12px; font-weight: 600; color: #D1D5DB; line-height: 1.4;">Alertas<br>Automáticos</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height: 36px; background-color: #0A1612;"></td></tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 48px; background-color: #0A1612;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(107, 166, 115, 0.15), transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 32px; background-color: #0A1612;">
              <p style="margin: 0 0 6px 0; color: #6B7280; font-size: 12px; line-height: 1.6;">
                Precisa de ajuda? Responda este email ou acesse nosso
                <a href="https://numagestaofinanceira.com/manual" style="color: #C5A059; text-decoration: none; font-weight: 500;">manual de ajuda</a>
              </p>
              <p style="margin: 16px 0 0 0; color: #374151; font-size: 11px;">
                2026 Numa Gestão Financeira - Todos os direitos reservados
              </p>
              <p style="margin: 8px 0 0 0; color: #374151; font-size: 10px;">
                Você recebeu este email porque realizou uma compra no Numa.
              </p>
            </td>
          </tr>

          <!-- Bottom Gold Line -->
          <tr>
            <td style="height: 3px; background: linear-gradient(90deg, #0A1612, #C5A059 30%, #E8D5A3 50%, #C5A059 70%, #0A1612); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      }),
    });

    if (!response.ok) {
      log("Erro ao enviar email", await response.text());
    } else {
      log("Email de boas-vindas enviado para", email);
    }
  } catch (error) {
    log("Erro ao enviar email", error);
  }
}
