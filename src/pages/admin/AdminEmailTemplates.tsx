import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Save,
  Eye,
  Code,
  Users,
  Briefcase
} from "lucide-react";

interface EmailTemplate {
  id: string;
  template_key: string | null;
  audience_type: string | null;
  name: string;
  subject: string;
  html_content: string;
  variables: unknown[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AUDIENCE_TYPES = [
  { value: "buyer", label: "Buyer", icon: Users },
  { value: "agent", label: "Agent", icon: Briefcase },
  { value: "developer", label: "Developer", icon: Briefcase },
];

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    template_key: "",
    name: "",
    subject: "",
    html_content: "",
    audience_type: "buyer",
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("audience_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      
      setTemplates(data?.map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : [],
      })) || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      template_key: template.template_key || "",
      name: template.name,
      subject: template.subject,
      html_content: template.html_content,
      audience_type: template.audience_type || "buyer",
      is_active: template.is_active,
    });
    setPreviewHtml(template.html_content);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setFormData({
      template_key: "",
      name: "",
      subject: "",
      html_content: getDefaultTemplate(),
      audience_type: "buyer",
      is_active: true,
    });
    setPreviewHtml(getDefaultTemplate());
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.template_key || !formData.name || !formData.subject) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        template_key: formData.template_key,
        name: formData.name,
        subject: formData.subject,
        html_content: formData.html_content,
        audience_type: formData.audience_type,
        is_active: formData.is_active,
        template_type: formData.template_key.includes("welcome") ? "welcome" : "notification",
      };

      if (selectedTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update(payload)
          .eq("id", selectedTemplate.id);

        if (error) throw error;
        toast({ title: "Template Updated" });
      } else {
        const { error } = await supabase
          .from("email_templates")
          .insert(payload);

        if (error) throw error;
        toast({ title: "Template Created" });
      }

      setIsEditing(false);
      fetchTemplates();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Template Deleted" });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error("Error toggling template:", error);
    }
  };

  const getDefaultTemplate = () => `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 30px; text-align: center;">
    <h1 style="color: #f5c542; margin: 0;">Email Title</h1>
  </div>
  <div style="padding: 30px; background: #ffffff;">
    <p style="font-size: 16px; color: #333;">Hi {{first_name}},</p>
    <p style="font-size: 16px; color: #333;">Your message content here.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://presaleproperties.com" style="background: #f5c542; color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Call to Action</a>
    </div>
  </div>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p>Presale Properties | Vancouver, BC</p>
  </div>
</div>`;

  const groupedTemplates = templates.reduce((acc, template) => {
    const type = template.audience_type || "buyer";
    if (!acc[type]) acc[type] = [];
    acc[type].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Email Templates
            </h1>
            <p className="text-muted-foreground">
              Manage transactional email templates for buyers, agents, and developers
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6">
            {AUDIENCE_TYPES.map(({ value, label, icon: Icon }) => (
              <Card key={value}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-5 w-5" />
                    {label} Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {groupedTemplates[value]?.length ? (
                    <div className="divide-y">
                      {groupedTemplates[value].map((template) => (
                        <div key={template.id} className="flex items-center justify-between py-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{template.name}</span>
                              <Badge variant={template.is_active ? "default" : "secondary"}>
                                {template.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {template.subject}
                            </p>
                            <code className="text-xs text-muted-foreground">
                              {template.template_key}
                            </code>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Switch
                              checked={template.is_active}
                              onCheckedChange={() => toggleActive(template.id, template.is_active)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No {label.toLowerCase()} templates yet
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate ? "Edit Template" : "Create Template"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Key *</Label>
                  <Input
                    value={formData.template_key}
                    onChange={(e) => setFormData(p => ({ ...p, template_key: e.target.value }))}
                    placeholder="e.g., buyer_welcome"
                    disabled={!!selectedTemplate}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Audience Type *</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Buyer Welcome Email"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject Line *</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                  placeholder="e.g., Welcome to Presale Properties, {{first_name}}!"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{variable}}"} syntax for dynamic content
                </p>
              </div>

              <Tabs defaultValue="code" className="w-full">
                <TabsList>
                  <TabsTrigger value="code" className="flex items-center gap-1">
                    <Code className="h-4 w-4" /> HTML
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="code">
                  <Textarea
                    value={formData.html_content}
                    onChange={(e) => {
                      setFormData(p => ({ ...p, html_content: e.target.value }));
                      setPreviewHtml(e.target.value);
                    }}
                    placeholder="HTML content..."
                    className="font-mono text-sm min-h-[300px]"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div 
                    className="border rounded-lg p-4 min-h-[300px] bg-white"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(p => ({ ...p, is_active: checked }))}
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
