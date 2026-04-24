import { Link } from "react-router-dom";
import { TrendingUp, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProjectUrl } from "@/lib/seoUrls";
import { useTrendingProjects } from "@/hooks/useTrendingProjects";

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${price.toLocaleString("en-CA")}`;
};

/**
 * TrendingProjectPromo — full-bleed cinematic hero with overlay text.
 * Renders the rank-2 project from the shared trending hook to give the
 * homepage a different visual rhythm vs. the split-layout promos.
 */
export function TrendingProjectPromo() {
  const { data: projects } = useTrendingProjects(4);
  const project = projects?.[1];
  if (!project) return null;

  const url = generateProjectUrl({
    slug: project.slug,
    neighborhood: project.neighborhood || project.city || "",
    projectType: (project.project_type as any) || "condo",
  });
  const price = formatPrice(project.starting_price);

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4">
        <Link
          to={url}
          className="relative block overflow-hidden rounded-3xl border border-border shadow-xl group min-h-[360px] md:min-h-[460px]"
        >
          <img
            src={project.featured_image!}
            alt={`${project.name} in ${project.city}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          {/* Top badge */}
          <div className="absolute top-5 left-5 inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-3 py-1 shadow-lg">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Hot Right Now</span>
          </div>

          {/* Content overlay */}
          <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-on-dark">
            <div className="flex items-center gap-1.5 text-on-dark/80 text-sm mb-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                {project.neighborhood ? `${project.neighborhood}, ` : ""}
                {project.city}, BC
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold leading-tight mb-2 max-w-3xl">
              {project.name}
            </h2>

            {project.short_description && (
              <p className="text-on-dark/85 leading-relaxed mb-4 line-clamp-2 max-w-2xl">
                {project.short_description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 md:gap-6">
              {price && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-dark/70 font-semibold">
                    Starting From
                  </p>
                  <p className="text-2xl md:text-3xl font-extrabold text-primary">{price}</p>
                </div>
              )}
              <Button asChild size="lg" className="font-bold gap-2">
                <span className="inline-flex items-center">
                  View VIP Pricing
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
