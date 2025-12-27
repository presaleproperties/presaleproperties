import { Phone, MessageCircle, Download, Send } from "lucide-react";
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
    return { text: "Get Pricing", icon: <Download className="h-4 w-4" /> };
  };

  const buttonContent = getButtonContent();
  const whatsappMessage = encodeURIComponent(`Hi! I'm interested in ${projectName}. Can you send me more information?`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      {/* Safe area padding for iPhone notch */}
      <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {/* Price/Status Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{projectName}</p>
            {startingPrice ? (
              <p className="text-base font-bold text-primary">
                {formatPrice(startingPrice)}
              </p>
            ) : (
              <p className="text-sm font-semibold text-foreground">
                {status === "coming_soon" ? "Coming Soon" : status === "active" ? "Now Selling" : "Sold Out"}
              </p>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Phone Button */}
          <Button 
            variant="outline" 
            size="icon"
            className="shrink-0 h-12 w-12 rounded-xl"
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

          {/* Primary CTA */}
          <Button 
            size="lg"
            className="flex-1 h-12 rounded-xl font-semibold gap-2"
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
