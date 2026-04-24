import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — visual regression for theme & styling integrity.
 *
 * Snapshots live under `tests/visual/__screenshots__/`.
 * Run modes:
 *   bun run test:visual           - run suite, fail on diff
 *   bun run test:visual:update    - regenerate baselines after intentional theme changes
 *   bun run test:visual:report    - open last HTML report
 *
 * To narrow scope while iterating:
 *   bunx playwright test tests/visual/public.spec.ts --project=desktop
 */
export default defineConfig({
  testDir: "./tests/visual",
  globalSetup: "./tests/visual/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],

  // Strict diffing — theme regressions are usually large; allow small AA differences
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 1% of pixels may differ (handles font AA/sub-pixel)
      animations: "disabled",
      caret: "hide",
      scale: "css",
    },
  },

  use: {
    baseURL: "http://localhost:8080",
    trace: "retain-on-failure",
    // Block fonts.googleapis fetch flake — we wait for fonts in the helper instead
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], viewport: { width: 375, height: 812 } },
    },
    {
      name: "tablet",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],

  webServer: {
    command: "bun run dev",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
