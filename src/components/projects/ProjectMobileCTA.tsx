import { Phone, MessageCircle, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectMobileCTAProps {
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  startingPrice?: number | null;
  onRegisterClick: () => void;
}

export function ProjectMobileCTA({ 
  projectName, 
  status, 
  startingPrice,
  onRegisterClick 
}: ProjectMobileCTAProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchWhatsappNumber = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      
      if (data?.value) {
        setWhatsappNumber(String(data.value).replace(/"/g, ""));
      }
    };
    fetchWhatsappNumber();
  }, []);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `From $${(price / 1000000).toFixed(1)}M`;
    }
    return `From $${(price / 1000).toFixed(0)}K`;
  };

  const getButtonContent = () => {
    return { text: "Get Pricing", icon: <Download className="h-4 w-4" /> };
  };

  const buttonContent = getButtonContent();
  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in ${projectName}. Can you send me more information?`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      
      {/* Fixed CTA bar - Portal-like rendering at viewport bottom */}
      <div 
        className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          isolation: 'isolate',
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      >
        <div className="bg-background/98 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          {/* Safe area padding for iPhone notch */}
          <div className="px-4 py-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            {/* Action Buttons - minimum 48px height for thumb-friendly targets */}
            <div className="flex items-center gap-3">
              {/* Phone Button - 48x48 minimum */}
              <Button 
                variant="outline" 
                size="icon"
                className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl touch-active"
                asChild
              >
                <a href="tel:+16722581100" aria-label="Call agent">
                  <Phone className="h-5 w-5" />
                </a>
              </Button>

              {/* WhatsApp Button - 48x48 minimum */}
              {whatsappLink && (
                <Button 
                  variant="outline" 
                  size="icon"
                  className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 touch-active"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              )}

              {/* Primary CTA - Large, thumb-friendly, always visible */}
              <Button 
                size="lg"
                className="flex-1 h-14 min-h-[56px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background touch-active"
                onClick={onRegisterClick}
              >
                {buttonContent.icon}
                <span>{buttonContent.text}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
