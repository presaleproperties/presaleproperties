import { useState } from "react";
import { FileText, LayoutGrid, DollarSign, ArrowRight, Lock } from "lucide-react";
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
  { label: "Floor Plans", icon: LayoutGrid },
  { label: "Brochure", icon: FileText },
  { label: "Pricing Sheet", icon: DollarSign },
];

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
      <section className="relative rounded-xl sm:rounded-2xl border border-border/60 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-transparent to-muted/20 pointer-events-none" />

        <div className="relative p-5 sm:p-6 md:p-8">
          {/* Header */}
          <div className="mb-5 sm:mb-6">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
              Project Documents
            </span>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              Unlock {projectName} Details
            </h3>
          </div>

          {/* Document cards - blurred/locked look */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
            {DOCUMENTS.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="relative group bg-muted/40 border border-border/50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center transition-colors hover:bg-muted/60"
              >
                {/* Lock overlay */}
                <div className="absolute inset-0 bg-background/5 backdrop-blur-[1px] rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock className="h-5 w-5 text-muted-foreground/70" />
                </div>

                <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-foreground leading-tight">
                    {label}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span className="text-[10px] sm:text-xs">Locked</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              size="lg"
              className="flex-1 h-11 sm:h-12 font-semibold"
              onClick={() => setModalOpen(true)}
            >
              Get Floor Plans & Pricing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left max-w-[200px] mx-auto sm:mx-0">
              Documents sent instantly to your email after signup.
            </p>
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
