/**
 * Returns a shareable URL for the current page (or a custom path) that
 * social media crawlers (iMessage, WhatsApp, Slack, Facebook, Twitter,
 * LinkedIn, etc.) will read with per-page Open Graph metadata.
 *
 * Behind the scenes this routes through the `og-preview` edge function:
 *   - Crawlers receive HTML with the right title/description/image
 *   - Real users get a 302 redirect to the actual page
 *
 * Falls back to the raw site URL if the project ID isn't configured.
 */
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SITE_ORIGIN = "https://presaleproperties.com";

export interface ShareUrlOptions {
  /** Force the edge function to skip its cache (admin "republish" flow). */
  fresh?: boolean;
  /** Append a cache-buster (e.g. resource updated_at) so social platforms re-scrape. */
  version?: string | number;
}

export function getShareableUrl(path?: string, opts: ShareUrlOptions = {}): string {
  const targetPath = path ?? `${window.location.pathname}${window.location.search}`;
  const direct = `${SITE_ORIGIN}${targetPath}`;
  if (!PROJECT_ID) return direct;
  const params = new URLSearchParams({ path: targetPath });
  if (opts.fresh) params.set("fresh", "1");
  if (opts.version != null) params.set("v", String(opts.version));
  return `https://${PROJECT_ID}.supabase.co/functions/v1/og-preview?${params.toString()}`;
}

/**
 * Copy the shareable URL for the current page to the clipboard.
 * Returns true on success.
 */
export async function copyShareableUrl(path?: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getShareableUrl(path));
    return true;
  } catch {
    return false;
  }
}

/**
 * Trigger the native share sheet (iOS / Android) with the shareable URL.
 * Falls back to clipboard copy on desktop browsers without Web Share API.
 */
export async function shareCurrentPage(opts?: {
  title?: string;
  text?: string;
  path?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const url = getShareableUrl(opts?.path);
  const data = {
    title: opts?.title ?? document.title,
    text: opts?.text,
    url,
  };
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err: any) {
      if (err?.name === "AbortError") return "failed";
      // fall through to clipboard
    }
  }
  const ok = await copyShareableUrl(opts?.path);
  return ok ? "copied" : "failed";
}
