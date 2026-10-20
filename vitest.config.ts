import { defineConfig } from "vitest/config";

/** Vitest runs unit and integration tests only (Playwright runs e2e). */
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts"], // only starts the server, covered by e2e
      reporter: ["text", "html"],
    },
  },
});