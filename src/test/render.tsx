import { vi } from 'vitest';
import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation for tests
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let currentPathname = "/";
let currentSearchParams = new URLSearchParams();

// These mocks are auto-applied via vi.mock in vitest setup
// If you need to customize per-test:
//   import { setTestPathname, setTestSearchParams, getMockRouter } from '@/test/render';
export function setTestPathname(path: string) {
  currentPathname = path;
}

export function setTestSearchParams(params: URLSearchParams | Record<string, string>) {
  currentSearchParams = params instanceof URLSearchParams ? params : new URLSearchParams(params);
}

export function getMockRouter() {
  return mockRouter;
}

// Reset mocks between tests
export function resetNavigationMocks() {
  currentPathname = "/";
  currentSearchParams = new URLSearchParams();
  Object.values(mockRouter).forEach((fn) => fn.mockReset());
}

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => currentPathname,
  useSearchParams: () => currentSearchParams,
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  queryClient?: QueryClient;
  initialRouterEntries?: string[];
}

function createWrapper({ queryClient, initialRouterEntries = ["/"] }: WrapperOptions = {}) {
  const client = queryClient ?? createTestQueryClient();

  // Set initial pathname from first entry
  if (initialRouterEntries[0]) {
    const url = new URL(initialRouterEntries[0], "http://localhost");
    currentPathname = url.pathname;
    currentSearchParams = url.searchParams;
  }

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    );
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  initialRouterEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  { queryClient, initialRouterEntries, ...renderOptions }: CustomRenderOptions = {}
) {
  const client = queryClient ?? createTestQueryClient();

  return {
    ...render(ui, {
      wrapper: createWrapper({ queryClient: client, initialRouterEntries }),
      ...renderOptions,
    }),
    queryClient: client,
  };
}

export { createTestQueryClient, createWrapper };
export { screen, waitFor, within, act } from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
