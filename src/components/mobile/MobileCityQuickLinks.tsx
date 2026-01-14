import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

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

interface MobileCityQuickLinksProps {
  mode?: "presale" | "resale";
}

export function MobileCityQuickLinks({ mode = "presale" }: MobileCityQuickLinksProps) {
  const navigate = useNavigate();

  const { data: cities = [] } = useQuery({
    queryKey: ["city-project-counts", mode],
    queryFn: async () => {
      if (mode === "presale") {
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
          .filter(([name]) => CITY_IMAGES[name])
          .map(([name, count]) => ({
            name,
            count,
            image: CITY_IMAGES[name],
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return cityData;
      } else {
        // Resale mode - query MLS listings
        const { data: listings } = await supabase
          .from("mls_listings")
          .select("city")
          .eq("standard_status", "Active");

        if (!listings) return [];

        const cityMap = new Map<string, number>();
        listings.forEach((l) => {
          if (l.city) {
            cityMap.set(l.city, (cityMap.get(l.city) || 0) + 1);
          }
        });

        const cityData: CityData[] = Array.from(cityMap.entries())
          .filter(([name]) => CITY_IMAGES[name])
          .map(([name, count]) => ({
            name,
            count,
            image: CITY_IMAGES[name],
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        return cityData;
      }
    },
    staleTime: 60000,
  });

  const handleCityClick = (city: string) => {
    const slug = city.toLowerCase().replace(/\s+/g, '-');
    if (mode === "presale") {
      navigate(`/presale-condos/${slug}`);
    } else {
      navigate(`/resale?city=${city}`);
    }
  };

  if (cities.length === 0) return null;

  return (
    <section className="space-y-4 md:space-y-5 lg:hidden">
      {/* Header - Matches MobileDiscoveryCarousel */}
      <div className="px-4 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
          Explore by City
        </span>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-foreground leading-tight">
              {mode === "presale" ? "Projects Near You" : "Homes Near You"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "presale" ? "Browse new developments by city" : "Browse listings by city"}
            </p>
          </div>
          <Link 
            to={mode === "presale" ? "/presale-projects" : "/resale"}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 active:bg-muted px-3 py-1.5 rounded-full transition-colors shrink-0"
          >
            See all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Scrollable City Cards - Premium card design */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory px-4 sm:px-6 scroll-px-4 sm:scroll-px-6">
        {cities.map((city) => (
          <button
            key={city.name}
            onClick={() => handleCityClick(city.name)}
            className="snap-start first:ml-0 shrink-0 group"
          >
            {/* Card Container */}
            <div className="relative w-[140px] sm:w-[160px] overflow-hidden rounded-xl bg-card border border-border shadow-[var(--shadow-card)] group-active:scale-[0.98] transition-transform">
              {/* Image Section */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={city.image}
                  alt={`${city.name} BC`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                
                {/* City name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h4 className="text-white font-bold text-base leading-tight drop-shadow-lg">
                    {city.name}
                  </h4>
                </div>
              </div>
              
              {/* Info Section */}
              <div className="p-3 bg-card">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">
                    {city.count} {mode === "presale" 
                      ? (city.count !== 1 ? "projects" : "project") 
                      : (city.count !== 1 ? "listings" : "listing")
                    }
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
