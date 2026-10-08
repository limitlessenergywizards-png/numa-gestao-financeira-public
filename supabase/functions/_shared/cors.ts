/**
 * CORS utility with origin allowlist for production security.
 * Replaces the wildcard Access-Control-Allow-Origin: * pattern.
 */

const ALLOWED_ORIGINS = [
  "https://numagestaofinanceira.com",
  "https://www.numagestaofinanceira.com",
  "https://numa-gestao-financeira.vercel.app",
];

// Allow all origins in development
const isDev = Deno.env.get("ENVIRONMENT") === "development";

export function getCorsHeaders(req: Request): Record<string, string> {
  if (isDev) {
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    };
  }

  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
