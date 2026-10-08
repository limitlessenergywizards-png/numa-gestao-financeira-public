import OpenAI from "https://esm.sh/openai@4.24.1";

const openai = new OpenAI({
    apiKey: (Deno.env.get("OPENAI_API_KEY_ALCATEIA") || Deno.env.get("OPENAI_API_KEY")) as string,
});

/**
 * Transcribes audio from base64 using OpenAI Whisper
 */
export async function transcribeAudio(base64Audio: string): Promise<string | null> {
    try {
        console.log("Transcribing audio with Whisper...");

        // Convert base64 to Blob
        const binaryData = atob(base64Audio);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
        }

        const blob = new Blob([arrayBuffer], { type: "audio/ogg" });
        const file = new File([blob], "audio.ogg", { type: "audio/ogg" });

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
        });

        console.log("Transcription result:", transcription.text);
        return transcription.text;
    } catch (error) {
        console.error("Whisper transcription error:", error);
        return null;
    }
}

/**
 * Analyzes an image for OCR or financial context using GPT-4o Vision
 */
export async function processImageVision(base64Image: string): Promise<string | null> {
    try {
        console.log("Processing image with Vision...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analise esta imagem de comprovante, boleto ou nota fiscal. Extraia os dados financeiros (Fornecedor/Cliente, Valor, Data de Vencimento, CNPJ, Código de Barras se houver). Descreva o que é este documento brevemente." },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
        });

        const result = response.choices[0].message.content;
        console.log("Vision result:", result);
        return result;
    } catch (error) {
        console.error("Vision processing error:", error);
        return null;
    }
}
