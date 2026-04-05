import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Zap, Rocket, PenLine, Trash2 } from "lucide-react";
import { FlowStepCard } from "./FlowStepCard";
import { AddStepButton } from "./AddStepButton";
import type { AutomationFlow, StepType, AutomationStep } from "@/hooks/useAutomationFlows";
import { getTriggerLabel } from "@/hooks/useAutomationFlows";
import { cn } from "@/lib/utils";

interface FlowTimelineProps {
  flow: AutomationFlow;
  onAddStep: (flowId: string, stepType: StepType, afterOrder: number) => void;
  onUpdateStep: (stepId: string, updates: Partial<Pick<AutomationStep, "config" | "is_active">>) => void;
  onDeleteStep: (stepId: string, flowId: string) => void;
  onReorder: (flowId: string, fromIndex: number, toIndex: number) => void;
  onPublish: (flowId: string, publish: boolean) => void;
  onToggleActive: (flowId: string, active: boolean) => void;
  onDeleteFlow: (flowId: string) => void;
}

export function FlowTimeline({
  flow,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onReorder,
  onPublish,
  onToggleActive,
  onDeleteFlow,
}: FlowTimelineProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const sortedSteps = [...flow.steps].sort((a, b) => a.step_order - b.step_order);
  const hasChanges = !flow.is_published; // Draft mode

  const handleDragEnd = () => {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      onReorder(flow.id, dragFrom, dragOver);
    }
    setDragFrom(null);
    setDragOver(null);
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      {/* Flow header */}
      <div className="px-5 py-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{flow.name}</h3>
                {flow.is_published ? (
                  <Badge variant="default" className="text-[10px] h-5">Published</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] h-5">Draft</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Trigger: <span className="font-medium">{getTriggerLabel(flow.trigger_type)}</span>
                {flow.description && ` · ${flow.description}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={flow.is_active}
              onCheckedChange={(v) => onToggleActive(flow.id, v)}
              className="scale-90"
            />
            <Button
              variant={flow.is_published ? "outline" : "default"}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => onPublish(flow.id, !flow.is_published)}
            >
              {flow.is_published ? (
                <><PenLine className="h-3 w-3" /> Unpublish</>
              ) : (
                <><Rocket className="h-3 w-3" /> Publish</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDeleteFlow(flow.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline body */}
      <div className="p-5 pb-8">
        {/* Trigger node */}
        <div className="flex items-center gap-3 mb-1">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Trigger: {getTriggerLabel(flow.trigger_type)}</p>
            <p className="text-xs text-muted-foreground">Lead submits form → flow starts</p>
          </div>
        </div>

        {/* Steps */}
        {sortedSteps.length === 0 ? (
          <div className="my-2">
            <AddStepButton onAdd={(type) => onAddStep(flow.id, type, -1)} />
            <div className="text-center py-8 text-sm text-muted-foreground">
              No steps yet. Click <span className="font-medium">+</span> to add your first action.
            </div>
          </div>
        ) : (
          <>
            <AddStepButton onAdd={(type) => onAddStep(flow.id, type, -1)} />
            {sortedSteps.map((step, i) => (
              <div key={step.id}>
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
                />
                <AddStepButton onAdd={(type) => onAddStep(flow.id, type, step.step_order)} />
              </div>
            ))}
          </>
        )}

        {/* End node */}
        <div className="flex items-center gap-3 mt-1">
          <div className="h-8 w-8 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
          </div>
          <p className="text-xs text-muted-foreground">End of flow</p>
        </div>
      </div>
    </div>
  );
}
