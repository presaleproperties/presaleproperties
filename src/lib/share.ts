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
import { supabase } from "@/integrations/supabase/client";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const SITE_ORIGIN = "https://presaleproperties.com";

// ─── Share tracking ──────────────────────────────────────────
// Best-effort, fire-and-forget. Never throw — sharing must succeed even if
// analytics fails. Reads visitor_id from localStorage if our analytics
// layer has set one; falls back to anonymous.

function inferResource(path: string): { resource_type: string | null; resource_slug: string | null } {
  const seg = path.replace(/^\/+|\/+$/g, "").split("/");
  if (!seg[0]) return { resource_type: "home", resource_slug: null };
  const map: Record<string, string> = {
    "presale-projects": "project",
    projects: "project",
    listings: "listing",
    resale: "listing",
    blog: "blog_post",
    deck: "pitch_deck",
    developers: "developer",
  };
  const t = map[seg[0]];
  if (t && seg[1]) return { resource_type: t, resource_slug: seg[1] };
  return { resource_type: seg[0], resource_slug: seg[1] ?? null };
}

export async function trackShareEvent(
  path: string,
  platform: string,
): Promise<void> {
  try {
    const { resource_type, resource_slug } = inferResource(path);
    let visitor_id: string | null = null;
    try {
      visitor_id = localStorage.getItem("pp_visitor_id");
    } catch {
      // ignore — private mode etc.
    }
    await supabase.from("share_events").insert({
      event_type: "share",
      path,
      platform,
      resource_type,
      resource_slug,
      visitor_id,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
    });
  } catch {
    // swallow — never break the share UX
  }
}

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
    const targetPath = path ?? `${window.location.pathname}${window.location.search}`;
    await navigator.clipboard.writeText(getShareableUrl(targetPath));
    void trackShareEvent(targetPath, "copy_link");
    return true;
  } catch {
    return false;
  }
}

/**
 * Trigger the native share sheet (iOS / Android) with the shareable URL.
 *
 * IMPORTANT: We hand the OS the *real* site URL (presaleproperties.com/...) so
 * the share sheet shows our domain + favicon — not the bare supabase.co host.
 * For social-media unfurls (iMessage, WhatsApp, Slack, FB, etc.) the recipient's
 * client fetches the URL with a crawler User-Agent; that path is already handled
 * by our Cloudflare/edge OG layer and falls back to the per-page Helmet tags
 * baked in by the SPA's prerendered index.
 *
 * If you specifically need the edge-function URL (e.g. for the admin verifier
 * page), call `getShareableUrl()` directly.
 *
 * Falls back to clipboard copy on desktop browsers without Web Share API.
 */
export async function shareCurrentPage(opts?: {
  title?: string;
  text?: string;
  path?: string;
}): Promise<"shared" | "copied" | "failed"> {
  const targetPath = opts?.path ?? `${window.location.pathname}${window.location.search}`;
  const url = `${SITE_ORIGIN}${targetPath}`;
  const data = {
    title: opts?.title ?? document.title,
    text: opts?.text,
    url,
  };
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(data);
      void trackShareEvent(targetPath, "native_share");
      return "shared";
    } catch (err: any) {
      if (err?.name === "AbortError") return "failed";
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    void trackShareEvent(targetPath, "clipboard_fallback");
    return "copied";
  } catch {
    return "failed";
  }
}
