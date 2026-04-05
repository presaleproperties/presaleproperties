import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Clock, Mail, MessageCircle, Phone, GitBranch } from "lucide-react";
import type { StepType } from "@/hooks/useAutomationFlows";

const STEP_OPTIONS: { type: StepType; label: string; icon: any; desc: string }[] = [
  { type: "send_email", label: "Send Email", icon: Mail, desc: "Send an automated email" },
  { type: "delay", label: "Wait / Delay", icon: Clock, desc: "Pause before next step" },
  { type: "send_whatsapp", label: "Send WhatsApp", icon: MessageCircle, desc: "Send a WhatsApp message" },
  { type: "send_sms", label: "Send SMS", icon: Phone, desc: "Send a text message" },
  { type: "condition", label: "Condition", icon: GitBranch, desc: "Branch based on lead data" },
];

interface AddStepButtonProps {
  onAdd: (stepType: StepType) => void;
}

export function AddStepButton({ onAdd }: AddStepButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex justify-center py-1">
      <div className="flex flex-col items-center">
        <div className="w-px h-4 bg-border" />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-full p-0 border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="center">
            <div className="space-y-0.5">
              {STEP_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => { onAdd(opt.type); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent text-left transition-colors"
                >
                  <opt.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <div className="w-px h-4 bg-border" />
      </div>
    </div>
  );
}
