import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Trash2, Clock, Mail, MessageCircle, Phone, GitBranch, ChevronDown, ChevronRight, ExternalLink, Sparkles, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AutomationStep, StepType } from "@/hooks/useAutomationFlows";
import { cn } from "@/lib/utils";
import { EmailTemplatePicker } from "./EmailTemplatePicker";

/** Build a destination URL to view/edit the template behind an email step. */
function getTemplateEditHref(kind?: string, value?: string): string {
  if (!value) return "/admin/email-builder-hub";
  if (kind === "db" || value.startsWith("db:")) {
    const id = value.replace(/^db:/, "");
    return `/admin/email-templates?id=${id}`;
  }
  if (kind === "campaign" || value.startsWith("campaign:")) {
    const id = value.replace(/^campaign:/, "");
    return `/admin/email-builder-hub?template=${id}`;
  }
  // system templates live in edge functions — point to the system reference page
  return `/admin/email-flows?system=${encodeURIComponent(value.replace(/^system:/, ""))}`;
}

function getTemplateIcon(kind?: string, value?: string) {
  const k = kind || (value?.startsWith("campaign:") ? "campaign" : value?.startsWith("db:") ? "db" : "system");
  if (k === "campaign") return { Icon: FileText, color: "text-amber-600" };
  if (k === "db") return { Icon: Mail, color: "text-emerald-600" };
  return { Icon: Sparkles, color: "text-blue-600" };
}

function getTemplateBadgeLabel(kind?: string, value?: string) {
  const k = kind || (value?.startsWith("campaign:") ? "campaign" : value?.startsWith("db:") ? "db" : "system");
  if (k === "campaign") return "Project";
  if (k === "db") return "Saved";
  return "Auto";
}

const STEP_META: Record<StepType, { icon: any; color: string; bg: string }> = {
  delay: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  send_email: { icon: Mail, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  send_sms: { icon: Phone, color: "text-green-600", bg: "bg-green-50 border-green-200" },
  send_whatsapp: { icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  condition: { icon: GitBranch, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
};

const DELAY_PRESETS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "1 day", value: 1440 },
  { label: "2 days", value: 2880 },
  { label: "3 days", value: 4320 },
  { label: "7 days", value: 10080 },
];

interface FlowStepCardProps {
  step: AutomationStep;
  index: number;
  onUpdate: (stepId: string, updates: Partial<Pick<AutomationStep, "config" | "is_active">>) => void;
  onDelete: (stepId: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
  flowDisabled?: boolean;
}

export function FlowStepCard({
  step,
  index,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  isDragOver,
  flowDisabled,
}: FlowStepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const meta = STEP_META[step.step_type];
  const Icon = meta.icon;

  const formatDelay = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${minutes / 60} hr${minutes > 60 ? "s" : ""}`;
    return `${minutes / 1440} day${minutes > 1440 ? "s" : ""}`;
  };

  const getStepLabel = () => {
    const label = step.config?.label;
    if (label) return label;
    switch (step.step_type) {
      case "delay": return `Wait ${formatDelay(step.config?.minutes || 60)}`;
      case "send_email": return "Send Email";
      case "send_sms": return "Send SMS";
      case "send_whatsapp": return "Send WhatsApp";
      case "condition": return "Condition";
    }
  };

  // When flow is disabled, step toggle is locked off
  const effectiveActive = flowDisabled ? false : step.is_active;

  return (
    <div
      draggable={!flowDisabled}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(index); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
      className={cn(
        "transition-all duration-200",
        isDragging && "opacity-40 scale-95",
        isDragOver && "translate-y-1"
      )}
    >
      {isDragOver && (
        <div className="h-1 bg-primary rounded-full mb-2 mx-4 animate-pulse" />
      )}
      <Card className={cn("border transition-colors", meta.bg, !effectiveActive && "opacity-50")}>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/5 rounded">
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", meta.color, "bg-white/60")}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{getStepLabel()}</p>
              <p className="text-xs text-muted-foreground capitalize">{step.step_type.replace("_", " ")}</p>
            </div>
            <Switch
              checked={effectiveActive}
              onCheckedChange={(v) => onUpdate(step.id, { is_active: v })}
              disabled={flowDisabled}
              className="scale-75"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Expanded config */}
          {expanded && (
            <div className="px-4 pb-3 pt-1 border-t border-black/5 space-y-3">
              {step.step_type === "delay" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Delay Duration</label>
                  <Select
                    value={String(step.config?.minutes || 60)}
                    onValueChange={(v) => {
                      const mins = Number(v);
                      onUpdate(step.id, {
                        config: { ...step.config, minutes: mins, label: `Wait ${formatDelay(mins)}` },
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 text-sm bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_PRESETS.map((p) => (
                        <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step.step_type === "send_email" && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Template</label>
                    <EmailTemplatePicker
                      value={step.config?.template || "system:auto_response_a"}
                      onChange={(v, opt) =>
                        onUpdate(step.id, {
                          config: {
                            ...step.config,
                            template: v,
                            template_kind: opt.group, // 'system' | 'db' | 'campaign'
                            template_name: opt.label,
                            label: step.config?.label || opt.label,
                          },
                        })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Choose from system auto-emails or any saved project template.
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
                    <Input
                      value={step.config?.label || ""}
                      onChange={(e) => onUpdate(step.id, { config: { ...step.config, label: e.target.value } })}
                      placeholder="e.g. Send welcome email"
                      className="h-9 text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              {(step.step_type === "send_sms" || step.step_type === "send_whatsapp") && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                    <textarea
                      value={step.config?.message || ""}
                      onChange={(e) => onUpdate(step.id, { config: { ...step.config, message: e.target.value } })}
                      placeholder={`Hi {$name}, thanks for your interest in {{project_name}}...`}
                      className="w-full h-20 rounded-md border bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Label</label>
                    <Input
                      value={step.config?.label || ""}
                      onChange={(e) => onUpdate(step.id, { config: { ...step.config, label: e.target.value } })}
                      placeholder="e.g. Send intro WhatsApp"
                      className="h-9 text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              {step.step_type === "condition" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Field</label>
                      <Select
                        value={step.config?.field || "agent_status"}
                        onValueChange={(v) => onUpdate(step.id, { config: { ...step.config, field: v } })}
                      >
                        <SelectTrigger className="h-9 text-sm bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent_status">Agent Status</SelectItem>
                          <SelectItem value="persona">Persona</SelectItem>
                          <SelectItem value="lead_source">Lead Source</SelectItem>
                          <SelectItem value="has_documents">Has Documents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Operator</label>
                      <Select
                        value={step.config?.operator || "equals"}
                        onValueChange={(v) => onUpdate(step.id, { config: { ...step.config, operator: v } })}
                      >
                        <SelectTrigger className="h-9 text-sm bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Value</label>
                      <Input
                        value={step.config?.value || ""}
                        onChange={(e) => onUpdate(step.id, { config: { ...step.config, value: e.target.value } })}
                        className="h-9 text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 text-xs" onClick={() => onDelete(step.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
