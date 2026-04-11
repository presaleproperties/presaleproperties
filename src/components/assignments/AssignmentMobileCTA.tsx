import { Phone, MessageCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AssignmentMobileCTAProps {
  projectName: string;
  price: string;
  onInquireClick: () => void;
  agentName?: string;
  agentPhone?: string;
  floorPlanUrl?: string | null;
  brochureUrl?: string | null;
}

export function AssignmentMobileCTA({ projectName, price, onInquireClick, agentName, agentPhone, floorPlanUrl, brochureUrl }: AssignmentMobileCTAProps) {
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

  const phoneNumber = agentPhone || "+16722581100";
  const whatsappMsg = encodeURIComponent(`Hi! I'm interested in the assignment at "${projectName}".`);
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${whatsappMsg}` : null;

  // Determine the primary CTA — floor plan download if available, otherwise WhatsApp/contact
  const hasDocuments = floorPlanUrl || brochureUrl;
  const primaryDoc = floorPlanUrl || brochureUrl;
  const primaryLabel = floorPlanUrl ? "Get Floor Plans" : "Get Brochure";

  return (
    <>
      <div className="h-20 lg:hidden" aria-hidden="true" />

      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 transition-transform duration-200 ${isHidden ? "translate-y-full" : "translate-y-0"}`}
        style={{ zIndex: 99999, isolation: "isolate", willChange: "transform", pointerEvents: "auto", width: "100%" }}
      >
        <div className="bg-background border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          <div className="px-4 py-3"
            style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" }}>
            <div className="flex items-center gap-2">
              {/* Phone button */}
              <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl" asChild>
                <a href={`tel:${phoneNumber}`} aria-label="Call Agent">
                  <Phone className="h-5 w-5" />
                </a>
              </Button>

              {/* WhatsApp / Message button */}
              {whatsappLink ? (
                <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 min-w-[48px] min-h-[48px] rounded-xl" onClick={onInquireClick}>
                  <MessageCircle className="h-5 w-5" />
                </Button>
              )}

              {/* Primary CTA — Get Floor Plans or Contact */}
              {hasDocuments && primaryDoc ? (
                <Button size="lg" className="flex-1 h-12 min-h-[48px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background" asChild>
                  <a href={primaryDoc} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-5 w-5" />
                    <span>{primaryLabel}</span>
                  </a>
                </Button>
              ) : (
                <Button size="lg" className="flex-1 h-12 min-h-[48px] rounded-xl font-semibold text-base gap-2 bg-foreground hover:bg-foreground/90 text-background"
                  onClick={onInquireClick}>
                  <MessageCircle className="h-4 w-4" />
                  <span>{agentName ? `Contact ${agentName.split(" ")[0]}` : "Inquire Now"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
