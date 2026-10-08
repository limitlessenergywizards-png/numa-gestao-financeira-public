// ============================================================
// NUMA WhatsApp Agent — Production-Grade ReAct Loop
// Uses direct OpenAI SDK (reliable on Deno Edge Functions)
// Model: gpt-4.1-mini
// ============================================================

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import OpenAI from "https://esm.sh/openai@4.24.1";
import { NormalizedMessage } from "./types.ts";
import { buildSystemPrompt } from "./prompt.ts";
import { toolDefinitions, executeTool } from "./tools.ts";
import { sendWhatsAppMessage, sendPresence } from "./evolutionService.ts";

// ---- Singleton OpenAI client ----
const openai = new OpenAI({
    apiKey: (Deno.env.get("OPENAI_API_KEY_ALCATEIA") || Deno.env.get("OPENAI_API_KEY")) as string,
});

// ---- Humanized Message Chunking (post-processing) ----
async function humanizeResponse(rawText: string): Promise<string[]> {
    try {
        console.log("[Humanizer] Calling gpt-4.1-mini to chunk response...");
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: `Apenas estruture a mensagem do usuário no formato JSON solicitado e seguindo as instruções de formatação abaixo. Não altere os fatos, apenas divida.

# Formatação
- Divida as mensagens para que fiquem naturais e humanizadas (como no WhatsApp);
- Cada mensagem deve ter no MÁXIMO 240 caracteres;
- Não crie mensagens vazias;
- Use quebras de linha (\\n\\n) após pontos finais dentro de uma mesma mensagem para facilitar a leitura;
- Para negrito (bold) use apenas UM asterisco '*' e NUNCA dois '**' (exemplo: *negrito*).

Exemplo de formato JSON:
{"mensagens": ["Mensagem 0", "Mensagem 1", "Mensagem 2"]}`
                },
                {
                    role: "user",
                    content: `<mensagem_do_usuario>\n${rawText}\n</mensagem_do_usuario>`
                }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "message_parser",
                    schema: {
                        type: "object",
                        properties: {
                            mensagens: {
                                type: "array",
                                items: { type: "string" },
                                description: "Lista de mensagens divididas e humanizadas"
                            }
                        },
                        required: ["mensagens"],
                        additionalProperties: false
                    },
                    strict: true
                }
            }
        });

        const content = response.choices[0].message.content;
        console.log("[Humanizer] Raw output:", content);

        if (content) {
            const parsed = JSON.parse(content);
            if (parsed.mensagens && Array.isArray(parsed.mensagens) && parsed.mensagens.length > 0) {
                // Filter out empty strings
                const filtered = parsed.mensagens.filter((m: string) => m.trim().length > 0);
                if (filtered.length > 0) return filtered;
            }
        }
    } catch (err: any) {
        console.error("[Humanizer] Failed:", err.message);
    }

    // Fallback: split by double newlines, then by single newlines if still too long
    console.log("[Humanizer] Fallback: splitting by paragraphs");
    const paragraphs = rawText.split('\n\n').filter((p: string) => p.trim().length > 0);
    if (paragraphs.length > 1) return paragraphs;

    // Last resort: return as single message
    return [rawText];
}

// ---- Send chunks with typing simulation ----
async function sendChunkedResponse(
    chunks: string[],
    instance: string,
    apiKey: string,
    remoteJid: string,
    leadId: string,
    supabase: SupabaseClient
) {
    console.log(`[Sender] Sending ${chunks.length} chunk(s) to ${remoteJid}`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            // Typing presence
            await sendPresence(instance, apiKey, remoteJid, "composing");

            // Dynamic delay: 1s base + 30ms per char, capped at 4s
            const typingDelay = Math.min(1000 + (chunk.length * 30), 4000);
            await new Promise(resolve => setTimeout(resolve, typingDelay));

            // Send
            await sendWhatsAppMessage(instance, apiKey, remoteJid, chunk);
            console.log(`[Sender] Chunk ${i + 1}/${chunks.length} sent (${chunk.length} chars)`);

            // Store in memory
            await supabase.from("whatsapp_messages").insert({
                lead_id: leadId,
                role: "assistant",
                content: chunk
            });

            // Brief pause between chunks
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1200));
            }
        } catch (err: any) {
            console.error(`[Sender] Failed to send chunk ${i + 1}:`, err.message);
            await supabase.from("whatsapp_messages").insert({
                lead_id: leadId,
                role: "assistant",
                content: `[DEBUG] Send error: ${err.message}`
            });
        }
    }
}

