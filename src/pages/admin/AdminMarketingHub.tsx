import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { syncTemplateToDealsFlow } from "@/lib/syncTemplateToDealsFlow";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  Mail, FileText, Plus, ChevronRight, Building2, Star, Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SavedAsset } from "@/lib/emailTemplateHelpers";
import {
  TemplateCard,
  TemplatePreviewDialog,
  TemplateQuickSendDialog,
} from "@/components/admin/SharedTemplateComponents";

const CREATE_OPTIONS = [
  {
    key: "project-email",
    title: "Project Email",
    desc: "Hero image, stats, highlights, floor plans",
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
    desc: "Start from scratch",
    icon: Mail,
    color: "text-muted-foreground",
    bg: "bg-muted/40",
    badge: null,
    url: "/admin/email-builder?template=blank",
  },
];

export default function AdminMarketingHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emailAssets, setEmailAssets] = useState<SavedAsset[]>([]);
  const [campaignAssets, setCampaignAssets] = useState<SavedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"emails" | "flyers">("emails");
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [sendAsset, setSendAsset] = useState<SavedAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<SavedAsset | null>(null);

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

  const handleDelete = async (id: string) => {
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
      user_id: user?.id || null,
    });
    if (error) toast.error("Failed to duplicate");
    else { toast.success("Duplicated"); fetchAssets(); }
  };

  const handleRename = async (id: string, newName: string) => {
    const { error } = await (supabase as any).from("campaign_templates").update({ name: newName }).eq("id", id);
    if (error) toast.error("Failed to rename");
    else {
      toast.success("Renamed");
      // Re-sync renamed template to DealsFlow
      const asset = [...emailAssets, ...campaignAssets].find(a => a.id === id);
      if (asset) {
        const html = (await import("@/lib/emailTemplateHelpers")).getSavedHtml(asset);
        syncTemplateToDealsFlow({
          name: newName,
          subject: asset.form_data?.vars?.subjectLine || newName,
          html,
          project: asset.form_data?.vars?.projectName || asset.project_name || undefined,
        });
      }
      fetchAssets();
    }
  };

  const filteredAssets = useMemo(() => {
    const base = activeTab === "emails" ? emailAssets : campaignAssets;
    if (!activeTagFilter) return base;
    return base.filter(a => a.tags?.includes(activeTagFilter));
  }, [activeTab, emailAssets, campaignAssets, activeTagFilter]);

  return (
    <AdminLayout>
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
                <p className="text-xs text-muted-foreground">Create and manage email campaigns</p>
              </div>
            </div>
            <Badge variant="outline" className="text-[11px] px-2.5 py-1">
              {emailAssets.length + campaignAssets.length} saved
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
              <div className="flex items-center justify-between mb-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-muted/30 animate-pulse">
                      <div className="h-44 bg-muted/50 rounded-t-xl" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted/50 rounded w-3/4" />
                        <div className="h-3 bg-muted/50 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-xl text-center">
                  {activeTab === "emails"
                    ? <Mail className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    : <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />}
                  <p className="text-sm font-medium text-muted-foreground">No {activeTab} saved yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-4 max-w-xs">
                    Create one above and save it to find it here.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => navigate("/admin/email-builder?template=project-email")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create {activeTab === "emails" ? "Email" : "Flyer"}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssets.map(asset => (
                    <TemplateCard
                      key={asset.id}
                      asset={asset}
                      onSend={setSendAsset}
                      onPreview={setPreviewAsset}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onRename={handleRename}
                      deleting={deleting}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <TemplateQuickSendDialog
        asset={sendAsset}
        open={!!sendAsset}
        onOpenChange={(v) => { if (!v) setSendAsset(null); }}
        onSent={fetchAssets}
      />

      <TemplatePreviewDialog
        asset={previewAsset}
        open={!!previewAsset}
        onOpenChange={(v) => { if (!v) setPreviewAsset(null); }}
      />
    </AdminLayout>
  );
}
