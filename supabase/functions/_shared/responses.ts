/**
 * Standardized JSON response helpers for Edge Functions.
 */

export function jsonResponse(
  data: unknown,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return jsonResponse({ error: message }, status, corsHeaders);
}

export function successResponse(
  data: unknown,
  corsHeaders: Record<string, string>
): Response {
  return jsonResponse(data, 200, corsHeaders);
}
