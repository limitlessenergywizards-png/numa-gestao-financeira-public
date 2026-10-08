export async function sendWhatsAppMessage(instance: string, apiKey: string, number: string, text: string) {
    let baseUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.lewdigital.com";
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const url = `${baseUrl}/message/sendText/${instance}`;

    console.log(`Sending message to Evolution URL: ${url}`);

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
        },
        body: JSON.stringify({
            number,
            text,
            delay: Math.floor(Math.random() * 500) + 100, // randomized delay
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Evolution API Error: ${response.status} - ${errorBody}`);
        throw new Error(`Failed to send message: ${response.status} ${errorBody}`);
    }

    return response.json();
}

export async function sendPresence(instance: string, apiKey: string, number: string, presence: "composing" | "recording" | "paused") {
    let baseUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.lewdigital.com";
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
    const url = `${baseUrl}/chat/sendPresence/${instance}`;

    await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
        },
        body: JSON.stringify({
            number,
            presence,
            delay: 0,
        }),
    });
}
export async function getMediaBase64(instance: string, apiKey: string, messageId: string) {
    let baseUrl = Deno.env.get("EVOLUTION_API_URL") || "https://evolution.lewdigital.com";
    if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);

    // We send the message ID to the base64 endpoint
    const url = `${baseUrl}/chat/getBase64FromMediaMessage/${instance}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "apikey": apiKey,
        },
        body: JSON.stringify({
            messageId,
            convertToMp4: false
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Evolution Media Error: ${response.status} - ${errorBody}`);
        return null;
    }

    const data = await response.json();
    return data.base64 || null;
}
