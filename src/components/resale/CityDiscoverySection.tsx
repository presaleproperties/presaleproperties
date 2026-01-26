import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Building2, Home, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const CITIES = [
  { name: "Surrey", slug: "surrey" },
  { name: "Langley", slug: "langley" },
  { name: "Burnaby", slug: "burnaby" },
  { name: "Coquitlam", slug: "coquitlam" },
  { name: "Vancouver", slug: "vancouver" },
  { name: "Delta", slug: "delta" },
  { name: "Abbotsford", slug: "abbotsford" },
  { name: "Richmond", slug: "richmond" },
];

type CityStats = {
  city: string;
  count: number;
  avgPrice: number;
  propertyTypes: string[];
};

export function CityDiscoverySection() {
  const { data: cityStats, isLoading } = useQuery({
    queryKey: ["new-homes-city-stats"],
    queryFn: async () => {
      // Get counts and avg prices for each city (2024+ move-in ready new construction)
      const stats: CityStats[] = [];
      
      for (const city of CITIES) {
        const { data, error } = await supabase
          .from("mls_listings")
          .select("listing_price, property_type")
          .eq("mls_status", "Active")
          .ilike("city", `%${city.name}%`)
          .gte("year_built", 2024);

        if (!error && data) {
          const count = data.length;
          const avgPrice = count > 0 
            ? Math.round(data.reduce((sum, l) => sum + (l.listing_price || 0), 0) / count)
            : 0;
          const types = [...new Set(data.map(l => l.property_type).filter(Boolean))];
          
          stats.push({
            city: city.name,
            count,
            avgPrice,
            propertyTypes: types.slice(0, 3)
          });
        }
      }
      
      return stats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  return (
    <section className="py-12 md:py-20 bg-muted/20">
      <div className="container px-4">
        <div className="text-center mb-8 md:mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">
            Browse by Location
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            New Homes by City
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explore newly built homes across Metro Vancouver and the Fraser Valley.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-background rounded-xl border border-border p-4 md:p-5">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : (
            CITIES.map((city) => {
              const stats = cityStats?.find(s => s.city === city.name);
              const count = stats?.count || 0;
              const avgPrice = stats?.avgPrice || 0;
              
              return (
                <Link
                  key={city.slug}
                  to={`/properties/${city.slug}`}
                  className="group bg-background rounded-xl border border-border p-4 md:p-5 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {city.name}
                      </h3>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-foreground font-medium">
                        {count > 0 ? `${count} new homes` : "Coming soon"}
                      </span>
                    </div>
                    
                    {avgPrice > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Avg {formatPrice(avgPrice)}
                        </span>
                      </div>
                    )}
                    
                    {stats?.propertyTypes && stats.propertyTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stats.propertyTypes.map((type) => (
                          <span 
                            key={type}
                            className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/map-search?mode=resale">
              <MapPin className="mr-2 h-4 w-4" />
              View All on Map
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
