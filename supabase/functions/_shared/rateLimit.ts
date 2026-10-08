/**
 * Per-user rate limiting using Upstash Redis REST API.
 * Falls back to allowing requests if Redis is not configured.
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  // If Redis is not configured, allow the request (fail open)
  if (!redisUrl || !redisToken) {
    return { allowed: true, remaining: maxRequests };
  }

  const key = `numa:rl:${endpoint}:${userId}`;

  try {
    // Increment the counter
    const incrResponse = await fetch(`${redisUrl}/incr/${key}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    const { result: count } = await incrResponse.json();

    // Set TTL on first request in window
    if (count === 1) {
      await fetch(`${redisUrl}/expire/${key}/${windowSeconds}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
    }

    const remaining = Math.max(0, maxRequests - count);
    const allowed = count <= maxRequests;

    // Get TTL for Retry-After header
    let retryAfter: number | undefined;
    if (!allowed) {
      const ttlResponse = await fetch(`${redisUrl}/ttl/${key}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      const { result: ttl } = await ttlResponse.json();
      retryAfter = ttl > 0 ? ttl : windowSeconds;
    }

    return { allowed, remaining, retryAfter };
  } catch (error) {
    console.error("[RATE-LIMIT] Redis error, allowing request:", error);
    return { allowed: true, remaining: maxRequests };
  }
}

/**
 * Returns a 429 Too Many Requests response with appropriate headers.
 */
export function rateLimitResponse(
  retryAfter: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
