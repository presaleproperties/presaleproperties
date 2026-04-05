import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Zap } from "lucide-react";
import { FlowCanvas } from "@/components/admin/automation/FlowCanvas";
import { FlowSelector } from "@/components/admin/automation/FlowSelector";
import { useAutomationFlows } from "@/hooks/useAutomationFlows";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TRIGGER_OPTIONS = [
  { value: "project_inquiry", label: "Project Inquiry" },
  { value: "deck_gate", label: "Pitch Deck Lead Gate" },
  { value: "contact_form", label: "Contact Form" },
  { value: "exit_intent", label: "Exit Intent Popup" },
  { value: "calculator", label: "Calculator Lead" },
  { value: "booking", label: "Booking Request" },
];

export default function AdminEmailFlows() {
  const {
    flows, loading: flowsLoading, addStep, updateStep, deleteStep,
    reorderSteps, publishFlow, toggleFlowActive, createFlow, deleteFlow,
  } = useAutomationFlows();

  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowTrigger, setNewFlowTrigger] = useState("project_inquiry");

  // Auto-select first flow
  useEffect(() => {
    if (flows.length > 0 && !selectedFlowId) {
      setSelectedFlowId(flows[0].id);
    }
  }, [flows, selectedFlowId]);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "auto_response_enabled").maybeSingle()
      .then(({ data }) => setAutoEnabled(data?.value === true || data?.value === "true"));
  }, []);

  async function toggleEnabled(val: boolean) {
    setToggling(true);
    const { error } = await (supabase as any)
      .from("app_settings")
      .upsert({ key: "auto_response_enabled", value: val }, { onConflict: "key" });
    if (error) toast.error("Failed to update setting");
    else {
      setAutoEnabled(val);
      toast.success(val ? "Auto-response enabled" : "Auto-response disabled");
    }
    setToggling(false);
  }

  const handleCreateFlow = async () => {
    if (!newFlowName.trim()) return;
    await createFlow(newFlowName.trim(), newFlowTrigger);
    setShowNewFlow(false);
    setNewFlowName("");
    // Select the newly created flow
    setTimeout(() => {
      if (flows.length > 0) setSelectedFlowId(flows[flows.length - 1]?.id || null);
    }, 500);
  };

  const handleDeleteFlow = (flowId: string) => {
    deleteFlow(flowId);
    if (selectedFlowId === flowId) {
      const remaining = flows.filter((f) => f.id !== flowId);
      setSelectedFlowId(remaining[0]?.id || null);
    }
  };

  const selectedFlow = flows.find((f) => f.id === selectedFlowId);

  return (
    <AdminLayout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Top header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Automation Flows</h1>
              <p className="text-xs text-muted-foreground">Visual workflow builder</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Auto-Response</span>
            <Switch checked={autoEnabled} onCheckedChange={toggleEnabled} disabled={toggling} className="scale-90" />
            <Badge variant={autoEnabled ? "default" : "secondary"} className="text-xs">
              {autoEnabled ? "Active" : "Off"}
            </Badge>
          </div>
        </div>

        {/* Flow selector tabs */}
        {flowsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : flows.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            <Zap className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm font-medium">No flows yet</p>
            <p className="text-xs mt-1 mb-4">Create your first automation flow</p>
            <Button size="sm" onClick={() => setShowNewFlow(true)}>Create Flow</Button>
          </div>
        ) : (
          <>
            <FlowSelector
              flows={flows}
              selectedId={selectedFlowId}
              onSelect={setSelectedFlowId}
              onNew={() => setShowNewFlow(true)}
              onPublish={publishFlow}
              onToggleActive={toggleFlowActive}
              onDeleteFlow={handleDeleteFlow}
            />

            {selectedFlow ? (
              <FlowCanvas
                flow={selectedFlow}
                onAddStep={addStep}
                onUpdateStep={updateStep}
                onDeleteStep={deleteStep}
                onReorder={reorderSteps}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                Select a flow to edit
              </div>
            )}
          </>
        )}
      </div>

      {/* New Flow Dialog */}
      <Dialog open={showNewFlow} onOpenChange={setShowNewFlow}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create New Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Flow Name</label>
              <Input
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="e.g. Project Inquiry Follow-Up"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Trigger</label>
              <Select value={newFlowTrigger} onValueChange={setNewFlowTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFlow(false)}>Cancel</Button>
            <Button onClick={handleCreateFlow} disabled={!newFlowName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
