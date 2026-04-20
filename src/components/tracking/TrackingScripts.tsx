/**
 * TrackingScripts
 *
 * Unified loader for marketing/analytics tags. Reads all IDs from
 * the `app_settings` table and injects each script into the document
 * exactly once. Safe to mount multiple times — guards prevent dupes.
 *
 * Supported keys (all optional, populated manually in Supabase Studio):
 *   - gtm_container_id      → Google Tag Manager (GTM-XXXX)
 *   - ga4_measurement_id    → GA4 (G-XXXX) — skipped if GTM is active
 *   - meta_pixel_id         → Meta/Facebook Pixel
 *   - clarity_project_id    → Microsoft Clarity
 *   - tiktok_pixel_id       → TikTok Pixel
 *
 * No IDs are hardcoded. SSR-safe (guards window/document).
 */
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SettingsMap = {
  gtm_container_id?: string;
  ga4_measurement_id?: string;
  meta_pixel_id?: string;
  clarity_project_id?: string;
  tiktok_pixel_id?: string;
};

const KEYS = [
  "gtm_container_id",
  "ga4_measurement_id",
  "meta_pixel_id",
  "clarity_project_id",
  "tiktok_pixel_id",
] as const;

// Module-level guard so scripts only ever load once per page lifetime
const loaded = {
  gtm: false,
  ga4: false,
  meta: false,
  clarity: false,
  tiktok: false,
};

function asString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

// ---------- GTM ----------
function injectGTM(containerId: string) {
  if (loaded.gtm) return;
  if (document.querySelector(`script[data-gtm="${containerId}"]`)) {
    loaded.gtm = true;
    return;
  }

  // Head snippet
  const s = document.createElement("script");
  s.dataset.gtm = containerId;
  s.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`;
  document.head.appendChild(s);

  // Body noscript fallback
  const ns = document.createElement("noscript");
  ns.dataset.gtm = containerId;
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  ns.appendChild(iframe);
  document.body.insertBefore(ns, document.body.firstChild);

  loaded.gtm = true;
}

// ---------- GA4 (only when GTM not present) ----------
function injectGA4(measurementId: string) {
  if (loaded.ga4) return;
  if (document.querySelector(`script[src*="${measurementId}"]`)) {
    loaded.ga4 = true;
    return;
  }
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);

  const inline = document.createElement("script");
  inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`;
  document.head.appendChild(inline);

  loaded.ga4 = true;
}

// ---------- Meta Pixel ----------
function injectMetaPixel(pixelId: string) {
  if (loaded.meta) return;
  const w = window as unknown as { fbq?: any; _fbq?: any };
  if (!w.fbq) {
    const n: any = function () {
      // eslint-disable-next-line prefer-rest-params
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    w.fbq = n;

    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  w.fbq?.("init", pixelId);
  w.fbq?.("track", "PageView");
  loaded.meta = true;
}

// ---------- Microsoft Clarity ----------
function injectClarity(projectId: string) {
  if (loaded.clarity) return;
  if (document.querySelector(`script[data-clarity="${projectId}"]`)) {
    loaded.clarity = true;
    return;
  }
  const s = document.createElement("script");
  s.dataset.clarity = projectId;
  s.innerHTML = `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${projectId}");`;
  document.head.appendChild(s);
  loaded.clarity = true;
}

// ---------- TikTok Pixel ----------
function injectTikTok(pixelId: string) {
  if (loaded.tiktok) return;
  if (document.querySelector(`script[data-ttq="${pixelId}"]`)) {
    loaded.tiktok = true;
    return;
  }
  const s = document.createElement("script");
  s.dataset.ttq = pixelId;
  s.innerHTML = `!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
ttq.load('${pixelId}');
ttq.page();
}(window, document, 'ttq');`;
  document.head.appendChild(s);
  loaded.tiktok = true;
}

export function TrackingScripts() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", KEYS as unknown as string[]);

      if (cancelled || error || !data) return;

      const map: SettingsMap = {};
      for (const row of data) {
        const v = asString((row as { key: string; value: unknown }).value);
        if (v) (map as Record<string, string>)[(row as { key: string }).key] = v;
      }

      if (map.gtm_container_id) injectGTM(map.gtm_container_id);

      // Skip standalone GA4 if GTM is active — load GA4 through GTM instead
      if (map.ga4_measurement_id && !map.gtm_container_id) {
        injectGA4(map.ga4_measurement_id);
      }

      if (map.meta_pixel_id) injectMetaPixel(map.meta_pixel_id);
      if (map.clarity_project_id) injectClarity(map.clarity_project_id);
      if (map.tiktok_pixel_id) injectTikTok(map.tiktok_pixel_id);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
