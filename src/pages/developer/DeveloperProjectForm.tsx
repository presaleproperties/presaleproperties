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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Project name is required"),
  city: z.string().min(2, "City is required"),
  neighborhood: z.string().min(1, "Neighborhood is required"),
  address: z.string().optional(),
  property_type: z.enum(["condo", "townhome", "mixed"]),
  status: z.enum(["coming_soon", "registering", "active", "sold_out"]),
  description: z.string().optional(),
  estimated_completion: z.string().optional(),
  total_units: z.coerce.number().min(1).optional(),
  developer_website: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

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
    defaultValues: { status: "coming_soon", property_type: "condo" },
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
        .select("*")
        .eq("id", id)
        .eq("developer_id", dev.id)
        .maybeSingle();

      if (!project) { navigate("/developer/projects"); return; }
      reset({
        name: project.name,
        city: project.city,
        neighborhood: project.neighborhood,
        address: project.address || "",
        property_type: (project.property_type as any) || "condo",
        status: project.status as any,
        description: project.description || "",
        estimated_completion: project.estimated_completion || "",
        total_units: project.total_units || undefined,
        developer_website: project.developer_website || "",
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
            property_type: data.property_type,
            status: data.status,
            description: data.description || null,
            estimated_completion: data.estimated_completion || null,
            total_units: data.total_units || null,
            developer_website: data.developer_website || null,
          })
          .eq("id", id)
          .eq("developer_id", developerProfileId);

        if (error) throw error;
        toast.success("Project updated!");
        navigate(`/developer/projects/${id}/units`);
      } else {
        const { data: newProject, error } = await supabase
          .from("presale_projects")
          .insert({
            developer_id: developerProfileId,
            name: data.name,
            city: data.city,
            neighborhood: data.neighborhood,
            address: data.address || null,
            property_type: data.property_type,
            status: data.status,
            description: data.description || null,
            estimated_completion: data.estimated_completion || null,
            total_units: data.total_units || null,
            developer_website: data.developer_website || null,
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
        <Loader2 className="h-8 w-8 animate-spin text-[#C8A951]" />
      </div>
    );
  }

  return (
    <DeveloperPortalLayout>
      <div className="px-6 md:px-10 py-8 max-w-2xl mx-auto">
        <Link to="/developer/projects" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2937] mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center">
            <Building2 className="h-5 w-5 text-[#C8A951]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1F2937]">
              {isEditing ? "Edit Project" : "Add a Project"}
            </h1>
            <p className="text-[#6B7280] text-sm">
              {isEditing ? "Update your project details" : "Step 1 of 2 — Project details"}
            </p>
          </div>
        </div>

        <Card className="rounded-xl shadow-sm border border-[#E5E7EB]">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Project Name */}
              <div>
                <Label className="text-[#1F2937]">Project / Building Name *</Label>
                <Input {...register("name")} placeholder="e.g. The Grand at Brentwood" className="mt-1.5" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* City + Neighborhood */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1F2937]">City *</Label>
                  <Input {...register("city")} placeholder="Burnaby" className="mt-1.5" />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <Label className="text-[#1F2937]">Neighbourhood *</Label>
                  <Input {...register("neighborhood")} placeholder="Brentwood" className="mt-1.5" />
                  {errors.neighborhood && <p className="text-red-500 text-xs mt-1">{errors.neighborhood.message}</p>}
                </div>
              </div>

              {/* Address */}
              <div>
                <Label className="text-[#1F2937]">Street Address <span className="text-[#9CA3AF]">(optional)</span></Label>
                <Input {...register("address")} placeholder="123 Main St" className="mt-1.5" />
              </div>

              {/* Type + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1F2937]">Property Type *</Label>
                  <select
                    {...register("property_type")}
                    className="mt-1.5 w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="condo">Condo</option>
                    <option value="townhome">Townhome</option>
                    <option value="mixed">Mixed (Condo + Townhome)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[#1F2937]">Project Status *</Label>
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

              {/* Total Units + Completion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1F2937]">Total Units <span className="text-[#9CA3AF]">(optional)</span></Label>
                  <Input {...register("total_units")} type="number" placeholder="e.g. 200" className="mt-1.5" />
                </div>
                <div>
                  <Label className="text-[#1F2937]">Est. Completion <span className="text-[#9CA3AF]">(optional)</span></Label>
                  <Input {...register("estimated_completion")} placeholder="Q4 2025" className="mt-1.5" />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-[#1F2937]">Project Description <span className="text-[#9CA3AF]">(optional)</span></Label>
                <Textarea {...register("description")} placeholder="Describe the project, amenities, location highlights..." className="mt-1.5" rows={4} />
              </div>

              {/* Developer Website */}
              <div>
                <Label className="text-[#1F2937]">Project Website <span className="text-[#9CA3AF]">(optional)</span></Label>
                <Input {...register("developer_website")} type="url" placeholder="https://..." className="mt-1.5" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#C8A951] hover:bg-[#b8993f] text-[#1A1A2E] font-bold rounded-lg py-2.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isEditing ? "Save Changes" : "Save & Add Units →"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DeveloperPortalLayout>
  );
}
