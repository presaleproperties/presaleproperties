import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { ProjectLeadForm } from "./ProjectLeadForm";

interface FloorPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  status: "coming_soon" | "registering" | "active" | "sold_out";
  brochureUrl?: string | null;
}

export function FloorPlanModal({
  open,
  onOpenChange,
  projectId,
  projectName,
  status,
  brochureUrl,
}: FloorPlanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden bg-card border-0 max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl [&>button]:hidden mx-4"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Get Floor Plans & Pricing for {projectName}</DialogTitle>
        </VisuallyHidden>
        
        {/* Close button - more prominent and always visible */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-20 p-2 rounded-full bg-white/90 shadow-md text-foreground/80 hover:text-foreground hover:bg-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Remove the card wrapper from ProjectLeadForm since modal handles styling */}
        <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none [&>div>div:last-child]:pb-6">
          <ProjectLeadForm
            projectId={projectId}
            projectName={projectName}
            status={status}
            brochureUrl={brochureUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
