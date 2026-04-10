import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Pencil, Copy, Trash2, Eye, MessageSquare, Mail, Phone, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["All", "Email", "WhatsApp", "SMS", "Follow-up"];
const CAT_COLORS: Record<string, string> = {
  Email: "bg-blue-100 text-blue-700",
  WhatsApp: "bg-green-100 text-green-700",
  SMS: "bg-purple-100 text-purple-700",
  "Follow-up": "bg-orange-100 text-orange-700",
};

const MERGE_TAGS = [
  "{{first_name}}", "{{last_name}}", "{{email}}", "{{phone}}",
  "{{project_name}}", "{{agent_name}}", "{{booking_link}}", "{{company_name}}",
];

const SAMPLE: Record<string, string> = {
  "{{first_name}}": "Sarah",
  "{{last_name}}": "Chen",
  "{{email}}": "sarah@example.com",
  "{{phone}}": "(604) 555-1234",
  "{{project_name}}": "The Grand on King",
  "{{agent_name}}": "Uzair Muhammad",
  "{{booking_link}}": "https://presaleproperties.com/book",
  "{{company_name}}": "Presale Properties",
};

type Template = {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  merge_tags: string[] | null;
  is_active: boolean;
  usage_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const emptyDraft = { name: "", category: "Email", subject: "", body: "", merge_tags: MERGE_TAGS };

export default function CrmTemplates() {
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [editTab, setEditTab] = useState<"edit" | "preview">("edit");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["crm-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_templates").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
  });

  const filtered = templates.filter((t) => {
    if (catFilter !== "All" && t.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    }
    return true;
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { name: draft.name, category: draft.category, subject: draft.subject, body: draft.body, merge_tags: draft.merge_tags };
      if (editId) {
        const { error } = await supabase.from("crm_templates").update(payload).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("crm_templates").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-templates"] });
      toast.success(editId ? "Template updated" : "Template created");
      setEditOpen(false);
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-templates"] }); toast.success("Template deleted"); },
  });

  const dup = useMutation({
    mutationFn: async (t: Template) => {
      const { error } = await supabase.from("crm_templates").insert({ name: t.name + " (Copy)", category: t.category, subject: t.subject, body: t.body, merge_tags: t.merge_tags } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-templates"] }); toast.success("Template duplicated"); },
  });

  const openCreate = () => { setEditId(null); setDraft(emptyDraft); setEditTab("edit"); setEditOpen(true); };
  const openEdit = (t: Template) => { setEditId(t.id); setDraft({ name: t.name, category: t.category || "Email", subject: t.subject || "", body: t.body, merge_tags: t.merge_tags || MERGE_TAGS }); setEditTab("edit"); setEditOpen(true); };

  const insertTag = useCallback((tag: string) => {
    const el = bodyRef.current;
    if (!el) { setDraft((d) => ({ ...d, body: d.body + tag })); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newBody = draft.body.slice(0, start) + tag + draft.body.slice(end);
    setDraft((d) => ({ ...d, body: newBody }));
    setTimeout(() => { el.focus(); el.setSelectionRange(start + tag.length, start + tag.length); }, 0);
  }, [draft.body]);

  const renderPreview = (body: string) => {
    let out = body;
    for (const [k, v] of Object.entries(SAMPLE)) out = out.split(k).join(v);
    return out;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground text-sm">Reusable email, WhatsApp, SMS, and follow-up templates</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" />Create Template</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={catFilter} onValueChange={setCatFilter} className="w-auto">
          <TabsList className="bg-muted/50">
            {CATEGORIES.map((c) => (<TabsTrigger key={c} value={c} className="text-xs">{c}</TabsTrigger>))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No templates found</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first template to speed up your outreach.</p>
            <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">Create Template</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setPreviewTemplate(t); setPreviewOpen(true); }}>
              <CardContent className="pt-5 pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge className={`${CAT_COLORS[t.category || "Email"]} text-xs`}>{t.category || "Email"}</Badge>
                  <Badge variant="outline" className="text-[10px]">{t.usage_count} uses</Badge>
                </div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">{t.name}</h3>
                {t.category === "Email" && t.subject && (
                  <p className="text-xs text-muted-foreground truncate">Subject: {t.subject}</p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-3">{t.body.slice(0, 120)}{t.body.length > 120 ? "…" : ""}</p>
                <div className="flex gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dup.mutate(t)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => del.mutate(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewTemplate && <Badge className={CAT_COLORS[previewTemplate.category || "Email"]}>{previewTemplate?.category}</Badge>}
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              {previewTemplate.category === "Email" && previewTemplate.subject && (
                <div className="text-sm"><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{previewTemplate.subject}</span></div>
              )}
              <div className="border rounded-lg p-4 bg-muted/20 whitespace-pre-wrap text-sm">{renderPreview(previewTemplate.body)}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { openEdit(previewTemplate); setPreviewOpen(false); }} className="gap-1"><Pencil className="h-3.5 w-3.5" />Edit</Button>
                <Button variant="outline" size="sm" onClick={() => { dup.mutate(previewTemplate); setPreviewOpen(false); }} className="gap-1"><Copy className="h-3.5 w-3.5" />Duplicate</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Template" : "Create Template"}</DialogTitle>
          </DialogHeader>

          <Tabs value={editTab} onValueChange={(v) => setEditTab(v as any)}>
            <TabsList className="mb-4 bg-muted/50">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview"><Eye className="h-3.5 w-3.5 mr-1" />Preview</TabsTrigger>
            </TabsList>
          </Tabs>

          {editTab === "edit" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Template Name</label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Welcome Email" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              {draft.category === "Email" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line</label>
                  <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="e.g. Welcome to Presale Properties!" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Body</label>
                <Textarea ref={bodyRef} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="min-h-[200px] font-mono text-sm" placeholder="Write your template content..." />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Merge Tags (click to insert)</label>
                <div className="flex flex-wrap gap-1.5">
                  {MERGE_TAGS.map((tag) => (
                    <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-primary/10 text-xs" onClick={() => insertTag(tag)}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {draft.category === "Email" && draft.subject && (
                <div className="text-sm"><span className="text-muted-foreground">Subject:</span> <span className="font-medium">{renderPreview(draft.subject)}</span></div>
              )}
              <div className="border rounded-lg p-4 bg-muted/20 whitespace-pre-wrap text-sm">{renderPreview(draft.body) || "(empty body)"}</div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" disabled={!draft.name || !draft.body} onClick={() => save.mutate()}>
              {editId ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
