import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const log = createLogger("AI-CHAT");

// --- DEFINIÇÃO DE FERRAMENTAS (TOOLS) ---
const tools = [
    {
        type: "function",
        function: {
            name: "get_current_balance",
            description: "Busca o saldo atual total somando todas as contas bancárias da empresa atual do usuário.",
            parameters: {
                type: "object",
                properties: {},
                required: [],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_cashflow_summary",
            description: "Busca um resumo do fluxo de caixa (contas a pagar e a receber) para um determinado mês e ano.",
            parameters: {
                type: "object",
                properties: {
                    month: {
                        type: "integer",
                        description: "Mês (1 a 12)",
                    },
                    year: {
                        type: "integer",
                        description: "Ano com 4 dígitos (ex: 2026)",
                    },
                },
                required: ["month", "year"],
            },
        },
    }
];

Deno.serve(async (req: Request) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authResult = requireAuth(req, corsHeaders);
        if (authResult instanceof Response) return authResult;
        const authHeader = authResult;

        // Instancia o cliente Supabase COM o JWT do usuário (aplica RLS rigoroso)
        const supabase = createAuthClient(authHeader);

        // Extract user ID for rate limiting
        const userResult = await extractUser(authHeader, supabase, corsHeaders);
        if (userResult instanceof Response) return userResult;
        const { userId } = userResult;

        // Rate limit: 30 requests per 15 minutes
        const rl = await checkRateLimit(userId, "ai-chat", 30, 900);
        if (!rl.allowed) {
            return rateLimitResponse(rl.retryAfter!, corsHeaders);
        }

        // ── Parse Body ──
        let rawBody;
        try {
            rawBody = await req.json();
        } catch {
            return errorResponse("Malformed JSON", 400, corsHeaders);
        }

        const initialMessages = rawBody?.messages;
        const context = rawBody?.context;

        if (!initialMessages || !Array.isArray(initialMessages) || initialMessages.length === 0) {
            return errorResponse("Messages required", 400, corsHeaders);
        }

        // ── IRON GATE: Validate company ownership (defense in depth) ──
        const companyId = context?.companyId;
        if (companyId && typeof companyId === 'string') {
            const { data: companyCheck } = await supabase
                .from('user_companies')
                .select('id')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .maybeSingle();

            if (!companyCheck) {
                // IDOR attempt: user trying to access another company's data
                return errorResponse("Not found", 404, corsHeaders);
            }
        }

        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY_ALCATEIA");
        if (!OPENAI_API_KEY) {
            return errorResponse("Serviço de IA indisponível.", 503, corsHeaders);
        }

        // ── Build Context ──
        let contextString = "";
        if (context) {
            const fmt = (n?: number) => n ? `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00';
            contextString = `\n\nDADOS EM CACHE DA UI:
- Usuário: ${context.userName || 'N/A'}
- Empresa: ${context.companyName || 'N/A'}
- Saldo Atual Visualizado: ${fmt(context.currentBalance)}
- A Receber (Mês): ${fmt(context.monthlyReceivables)}
- A Pagar (Mês): ${fmt(context.monthlyPayables)}
Nota: Os dados acima vieram do cache do frontend. Use suas TOOLS para buscar dados precisos do banco sempre que o usuário perguntar valores exatos.`;
        }

        const systemPrompt = `Você é o NUMA, um Consultor Financeiro, Contábil e Estratégico de Elite para médias empresas.
Você é extremamente sofisticado, direto, e inteligente.
Para análises precisas, você DEVE usar as TOOLS disponíveis para extrair dados em tempo real do banco de dados da empresa antes de responder ao usuário com números críticos.
Use markdown para formatar (negrito, listas, etc). Seja profissional e cirúrgico nas recomendações financeiras.${contextString}`;

        // Todas as mensagens do chat
        const apiMessages = [
            { role: "system", content: systemPrompt },
            ...initialMessages
        ];

        log("Starting execution loop...");

        // LOOP DE EXECUÇÃO (ReAct)
        let iterations = 0;
        const maxIterations = 5;

        while (iterations < maxIterations) {
            iterations++;
            log(`Iteration ${iterations}`);

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: apiMessages,
                    temperature: 0.2, // Menor temperatura para ferramentas analíticas
                    tools: tools,
                    tool_choice: "auto",
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
            }

            const responseData = await response.json();
            const messageObj = responseData.choices[0].message;

            // Adiciona a resposta do assistente (podendo conter tool_calls) no array de mensagens
            apiMessages.push(messageObj);

            // Se o assistente decidiu não chamar ferramenta (stop), terminamos o loop
            if (responseData.choices[0].finish_reason === "stop" || !messageObj.tool_calls) {
                log("Finished generating text.");
                return successResponse({ response: messageObj.content }, corsHeaders);
            }

            // Se chegou aqui, ele quer chamar ferramentas
            log(`Assistant requested ${messageObj.tool_calls.length} tool call(s)`);

            for (const toolCall of messageObj.tool_calls) {
                const funcName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments || "{}");

                let toolResult = "";

                try {
                    log(`Executing tool: ${funcName}`, args);

                    if (funcName === "get_current_balance") {
                        // DB Call
                        let query = supabase.from("bank_accounts").select("current_balance");
                        if (context?.companyId) query = query.eq("company_id", context.companyId);

                        const { data, error } = await query;

                        if (error) throw error;

                        const total = data.reduce((acc: number, curr: any) => acc + (curr.current_balance || 0), 0);
                        toolResult = JSON.stringify({
                            success: true,
                            total_balance: total,
                            num_accounts: data.length
                        });
                    }
                    else if (funcName === "get_cashflow_summary") {
                        const { month, year } = args;
                        // Construindo datas para o inicio e fim do mes
                        const startDate = new Date(year, month - 1, 1).toISOString();
                        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

                        // A Pagar
                        let payablesQuery = supabase
                            .from("payables")
                            .select("amount, status")
                            .gte("due_date", startDate)
                            .lte("due_date", endDate);
                        if (context?.companyId) payablesQuery = payablesQuery.eq("company_id", context.companyId);

                        const { data: payables, error: err1 } = await payablesQuery;
                        if (err1) throw err1;

                        // A Receber
                        let receivablesQuery = supabase
                            .from("receivables")
                            .select("amount, status")
                            .gte("due_date", startDate)
                            .lte("due_date", endDate);
                        if (context?.companyId) receivablesQuery = receivablesQuery.eq("company_id", context.companyId);

                        const { data: receivables, error: err2 } = await receivablesQuery;
                        if (err2) throw err2;

                        const totalPayables = payables.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
                        const totalReceivables = receivables.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
                        const paidPayables = payables.filter((p: any) => p.status === 'pago').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
                        const receivedReceivables = receivables.filter((r: any) => r.status === 'recebido').reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);

                        toolResult = JSON.stringify({
                            success: true,
                            month, year,
                            payables: { total: totalPayables, paid: paidPayables, pending: totalPayables - paidPayables },
                            receivables: { total: totalReceivables, received: receivedReceivables, pending: totalReceivables - receivedReceivables }
                        });
                    }
                    else {
                        toolResult = JSON.stringify({ error: `Função ${funcName} não encontrada.` });
                    }
                } catch (e: any) {
                    log(`Tool ${funcName} execution failed`, e.message);
                    toolResult = JSON.stringify({ error: `Falha na execução do banco de dados: ${e.message}` });
                }

                // Append the Tool's result to the messages array
                apiMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: funcName,
                    content: toolResult
                });
            }
        }

        log("Loop limit reached without 'stop' reason.");
        return successResponse({ response: "Minha análise foi muito profunda e atingiu o limite de processamento interno. Gostaria de perguntar de forma mais específica?" }, corsHeaders);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const logId = crypto.randomUUID();
        log(`ERROR [${logId}]`, errorMessage);

        return errorResponse("Erro interno estrutural.", 500, corsHeaders);
    }
});
