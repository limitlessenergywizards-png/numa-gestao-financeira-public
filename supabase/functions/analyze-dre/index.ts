import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse, jsonResponse } from "../_shared/responses.ts";

const log = createLogger("ANALYZE-DRE");

// 1. Zod Schema for strict payload validation
const DreRequestSchema = z.object({
  companyContext: z.string().optional(),
  dreData: z.object({
    grossRevenue: z.number().default(0),
    costs: z.number().default(0),
    operationalExpenses: z.number().default(0),
    netResult: z.number().default(0),
    grossMargin: z.number().default(0),
    netMargin: z.number().default(0),
    ebitda: z.number().default(0),
    revenueVariation: z.number().default(0),
    resultVariation: z.number().default(0),
  })
}).strict(); // Reject unexpected payload fields

type DREData = z.infer<typeof DreRequestSchema>["dreData"];

interface AIAnalysis {
  insight: string;
  alerts: Array<{ type: "warning" | "danger"; message: string }>;
  recommendations: Array<{
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }>;
  healthScore: number;
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authResult = requireAuth(req, corsHeaders);
    if (authResult instanceof Response) return authResult;
    const authHeader = authResult;

    const supabase = createAuthClient(authHeader);

    const userResult = await extractUser(authHeader, supabase, corsHeaders);
    if (userResult instanceof Response) return userResult;
    const userId = userResult.userId;
    log("Authenticated user", { userId });

    // Rate limit: 10 requests per 15 minutes
    const rl = await checkRateLimit(userId, "analyze-dre", 10, 900);
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter!, corsHeaders);
    }

    // 2. Schema Validation
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Malformed JSON payload", 400, corsHeaders);
    }

    const payloadResult = DreRequestSchema.safeParse(rawBody);
    if (!payloadResult.success) {
      log("Schema error", payloadResult.error.format());
      return errorResponse("Invalid request payload format", 400, corsHeaders);
    }

    const { dreData, companyContext } = payloadResult.data;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("AI service configuration missing");
      return successResponse({ fallback: true }, corsHeaders);
    }

    const prompt = `Você é um consultor financeiro especializado em análise de DRE (Demonstração do Resultado do Exercício) para pequenas e médias empresas brasileiras.

Analise os dados fornecidos e gere uma análise estruturada.

DADOS DO DRE:
- Receita Bruta: R$ ${dreData.grossRevenue?.toLocaleString("pt-BR") || 0}
- Custos: R$ ${dreData.costs?.toLocaleString("pt-BR") || 0}
- Despesas Operacionais: R$ ${dreData.operationalExpenses?.toLocaleString("pt-BR") || 0}
- Resultado Líquido: R$ ${dreData.netResult?.toLocaleString("pt-BR") || 0}
- Margem Bruta: ${dreData.grossMargin?.toFixed(1) || 0}%
- Margem Líquida: ${dreData.netMargin?.toFixed(1) || 0}%
- EBITDA: R$ ${dreData.ebitda?.toLocaleString("pt-BR") || 0}
- Variação da Receita (vs. período anterior): ${dreData.revenueVariation?.toFixed(1) || 0}%
- Variação do Resultado (vs. período anterior): ${dreData.resultVariation?.toFixed(1) || 0}%

${companyContext ? `Contexto adicional: ${companyContext}` : ""}

Responda em JSON com a seguinte estrutura:
{
  "insight": "Um parágrafo (2-3 frases) com análise geral da saúde financeira, destacando pontos positivos e de atenção",
  "alerts": [
    {"type": "warning" ou "danger", "message": "Descrição do alerta"}
  ],
  "recommendations": [
    {"title": "Título curto", "description": "Descrição da recomendação", "priority": "high", "medium" ou "low"}
  ],
  "healthScore": número de 0 a 100
}

Regras:
- Seja direto e use linguagem acessível para donos de empresa
- Máximo de 3 alertas e 3 recomendações
- O healthScore deve refletir a situação geral: 80-100 excelente, 60-79 bom, 40-59 regular, 0-39 crítico
- Se não houver problemas significativos, retorne array vazio para alerts`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);

      // Return fallback gracefully without throwing
      if (response.status === 429 || response.status === 402) {
        return successResponse({ fallback: true }, corsHeaders);
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    // Parse the JSON response from the AI
    let analysis: AIAnalysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // Validate and sanitize the response
    const sanitizedAnalysis: AIAnalysis = {
      insight: analysis.insight || "Análise não disponível.",
      alerts: Array.isArray(analysis.alerts)
        ? analysis.alerts.slice(0, 3).map(a => ({
          type: a.type === "danger" ? "danger" : "warning",
          message: String(a.message || ""),
        }))
        : [],
      recommendations: Array.isArray(analysis.recommendations)
        ? analysis.recommendations.slice(0, 3).map(r => ({
          title: String(r.title || ""),
          description: String(r.description || ""),
          priority: ["high", "medium", "low"].includes(r.priority) ? r.priority : "medium",
        }))
        : [],
      healthScore: typeof analysis.healthScore === "number"
        ? Math.max(0, Math.min(100, Math.round(analysis.healthScore)))
        : 50,
    };

    return successResponse(sanitizedAnalysis, corsHeaders);
  } catch (error: unknown) {
    // 3. Error Isolation (Information Leakage Prevention)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logId = crypto.randomUUID();
    console.error(`CRITICAL ERROR [${logId}]:`, errorMessage);

    return jsonResponse({ fallback: true, errorId: logId }, 500, corsHeaders);
  }
});
