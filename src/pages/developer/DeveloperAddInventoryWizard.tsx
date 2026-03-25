import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Search, Building2, CheckCircle2, Loader2,
  Upload, Sparkles, Plus, Trash2, Package, Eye, X,
  Car, Lock, Wind, Star, ChevronRight, Home, FileImage,
  Check, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  status: string;
  featured_image: string | null;
  developer_name: string | null;
}

interface FloorPlanEntry {
  id: string;          // local uuid for list key
  file: File | null;
  fileUrl: string | null;   // uploaded storage URL
  previewUrl: string | null; // blob URL for preview
  extracting: boolean;
  extracted: boolean;
  // AI-extracted / manually entered fields
  unit_number: string;
  unit_type: string;
  beds: string;
  baths: string;
  interior_sqft: string;
  exterior_sqft: string;
  floor_plan_name: string;
  exposure: string;
  // Developer-entered fields
  asking_price: string;
  original_price: string;
  estimated_completion: string;
  deposit_percent: string;
  buyer_agent_commission: string;
  incentives: string;
  // Step 3 – inclusions
  parking: boolean;
  locker: boolean;
  ac_included: boolean;
  custom_features: string[];
  newFeatureText: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEntry = (): FloorPlanEntry => ({
  id: crypto.randomUUID(),
  file: null,
  fileUrl: null,
  previewUrl: null,
  extracting: false,
  extracted: false,
  unit_number: "",
  unit_type: "",
  beds: "",
  baths: "",
  interior_sqft: "",
  exterior_sqft: "",
  floor_plan_name: "",
  exposure: "",
  asking_price: "",
  original_price: "",
  estimated_completion: "",
  deposit_percent: "",
  buyer_agent_commission: "",
  incentives: "",
  parking: false,
  locker: false,
  ac_included: false,
  custom_features: [],
  newFeatureText: "",
});

const statusLabel: Record<string, string> = {
  coming_soon: "Coming Soon",
  registering: "Registering",
  active: "Active",
  sold_out: "Sold Out",
};
const statusStyle: Record<string, string> = {
  coming_soon: "bg-blue-100 text-blue-800 border-blue-200",
  registering: "bg-amber-100 text-amber-800 border-amber-200",
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  sold_out: "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DeveloperAddInventoryWizard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [devProfile, setDevProfile] = useState<{ id: string; company_name: string } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [initDone, setInitDone] = useState(false);

  // Step 1 – project search
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [autoMatched, setAutoMatched] = useState<Project[]>([]);

  // Step 2 – floor plans
  const [plans, setPlans] = useState<FloorPlanEntry[]>([makeEntry()]);

  // Step 3 – submit
  const [submitting, setSubmitting] = useState(false);

  // ── Auth & Init ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/developer/login"); return; }
    init();
  }, [user, authLoading]);

  const init = async () => {
    const { data: dev } = await supabase
      .from("developer_profiles")
      .select("id, company_name, verification_status")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!dev || dev.verification_status !== "approved") { navigate("/developer"); return; }
    setDevProfile(dev);

    // Auto-match projects by company name
    const { data: matched } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, status, featured_image, developer_name")
      .ilike("developer_name", `%${dev.company_name}%`)
      .order("name")
      .limit(10);
    setAutoMatched(matched || []);
    setInitDone(true);
  };

  // ── Step 1 – Search ─────────────────────────────────────────────────────────

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, status, featured_image, developer_name")
      .or(`name.ilike.%${searchQuery}%,developer_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
      .order("name")
      .limit(12);
    setResults(data || []);
    setSearching(false);
  };

  const selectProject = (p: Project) => {
    setSelectedProject(p);
    // scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const proceedToStep2 = () => {
    if (!selectedProject) { toast.error("Please select a project first."); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Step 2 – Floor plans ────────────────────────────────────────────────────

  const updatePlan = (id: string, patch: Partial<FloorPlanEntry>) =>
    setPlans(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

  const removePlan = (id: string) =>
    setPlans(prev => prev.filter(p => p.id !== id));

  const addPlan = () => setPlans(prev => [...prev, makeEntry()]);

  const handleFileSelect = async (planId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    updatePlan(planId, { file, previewUrl, extracting: true, extracted: false });

    try {
      // Upload to storage first
      const ext = file.name.split(".").pop() || "pdf";
      const path = `floor-plans/${devProfile!.id}/${Date.now()}-${planId}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("listing-files")
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("listing-files").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      updatePlan(planId, { fileUrl: publicUrl });

      // Call AI extraction edge function
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("extract-floor-plan", {
        body: { fileUrl: publicUrl, fileName: file.name },
      });

      if (fnErr || !fnData?.success) throw new Error(fnErr?.message || "AI extraction failed");

      const d = fnData.data;
      updatePlan(planId, {
        extracting: false,
        extracted: true,
        unit_number: d.unit_number || "",
        unit_type: d.unit_type || "",
        beds: d.beds != null ? String(d.beds) : "",
        baths: d.baths != null ? String(d.baths) : "",
        interior_sqft: d.interior_sqft != null ? String(d.interior_sqft) : "",
        exterior_sqft: d.exterior_sqft != null ? String(d.exterior_sqft) : "",
        floor_plan_name: d.floor_plan_name || "",
        exposure: d.exposure || "",
      });
      toast.success("Floor plan scanned! Fill in the remaining details.");
    } catch (err: any) {
      updatePlan(planId, { extracting: false });
      toast.error("Couldn't auto-scan this file. Please fill in details manually.");
    }
  };

  const proceedToStep3 = () => {
    for (const p of plans) {
      if (!p.asking_price) { toast.error(`Please enter an asking price for each floor plan.`); return; }
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Step 3 – Features & Submit ──────────────────────────────────────────────

  const addCustomFeature = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan || !plan.newFeatureText.trim()) return;
    updatePlan(planId, {
      custom_features: [...plan.custom_features, plan.newFeatureText.trim()],
      newFeatureText: "",
    });
  };

  const removeCustomFeature = (planId: string, feat: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    updatePlan(planId, { custom_features: plan.custom_features.filter(f => f !== feat) });
  };

  const handleSubmitAll = async () => {
    if (!selectedProject || !devProfile) return;
    setSubmitting(true);

    let successCount = 0;
    for (const plan of plans) {
      const highlights: string[] = [];
      if (plan.parking) highlights.push("Parking Included");
      if (plan.locker) highlights.push("Storage Locker");
      if (plan.ac_included) highlights.push("A/C Included");
      highlights.push(...plan.custom_features);

      const payload = {
        project_id: selectedProject.id,
        agent_id: user!.id,
        title: `Unit ${plan.unit_number || "TBD"} – ${selectedProject.name}`,
        project_name: selectedProject.name,
        city: selectedProject.city,
        unit_number: plan.unit_number || null,
        unit_type: plan.unit_type || null,
        floor_plan_name: plan.floor_plan_name || null,
        beds: parseInt(plan.beds) || 0,
        baths: parseFloat(plan.baths) || 0,
        interior_sqft: parseInt(plan.interior_sqft) || null,
        exterior_sqft: parseInt(plan.exterior_sqft) || null,
        exposure: plan.exposure || null,
        assignment_price: parseFloat(plan.asking_price) || 0,
        original_price: parseFloat(plan.original_price) || null,
        deposit_to_lock: parseFloat(plan.deposit_percent) || null,
        estimated_completion: plan.estimated_completion || null,
        buyer_agent_commission: plan.buyer_agent_commission || null,
        description: plan.incentives || null,
        parking: plan.parking ? "1 Stall Included" : null,
        has_locker: plan.locker,
        highlights: highlights.length ? highlights : null,
        floor_plan_url: plan.fileUrl || null,
        status: "pending_approval",
        is_active: true,
      };

      const { error } = await (supabase as any).from("listings").insert(payload);
      if (!error) successCount++;
      else console.error("Insert error:", error);
    }

    setSubmitting(false);

    if (successCount === plans.length) {
      toast.success(`${successCount} unit${successCount > 1 ? "s" : ""} submitted for review! We'll notify you once approved.`);
      navigate("/developer/projects");
    } else {
      toast.error(`${successCount} of ${plans.length} units saved. Some failed — please try again.`);
    }
  };

  // ── Render guards ────────────────────────────────────────────────────────────

  if (authLoading || !initDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stepProgress = step === 1 ? 33 : step === 2 ? 66 : 100;

  // ── UI ───────────────────────────────────────────────────────────────────────

  return (
    <DeveloperPortalLayout>
      <div className="px-4 md:px-8 py-8 max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <Link to="/developer/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Header + progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-foreground">Add Inventory</h1>
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
          </div>
          <Progress value={stepProgress} className="h-1.5" />
          <div className="flex gap-6">
            {[
              { n: 1, label: "Find Project" },
              { n: 2, label: "Floor Plans" },
              { n: 3, label: "Features & Submit" },
            ].map(({ n, label }) => (
              <div key={n} className={cn("flex items-center gap-1.5 text-xs font-medium", step >= n ? "text-primary" : "text-muted-foreground/50")}>
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border",
                  step > n ? "bg-primary border-primary text-primary-foreground" :
                  step === n ? "border-primary text-primary" : "border-muted-foreground/30 text-muted-foreground/40"
                )}>
                  {step > n ? <Check className="h-3 w-3" /> : n}
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Find your project on PresaleProperties.ca</h2>
              <p className="text-sm text-muted-foreground">Search for your project so we can pre-fill all the building details for you.</p>
            </div>

            {/* Selected project banner */}
            {selectedProject && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedProject.name}</p>
                  <p className="text-xs text-muted-foreground">{[selectedProject.neighborhood, selectedProject.city].filter(Boolean).join(", ")}</p>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => setSelectedProject(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Search bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Search by project name, city, or developer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="h-11 text-sm"
              />
              <Button className="h-11 px-5 shrink-0 gap-1.5 font-semibold" onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </Button>
            </div>

            {/* Search results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Search Results</p>
                {results.map(p => <ProjectRow key={p.id} project={p} selected={selectedProject?.id === p.id} onSelect={() => selectProject(p)} />)}
              </div>
            )}

            {results.length === 0 && searchQuery && !searching && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No results. If your project isn't listed, contact us to add it.
              </p>
            )}

            {/* Auto-matched */}
            {autoMatched.length > 0 && !searchQuery && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Matching your company — {devProfile?.company_name}
                </p>
                {autoMatched.map(p => <ProjectRow key={p.id} project={p} selected={selectedProject?.id === p.id} onSelect={() => selectProject(p)} />)}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                size="lg"
                className="gap-2 font-semibold px-8"
                disabled={!selectedProject}
                onClick={proceedToStep2}
              >
                Next — Upload Floor Plans
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Project context */}
            {selectedProject && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/60">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-sm font-medium text-foreground">{selectedProject.name}</p>
                <span className="text-muted-foreground text-sm">·</span>
                <p className="text-sm text-muted-foreground">{selectedProject.city}</p>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Upload Floor Plans</h2>
              <p className="text-sm text-muted-foreground">Upload each floor plan — our AI will read it and fill in unit details automatically.</p>
            </div>

            {/* Floor plan cards */}
            <div className="space-y-5">
              {plans.map((plan, idx) => (
                <FloorPlanCard
                  key={plan.id}
                  plan={plan}
                  index={idx}
                  canRemove={plans.length > 1}
                  onRemove={() => removePlan(plan.id)}
                  onChange={patch => updatePlan(plan.id, patch)}
                  onFileSelect={file => handleFileSelect(plan.id, file)}
                />
              ))}
            </div>

            {/* Add another */}
            <button
              className="w-full h-12 border-2 border-dashed border-border hover:border-primary/50 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={addPlan}
            >
              <Plus className="h-4 w-4" />
              Add Another Floor Plan
            </button>

            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" className="gap-1.5" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button size="lg" className="gap-2 font-semibold px-8" onClick={proceedToStep3}>
                Next — Features & Inclusions
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">What's included?</h2>
              <p className="text-sm text-muted-foreground">Check what's included in the price for each unit, then submit for review.</p>
            </div>

            <div className="space-y-5">
              {plans.map((plan, idx) => (
                <Card key={plan.id} className="border border-border/70">
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Home className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {plan.unit_number ? `Unit ${plan.unit_number}` : `Floor Plan ${idx + 1}`}
                          {plan.floor_plan_name && ` — ${plan.floor_plan_name}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[plan.unit_type, plan.interior_sqft && `${plan.interior_sqft} sqft`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>

                    {/* Toggle inclusions */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What's included?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { key: "parking", label: "Parking Stall", icon: Car },
                          { key: "locker", label: "Storage Locker", icon: Lock },
                          { key: "ac_included", label: "A/C Included", icon: Wind },
                        ].map(({ key, label, icon: Icon }) => {
                          const active = plan[key as "parking" | "locker" | "ac_included"];
                          return (
                            <button
                              key={key}
                              onClick={() => updatePlan(plan.id, { [key]: !active } as any)}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                                active
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                              )}
                            >
                              <div className={cn(
                                "h-4.5 w-4.5 rounded-full border flex items-center justify-center",
                                active ? "bg-primary border-primary" : "border-muted-foreground/40"
                              )}>
                                {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </div>
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom features */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add more inclusions</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder='e.g. "EV Charging Ready", "Gym Access"...'
                          value={plan.newFeatureText}
                          onChange={e => updatePlan(plan.id, { newFeatureText: e.target.value })}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomFeature(plan.id); } }}
                          className="h-9 text-sm"
                        />
                        <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1" onClick={() => addCustomFeature(plan.id)}>
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </Button>
                      </div>
                      {plan.custom_features.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {plan.custom_features.map(feat => (
                            <span
                              key={feat}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-medium"
                            >
                              <Star className="h-2.5 w-2.5 text-amber-500" />
                              {feat}
                              <button onClick={() => removeCustomFeature(plan.id, feat)} className="ml-0.5 text-muted-foreground hover:text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Review summary */}
            <Card className="border border-border/60 bg-muted/20">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Submission Summary</p>
                <p className="text-sm text-muted-foreground">
                  You're submitting <strong>{plans.length} unit{plans.length > 1 ? "s" : ""}</strong> for <strong>{selectedProject?.name}</strong>.
                  Each unit will be reviewed by our team before going live.
                </p>
                <div className="flex items-start gap-2 pt-1">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">Typical review time is 1–2 business days. You'll be notified by email once approved.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center pt-2">
              <Button variant="ghost" className="gap-1.5" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                size="lg"
                className="gap-2 font-semibold px-8"
                onClick={handleSubmitAll}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  <><Package className="h-4 w-4" /> Submit {plans.length} Unit{plans.length > 1 ? "s" : ""} for Review</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DeveloperPortalLayout>
  );
}

// ─── Project Row ───────────────────────────────────────────────────────────────

function ProjectRow({
  project, selected, onSelect,
}: {
  project: Project;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/40"
      )}
    >
      {/* Thumbnail */}
      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
        {project.featured_image
          ? <img src={project.featured_image} alt={project.name} className="w-full h-full object-cover" />
          : <Building2 className="h-5 w-5 text-muted-foreground/40" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", statusStyle[project.status] || "bg-slate-100 text-slate-600")}>
            {statusLabel[project.status] || project.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[project.neighborhood, project.city].filter(Boolean).join(", ")}
          {project.developer_name && ` · ${project.developer_name}`}
        </p>
      </div>

      {/* Selection indicator */}
      <div className={cn(
        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
        selected ? "border-primary bg-primary" : "border-muted-foreground/30"
      )}>
        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
      </div>
    </button>
  );
}

// ─── Floor Plan Card ───────────────────────────────────────────────────────────

function FloorPlanCard({
  plan, index, canRemove, onRemove, onChange, onFileSelect,
}: {
  plan: FloorPlanEntry;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onChange: (patch: Partial<FloorPlanEntry>) => void;
  onFileSelect: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="border border-border/70 overflow-hidden">
      <CardContent className="p-5 space-y-5">
        {/* Card header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileImage className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">Floor Plan {index + 1}</span>
          </div>
          {canRemove && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Upload zone */}
        {!plan.file ? (
          <button
            className="w-full h-28 border-2 border-dashed border-border hover:border-primary/50 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-muted-foreground hover:text-primary bg-muted/30"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-7 w-7" />
            <p className="text-sm font-medium">Click to upload floor plan</p>
            <p className="text-xs opacity-70">PDF, JPG, PNG supported</p>
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
            {/* Preview thumbnail */}
            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border">
              {plan.previewUrl && plan.file.type.startsWith("image/")
                ? <img src={plan.previewUrl} alt="preview" className="w-full h-full object-cover" />
                : <FileImage className="h-6 w-6 text-muted-foreground" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{plan.file.name}</p>
              {plan.extracting && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="text-xs text-primary">AI scanning floor plan…</span>
                </div>
              )}
              {plan.extracted && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-emerald-600 font-medium">Auto-filled! Review & complete below.</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange({ file: null, previewUrl: null, fileUrl: null, extracted: false, extracting: false })}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelect(f); e.target.value = ""; }}
        />

        {/* AI-extracted fields */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Unit Details {plan.extracted ? "(AI filled — review & edit)" : "(fill in manually or upload floor plan)"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Unit Number</Label>
              <Input placeholder="e.g. 1204" value={plan.unit_number} onChange={e => onChange({ unit_number: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit Type</Label>
              <Input placeholder="e.g. 2 Bed + Den" value={plan.unit_type} onChange={e => onChange({ unit_type: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bedrooms</Label>
              <Input type="number" placeholder="2" value={plan.beds} onChange={e => onChange({ beds: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bathrooms</Label>
              <Input type="number" step="0.5" placeholder="2" value={plan.baths} onChange={e => onChange({ baths: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Interior sqft</Label>
              <Input type="number" placeholder="750" value={plan.interior_sqft} onChange={e => onChange({ interior_sqft: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Balcony / Exterior sqft</Label>
              <Input type="number" placeholder="90" value={plan.exterior_sqft} onChange={e => onChange({ exterior_sqft: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Exposure</Label>
              <Input placeholder="e.g. South-East" value={plan.exposure} onChange={e => onChange({ exposure: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Plan Name</Label>
              <Input placeholder="e.g. Plan B" value={plan.floor_plan_name} onChange={e => onChange({ floor_plan_name: e.target.value })} className="h-9 text-sm" />
            </div>
          </div>
        </div>

        {/* Developer-entered fields */}
        <div className="space-y-3 border-t border-border/60 pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pricing & Terms</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">Asking Price <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input type="number" placeholder="749,900" value={plan.asking_price} onChange={e => onChange({ asking_price: e.target.value })} className="h-9 text-sm pl-6" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Original Price (optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input type="number" placeholder="799,900" value={plan.original_price} onChange={e => onChange({ original_price: e.target.value })} className="h-9 text-sm pl-6" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estimated Completion</Label>
              <Input placeholder="e.g. Spring 2027" value={plan.estimated_completion} onChange={e => onChange({ estimated_completion: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Deposit Required (%)</Label>
              <Input type="number" placeholder="10" value={plan.deposit_percent} onChange={e => onChange({ deposit_percent: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Buyer's Agent Commission</Label>
              <Input placeholder='e.g. "2.5%" or "$15,000"' value={plan.buyer_agent_commission} onChange={e => onChange({ buyer_agent_commission: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1 col-span-2">
              <Label className="text-xs">Incentives / Special Offers</Label>
              <Input placeholder='e.g. "Free assignment + 5% deposit"' value={plan.incentives} onChange={e => onChange({ incentives: e.target.value })} className="h-9 text-sm" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
