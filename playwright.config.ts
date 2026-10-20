import { defineConfig } from "@playwright/test";

/** Playwright starts the app automatically and runs the e2e tests in Chromium. */
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3000", screenshot: "on" },
  webServer: {
    command: "npm start",
    url: "http://localhost:3000/api/routes",
    reuseExistingServer: false,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});