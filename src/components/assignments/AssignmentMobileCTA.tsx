import { Phone, MessageCircle, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentMobileCTAProps {
  projectName: string;
  price: string;
  onInquireClick: () => void;
  agentName?: string;
}

export function AssignmentMobileCTA({ projectName, price, onInquireClick, agentName }: AssignmentMobileCTAProps) {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "whatsapp_number").maybeSingle()
      .then(({ data }) => { if (data?.value) setWhatsappNumber(String(data.value).replace(/"/g, "")); });
  }, []);

  useEffect(() => {
    const handleGalleryOpen = () => setIsHidden(true);
    const handleGalleryClose = () => setIsHidden(false);
    window.addEventListener("gallery-opened", handleGalleryOpen);
    window.addEventListener("gallery-closed", handleGalleryClose);
    return () => {
      window.removeEventListener("gallery-opened", handleGalleryOpen);
      window.removeEventListener("gallery-closed", handleGalleryClose);
    };
  }, []);

  const whatsappMsg = encodeURIComponent(`Hi! I'm interested in the assignment at "${projectName}".`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : null;

  return (
    <>
      {/* Spacer so content isn't hidden behind the fixed bar */}
      <div className="h-24 lg:hidden" aria-hidden="true" />

      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 transition-transform duration-200 ${isHidden ? "translate-y-full" : "translate-y-0"}`}
        style={{ zIndex: 99999, isolation: "isolate", willChange: "transform", pointerEvents: "auto", width: "100%" }}
      >
        <div className="bg-background border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.2)]">
          {/* Price hint row */}
          <div className="px-4 pt-2.5 pb-1 flex items-baseline justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Assignment</span>
              <p className="text-lg font-bold text-foreground leading-tight">{price}</p>
            </div>
            <span className="text-xs text-muted-foreground">{projectName}</span>
          </div>

          <div className="pb-3 bg-background"
            style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 16px))", paddingRight: "max(16px, env(safe-area-inset-right, 16px))", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl" asChild>
                <a href="tel:+16722581100" aria-label="Call agent"><Phone className="h-5 w-5" /></a>
              </Button>
              {whatsappLink && (
                <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl text-primary border-border hover:bg-accent" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><MessageCircle className="h-5 w-5" /></a>
                </Button>
              )}
              <Button size="lg" className="flex-1 h-14 min-h-[56px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background"
                onClick={onInquireClick}>
                <MessageSquare className="h-4 w-4" />
                <span>{agentName ? `Contact ${agentName.split(" ")[0]}` : "Inquire Now"}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
