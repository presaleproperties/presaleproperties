import { useEffect } from "react";
import { Helmet } from "@/components/seo/Helmet";

const SITE_URL = "https://presaleproperties.com";
const SITE_NAME = "PresaleProperties.com";
const DEFAULT_OG_IMAGE = "https://presaleproperties.com/og-image.png";
const DEFAULT_LOCALE = "en_CA";

export interface MetaTagsProps {
  /** Page title — should be unique per route. Will be truncated to 60 chars for safety. */
  title: string;
  /** Meta description — should be unique per route. Will be truncated to 160 chars. */
  description: string;
  /** Absolute URL for og:url, twitter:url, and canonical. If relative, will be prefixed with the site URL. */
  url: string;
  /** Absolute https:// URL of the social share image (1200×630). Falls back to site default if missing/relative. */
  image?: string;
  /** og:type — defaults to "website". Use "article" for blog posts, etc. */
  type?: string;
  /** og:image dimensions — defaults to 1200×630. */
  imageWidth?: number;
  imageHeight?: number;
  /** Override og:site_name (rare). */
  siteName?: string;
  /** Override og:locale (rare). */
  locale?: string;
}

/**
 * Ensure URLs are absolute https:// — relative paths are prefixed with the site origin.
 * Returns the site URL if input is empty/invalid.
 */
function toAbsoluteUrl(input: string | undefined, fallback: string): string {
  if (!input) return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${SITE_URL}${trimmed}`;
  // Bare path
  return `${SITE_URL}/${trimmed}`;
}

function clamp(text: string, max: number): string {
  if (!text) return text;
  return text.length > max ? text.substring(0, max - 1).trimEnd() + "…" : text;
}

/**
 * <MetaTags /> — single source of truth for the per-route meta tag set.
 *
 * Outputs every required tag on every route:
 *   <title>, <meta name="description">, <link rel="canonical">,
 *   og:title/description/image/image:width/image:height/url/type/site_name/locale,
 *   twitter:card/title/description/image/url
 *
 * All og:image / og:url / canonical / twitter:url values are forced to absolute https:// URLs.
 * If `image` is missing, the site default OG image is used so unfurls always render.
 *
 * Use this on every public route. Page-specific extras (JSON-LD, geo tags, custom keywords,
 * etc.) can still be emitted via <Helmet> AFTER this component — later Helmet entries win.
 */
export function MetaTags({
  title,
  description,
  url,
  image,
  type = "website",
  imageWidth = 1200,
  imageHeight = 630,
  siteName = SITE_NAME,
  locale = DEFAULT_LOCALE,
}: MetaTagsProps) {
  const safeTitle = clamp(title, 60);
  const safeDescription = clamp(description, 160);
  const absoluteUrl = toAbsoluteUrl(url, SITE_URL);
  const absoluteImage = toAbsoluteUrl(image, DEFAULT_OG_IMAGE);

  // Dev-only verification log on every route mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!import.meta.env.DEV) return;
    // Defer to next tick so Helmet has flushed to <head>
    const id = window.setTimeout(() => {
      const ogImageEl = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
      // eslint-disable-next-line no-console
      console.log("[MetaTags]", {
        path: window.location.pathname,
        title: document.title,
        ogImage: ogImageEl?.content ?? null,
      });
    }, 0);
    return () => window.clearTimeout(id);
  }, [safeTitle, absoluteImage, absoluteUrl]);

  return (
    <Helmet>
      {/* Primary */}
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <link rel="canonical" href={absoluteUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:image:width" content={String(imageWidth)} />
      <meta property="og:image:height" content={String(imageHeight)} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:url" content={absoluteUrl} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
}

export default MetaTags;
