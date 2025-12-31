import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

interface DeveloperData {
  name: string;
  count: number;
  color: string;
  initials: string;
}

// Generate a consistent brand color from developer name
function getDeveloperColor(name: string): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-emerald-500 to-emerald-600",
    "from-violet-500 to-violet-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
    "from-cyan-500 to-cyan-600",
    "from-indigo-500 to-indigo-600",
    "from-teal-500 to-teal-600",
    "from-orange-500 to-orange-600",
    "from-pink-500 to-pink-600",
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Get initials from developer name (max 2 chars)
function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
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
          color: getDeveloperColor(name),
          initials: getInitials(name),
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

      {/* 2-column grid of developer cards */}
      <div className="grid grid-cols-2 gap-3">
        {developers.map((developer) => (
          <button
            key={developer.name}
            onClick={() => handleDeveloperClick(developer.name)}
            className="relative overflow-hidden rounded-xl bg-card border border-border shadow-sm group active:scale-[0.98] transition-all text-left"
          >
            {/* Card content */}
            <div className="relative p-3 flex items-center gap-3">
              {/* Developer logo/initial badge */}
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${developer.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white font-bold text-sm">
                  {developer.initials}
                </span>
              </div>
              
              {/* Developer info */}
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-foreground text-sm line-clamp-1 block">
                  {developer.name}
                </span>
                <p className="text-xs text-muted-foreground">
                  {developer.count} project{developer.count !== 1 ? "s" : ""}
                </p>
              </div>
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