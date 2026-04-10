import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Package, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood?: string | null;
}

export interface CampaignBundle {
  id: string;
  name: string;
  primary_project_id: string;
  alt_project_1_id: string;
  alt_project_2_id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (bundle: CampaignBundle) => void;
  userId?: string;
}

export function CampaignBundleSelector({ open, onClose, onSelect, userId }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [bundles, setBundles] = useState<CampaignBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"list" | "create">("list");

  // Create form
  const [bundleName, setBundleName] = useState("");
  const [primaryId, setPrimaryId] = useState("");
  const [alt1Id, setAlt1Id] = useState("");
  const [alt2Id, setAlt2Id] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const [projRes, bundleRes] = await Promise.all([
        supabase.from("presale_projects" as any).select("id, name, city, neighborhood").order("name"),
        supabase.from("campaign_bundles" as any).select("*").order("updated_at", { ascending: false }),
      ]);
      if (projRes.data) setProjects(projRes.data as any);
      if (bundleRes.data) setBundles(bundleRes.data as any);
      setLoading(false);
      setMode(bundleRes.data?.length ? "list" : "create");
    })();
  }, [open]);

  const handleCreate = async () => {
    if (!bundleName.trim() || !primaryId || !alt1Id || !alt2Id) {
      toast.error("Fill in all fields");
      return;
    }
    if (new Set([primaryId, alt1Id, alt2Id]).size < 3) {
      toast.error("Select 3 different projects");
      return;
    }
    setCreating(true);
    const payload: any = {
      name: bundleName.trim(),
      primary_project_id: primaryId,
      alt_project_1_id: alt1Id,
      alt_project_2_id: alt2Id,
    };
    if (userId) payload.user_id = userId;
    const { data, error } = await supabase.from("campaign_bundles" as any)
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      toast.error("Failed to create bundle");
      setCreating(false);
      return;
    }
    toast.success("Campaign bundle created!");
    onSelect(data as any);
    setCreating(false);
  };

  if (!open) return null;

  const getProjectName = (id: string) => projects.find(p => p.id === id)?.name || "Unknown";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-bold">Campaign Bundle</h2>
            <p className="text-xs text-muted-foreground">Select 3 projects for a 12-week email sequence</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : mode === "list" && bundles.length > 0 ? (
            <>
              <div className="space-y-2">
                {bundles.map(b => (
                  <button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className="w-full text-left px-4 py-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{b.name}</span>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Select →</span>
                    </div>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        1. {getProjectName(b.primary_project_id)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        2. {getProjectName(b.alt_project_1_id)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        3. {getProjectName(b.alt_project_2_id)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => setMode("create")}>
                <Plus className="h-4 w-4" /> Create New Bundle
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs font-medium">Bundle Name</Label>
                <Input
                  value={bundleName}
                  onChange={e => setBundleName(e.target.value)}
                  placeholder="e.g. Abbotsford Q3 2026"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-xs font-medium">Primary Project <span className="text-muted-foreground font-normal">— Week 1 VIP Launch</span></Label>
                <Select value={primaryId} onValueChange={setPrimaryId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select primary project…" /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {p.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Alternative Project 2 <span className="text-muted-foreground font-normal">— Week 4 Deep Dive</span></Label>
                <Select value={alt1Id} onValueChange={setAlt1Id}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select second project…" /></SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => p.id !== primaryId).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {p.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Alternative Project 3 <span className="text-muted-foreground font-normal">— Week 7 Deep Dive</span></Label>
                <Select value={alt2Id} onValueChange={setAlt2Id}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select third project…" /></SelectTrigger>
                  <SelectContent>
                    {projects.filter(p => p.id !== primaryId && p.id !== alt1Id).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} · {p.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                {bundles.length > 0 && (
                  <Button variant="outline" className="flex-1" onClick={() => setMode("list")}>Back</Button>
                )}
                <Button className="flex-1 gap-2" onClick={handleCreate} disabled={creating || !bundleName.trim() || !primaryId || !alt1Id || !alt2Id}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
                  Create Bundle
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
