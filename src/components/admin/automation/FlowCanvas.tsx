import { Zap } from "lucide-react";
import { FlowStepCard } from "./FlowStepCard";
import { AddStepButton } from "./AddStepButton";
import type { AutomationFlow, StepType, AutomationStep } from "@/hooks/useAutomationFlows";
import { getTriggerLabel } from "@/hooks/useAutomationFlows";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FlowCanvasProps {
  flow: AutomationFlow;
  onAddStep: (flowId: string, stepType: StepType, afterOrder: number) => void;
  onUpdateStep: (stepId: string, updates: Partial<Pick<AutomationStep, "config" | "is_active">>) => void;
  onDeleteStep: (stepId: string, flowId: string) => void;
  onReorder: (flowId: string, fromIndex: number, toIndex: number) => void;
}

export function FlowCanvas({ flow, onAddStep, onUpdateStep, onDeleteStep, onReorder }: FlowCanvasProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const sortedSteps = [...flow.steps].sort((a, b) => a.step_order - b.step_order);
  const flowDisabled = !flow.is_active;

  const handleDragEnd = () => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      onReorder(flow.id, dragFrom, dragOver);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <div
      className="relative flex-1 overflow-auto"
      style={{
        backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {/* Disabled overlay */}
      {flowDisabled && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-start justify-center pt-24 pointer-events-none">
          <div className="bg-card border rounded-lg px-5 py-3 shadow-sm text-center">
            <p className="text-sm font-medium text-muted-foreground">Flow is disabled</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle the switch above to activate</p>
          </div>
        </div>
      )}

      <div className={cn("flex flex-col items-center py-12 px-4 min-h-full", flowDisabled && "opacity-40")}>
        {/* Trigger node */}
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="mt-2 text-center">
            <p className="text-sm font-bold">{getTriggerLabel(flow.trigger_type)}</p>
            <p className="text-xs text-muted-foreground">Lead submits form → flow starts</p>
          </div>
        </div>

        {/* First add button */}
        <AddStepButton onAdd={(type) => onAddStep(flow.id, type, -1)} />

        {/* Steps */}
        {sortedSteps.map((step, i) => (
          <div key={step.id} className="flex flex-col items-center w-full max-w-md">
            <FlowStepCard
              step={step}
              index={i}
              onUpdate={onUpdateStep}
              onDelete={(id) => onDeleteStep(id, flow.id)}
              onDragStart={setDragFrom}
              onDragOver={setDragOver}
              onDragEnd={handleDragEnd}
              isDragging={dragFrom === i}
              isDragOver={dragOver === i && dragFrom !== i}
              flowDisabled={flowDisabled}
            />
            <AddStepButton onAdd={(type) => onAddStep(flow.id, type, step.step_order)} />
          </div>
        ))}

        {/* End node */}
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">End of flow</p>
        </div>

        {/* Extra whitespace for scrolling */}
        <div className="h-64" />
      </div>
    </div>
  );
}
