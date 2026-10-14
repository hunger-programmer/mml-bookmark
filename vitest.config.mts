import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// Unit tests live next to the code (`*.test.ts(x)`). Coverage must stay at 100%.
// Integration tests are a separate package: packages/integration.
export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@": fromRoot("./packages/app/src"),
      // `server-only` throws outside a React Server environment; unit tests run in plain Node.
      "server-only": fromRoot("./vitest.server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["packages/*/src/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "packages/integration/**"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.{ts,tsx}"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts", "packages/integration/**"],
      reporter: ["text", "lcov", "json-summary"],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
