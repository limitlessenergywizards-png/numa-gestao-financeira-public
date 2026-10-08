import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAuthClient } from "../_shared/supabase.ts";
import { requireAuth, extractUser } from "../_shared/auth.ts";
import { successResponse, errorResponse } from "../_shared/responses.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rateLimit.ts";

const log = createLogger("AI-OCR-PROXY");

// ============================================================
// THE BLACK BOX — AI OCR Proxy
// This Edge Function is the ONLY entity that touches AI API keys.
// The frontend NEVER sees them.
// ============================================================

const OCR_IMAGE_PROMPT = `Extraia as informações deste documento financeiro brasileiro (Nota Fiscal, Boleto, Cupom Fiscal, NFC-e, Recibo).
MESMO QUE A IMAGEM ESTEJA ILEGÍVEL, CORTADA OU COM QUALIDADE RUIM, FAÇA O SEU MELHOR PARA PREENCHER OS CAMPOS (CHUTE SE NECESSÁRIO), POIS O USUÁRIO IRÁ REVISAR DEPOIS.

REGRAS DE EXTRAÇÃO:
- "description" (Fornecedor/Loja): Geralmente é a PRIMEIRA LINHA com letras grandes no topo do cupom (ex: "NOME FANTASIA LTDA", "LARA ACESSÓRIOS", "MONTEIRO BRAGA", "URSO DA BATUCADA"). Max 100 caracteres. Se não souber, use 'Despesa Não Identificada'.
- "amount" (Valor Total): Procure por "TOTAL R$", "VALOR TOTAL", "VALOR A PAGAR". É O MAIOR VALOR e fica no finalzinho da lista de itens, antes do "Dinheiro" ou "Troco". Formate APENAS COM NÚMEROS e PONTO (ex: '33.74', '9.28', '6.00', '2.00'). Remova o R$. Se não achar o total explícito, some os itens.
- "dueDate" (Data): Fica no topo junto ao CNPJ ou bemmm no rodapé do documento (ex: "06/01/2022", "25/06/2012 14:36:29", "26/10/2018"). Formate estritamente como YYYY-MM-DD (ex: 2022-01-06). Se não encontrar, preencha com a data de hoje.
- "documentNumber": Procure abreviações como "CCF:", "C00:", "NFC-e nº", "Extrato No.", ou os números após "Série". (ex: extraia "000002" de CCF:000002, ou "055555586" de NFC-e nº 055555586). Se for boleto, os últimos dígitos. Se não achar, omita.
- "documentType": Tente adivinhar (ex: 'Cupom Fiscal', 'NFC-e', 'Nota Fiscal', 'Boleto', 'Recibo').

Retorne ÚNICA e EXCLUSIVAMENTE um objeto JSON válido (sem blocos de código markdown como \`\`\`json) correspondente à interface ExtractedOcrData:
{
  "amount": "string",
  "dueDate": "string",
  "description": "string",
  "documentNumber": "string",
  "documentType": "string"
}
A resposta deve ser *exclusivamente* o JSON, nada mais.`;

const XLSX_TRANSACTIONS_PROMPT = `Extraia uma lista de transações financeiras das seguintes linhas de uma planilha (as linhas podem estar sujas, desorganizadas e sem cabeçalho claro).
Tente deduzir quais colunas correspondem a Data, Histórico/Lançamento, e Valor.

Para cada transação encontrada, retorne um objeto na lista com as seguintes chaves (se disponíveis):
- amount: valor numérico da transação (use sinal negativo para saídas/despesas se aplicável). Apenas números, ponto para decimais. Ex: "-150.00" ou "5000.50".
- dueDate: data da transação no formato YYYY-MM-DD.
- description: histórico, descrição ou nome da parte envolvida (remetente/destinatário).
- documentNumber: número do documento ou identificador, se houver.

Retorne ÚNICA e EXCLUSIVAMENTE um array de objetos JSON válido correspondente às transações encontradas. Não use crases (\`\`\`) nem palavras fora do JSON.
Exemplo do formato esperado:
[
  { "amount": "-150.00", "dueDate": "2023-10-01", "description": "Supermercado XYZ", "documentNumber": "123456" },
  { "amount": "5000.50", "dueDate": "2023-10-02", "description": "Salário" }
]
`;

// ---- Gemini Call (server-side only) ----
async function callGemini(
    apiKey: string,
    parts: any[]
): Promise<string> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    response_mime_type: "application/json",
                    temperature: 0.1,
                },
            }),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("No text returned from Gemini");
    return textResponse;
}

// ---- OpenAI Call (server-side only) ----
async function callOpenAI(
    apiKey: string,
    messages: any[]
): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            response_format: { type: "json_object" },
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) throw new Error("No text returned from OpenAI");
    return textResponse;
}

