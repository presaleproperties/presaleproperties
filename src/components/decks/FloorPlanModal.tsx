import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface FloorPlan {
  id: string;
  unit_type: string;
  size_range: string;
  price_from: string;
  tags: string[];
  image_url?: string;
}

interface FloorPlanModalProps {
  plan: FloorPlan | null;
  onClose: () => void;
}

export function FloorPlanModal({ plan, onClose }: FloorPlanModalProps) {
  if (!plan) return null;

  return (
    <Dialog open={!!plan} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="flex flex-col">
          {plan.image_url ? (
            <div className="bg-muted aspect-[4/3] w-full overflow-hidden">
              <img
                src={plan.image_url}
                alt={`${plan.unit_type} floor plan`}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] w-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center space-y-2 opacity-40">
                <div className="w-24 h-24 mx-auto border-2 border-foreground/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-foreground/50">FP</span>
                </div>
                <p className="text-sm text-muted-foreground">Floor plan coming soon</p>
              </div>
            </div>
          )}
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{plan.unit_type}</h3>
                <p className="text-muted-foreground text-sm mt-0.5">{plan.size_range}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Starting From</p>
                <p className="text-2xl font-bold text-primary">{plan.price_from}</p>
              </div>
            </div>
            {plan.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {plan.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
