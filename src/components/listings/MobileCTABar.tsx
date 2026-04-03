import { MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAppSetting } from "@/hooks/useAppSetting";

interface MobileCTABarProps {
  price: string;
  projectName?: string;
  onContactClick: () => void;
  phoneNumber?: string;
}

export function MobileCTABar({ price, projectName, onContactClick, phoneNumber }: MobileCTABarProps) {
  const { data: whatsappSetting } = useAppSetting("whatsapp_number");
  const whatsappNumber = whatsappSetting ? String(whatsappSetting).replace(/"/g, "") : null;
  const [isHidden, setIsHidden] = useState(false);

  // Hide when gallery is open
  useEffect(() => {
    const show = () => setIsHidden(false);
    const hide = () => setIsHidden(true);
    window.addEventListener("gallery-opened", hide);
    window.addEventListener("gallery-closed", show);
    return () => {
      window.removeEventListener("gallery-opened", hide);
      window.removeEventListener("gallery-closed", show);
    };
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
        className={`lg:hidden transition-transform duration-200 ${isHidden ? 'translate-y-full' : 'translate-y-0'}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          isolation: 'isolate',
          willChange: 'transform',
        }}
      >
        <div className="bg-background/98 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]">
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
              {/* WhatsApp Button */}
              {whatsappLink && (
                <Button 
                  variant="outline" 
                  className="shrink-0 h-12 rounded-xl text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/10 hover:text-[#128C7E] font-semibold gap-2 px-5"
                  asChild
                >
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                    <MessageCircle className="h-5 w-5" />
                    <span>WhatsApp</span>
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
