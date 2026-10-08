import "@testing-library/jest-dom/vitest";
import { vi, beforeAll, afterEach, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";
import { resetNavigationMocks } from "./render";

// ═══════════════════════════════════════════════════════════════
// MSW Server Lifecycle
// ═══════════════════════════════════════════════════════════════
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetNavigationMocks();
});

afterAll(() => {
  server.close();
});

// ═══════════════════════════════════════════════════════════════
// Browser API Mocks
// ═══════════════════════════════════════════════════════════════

// Mock ResizeObserver (required by Radix UI dialogs)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver (required by @tanstack/react-virtual)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
  takeRecords: vi.fn().mockReturnValue([]),
}));

// Mock matchMedia (required by next-themes/ThemeContext)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo (used by various scroll components)
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
