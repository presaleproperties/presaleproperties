/**
 * City Page Conversion Hook
 * Lightweight CTA block for city pages to capture leads
 */

import { useState } from "react";
import { Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessPackModal } from "@/components/conversion/AccessPackModal";
import { sendEvent } from "@/lib/tracking/events";
import { incrementIntentScore, addCityInterest } from "@/lib/tracking/intentScoring";

interface CityListCTAProps {
  city: string;
  productType: "condos" | "townhomes";
}

export function CityListCTA({ city, productType }: CityListCTAProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleCTAClick = () => {
    // Track the city CTA click
    sendEvent("city_cta_click", {
      city: city,
      product_type: productType,
      cta_type: "download_list",
    });

    // Increment intent score
    incrementIntentScore("city_cta_click");

    // Tag visitor with city interest
    addCityInterest(city);

    // Open the form modal
    setModalOpen(true);
  };

  return (
    <>
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 md:p-8 my-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-semibold mb-1.5">
              Get the Full List of {city} Presale Projects
            </h3>
            <p className="text-sm text-muted-foreground">
              Updated weekly. Pricing, floor plans, and incentives.
            </p>
          </div>
          <Button
            onClick={handleCTAClick}
            size="lg"
            className="h-12 px-6 font-semibold shrink-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Download List
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <AccessPackModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectName={`${city} Presale ${productType === "condos" ? "Condos" : "Townhomes"}`}
        variant="floorplans"
        source={`city_list_${city.toLowerCase().replace(/\s+/g, "_")}`}
      />
    </>
  );
}
