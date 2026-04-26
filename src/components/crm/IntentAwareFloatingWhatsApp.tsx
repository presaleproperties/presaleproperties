/**
 * IntentAwareFloatingWhatsApp — sitewide floating bubble.
 *
 * Renders nothing for anonymous or low-intent visitors. For hot leads with
 * an assigned agent, drops a fixed-position WhatsApp bubble in the bottom
 * right that opens a prefilled chat with their dedicated advisor, including
 * the current page context (project name when available).
 *
 * Mount once near the app root (e.g. inside <App /> alongside <Toaster />).
 */

import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCrmIdentity } from "@/hooks/useCrmIdentity";
import { getCurrentPageContext } from "@/lib/crm/pageContext";
import { trackCTAClick } from "@/lib/tracking";

const HIGH_INTENT_TAGS = new Set([
  "high_intent",
  "hot_lead",
  "vip",
  "vip_approved",
  "ready_to_buy",
]);
const HIGH_INTENT_STAGES = new Set(["opportunity", "sql", "customer", "vip"]);

const DISMISS_KEY = "pp_intent_wa_dismissed";

export function IntentAwareFloatingWhatsApp() {
  const { identity, loading } = useCrmIdentity();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  // Hide on the pitch deck (it has its own dedicated WhatsApp widget)
  const [path, setPath] = useState<string>(() =>
    typeof window === "undefined" ? "" : window.location.pathname
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (loading || dismissed) return null;
  if (!identity?.known || !identity.assigned_agent?.phone) return null;
  if (path.startsWith("/deck/")) return null;

  const isHot =
    identity.hot_lead === true ||
    (identity.tags ?? []).some((t) => HIGH_INTENT_TAGS.has(t)) ||
    (identity.lifecycle_stage ? HIGH_INTENT_STAGES.has(identity.lifecycle_stage) : false);
  if (!isHot) return null;

  const agent = identity.assigned_agent;
  const firstName = agent.name.split(" ")[0];
  const ctx = getCurrentPageContext();
  const message = ctx.project_name
    ? `Hi ${firstName}, I'd like to chat about ${ctx.project_name}.`
    : `Hi ${firstName}, I have a quick question.`;
  const href = `https://wa.me/${agent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-[60] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ pointerEvents: "auto" }}
    >
      <div className="hidden sm:flex items-center gap-3 bg-card/95 backdrop-blur-sm border border-border rounded-full pl-3 pr-2 py-2 shadow-lg">
        {agent.photo_url ? (
          <img
            src={agent.photo_url}
            alt={agent.name}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-[#25D366]/50"
            loading="lazy"
          />
        ) : null}
        <div className="text-xs leading-tight">
          <p className="font-bold text-foreground">{firstName} is online</p>
          <p className="text-muted-foreground text-[10px]">Your dedicated advisor</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="h-6 w-6 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          trackCTAClick({
            cta_name: "intent_aware_floating_whatsapp",
            cta_location: "floating_bubble",
            destination_url: href,
          })
        }
        aria-label={`WhatsApp ${firstName} directly`}
        className="h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5a] text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
