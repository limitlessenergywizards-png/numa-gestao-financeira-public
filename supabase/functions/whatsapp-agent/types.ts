// ============================================================
// Types for the NUMA WhatsApp Agent
// ============================================================

export interface EvolutionWebhook {
    event: string;
    instance: string;
    apikey: string;
    sender: string;
    date_time: string;
    data: any;
}

export interface NormalizedMessage {
    instance: string;
    event: string;
    sender: string;
    date_time: string;
    pushName: string;
    remoteJid: string;
    remoteJidAlt: string | null;
    messageId: string;
    fromMe: boolean;
    text: string;
    messageType: string;
    mediaUrl?: string;
    mimetype?: string;
    isMetaAds: boolean;
    metadata: {
        ctwaClid: string | null;
        conversionSource: string | null;
        sourceApp: string | null;
        origemCombinada: string | null;
    };
}

export interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
    tool_calls?: any[];
    name?: string;
}
