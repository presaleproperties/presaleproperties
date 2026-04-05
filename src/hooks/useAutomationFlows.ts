import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type StepType = "delay" | "send_email" | "send_sms" | "send_whatsapp" | "condition";

export interface AutomationStep {
  id: string;
  flow_id: string;
  step_order: number;
  step_type: StepType;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationFlow {
  id: string;
  name: string;
  trigger_type: string;
  description: string | null;
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps: AutomationStep[];
}

const TRIGGER_LABELS: Record<string, string> = {
  project_inquiry: "Project Inquiry",
  deck_gate: "Pitch Deck Lead Gate",
  contact_form: "Contact Form",
  exit_intent: "Exit Intent Popup",
  calculator: "Calculator Lead",
  booking: "Booking Request",
};

export function getTriggerLabel(trigger: string) {
  return TRIGGER_LABELS[trigger] || trigger;
}

export function useAutomationFlows() {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    const { data: flowData, error: fErr } = await (supabase as any)
      .from("automation_flows")
      .select("*")
      .order("created_at", { ascending: true });

    if (fErr) {
      console.error("Error loading flows:", fErr);
      setLoading(false);
      return;
    }

    const { data: stepData, error: sErr } = await (supabase as any)
      .from("automation_steps")
      .select("*")
      .order("step_order", { ascending: true });

    if (sErr) {
      console.error("Error loading steps:", sErr);
    }

    const steps = (stepData || []) as AutomationStep[];
    const merged = (flowData || []).map((f: any) => ({
      ...f,
      steps: steps.filter((s) => s.flow_id === f.id),
    })) as AutomationFlow[];

    setFlows(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const addStep = async (flowId: string, stepType: StepType, afterOrder: number) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;

    const defaultConfig: Record<StepType, Record<string, any>> = {
      delay: { minutes: 60, label: "Wait 1 hour" },
      send_email: { template: "auto_response", subject: "", label: "Send Email" },
      send_sms: { message: "", label: "Send SMS" },
      send_whatsapp: { message: "", label: "Send WhatsApp" },
      condition: { field: "agent_status", operator: "equals", value: "no", label: "Check condition" },
    };

    // Shift existing steps after insertion point
    const stepsToShift = flow.steps.filter((s) => s.step_order > afterOrder);
    for (const s of stepsToShift) {
      await (supabase as any)
        .from("automation_steps")
        .update({ step_order: s.step_order + 1 })
        .eq("id", s.id);
    }

    const { error } = await (supabase as any).from("automation_steps").insert({
      flow_id: flowId,
      step_order: afterOrder + 1,
      step_type: stepType,
      config: defaultConfig[stepType],
    });

    if (error) {
      toast.error("Failed to add step");
      console.error(error);
    } else {
      await loadFlows();
    }
  };

  const updateStep = async (stepId: string, updates: Partial<Pick<AutomationStep, "config" | "is_active" | "step_order">>) => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("automation_steps")
      .update(updates)
      .eq("id", stepId);

    if (error) {
      toast.error("Failed to update step");
    } else {
      await loadFlows();
    }
    setSaving(false);
  };

  const deleteStep = async (stepId: string, flowId: string) => {
    const { error } = await (supabase as any)
      .from("automation_steps")
      .delete()
      .eq("id", stepId);

    if (error) {
      toast.error("Failed to delete step");
    } else {
      // Re-order remaining steps
      const flow = flows.find((f) => f.id === flowId);
      if (flow) {
        const remaining = flow.steps
          .filter((s) => s.id !== stepId)
          .sort((a, b) => a.step_order - b.step_order);
        for (let i = 0; i < remaining.length; i++) {
          if (remaining[i].step_order !== i) {
            await (supabase as any)
              .from("automation_steps")
              .update({ step_order: i })
              .eq("id", remaining[i].id);
          }
        }
      }
      await loadFlows();
    }
  };

  const reorderSteps = async (flowId: string, fromIndex: number, toIndex: number) => {
    const flow = flows.find((f) => f.id === flowId);
    if (!flow) return;

    const sorted = [...flow.steps].sort((a, b) => a.step_order - b.step_order);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    // Optimistic update
    setFlows((prev) =>
      prev.map((f) =>
        f.id === flowId
          ? { ...f, steps: sorted.map((s, i) => ({ ...s, step_order: i })) }
          : f
      )
    );

    for (let i = 0; i < sorted.length; i++) {
      await (supabase as any)
        .from("automation_steps")
        .update({ step_order: i })
        .eq("id", sorted[i].id);
    }
  };

  const publishFlow = async (flowId: string, publish: boolean) => {
    setSaving(true);
    const { error } = await (supabase as any)
      .from("automation_flows")
      .update({ is_published: publish })
      .eq("id", flowId);

    if (error) {
      toast.error("Failed to update flow");
    } else {
      toast.success(publish ? "Flow published" : "Flow unpublished");
      await loadFlows();
    }
    setSaving(false);
  };

  const toggleFlowActive = async (flowId: string, active: boolean) => {
    const { error } = await (supabase as any)
      .from("automation_flows")
      .update({ is_active: active })
      .eq("id", flowId);

    if (error) {
      toast.error("Failed to toggle flow");
    } else {
      toast.success(active ? "Flow enabled" : "Flow disabled");
      await loadFlows();
    }
  };

  const createFlow = async (name: string, triggerType: string, description?: string) => {
    const { data, error } = await (supabase as any)
      .from("automation_flows")
      .insert({ name, trigger_type: triggerType, description })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create flow");
      return null;
    }
    await loadFlows();
    return data;
  };

  const deleteFlow = async (flowId: string) => {
    const { error } = await (supabase as any)
      .from("automation_flows")
      .delete()
      .eq("id", flowId);

    if (error) {
      toast.error("Failed to delete flow");
    } else {
      toast.success("Flow deleted");
      await loadFlows();
    }
  };

  return {
    flows,
    loading,
    saving,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    publishFlow,
    toggleFlowActive,
    createFlow,
    deleteFlow,
    reload: loadFlows,
  };
}
