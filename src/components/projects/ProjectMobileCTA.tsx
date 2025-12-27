import { Phone, MessageCircle, Sparkles, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectMobileCTAProps {
  projectName: string;
  status: "coming_soon" | "active" | "sold_out";
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
    switch (status) {
      case "coming_soon":
        return { 
          text: "Get VIP Access", 
          icon: <Sparkles className="h-4 w-4" />,
          urgency: "Limited spots available"
        };
      case "active":
        return { 
          text: "Get Pricing & Plans", 
          icon: <TrendingUp className="h-4 w-4" />,
          urgency: "Units selling fast"
        };
      default:
        return { 
          text: "Join Waitlist", 
          icon: <Clock className="h-4 w-4" />,
          urgency: "Be first to know"
        };
    }
  };

  const buttonContent = getButtonContent();
  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in ${projectName}. Can you send me more information?`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
      {/* Safe area padding for iPhone notch */}
      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Compact header with price and urgency */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="min-w-0 flex-1">
            {startingPrice ? (
              <p className="text-lg font-bold text-foreground">
                {formatPrice(startingPrice)}
              </p>
            ) : (
              <p className="text-base font-semibold text-foreground">
                {status === "coming_soon" ? "Coming Soon" : status === "active" ? "Now Selling" : "Sold Out"}
              </p>
            )}
          </div>
          {/* Urgency indicator */}
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {buttonContent.urgency}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Phone Button */}
          <Button 
            variant="outline" 
            size="icon"
            className="shrink-0 h-12 w-12 rounded-xl border-border/50"
            asChild
          >
            <a href="tel:+16722581100" aria-label="Call agent">
              <Phone className="h-5 w-5" />
            </a>
          </Button>

          {/* WhatsApp Button */}
          {whatsappLink && (
            <Button 
              variant="outline" 
              size="icon"
              className="shrink-0 h-12 w-12 rounded-xl text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              asChild
            >
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                <MessageCircle className="h-5 w-5" />
              </a>
            </Button>
          )}

          {/* Primary CTA - Enhanced for conversion */}
          <Button 
            size="lg"
            className="flex-1 h-12 rounded-xl font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow"
            onClick={onRegisterClick}
          >
            {buttonContent.icon}
            <span>{buttonContent.text}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
