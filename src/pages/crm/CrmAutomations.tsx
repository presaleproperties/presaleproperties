import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Zap, Users, CheckCircle, TrendingUp, Pencil, Copy, Trash2, LayoutGrid, List, Mail, MessageSquare, Phone, Clock, FileEdit, ArrowDown, X } from "lucide-react";
import { toast } from "sonner";

type Automation = {
  id: string; name: string; description: string; trigger_type: string;
  trigger_config: any; steps: any; is_active: boolean;
  total_enrolled: number; total_completed: number;
  created_at: string; updated_at: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  new_lead: "New Lead Added", pipeline_change: "Pipeline Changed",
  tag_added: "Tag Added", time_based: "Time-Based", manual: "Manual",
};
const TRIGGER_COLORS: Record<string, string> = {
  new_lead: "bg-green-100 text-green-700", pipeline_change: "bg-blue-100 text-blue-700",
  tag_added: "bg-purple-100 text-purple-700", time_based: "bg-amber-100 text-amber-700",
  manual: "bg-muted text-muted-foreground",
};

const STEP_ICONS: Record<string, any> = { email: Mail, whatsapp: MessageSquare, sms: Phone, wait: Clock, update_field: FileEdit };
const STEP_LABELS: Record<string, string> = { email: "Send Email", whatsapp: "Send WhatsApp", sms: "Send SMS", wait: "Wait", update_field: "Update Field" };

const PIPELINE_STATUSES = ["New Lead", "Pre-Sale", "Re-Sale", "Commercial", "Showing Booked", "Offer Made", "Nurturing", "Closed", "Lost"];

const emptyDraft = { name: "", description: "", trigger_type: "new_lead", trigger_config: {} as any, steps: [] as any[] };

