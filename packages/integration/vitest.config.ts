import { defineConfig } from "vitest/config";

// Integration tests: a real production build, a real PostgreSQL (testcontainers) and a real browser
// (agent-browser). Slow by nature, so they run in their own CI job and not with the unit tests.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./src/global-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 300_000,
    fileParallelism: false,
  },
});
