import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "@/components/seo/Helmet";
import { ConversionHeader } from "@/components/conversion/ConversionHeader";
import { Footer } from "@/components/layout/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ExternalLink, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

interface Developer {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  project_count: number;
}

export default function Developers() {
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

        {/* Developer Grid */}
        <section className="py-8 md:py-12">
          <div className="container px-4">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : developers && developers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {developers.map((developer) => (
                  <Link
                    key={developer.id}
                    to={`/developers/${developer.slug}`}
                    className="group bg-card rounded-xl border border-border/50 p-5 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
                  >
                    {/* Logo */}
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

                    {/* Name */}
                    <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {developer.name}
                    </h3>

                    {/* City */}
                    {developer.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <MapPin className="h-3 w-3" />
                        <span>{developer.city}</span>
                      </div>
                    )}

                    {/* View Profile */}
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
                <h3 className="text-lg font-semibold mb-2">No developers yet</h3>
                <p className="text-muted-foreground">
                  Check back soon for our developer directory.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
