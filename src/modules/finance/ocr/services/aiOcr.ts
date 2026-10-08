// ============================================================
// THE BLACK BOX — Frontend AI OCR Module (Air-Gapped)
// This module NEVER touches API keys.
// All AI calls are proxied through the Edge Function "ai-ocr-proxy".
// ============================================================

import { callEdgeFunction } from '@/lib/supabase/edge-functions';
import { EDGE_FUNCTIONS } from '@/lib/api-endpoints';
import { ExtractedOcrData } from './ocrExtractors';

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const aiOcr = {
    // Always returns true — the proxy handles provider availability server-side
    isConfigured: () => true,
    // Keep legacy checks for backwards compatibility (both return true)
    isGeminiConfigured: () => true,
    isOpenAIConfigured: () => true,

    /**
     * Extract data from document images via the server-side proxy.
     * The frontend sends base64 images to the Edge Function,
     * which holds the API keys and makes the actual AI call.
     */
    async extractFromImages(images: Blob[]): Promise<ExtractedOcrData> {
        const imagePayloads = await Promise.all(
            images.map(async (img) => ({
                base64: await blobToBase64(img),
                mimeType: img.type || 'image/jpeg',
            }))
        );

        const data = await callEdgeFunction<{ data?: ExtractedOcrData; provider?: string }>(EDGE_FUNCTIONS.AI_OCR_PROXY, {
            body: {
                mode: 'ocr-image',
                images: imagePayloads,
            },
            fallbackMessage: 'Falha no serviço de OCR. Tente novamente.',
        });

        if (!data?.data) {
            throw new Error('Resposta vazia do serviço de OCR.');
        }

        return { ...data.data, rawText: `Extracted via ${data.provider || 'AI'} (server-side)` };
    },

    /**
     * Extract transactions from spreadsheet text via the server-side proxy.
     */
    async extractTransactionsFromText(text: string): Promise<ExtractedOcrData[]> {
        const data = await callEdgeFunction<{ data?: ExtractedOcrData[] }>(EDGE_FUNCTIONS.AI_OCR_PROXY, {
            body: {
                mode: 'ocr-text',
                text,
            },
            fallbackMessage: 'Falha no serviço de OCR. Tente novamente.',
        });

        if (!data?.data || !Array.isArray(data.data)) {
            throw new Error('Formato inesperado na resposta de extração de transações.');
        }

        return data.data;
    },

    // ---- Legacy method aliases (for backwards compatibility) ----
    async extractWithGemini(images: Blob[]): Promise<ExtractedOcrData> {
        return this.extractFromImages(images);
    },

    async extractWithOpenAI(images: Blob[]): Promise<ExtractedOcrData> {
        return this.extractFromImages(images);
    },

    async extractTransactionsFromTextGemini(text: string): Promise<ExtractedOcrData[]> {
        return this.extractTransactionsFromText(text);
    },

    async extractTransactionsFromTextOpenAI(text: string): Promise<ExtractedOcrData[]> {
        return this.extractTransactionsFromText(text);
    },
};
