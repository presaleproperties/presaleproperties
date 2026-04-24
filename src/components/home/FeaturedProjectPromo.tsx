import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { generateProjectUrl } from "@/lib/seoUrls";

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${price.toLocaleString("en-CA")}`;
};

interface FeaturedProjectPromoProps {
  slug: string;
  /** Optional override for the badge label (defaults to "Featured This Week") */
  badgeLabel?: string;
}

/**
 * Reusable spotlight-style promo card for a single hand-picked project,
 * fetched by slug. Visually mirrors SpotlightProjectPromo so promos
 * remain consistent across the page.
 */
export function FeaturedProjectPromo({ slug, badgeLabel = "Featured This Week" }: FeaturedProjectPromoProps) {
  const { data: project } = useQuery({
    queryKey: ["featured-project-promo", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presale_projects")
        .select("name, slug, city, neighborhood, project_type, starting_price, short_description, featured_image")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!project || !project.featured_image) return null;

  const url = generateProjectUrl({
    slug: project.slug,
    neighborhood: project.neighborhood || project.city || "",
    projectType: (project.project_type as any) || "condo",
  });
  const price = formatPrice(project.starting_price);

  return (
    <section className="py-2 md:py-4">
      <div className="container px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <Link to={url} className="relative h-56 sm:h-72 lg:h-auto lg:min-h-[420px] overflow-hidden group">
              <img
                src={project.featured_image}
                alt={`${project.name} in ${project.city}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-3 py-1 shadow-lg">
                <Sparkles className="h-3 w-3" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{badgeLabel}</span>
              </div>
            </Link>

            <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">

              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{project.neighborhood ? `${project.neighborhood}, ` : ""}{project.city}, BC</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">
                {project.name}
              </h2>

              {project.short_description && (
                <p className="text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                  {project.short_description}
                </p>
              )}

              {price && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Starting From
                  </p>
                  <p className="text-3xl font-extrabold text-primary">{price}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="font-bold gap-2">
                  <Link to={url}>
                    View VIP Pricing
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-bold">
                  <Link to="/presale-projects">Browse All Projects</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
