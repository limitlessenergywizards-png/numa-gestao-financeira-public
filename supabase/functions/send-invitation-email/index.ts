// Edge function to send invitation emails via Resend API
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";

const log = createLogger("SEND-INVITATION-EMAIL");

interface InvitationEmailRequest {
  email: string;
  inviterName: string;
  companyName: string;
  role: string;
  token: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  editor: "Gerente",
  viewer: "Visualizador",
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: Verify JWT ──
    const authResult = requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const authHeader = authResult;

    const supabaseAuth = createAuthClient(authHeader);

    const userResult = await extractUser(authHeader, supabaseAuth, corsHeaders);
    if (userResult instanceof Response) return userResult;
    log("Authenticated user", { userId: userResult.userId });

    // ── Parse & validate request ──
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      log("RESEND_API_KEY not configured");
      return errorResponse("Email service not configured", 500, corsHeaders);
    }

    const { email, inviterName, companyName, role, token }: InvitationEmailRequest = await req.json();

    if (!email || !inviterName || !companyName || !role || !token) {
      return errorResponse("Missing required fields", 400, corsHeaders);
    }

    log("Sending invitation", { email, companyName });

    // Get site URL from environment or use default
    const siteUrl = Deno.env.get("SITE_URL") || "https://numagestaofinanceira.com";
    const inviteUrl = `${siteUrl}/aceitar-convite?token=${encodeURIComponent(token)}`;

    const roleLabel = roleLabels[role] || role;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para Numa Gestão Financeira</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #18181b;">
                Você foi convidado!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                Olá!
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #3f3f46;">
                <strong>${inviterName}</strong> convidou você para acessar a empresa <strong>${companyName}</strong> na Numa Gestão Financeira como <strong>${roleLabel}</strong>.
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; font-size: 14px; color: #71717a;">
                      <strong>Empresa:</strong> ${companyName}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #71717a;">
                      <strong>Cargo:</strong> ${roleLabel}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.6; color: #71717a;">
                Se o botão não funcionar, copie e cole este link no seu navegador:
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; word-break: break-all; color: #a1a1aa;">
                ${inviteUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email.
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
                © ${new Date().getFullYear()} Numa Gestão Financeira. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email via Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Numa Gestão Financeira <noreply@resend.dev>",
        to: [email],
        subject: `${inviterName} convidou você para ${companyName} na Numa`,
        html: htmlContent,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      log("Resend API error", result);
      return errorResponse("Failed to send email", 500, corsHeaders);
    }

    log("Email sent successfully", { id: result.id });

    return successResponse({ success: true, id: result.id }, corsHeaders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    log("Error", { error: errorMessage });
    return errorResponse("Internal server error", 500, corsHeaders);
  }
});
