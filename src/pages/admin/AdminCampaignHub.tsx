import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, FileText, Clock, Trash2, Copy, Sparkles, ChevronRight,
  LayoutGrid, FolderOpen, Wand2, Download, Building2
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CampaignTemplate {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
}

export default function AdminCampaignHub() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaign_templates" as any)
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setTemplates(data as unknown as CampaignTemplate[]);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    const { error } = await supabase.from("campaign_templates" as any).delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); }
    else { toast.success("Template deleted"); await fetchTemplates(); }
    setDeleting(null);
  };

  const handleDuplicate = async (template: CampaignTemplate) => {
    const { error } = await supabase.from("campaign_templates" as any).insert({
      name: `${template.name} (Copy)`,
      project_name: template.project_name,
      form_data: template.form_data,
    });
    if (error) { toast.error("Failed to duplicate"); }
    else { toast.success("Template duplicated"); await fetchTemplates(); }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-background">
        {/* ── Top header bar ── */}
        <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Campaign Builder</h1>
              <p className="text-xs text-muted-foreground">Create stunning presale one-pagers & brochures</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/admin/campaign-builder/new")}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        </div>

        {/* ── Stats bar ── */}
        <div className="border-b border-border bg-muted/30 px-6 py-3 flex items-center gap-6 shrink-0">
          {[
            { icon: LayoutGrid, label: "Total Templates", value: templates.length },
            { icon: FolderOpen, label: "Saved This Month", value: templates.filter(t => new Date(t.created_at) > new Date(Date.now() - 30 * 86400000)).length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}:</span>
              <span className="text-sm font-bold">{value}</span>
            </div>
          ))}
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 overflow-auto p-6">

          {/* Quick start */}
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Quick Start</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Wand2,
                  title: "Blank Campaign",
                  desc: "Start from scratch with a clean slate",
                  color: "from-violet-500 to-violet-700",
                  action: () => navigate("/admin/campaign-builder/new"),
                },
                {
                  icon: Building2,
                  title: "From Project",
                  desc: "Auto-fill from an existing presale project",
                  color: "from-blue-500 to-blue-700",
                  action: () => navigate("/admin/campaign-builder/new?mode=project"),
                },
                {
                  icon: FileText,
                  title: "Duplicate Template",
                  desc: "Clone your best-performing one-pager",
                  color: "from-amber-500 to-amber-700",
                  action: () => templates[0] ? handleDuplicate(templates[0]) : toast.info("No templates saved yet"),
                },
              ].map(({ icon: Icon, title, desc, color, action }) => (
                <button
                  key={title}
                  onClick={action}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left"
                >
                  <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform", color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

          {/* Saved templates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Saved Templates</h2>
              <Badge variant="outline" className="text-[10px]">{templates.length} templates</Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                <Sparkles className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No templates saved yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Build a campaign and save it as a template to re-use it anytime.</p>
                <Button onClick={() => navigate("/admin/campaign-builder/new")} variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create First Campaign
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => {
                  const formData = template.form_data || {};
                  const planCount = formData.planCount || 0;
                  const hasFloorPlans = (formData.plans || []).filter((p: any) => p.floorPlanUrl).length;

                  return (
                    <div
                      key={template.id}
                      className="group relative rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
                    >
                      {/* Thumbnail / preview strip */}
                      <div className="h-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
                        {formData.heroImage ? (
                          <img src={formData.heroImage} alt="" className="w-full h-full object-cover opacity-60" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="h-8 w-8 text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <p className="text-white text-sm font-bold truncate">{formData.projectName || template.project_name || "Untitled"}</p>
                          {formData.city && <p className="text-white/60 text-[10px] truncate">{formData.city}</p>}
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className="bg-amber-500/90 rounded-full px-2 py-0.5 text-[9px] font-bold text-white">VIP</div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{template.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">{timeAgo(template.updated_at)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {planCount > 0 && (
                              <Badge variant="secondary" className="text-[9px] h-5">{planCount} plans</Badge>
                            )}
                            {hasFloorPlans > 0 && (
                              <Badge variant="outline" className="text-[9px] h-5">{hasFloorPlans} FP</Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => navigate(`/admin/campaign-builder/${template.id}`)}
                          >
                            <Download className="h-3 w-3" /> Open & Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            title="Duplicate"
                            onClick={() => handleDuplicate(template)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0 hover:border-destructive hover:text-destructive"
                            title="Delete"
                            disabled={deleting === template.id}
                            onClick={() => handleDelete(template.id, template.name)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
