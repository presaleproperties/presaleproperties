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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

type ProjectType = "condo" | "townhome" | "mixed" | "duplex" | "single_family";
type ProjectStatus = "coming_soon" | "registering" | "active" | "sold_out";

const schema = z.object({
  name: z.string().min(2, "Project name is required"),
  city: z.string().min(2, "City is required"),
  neighborhood: z.string().min(1, "Neighbourhood is required"),
  address: z.string().optional(),
  project_type: z.enum(["condo", "townhome", "mixed", "duplex", "single_family"] as const),
  status: z.enum(["coming_soon", "registering", "active", "sold_out"] as const),
  short_description: z.string().optional(),
  occupancy_estimate: z.string().optional(),
  unit_mix: z.string().optional(),
  starting_price: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function DeveloperProjectForm() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [developerProfileId, setDeveloperProfileId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "coming_soon", project_type: "condo" },
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

    if (!dev || dev.verification_status !== "approved") {
      navigate("/developer");
      return;
    }
    setDeveloperProfileId(dev.id);

    if (isEditing) {
      const { data: project } = await supabase
        .from("presale_projects")
        .select("name, city, neighborhood, address, project_type, status, short_description, occupancy_estimate, unit_mix, starting_price")
        .eq("id", id)
        .eq("developer_id", dev.id)
        .maybeSingle();

      if (!project) { navigate("/developer/projects"); return; }
      reset({
        name: project.name,
        city: project.city,
        neighborhood: project.neighborhood,
        address: project.address || "",
        project_type: project.project_type as ProjectType,
        status: project.status as ProjectStatus,
        short_description: project.short_description || "",
        occupancy_estimate: project.occupancy_estimate || "",
        unit_mix: project.unit_mix || "",
        starting_price: project.starting_price || undefined,
      });
    }
    setInitializing(false);
  };

  const onSubmit = async (data: FormData) => {
    if (!developerProfileId) return;
    setLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("presale_projects")
          .update({
            name: data.name,
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address || null,
            project_type: data.project_type,
            status: data.status,
            short_description: data.short_description || null,
            occupancy_estimate: data.occupancy_estimate || null,
            unit_mix: data.unit_mix || null,
            starting_price: data.starting_price || null,
          })
          .eq("id", id)
          .eq("developer_id", developerProfileId);

        if (error) throw error;
        toast.success("Project updated!");
        navigate(`/developer/projects/${id}/units`);
      } else {
        const baseSlug = slugify(data.name);
        const uniqueSlug = `${baseSlug}-${Date.now()}`;

        const { data: newProject, error } = await supabase
          .from("presale_projects")
          .insert({
            developer_id: developerProfileId,
            name: data.name,
            slug: uniqueSlug,
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address || null,
            project_type: data.project_type,
            status: data.status,
            short_description: data.short_description || null,
            occupancy_estimate: data.occupancy_estimate || null,
            unit_mix: data.unit_mix || null,
            starting_price: data.starting_price || null,
            is_published: false,
          })
          .select("id")
          .single();

        if (error) throw error;
        toast.success("Project created! Now add your units.");
        navigate(`/developer/projects/${newProject.id}/units`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save project.");
    } finally {
      setLoading(false);
    }
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
      <div className="px-6 md:px-10 py-8 max-w-2xl mx-auto">
        <Link to="/developer/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-900">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Project" : "Add a Project"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditing ? "Update your project details" : "Step 1 of 2 — Project details"}
            </p>
          </div>
        </div>

        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Label>Project / Building Name *</Label>
                <Input {...register("name")} placeholder="e.g. The Grand at Brentwood" className="mt-1.5" />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>City *</Label>
                  <Input {...register("city")} placeholder="Burnaby" className="mt-1.5" />
                  {errors.city && <p className="text-destructive text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <Label>Neighbourhood *</Label>
                  <Input {...register("neighborhood")} placeholder="Brentwood" className="mt-1.5" />
                  {errors.neighborhood && <p className="text-destructive text-xs mt-1">{errors.neighborhood.message}</p>}
                </div>
              </div>

              <div>
                <Label>Street Address <span className="text-muted-foreground">(optional)</span></Label>
                <Input {...register("address")} placeholder="123 Main St" className="mt-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Property Type *</Label>
                  <select
                    {...register("project_type")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="condo">Condo</option>
                    <option value="townhome">Townhome</option>
                    <option value="mixed">Mixed</option>
                    <option value="duplex">Duplex</option>
                    <option value="single_family">Single Family</option>
                  </select>
                </div>
                <div>
                  <Label>Project Status *</Label>
                  <select
                    {...register("status")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="coming_soon">Coming Soon</option>
                    <option value="registering">Registering</option>
                    <option value="active">Active / Selling</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Starting Price ($) <span className="text-muted-foreground">(optional)</span></Label>
                  <Input {...register("starting_price")} type="number" placeholder="499000" className="mt-1.5" />
                </div>
                <div>
                  <Label>Est. Occupancy <span className="text-muted-foreground">(optional)</span></Label>
                  <Input {...register("occupancy_estimate")} placeholder="Q4 2025" className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>Unit Mix <span className="text-muted-foreground">(optional)</span></Label>
                <Input {...register("unit_mix")} placeholder="Studios, 1BR, 2BR, 3BR" className="mt-1.5" />
              </div>

              <div>
                <Label>Short Description <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea {...register("short_description")} placeholder="Brief summary of the project..." className="mt-1.5" rows={3} />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full font-bold rounded-lg py-2.5 bg-primary text-primary-foreground hover:bg-primary-deep"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isEditing ? "Save Changes" : "Save & Add Units →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DeveloperPortalLayout>
  );
}
