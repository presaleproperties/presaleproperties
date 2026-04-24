import { Link } from "react-router-dom";
import { TrendingUp, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProjectUrl } from "@/lib/seoUrls";
import { useTrendingProjects } from "@/hooks/useTrendingProjects";
import { HAND_PICKED_PROMO_SLUGS } from "./promoExclusions";

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${price.toLocaleString("en-CA")}`;
};

interface TrendingProjectPromoProps {
  /** Render just the card without the outer <section>/container/padding. */
  inline?: boolean;
}

/**
 * TrendingProjectPromo — full-bleed cinematic hero with overlay text.
 * Renders the rank-2 project from the shared trending hook to give the
 * homepage a different visual rhythm vs. the split-layout promos.
 */
export function TrendingProjectPromo({ inline = false }: TrendingProjectPromoProps = {}) {
  const { data: projects } = useTrendingProjects(8);
  const eligible = (projects ?? []).filter((p) => !HAND_PICKED_PROMO_SLUGS.has(p.slug));
  const project = eligible[1];
  if (!project) return null;

  const url = generateProjectUrl({
    slug: project.slug,
    neighborhood: project.neighborhood || project.city || "",
    projectType: (project.project_type as any) || "condo",
  });
  const price = formatPrice(project.starting_price);

  const card = (
    <div className="relative isolate overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
      <div className="grid lg:grid-cols-2 gap-0">
        <Link to={url} className="relative aspect-[4/3] lg:aspect-auto lg:h-auto lg:min-h-[420px] overflow-hidden group">
          <img
            src={project.featured_image!}
            alt={`${project.name} in ${project.city}`}
            loading="lazy"
            width={1200}
            height={900}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-3 py-1 shadow-lg">
            <TrendingUp className="h-3 w-3" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Hot Right Now</span>
          </div>
        </Link>

        <div className="p-6 sm:p-8 md:p-12 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{project.neighborhood ? `${project.neighborhood}, ` : ""}{project.city}, BC</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3 break-words">
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
  );

  if (inline) return card;

  return (
    <section className="relative isolate overflow-hidden py-10 md:py-14">
      <div className="container px-4 sm:px-6">{card}</div>
    </section>
  );
}