function cleanJsonResponse(text: string): string {
    return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // ---- 0. PORTA DE FERRO: Autenticação JWT obrigatória ----
        const authResult = requireAuth(req, corsHeaders);
        if (authResult instanceof Response) return authResult;
        const authHeader = authResult;

        const supabase = createAuthClient(authHeader);

        const userResult = await extractUser(authHeader, supabase, corsHeaders);
        if (userResult instanceof Response) return userResult;
        const { userId } = userResult;

        log("Authenticated user", userId);

        // Rate limit: 20 requests per 15 minutes
        const rl = await checkRateLimit(userId, "ai-ocr-proxy", 20, 900);
        if (!rl.allowed) {
            return rateLimitResponse(rl.retryAfter!, corsHeaders);
        }

        // ---- 1. THE BLACK BOX: Chaves privadas carregadas do cofre ----
        const geminiKey = Deno.env.get("GEMINI_API_KEY") || "";
        const openaiKey = Deno.env.get("OPENAI_API_KEY") || "";

        if (!geminiKey && !openaiKey) {
            log("No AI API keys configured in secrets.");
            return errorResponse("Serviço de IA não configurado.", 503, corsHeaders);
        }

        // ---- 2. Parse payload ----
        const body = await req.json();
        const { mode, images, text } = body as {
            mode: "ocr-image" | "ocr-text";
            images?: { base64: string; mimeType: string }[];
            text?: string;
        };

        if (!mode || !["ocr-image", "ocr-text"].includes(mode)) {
            return errorResponse("Modo inválido. Use 'ocr-image' ou 'ocr-text'.", 400, corsHeaders);
        }

        let result: any = null;
        let provider = "none";

        // ============================================================
        // MODE: ocr-image — Extract data from receipt/invoice images
        // ============================================================
        if (mode === "ocr-image") {
            if (!images || !Array.isArray(images) || images.length === 0) {
                return errorResponse("Nenhuma imagem fornecida.", 400, corsHeaders);
            }

            // Limit to 10 images to prevent abuse
            const safeImages = images.slice(0, 10);

            // Try Gemini first
            if (geminiKey) {
                try {
                    log("Trying Gemini for image OCR...");
                    const parts: any[] = [{ text: OCR_IMAGE_PROMPT }];
                    for (const img of safeImages) {
                        parts.push({
                            inline_data: {
                                mime_type: img.mimeType || "image/jpeg",
                                data: img.base64,
                            },
                        });
                    }
                    const rawText = await callGemini(geminiKey, parts);
                    result = JSON.parse(cleanJsonResponse(rawText));
                    provider = "gemini";
                } catch (e) {
                    log("Gemini failed", e);
                }
            }

            // Fallback to OpenAI
            if (!result && openaiKey) {
                try {
                    log("Fallback to OpenAI for image OCR...");
                    const content: any[] = [{ type: "text", text: OCR_IMAGE_PROMPT }];
                    for (const img of safeImages) {
                        content.push({
                            type: "image_url",
                            image_url: {
                                url: `data:${img.mimeType || "image/jpeg"};base64,${img.base64}`,
                            },
                        });
                    }
                    const rawText = await callOpenAI(openaiKey, [
                        { role: "user", content },
                    ]);
                    result = JSON.parse(cleanJsonResponse(rawText));
                    provider = "openai";
                } catch (e) {
                    log("OpenAI failed", e);
                }
            }
        }

        // ============================================================
        // MODE: ocr-text — Extract transactions from spreadsheet text
        // ============================================================
        if (mode === "ocr-text") {
            if (!text || typeof text !== "string" || text.trim().length < 10) {
                return errorResponse("Texto insuficiente.", 400, corsHeaders);
            }

            // Truncate to prevent token abuse (max ~8000 chars)
            const safeText = text.slice(0, 8000);

            // Try Gemini first
            if (geminiKey) {
                try {
                    log("Trying Gemini for text extraction...");
                    const parts = [
                        { text: XLSX_TRANSACTIONS_PROMPT + "\n\nPlanilha:" + safeText },
                    ];
                    const rawText = await callGemini(geminiKey, parts);
                    const parsed = JSON.parse(cleanJsonResponse(rawText));
                    result = Array.isArray(parsed) ? parsed : parsed.transactions || parsed;
                    provider = "gemini";
                } catch (e) {
                    log("Gemini text failed", e);
                }
            }

            // Fallback to OpenAI
            if (!result && openaiKey) {
                try {
                    log("Fallback to OpenAI for text extraction...");
                    const rawText = await callOpenAI(openaiKey, [
                        { role: "system", content: XLSX_TRANSACTIONS_PROMPT },
                        { role: "user", content: safeText },
                    ]);
                    const parsed = JSON.parse(cleanJsonResponse(rawText));
                    result = Array.isArray(parsed)
                        ? parsed
                        : parsed.transactions || parsed;
                    provider = "openai";
                } catch (e) {
                    log("OpenAI text failed", e);
                }
            }
        }

        // ---- 3. Return result ----
        if (!result) {
            return errorResponse(
                "Nenhum provedor de IA conseguiu processar o documento. Tente novamente.",
                502,
                corsHeaders
            );
        }

        log(`Success via ${provider}`);

        return successResponse({ data: result, provider }, corsHeaders);
    } catch (error) {
        const refId = crypto.randomUUID().slice(0, 8);
        log(`Fatal error [${refId}]`, error);
        return errorResponse("Erro interno no serviço de OCR.", 500, corsHeaders);
    }
});
