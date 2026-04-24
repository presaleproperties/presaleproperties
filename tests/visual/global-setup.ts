/**
 * Global setup — sign in as an admin once and persist the session
 * to `tests/visual/.auth/admin.json`. The admin spec then loads it via
 * `storageState` so every test starts logged in (no per-test login flow).
 *
 * Required env vars (skip admin specs gracefully if missing):
 *   VR_ADMIN_EMAIL    — test admin account email
 *   VR_ADMIN_PASSWORD — test admin account password
 *
 * These should NOT be committed. Set them locally in `.env.local` (gitignored)
 * or in CI secrets.
 */
import { chromium, type FullConfig } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const AUTH_DIR = path.join(__dirname, ".auth");
const AUTH_FILE = path.join(AUTH_DIR, "admin.json");

export default async function globalSetup(config: FullConfig) {
  const email = process.env.VR_ADMIN_EMAIL;
  const password = process.env.VR_ADMIN_PASSWORD;

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  if (!email || !password) {
    // No creds → write an empty storage state so admin specs auto-skip.
    fs.writeFileSync(
      AUTH_FILE,
      JSON.stringify({ cookies: [], origins: [] }, null, 2),
    );
    console.warn(
      "[visual setup] VR_ADMIN_EMAIL / VR_ADMIN_PASSWORD not set — admin specs will be skipped.",
    );
    return;
  }

  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:8080";
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto("/admin/login", { waitUntil: "networkidle" });

  // Adjust selectors if the AdminLogin form fields change
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for redirect away from /admin/login
  await page.waitForURL((url) => !url.pathname.endsWith("/admin/login"), {
    timeout: 20_000,
  });

  await context.storageState({ path: AUTH_FILE });
  await browser.close();
}
