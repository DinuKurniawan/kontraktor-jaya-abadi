import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  testDir: __dirname,
  testMatch: "**/*.spec.ts",
  outputDir: path.join(repoRoot, "test-results", "e2e"),
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: path.join(repoRoot, "playwright-report"), open: "never" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], browserName: "chromium", viewport: { width: 1440, height: 900 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Desktop Chrome"], browserName: "chromium", viewport: { width: 375, height: 812 }, isMobile: true },
    },
  ],
  webServer: [
    {
      command: "node scripts/test-server.mjs",
      cwd: repoRoot,
      url: "http://127.0.0.1:4001/api/health",
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: "npm --prefix client run dev -- --host 127.0.0.1 --port 5174",
      cwd: repoRoot,
      url: "http://127.0.0.1:5174",
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        ...process.env,
        NODE_ENV: "test",
        VITE_API_URL: "http://127.0.0.1:4001/api",
      },
    },
  ],
});
