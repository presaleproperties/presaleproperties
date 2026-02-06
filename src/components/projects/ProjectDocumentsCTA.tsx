import { useState } from "react";
import { FileText, LayoutGrid, DollarSign, ArrowRight, Lock, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloorPlanModal } from "./FloorPlanModal";

interface ProjectDocumentsCTAProps {
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
  floorplanUrl?: string | null;
  pricingUrl?: string | null;
}

const DOCUMENTS = [
  { label: "Floor Plans", icon: LayoutGrid, desc: "All unit layouts & sizes" },
  { label: "Brochure", icon: FileText, desc: "Full project details" },
  { label: "Pricing Sheet", icon: DollarSign, desc: "Current price list" },
];

const UNIT_TYPES = ["1 Bed", "1 + Den", "2 Bed", "2 + Den", "+ More"];

export function ProjectDocumentsCTA({
  projectId,
  projectName,
  status,
  brochureUrl,
  floorplanUrl,
  pricingUrl,
}: ProjectDocumentsCTAProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="space-y-5 sm:space-y-6">
        {/* Floor Plan Preview - Blurred teaser */}
        <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-border/60">
          {/* Fake floor plan grid - blurred background */}
          <div className="bg-muted/40 p-4 sm:p-6">
            {/* Unit type tabs */}
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">Floor Plans</h3>
            <div className="flex gap-1.5 sm:gap-2 mb-4 overflow-x-auto pb-1">
              {UNIT_TYPES.map((type) => (
                <div
                  key={type}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg bg-muted/80 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap border border-border/40"
                >
                  {type}
                </div>
              ))}
            </div>

            {/* Blurred floor plan rows */}
            <div className="relative rounded-xl overflow-hidden">
              <div className="blur-[6px] pointer-events-none select-none">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="flex items-center gap-4 py-4 border-b border-border/30 last:border-0"
                  >
                    {/* Fake floor plan thumbnail */}
                    <div className="w-20 h-16 sm:w-24 sm:h-20 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center border border-border/50">
                      <LayoutGrid className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-32 bg-muted-foreground/15 rounded mb-2" />
                      <div className="h-3 w-20 bg-muted-foreground/10 rounded" />
                    </div>
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <div className="h-4 w-16 bg-muted-foreground/15 rounded mb-2" />
                      <div className="h-3 w-12 bg-muted-foreground/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dark overlay with CTA */}
              <div className="absolute inset-0 bg-foreground/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 rounded-xl">
                <div className="flex items-center gap-2 text-primary">
                  <Eye className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Preview Available</span>
                </div>
                <Button
                  size="lg"
                  onClick={() => setModalOpen(true)}
                  className="h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-bold rounded-xl shadow-gold hover:shadow-gold-glow"
                >
                  Unlock Prices + Floor Plans
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <p className="text-background/60 text-xs sm:text-sm mt-1">
                  Free & instant access — no obligation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Cards */}
        <div className="rounded-xl sm:rounded-2xl border border-border/60 overflow-hidden">
          <div className="p-5 sm:p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary">
                    Exclusive Documents
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">
                  Get the Full {projectName} Package
                </h3>
              </div>
            </div>

            {/* Document cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
              {DOCUMENTS.map(({ label, icon: Icon, desc }) => (
                <button
                  key={label}
                  onClick={() => setModalOpen(true)}
                  className="relative group bg-card border border-border/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center transition-all duration-200 hover:border-primary/40 hover:shadow-md cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-2 sm:gap-3">
                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/15">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-semibold text-foreground leading-tight block">
                        {label}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                        {desc}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground/70">
                      <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-[10px] sm:text-xs font-medium">Locked</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                size="lg"
                className="flex-1 h-12 sm:h-13 font-bold text-sm sm:text-base rounded-xl"
                onClick={() => setModalOpen(true)}
              >
                Get Floor Plans & Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left max-w-[220px] mx-auto sm:mx-0 leading-relaxed">
                Sent instantly to your email. <br className="hidden sm:block" />
                No spam — just project info.
              </p>
            </div>
          </div>
        </div>
      </section>

      <FloorPlanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        projectId={projectId}
        projectName={projectName}
        status={status}
        brochureUrl={brochureUrl}
      />
    </>
  );
}
