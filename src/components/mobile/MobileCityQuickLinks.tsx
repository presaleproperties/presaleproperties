import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

interface CityData {
  name: string;
  count: number;
  color: string;
}

const CITY_COLORS: Record<string, string> = {
  "Vancouver": "bg-emerald-500",
  "Surrey": "bg-blue-500",
  "Burnaby": "bg-purple-500",
  "Coquitlam": "bg-orange-500",
  "Langley": "bg-teal-500",
  "Richmond": "bg-rose-500",
  "Delta": "bg-indigo-500",
  "Abbotsford": "bg-amber-500",
  "Port Moody": "bg-cyan-500",
  "New Westminster": "bg-pink-500",
};

export function MobileCityQuickLinks() {
  const navigate = useNavigate();

  const { data: cities = [] } = useQuery({
    queryKey: ["city-project-counts"],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from("presale_projects")
        .select("city")
        .eq("is_published", true);

      if (!projects) return [];

      const cityMap = new Map<string, number>();
      projects.forEach((p) => {
        cityMap.set(p.city, (cityMap.get(p.city) || 0) + 1);
      });

      const cityData: CityData[] = Array.from(cityMap.entries())
        .map(([name, count]) => ({
          name,
          count,
          color: CITY_COLORS[name] || "bg-slate-500",
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return cityData;
    },
    staleTime: 60000,
  });

  const handleCityClick = (city: string) => {
    navigate(`/presale-projects?city=${encodeURIComponent(city)}`);
  };

  if (cities.length === 0) return null;

  return (
    <section className="py-4">
      <div className="px-4 mb-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Projects Near You
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Explore new developments by city
        </p>
      </div>

      {/* Scrollable city grid */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          {cities.map((city) => (
            <button
              key={city.name}
              onClick={() => handleCityClick(city.name)}
              className="flex flex-col items-center gap-1.5 min-w-[72px] group"
            >
              {/* Circle with city initial or icon */}
              <div
                className={`w-16 h-16 rounded-full ${city.color} flex items-center justify-center shadow-md group-active:scale-95 transition-transform`}
              >
                <span className="text-white font-bold text-xl">
                  {city.name.charAt(0)}
                </span>
              </div>
              {/* City name */}
              <span className="text-xs font-medium text-foreground text-center truncate w-full">
                {city.name}
              </span>
              {/* Project count */}
              <span className="text-[10px] text-muted-foreground -mt-1">
                {city.count} project{city.count !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}