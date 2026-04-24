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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Trash2, Building2, Home } from "lucide-react";
import { toast } from "sonner";

const unitSchema = z.object({
  unit_number: z.string().min(1, "Unit number is required"),
  unit_type: z.string().optional(),
  floor_level: z.coerce.number().optional(),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  interior_sqft: z.coerce.number().optional(),
  exterior_sqft: z.coerce.number().optional(),
  assignment_price: z.coerce.number().min(0, "Price is required"),
  original_price: z.coerce.number().optional(),
  parking: z.string().optional(),
  exposure: z.string().optional(),
  estimated_completion: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface Unit {
  id: string;
  unit_number: string;
  beds: number;
  baths: number;
  interior_sqft: number | null;
  assignment_price: number;
  status: string;
}

export default function DeveloperUnitsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [projectName, setProjectName] = useState("");
  const [developerProfileId, setDeveloperProfileId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UnitFormData>({
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
    setDeveloperProfileId(dev.id);

    const { data: project } = await supabase
      .from("presale_projects")
      .select("name")
      .eq("id", projectId)
      .eq("developer_id", dev.id)
      .maybeSingle();

    if (!project) { navigate("/developer/projects"); return; }
    setProjectName(project.name);

    await fetchUnits();
    setInitializing(false);
  };

  const fetchUnits = async () => {
    const { data } = await supabase
      .from("listings")
      .select("id, unit_number, beds, baths, interior_sqft, assignment_price, status")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setUnits(data || []);
  };

  const onAddUnit = async (data: UnitFormData) => {
    if (!developerProfileId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("listings").insert({
        project_id: projectId,
        agent_id: user!.id,
        unit_number: data.unit_number,
        title: `Unit ${data.unit_number}`,
        project_name: projectName,
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
        status: "pending_approval",
        is_active: true,
      });
      if (error) throw error;
      toast.success(`Unit ${data.unit_number} added!`);
      reset({ beds: 1, baths: 1 });
      setShowForm(false);
      await fetchUnits();
    } catch (err: any) {
      toast.error(err.message || "Failed to add unit.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUnit = async (unitId: string) => {
    setDeletingId(unitId);
    const { error } = await supabase.from("listings").delete().eq("id", unitId);
    if (error) toast.error("Failed to delete unit.");
    else { toast.success("Unit removed."); await fetchUnits(); }
    setDeletingId(null);
  };

  if (authLoading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DeveloperPortalLayout>
      <div className="px-6 md:px-10 py-8 max-w-3xl mx-auto">
        <Link to="/developer/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Units</h1>
              <p className="text-muted-foreground text-sm">{projectName}</p>
            </div>
          </div>
          <Button
            onClick={() => { setShowForm(true); reset({ beds: 1, baths: 1 }); }}
            className="bg-primary hover:bg-primary-deep text-neutral-900 font-bold rounded-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </Button>
        </div>

        {/* Add Unit Form */}
        {showForm && (
          <Card className="rounded-xl shadow-sm border border-primary/30 mb-6 bg-muted">
            <CardContent className="p-6">
              <h2 className="font-bold text-foreground mb-4">Add New Unit</h2>
              <form onSubmit={handleSubmit(onAddUnit)} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-foreground text-xs">Unit # *</Label>
                    <Input {...register("unit_number")} placeholder="401" className="mt-1" />
                    {errors.unit_number && <p className="text-danger text-xs mt-0.5">{errors.unit_number.message}</p>}
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Unit Type</Label>
                    <Input {...register("unit_type")} placeholder="1BR, 2BR+Den..." className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Floor Level</Label>
                    <Input {...register("floor_level")} type="number" placeholder="4" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Bedrooms *</Label>
                    <Input {...register("beds")} type="number" min={0} step={1} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Bathrooms *</Label>
                    <Input {...register("baths")} type="number" min={0} step={0.5} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Exposure</Label>
                    <Input {...register("exposure")} placeholder="South, NW..." className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Interior sqft</Label>
                    <Input {...register("interior_sqft")} type="number" placeholder="750" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Exterior sqft</Label>
                    <Input {...register("exterior_sqft")} type="number" placeholder="80" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Parking</Label>
                    <Input {...register("parking")} placeholder="1 stall included" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Asking Price ($) *</Label>
                    <Input {...register("assignment_price")} type="number" placeholder="699000" className="mt-1" />
                    {errors.assignment_price && <p className="text-danger text-xs mt-0.5">{errors.assignment_price.message}</p>}
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Original Price ($)</Label>
                    <Input {...register("original_price")} type="number" placeholder="750000" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-foreground text-xs">Est. Completion</Label>
                    <Input {...register("estimated_completion")} placeholder="Q4 2025" className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-primary hover:bg-primary-deep text-neutral-900 font-bold rounded-lg"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Add Unit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Units List */}
        {units.length === 0 && !showForm ? (
          <Card className="rounded-xl border border-dashed border-input bg-card">
            <CardContent className="py-16 text-center">
              <Home className="h-12 w-12 text-input mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-1">No units yet</h3>
              <p className="text-muted-foreground text-sm mb-5">
                Add individual units to list your inventory
              </p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary-deep text-neutral-900 font-bold rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Unit
              </Button>
            </CardContent>
          </Card>
        ) : units.length > 0 ? (
          <div className="space-y-2">
            {units.map((unit) => (
              <Card key={unit.id} className="rounded-xl border border-border shadow-sm bg-card">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-900/5 flex items-center justify-center">
                      <Home className="h-4 w-4 text-neutral-900/40" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">Unit {unit.unit_number}</div>
                      <div className="text-xs text-muted-foreground">
                        {unit.beds}bd · {unit.baths}ba{unit.interior_sqft ? ` · ${unit.interior_sqft} sqft` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-primary text-sm">
                      ${unit.assignment_price.toLocaleString()}
                    </span>
                    <Badge
                      className={unit.status === "published" ? "bg-success-soft text-success-strong border-0 text-xs" :
                        unit.status === "sold" ? "bg-muted text-foreground border-0 text-xs" :
                        "bg-warning-soft text-warning-strong border-0 text-xs"}
                    >
                      {unit.status === "pending_approval" ? "Pending" : unit.status}
                    </Badge>
                    <button
                      onClick={() => deleteUnit(unit.id)}
                      disabled={deletingId === unit.id}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger-soft transition-colors"
                    >
                      {deletingId === unit.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <div className="pt-4">
              <Button
                onClick={() => navigate("/developer/projects")}
                variant="outline"
                className="rounded-lg border-input"
              >
                ✓ Done — Back to Projects
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </DeveloperPortalLayout>
  );
}
