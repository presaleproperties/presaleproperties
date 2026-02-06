import { Phone, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MobileCTABarProps {
  price: string;
  projectName?: string;
  onContactClick: () => void;
  phoneNumber?: string;
}

export function MobileCTABar({ price, projectName, onContactClick, phoneNumber }: MobileCTABarProps) {
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

  const whatsappMessage = encodeURIComponent(
    projectName 
      ? `Hi! I'm interested in the ${projectName} assignment listed at ${price}. Is it still available?`
      : `Hi! I'm interested in this assignment listed at ${price}. Is it still available?`
  );
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}` : null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div className="h-28 lg:hidden" aria-hidden="true" />
      
      {/* Fixed CTA bar */}
      <div 
        className="lg:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          isolation: 'isolate',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform',
          contentVisibility: 'auto',
          containIntrinsicSize: '0 auto',
        }}
      >
        <div className="bg-background/98 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          {/* Safe area padding for iPhone notch */}
          <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {/* Price Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">Assignment Price</p>
                <p className="text-lg font-bold text-primary truncate">{price}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Phone Button */}
              {phoneNumber && (
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="shrink-0 h-12 w-12 rounded-xl"
                  asChild
                >
                  <a href={`tel:${phoneNumber}`} aria-label="Call agent">
                    <Phone className="h-5 w-5" />
                  </a>
                </Button>
              )}

              {/* WhatsApp Button */}
              {whatsappLink && (
                <Button 
                  size="icon" 
                  variant="outline" 
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
                onClick={onContactClick} 
                className="flex-1 h-12 rounded-xl font-semibold gap-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Info</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
