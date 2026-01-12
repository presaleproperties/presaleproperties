import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Workflow, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Save,
  Play,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface EmailWorkflow {
  id: string;
  workflow_key: string;
  name: string;
  description: string | null;
  audience_type: string;
  trigger_event: string;
  is_active: boolean;
  created_at: string;
}

interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  delay_minutes: number;
  template_id: string;
  is_active: boolean;
  email_templates?: {
    id: string;
    name: string;
    template_key: string;
  };
}

interface EmailJob {
  id: string;
  to_email: string;
  to_name: string | null;
  status: string;
  scheduled_at: string;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  email_templates?: {
    name: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  template_key: string;
}

const TRIGGER_EVENTS = [
  { value: "buyer_signup", label: "Buyer Signup" },
  { value: "project_inquiry", label: "Project Inquiry" },
  { value: "floorplan_download", label: "Floorplan Download" },
  { value: "booking_request", label: "Booking Request" },
  { value: "agent_signup", label: "Agent Signup" },
  { value: "agent_request", label: "Agent Request" },
];

export default function AdminEmailWorkflows() {
  const [workflows, setWorkflows] = useState<EmailWorkflow[]>([]);
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<EmailWorkflow | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("workflows");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    workflow_key: "",
    name: "",
    description: "",
    audience_type: "buyer",
    trigger_event: "buyer_signup",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workflowsRes, jobsRes, templatesRes] = await Promise.all([
        supabase.from("email_workflows").select("*").order("audience_type").order("name"),
        supabase.from("email_jobs").select("*, email_templates(name)").order("created_at", { ascending: false }).limit(100),
        supabase.from("email_templates").select("id, name, template_key").eq("is_active", true),
      ]);

