import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, FileText, Plus, Clock, Trash2, Copy,
  ChevronRight, Building2, Star, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavedAsset {
  id: string;
  name: string;
  project_name: string;
  thumbnail_url: string | null;
  form_data: any;
  created_at: string;
  updated_at: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

const CREATE_OPTIONS = [
  {
    key: "project-email",
    title: "Project Email",
    desc: "Hero image, stats, highlights, floor plans, agent card",
    icon: Building2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    badge: "Most Used",
    url: "/admin/email-builder?template=project-email",
  },
  {
    key: "exclusive-offer",
    title: "Exclusive Offer",
    desc: "High-urgency promo with incentive spotlight",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    badge: "Promo",
    url: "/admin/email-builder?template=exclusive-offer",
  },
  {
    key: "blank-email",
    title: "Blank Email",
    desc: "Start from scratch with your own copy",
    icon: Mail,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    badge: null,
    url: "/admin/email-builder?template=blank",
  },
];

export default function AdminMarketingHub() {
  const navigate = useNavigate();
  const [emailAssets, setEmailAssets] = useState<SavedAsset[]>([]);
  const [campaignAssets, setCampaignAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"emails" | "flyers">("emails");

  const fetchAssets = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("campaign_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) {
      setEmailAssets((data as SavedAsset[]).filter((a: any) => a.form_data?._type === "ai-email" || !a.form_data?._type));
      setCampaignAssets((data as SavedAsset[]).filter((a: any) => a.form_data?._type !== "ai-email" && a.form_data?.plans));
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    const { error } = await (supabase as any).from("campaign_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchAssets(); }
    setDeleting(null);
  };

  const handleDuplicate = async (asset: SavedAsset) => {
    const { error } = await (supabase as any).from("campaign_templates").insert({
      name: `${asset.name} (Copy)`,
      project_name: asset.project_name,
      form_data: asset.form_data,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Duplicated"); fetchAssets(); }
  };

  const activeAssets = activeTab === "emails" ? emailAssets : campaignAssets;

  return (
    <AdminLayout>
      <div className="flex flex-col h-full bg-background">

        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Marketing Hub</h1>
              <p className="text-xs text-muted-foreground">Emails, flyers, and campaign assets</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {emailAssets.length + campaignAssets.length} saved
          </Badge>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-8">

            {/* Create new */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Create New</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CREATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => navigate(opt.url)}
                    className="group flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left"
                  >
                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", opt.bg)}>
                      <opt.icon className={cn("h-4 w-4", opt.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold">{opt.title}</span>
                        {opt.badge && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0">{opt.badge}</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  </button>
                ))}
              </div>
            </section>

            {/* Saved work */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Saved Work</p>
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  {(["emails", "flyers"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "px-3 py-1 text-[11px] font-semibold rounded-md transition-all capitalize",
                        activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab} ({tab === "emails" ? emailAssets.length : campaignAssets.length})
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-lg border border-border bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : activeAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl text-center">
                  {activeTab === "emails"
                    ? <Mail className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    : <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />}
                  <p className="text-sm font-medium text-muted-foreground">No {activeTab} saved yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-3 max-w-xs">
                    Create one above and save it to find it here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate(activeTab === "emails" ? "/admin/email-builder?template=project-email" : "/admin/campaign-builder/new")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create {activeTab === "emails" ? "Email" : "Flyer"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activeAssets.map(asset => {
                    const fd = asset.form_data || {};
                    const isEmail = fd._type === "ai-email" || !fd.plans;
                    const openUrl = isEmail
                      ? `/admin/email-builder?saved=${asset.id}`
                      : `/admin/campaign-builder/${asset.id}`;

                    return (
                      <div
                        key={asset.id}
                        className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-accent/20 transition-all"
                      >
                        {/* Icon */}
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          isEmail ? "bg-emerald-500/10" : "bg-violet-500/10"
                        )}>
                          {isEmail
                            ? <Mail className="h-4 w-4 text-emerald-600" />
                            : <FileText className="h-4 w-4 text-violet-600" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{asset.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(fd.projectName || asset.project_name) && (
                              <span className="text-[11px] text-muted-foreground truncate">
                                {fd.projectName || asset.project_name}
                                {fd.city && ` · ${fd.city}`}
                              </span>
                            )}
                            <span className="text-muted-foreground/30 text-[11px]">·</span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 shrink-0">
                              <Clock className="h-3 w-3" />
                              {timeAgo(asset.updated_at)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs"
                            onClick={() => navigate(openUrl)}
                          >
                            Open
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDuplicate(asset)}
                            title="Duplicate"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-destructive"
                            disabled={deleting === asset.id}
                            onClick={() => handleDelete(asset.id, asset.name)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
