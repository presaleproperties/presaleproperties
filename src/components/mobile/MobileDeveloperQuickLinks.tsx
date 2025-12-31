import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, ArrowRight } from "lucide-react";

interface DeveloperData {
  name: string;
  count: number;
}

export function MobileDeveloperQuickLinks() {
  const navigate = useNavigate();

  const { data: developers = [] } = useQuery({
    queryKey: ["developer-project-counts"],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from("presale_projects")
        .select("developer_name")
        .eq("is_published", true)
        .not("developer_name", "is", null);

      if (!projects) return [];

      const developerMap = new Map<string, number>();
      projects.forEach((p) => {
        if (p.developer_name) {
          developerMap.set(p.developer_name, (developerMap.get(p.developer_name) || 0) + 1);
        }
      });

      const developerData: DeveloperData[] = Array.from(developerMap.entries())
        .map(([name, count]) => ({
          name,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      return developerData;
    },
    staleTime: 60000,
  });

  const handleDeveloperClick = (developer: string) => {
    navigate(`/presale-projects?developer=${encodeURIComponent(developer)}`);
  };

  if (developers.length === 0) return null;

  return (
    <section className="py-6 px-4">
      <h2 className="text-xl font-bold text-foreground mb-4">
        Search by Developer
      </h2>

      {/* 2-column, 2-row grid of developer cards */}
      <div className="grid grid-cols-2 gap-3">
        {developers.map((developer) => (
          <button
            key={developer.name}
            onClick={() => handleDeveloperClick(developer.name)}
            className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm group active:scale-[0.98] transition-all text-left"
          >
            {/* Card content */}
            <div className="relative p-4">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-semibold text-foreground text-sm line-clamp-1">
                  {developer.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {developer.count}+ projects
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* View all link */}
      <button
        onClick={() => navigate("/presale-projects")}
        className="flex items-center gap-1 text-primary font-medium mt-4 text-sm"
      >
        View all developers
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}