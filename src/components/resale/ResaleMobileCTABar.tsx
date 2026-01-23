import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, MessageCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ResaleScheduleForm } from "./ResaleScheduleForm";

interface ResaleMobileCTABarProps {
  listingId: string;
  listingAddress: string;
  listingCity: string;
  listingPrice?: number;
  formattedPrice?: string;
}

export const ResaleMobileCTABar = ({
  listingId,
  listingAddress,
  listingCity,
  listingPrice,
  formattedPrice,
}: ResaleMobileCTABarProps) => {
  const [showScheduler, setShowScheduler] = useState(false);

  const phoneNumber = "+16722581100";
  const whatsAppNumber = "16722581100";

  const handleWhatsAppCall = () => {
    // WhatsApp voice call link
    window.open(`https://wa.me/${whatsAppNumber}?text=Hi, I'd like to schedule a call about ${listingAddress}`, "_blank");
  };

  const handleWhatsAppMessage = () => {
    // WhatsApp message link with property context
    const message = encodeURIComponent(
      `Hi! I'm interested in the property at ${listingAddress}, ${listingCity}. Can you provide more details?`
    );
    window.open(`https://wa.me/${whatsAppNumber}?text=${message}`, "_blank");
  };

  return (
    <>
      {/* Fixed bottom CTA bar - mobile only with keyboard-aware visibility */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/98 backdrop-blur-lg border-t border-border shadow-[0_-4px_30px_rgba(0,0,0,0.15)] hide-on-keyboard safe-area-pb">
        <div className="px-3 py-3 flex items-center gap-2">
          {/* Price display - more compact */}
          {formattedPrice && (
            <div className="flex-shrink-0 min-w-0">
              <p className="text-2xl sm:text-3xl leading-none font-bold text-foreground tabular-nums tracking-tight">
                {formattedPrice}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">List Price</p>
            </div>
          )}

          <div className="flex-1 flex gap-2 justify-end items-center">
            {/* WhatsApp Call button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleWhatsAppCall}
              className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl border-border touch-active bg-green-50 hover:bg-green-100 border-green-200"
              aria-label="WhatsApp Call"
            >
              <Phone className="h-5 w-5 text-green-600" />
            </Button>

            {/* WhatsApp Message button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleWhatsAppMessage}
              className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl border-border touch-active bg-green-50 hover:bg-green-100 border-green-200"
              aria-label="WhatsApp Message"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
            </Button>

            {/* Schedule showing button - primary CTA */}
            <Sheet open={showScheduler} onOpenChange={setShowScheduler}>
              <SheetTrigger asChild>
                <Button className="h-12 min-h-[48px] px-4 gap-2 bg-foreground hover:bg-foreground/90 text-background font-semibold text-sm rounded-xl touch-active shadow-lg hover:shadow-xl transition-all duration-200">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden xs:inline">Schedule</span> Showing
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-left">{listingAddress}</SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] -mx-6 px-6 pb-safe scroll-smooth-mobile">
                  <ResaleScheduleForm
                    listingId={listingId}
                    listingAddress={listingAddress}
                    listingCity={listingCity}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div className="h-24 lg:hidden" />
    </>
  );
};