// ---- Send chunks WITHOUT storing (used when full response is already stored) ----
async function sendChunkedResponseNoStore(
    chunks: string[],
    instance: string,
    apiKey: string,
    remoteJid: string
) {
    console.log(`[Sender] Sending ${chunks.length} chunk(s) to ${remoteJid} (no-store)`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        try {
            await sendPresence(instance, apiKey, remoteJid, "composing");

            const typingDelay = Math.min(1000 + (chunk.length * 30), 4000);
            await new Promise(resolve => setTimeout(resolve, typingDelay));

            await sendWhatsAppMessage(instance, apiKey, remoteJid, chunk);
            console.log(`[Sender] Chunk ${i + 1}/${chunks.length} sent (${chunk.length} chars)`);

            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1200));
            }
        } catch (err: any) {
            console.error(`[Sender] Failed to send chunk ${i + 1}:`, err.message);
        }
    }
}

// ---- Main Agent Runner ----
export async function runAgent(
    message: NormalizedMessage,
    lead: any,
    supabase: SupabaseClient,
    evolutionApiKey?: string
) {
    const evoKey = (evolutionApiKey || Deno.env.get("EVOLUTION_API_KEY")) as string;
    if (!evoKey) {
        console.error("[Agent] Missing Evolution API Key");
        return;
    }

    const leadId = lead.id;
    let companyId = lead.company_id;
    let authUserId = lead.profile_id; // Start with either lead.profile_id (if it refers to auth user) or search below

    // If no profile linked to lead, try to find one by phone to satisfy audit log constraints
    if (!authUserId && lead.telefone) {
        const phoneDigits = lead.telefone.replace(/\D/g, '').slice(-8); // Broad match for last 8 digits
        const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, id")
            .or(`whatsapp_number.ilike.%${phoneDigits}%,phone.ilike.%${phoneDigits}%`)
            .limit(1)
            .maybeSingle();

        if (profile) {
            authUserId = profile.user_id || profile.id; // Try to get the Auth ID (user_id)
            console.log(`[Agent] Resolved authUserId from profiles: ${authUserId}`);

            // Proactively link the lead to this profile for future requests
            await supabase.from("leads").update({ profile_id: authUserId }).eq("id", leadId);
        }
    }

    const companyName = lead.companies?.name || "Não informada";

    // ---- Build System Prompt ----
    let systemContent = buildSystemPrompt(lead.nome || "Cliente", companyName, companyId);

    // Inject dynamic context: pre-fetch companies when no company is linked
    if (!companyId) {
        // PRE-FETCH companies so the agent ALWAYS has UUIDs in context
        let companiesContext = "";
        try {
            const companies = await executeTool("buscar_empresas", {}, supabase, companyId, leadId, authUserId);
            if (Array.isArray(companies) && companies.length > 0) {
                const companyList = companies.map((c: any, i: number) =>
                    `${i + 1}. *${c.name}* (CNPJ: ${c.document || 'N/A'}) → UUID: ${c.id}`
                ).join('\n');
                companiesContext = `\n\n## EMPRESAS DISPONÍVEIS PARA ESTE USUÁRIO (pré-carregadas do banco)\n${companyList}\n\nIMPORTANTE: Os UUIDs acima são REAIS e vieram do banco de dados. USE-OS diretamente.`;
            } else {
                companiesContext = `\n\n## NENHUMA EMPRESA ENCONTRADA\nNão foram encontradas empresas vinculadas a este telefone. Oriente o usuário a cadastrar uma empresa pelo app web.`;
            }
        } catch (fetchErr: any) {
            console.error("[Agent] Failed to pre-fetch companies:", fetchErr.message);
            companiesContext = `\n\n## ERRO AO BUSCAR EMPRESAS\nNão foi possível pré-carregar as empresas. Use a tool 'buscar_empresas' manualmente.`;
        }

        systemContent += `

## ATENÇÃO: LEAD SEM EMPRESA VINCULADA
O usuário AINDA NÃO SELECIONOU qual empresa deseja gerenciar.
${companiesContext}

### INSTRUÇÕES:
1. Apresente as empresas ao usuário com números (1, 2, 3...) e INCLUA os UUIDs na sua resposta interna.
2. Quando o usuário responder com um NÚMERO (ex: "1", "2", "1."), use IMEDIATAMENTE a tool 'vincular_empresa' com o UUID correspondente da lista acima. NÃO pergunte de novo. NÃO re-liste.
3. Quando o usuário responder com um NOME (ex: "Energy", "a primeira"), identifique a empresa e vincule.
4. Só depois de vincular, prossiga com requisições financeiras.

⚠️ REGRA ABSOLUTA: Se o usuário já viu a lista e respondeu com um número, CHAME vincular_empresa IMEDIATAMENTE com o UUID. Você JÁ TEM os UUIDs acima. NÃO chame buscar_empresas novamente.`;
    }

    // ---- Fetch Chat History ----
    const { data: history } = await supabase
        .from("whatsapp_messages")
        .select("role, content")
        .eq("lead_id", leadId)
        .in("role", ["user", "assistant"])
        .not("content", "is", null)
        .order("created_at", { ascending: true })
        .limit(20);

    const chatHistory = (history || [])
        .filter((h: any) => h.content && !h.content.startsWith("[DEBUG]"))
        .map((h: any) => ({ role: h.role as string, content: h.content as string }));

    // ---- Build messages array for the API ----
    const apiMessages: any[] = [
        { role: "system", content: systemContent },
        ...chatHistory,
        { role: "user", content: message.text }
    ];

    // Store user message
    await supabase.from("whatsapp_messages").insert({
        lead_id: leadId,
        role: "user",
        content: message.text
    });

    // Show typing
    await sendPresence(message.instance, evoKey, message.remoteJid, "composing");

    // ---- ReAct Tool Loop ----
    const MAX_ITERATIONS = 10;

    try {
        for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
            console.log(`[Agent] Iteration ${iteration + 1}/${MAX_ITERATIONS}`);

            const response = await openai.chat.completions.create({
                model: "gpt-4.1-mini",
                messages: apiMessages,
                tools: toolDefinitions as any,
                tool_choice: "auto",
                temperature: 0.3,
            });

            const choice = response.choices[0];
            const aiMessage = choice.message;

            // Push the full AI message (with potential tool_calls) into history
            apiMessages.push(aiMessage);

            // ---- Handle Tool Calls ----
            if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
                console.log(`[Agent] ${aiMessage.tool_calls.length} tool call(s) requested`);

                // Refresh typing indicator during tool execution
                await sendPresence(message.instance, evoKey, message.remoteJid, "composing");

                for (const toolCall of aiMessage.tool_calls) {
                    const funcName = toolCall.function.name;
                    let args: any = {};

                    try {
                        args = JSON.parse(toolCall.function.arguments || "{}");
                    } catch (parseErr) {
                        console.error(`[Agent] Failed to parse args for ${funcName}:`, toolCall.function.arguments);
                    }

                    console.log(`[Agent] Executing tool: ${funcName}`, JSON.stringify(args));

                    let toolResult: string;
                    try {
                        const result = await executeTool(funcName, args, supabase, companyId, leadId, authUserId);
                        toolResult = JSON.stringify(result);
                        console.log(`[Agent] Tool ${funcName} succeeded:`, toolResult.substring(0, 200));

                        // CRITICAL: After vincular_empresa, refresh companyId so subsequent tools have it
                        if (funcName === "vincular_empresa" && args.company_id) {
                            companyId = args.company_id;
                            console.log(`[Agent] companyId refreshed to: ${companyId}`);
                        }
                    } catch (toolErr: any) {
                        console.error(`[Agent] Tool ${funcName} error:`, toolErr.message);
                        toolResult = JSON.stringify({ error: toolErr.message });
                    }

                    // Push tool result back into messages
                    apiMessages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: toolResult,
                    });

                    // Store tool interaction in DB for debugging
                    await supabase.from("whatsapp_messages").insert({
                        lead_id: leadId,
                        role: "tool",
                        content: toolResult,
                        tool_call_id: toolCall.id,
                        tool_name: funcName
                    });
                }

                // Continue loop — the model will process tool results next
                continue;
            }

            // ---- Final Text Response (no more tool calls) ----
            const finalText = aiMessage.content;
            if (finalText) {
                console.log(`[Agent] Final response (${finalText.length} chars):`, finalText.substring(0, 100) + "...");

                // Store the FULL response as a single coherent memory entry
                // This ensures context continuity across requests
                await supabase.from("whatsapp_messages").insert({
                    lead_id: leadId,
                    role: "assistant",
                    content: finalText
                });

                // Humanize into chunks for WhatsApp delivery
                const chunks = await humanizeResponse(finalText);

                // Send chunks (without re-storing — already stored above)
                await sendChunkedResponseNoStore(chunks, message.instance, evoKey, message.remoteJid);
            } else {
                console.warn("[Agent] Empty final response from model");
            }

            // Done — exit loop
            break;
        }
    } catch (agentErr: any) {
        console.error("[Agent] Fatal error:", agentErr.message, agentErr.stack);

        // Store error for debugging
        await supabase.from("whatsapp_messages").insert({
            lead_id: leadId,
            role: "assistant",
            content: `[DEBUG] Agent fatal error: ${agentErr.message}`
        });

        // Try to send a friendly error message to the user
        try {
            await sendWhatsAppMessage(
                message.instance,
                evoKey,
                message.remoteJid,
                "Ops, tive um probleminha interno aqui. 😅 Pode repetir sua mensagem, por favor?"
            );
        } catch (_) {
            // Nothing we can do at this point
        }
    }
}
