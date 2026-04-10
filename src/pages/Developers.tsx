import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Building2, MapPin, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const CITY_FILTERS = [
  "Vancouver", "Surrey", "Burnaby", "Richmond", "Langley",
  "Coquitlam", "North Vancouver", "West Vancouver", "New Westminster",
  "Port Coquitlam", "Port Moody", "Abbotsford",
];

interface Developer {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  cities_active: string[] | null;
  project_count: number;
}

export default function Developers() {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const { data: developers, isLoading } = useQuery({
    queryKey: ["developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Developer[];
    },
  });

  const filtered = useMemo(() => {
    if (!developers) return [];
    return developers.filter((d) => {
      const matchesSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
      const matchesCity =
        !selectedCity ||
        d.city?.toLowerCase() === selectedCity.toLowerCase() ||
        d.cities_active?.some((c) => c.toLowerCase() === selectedCity.toLowerCase());
      return matchesSearch && matchesCity;
    });
  }, [developers, search, selectedCity]);

  const resultLabel = filtered.length === 1
    ? "Showing 1 developer"
    : `Showing ${filtered.length} developers`;
  const suffix = selectedCity ? ` in ${selectedCity}` : " in BC";

  return (
    <>
      <Helmet>
        <title>BC Home Developers | Presale Properties</title>
        <meta
          name="description"
          content="Explore top residential developers building presale condos and townhomes across British Columbia. Find projects by your favorite developer."
        />
      </Helmet>
      <ConversionHeader />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-br from-foreground via-foreground to-foreground/90 py-12 md:py-16">
          <div className="container px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-background mb-3">
              BC Home Developers
            </h1>
            <p className="text-background/80 text-lg max-w-2xl">
              Discover the top residential developers building presale condos and townhomes across British Columbia.
            </p>
          </div>
        </section>

        {/* Search & Filters */}
        <section className="border-b border-border/50 bg-card">
          <div className="container px-4 py-4 space-y-3">
            {/* Search input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search developers by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* City filter chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCity(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  !selectedCity
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                All Cities
              </button>
              {CITY_FILTERS.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    selectedCity === city
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Developer Grid */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            {/* Count indicator */}
            {!isLoading && (
              <p className="text-sm text-muted-foreground mb-4 font-medium">
                {resultLabel}{suffix}
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((developer) => (
                  <Link
                    key={developer.id}
                    to={`/developers/${developer.slug}`}
                    className="group bg-card rounded-xl border border-border/50 p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4 overflow-hidden">
                      {developer.logo_url ? (
                        <img
                          src={developer.logo_url}
                          alt={developer.name}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {developer.name}
                    </h3>
                    {developer.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{developer.city}</span>
                      </div>
                    )}
                    <div className="mt-auto pt-2">
                      <span className="text-xs text-primary group-hover:underline">
                        View Profile →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No developers match your filters</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or clearing city filters.
                </p>
                <button
                  onClick={() => { setSearch(""); setSelectedCity(null); }}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