      if (workflowsRes.error) throw workflowsRes.error;
      if (jobsRes.error) throw jobsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setWorkflows(workflowsRes.data || []);
      setJobs(jobsRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflowSteps = async (workflowId: string) => {
    const { data, error } = await supabase
      .from("email_workflow_steps")
      .select("*, email_templates(id, name, template_key)")
      .eq("workflow_id", workflowId)
      .order("step_order");

    if (error) {
      console.error("Error fetching steps:", error);
      return;
    }

    setWorkflowSteps(data || []);
  };

  const handleEdit = async (workflow: EmailWorkflow) => {
    setSelectedWorkflow(workflow);
    setFormData({
      workflow_key: workflow.workflow_key,
      name: workflow.name,
      description: workflow.description || "",
      audience_type: workflow.audience_type,
      trigger_event: workflow.trigger_event,
      is_active: workflow.is_active,
    });
    await fetchWorkflowSteps(workflow.id);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setFormData({
      workflow_key: "",
      name: "",
      description: "",
      audience_type: "buyer",
      trigger_event: "buyer_signup",
      is_active: true,
    });
    setWorkflowSteps([]);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.workflow_key || !formData.name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (selectedWorkflow) {
        const { error } = await supabase
          .from("email_workflows")
          .update({
            name: formData.name,
            description: formData.description,
            audience_type: formData.audience_type,
            trigger_event: formData.trigger_event,
            is_active: formData.is_active,
          })
          .eq("id", selectedWorkflow.id);

        if (error) throw error;
        toast({ title: "Workflow Updated" });
      } else {
        const { error } = await supabase
          .from("email_workflows")
          .insert({
            workflow_key: formData.workflow_key,
            name: formData.name,
            description: formData.description,
            audience_type: formData.audience_type,
            trigger_event: formData.trigger_event,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: "Workflow Created" });
      }

      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async () => {
    if (!selectedWorkflow) return;

    const newOrder = workflowSteps.length + 1;
    const defaultTemplate = templates[0];

    if (!defaultTemplate) {
      toast({
        title: "Error",
        description: "No templates available. Create a template first.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("email_workflow_steps")
      .insert({
        workflow_id: selectedWorkflow.id,
        step_order: newOrder,
        delay_minutes: 0,
        template_id: defaultTemplate.id,
      })
      .select("*, email_templates(id, name, template_key)")
      .single();

    if (error) {
      console.error("Error adding step:", error);
      return;
    }

    setWorkflowSteps([...workflowSteps, data]);
  };

  const handleUpdateStep = async (stepId: string, updates: Partial<WorkflowStep>) => {
    const { error } = await supabase
      .from("email_workflow_steps")
      .update(updates)
      .eq("id", stepId);

    if (error) {
      console.error("Error updating step:", error);
      return;
    }

    if (selectedWorkflow) {
      fetchWorkflowSteps(selectedWorkflow.id);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    const { error } = await supabase
      .from("email_workflow_steps")
      .delete()
      .eq("id", stepId);

    if (error) {
      console.error("Error deleting step:", error);
      return;
    }

    setWorkflowSteps(workflowSteps.filter(s => s.id !== stepId));
  };

  const toggleWorkflowActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("email_workflows")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (!error) fetchData();
  };

  const testWorkflow = async (workflow: EmailWorkflow) => {
    try {
      const { error } = await supabase.functions.invoke("trigger-workflow", {
        body: {
          event: workflow.trigger_event,
          data: {
            email: "test@example.com",
            first_name: "Test",
            last_name: "User",
            project_name: "Test Project",
            city: "Vancouver",
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Test Triggered",
        description: "Check email jobs for results",
      });

      fetchData();
    } catch (error) {
      console.error("Test error:", error);
      toast({
        title: "Error",
        description: "Failed to trigger test",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "queued":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Workflow className="h-6 w-6" />
              Email Workflows
            </h1>
            <p className="text-muted-foreground">
              Configure automated email sequences triggered by user actions
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
            <TabsTrigger value="jobs">Email Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {workflows.map((workflow) => (
                  <Card key={workflow.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <Badge variant={workflow.is_active ? "default" : "secondary"}>
                              {workflow.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{workflow.audience_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Trigger: <code className="bg-muted px-1 rounded">{workflow.trigger_event}</code>
                          </p>
                          {workflow.description && (
                            <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={workflow.is_active}
                            onCheckedChange={() => toggleWorkflowActive(workflow.id, workflow.is_active)}
                          />
                          <Button variant="outline" size="sm" onClick={() => testWorkflow(workflow)}>
                            <Play className="h-4 w-4 mr-1" /> Test
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(workflow)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Recent Email Jobs
                </CardTitle>
                <CardDescription>
                  View the status of all sent and queued emails
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{job.to_name || "—"}</div>
                            <div className="text-sm text-muted-foreground">{job.to_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{job.email_templates?.name || "—"}</TableCell>
                        <TableCell>
                          {getStatusBadge(job.status)}
                          {job.error_message && (
                            <p className="text-xs text-destructive mt-1">{job.error_message}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(job.scheduled_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {job.sent_at ? format(new Date(job.sent_at), "MMM d, h:mm a") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit/Create Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedWorkflow ? "Edit Workflow" : "Create Workflow"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Workflow Key *</Label>
                  <Input
                    value={formData.workflow_key}
                    onChange={(e) => setFormData(p => ({ ...p, workflow_key: e.target.value }))}
                    placeholder="e.g., buyer_welcome"
                    disabled={!!selectedWorkflow}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trigger Event *</Label>
                  <Select
                    value={formData.trigger_event}
                    onValueChange={(v) => setFormData(p => ({ ...p, trigger_event: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_EVENTS.map(e => (
                        <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Workflow Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Buyer Welcome Flow"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="What does this workflow do?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Audience Type</Label>
                  <Select
                    value={formData.audience_type}
                    onValueChange={(v) => setFormData(p => ({ ...p, audience_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              {selectedWorkflow && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Workflow Steps</Label>
                    <Button variant="outline" size="sm" onClick={handleAddStep}>
                      <Plus className="h-4 w-4 mr-1" /> Add Step
                    </Button>
                  </div>

                  {workflowSteps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No steps configured. Add a step to send emails.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {workflowSteps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2 p-3 border rounded-lg">
                          <span className="text-sm font-medium w-8">{idx + 1}.</span>
                          <Select
                            value={step.template_id}
                            onValueChange={(v) => handleUpdateStep(step.id, { template_id: v })}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              value={step.delay_minutes}
                              onChange={(e) => handleUpdateStep(step.id, { delay_minutes: parseInt(e.target.value) || 0 })}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">min delay</span>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteStep(step.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Workflow
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
