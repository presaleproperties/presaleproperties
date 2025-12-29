import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function FloatingWhatsApp() {
  const [whatsappNumber, setWhatsappNumber] = useState<string>("16722581100");

  useEffect(() => {
    const fetchWhatsapp = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (data?.value) setWhatsappNumber(data.value as string);
    };
    fetchWhatsapp();
  }, []);

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi! I'm interested in learning about presale projects. Can you help me?")}`;

  const handleClick = () => {
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
      className="fixed bottom-20 right-3 md:right-4 lg:right-6 z-50 h-11 w-11 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
      
      {/* Tooltip on desktop */}
      <span className="hidden lg:block absolute right-16 bg-foreground text-background text-sm font-medium px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat with us
      </span>
    </button>
  );
}
