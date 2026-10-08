import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse, jsonResponse } from "../_shared/responses.ts";

const log = createLogger("ANALYZE-CASHFLOW");

// 1. Zod Schema for strict payload validation
const CashflowRequestSchema = z.object({
  historicalData: z.array(z.object({
    weekNumber: z.number(),
    entradas: z.number(),
    saidas: z.number(),
    saldo: z.number(),
  })).default([]),
  categories: z.array(z.object({
    code: z.string(),
    name: z.string(),
    type: z.enum(['entrada', 'saida']),
    values: z.array(z.number()),
  })).default([]),
  companyContext: z.string().optional(),
  projectionWeeks: z.number().min(1).max(52).default(4),
  currentBalance: z.number().default(0),
}).strict(); // THE GAUNTLET: Reject any unmapped keys

type ProjectionRequest = z.infer<typeof CashflowRequestSchema>;
type HistoricalData = ProjectionRequest["historicalData"][0];
type CategoryData = ProjectionRequest["categories"][0];

interface WeeklyProjection {
  weekNumber: number;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

interface CategoryProjection {
  code: string;
  values: number[];
}

interface ProjectionScenario {
  name: string;
  description: string;
  multiplier: number;
  weeklyProjections: WeeklyProjection[];
  categoriesProjection: CategoryProjection[];
  totalEntradas: number;
  totalSaidas: number;
  finalBalance: number;
}

interface ProjectionResponse {
  scenarios: {
    optimistic: ProjectionScenario;
    realistic: ProjectionScenario;
    pessimistic: ProjectionScenario;
  };
  seasonalityInsights: string[];
  riskFactors: string[];
  opportunities: string[];
  confidence: number;
  analysisNarrative: string;
}

// Calculate weighted moving average
function weightedMovingAverage(values: number[], weights?: number[]): number {
  if (values.length === 0) return 0;

  const defaultWeights = values.map((_, i) => i + 1); // More recent = higher weight
  const w = weights || defaultWeights;
  const totalWeight = w.reduce((a, b) => a + b, 0);

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * w[i];
  }

  return totalWeight > 0 ? sum / totalWeight : 0;
}

// Linear regression for trend detection
function linearRegression(values: number[]): { slope: number; intercept: number; project: (x: number) => number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, project: () => values[0] || 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  values.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: values[n - 1], project: () => values[n - 1] };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  return {
    slope,
    intercept,
    project: (x: number) => Math.max(0, slope * x + intercept)
  };
}

// Detect seasonality patterns
function detectSeasonality(values: number[]): { hasSeason: boolean; pattern: string; adjustment: number } {
  if (values.length < 4) return { hasSeason: false, pattern: 'insufficient_data', adjustment: 1 };

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? stdDev / avg : 0; // Coefficient of variation

  if (cv > 0.3) {
    // High variability - likely seasonal
    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const adjustment = avg > 0 ? recentAvg / avg : 1;
    return { hasSeason: true, pattern: 'high_variability', adjustment };
  }

  return { hasSeason: false, pattern: 'stable', adjustment: 1 };
}