export default function CrmAutomations() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const qc = useQueryClient();

  const { data: automations = [] } = useQuery({
    queryKey: ["crm-automations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_automations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((d: any) => ({ ...d, steps: Array.isArray(d.steps) ? d.steps : [] })) as Automation[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["crm-templates-list"],
    queryFn: async () => {
      const { data } = await supabase.from("crm_templates").select("id, name, category").eq("is_active", true);
      return data || [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("crm_automations").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-automations"] }); },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: draft.name, description: draft.description, trigger_type: draft.trigger_type, trigger_config: draft.trigger_config, steps: draft.steps };
      if (editId) {
        const { error } = await supabase.from("crm_automations").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_automations").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-automations"] }); toast.success(editId ? "Automation updated" : "Automation created"); setEditOpen(false); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("crm_automations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-automations"] }); toast.success("Deleted"); },
  });

  const dup = useMutation({
    mutationFn: async (a: Automation) => {
      const { error } = await supabase.from("crm_automations").insert({ name: a.name + " (Copy)", description: a.description, trigger_type: a.trigger_type, trigger_config: a.trigger_config, steps: a.steps } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-automations"] }); toast.success("Duplicated"); },
  });

  const openCreate = () => { setEditId(null); setDraft(emptyDraft); setEditOpen(true); };
  const openEdit = (a: Automation) => { setEditId(a.id); setDraft({ name: a.name, description: a.description || "", trigger_type: a.trigger_type, trigger_config: a.trigger_config || {}, steps: Array.isArray(a.steps) ? a.steps : [] }); setEditOpen(true); };

  const addStep = (index: number) => {
    const newStep = { type: "email", config: { template_name: "", delay_hours: 0 } };
    const s = [...draft.steps];
    s.splice(index, 0, newStep);
    setDraft({ ...draft, steps: s });
  };
  const removeStep = (i: number) => setDraft({ ...draft, steps: draft.steps.filter((_, idx) => idx !== i) });
  const updateStep = (i: number, patch: any) => {
    const s = [...draft.steps];
    s[i] = { ...s[i], ...patch };
    setDraft({ ...draft, steps: s });
  };

  const activeCount = automations.filter((a) => a.is_active).length;
  const totalEnrolled = automations.reduce((s, a) => s + (a.total_enrolled || 0), 0);
  const totalCompleted = automations.reduce((s, a) => s + (a.total_completed || 0), 0);
  const convRate = totalEnrolled ? ((totalCompleted / totalEnrolled) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Automations</h1>
          <p className="text-muted-foreground text-sm">Build workflow sequences to nurture leads automatically</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" />Create Automation</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active", value: activeCount, icon: Zap, color: "text-green-600" },
          { label: "Enrolled", value: totalEnrolled, icon: Users, color: "text-primary" },
          { label: "Completed", value: totalCompleted, icon: CheckCircle, color: "text-amber-600" },
          { label: "Conversion", value: `${convRate}%`, icon: TrendingUp, color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex justify-end gap-1">
        <Button variant={view === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" /></Button>
        <Button variant={view === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}><List className="h-4 w-4" /></Button>
      </div>

      {automations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No automations yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first automation to nurture leads on autopilot.</p>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">Create Automation</Button>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {automations.map((a) => (
            <Card key={a.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge className={`${TRIGGER_COLORS[a.trigger_type] || TRIGGER_COLORS.manual} text-xs`}>{TRIGGER_LABELS[a.trigger_type] || a.trigger_type}</Badge>
                  <Switch checked={a.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: a.id, active: v })} />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{a.name}</h3>
                {a.description && <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{(Array.isArray(a.steps) ? a.steps : []).length} steps</span>
                  <span>{a.total_enrolled} enrolled</span>
                  <span>{a.total_completed} completed</span>
                </div>
                <div className="flex gap-1 pt-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dup.mutate(a)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => del.mutate(a.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell><Badge className={`${TRIGGER_COLORS[a.trigger_type] || ""} text-xs`}>{TRIGGER_LABELS[a.trigger_type]}</Badge></TableCell>
                  <TableCell>{(Array.isArray(a.steps) ? a.steps : []).length}</TableCell>
                  <TableCell>{a.total_enrolled}</TableCell>
                  <TableCell><Switch checked={a.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: a.id, active: v })} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => dup.mutate(a)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => del.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Automation" : "Create Automation"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. New Lead Welcome" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Trigger</label>
                <Select value={draft.trigger_type} onValueChange={(v) => setDraft({ ...draft, trigger_type: v, trigger_config: {} })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {draft.trigger_type === "pipeline_change" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Trigger when status changes to</label>
                <Select value={draft.trigger_config?.target_status || ""} onValueChange={(v) => setDraft({ ...draft, trigger_config: { target_status: v } })}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>{PIPELINE_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}

            {draft.trigger_type === "tag_added" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tag name</label>
                <Input value={draft.trigger_config?.tag || ""} onChange={(e) => setDraft({ ...draft, trigger_config: { tag: e.target.value } })} placeholder="e.g. VIP" />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What does this automation do?" className="min-h-[60px]" />
            </div>

            {/* Workflow Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-foreground">Workflow Steps</label>
                <Button variant="outline" size="sm" onClick={() => addStep(draft.steps.length)} className="gap-1 text-xs"><Plus className="h-3 w-3" />Add Step</Button>
              </div>

              {draft.steps.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">No steps yet</p>
                  <Button variant="outline" size="sm" onClick={() => addStep(0)} className="gap-1"><Plus className="h-3 w-3" />Add First Step</Button>
                </div>
              ) : (
                <div className="space-y-0">
                  {draft.steps.map((step: any, i: number) => {
                    const Icon = STEP_ICONS[step.type] || Mail;
                    return (
                      <div key={i}>
                        <div className="flex items-start gap-3 p-3 border rounded-lg bg-card relative group">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2">
                              <Select value={step.type} onValueChange={(v) => updateStep(i, { type: v, config: v === "wait" ? { delay_hours: 24 } : v === "update_field" ? { field_name: "", field_value: "" } : { template_name: "" } })}>
                                <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STEP_LABELS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => removeStep(i)}><X className="h-3.5 w-3.5" /></Button>
                            </div>

                            {(step.type === "email" || step.type === "whatsapp" || step.type === "sms") && (
                              <Input className="h-8 text-xs" placeholder="Template name" value={step.config?.template_name || ""} onChange={(e) => updateStep(i, { config: { ...step.config, template_name: e.target.value } })} />
                            )}
                            {step.type === "wait" && (
                              <div className="flex items-center gap-2">
                                <Input type="number" className="h-8 w-20 text-xs" value={step.config?.delay_hours || 0} onChange={(e) => updateStep(i, { config: { delay_hours: parseInt(e.target.value) || 0 } })} />
                                <span className="text-xs text-muted-foreground">hours</span>
                              </div>
                            )}
                            {step.type === "update_field" && (
                              <div className="flex gap-2">
                                <Input className="h-8 text-xs" placeholder="Field name" value={step.config?.field_name || ""} onChange={(e) => updateStep(i, { config: { ...step.config, field_name: e.target.value } })} />
                                <Input className="h-8 text-xs" placeholder="Value" value={step.config?.field_value || ""} onChange={(e) => updateStep(i, { config: { ...step.config, field_value: e.target.value } })} />
                              </div>
                            )}
                          </div>
                        </div>
                        {i < draft.steps.length - 1 && (
                          <div className="flex justify-center py-1">
                            <button onClick={() => addStep(i + 1)} className="flex items-center justify-center w-6 h-6 rounded-full border border-dashed text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" disabled={!draft.name} onClick={() => save.mutate()}>
              {editId ? "Save Changes" : "Create Automation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
