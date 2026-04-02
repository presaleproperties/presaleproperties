import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin, Calendar, Search } from "lucide-react";
import type { OffMarketListingForm } from "./types";

interface Props {
  form: OffMarketListingForm;
  setForm: (f: OffMarketListingForm) => void;
  projectPreview: any;
  setProjectPreview: (p: any) => void;
  onNext: () => void;
}

export function WizardStep1({ form, setForm, projectPreview, setProjectPreview, onNext }: Props) {
  const [search, setSearch] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["presale-projects-search", search],
    queryFn: async () => {
      let q = supabase
        .from("presale_projects")
        .select("id, name, slug, city, neighborhood, developer_name, project_type, estimated_completion, featured_image")
        .order("name");
      if (search) q = q.ilike("name", `%${search}%`);
      const { data } = await q.limit(20);
      return data || [];
    },
  });

  const selectProject = (p: any) => {
    setForm({
      ...form,
      linked_project_slug: p.slug,
      linked_project_name: p.name,
      developer_name: p.developer_name || "",
    });
    setProjectPreview(p);
  };

  const isSelected = !!form.linked_project_name;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-2 block">Search Projects</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Type project name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Project list */}
      <div className="grid gap-2 max-h-[300px] overflow-y-auto">
        {projects?.map((p: any) => (
          <Card
            key={p.id}
            className={`rounded-xl cursor-pointer transition-all border-border/50 hover:border-primary/40 ${
              form.linked_project_slug === p.slug ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => selectProject(p)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {p.featured_image ? (
                <img src={p.featured_image} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.developer_name} · {p.city}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected project preview */}
      {projectPreview && (
        <Card className="rounded-2xl border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <h3 className="font-bold text-lg mb-3">Selected Project</h3>
            <div className="flex gap-4">
              {projectPreview.featured_image && (
                <img src={projectPreview.featured_image} className="w-24 h-24 rounded-xl object-cover" alt="" />
              )}
              <div className="space-y-1.5">
                <p className="font-semibold">{projectPreview.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {projectPreview.developer_name || "—"}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {projectPreview.neighborhood}, {projectPreview.city}
                </p>
                {projectPreview.estimated_completion && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {projectPreview.estimated_completion}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{projectPreview.project_type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isSelected} className="rounded-xl shadow-gold font-bold px-8">
          Next →
        </Button>
      </div>
    </div>
  );
}
