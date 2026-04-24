import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DeveloperPortalLayout } from "@/components/developer/DeveloperPortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft, Loader2, Plus, Trash2, Home, Edit2, CheckCircle2,
  Clock, Package, DollarSign, Maximize2, Layers, Eye, ExternalLink,
  Building2, AlertCircle,
} from "lucide-react";

const unitSchema = z.object({
  unit_number: z.string().min(1, "Unit number is required"),
  unit_type: z.string().optional(),
  floor_level: z.coerce.number().optional(),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  interior_sqft: z.coerce.number().optional(),
  exterior_sqft: z.coerce.number().optional(),
  assignment_price: z.coerce.number().min(1, "Price is required"),
  original_price: z.coerce.number().optional(),
  parking: z.string().optional(),
  exposure: z.string().optional(),
  estimated_completion: z.string().optional(),
  description: z.string().optional(),
  buyer_agent_commission: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface Unit {
  id: string;
  unit_number: string;
  unit_type: string | null;
  floor_level: number | null;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  exterior_sqft: number | null;
  assignment_price: number;
  original_price: number | null;
  parking: string | null;
  exposure: string | null;
  estimated_completion: string | null;
  status: string;
  description: string | null;
  buyer_agent_commission: string | null;
}

interface Project {
  id: string;
  name: string;
  city: string;
  neighborhood: string | null;
  status: string;
  is_published: boolean;
  featured_image: string | null;
  developer_name: string | null;
}

const statusBadge = (status: string) => {
  if (status === "published") return "bg-success-soft text-success-strong border-success/30";
  if (status === "pending_approval") return "bg-warning-soft text-warning-strong border-warning/30";
  if (status === "sold") return "bg-muted text-foreground border-border";
  if (status === "rejected") return "bg-danger-soft text-danger-strong border-danger/30";
  return "bg-muted text-foreground";
};

const statusText: Record<string, string> = {
  published: "Live",
  pending_approval: "Pending Review",
  sold: "Sold",
  rejected: "Rejected",
};

export default function DeveloperInventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: { beds: 1, baths: 1 },
  });

  useEffect(() => {
    if (!authLoading && !user) { navigate("/developer/login"); return; }
    if (user) init();
  }, [user, authLoading]);

  const init = async () => {
    const { data: dev } = await supabase
      .from("developer_profiles")
      .select("id, verification_status")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!dev || dev.verification_status !== "approved") { navigate("/developer"); return; }

    // Allow projects linked by developer_id OR by developer_name match
    const { data: proj } = await supabase
      .from("presale_projects")
      .select("id, name, city, neighborhood, status, is_published, featured_image, developer_name")
      .eq("id", projectId!)
      .maybeSingle();

    if (!proj) { navigate("/developer/projects"); return; }

    // Verify ownership: must be linked OR name matches
    const { data: devProfile } = await supabase
      .from("developer_profiles")
      .select("company_name")
      .eq("id", dev.id)
      .maybeSingle();

    const isLinked = (proj as any).developer_id === dev.id;
    const nameMatches = devProfile?.company_name &&
      proj.developer_name?.toLowerCase().includes(devProfile.company_name.toLowerCase());

    if (!isLinked && !nameMatches) { navigate("/developer/projects"); return; }

    setProject(proj as any);
    await fetchUnits();
    setLoading(false);
  };

  const fetchUnits = async () => {
    const { data } = await (supabase as any)
      .from("listings")
      .select("id, unit_number, unit_type, floor_level, beds, baths, interior_sqft, exterior_sqft, assignment_price, original_price, parking, exposure, estimated_completion, status, description, buyer_agent_commission")
      .eq("project_id", projectId)
      .order("floor_level", { ascending: true })
      .order("unit_number", { ascending: true });
    setUnits(data || []);
  };

  const openAdd = () => {
    setEditUnit(null);
    reset({ beds: 1, baths: 1 });
    setShowForm(true);
  };

  const openEdit = (unit: Unit) => {
    setEditUnit(unit);
    Object.keys(unit).forEach(k => {
      const val = (unit as any)[k];
      if (val !== null && val !== undefined) setValue(k as any, val);
    });
    setShowForm(true);
  };

  const onSubmit = async (data: UnitFormData) => {
    setSaving(true);
    try {
      const payload = {
        project_id: projectId,
        agent_id: user!.id,
        unit_number: data.unit_number,
        title: `Unit ${data.unit_number} – ${project?.name}`,
        project_name: project?.name || "",
        city: project?.city || "",
        unit_type: data.unit_type || null,
        floor_level: data.floor_level || null,
        beds: data.beds,
        baths: data.baths,
        interior_sqft: data.interior_sqft || null,
        exterior_sqft: data.exterior_sqft || null,
        assignment_price: data.assignment_price,
        original_price: data.original_price || null,
        parking: data.parking || null,
        exposure: data.exposure || null,
        estimated_completion: data.estimated_completion || null,
        description: data.description || null,
        buyer_agent_commission: data.buyer_agent_commission || null,
        status: "pending_approval",
        is_active: true,
      };

      if (editUnit) {
        const { error } = await (supabase as any).from("listings").update(payload).eq("id", editUnit.id);
        if (error) throw error;
        toast.success("Unit updated — pending re-review.");
      } else {
        const { error } = await (supabase as any).from("listings").insert(payload);
        if (error) throw error;
        toast.success(`Unit ${data.unit_number} submitted for review!`);
      }

      reset({ beds: 1, baths: 1 });
      setShowForm(false);
      setEditUnit(null);
      await fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Failed to save unit.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUnit = async (unitId: string) => {
    setDeletingId(unitId);
    const { error } = await (supabase as any).from("listings").delete().eq("id", unitId);
    if (error) toast.error("Failed to remove unit.");
    else { toast.success("Unit removed."); await fetchUnits(); }
    setDeletingId(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = filterStatus === "all" ? units : units.filter(u => u.status === filterStatus);

  const stats = {
    total: units.length,
    live: units.filter(u => u.status === "published").length,
    pending: units.filter(u => u.status === "pending_approval").length,
    sold: units.filter(u => u.status === "sold").length,
  };

  return (
    <DeveloperPortalLayout>
      <div className="px-4 md:px-8 py-8 max-w-5xl mx-auto space-y-6">

        {/* Back */}
        <Link to="/developer/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Project header */}
        {project && (
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0">
              {project.featured_image ? (
                <img src={project.featured_image} alt={project.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground truncate">{project.name}</h1>
                {project.is_published && (
                  <Badge variant="outline" className="text-[10px] text-success-strong border-success/30 bg-success-soft">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Live on Site
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {[project.neighborhood, project.city].filter(Boolean).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {project.is_published && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => window.open(`/presale-projects/${projectId}`, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Listing
                </Button>
              )}
              <Button size="sm" className="h-8 text-xs gap-1.5 font-semibold shadow-gold" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" />
                Add Unit
              </Button>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Units", value: stats.total, icon: Package, color: "text-foreground", bg: "bg-muted/50" },
            { label: "Live", value: stats.live, icon: CheckCircle2, color: "text-success", bg: "bg-success-soft" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-warning", bg: "bg-warning-soft" },
            { label: "Sold", value: stats.sold, icon: DollarSign, color: "text-muted-foreground", bg: "bg-muted" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border border-border/60">
              <CardContent className={`p-3 flex items-center gap-3 ${bg} rounded-xl`}>
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter + table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Inventory</h2>
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{filtered.length}</Badge>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                <SelectItem value="published">Live</SelectItem>
                <SelectItem value="pending_approval">Pending Review</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <Card className="border border-dashed border-border bg-muted/20">
              <CardContent className="py-14 text-center">
                <Home className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground mb-1">No units yet</p>
                <p className="text-xs text-muted-foreground mb-5">
                  Add your unsold inventory — each unit will be reviewed before going live.
                </p>
                <Button size="sm" className="gap-1.5 shadow-gold font-semibold" onClick={openAdd}>
                  <Plus className="h-4 w-4" />
                  Add First Unit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map(unit => (
                <Card key={unit.id} className="border border-border/60 hover:shadow-sm transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Unit icon */}
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Home className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Primary info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">Unit {unit.unit_number}</span>
                          {unit.unit_type && <span className="text-xs text-muted-foreground">{unit.unit_type}</span>}
                          {unit.floor_level && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Layers className="h-2.5 w-2.5" /> Floor {unit.floor_level}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span>{unit.beds}bd · {unit.baths}ba</span>
                          {unit.interior_sqft && (
                            <span className="flex items-center gap-0.5">
                              <Maximize2 className="h-2.5 w-2.5" /> {unit.interior_sqft.toLocaleString()} sqft
                            </span>
                          )}
                          {unit.exposure && <span>{unit.exposure}</span>}
                          {unit.parking && <span>{unit.parking}</span>}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-sm">
                          ${unit.assignment_price.toLocaleString()}
                        </p>
                        {unit.original_price && (
                          <p className="text-[10px] text-muted-foreground line-through">
                            ${unit.original_price.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${statusBadge(unit.status)}`}>
                        {unit.status === "rejected" && <AlertCircle className="h-2.5 w-2.5 mr-1" />}
                        {statusText[unit.status] || unit.status}
                      </Badge>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(unit)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteUnit(unit.id)}
                          disabled={deletingId === unit.id}
                        >
                          {deletingId === unit.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />
                          }
                        </Button>
                      </div>
                    </div>

                    {/* Rejection reason */}
                    {unit.status === "rejected" && (
                      <div className="mt-3 rounded-lg bg-danger-soft border border-danger/30 px-3 py-2 text-xs text-danger-strong flex items-start gap-2">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>This unit was rejected. Edit it and resubmit for review.</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Process note */}
        <Card className="border border-border/40 bg-muted/20">
          <CardContent className="p-4 flex items-start gap-3">
            <Eye className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p className="font-medium text-foreground">How it works</p>
              <p>Units you add are submitted for review. Once approved, they appear live on your project page for agents and buyers to see.</p>
              <p>Changes to existing units also go through a quick re-review to ensure accuracy.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Unit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) { setShowForm(false); setEditUnit(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editUnit ? "Edit Unit" : "Add Unit"}</DialogTitle>
            <DialogDescription>
              {project?.name} · {editUnit ? "Update unit details below" : "Fill in the details for this unsold unit"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
            {/* Row 1: Unit # / Type / Floor */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium">Unit Number *</Label>
                <Input {...register("unit_number")} placeholder="401" className="mt-1 h-9 text-sm" />
                {errors.unit_number && <p className="text-destructive text-[11px] mt-0.5">{errors.unit_number.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-medium">Unit Type</Label>
                <Input {...register("unit_type")} placeholder="1BR, 2BR+Den…" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium">Floor Level</Label>
                <Input {...register("floor_level")} type="number" placeholder="4" className="mt-1 h-9 text-sm" />
              </div>
            </div>

            {/* Row 2: Beds / Baths / Exposure */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium">Bedrooms *</Label>
                <Input {...register("beds")} type="number" min={0} step={1} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium">Bathrooms *</Label>
                <Input {...register("baths")} type="number" min={0} step={0.5} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium">Exposure</Label>
                <Input {...register("exposure")} placeholder="South, NW…" className="mt-1 h-9 text-sm" />
              </div>
            </div>

            {/* Row 3: sqft */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Interior sqft</Label>
                <Input {...register("interior_sqft")} type="number" placeholder="750" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium">Exterior sqft (balcony)</Label>
                <Input {...register("exterior_sqft")} type="number" placeholder="80" className="mt-1 h-9 text-sm" />
              </div>
            </div>

            {/* Row 4: Prices */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Asking Price ($) *</Label>
                <Input {...register("assignment_price")} type="number" placeholder="699000" className="mt-1 h-9 text-sm" />
                {errors.assignment_price && <p className="text-destructive text-[11px] mt-0.5">{errors.assignment_price.message}</p>}
              </div>
              <div>
                <Label className="text-xs font-medium">Original Price ($)</Label>
                <Input {...register("original_price")} type="number" placeholder="750000" className="mt-1 h-9 text-sm" />
              </div>
            </div>

            {/* Row 5: Parking / Completion / Commission */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium">Parking</Label>
                <Input {...register("parking")} placeholder="1 stall included" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium">Est. Completion</Label>
                <Input {...register("estimated_completion")} placeholder="Q4 2025" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs font-medium">Buyer Agent Commission</Label>
                <Input {...register("buyer_agent_commission")} placeholder="2.5%" className="mt-1 h-9 text-sm" />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs font-medium">Unit Notes / Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Corner unit with panoramic views, upgraded finishes…"
                rows={3}
                className="mt-1 text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={saving} className="font-semibold shadow-gold gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {editUnit ? "Save Changes" : "Submit for Review"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); setEditUnit(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DeveloperPortalLayout>
  );
}
