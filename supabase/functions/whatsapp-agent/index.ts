import { normalizeWebhook } from "./utils.ts";
import { EvolutionWebhook, NormalizedMessage } from "./types.ts";
import { runAgent } from "./agent.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logging.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { successResponse, errorResponse, jsonResponse } from "../_shared/responses.ts";

const log = createLogger("WHATSAPP-AGENT");

Deno.serve(async (req) => {
    const corsHeaders = getCorsHeaders(req);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createAdminClient();

        const body: EvolutionWebhook = await req.json();
        log(`Received event: ${body.event} from ${body.instance}`);

        // Verify webhook authenticity via Evolution API key
        const expectedApiKey = Deno.env.get("EVOLUTION_API_KEY");
        if (!expectedApiKey || body.apikey !== expectedApiKey) {
            log("Invalid or missing webhook apikey");
            return errorResponse("Unauthorized", 401, corsHeaders);
        }

        // 1. Normalize
        const message = normalizeWebhook(body);

        // 1.1 Deduplication with Redis
        const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
        const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
        if (redisUrl && redisToken && message.messageId) {
            const cacheKey = `numa:msg:${message.messageId}`;
            const check = await fetch(`${redisUrl}/get/${cacheKey}`, {
                headers: { Authorization: `Bearer ${redisToken}` }
            });
            const { result } = await check.json();
            if (result) {
                log(`Duplicate message ignored: ${message.messageId}`);
                return successResponse({ status: "ignored_duplicate" }, corsHeaders);
            }
            // Mark as processed (TTL 24h = 86400s)
            await fetch(`${redisUrl}/set/${cacheKey}/processed/EX/86400`, {
                headers: { Authorization: `Bearer ${redisToken}` }
            });
        }

        // Skip if message is from the agent itself to prevent loops
        if (message.fromMe) {
            return successResponse({ status: "ignored_self" }, corsHeaders);
        }

        // 2. Lead Lookup Logic (Ported CRM branches c0-c4)
        log(`Processing message from ${message.remoteJid}: ${message.text}`);

        let lead = null;
        const phone = message.remoteJid.split("@")[0] || message.remoteJidAlt?.split("@")[0];
        const lid = message.isMetaAds ? (message.remoteJid.includes("@lid") ? message.remoteJid : message.remoteJidAlt) : null;

        if (lid) {
            const { data } = await supabase
                .from("leads")
                .select("*, companies(name)")
                .eq("lid_id", lid)
                .single();
            lead = data;
        }

        if (!lead && phone) {
            const { data } = await supabase
                .from("leads")
                .select("*, companies(name)")
                .eq("telefone", phone)
                .single();
            lead = data;
        }

        // 3. Lead Creation/Update if needed
        if (!lead) {
            const { data, error } = await supabase
                .from("leads")
                .insert({
                    nome: message.pushName,
                    telefone: phone,
                    lid_id: lid,
                    status: "novo_lead",
                    origem: message.metadata?.origemCombinada,
                    ctwa_clid: message.metadata?.ctwaClid,
                    username_whatsapp: message.pushName,
                    instancia_evolution: message.instance
                })
                .select()
                .single();

            if (error) throw error;
            lead = data;
        } else {
            // Update last message timestamp
            await supabase
                .from("leads")
                .update({ ultima_mensagem_at: new Date().toISOString() })
                .eq("id", lead.id);
        }

        // 4. Handle Media (Whisper/OCR)
        if (message.messageType === "audioMessage") {
            const { getMediaBase64 } = await import("./evolutionService.ts");
            const { transcribeAudio } = await import("./mediaHandler.ts");

            const base64 = await getMediaBase64(message.instance, body.apikey, message.messageId);
            if (base64) {
                const transcript = await transcribeAudio(base64);
                if (transcript) {
                    log(`Audio transcribed: ${transcript}`);
                    message.text = `[ÁUDIO TRANSCRITO]: ${transcript}`;
                }
            }
        } else if (message.messageType === "imageMessage") {
            const { getMediaBase64 } = await import("./evolutionService.ts");
            const { processImageVision } = await import("./mediaHandler.ts");

            const base64 = await getMediaBase64(message.instance, body.apikey, message.messageId);
            if (base64) {
                const analysis = await processImageVision(base64);
                if (analysis) {
                    log(`Image analyzed: ${analysis}`);
                    message.text = `[IMAGEM ANALISADA]: ${analysis}`;
                }
            }
        }

        // 5. Run AI Agent
        log(`Starting runAgent for lead ${lead?.id}`);
        await runAgent(message, lead, supabase, body.apikey);
        log(`runAgent finished for lead ${lead?.id}`);

        return successResponse({ status: "processed", lead_id: lead?.id }, corsHeaders);

    } catch (error) {
        const logId = crypto.randomUUID();
        log(`Error [${logId}]`, { error: String(error) });
        return jsonResponse({ error: "Internal server error", reference: logId }, 500, corsHeaders);
    }
});