// XGBoost-like gradient boosting simulation (simplified)
function gradientBoostingProject(values: number[], periodsAhead: number): number {
  if (values.length < 3) return values[values.length - 1] || 0;

  // First learner: weighted average
  const wma = weightedMovingAverage(values.slice(-6));

  // Second learner: trend
  const lr = linearRegression(values);
  const trendValue = lr.project(values.length + periodsAhead - 1);

  // Third learner: recent momentum
  const recentDiff = values.length >= 2
    ? values[values.length - 1] - values[values.length - 2]
    : 0;
  const momentumValue = (values[values.length - 1] || 0) + recentDiff * periodsAhead * 0.5;

  // Ensemble: weighted combination
  const prediction = wma * 0.4 + trendValue * 0.35 + momentumValue * 0.25;

  return Math.max(0, prediction);
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

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
    const rl = await checkRateLimit(userId, "analyze-cashflow", 10, 900);
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter!, corsHeaders);
    }

    // 2. The Payload Barrier (Schema Validation)
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return errorResponse("Malformed JSON payload", 400, corsHeaders);
    }

    const payloadResult = CashflowRequestSchema.safeParse(rawBody);
    if (!payloadResult.success) {
      log("Schema error", payloadResult.error.format());
      return errorResponse("Invalid request payload format", 400, corsHeaders);
    }

    const { historicalData, categories, companyContext, projectionWeeks, currentBalance } = payloadResult.data;

    // Proceed if valid
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("AI service configuration missing");
      return errorResponse("Service temporarily unavailable", 503, corsHeaders);
    }

    // Calculate base projections using statistical methods
    const baseProjections: Record<string, number[]> = {};

    categories.forEach((cat: CategoryData) => {
      const projectedValues: number[] = [];
      for (let i = 1; i <= projectionWeeks; i++) {
        const projected = gradientBoostingProject(cat.values, i);
        projectedValues.push(projected);
      }
      baseProjections[cat.code] = projectedValues;
    });

    // Prepare AI prompt
    const prompt = `Você é um analista financeiro especializado em fluxo de caixa. Analise os dados históricos e projeções calculadas para fornecer insights e ajustes de cenários.

## Dados Históricos (últimas ${historicalData.length} semanas):
${historicalData.map((h: HistoricalData) => `Semana ${h.weekNumber}: Entradas=${h.entradas.toFixed(2)}, Saídas=${h.saidas.toFixed(2)}, Saldo=${h.saldo.toFixed(2)}`).join('\n')}

## Categorias com valores históricos:
${categories.map((c: CategoryData) => `${c.code} (${c.name}) [${c.type}]: ${c.values.map((v: number) => v.toFixed(0)).join(', ')}`).join('\n')}

## Projeções calculadas (base estatística):
${Object.entries(baseProjections).map(([code, vals]) => `${code}: ${vals.map(v => v.toFixed(0)).join(', ')}`).join('\n')}

## Contexto da empresa:
${companyContext || 'Empresa padrão sem contexto específico'}

## Saldo atual:
R$ ${currentBalance.toFixed(2)}

Por favor, analise e forneça:
1. seasonalityInsights: Lista de insights sobre sazonalidade detectada (máximo 3)
2. riskFactors: Lista de fatores de risco identificados (máximo 3)
3. opportunities: Lista de oportunidades identificadas (máximo 3)
4. confidence: Nível de confiança da projeção (0-100)
5. optimisticMultiplier: Multiplicador para cenário otimista (ex: 1.15 = +15%)
6. pessimisticMultiplier: Multiplicador para cenário pessimista (ex: 0.85 = -15%)
7. analysisNarrative: Uma narrativa curta (2-3 frases) explicando a análise

Responda APENAS com o JSON no formato especificado, sem texto adicional.`;

    let aiResponse: any = null;

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [
            { role: "system", content: "Você é um analista financeiro. Responda APENAS em JSON válido." },
            { role: "user", content: prompt }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_cashflow",
                description: "Analisa o fluxo de caixa e retorna insights",
                parameters: {
                  type: "object",
                  properties: {
                    seasonalityInsights: {
                      type: "array",
                      items: { type: "string" },
                      description: "Lista de insights sobre sazonalidade"
                    },
                    riskFactors: {
                      type: "array",
                      items: { type: "string" },
                      description: "Lista de fatores de risco"
                    },
                    opportunities: {
                      type: "array",
                      items: { type: "string" },
                      description: "Lista de oportunidades"
                    },
                    confidence: {
                      type: "number",
                      description: "Nível de confiança 0-100"
                    },
                    optimisticMultiplier: {
                      type: "number",
                      description: "Multiplicador otimista (ex: 1.20)"
                    },
                    pessimisticMultiplier: {
                      type: "number",
                      description: "Multiplicador pessimista (ex: 0.80)"
                    },
                    analysisNarrative: {
                      type: "string",
                      description: "Narrativa explicando a análise"
                    }
                  },
                  required: ["seasonalityInsights", "riskFactors", "opportunities", "confidence", "optimisticMultiplier", "pessimisticMultiplier", "analysisNarrative"],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "analyze_cashflow" } }
        }),
      });

      if (response.status === 429) {
        console.warn("Rate limited, using fallback");
      } else if (response.status === 402) {
        console.warn("Payment required, using fallback");
      } else if (response.ok) {
        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          aiResponse = JSON.parse(toolCall.function.arguments);
        }
      }
    } catch (aiError) {
      console.error("AI analysis error, using fallback:", aiError);
    }

    // Fallback values if AI fails
    const fallbackResponse = {
      seasonalityInsights: ["Análise baseada em tendência linear dos dados históricos"],
      riskFactors: ["Volatilidade nos dados pode afetar precisão das projeções"],
      opportunities: ["Padrões estáveis indicam previsibilidade no fluxo"],
      confidence: 65,
      optimisticMultiplier: 1.18,
      pessimisticMultiplier: 0.82,
      analysisNarrative: "Projeção calculada com métodos estatísticos. Recomenda-se acompanhamento semanal para ajustes."
    };

    const analysis = aiResponse || fallbackResponse;

    // Build scenarios
    const buildScenario = (name: string, description: string, multiplier: number, type: 'entrada' | 'saida' | 'both'): ProjectionScenario => {
      const categoriesProjection: CategoryProjection[] = [];
      let totalEntradas = 0;
      let totalSaidas = 0;

      categories.forEach((cat: CategoryData) => {
        const baseValues = baseProjections[cat.code] || [];
        let adjustedValues: number[];

        if (type === 'both' || cat.type === type) {
          adjustedValues = baseValues.map(v => v * multiplier);
        } else if (type === 'entrada' && cat.type === 'saida') {
          // For optimistic: reduce expenses
          adjustedValues = baseValues.map(v => v * (2 - multiplier));
        } else if (type === 'saida' && cat.type === 'entrada') {
          // For pessimistic: reduce income
          adjustedValues = baseValues.map(v => v * (2 - multiplier));
        } else {
          adjustedValues = baseValues;
        }

        categoriesProjection.push({ code: cat.code, values: adjustedValues });

        const sum = adjustedValues.reduce((a, b) => a + b, 0);
        if (cat.type === 'entrada') {
          totalEntradas += sum;
        } else {
          totalSaidas += sum;
        }
      });

      // Build weekly projections
      const weeklyProjections: WeeklyProjection[] = [];
      let runningBalance = currentBalance;
      const lastWeekNumber = historicalData.length > 0
        ? Math.max(...historicalData.map(h => h.weekNumber))
        : 0;

      for (let i = 0; i < projectionWeeks; i++) {
        let weekEntradas = 0;
        let weekSaidas = 0;

        categoriesProjection.forEach((cp: CategoryProjection, catIndex: number) => {
          const cat = categories[catIndex];
          if (cat.type === 'entrada') {
            weekEntradas += cp.values[i] || 0;
          } else {
            weekSaidas += cp.values[i] || 0;
          }
        });

        const saldo = weekEntradas - weekSaidas;
        runningBalance += saldo;

        weeklyProjections.push({
          weekNumber: lastWeekNumber + i + 1,
          entradas: weekEntradas,
          saidas: weekSaidas,
          saldo,
          saldoAcumulado: runningBalance
        });
      }

      return {
        name,
        description,
        multiplier,
        weeklyProjections,
        categoriesProjection,
        totalEntradas,
        totalSaidas,
        finalBalance: runningBalance
      };
    };

    const optimisticMult = analysis.optimisticMultiplier || 1.18;
    const pessimisticMult = analysis.pessimisticMultiplier || 0.82;

    const result: ProjectionResponse = {
      scenarios: {
        optimistic: buildScenario(
          "Otimista",
          "Cenário com crescimento de receitas e controle de despesas",
          optimisticMult,
          'entrada'
        ),
        realistic: buildScenario(
          "Realista",
          "Cenário baseado na tendência atual dos dados",
          1.0,
          'both'
        ),
        pessimistic: buildScenario(
          "Pessimista",
          "Cenário com redução de receitas e aumento de custos",
          pessimisticMult,
          'saida'
        )
      },
      seasonalityInsights: analysis.seasonalityInsights || [],
      riskFactors: analysis.riskFactors || [],
      opportunities: analysis.opportunities || [],
      confidence: analysis.confidence || 65,
      analysisNarrative: analysis.analysisNarrative || "Análise gerada com base em métodos estatísticos."
    };

    return successResponse(result, corsHeaders);

  } catch (error: unknown) {
    // 3. Error Isolation (Information Leakage Prevention)
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logId = crypto.randomUUID();
    console.error(`CRITICAL ERROR [${logId}]:`, errorMessage);

    return jsonResponse({ error: "Internal Server Error", reference: logId }, 500, corsHeaders);
  }
});
