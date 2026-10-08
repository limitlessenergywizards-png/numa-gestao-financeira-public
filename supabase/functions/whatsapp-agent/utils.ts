import { EvolutionWebhook, NormalizedMessage } from "./types.ts";

export function normalizeWebhook(body: any): NormalizedMessage {
    const eventData = body.data;
    const contextInfo = eventData.contextInfo || {};
    const externalAdReply = contextInfo.externalAdReply || {};

    // Meta Ads fields fallback
    const ctwaClid = externalAdReply.ctwaClid || null;
    const conversionSource = contextInfo.conversionSource || null;
    const sourceApp = contextInfo.entryPointConversionApp || externalAdReply.sourceApp || null;
    const sourceType = contextInfo.sourceType || null;
    const sourceId = contextInfo.sourceId || externalAdReply.sourceId || null;
    const sourceUrl = contextInfo.sourceUrl || externalAdReply.sourceUrl || null;

    const origemCombinada = (conversionSource && sourceApp)
        ? `${conversionSource}_${sourceApp}`
        : null;

    const remoteJid = eventData.key?.remoteJid || "";
    const remoteJidAlt = eventData.key?.remoteJidAlt || null;

    // Detect content
    let text = eventData.message?.conversation ||
        eventData.message?.extendedTextMessage?.text || "";

    const messageType = eventData.messageType || "conversation";
    let mediaUrl: string | undefined;
    let mimetype: string | undefined;

    if (eventData.message?.audioMessage) {
        mediaUrl = eventData.message.audioMessage.url;
        mimetype = eventData.message.audioMessage.mimetype;
    } else if (eventData.message?.imageMessage) {
        mediaUrl = eventData.message.imageMessage.url;
        mimetype = eventData.message.imageMessage.mimetype;
        text = eventData.message.imageMessage.caption || text;
    } else if (eventData.message?.documentMessage) {
        mediaUrl = eventData.message.documentMessage.url;
        mimetype = eventData.message.documentMessage.mimetype;
        text = eventData.message.documentMessage.caption || text;
    }

    // Scenarios Logic (Qual Cenário?)
    const isLid = (jid: string) => jid?.includes("@lid");
    const isWhatsApp = (jid: string) => jid?.includes("@s.whatsapp.net") || jid?.includes("@whatsapp");

    const hasLidIdentifier = isLid(remoteJid) || (remoteJidAlt && isLid(remoteJidAlt));
    const hasRealMetaAdsData = conversionSource !== null || sourceType !== null || sourceApp !== null;
    const isMetaAds = !!(hasLidIdentifier || hasRealMetaAdsData);

    return {
        instance: body.instance,
        event: body.event,
        sender: body.sender,
        date_time: body.date_time,
        pushName: eventData.pushName || "Cliente",
        remoteJid,
        remoteJidAlt,
        messageId: eventData.key?.id,
        fromMe: eventData.key?.fromMe || false,
        text,
        messageType,
        mediaUrl,
        mimetype,
        isMetaAds,
        metadata: {
            ctwaClid,
            conversionSource,
            sourceApp,
            origemCombinada
        }
    };
}
