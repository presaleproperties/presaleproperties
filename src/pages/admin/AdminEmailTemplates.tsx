import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  Mail, Plus, Edit, Trash2, Loader2, Save, Eye, Copy,
  Star, Search, CheckCircle, X
} from "lucide-react";

const API_URL = "https://cplycyfgywxhlecazvra.supabase.co/functions/v1/template-sync";
const API_HEADERS = {
  "Content-Type": "application/json",
  "x-webhook-secret": "presale-leads-2026",
};

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "project_launch", label: "Project Launch" },
  { value: "nurture", label: "Nurture" },
  { value: "follow_up", label: "Follow Up" },
  { value: "newsletter", label: "Newsletter" },
  { value: "announcement", label: "Announcement" },
  { value: "re_engagement", label: "Re-engagement" },
  { value: "custom", label: "Custom" },
];

const PROJECT_OPTIONS = [
  "Eden", "Rail District", "Jericho", "Gardena", "SOCO", "High Street",
  "Walker House", "Burquitlam", "Heath", "Woodward", "Butterfly", "Holland",
  "PURA", "Mirada Estates", "Quinn", "Century City", "Guilden", "FORME",
  "Portwood", "Renfrew", "Solana", "Mountvue", "North Village", "Hendrix",
  "Ironwood", "Inlet", "Georgetown", "Fleetwood Village", "Manchester",
  "Eastin", "BAND Townline", "Atlin", "Belvedere", "40Listings",
];

const AREA_OPTIONS = [
  "Surrey", "Langley", "Abbotsford", "Coquitlam", "Delta",
  "Burnaby", "Port Moody", "New Westminster",
];

interface Template {
  id: string;
  name: string;
  subject: string;
  preview_text?: string;
  html_content: string;
  category: string;
  project_tags: string[];
  area_tags: string[];
  is_favorite?: boolean;
  times_used?: number;
  updated_at: string;
  created_at: string;
}

// ── API helpers ─────────────────────────────────────────────────
async function fetchTemplates(params?: Record<string, string>): Promise<Template[]> {
  const url = new URL(API_URL);
  if (params) Object.entries(params).forEach(([k, v]) => v && v !== "all" && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: API_HEADERS });
  if (!res.ok) throw new Error("Failed to fetch templates");
  const data = await res.json();
  return Array.isArray(data) ? data : data.templates ?? [];
}

async function saveTemplate(body: Record<string, unknown>) {
  const res = await fetch(API_URL, { method: "POST", headers: API_HEADERS, body: JSON.stringify({ ...body, source: "pp_admin" }) });
  if (!res.ok) throw new Error("Failed to save template");
  return res.json();
}

async function deleteTemplate(id: string) {
  const res = await fetch(API_URL, { method: "DELETE", headers: API_HEADERS, body: JSON.stringify({ id }) });
  if (!res.ok) throw new Error("Failed to delete template");
  return res.json();
}

