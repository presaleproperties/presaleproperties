import { test, expect } from "@playwright/test";
import { stabilizePage } from "./helpers";

/**
 * Public marketing pages — theme & styling regression.
 *
 * Each page is captured full-page across 3 viewports (mobile/tablet/desktop)
 * defined in playwright.config.ts. Snapshots are filed per-project, so a
 * homepage produces 3 baselines: home-mobile.png, home-tablet.png,
 * home-desktop.png. A diff in any of them fails CI.
 */
const PUBLIC_PAGES: Array<{ path: string; name: string }> = [
  { path: "/", name: "home" },
  { path: "/about", name: "about" },
  { path: "/blog", name: "blog" },
  { path: "/presale-projects", name: "presale-projects" },
  { path: "/contact", name: "contact" },
];

for (const { path, name } of PUBLIC_PAGES) {
  test(`public: ${name}`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await stabilizePage(page);

    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
    });
  });
}
