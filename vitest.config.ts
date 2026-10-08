import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@shared": path.resolve(__dirname, "./src/components/shared"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/", "dist/", ".next/"],
    pool: "forks",
    testTimeout: 10_000,
    hookTimeout: 10_000,
    reporters: ["verbose"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/types/*",
        "src/integrations/supabase/types.ts",
        "app/**/*",
        "**/*.stories.*",
        "**/index.ts",
      ],
      // Start low — raise incrementally as tests are added
      // Target: branches 70, functions 70, lines 75, statements 75
      thresholds: {
        branches: 5,
        functions: 1,
        lines: 0.5,
        statements: 0.5,
      },
    },
  },
});
