import { Resend } from "https://esm.sh/resend@2.0.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient, createAdminClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("SEND-DRE-REPORT");

interface DREReportSchedule {
  id: string;
  company_id: string;
  recipient_emails: string[];
  include_pdf: boolean;
  include_excel: boolean;
  report_period: string;
  day_of_month: number;
}

interface Company {
  id: string;
  name: string;
  document: string | null;
  currency_symbol: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  log("Function started");

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY_EXPORT_DRE") || Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      log("Email API keys (RESEND_API_KEY_EXPORT_DRE or RESEND_API_KEY) not configured");
      return errorResponse("Email service not configured", 500, corsHeaders);
    }

    // Check if this is a manual trigger or scheduled
    const { scheduleId, manual } = await req.json().catch(() => ({}));

    // For manual triggers, require authentication
    if (scheduleId || manual) {
      const authResult = requireAuth(req, corsHeaders);
      if (authResult instanceof Response) {
        log("Manual trigger without auth");
        return authResult;
      }

      // Validate JWT and check user permissions
      const userClient = createAuthClient(authResult);
      const userResult = await extractUser(authResult, userClient, corsHeaders);

      if (userResult instanceof Response) {
        log("Invalid JWT");
        return userResult;
      }

      const userId = userResult.userId;
      log("Authenticated user", { userId });

      // If a specific schedule is requested, verify user belongs to that company
      if (scheduleId) {
        const adminClient = createAdminClient();
        const { data: schedule, error: scheduleError } = await adminClient
          .from("dre_report_schedules")
          .select("company_id")
          .eq("id", scheduleId)
          .single();

        if (scheduleError || !schedule) {
          return errorResponse("Schedule not found", 404, corsHeaders);
        }

        // Check if user belongs to this company
        const { data: membership, error: membershipError } = await adminClient
          .from("user_companies")
          .select("id")
          .eq("user_id", userId)
          .eq("company_id", schedule.company_id)
          .single();

        if (membershipError || !membership) {
          log("User not authorized for company", { companyId: schedule.company_id });
          return errorResponse("Not authorized for this company", 403, corsHeaders);
        }

        log("User authorized for company", { companyId: schedule.company_id });
      }
    }

    // Create service client for database operations
    const supabase = createAdminClient();
    const resend = new Resend(resendApiKey);

    let schedulesToProcess: DREReportSchedule[] = [];

    if (scheduleId) {
      // Manual trigger for specific schedule (auth already validated above)
      log(`Manual trigger for schedule: ${scheduleId}`);
      const { data, error } = await supabase
        .from("dre_report_schedules")
        .select("*")
        .eq("id", scheduleId)
        .single();

      if (error || !data) {
        log("Schedule not found", { error });
        return errorResponse("Schedule not found", 404, corsHeaders);
      }
      schedulesToProcess = [data];
    } else {
      // Scheduled run - find all schedules due today
      const today = new Date();
      const dayOfMonth = today.getDate();

      log(`Checking schedules for day ${dayOfMonth}`);

      const { data, error } = await supabase
        .from("dre_report_schedules")
        .select("*")
        .eq("is_active", true)
        .eq("day_of_month", dayOfMonth);

      if (error) {
        log("Error fetching schedules", { error });
        throw error;
      }

      schedulesToProcess = data || [];
    }

    log(`Processing ${schedulesToProcess.length} schedules`);

    const results = [];

    for (const schedule of schedulesToProcess) {
      let emailLogId: string | null = null;

      try {
        log(`Processing schedule ${schedule.id} for company ${schedule.company_id}`);

        // Fetch company data
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id, name, document, currency_symbol")
          .eq("id", schedule.company_id)
          .single();

        if (companyError || !company) {
          log(`Company not found for schedule ${schedule.id}`);
          continue;
        }

        // Calculate period dates based on report_period
        const now = new Date();
        let periodStart: Date;
        let periodEnd: Date;
        let periodLabel: string;

        switch (schedule.report_period) {
          case "current_month":
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            periodLabel = `${now.toLocaleString("pt-BR", { month: "long" })} ${now.getFullYear()}`;
            break;
          case "quarter":
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            periodStart = new Date(now.getFullYear(), quarterStart, 1);
            periodEnd = new Date(now.getFullYear(), quarterStart + 3, 0);
            periodLabel = `${quarterStart / 3 + 1}º Trimestre ${now.getFullYear()}`;
            break;
          default: // previous_month
            periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            periodLabel = `${prevMonth.toLocaleString("pt-BR", { month: "long" })} ${prevMonth.getFullYear()}`;
        }

        // Fetch DRE data - now including transactions for complete data
        const { data: receivables } = await supabase
          .from("receivables")
          .select("total_amount, chart_of_accounts(name, type)")
          .eq("company_id", schedule.company_id)
          .eq("status", "pago")
          .gte("due_date", periodStart.toISOString().split("T")[0])
          .lte("due_date", periodEnd.toISOString().split("T")[0]);

        const { data: payables } = await supabase
          .from("payables")
          .select("total_amount, chart_of_accounts(name, type)")
          .eq("company_id", schedule.company_id)
          .eq("status", "pago")
          .gte("due_date", periodStart.toISOString().split("T")[0])
          .lte("due_date", periodEnd.toISOString().split("T")[0]);

        // ALSO fetch transactions for more complete data
        const { data: transactions } = await supabase
          .from("transactions")
          .select("amount, type, chart_of_accounts(name, type)")
          .eq("company_id", schedule.company_id)
          .gte("transaction_date", periodStart.toISOString().split("T")[0])
          .lte("transaction_date", periodEnd.toISOString().split("T")[0]);

        // Calculate totals from receivables + transaction revenues
        const receivableRevenue = (receivables || []).reduce((acc, r) => acc + (r.total_amount || 0), 0);
        const transactionRevenue = (transactions || [])
          .filter((t: any) => t.type === "entrada")
          .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
        const totalRevenue = receivableRevenue + transactionRevenue;

        // Calculate costs from payables + transactions
        const payableCosts = (payables || []).filter((p: any) => p.chart_of_accounts?.type === "custo");
        const transactionCosts = (transactions || []).filter((t: any) => t.type === "saida" && t.chart_of_accounts?.type === "custo");
        const totalCosts = payableCosts.reduce((acc: number, p: any) => acc + (p.total_amount || 0), 0) +
          transactionCosts.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

        // Calculate expenses from payables + transactions
        const payableExpenses = (payables || []).filter((p: any) => p.chart_of_accounts?.type === "despesa");
        const transactionExpenses = (transactions || []).filter((t: any) => t.type === "saida" && t.chart_of_accounts?.type === "despesa");
        const totalExpenses = payableExpenses.reduce((acc: number, p: any) => acc + (p.total_amount || 0), 0) +
          transactionExpenses.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

        const grossProfit = totalRevenue - totalCosts;
        const netResult = grossProfit - totalExpenses;
        const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0";
        const netMargin = totalRevenue > 0 ? ((netResult / totalRevenue) * 100).toFixed(1) : "0";

        // Format currency
        const formatCurrency = (value: number) =>
          `${company.currency_symbol} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

        // Build email HTML
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DRE - ${company.name}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; }
              .header p { margin: 10px 0 0; opacity: 0.9; }
              .content { padding: 30px; }
              .metric { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #eee; }
              .metric:last-child { border-bottom: none; }
              .metric-label { color: #666; font-size: 14px; }
              .metric-value { font-weight: 600; font-size: 16px; }
              .metric-value.positive { color: #22c55e; }
              .metric-value.negative { color: #ef4444; }
              .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
              .summary h3 { margin: 0 0 15px; font-size: 16px; color: #333; }
              .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
              .test-badge { background: #fbbf24; color: #000; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin-left: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Demonstrativo de Resultado${manual ? '<span class="test-badge">TESTE</span>' : ''}</h1>
                <p>${company.name} - ${periodLabel}</p>
              </div>
              <div class="content">
                <div class="metric">
                  <span class="metric-label">(+) Receita Bruta</span>
                  <span class="metric-value positive">${formatCurrency(totalRevenue)}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">(-) Custos</span>
                  <span class="metric-value negative">${formatCurrency(totalCosts)}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">(=) Lucro Bruto</span>
                  <span class="metric-value ${grossProfit >= 0 ? 'positive' : 'negative'}">${formatCurrency(grossProfit)}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">(-) Despesas Operacionais</span>
                  <span class="metric-value negative">${formatCurrency(totalExpenses)}</span>
                </div>

                <div class="summary">
                  <h3>Resultado Líquido</h3>
                  <div class="metric" style="border: none; padding-bottom: 0;">
                    <span class="metric-label" style="font-size: 16px;">Total</span>
                    <span class="metric-value ${netResult >= 0 ? 'positive' : 'negative'}" style="font-size: 24px;">${formatCurrency(netResult)}</span>
                  </div>
                </div>

                <p style="margin-top: 25px; color: #666; font-size: 14px; text-align: center;">
                  Margem Bruta: <strong>${grossMargin}%</strong> |
                  Margem Líquida: <strong>${netMargin}%</strong>
                </p>
              </div>
              <div class="footer">
                <p>Este relatório foi gerado automaticamente${manual ? ' (email de teste)' : ''}.</p>
                <p>Para ver o relatório completo, acesse o sistema.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email
        const emailResult = await resend.emails.send({
          from: "Numa Finance <relatorios@numagestaofinanceira.com>",
          to: schedule.recipient_emails,
          subject: `${manual ? '[TESTE] ' : ''}DRE ${company.name} - ${periodLabel}`,
          html: emailHtml,
        });

        log(`Email sent for schedule ${schedule.id}`, { result: emailResult });

        // Log the email send to dre_email_logs
        const { data: logData, error: logError } = await supabase
          .from("dre_email_logs")
          .insert({
            schedule_id: schedule.id,
            company_id: schedule.company_id,
            recipient_emails: schedule.recipient_emails,
            status: "sent",
            resend_id: emailResult.data?.id || null,
            report_period: periodLabel,
          })
          .select("id")
          .single();

        if (logError) {
          log("Error logging email", { error: logError });
        } else {
          emailLogId = logData?.id;
          log(`Email logged with id: ${emailLogId}`);
        }

        // Update schedule with last_sent_at and next_send_at (only for non-manual sends)
        if (!manual) {
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, schedule.day_of_month);
          await supabase
            .from("dre_report_schedules")
            .update({
              last_sent_at: new Date().toISOString(),
              next_send_at: nextMonth.toISOString(),
            })
            .eq("id", schedule.id);
        }

        results.push({
          scheduleId: schedule.id,
          companyName: company.name,
          recipients: schedule.recipient_emails.length,
          status: "sent",
          emailLogId,
          resendId: emailResult.data?.id,
        });
      } catch (scheduleError) {
        log(`Error processing schedule ${schedule.id}`, { error: String(scheduleError) });

        // Log failed email attempt
        await supabase
          .from("dre_email_logs")
          .insert({
            schedule_id: schedule.id,
            company_id: schedule.company_id,
            recipient_emails: schedule.recipient_emails,
            status: "failed",
            error_message: String(scheduleError),
            report_period: null,
          });

        results.push({
          scheduleId: schedule.id,
          status: "error",
          error: String(scheduleError),
        });
      }
    }

    const duration = Date.now() - startTime;
    log(`Completed in ${duration}ms. Processed ${results.length} schedules.`);

    return successResponse({
      success: true,
      processed: results.length,
      results,
      duration: `${duration}ms`,
    }, corsHeaders);
  } catch (error) {
    log("Fatal error", { error: String(error) });
    return errorResponse(String(error), 500, corsHeaders);
  }
});
