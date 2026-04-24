import { Link } from "react-router-dom";
import { Star, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateProjectUrl } from "@/lib/seoUrls";
import { useTrendingProjects } from "@/hooks/useTrendingProjects";
import { HAND_PICKED_PROMO_SLUGS } from "./promoExclusions";

const formatPrice = (price: number | null) => {
  if (!price) return null;
  if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
  return `$${price.toLocaleString("en-CA")}`;
};

interface RisingStarPromoProps {
  /** Render just the card without the outer <section>/container/padding. */
  inline?: boolean;
}

/**
 * RisingStarPromo — compact horizontal ribbon with smaller image.
 * Renders the rank-4 trending project; lighter visual weight so the homepage
 * doesn't feel like four identical hero cards stacked together.
 */
export function RisingStarPromo({ inline = false }: RisingStarPromoProps = {}) {
  const { data: projects } = useTrendingProjects(8);
  const eligible = (projects ?? []).filter((p) => !HAND_PICKED_PROMO_SLUGS.has(p.slug));
  const project = eligible[3];
  if (!project) return null;

  const url = generateProjectUrl({
    slug: project.slug,
    neighborhood: project.neighborhood || project.city || "",
    projectType: (project.project_type as any) || "condo",
  });
  const price = formatPrice(project.starting_price);

  const card = (
    <div className="relative isolate overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-primary/5 via-card to-card shadow-lg">
      {/* Stack vertically on mobile/tablet, side-by-side from lg+ to avoid clipping */}
      <div className="grid lg:grid-cols-[300px_1fr] xl:grid-cols-[340px_1fr] gap-0">
        <Link
          to={url}
          className="relative aspect-[16/10] lg:aspect-auto lg:h-auto lg:min-h-[220px] overflow-hidden group"
        >
          <img
            src={project.featured_image!}
            alt={`${project.name} in ${project.city}`}
            loading="lazy"
            width={800}
            height={500}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-foreground text-background rounded-full px-2.5 py-1 shadow-md">
            <Star className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Rising Star</span>
          </div>
        </Link>

        <div className="p-5 sm:p-6 md:p-8 flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">
              {project.neighborhood ? `${project.neighborhood}, ` : ""}
              {project.city}, BC
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-2 break-words">
            {project.name}
          </h3>

          {project.short_description && (
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
              {project.short_description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {price && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Starting From
                </p>
                <p className="text-xl font-extrabold text-primary">{price}</p>
              </div>
            )}
            <Button asChild size="default" className="font-bold gap-2">
              <Link to={url}>
                Explore
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (inline) return card;

  return (
    <section className="relative isolate overflow-hidden py-8 sm:py-10 md:py-14">
      <div className="container px-4">{card}</div>
    </section>
  );
}