// ── Multi-select chip component ─────────────────────────────────
function MultiSelect({ options, value, onChange, placeholder }: {
  options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (item: string) => {
    onChange(value.includes(item) ? value.filter(v => v !== item) : [...value, item]);
  };
  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1 min-h-[40px] rounded-lg border border-input bg-background px-3 py-2 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {value.length === 0 && <span className="text-muted-foreground/60 text-sm">{placeholder}</span>}
        {value.map(v => (
          <Badge key={v} variant="secondary" className="text-xs gap-1">
            {v}
            <X className="h-3 w-3 cursor-pointer" onClick={e => { e.stopPropagation(); toggle(v); }} />
          </Badge>
        ))}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border bg-popover shadow-lg p-1">
          {options.map(opt => (
            <div
              key={opt}
              className={`px-3 py-1.5 text-sm rounded cursor-pointer hover:bg-accent ${value.includes(opt) ? "bg-accent/50 font-medium" : ""}`}
              onClick={() => toggle(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────
export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [editing, setEditing] = useState<Template | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", subject: "", preview_text: "", html_content: "",
    category: "custom", project_tags: [] as string[], area_tags: [] as string[],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates({ category: categoryFilter, search, project: projectFilter });
      setTemplates(data);
      setLastSyncTime(new Date());
    } catch {
      toast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, search, projectFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const openEditor = (tpl?: Template) => {
    if (tpl) {
      setEditing(tpl);
      setIsNew(false);
      setForm({
        name: tpl.name, subject: tpl.subject, preview_text: tpl.preview_text || "",
        html_content: tpl.html_content, category: tpl.category,
        project_tags: tpl.project_tags || [], area_tags: tpl.area_tags || [],
      });
    } else {
      setEditing({} as Template);
      setIsNew(true);
      setForm({ name: "", subject: "", preview_text: "", html_content: DEFAULT_HTML, category: "custom", project_tags: [], area_tags: [] });
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.subject) {
      toast({ title: "Validation Error", description: "Name and Subject are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...form };
      if (!isNew && editing?.id) body.id = editing.id;
      await saveTemplate(body);
      toast({ title: isNew ? "Template Created" : "Template Updated", description: "Synced to DealsFlow CRM" });
      setEditing(null);
      load();
    } catch {
      toast({ title: "Error", description: "Failed to save template", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteTemplate(id);
      toast({ title: "Template Deleted" });
      load();
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const handleDuplicate = (tpl: Template) => {
    setEditing({} as Template);
    setIsNew(true);
    setForm({
      name: `${tpl.name} (Copy)`, subject: tpl.subject, preview_text: tpl.preview_text || "",
      html_content: tpl.html_content, category: tpl.category,
      project_tags: tpl.project_tags || [], area_tags: tpl.area_tags || [],
    });
  };

  const toggleFavorite = async (tpl: Template) => {
    try {
      await saveTemplate({ id: tpl.id, is_favorite: !tpl.is_favorite, name: tpl.name, subject: tpl.subject, html_content: tpl.html_content, category: tpl.category, project_tags: tpl.project_tags, area_tags: tpl.area_tags });
      load();
    } catch { /* silent */ }
  };

  // ── EDITOR VIEW ───────────────────────────────────────────────
  if (editing) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          {/* Sync bar */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setEditing(null)}>← Back to Templates</Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              Synced with DealsFlow CRM
              {lastSyncTime && <span>· {lastSyncTime.toLocaleTimeString()}</span>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{isNew ? "New Template" : "Edit Template"}</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save & Sync
              </Button>
            </div>
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Template name" />
            </div>
            <div className="space-y-1.5">
              <Label>Subject Line *</Label>
              <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject" />
            </div>
            <div className="space-y-1.5">
              <Label>Preview Text</Label>
              <Input value={form.preview_text} onChange={e => setForm(p => ({ ...p, preview_text: e.target.value }))} placeholder="Inbox preview text" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c.value !== "all").map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Project Tags</Label>
              <MultiSelect options={PROJECT_OPTIONS} value={form.project_tags} onChange={v => setForm(p => ({ ...p, project_tags: v }))} placeholder="Select projects…" />
            </div>
            <div className="space-y-1.5">
              <Label>Area Tags</Label>
              <MultiSelect options={AREA_OPTIONS} value={form.area_tags} onChange={v => setForm(p => ({ ...p, area_tags: v }))} placeholder="Select areas…" />
            </div>
          </div>

          {/* Split-pane editor */}
          <div className="border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 380px)" }}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">HTML Editor</div>
                  <Textarea
                    value={form.html_content}
                    onChange={e => setForm(p => ({ ...p, html_content: e.target.value }))}
                    className="flex-1 font-mono text-xs rounded-none border-0 resize-none focus-visible:ring-0"
                    style={{ minHeight: "100%" }}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">Live Preview</div>
                  <iframe
                    srcDoc={form.html_content}
                    className="flex-1 w-full bg-white"
                    sandbox="allow-same-origin"
                    title="Email Preview"
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── LIST VIEW ─────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Sync bar */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
          Synced with DealsFlow CRM
          {lastSyncTime && <span>· Last sync {lastSyncTime.toLocaleTimeString()}</span>}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6" /> Email Templates</h1>
            <p className="text-muted-foreground text-sm">Manage email templates synced to DealsFlow CRM</p>
          </div>
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {PROJECT_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No templates found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map(tpl => (
              <Card key={tpl.id} className="group relative hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{tpl.subject}</p>
                    </div>
                    <button onClick={() => toggleFavorite(tpl)} className="p-1 hover:text-yellow-500 transition-colors">
                      <Star className={`h-4 w-4 ${tpl.is_favorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/40"}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">{tpl.category?.replace("_", " ")}</Badge>
                    {tpl.project_tags?.slice(0, 2).map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                    {(tpl.project_tags?.length ?? 0) > 2 && (
                      <Badge variant="secondary" className="text-[10px]">+{tpl.project_tags.length - 2}</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(tpl.updated_at).toLocaleDateString()}</span>
                    {tpl.times_used != null && <span>{tpl.times_used} sends</span>}
                  </div>

                  <div className="flex gap-1 pt-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEditor(tpl)}>
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDuplicate(tpl)}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPreviewTemplate(tpl)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(tpl.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewTemplate?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mb-3">
              <p className="text-sm"><span className="font-medium">Subject:</span> {previewTemplate?.subject}</p>
              {previewTemplate?.preview_text && (
                <p className="text-sm text-muted-foreground">{previewTemplate.preview_text}</p>
              )}
            </div>
            <iframe
              srcDoc={previewTemplate?.html_content || ""}
              className="w-full border rounded-lg bg-white"
              style={{ height: "60vh" }}
              sandbox="allow-same-origin"
              title="Template Preview"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
              <Button onClick={() => { setPreviewTemplate(null); openEditor(previewTemplate!); }}>
                <Edit className="h-4 w-4 mr-2" /> Edit Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #1a1a2e; padding: 30px; text-align: center;">
    <h1 style="color: #f5c542; margin: 0;">Email Title</h1>
  </div>
  <div style="padding: 30px; background: #ffffff;">
    <p style="font-size: 16px; color: #333;">Hi {$name},</p>
    <p style="font-size: 16px; color: #333;">Your message content here.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://presaleproperties.com" style="background: #f5c542; color: #1a1a2e; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Call to Action</a>
    </div>
  </div>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666;">
    <p>Presale Properties | Vancouver, BC</p>
  </div>
</div>`;
