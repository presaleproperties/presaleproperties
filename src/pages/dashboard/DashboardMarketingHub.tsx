import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail, FileText, Plus, Clock, Trash2, Copy,
  ChevronRight, Building2, Star, Megaphone, ExternalLink,
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
  user_id: string | null;
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

function getPreviewImage(asset: SavedAsset): string | null {
  return asset.thumbnail_url || asset.form_data?.heroImage || null;
}

function getSubjectLine(asset: SavedAsset): string | null {
  return asset.form_data?.copy?.subjectLine || asset.form_data?.subject || null;
}

function getDisplayName(asset: SavedAsset): string {
  return asset.form_data?.copy?.subjectLine || asset.name;
}

const CREATE_OPTIONS = [
  {
    key: "project-email",
    title: "Project Email",
    desc: "Hero image, stats, highlights, floor plans",
    icon: Building2,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
    badge: "Most Used",
    url: "/dashboard/email-builder?template=project-email",
  },
  {
    key: "exclusive-offer",
    title: "Exclusive Offer",
    desc: "High-urgency promo with incentive spotlight",
    icon: Star,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
    badge: "Promo",
    url: "/dashboard/email-builder?template=exclusive-offer",
  },
  {
    key: "blank-email",
    title: "Blank Email",
    desc: "Start from scratch",
    icon: Mail,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    badge: null,
    url: "/dashboard/email-builder?template=blank",
  },
];

export default function DashboardMarketingHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assets, setAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adminTemplates, setAdminTemplates] = useState<SavedAsset[]>([]);
  const [importing, setImporting] = useState<string | null>(null);

  const fetchAssets = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("campaign_templates")
      .select("*")
      .order("updated_at", { ascending: false });

    if (data) {
      const all = data as SavedAsset[];
      setAssets(all.filter((a) => a.user_id === user.id));
      setAdminTemplates(all.filter((a) => !a.user_id));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAssets();
  }, [user]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await (supabase as any).from("campaign_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchAssets(); }
    setDeleting(null);
  };

  const handleDuplicate = async (asset: SavedAsset) => {
    if (!user) return;
    const { error } = await (supabase as any).from("campaign_templates").insert({
      name: `${asset.name} (Copy)`,
      project_name: asset.project_name,
      form_data: asset.form_data,
      user_id: user.id,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Duplicated"); fetchAssets(); }
  };

  const handleImport = async (asset: SavedAsset) => {
    if (!user) return;
    setImporting(asset.id);
    const { error } = await (supabase as any).from("campaign_templates").insert({
      name: asset.name,
      project_name: asset.project_name,
      form_data: asset.form_data,
      thumbnail_url: asset.thumbnail_url,
      user_id: user.id,
    });
    if (error) toast.error("Failed to import");
    else { toast.success("Template imported to your collection"); fetchAssets(); }
    setImporting(null);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-5 shrink-0">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Megaphone className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Marketing Hub</h1>
                <p className="text-xs text-muted-foreground">Create and manage your email campaigns</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] px-2.5 py-1">
              {assets.length} saved
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* Create new */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Create New</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CREATE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => navigate(opt.url)}
                    className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/30 transition-all text-left"
                  >
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", opt.bg)}>
                      <opt.icon className={cn("h-4.5 w-4.5", opt.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold">{opt.title}</span>
                        {opt.badge && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 py-0">{opt.badge}</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{opt.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </section>

            {/* Saved work */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                Your Saved Templates
              </p>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-muted/30 animate-pulse">
                      <div className="h-40 bg-muted/50 rounded-t-xl" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted/50 rounded w-3/4" />
                        <div className="h-3 bg-muted/50 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
                  <Mail className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No templates saved yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-4 max-w-xs">
                    Create one above and save it to find it here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate("/dashboard/email-builder?template=project-email")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Email
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assets.map(asset => {
                    const preview = getPreviewImage(asset);
                    const subject = getSubjectLine(asset);
                    const openUrl = `/dashboard/email-builder?saved=${asset.id}`;

                    return (
                      <div
                        key={asset.id}
                        className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        {/* Preview image */}
                        <div
                          className="h-44 bg-muted/30 relative cursor-pointer overflow-hidden"
                          onClick={() => navigate(openUrl)}
                        >
                          {preview ? (
                            <img
                              src={preview}
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Mail className="h-10 w-10 text-muted-foreground/15" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button size="sm" variant="secondary" className="gap-1.5 shadow-lg">
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open
                            </Button>
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge className="text-[9px] px-1.5 py-0.5 shadow-sm bg-emerald-500/90 text-white hover:bg-emerald-500/90">
                              Email
                            </Badge>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3.5">
                          <p className="text-sm font-semibold truncate mb-0.5">{getDisplayName(asset)}</p>
                          {subject && subject !== getDisplayName(asset) && (
                            <p className="text-[11px] text-muted-foreground truncate mb-1.5">
                              Subject: {subject}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                            <Clock className="h-3 w-3" />
                            {timeAgo(asset.updated_at)}
                            {(asset.form_data?.projectName || asset.project_name) && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="truncate">{asset.form_data?.projectName || asset.project_name}</span>
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 text-xs gap-1.5"
                              onClick={() => navigate(openUrl)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleDuplicate(asset)}
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deleting === asset.id}
                              onClick={() => handleDelete(asset.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            {/* Admin shared templates */}
            {adminTemplates.length > 0 && (
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                  Company Templates
                </p>
                <p className="text-xs text-muted-foreground/60 mb-4">
                  Import admin-created templates into your collection
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {adminTemplates.map(asset => {
                    const preview = getPreviewImage(asset);
                    return (
                      <div
                        key={asset.id}
                        className="group relative rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <div className="h-44 bg-muted/30 relative overflow-hidden">
                          {preview ? (
                            <img
                              src={preview}
                              alt={asset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Mail className="h-10 w-10 text-muted-foreground/15" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2">
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0.5 shadow-sm bg-card/90">
                              Admin
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3.5">
                          <p className="text-sm font-semibold truncate mb-0.5">{getDisplayName(asset)}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                            <Clock className="h-3 w-3" />
                            {timeAgo(asset.updated_at)}
                            {(asset.form_data?.projectName || asset.project_name) && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="truncate">{asset.form_data?.projectName || asset.project_name}</span>
                              </>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              className="w-full h-8 text-xs gap-1.5"
                              disabled={importing === asset.id}
                              onClick={() => handleImport(asset)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {importing === asset.id ? "Importing..." : "Import to My Templates"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
