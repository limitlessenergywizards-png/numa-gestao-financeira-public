/**
 * MSW Request Handlers for Supabase REST API
 *
 * These handlers intercept network requests to the Supabase PostgREST API,
 * providing realistic mocking for component-level tests.
 */
import { http, HttpResponse } from "msw";

const SUPABASE_URL = "http://localhost:54321";

// Default response data
const defaultResponses: Record<string, unknown[]> = {
  payables: [],
  receivables: [],
  transactions: [],
  bank_accounts: [],
  suppliers: [],
  customers: [],
  categories: [],
  chart_of_accounts: [],
};

export const handlers = [
  // Generic GET handler for Supabase tables
  http.get(`${SUPABASE_URL}/rest/v1/:table`, ({ params }) => {
    const table = params.table as string;
    const data = defaultResponses[table] ?? [];
    return HttpResponse.json(data);
  }),

  // Generic POST handler (inserts)
  http.post(`${SUPABASE_URL}/rest/v1/:table`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body, { status: 201 });
  }),

  // Generic PATCH handler (updates)
  http.patch(`${SUPABASE_URL}/rest/v1/:table`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  // Generic DELETE handler
  http.delete(`${SUPABASE_URL}/rest/v1/:table`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  // RPC endpoint
  http.post(`${SUPABASE_URL}/rest/v1/rpc/:function`, () => {
    return HttpResponse.json(null);
  }),

  // Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: "test-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "test-refresh",
      user: { id: "test-user-id", email: "test@example.com" },
    });
  }),
];

/**
 * Helper to override a specific table's response for a test.
 * Use with server.use() in individual tests.
 */
export function mockTableResponse(table: string, data: unknown[], status = 200) {
  return http.get(`${SUPABASE_URL}/rest/v1/${table}`, () => {
    return HttpResponse.json(data, { status });
  });
}

export function mockTableError(table: string, message: string, status = 400) {
  return http.get(`${SUPABASE_URL}/rest/v1/${table}`, () => {
    return HttpResponse.json({ message, code: "PGRST" + status }, { status });
  });
}

export function mockInsertResponse(table: string, data: unknown, status = 201) {
  return http.post(`${SUPABASE_URL}/rest/v1/${table}`, () => {
    return HttpResponse.json(data, { status });
  });
}

export function mockInsertError(table: string, message: string, status = 400) {
  return http.post(`${SUPABASE_URL}/rest/v1/${table}`, () => {
    return HttpResponse.json({ message, code: "PGRST" + status }, { status });
  });
}

export function mockRpcResponse(fn: string, data: unknown) {
  return http.post(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, () => {
    return HttpResponse.json(data);
  });
}
