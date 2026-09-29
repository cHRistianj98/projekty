import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    channel: "chrome",
    viewport: { width: 1536, height: 1024 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // Tests use an already running application; they never start another server.
});
