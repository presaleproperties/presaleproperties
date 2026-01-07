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
        className="sm:max-w-md p-0 overflow-hidden bg-card border-0 max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>Get Floor Plans & Pricing for {projectName}</DialogTitle>
        </VisuallyHidden>
        
        {/* Minimal close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm text-foreground/70 hover:text-foreground hover:bg-background transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Remove the card wrapper from ProjectLeadForm since modal handles styling */}
        <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none">
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
