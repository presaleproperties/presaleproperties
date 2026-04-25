import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PHONE_RAW = "+16722581100"; // (672) 258-1100
const DEFAULT_MSG =
  "Hi! I have a question about Metro Vancouver presales — can you help?";

const HIDE_PATHS = [
  "/admin",
  "/dashboard",
  "/developer",
  "/buyer/",
  "/login",
  "/auth",
  "/deck/",
];

export function WhatsAppBubble() {
  const [visible, setVisible] = useState(true);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [pathHidden, setPathHidden] = useState(false);

  useEffect(() => {
    const check = () => {
      const path = window.location.pathname;
      setPathHidden(HIDE_PATHS.some((p) => path.startsWith(p)));
    };
    check();
    window.addEventListener("popstate", check);
    // Also re-check on click navigation (SPA)
    const interval = setInterval(check, 1500);
    return () => {
      window.removeEventListener("popstate", check);
      clearInterval(interval);
    };
  }, []);

  // Show tooltip 6s after first mount, then hide after 8s
  useEffect(() => {
    const seen = sessionStorage.getItem("wa_bubble_seen");
    if (seen) return;
    const t1 = setTimeout(() => setTooltipOpen(true), 6000);
    const t2 = setTimeout(() => {
      setTooltipOpen(false);
      sessionStorage.setItem("wa_bubble_seen", "1");
    }, 14000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible || pathHidden) return null;

  const waUrl = `https://wa.me/${PHONE_RAW.replace(
    /\D/g,
    ""
  )}?text=${encodeURIComponent(DEFAULT_MSG)}`;

  return (
    <div
      className={cn(
        // Lifted higher on mobile so it never sits over the hero card's
        // inline CTAs (Floor Plans / Details) or the city pills strip.
        "fixed z-[60] bottom-24 right-3 sm:bottom-6 sm:right-6",
        "flex flex-col items-end gap-2"
      )}
    >
      {/* Tooltip / hint */}
      {tooltipOpen && (
        <div className="relative max-w-[240px] rounded-2xl bg-card border border-border shadow-xl p-3 pr-7 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              setTooltipOpen(false);
              sessionStorage.setItem("wa_bubble_seen", "1");
            }}
            className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
          <p className="text-xs font-semibold text-foreground leading-snug">
            Have a question?
          </p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            Text us on WhatsApp — we usually reply within minutes.
          </p>
          {/* arrow */}
          <span className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 bg-card border-r border-b border-border" />
        </div>
      )}

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        onClick={() => sessionStorage.setItem("wa_bubble_seen", "1")}
        className={cn(
          "group relative h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center",
          "bg-[#25D366] text-white shadow-[0_8px_28px_-4px_rgba(37,211,102,0.55)]",
          "hover:scale-105 active:scale-95 transition-transform",
          "ring-4 ring-[#25D366]/15"
        )}
      >
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping opacity-60" />
        <MessageCircle className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" strokeWidth={2.2} fill="currentColor" fillOpacity={0.05} />
      </a>
    </div>
  );
}
