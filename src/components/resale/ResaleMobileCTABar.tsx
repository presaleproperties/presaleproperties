import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Phone } from "lucide-react";
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
      {/* Fixed bottom CTA bar - mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/95 backdrop-blur-md border-t border-border safe-area-pb">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* Price display */}
          {formattedPrice && (
            <div className="flex-shrink-0">
              <p className="text-lg font-bold text-foreground">{formattedPrice}</p>
              <p className="text-xs text-muted-foreground">List Price</p>
            </div>
          )}

          <div className="flex-1 flex gap-2 justify-end">
            {/* Call button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleCall}
              className="h-11 w-11 rounded-full border-border"
            >
              <Phone className="h-5 w-5" />
            </Button>

            {/* Schedule showing button - opens sheet */}
            <Sheet open={showScheduler} onOpenChange={setShowScheduler}>
              <SheetTrigger asChild>
                <Button className="h-11 px-4 gap-2 bg-foreground hover:bg-foreground/90 text-background font-medium">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden xs:inline">Schedule</span> Showing
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl">
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-left">
                    {listingAddress}
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] -mx-6 px-6 pb-safe">
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
      <div className="h-20 lg:hidden" />
    </>
  );
};
