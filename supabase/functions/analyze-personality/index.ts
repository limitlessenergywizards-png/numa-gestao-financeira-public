import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse, jsonResponse } from "../_shared/responses.ts";

const log = createLogger("ANALYZE-PERSONALITY");

interface AnalyzeRequest {
  type: 'insight' | 'narrative' | 'missions';
  archetype: string;
  userData: {
    stats?: {
      totalReceivables: number;
      totalPayables: number;
      paidReceivables: number;
      paidPayables: number;
      overdueReceivables: number;
      overduePayables: number;
    };
    milestone?: {
      title: string;
      type: string;
      xp: number;
    };
    recentActivity?: string;
    level?: number;
    totalXP?: number;
  };
  language?: string;
}

const ARCHETYPE_PROMPTS: Record<string, string> = {
  strategist: "O Estrategista: pensa analiticamente, planeja cada movimento, busca otimização constante.",
  explorer: "O Desbravador: abraça riscos calculados, busca crescimento, vê oportunidades onde outros veem obstáculos.",
  guardian: "O Guardião: valoriza segurança, construção de patrimônio, decisões conservadoras e fundamentadas.",
  visionary: "O Visionário: foca no longo prazo, investe em inovação, acredita em transformação.",
  balancer: "O Equilibrista: busca harmonia, evita extremos, concilia diferentes objetivos financeiros."
};

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Rate limit: 5 requests per 15 minutes
    const rl = await checkRateLimit(userId, "analyze-personality", 5, 900);
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfter!, corsHeaders);
    }

    const { type, archetype, userData, language = 'pt-BR' } = await req.json() as AnalyzeRequest;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("AI service configuration missing");
      return jsonResponse({
        error: "Service temporarily unavailable",
        fallback: getFallbackResponse(type, archetype, userData)
      }, 503, corsHeaders);
    }

    const archetypeContext = ARCHETYPE_PROMPTS[archetype] || "usuário do sistema financeiro";
    const isPortuguese = language.startsWith('pt');

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'insight': {
        systemPrompt = `Você é um consultor financeiro empático e perspicaz que conhece bem o perfil do usuário: ${archetypeContext}.
        Gere insights personalizados e acionáveis baseados nos dados financeiros.
        ${isPortuguese ? 'Responda em português brasileiro.' : 'Respond in English.'}
        Seja encorajador mas realista. Use no máximo 3 frases.`;

        const stats = userData.stats;
        const receivableRate = stats && stats.totalReceivables > 0
          ? Math.round(stats.paidReceivables / stats.totalReceivables * 100)
          : 0;
        const payableRate = stats && stats.totalPayables > 0
          ? Math.round(stats.paidPayables / stats.totalPayables * 100)
          : 0;

        userPrompt = `Analise a situação financeira:
        - Taxa de recebimento: ${receivableRate}%
        - Taxa de pagamento: ${payableRate}%
        - Títulos pendentes a receber: ${stats?.overdueReceivables || 0}
        - Títulos pendentes a pagar: ${stats?.overduePayables || 0}
        - Nível do usuário: ${userData.level || 1}
        - XP total: ${userData.totalXP || 0}

        Gere um insight personalizado para este ${archetypeContext.split(':')[0]}.`;
        break;
      }

      case 'narrative': {
        systemPrompt = `Você é um narrador épico de jornadas financeiras. Crie uma narrativa curta e inspiradora para celebrar conquistas.
        O usuário tem o perfil: ${archetypeContext}
        ${isPortuguese ? 'Responda em português brasileiro.' : 'Respond in English.'}
        Use linguagem poética mas acessível. Máximo 2 frases.`;

        userPrompt = `O usuário acabou de conquistar: "${userData.milestone?.title}"
        Tipo: ${userData.milestone?.type}
        XP ganho: ${userData.milestone?.xp}

        Crie uma narrativa épica para este momento.`;
        break;
      }

      case 'missions': {
        systemPrompt = `Você é um mentor financeiro gamificado. Sugira missões personalizadas baseadas no perfil e dados do usuário.
        Perfil: ${archetypeContext}
        ${isPortuguese ? 'Responda em português brasileiro.' : 'Respond in English.'}
        Retorne EXATAMENTE 3 missões em formato JSON.`;

        userPrompt = `Baseado nos dados:
        - Nível: ${userData.level || 1}
        - Atividade recente: ${userData.recentActivity || 'nenhuma'}
        - Títulos pendentes: ${(userData.stats?.overdueReceivables || 0) + (userData.stats?.overduePayables || 0)}

        Sugira 3 missões diárias personalizadas no formato:
        [{"title": "...", "description": "...", "type": "...", "target": 1, "xp": 15}]`;
        break;
      }

      default:
        throw new Error(`Unknown analysis type: ${type}`);
    }

    log(`Processing ${type} request`, { archetype });

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return jsonResponse({
          error: "Rate limit exceeded. Please try again later.",
          fallback: getFallbackResponse(type, archetype, userData)
        }, 429, corsHeaders);
      }

      if (response.status === 402) {
        return jsonResponse({
          error: "AI credits exhausted.",
          fallback: getFallbackResponse(type, archetype, userData)
        }, 402, corsHeaders);
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    log(`Successfully generated ${type} response`);

    // Parse response based on type
    let result: string | object = content;

    if (type === 'missions') {
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse missions JSON:', e);
        result = getFallbackResponse(type, archetype, userData);
      }
    }

    return successResponse({ result }, corsHeaders);

  } catch (error) {
    console.error("Error in analyze-personality:", error);
    return jsonResponse({
      error: error instanceof Error ? error.message : "Unknown error",
      fallback: getFallbackResponse('insight', 'guardian', {})
    }, 500, corsHeaders);
  }
});

function getFallbackResponse(type: string, archetype: string, userData: AnalyzeRequest['userData']): string | object {
  const archetypeName = {
    strategist: 'Estrategista',
    explorer: 'Desbravador',
    guardian: 'Guardião',
    visionary: 'Visionário',
    balancer: 'Equilibrista'
  }[archetype] || 'Guardião';

  switch (type) {
    case 'insight':
      return `Como ${archetypeName}, você está no caminho certo. Continue monitorando suas finanças diariamente para alcançar seus objetivos.`;
    case 'narrative':
      return `O ${archetypeName} avança em sua jornada, deixando sua marca na história financeira.`;
    case 'missions':
      return [
        { title: "Revisar Pendências", description: "Verifique títulos pendentes", type: "check_receivables", target: 1, xp: 10 },
        { title: "Atualizar Registros", description: "Registre novas movimentações", type: "register_transactions", target: 2, xp: 15 },
        { title: "Analisar Fluxo", description: "Consulte o fluxo de caixa", type: "view_cashflow", target: 1, xp: 10 }
      ];
    default:
      return "Continue sua jornada financeira!";
  }
}
