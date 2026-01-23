import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Phone } from "lucide-react";
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

  const handleCall = () => {
    window.location.href = "tel:+16722581100";
  };

  return (
    <>
      {/* Fixed bottom CTA bar - mobile only with keyboard-aware visibility */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/98 backdrop-blur-lg border-t border-border shadow-[0_-4px_30px_rgba(0,0,0,0.15)] hide-on-keyboard safe-area-pb">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Price display */}
          {formattedPrice && (
            <div className="flex-shrink-0 min-w-0">
              <p className="text-3xl sm:text-4xl leading-none font-bold text-foreground tabular-nums tracking-tight">
                {formattedPrice}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">List Price</p>
            </div>
          )}

          <div className="flex-1 flex gap-3 justify-end">
            {/* Call button - 48x48 minimum touch target */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleCall}
              className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl border-border touch-active"
              aria-label="Call"
            >
              <Phone className="h-5 w-5" />
            </Button>

            {/* Schedule showing button - Large touch target with premium styling */}
            <Sheet open={showScheduler} onOpenChange={setShowScheduler}>
              <SheetTrigger asChild>
                <Button className="h-14 min-h-[56px] px-5 gap-2 bg-foreground hover:bg-foreground/90 text-background font-semibold text-base rounded-xl touch-active shadow-lg hover:shadow-xl transition-all duration-200">
                  <Calendar className="h-5 w-5" />
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
