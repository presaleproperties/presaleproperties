import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Rocket, PenLine, Trash2 } from "lucide-react";
import type { AutomationFlow } from "@/hooks/useAutomationFlows";
import { getTriggerLabel } from "@/hooks/useAutomationFlows";
import { cn } from "@/lib/utils";

interface FlowSelectorProps {
  flows: AutomationFlow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onPublish: (flowId: string, publish: boolean) => void;
  onToggleActive: (flowId: string, active: boolean) => void;
  onDeleteFlow: (flowId: string) => void;
}

export function FlowSelector({ flows, selectedId, onSelect, onNew, onPublish, onToggleActive, onDeleteFlow }: FlowSelectorProps) {
  const selected = flows.find((f) => f.id === selectedId);

  return (
    <div className="border-b bg-card px-4 py-0">
      <div className="flex items-center gap-1 overflow-x-auto">
        {/* Flow tabs */}
        {flows.map((flow) => (
          <button
            key={flow.id}
            onClick={() => onSelect(flow.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
              selectedId === flow.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {flow.name}
            <Badge variant={flow.is_published ? "default" : "secondary"} className="text-[10px] h-4 px-1.5">
              {flow.is_published ? "Live" : "Draft"}
            </Badge>
          </button>
        ))}

        {/* New flow button */}
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-3 text-sm text-muted-foreground hover:text-foreground border-b-2 border-transparent transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Selected flow actions */}
        {selected && (
          <div className="flex items-center gap-2 py-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <span>{getTriggerLabel(selected.trigger_type)}</span>
            </div>
            <Switch
              checked={selected.is_active}
              onCheckedChange={(v) => onToggleActive(selected.id, v)}
              className="scale-80"
            />
            <Button
              variant={selected.is_published ? "outline" : "default"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onPublish(selected.id, !selected.is_published)}
            >
              {selected.is_published ? (
                <><PenLine className="h-3 w-3" /> Unpublish</>
              ) : (
                <><Rocket className="h-3 w-3" /> Publish</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDeleteFlow(selected.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
