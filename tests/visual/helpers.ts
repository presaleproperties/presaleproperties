/**
 * Shared visual-test helpers
 * ─────────────────────────────────────────────────────────────────────────
 * stabilizePage(): silence the things that cause non-deterministic pixel
 * diffs — animations, image loading races, marquee carousels, network
 * spinners, and randomized greeting copy. Call this BEFORE every
 * `toHaveScreenshot` to keep baselines stable across runs.
 */
import type { Page } from "@playwright/test";

export async function stabilizePage(page: Page) {
  // Disable all CSS animations & transitions to remove sub-pixel jitter
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
      /* Hide elements that intentionally animate forever or pull live data */
      [data-vr-hide],
      .marquee,
      iframe[src*="google.com/maps"],
      [class*="animate-shimmer"],
      [class*="animate-glow-pulse"],
      [class*="animate-float"] {
        visibility: hidden !important;
      }
    `,
  });

  // Wait for web fonts so text isn't measured before Plus Jakarta Sans loads
  await page.evaluate(async () => {
    if ((document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }
  });

  // Wait for all images to finish (or fail) loading
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.addEventListener("load", res, { once: true });
              img.addEventListener("error", res, { once: true });
            }),
      ),
    );
  });

  // Settle any lazy-rendered content / scroll-reveals
  await page.waitForTimeout(300);
}
