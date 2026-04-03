import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeckWhatsAppWidgetProps {
  projectName: string;
  contactName?: string;
  whatsappNumber: string;
}

export function DeckWhatsAppWidget({ projectName, contactName, whatsappNumber }: DeckWhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rawNumber = whatsappNumber.replace(/\D/g, "");
  const firstName = contactName?.split(" ")[0] || "there";
  const defaultMessage = `Hi ${firstName}! I just viewed the ${projectName} deck — I'm interested. Can we connect?`;

  const handleSend = () => {
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <>
      {/* Chat popup */}
      <div
        className={cn(
          "fixed z-[99998] transition-all duration-300 ease-out",
          "bottom-[88px] right-4 sm:bottom-24 sm:right-6",
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        )}
        style={{ maxWidth: "min(360px, calc(100vw - 2rem))" }}
      >
        <div className="rounded-2xl border border-border/60 bg-background shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3.5"
            style={{ background: "#25D366" }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {contactName || "Presale Properties"}
              </p>
              <p className="text-xs text-white/80">Typically replies instantly</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors touch-manipulation"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat body */}
          <div className="p-4 bg-[#ECE5DD] min-h-[100px]">
            {/* Incoming bubble */}
            <div className="max-w-[85%] bg-white rounded-xl rounded-tl-sm p-3 shadow-sm">
              <p className="text-sm text-foreground leading-relaxed">
                Hi! 👋 I see you're looking at <strong>{projectName}</strong>. I'd love to help — tap below to start a conversation!
              </p>
              <p className="text-[10px] text-muted-foreground/60 text-right mt-1">just now</p>
            </div>
          </div>

          {/* CTA */}
          <div className="p-3 border-t border-border/40 bg-background">
            <button
              onClick={handleSend}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm text-white touch-manipulation active:scale-[0.98] transition-transform"
              style={{ background: "#25D366" }}
            >
              <Send className="h-4 w-4" />
              Start Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "fixed z-[99999] flex items-center justify-center rounded-full shadow-xl touch-manipulation transition-all duration-200 active:scale-95",
          "w-14 h-14 sm:w-[60px] sm:h-[60px]",
          "bottom-4 right-4 sm:bottom-6 sm:right-6"
        )}
        style={{
          background: "#25D366",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 4px 24px rgba(37,211,102,0.4)",
        }}
        aria-label={isOpen ? "Close chat" : "Chat on WhatsApp"}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}

        {/* Notification dot */}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-background animate-pulse" />
        )}
      </button>
    </>
  );
}
