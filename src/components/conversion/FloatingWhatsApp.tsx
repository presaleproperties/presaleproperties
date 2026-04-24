import { MessageCircle } from "lucide-react";
import { trackCTAClick } from "@/hooks/useLoftyTracking";
import { useAppSetting } from "@/hooks/useAppSetting";

export function FloatingWhatsApp() {
  const { data: whatsappNumber } = useAppSetting("whatsapp_number");
  const number = (whatsappNumber as string) || "16722581100";

  const whatsappLink = `https://wa.me/${number}?text=${encodeURIComponent("Hi! I'm interested in learning about presale projects. Can you help me?")}`;

  const handleClick = () => {
    // Track Lofty CTA click
    trackCTAClick({
      cta_type: "whatsapp_click",
      cta_label: "Chat on WhatsApp",
      cta_location: "floating_button",
    });

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "click_whatsapp_float", {
        page_path: window.location.pathname,
        source: "floating_button",
      });
    }
    window.open(whatsappLink, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-on-dark shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
      
      {/* Tooltip on desktop */}
      <span className="hidden lg:block absolute right-16 bg-foreground text-background text-sm font-medium px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with us
      </span>
    </button>
  );
}
