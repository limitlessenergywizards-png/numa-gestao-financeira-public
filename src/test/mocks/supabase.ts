/**
 * Reusable Supabase Mock Builder
 *
 * Creates chainable mocks matching the PostgREST builder pattern.
 * Use with vi.mock('@/integrations/supabase/client', ...) in tests.
 */
import { vi } from "vitest";

type MockData = Record<string, unknown>[] | Record<string, unknown> | null;
type MockError = { message: string; code?: string } | null;

interface MockResponse {
  data: MockData;
  error: MockError;
  count?: number;
}

interface TableConfig {
  select?: MockResponse;
  insert?: MockResponse;
  update?: MockResponse;
  delete?: MockResponse;
  upsert?: MockResponse;
}

/**
 * Creates a chainable query builder mock that resolves to the configured response.
 */
function createChainBuilder(response: MockResponse) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  const chainMethods = [
    "select",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "like",
    "ilike",
    "is",
    "in",
    "contains",
    "containedBy",
    "order",
    "limit",
    "range",
    "filter",
    "not",
    "or",
    "match",
    "textSearch",
    "maybeSingle",
    "csv",
    "geojson",
    "explain",
    "rollback",
    "returns",
    "throwOnError",
    "abortSignal",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // Terminal methods
  builder.single = vi.fn().mockResolvedValue({
    data: Array.isArray(response.data) ? response.data[0] ?? null : response.data,
    error: response.error,
  });

  builder.then = vi.fn().mockImplementation((resolve) =>
    resolve(response)
  );

  // Make the builder itself thenable (await-able)
  const thenableBuilder = Object.assign(Promise.resolve(response), builder);

  // Re-attach chain methods to return the thenable builder
  for (const method of chainMethods) {
    thenableBuilder[method] = vi.fn().mockReturnValue(thenableBuilder);
  }
  thenableBuilder.single = vi.fn().mockResolvedValue({
    data: Array.isArray(response.data) ? response.data[0] ?? null : response.data,
    error: response.error,
  });

  return thenableBuilder;
}

/**
 * Creates a mock Supabase client with configurable responses per table/operation.
 *
 * Usage:
 * ```ts
 * const mock = createSupabaseMock({
 *   payables: {
 *     select: { data: [createPayable()], error: null },
 *     insert: { data: [createPayable()], error: null },
 *   },
 * });
 *
 * vi.mock('@/integrations/supabase/client', () => ({ supabase: mock }));
 * ```
 */
export function createSupabaseMock(tables: Record<string, TableConfig> = {}) {
  const rpcResponses: Record<string, MockResponse> = {};

  return {
    from: vi.fn().mockImplementation((tableName: string) => {
      const config = tables[tableName] || {};
      const defaultResponse: MockResponse = { data: [], error: null };

      return {
        select: vi.fn().mockReturnValue(
          createChainBuilder(config.select ?? defaultResponse)
        ),
        insert: vi.fn().mockReturnValue(
          createChainBuilder(config.insert ?? defaultResponse)
        ),
        update: vi.fn().mockReturnValue(
          createChainBuilder(config.update ?? defaultResponse)
        ),
        delete: vi.fn().mockReturnValue(
          createChainBuilder(config.delete ?? defaultResponse)
        ),
        upsert: vi.fn().mockReturnValue(
          createChainBuilder(config.upsert ?? defaultResponse)
        ),
      };
    }),
    rpc: vi.fn().mockImplementation((fnName: string) => {
      const response = rpcResponses[fnName] ?? { data: null, error: null };
      return Promise.resolve(response);
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    }),
    _setRpcResponse(fnName: string, response: MockResponse) {
      rpcResponses[fnName] = response;
    },
  };
}

/**
 * Default no-op Supabase mock for vi.mock.
 * Returns empty arrays for all queries with no errors.
 */
export function getDefaultSupabaseMock() {
  return createSupabaseMock();
}
