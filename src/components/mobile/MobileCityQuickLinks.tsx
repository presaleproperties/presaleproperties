import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

// Import city images
import vancouverImg from "@/assets/cities/vancouver.jpg";
import surreyImg from "@/assets/cities/surrey.jpg";
import burnabyImg from "@/assets/cities/burnaby.jpg";
import coquitlamImg from "@/assets/cities/coquitlam.jpg";
import langleyImg from "@/assets/cities/langley.jpg";
import richmondImg from "@/assets/cities/richmond.jpg";
import deltaImg from "@/assets/cities/delta.jpg";
import abbotsfordImg from "@/assets/cities/abbotsford.jpg";
import portMoodyImg from "@/assets/cities/port-moody.jpg";
import newWestminsterImg from "@/assets/cities/new-westminster.jpg";

interface CityData {
  name: string;
  count: number;
  image: string;
}

const CITY_IMAGES: Record<string, string> = {
  "Vancouver": vancouverImg,
  "Surrey": surreyImg,
  "Burnaby": burnabyImg,
  "Coquitlam": coquitlamImg,
  "Langley": langleyImg,
  "Richmond": richmondImg,
  "Delta": deltaImg,
  "Abbotsford": abbotsfordImg,
  "Port Moody": portMoodyImg,
  "New Westminster": newWestminsterImg,
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
        .filter(([name]) => CITY_IMAGES[name]) // Only include cities with images
        .map(([name, count]) => ({
          name,
          count,
          image: CITY_IMAGES[name],
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
    <section className="py-6 px-4">
      <h2 className="text-lg font-bold text-foreground mb-4">
        Explore by City
      </h2>

      {/* 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {cities.slice(0, 6).map((city) => (
          <button
            key={city.name}
            onClick={() => handleCityClick(city.name)}
            className="bg-card rounded-xl p-4 text-left shadow-sm border border-border/50 active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{city.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {city.count}+ projects
            </span>
          </button>
        ))}
      </div>

      {/* View all link */}
      <button
        onClick={() => navigate("/presale-projects")}
        className="mt-4 text-primary font-medium text-sm flex items-center gap-1"
      >
        View all cities
        <span className="text-primary">→</span>
      </button>
    </section>
  );
}