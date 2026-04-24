import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stabilizePage } from "./helpers";

/**
 * Admin pages — theme & styling regression.
 *
 * Reuses the storage state created by `global-setup.ts`. If the auth file is
 * empty (no VR_ADMIN_EMAIL/VR_ADMIN_PASSWORD configured) the entire suite is
 * skipped so local dev without admin creds isn't blocked.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_FILE = path.join(__dirname, ".auth", "admin.json");

let hasAuth = false;
try {
  const raw = fs.readFileSync(AUTH_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  hasAuth = (parsed.cookies?.length ?? 0) > 0 || (parsed.origins?.length ?? 0) > 0;
} catch {
  hasAuth = false;
}

test.skip(!hasAuth, "Admin auth state missing — set VR_ADMIN_EMAIL & VR_ADMIN_PASSWORD");

test.use({ storageState: AUTH_FILE });

const ADMIN_PAGES: Array<{ path: string; name: string }> = [
  { path: "/admin", name: "admin-overview" },
  { path: "/admin/leads", name: "admin-leads" },
  { path: "/admin/blogs", name: "admin-blogs" },
];

for (const { path: route, name } of ADMIN_PAGES) {
  test(`admin: ${name}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await stabilizePage(page);

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
    });
  });
}
