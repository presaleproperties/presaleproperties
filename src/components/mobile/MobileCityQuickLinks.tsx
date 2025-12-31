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
    <section className="py-4 md:py-6">
      <div className="px-4 mb-3 md:mb-4">
        <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          Projects Near You
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          Explore new developments by city
        </p>
      </div>

      {/* Scrollable city grid - Tablet shows more */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 md:gap-6 px-4 pb-2">
          {cities.map((city) => (
            <button
              key={city.name}
              onClick={() => handleCityClick(city.name)}
              className="flex flex-col items-center gap-2 min-w-[88px] md:min-w-[100px] group"
            >
              {/* Circle with city image - Larger on tablet */}
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-lg ring-2 ring-white group-active:scale-95 transition-transform">
                <img
                  src={city.image}
                  alt={`${city.name} BC`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              {/* City name */}
              <span className="text-xs md:text-sm font-semibold text-foreground text-center truncate w-full">
                {city.name}
              </span>
              {/* Project count */}
              <span className="text-[10px] md:text-xs text-muted-foreground -mt-1">
                {city.count} project{city.count !== 1 ? "s" : ""}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}